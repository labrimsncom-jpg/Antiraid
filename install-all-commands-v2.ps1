param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$root = Get-Location
$commandsRoot = Join-Path $root "commands"

if (-not (Test-Path $commandsRoot)) {
    New-Item -ItemType Directory -Path $commandsRoot -Force | Out-Null
}

function Write-CommandFile {
    param(
        [string]$FileName,
        [string]$Name,
        [string]$Description,
        [string]$Category
    )

    $dir = Join-Path $commandsRoot $Category
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    $file = Join-Path $dir $FileName

    if ((Test-Path $file) -and (-not $Force)) {
        Write-Host "SKIP: $file" -ForegroundColor Yellow
        return
    }

    $content = @"
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("$Name")
    .setDescription("$Description"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/$Name")
      .setDescription("La commande **/$Name** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
"@

    Set-Content -Path $file -Value $content -Encoding UTF8
    Write-Host "CREATE: $file" -ForegroundColor Green
}

function Write-SubcommandFile {
    param(
        [string]$FileName,
        [string]$Name,
        [string]$Description,
        [string[]]$Subcommands,
        [string]$Category
    )

    $dir = Join-Path $commandsRoot $Category
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    $file = Join-Path $dir $FileName

    if ((Test-Path $file) -and (-not $Force)) {
        Write-Host "SKIP: $file" -ForegroundColor Yellow
        return
    }

    $builder = ""
    foreach ($sub in $Subcommands) {
        $builder += "    .addSubcommand(s => s.setName(`"$sub`").setDescription(`"Gestion de $sub`"))`r`n"
    }

    $content = @"
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("$Name")
    .setDescription("$Description")
$builder
  ,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand(false) || "default";

    const embed = new EmbedBuilder()
      .setTitle("/$Name")
      .setDescription("Sous-commande : **" + sub + "**")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
"@

    Set-Content -Path $file -Value $content -Encoding UTF8
    Write-Host "CREATE: $file" -ForegroundColor Green
}

$commands = @(
    @("absence-config","Declarer une absence ou configurer le systeme d'absences","admin"),
    @("automod","Configurer la moderation automatique","admin"),
    @("avantage-vip","Afficher les avantages VIP du bot et du serveur","general"),
    @("avis","Donner un avis ou configurer le systeme","community"),
    @("avis-staff","Donner un avis sur un membre du staff","community"),
    @("backup","Sauvegardes du serveur","admin"),
    @("botinfo","Informations sur le bot","general"),
    @("clear","Supprimer des messages","moderation"),
    @("config","Configuration du serveur","admin"),
    @("embed","Envoyer un embed dans un salon","admin"),
    @("fermer-ticket","Fermer le ticket de ce salon","ticket"),
    @("forcer-service","Forcer la fin de service d'un moderateur","admin"),
    @("formulaire","Gerer les formulaires de candidatures","admin"),
    @("help","Aide interactive - Toutes les commandes de Server Manager","general"),
    @("hierarchie-config","Ouvrir le panneau de configuration de l'effectif hierarchique","admin"),
    @("identite","Afficher votre carte d'identite staff ou configurer le systeme","admin"),
    @("info-config","Configuration des panneaux d'informations","admin"),
    @("invites","Voir qui a invite un membre","community"),
    @("journal","Configurer le journal automatique du serveur","admin"),
    @("lang","Choisir la langue du bot","admin"),
    @("logs","Activer ou configurer le systeme de logs","admin"),
    @("morpion","Jouer au morpion contre un autre membre","fun"),
    @("msg-recurrent","Configurer les messages recurrents du serveur","admin"),
    @("mute","Mettre en sourdine ou retirer la sourdine","moderation"),
    @("niveaux","Systeme de niveaux et XP","community"),
    @("nombre-infini-config","Configurer le jeu du comptage","fun"),
    @("perdu","Jouer au perdu","fun"),
    @("pfc","Pierre Feuille Ciseaux","fun"),
    @("poll","Creer un sondage interactif","utility"),
    @("profile-bot","Configurer le profil du bot sur ce serveur","admin"),
    @("quiz","Repondre a une question de culture generale","fun"),
    @("raid-config","Configurer le systeme anti-raid et anti-nuke","protection"),
    @("raid-lock","Verrouiller immediatement le serveur en cas de raid","protection"),
    @("raid-unlock","Deverrouiller le serveur","protection"),
    @("reglement","Gestion du reglement","admin"),
    @("role-humain","Ajouter ou retirer un role en masse","admin"),
    @("role-reaction","Gestion des panneaux de roles reactions","admin"),
    @("sanctions","Consulter les sanctions d'un membre","moderation"),
    @("say","Faire envoyer un message texte par le bot","admin"),
    @("serverbanner","Afficher la banniere du serveur","general"),
    @("servericon","Afficher la photo de profil du serveur","general"),
    @("serverinfo","Informations completes sur le serveur","general"),
    @("serveurs","Liste paginee des serveurs avec invitations","general"),
    @("setup-service","Configurer le systeme de prise de service","admin"),
    @("setup-tempvoice","Configurer les salons vocaux temporaires","admin"),
    @("slowmode","Definir le slowmode d'un salon","moderation"),
    @("soutien","Configurer les roles de soutien","community"),
    @("staff-bienvenue","Configurer la bienvenue automatique pour le staff","admin"),
    @("staff-depart","Configurer le depart automatique pour le staff","admin"),
    @("stats","Statistiques du serveur","general"),
    @("suggest","Soumettre une suggestion ou gerer le systeme","community"),
    @("sumall","Voir les heures de service","admin"),
    @("support","Lien vers le serveur de support","general"),
    @("support-vocal","Gerer le systeme de support vocal","ticket"),
    @("ticket","Ouvrir un ticket de support","ticket"),
    @("ticket-config","Configurer le systeme de tickets","ticket"),
    @("top","Classement XP du serveur","community"),
    @("topinvites","Classement des membres qui ont le plus invite","community"),
    @("tuto","Guide de configuration des commandes","general"),
    @("unban","Debannir un utilisateur","moderation"),
    @("unwarn","Retirer un avertissement","moderation"),
    @("userinfo","Informations detaillees sur un membre","general"),
    @("warn","Avertir un membre","moderation")
)

foreach ($c in $commands) {
    Write-CommandFile -FileName "$($c[0]).js" -Name $c[0] -Description $c[1] -Category $c[2]
}

Write-SubcommandFile -FileName "cmd-config.js" -Name "cmd-config" -Description "Gerer les commandes personnalisees" -Subcommands @("add","liste","prefix","supprimer") -Category "admin"
Write-SubcommandFile -FileName "giveaway.js" -Name "giveaway" -Description "Gerer les giveaways" -Subcommands @("creer","liste","terminer") -Category "community"
Write-SubcommandFile -FileName "stats-channels.js" -Name "stats-channels" -Description "Gerer les salons de statistiques" -Subcommands @("creer","liste","supprimer") -Category "admin"

Write-Host ""
Write-Host "Installation terminee." -ForegroundColor Cyan
Write-Host "Les fichiers existants ont ete conserves." -ForegroundColor Cyan
Write-Host "Pour remplacer un fichier existant, utiliser : .\install-all-commands-v2.ps1 -Force" -ForegroundColor Yellow
