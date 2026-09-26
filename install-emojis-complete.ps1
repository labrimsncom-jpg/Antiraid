$ErrorActionPreference = "Stop"

$root = Get-Location

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "     HOLY RP - INSTALLATION EMOJIS" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Dossiers
$commandsDir = Join-Path $root "commands\admin"
$emojiDir = Join-Path $root "assets\emojis"

New-Item -ItemType Directory -Force -Path $commandsDir | Out-Null
New-Item -ItemType Directory -Force -Path $emojiDir | Out-Null

# Commande /emojisetup
$emojiCommand = @'
const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const path = require("node:path");
const fs = require("node:fs");

const EMOJIS = [
  "iconLanguage",
  "iconPrefix",
  "iconPermissions",
  "iconLock",
  "iconRaid",
  "iconCaptcha",
  "iconAge",
  "iconAntispam",
  "iconHoneyPot",
  "iconSanctions",
  "iconLogs",
  "iconReports",
  "iconTransparency",
  "iconTag",
  "iconDM",
  "iconAuth",
  "iconSupport",
  "iconDocs",
  "iconChangelog",
  "iconCustomize"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("emojisetup")
    .setDescription("Installer les emojis Holy RP")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild.toString()
    ),

  async execute(interaction) {

    if (!interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageGuild
    )) {
      return interaction.reply({
        content: "❌ Tu dois avoir la permission **Gérer le serveur**.",
        ephemeral: true
      });
    }

    const me = interaction.guild.members.me;

    if (!me.permissions.has("ManageGuildExpressions")) {
      return interaction.reply({
        content:
          "❌ Le bot doit avoir la permission **Gérer les expressions**.",
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const emojiDir = path.join(
      process.cwd(),
      "assets",
      "emojis"
    );

    const results = [];

    for (const name of EMOJIS) {

      const file = path.join(
        emojiDir,
        `${name}.png`
      );

      if (!fs.existsSync(file)) {
        results.push(`⚠️ ${name} : image introuvable`);
        continue;
      }

      const existing = interaction.guild.emojis.cache.find(
        emoji => emoji.name === name
      );

      if (existing) {
        results.push(`ℹ️ ${name} : déjà présent`);
        continue;
      }

      try {

        const emoji = await interaction.guild.emojis.create({
          attachment: file,
          name
        });

        results.push(
          `✅ ${name} : <:${emoji.name}:${emoji.id}>`
        );

      } catch (error) {

        console.error(
          `Erreur création ${name}:`,
          error
        );

        results.push(
          `❌ ${name} : impossible à créer`
        );
      }
    }

    await interaction.editReply({
      content:
        "🎨 **Installation des emojis Holy RP terminée !**\n\n" +
        results.join("\n")
    });
  }
};
'@

$emojiFile = Join-Path $commandsDir "emojisetup.js"

Set-Content `
    -Path $emojiFile `
    -Value $emojiCommand `
    -Encoding UTF8

Write-Host "✅ commands/admin/emojisetup.js créé" -ForegroundColor Green

Write-Host ""
Write-Host "Les images doivent être placées ici :" -ForegroundColor Yellow
Write-Host $emojiDir -ForegroundColor White
Write-Host ""

$required = @(
    "iconLanguage.png",
    "iconPrefix.png",
    "iconPermissions.png",
    "iconLock.png",
    "iconRaid.png",
    "iconCaptcha.png",
    "iconAge.png",
    "iconAntispam.png",
    "iconHoneyPot.png",
    "iconSanctions.png",
    "iconLogs.png",
    "iconReports.png",
    "iconTransparency.png",
    "iconTag.png",
    "iconDM.png",
    "iconAuth.png",
    "iconSupport.png",
    "iconDocs.png",
    "iconChangelog.png",
    "iconCustomize.png"
)

foreach ($file in $required) {

    $full = Join-Path $emojiDir $file

    if (Test-Path $full) {
        Write-Host "✅ $file" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️ $file MANQUANT" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Installation terminée !" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ensuite :"
Write-Host "1. Mets les PNG dans assets\emojis"
Write-Host "2. Lance le bot"
Write-Host "3. Fais /emojisetup sur Discord"
Write-Host ""