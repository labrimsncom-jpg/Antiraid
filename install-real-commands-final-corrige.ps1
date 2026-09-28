# ============================================================
# INSTALL-REAL-COMMANDS-FINAL.PS1
# Version corrigee Railway
#
# Supprime uniquement les ANCIENS SCRIPTS D'INSTALLATION.
# Ne supprime PAS les commandes, events ou fonctionnalites du bot.
# ============================================================

$ErrorActionPreference = "Stop"

$Project = (Get-Location).Path

# Anciens scripts d'installation uniquement.
$OldInstallers = @(
    "install-real-commands.ps1",
    "install-real-commands-clean.ps1",
    "install-all-commands.ps1",
    "install-all-commands-v2.ps1"
)

foreach ($old in $OldInstallers) {
    $oldPath = Join-Path $Project $old
    if (Test-Path $oldPath) {
        Remove-Item $oldPath -Force
        Write-Host "[SUPPRIME] Ancien script : $old" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Installation des commandes + correction Railway ===" -ForegroundColor Cyan
Write-Host "Projet : $Project" -ForegroundColor DarkGray
Write-Host ""


$AdminDir = Join-Path $CommandsDir "admin"
$EventsDir = Join-Path $Project "events"
New-Item -ItemType Directory -Force -Path $AdminDir, $EventsDir | Out-Null

function Write-Utf8NoBom([string]$Path, [string]$Content) {
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $enc)
}

Write-Host "Installation des vraies commandes..." -ForegroundColor Cyan

$manager = @'
const {
  SlashCommandBuilder, PermissionFlagsBits: P, ChannelType, EmbedBuilder,
  AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  MessageFlags
} = require("discord.js");
const db = require("../../utils/db");
const { COLORS, ok, fail, info } = require("../../utils/embeds");
const { checkHierarchy, reasonOf, dm, logAction } = require("../../utils/moderation");
const { openTicket, closeTicket } = require("../../utils/tickets");

const admin = (name, description, perm = P.ManageGuild) =>
  new SlashCommandBuilder().setName(name).setDescription(description).setDefaultMemberPermissions(perm);
const need = (i, perm) => {
  if (!i.memberPermissions?.has(perm)) {
    i.reply({ embeds: [fail("Tu n'as pas la permission requise.")], flags: MessageFlags.Ephemeral }).catch(() => {});
    return false;
  }
  return true;
};
const setting = (i, key, value) => db.setSetting(i.guild.id, key, value);
const get = (i, key, fallback) => db.getSettings(i.guild.id)[key] ?? fallback;
const textChannel = o => o.addChannelTypes(ChannelType.GuildText);
const roleOpt = (o, name="role") => o.setName(name).setDescription("Role").setRequired(true);
const userOpt = (o, name="membre", required=true) => o.setName(name).setDescription("Membre").setRequired(required);

const commands = [];

// /absence-config
commands.push({
  data: admin("absence-config", "Declarer ou gerer les absences" )
    .addSubcommand(s => s.setName("declarer").setDescription("Declarer une absence").addStringOption(o => o.setName("raison").setDescription("Raison").setRequired(true)).addStringOption(o => o.setName("retour").setDescription("Date ou information de retour").setRequired(false)))
    .addSubcommand(s => s.setName("retirer").setDescription("Retirer votre absence"))
    .addSubcommand(s => s.setName("liste").setDescription("Voir les absences")),
  async execute(i) {
    const sub=i.options.getSubcommand(); const abs=get(i,"absences",{});
    if(sub==="declarer"){abs[i.user.id]={reason:i.options.getString("raison"),returnInfo:i.options.getString("retour")||"Non precise",date:Date.now()};setting(i,"absences",abs);return i.reply({embeds:[ok("Ton absence est enregistree.")],flags:MessageFlags.Ephemeral});}
    if(sub==="retirer"){delete abs[i.user.id];setting(i,"absences",abs);return i.reply({embeds:[ok("Ton absence a ete retiree.")],flags:MessageFlags.Ephemeral});}
    const list=Object.entries(abs).map(([id,x])=>`<@${id}> - ${x.reason} - retour: ${x.returnInfo}`).join("\n")||"Aucune absence.";
    return i.reply({embeds:[info("Absences").setDescription(list)]});
  }
});

// /avis
commands.push({
  data: new SlashCommandBuilder().setName("avis").setDescription("Donner un avis ou configurer le systeme")
    .addSubcommand(s=>s.setName("donner").setDescription("Donner un avis").addIntegerOption(o=>o.setName("note").setDescription("Note sur 5").setMinValue(1).setMaxValue(5).setRequired(true)).addStringOption(o=>o.setName("texte").setDescription("Commentaire").setRequired(true)))
    .addSubcommand(s=>s.setName("config").setDescription("Configurer le salon des avis").addChannelOption(o=>textChannel(o.setName("salon").setDescription("Salon").setRequired(true)))),
  async execute(i){
    const sub=i.options.getSubcommand();
    if(!need(i,P.ManageGuild) && sub==="config")return;
    if(sub==="config"){const c=i.options.getChannel("salon");setting(i,"avisChannelId",c.id);return i.reply({embeds:[ok(`Les avis seront publies dans ${c}.`)],flags:MessageFlags.Ephemeral});}
    const note=i.options.getInteger("note"),texte=i.options.getString("texte");const e=info("Nouvel avis").setDescription(`**${note}/5**\n${texte}`).setAuthor({name:i.user.tag,iconURL:i.user.displayAvatarURL()});const c=i.guild.channels.cache.get(get(i,"avisChannelId",null));if(c?.isTextBased())await c.send({embeds:[e]});else await i.channel.send({embeds:[e]});return i.reply({embeds:[ok("Avis publie.")],flags:MessageFlags.Ephemeral});
  }
});

// /avis-staff
commands.push({
  data: admin("avis-staff", "Donner un avis sur un membre du staff", P.ModerateMembers).addUserOption(o=>userOpt(o)).addIntegerOption(o=>o.setName("note").setDescription("Note sur 5").setMinValue(1).setMaxValue(5).setRequired(true)).addStringOption(o=>o.setName("texte").setDescription("Commentaire").setRequired(true)),
  async execute(i){if(!need(i,P.ModerateMembers))return;const u=i.options.getUser("membre"),list=get(i,"staffReviews",[]);list.push({from:i.user.id,to:u.id,note:i.options.getInteger("note"),text:i.options.getString("texte"),date:Date.now()});setting(i,"staffReviews",list);return i.reply({embeds:[ok(`Avis enregistre pour ${u}.`)],flags:MessageFlags.Ephemeral});}
});

// /backup
commands.push({
  data: admin("backup", "Sauvegarder la configuration du serveur"),
  async execute(i){if(!need(i,P.ManageGuild))return;const data={guild:{id:i.guild.id,name:i.guild.name},settings:db.getSettings(i.guild.id),roles:i.guild.roles.cache.filter(r=>!r.managed).map(r=>({id:r.id,name:r.name,position:r.position})),channels:i.guild.channels.cache.map(c=>({id:c.id,name:c.name,type:c.type,parent:c.parentId}))};const file=new AttachmentBuilder(Buffer.from(JSON.stringify(data,null,2),"utf8"),{name:`backup-${i.guild.id}.json`});return i.reply({content:"Sauvegarde creee.",files:[file],flags:MessageFlags.Ephemeral});}
});

// /config
commands.push({
  data: admin("config", "Afficher la configuration du serveur"),
  async execute(i){if(!need(i,P.ManageGuild))return;const s=db.getSettings(i.guild.id);const e=info("Configuration").addFields(Object.entries(s).slice(0,20).map(([k,v])=>({name:k,value:typeof v==="object"?JSON.stringify(v).slice(0,1000):String(v??"Non defini"),inline:false})));return i.reply({embeds:[e],flags:MessageFlags.Ephemeral});}
});

// /embed
commands.push({
  data: admin("embed", "Envoyer un embed dans un salon").addChannelOption(o=>textChannel(o.setName("salon").setDescription("Salon").setRequired(true))).addStringOption(o=>o.setName("titre").setDescription("Titre").setRequired(true)).addStringOption(o=>o.setName("texte").setDescription("Description").setRequired(true)),
  async execute(i){if(!need(i,P.ManageMessages))return;const c=i.options.getChannel("salon"),e=new EmbedBuilder().setColor(COLORS.primary).setTitle(i.options.getString("titre")).setDescription(i.options.getString("texte")).setTimestamp();await c.send({embeds:[e]});return i.reply({embeds:[ok(`Embed envoye dans ${c}.`)],flags:MessageFlags.Ephemeral});}
});

// /fermer-ticket
commands.push({data:new SlashCommandBuilder().setName("fermer-ticket").setDescription("Fermer le ticket de ce salon"),async execute(i){return closeTicket(i);}});

// /forcer-service
commands.push({
 data:admin("forcer-service","Forcer la fin de service d'un moderateur").addUserOption(o=>userOpt(o)),
 async execute(i){if(!need(i,P.ManageGuild))return;const u=i.options.getUser("membre"),active=get(i,"serviceActive",{}),hours=get(i,"serviceHours",{});if(active[u.id]){hours[u.id]=(hours[u.id]||0)+(Date.now()-active[u.id]);delete active[u.id];setting(i,"serviceHours",hours);setting(i,"serviceActive",active);}return i.reply({embeds:[ok(`Service termine pour ${u}.`)],flags:MessageFlags.Ephemeral});}
});

// /formulaire
commands.push({
 data:admin("formulaire","Gerer les formulaires de candidatures").addSubcommand(s=>s.setName("creer").setDescription("Creer un formulaire").addStringOption(o=>o.setName("nom").setDescription("Nom").setRequired(true)).addChannelOption(o=>textChannel(o.setName("salon").setDescription("Salon des candidatures").setRequired(true))).addStringOption(o=>o.setName("questions").setDescription("Questions separees par | ").setRequired(true))).addSubcommand(s=>s.setName("liste").setDescription("Lister les formulaires")),
 async execute(i){if(!need(i,P.ManageGuild))return;const s=get(i,"forms",[]),sub=i.options.getSubcommand();if(sub==="liste")return i.reply({embeds:[info("Formulaires").setDescription(s.map((x,n)=>`**${n+1}.** ${x.name} -> <#${x.channelId}>`).join("\n")||"Aucun.")],flags:MessageFlags.Ephemeral});if(s.length>=8)return i.reply({embeds:[fail("Maximum de 8 formulaires.")],flags:MessageFlags.Ephemeral});s.push({name:i.options.getString("nom"),channelId:i.options.getChannel("salon").id,questions:i.options.getString("questions").split("|").map(x=>x.trim()).filter(Boolean)});setting(i,"forms",s);return i.reply({embeds:[ok("Formulaire configure. Publie un panneau avec /info-config si besoin.")],flags:MessageFlags.Ephemeral});}
});

// /hierarchie-config
commands.push({data:admin("hierarchie-config","Configurer le role hierarchique",P.ManageRoles).addRoleOption(o=>roleOpt(o)),async execute(i){if(!need(i,P.ManageRoles))return;setting(i,"hierarchyRoleId",i.options.getRole("role").id);return i.reply({embeds:[ok("Role hierarchique configure.")],flags:MessageFlags.Ephemeral});}});

// /identite
commands.push({data:new SlashCommandBuilder().setName("identite").setDescription("Afficher votre carte d'identite staff").addUserOption(o=>userOpt(o,"membre",false)),async execute(i){const u=i.options.getUser("membre")||i.user,m=await i.guild.members.fetch(u.id);const e=info("Carte d'identite").setThumbnail(u.displayAvatarURL()).addFields({name:"Nom",value:u.tag},{name:"ID",value:u.id},{name:"Roles",value:m.roles.cache.filter(r=>r.id!==i.guild.id).map(r=>r.toString()).join(", ")||"Aucun"});return i.reply({embeds:[e]});}});

// /info-config
commands.push({data:admin("info-config","Publier un panneau d'information").addStringOption(o=>o.setName("titre").setDescription("Titre").setRequired(true)).addStringOption(o=>o.setName("texte").setDescription("Texte").setRequired(true)).addChannelOption(o=>textChannel(o.setName("salon").setDescription("Salon").setRequired(true))),async execute(i){if(!need(i,P.ManageGuild))return;const c=i.options.getChannel("salon");await c.send({embeds:[new EmbedBuilder().setColor(COLORS.primary).setTitle(i.options.getString("titre")).setDescription(i.options.getString("texte")).setTimestamp()]});return i.reply({embeds:[ok("Panneau publie.")],flags:MessageFlags.Ephemeral});}});

// /invites
commands.push({data:new SlashCommandBuilder().setName("invites").setDescription("Voir les invitations d'un membre").addUserOption(o=>userOpt(o,"membre",false)),async execute(i){const u=i.options.getUser("membre")||i.user;const invites=await i.guild.invites.fetch().catch(()=>null);if(!invites)return i.reply({embeds:[fail("Je ne peux pas lire les invitations.")]});const made=invites.filter(x=>x.inviter?.id===u.id);return i.reply({embeds:[info(`Invitations de ${u.tag}`).setDescription(made.size?made.map(x=>`\`${x.code}\` : **${x.uses||0}** utilisations`).join("\n"):"Aucune invitation visible.")]});}});

// /journal and /logs
commands.push({data:admin("journal","Configurer le journal automatique").addChannelOption(o=>textChannel(o.setName("salon").setDescription("Salon des logs").setRequired(true))),async execute(i){if(!need(i,P.ManageGuild))return;setting(i,"logChannelId",i.options.getChannel("salon").id);return i.reply({embeds:[ok("Journal configure.")],flags:MessageFlags.Ephemeral});}});
commands.push({data:admin("logs","Configurer le systeme de logs").addSubcommand(s=>s.setName("activer").setDescription("Activer les logs").addChannelOption(o=>textChannel(o.setName("salon").setDescription("Salon").setRequired(true)))).addSubcommand(s=>s.setName("desactiver").setDescription("Desactiver les logs")),async execute(i){if(!need(i,P.ManageGuild))return;const sub=i.options.getSubcommand();setting(i,"logChannelId",sub==="activer"?i.options.getChannel("salon").id:null);return i.reply({embeds:[ok(sub==="activer"?"Logs actives.":"Logs desactivees.")],flags:MessageFlags.Ephemeral});}});

// /lang
commands.push({data:admin("lang","Choisir la langue du bot").addStringOption(o=>o.setName("langue").setDescription("Langue").setRequired(true).addChoices({name:"Francais",value:"fr"},{name:"English",value:"en"})),async execute(i){if(!need(i,P.ManageGuild))return;setting(i,"language",i.options.getString("langue"));return i.reply({embeds:[ok("Langue enregistree. Les commandes restent en francais pour le moment.")],flags:MessageFlags.Ephemeral});}});

// /msg-recurrent
commands.push({data:admin("msg-recurrent","Configurer les messages recurrents").addSubcommand(s=>s.setName("configurer").setDescription("Configurer").addChannelOption(o=>textChannel(o.setName("salon").setDescription("Salon").setRequired(true))).addIntegerOption(o=>o.setName("minutes").setDescription("Intervalle en minutes").setMinValue(1).setRequired(true)).addStringOption(o=>o.setName("message").setDescription("Message").setRequired(true))).addSubcommand(s=>s.setName("desactiver").setDescription("Desactiver")),async execute(i){if(!need(i,P.ManageGuild))return;const sub=i.options.getSubcommand();if(sub==="desactiver")setting(i,"recurringMessage",null);else setting(i,"recurringMessage",{channelId:i.options.getChannel("salon").id,minutes:i.options.getInteger("minutes"),text:i.options.getString("message")});return i.reply({embeds:[ok("Configuration du message recurrente mise a jour.")],flags:MessageFlags.Ephemeral});}});

// /niveaux and /top
commands.push({data:admin("niveaux","Configurer le systeme de niveaux").addBooleanOption(o=>o.setName("actif").setDescription("Activer XP").setRequired(true)),async execute(i){if(!need(i,P.ManageGuild))return;setting(i,"levelsEnabled",i.options.getBoolean("actif"));return i.reply({embeds:[ok("Systeme de niveaux mis a jour.")],flags:MessageFlags.Ephemeral});}});
commands.push({data:new SlashCommandBuilder().setName("top").setDescription("Classement XP du serveur"),async execute(i){const xp=get(i,"xp",{});const list=Object.entries(xp).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([id,v],n)=>`**${n+1}.** <@${id}> - **${v} XP**`).join("\n")||"Aucun XP.";return i.reply({embeds:[info("Top XP").setDescription(list)]});}});

// /nombre-infini-config and /nombre-infini
commands.push({data:admin("nombre-infini-config","Configurer le jeu du comptage").addIntegerOption(o=>o.setName("score").setDescription("Score de depart").setMinValue(0).setRequired(true)),async execute(i){if(!need(i,P.ManageGuild))return;setting(i,"countNumber",i.options.getInteger("score"));return i.reply({embeds:[ok("Score configure.")],flags:MessageFlags.Ephemeral});}});
commands.push({data:new SlashCommandBuilder().setName("nombre-infini").setDescription("Voir le score du comptage"),async execute(i){return i.reply({embeds:[info("Route de l'infini").setDescription(`Score actuel : **${get(i,"countNumber",0)}**`)]});}});

// /perdu / /quiz / /pfc
commands.push({data:new SlashCommandBuilder().setName("perdu").setDescription("Jouer au perdu"),async execute(i){const n=Math.floor(Math.random()*100)+1;return i.reply({embeds:[info("Perdu").setDescription(`Nombre tire : **${n}**.`)]});}});
commands.push({data:new SlashCommandBuilder().setName("quiz").setDescription("Repondre a une question de culture generale"),async execute(i){const q=[["Capitale de la France ?","Paris"],["Planete rouge ?","Mars"],["2 + 2 ?","4"],["Combien de continents ?","7"]][Math.floor(Math.random()*4)];return i.reply({embeds:[info("Quiz").setDescription(`**Question :** ${q[0]}\nReponse : **${q[1]}**`)]});}});
commands.push({data:new SlashCommandBuilder().setName("pfc").setDescription("Pierre-Feuille-Ciseaux").addStringOption(o=>o.setName("choix").setDescription("Ton choix").setRequired(true).addChoices({name:"Pierre",value:"pierre"},{name:"Feuille",value:"feuille"},{name:"Ciseaux",value:"ciseaux"})),async execute(i){const a=i.options.getString("choix"),b=["pierre","feuille","ciseaux"][Math.floor(Math.random()*3)];const win=a===b?"Egalite":((a==="pierre"&&b==="ciseaux")||(a==="feuille"&&b==="pierre")||(a==="ciseaux"&&b==="feuille")?"Victoire":"Defaite");return i.reply({embeds:[info("Pierre-Feuille-Ciseaux").setDescription(`Toi: **${a}**\nBot: **${b}**\n\n**${win}**`)]});}});

// /profile-bot
commands.push({data:admin("profile-bot","Configurer le profil du bot sur ce serveur").addStringOption(o=>o.setName("texte").setDescription("Texte du profil").setRequired(true)),async execute(i){if(!need(i,P.ManageGuild))return;setting(i,"botProfile",i.options.getString("texte"));return i.reply({embeds:[ok("Profil local enregistre.")],flags:MessageFlags.Ephemeral});}});

// /raid-config / lock / unlock
commands.push({data:admin("raid-config","Configurer le systeme anti-raid").addBooleanOption(o=>o.setName("actif").setDescription("Activer le mode anti-raid").setRequired(true)),async execute(i){if(!need(i,P.ManageGuild))return;setting(i,"raidAlertEnabled",i.options.getBoolean("actif"));return i.reply({embeds:[ok("Configuration anti-raid mise a jour.")],flags:MessageFlags.Ephemeral});}});
commands.push({data:admin("raid-lock","Verrouiller le serveur en cas de raid",P.ManageChannels),async execute(i){if(!need(i,P.ManageChannels))return;for(const c of i.guild.channels.cache.values()){if(c.isTextBased())await c.permissionOverwrites.edit(i.guild.roles.everyone,{SendMessages:false}).catch(()=>{});}setting(i,"raidLocked",true);return i.reply({embeds:[ok("Serveur verrouille.")]});}});
commands.push({data:admin("raid-unlock","Deverrouiller le serveur",P.ManageChannels),async execute(i){if(!need(i,P.ManageChannels))return;for(const c of i.guild.channels.cache.values()){if(c.isTextBased())await c.permissionOverwrites.edit(i.guild.roles.everyone,{SendMessages:null}).catch(()=>{});}setting(i,"raidLocked",false);return i.reply({embeds:[ok("Serveur deverrouille.")]});}});

// /reglement
commands.push({data:admin("reglement","Publier le reglement").addChannelOption(o=>textChannel(o.setName("salon").setDescription("Salon").setRequired(true))).addStringOption(o=>o.setName("texte").setDescription("Reglement").setRequired(true)),async execute(i){if(!need(i,P.ManageGuild))return;await i.options.getChannel("salon").send({embeds:[info("Reglement").setDescription(i.options.getString("texte"))]});return i.reply({embeds:[ok("Reglement publie.")],flags:MessageFlags.Ephemeral});}});

// /role-humain
commands.push({data:admin("role-humain","Ajouter ou retirer un role en masse",P.ManageRoles).addStringOption(o=>o.setName("action").setDescription("Action").setRequired(true).addChoices({name:"Ajouter",value:"ajouter"},{name:"Retirer",value:"retirer"})).addRoleOption(o=>roleOpt(o)).addRoleOption(o=>o.setName("role_cible").setDescription("Role a traiter").setRequired(false)),async execute(i){if(!need(i,P.ManageRoles))return;const role=i.options.getRole("role"),action=i.options.getString("action"),members=i.guild.members.cache.filter(m=>!m.user.bot&&(i.options.getRole("role_cible")?m.roles.cache.has(i.options.getRole("role_cible").id):true));for(const m of members.values())await (action==="ajouter"?m.roles.add(role):m.roles.remove(role)).catch(()=>{});return i.reply({embeds:[ok(`${action} effectue sur ${members.size} membre(s).`)],flags:MessageFlags.Ephemeral});}});

// /role-reaction
commands.push({data:admin("role-reaction","Publier un bouton de role",P.ManageRoles).addRoleOption(o=>roleOpt(o)).addChannelOption(o=>textChannel(o.setName("salon").setDescription("Salon").setRequired(true))),async execute(i){if(!need(i,P.ManageRoles))return;const role=i.options.getRole("role"),c=i.options.getChannel("salon");const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`role_toggle:${role.id}`).setLabel(role.name.slice(0,80)).setStyle(ButtonStyle.Primary));await c.send({content:`Clique pour ajouter/retirer ${role}.`,components:[row]});return i.reply({embeds:[ok("Panneau de role publie.")],flags:MessageFlags.Ephemeral});}});

// /say
commands.push({data:admin("say","Faire envoyer un message texte par le bot").addChannelOption(o=>textChannel(o.setName("salon").setDescription("Salon").setRequired(true))).addStringOption(o=>o.setName("message").setDescription("Message").setRequired(true)),async execute(i){if(!need(i,P.ManageMessages))return;const c=i.options.getChannel("salon");await c.send({content:i.options.getString("message")});return i.reply({embeds:[ok("Message envoye.")],flags:MessageFlags.Ephemeral});}});

// /serverbanner / servericon / serverinfo / serveurs
commands.push({data:new SlashCommandBuilder().setName("serverbanner").setDescription("Afficher la banniere du serveur"),async execute(i){const url=i.guild.bannerURL({size:2048,dynamic:true});return i.reply({embeds:[url?new EmbedBuilder().setColor(COLORS.primary).setTitle(i.guild.name).setImage(url):info("Banniere").setDescription("Aucune banniere configuree.")]});}});
commands.push({data:new SlashCommandBuilder().setName("servericon").setDescription("Afficher la photo de profil du serveur"),async execute(i){const url=i.guild.iconURL({size:2048,dynamic:true});return i.reply({embeds:[url?new EmbedBuilder().setColor(COLORS.primary).setTitle(i.guild.name).setImage(url):info("Icone").setDescription("Aucune icone configuree.")]});}});
commands.push({data:new SlashCommandBuilder().setName("serveurs").setDescription("Liste des serveurs du bot"),async execute(i){const list=[...i.client.guilds.cache.values()].slice(0,25).map(g=>`**${g.name}** - ${g.memberCount} membres`).join("\n")||"Aucun serveur.";return i.reply({embeds:[info(`Serveurs (${i.client.guilds.cache.size})`).setDescription(list)]});}});

// /stats / topinvites
commands.push({data:new SlashCommandBuilder().setName("stats").setDescription("Statistiques du serveur"),async execute(i){const g=i.guild;return i.reply({embeds:[info("Statistiques").addFields({name:"Membres",value:String(g.memberCount),inline:true},{name:"Bots",value:String(g.members.cache.filter(m=>m.user.bot).size),inline:true},{name:"Salons",value:String(g.channels.cache.size),inline:true},{name:"Roles",value:String(g.roles.cache.size),inline:true})]});}});
commands.push({data:new SlashCommandBuilder().setName("topinvites").setDescription("Classement des invitations"),async execute(i){const inv=await i.guild.invites.fetch().catch(()=>null);if(!inv)return i.reply({embeds:[fail("Impossible de lire les invitations.")]});const map={};for(const x of inv.values())if(x.inviter)map[x.inviter.id]=(map[x.inviter.id]||0)+(x.uses||0);const list=Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([id,n],k)=>`**${k+1}.** <@${id}> - ${n}`).join("\n")||"Aucune invitation.";return i.reply({embeds:[info("Top invitations").setDescription(list)]});}});

// /setup-service / sumall
commands.push({data:admin("setup-service","Configurer la prise de service").addRoleOption(o=>roleOpt(o)).addChannelOption(o=>textChannel(o.setName("salon").setDescription("Salon du service").setRequired(false))),async execute(i){if(!need(i,P.ManageGuild))return;setting(i,"serviceRoleId",i.options.getRole("role").id);setting(i,"serviceChannelId",i.options.getChannel("salon")?.id||null);return i.reply({embeds:[ok("Prise de service configuree.")],flags:MessageFlags.Ephemeral});}});
commands.push({data:new SlashCommandBuilder().setName("sumall").setDescription("Voir les heures de service").addUserOption(o=>userOpt(o,"membre",false)),async execute(i){const u=i.options.getUser("membre");const h=get(i,"serviceHours",{});if(u)return i.reply({embeds:[info("Service").setDescription(`${u}: **${((h[u.id]||0)/3600000).toFixed(2)} h**`)]});const list=Object.entries(h).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([id,v])=>`<@${id}> - **${(v/3600000).toFixed(2)} h**`).join("\n")||"Aucune heure.";return i.reply({embeds:[info("Heures de service").setDescription(list)]});}});

// /soutien / support / support-vocal
commands.push({data:admin("soutien","Configurer le role de soutien").addRoleOption(o=>roleOpt(o)),async execute(i){if(!need(i,P.ManageGuild))return;setting(i,"supportRoleId",i.options.getRole("role").id);return i.reply({embeds:[ok("Role de soutien configure.")],flags:MessageFlags.Ephemeral});}});
commands.push({data:new SlashCommandBuilder().setName("support").setDescription("Lien vers le serveur de support officiel"),async execute(i){return i.reply({embeds:[info("Support").setDescription("Configure le lien avec /profile-bot ou ajoute le lien dans la configuration du bot.")]});}});
commands.push({data:admin("support-vocal","Configurer le support vocal").addChannelOption(o=>o.setName("salon").setDescription("Salon vocal").addChannelTypes(ChannelType.GuildVoice).setRequired(true)),async execute(i){if(!need(i,P.ManageGuild))return;setting(i,"supportVoiceChannelId",i.options.getChannel("salon").id);return i.reply({embeds:[ok("Support vocal configure.")],flags:MessageFlags.Ephemeral});}});

// /staff-bienvenue / staff-depart
commands.push({data:admin("staff-bienvenue","Configurer la bienvenue staff").addChannelOption(o=>textChannel(o.setName("salon").setDescription("Salon").setRequired(true))).addRoleOption(o=>roleOpt(o,"role")),async execute(i){if(!need(i,P.ManageGuild))return;setting(i,"staffWelcomeChannelId",i.options.getChannel("salon").id);setting(i,"hierarchyRoleId",i.options.getRole("role").id);return i.reply({embeds:[ok("Bienvenue staff configuree.")],flags:MessageFlags.Ephemeral});}});
commands.push({data:admin("staff-depart","Configurer le depart staff").addChannelOption(o=>textChannel(o.setName("salon").setDescription("Salon").setRequired(true))),async execute(i){if(!need(i,P.ManageGuild))return;setting(i,"staffLeaveChannelId",i.options.getChannel("salon").id);return i.reply({embeds:[ok("Depart staff configure.")],flags:MessageFlags.Ephemeral});}});

// /setup-tempvoice
commands.push({data:admin("setup-tempvoice","Configurer les salons vocaux temporaires",P.ManageChannels).addStringOption(o=>o.setName("prefixe").setDescription("Prefixe des salons").setRequired(true)),async execute(i){if(!need(i,P.ManageChannels))return;const prefix=i.options.getString("prefixe").slice(0,20),cat=await i.guild.channels.create({name:"TEMP VOICE",type:ChannelType.GuildCategory}),lobby=await i.guild.channels.create({name:`${prefix} creer`,type:ChannelType.GuildVoice,parent:cat.id});setting(i,"tempVoice",{categoryId:cat.id,lobbyId:lobby.id,prefix});return i.reply({embeds:[ok(`Salon d'attente cree : ${lobby}.`)],flags:MessageFlags.Ephemeral});}});

// /ticket / ticket-config
commands.push({data:new SlashCommandBuilder().setName("ticket").setDescription("Ouvrir un ticket de support"),async execute(i){return openTicket(i);}});
commands.push({data:admin("ticket-config","Configurer le systeme de tickets").addChannelOption(o=>textChannel(o.setName("salon").setDescription("Salon du panneau").setRequired(true))).addRoleOption(o=>o.setName("role_support").setDescription("Role support").setRequired(false)).addChannelOption(o=>o.setName("categorie").setDescription("Categorie").addChannelTypes(ChannelType.GuildCategory).setRequired(false)),async execute(i){if(!need(i,P.ManageGuild))return;const c=i.options.getChannel("salon"),r=i.options.getRole("role_support"),cat=i.options.getChannel("categorie");setting(i,"ticketRoleId",r?.id||null);setting(i,"ticketCategoryId",cat?.id||null);const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("ticket_open").setLabel("Ouvrir un ticket").setStyle(ButtonStyle.Primary));await c.send({embeds:[info("Support").setDescription("Clique sur le bouton pour ouvrir un ticket prive.")],components:[row]});return i.reply({embeds:[ok("Panneau ticket configure.")],flags:MessageFlags.Ephemeral});}});

// /unwarn / sanctions / timeout
commands.push({data:admin("unwarn","Retirer un avertissement",P.ModerateMembers).addUserOption(o=>userOpt(o)).addStringOption(o=>o.setName("id").setDescription("ID de l'avertissement").setRequired(true)),async execute(i){if(!need(i,P.ModerateMembers))return;const u=i.options.getUser("membre"),id=i.options.getString("id"),old=db.getWarnings(i.guild.id,u.id),left=old.filter(w=>String(w.id)!==String(id));if(left.length===old.length)return i.reply({embeds:[fail("Avertissement introuvable.")],flags:MessageFlags.Ephemeral});db.clearWarnings(i.guild.id,u.id);for(const w of left)db.addWarning(i.guild.id,u.id,w);return i.reply({embeds:[ok("Avertissement retire.")],flags:MessageFlags.Ephemeral});}});
commands.push({data:new SlashCommandBuilder().setName("sanctions").setDescription("Consulter les sanctions d'un membre").addUserOption(o=>userOpt(o)),async execute(i){const u=i.options.getUser("membre"),w=db.getWarnings(i.guild.id,u.id);return i.reply({embeds:[info(`Sanctions - ${u.tag}`).setDescription(w.length?w.map(x=>`**#${x.id}** - ${x.reason||"Sans raison"}`).join("\n"):"Aucune sanction enregistree.")]});}});
commands.push({data:admin("timeout","Mettre un membre en timeout",P.ModerateMembers).addUserOption(o=>userOpt(o)).addIntegerOption(o=>o.setName("minutes").setDescription("Duree en minutes").setMinValue(1).setMaxValue(40320).setRequired(true)).addStringOption(o=>o.setName("raison").setDescription("Raison").setRequired(false)),async execute(i){if(!need(i,P.ModerateMembers))return;const m=await i.guild.members.fetch(i.options.getUser("membre").id).catch(()=>null);if(!m)return i.reply({embeds:[fail("Membre introuvable.")],flags:MessageFlags.Ephemeral});const err=checkHierarchy(i,m);if(err)return i.reply({embeds:[fail(err)],flags:MessageFlags.Ephemeral});const reason=i.options.getString("raison")||"Aucune raison";await m.timeout(i.options.getInteger("minutes")*60000,reason);await dm(m.user,`Tu as ete mis en timeout sur ${i.guild.name}. Raison: ${reason}`);await logAction(i,{action:"Timeout",target:m.user,reason});return i.reply({embeds:[ok(`${m} est en timeout.`)]});}});

// /unban already exists; /botinfo
commands.push({data:new SlashCommandBuilder().setName("botinfo").setDescription("Informations sur le bot"),async execute(i){return i.reply({embeds:[info("Server Manager").setThumbnail(i.client.user.displayAvatarURL()).addFields({name:"Serveurs",value:String(i.client.guilds.cache.size),inline:true},{name:"Commandes",value:String(i.client.commands.size),inline:true},{name:"Uptime",value:`${Math.floor(i.client.uptime/3600000)}h`,inline:true})]});}});

// /tuto
commands.push({data:new SlashCommandBuilder().setName("tuto").setDescription("Guide de configuration"),async execute(i){return i.reply({embeds:[info("Guide").setDescription("Commence par /setup puis configure /logs, /ticket-config, /raid-config, /niveaux et /setup-tempvoice.")]});}});

// /avantage-vip
commands.push({data:new SlashCommandBuilder().setName("avantage-vip").setDescription("Afficher les avantages VIP"),async execute(i){return i.reply({embeds:[info("Avantages VIP").setDescription("Les avantages VIP doivent etre definis par l'administrateur du serveur.")]});}});

// /cmd-config
commands.push({data:admin("cmd-config","Gerer les commandes personnalisees").addSubcommand(s=>s.setName("add").setDescription("Creer une commande").addStringOption(o=>o.setName("nom").setDescription("Nom").setRequired(true)).addStringOption(o=>o.setName("reponse").setDescription("Reponse").setRequired(true))).addSubcommand(s=>s.setName("liste").setDescription("Lister les commandes")).addSubcommand(s=>s.setName("supprimer").setDescription("Supprimer une commande").addStringOption(o=>o.setName("nom").setDescription("Nom").setRequired(true))).addSubcommand(s=>s.setName("prefix").setDescription("Definir le prefixe").addStringOption(o=>o.setName("prefixe").setDescription("Prefixe").setRequired(true))),async execute(i){if(!need(i,P.ManageGuild))return;const sub=i.options.getSubcommand(),cc=get(i,"customCommands",{});if(sub==="add"){const n=i.options.getString("nom").toLowerCase().replace(/[^a-z0-9_-]/g,"");if(!n)return i.reply({embeds:[fail("Nom invalide.")],flags:MessageFlags.Ephemeral});cc[n]=i.options.getString("reponse");setting(i,"customCommands",cc);return i.reply({embeds:[ok(`Commande ${n} creee.`)],flags:MessageFlags.Ephemeral});}if(sub==="supprimer"){delete cc[i.options.getString("nom").toLowerCase()];setting(i,"customCommands",cc);return i.reply({embeds:[ok("Commande supprimee.")],flags:MessageFlags.Ephemeral});}if(sub==="prefix"){setting(i,"customPrefix",i.options.getString("prefixe"));return i.reply({embeds:[ok("Prefixe modifie.")],flags:MessageFlags.Ephemeral});}return i.reply({embeds:[info("Commandes personnalisees").setDescription(Object.keys(cc).map(x=>`\`${x}\``).join(", ")||"Aucune.")],flags:MessageFlags.Ephemeral});}});

// /stats-channels
commands.push({data:admin("stats-channels","Gerer les salons de statistiques").addSubcommand(s=>s.setName("creer").setDescription("Creer un salon statistique").addStringOption(o=>o.setName("type").setDescription("Type").setRequired(true).addChoices({name:"Membres",value:"members"},{name:"Bots",value:"bots"},{name:"Salons",value:"channels"}))).addSubcommand(s=>s.setName("liste").setDescription("Lister les salons")).addSubcommand(s=>s.setName("supprimer").setDescription("Supprimer un salon").addChannelOption(o=>o.setName("salon").setDescription("Salon").setRequired(true))),async execute(i){if(!need(i,P.ManageChannels))return;const s=db.getSettings(i.guild.id);s.statsChannels??=[];const sub=i.options.getSubcommand();if(sub==="liste")return i.reply({embeds:[info("Salons stats").setDescription(s.statsChannels.map(x=>`<#${x.id}> - ${x.type}`).join("\n")||"Aucun.")],flags:MessageFlags.Ephemeral});if(sub==="supprimer"){const c=i.options.getChannel("salon");s.statsChannels=s.statsChannels.filter(x=>x.id!==c.id);db.setSetting(i.guild.id,"statsChannels",s.statsChannels);await c.delete().catch(()=>{});return i.reply({embeds:[ok("Salon supprime.")],flags:MessageFlags.Ephemeral});}const type=i.options.getString("type"),names={members:`membres-${i.guild.memberCount}`,bots:`bots-${i.guild.members.cache.filter(m=>m.user.bot).size}`,channels:`salons-${i.guild.channels.cache.size}`};const c=await i.guild.channels.create({name:names[type],type:ChannelType.GuildVoice});s.statsChannels.push({id:c.id,type});db.setSetting(i.guild.id,"statsChannels",s.statsChannels);return i.reply({embeds:[ok(`Salon cree : ${c}`)],flags:MessageFlags.Ephemeral});}});

// /suggest
commands.push({data:new SlashCommandBuilder().setName("suggest").setDescription("Soumettre une suggestion").addStringOption(o=>o.setName("texte").setDescription("Suggestion").setRequired(true)),async execute(i){const c=i.guild.channels.cache.get(get(i,"suggestChannelId",null));const e=info("Suggestion").setDescription(i.options.getString("texte")).setAuthor({name:i.user.tag,iconURL:i.user.displayAvatarURL()});if(c?.isTextBased())await c.send({embeds:[e]});else await i.channel.send({embeds:[e]});return i.reply({embeds:[ok("Suggestion envoyee.")],flags:MessageFlags.Ephemeral});}});

// /slowmode alias
commands.push({data:admin("slowmode","Definir le slowmode d'un salon",P.ManageChannels).addIntegerOption(o=>o.setName("secondes").setDescription("Secondes").setMinValue(0).setMaxValue(21600).setRequired(true)).addChannelOption(o=>o.setName("salon").setDescription("Salon").addChannelTypes(ChannelType.GuildText)),async execute(i){if(!need(i,P.ManageChannels))return;const c=i.options.getChannel("salon")||i.channel;await c.setRateLimitPerUser(i.options.getInteger("secondes"));return i.reply({embeds:[ok(`Slowmode defini a ${i.options.getInteger("secondes")} seconde(s).`)],flags:MessageFlags.Ephemeral});}});

// /morpion
commands.push({data:new SlashCommandBuilder().setName("morpion").setDescription("Jouer au morpion contre un autre membre").addUserOption(o=>userOpt(o)),async execute(i){const u=i.options.getUser("membre");if(u.bot||u.id===i.user.id)return i.reply({embeds:[fail("Choisis un autre membre.")],flags:MessageFlags.Ephemeral});const board=Array(9).fill("?");let turn=i.user.id;const make=()=>{const rows=[];for(let r=0;r<3;r++){const row=new ActionRowBuilder();for(let c=0;c<3;c++)row.addComponents(new ButtonBuilder().setCustomId(`morpion:${i.id}:${r*3+c}`).setLabel(board[r*3+c]).setStyle(ButtonStyle.Secondary));rows.push(row);}return rows;};const m=await i.reply({embeds:[info("Morpion").setDescription(`${i.user} contre ${u}\nTour de ${i.user}`)],components:make(),fetchReply:true});const col=m.createMessageComponentCollector({time:300000});col.on("collect",async b=>{if(![i.user.id,u.id].includes(b.user.id))return b.reply({content:"Tu ne participes pas a cette partie.",flags:MessageFlags.Ephemeral});if(b.user.id!==turn)return b.reply({content:"Ce n'est pas ton tour.",flags:MessageFlags.Ephemeral});const pos=Number(b.customId.split(":").pop());if(board[pos]!=="?")return b.reply({content:"Case deja prise.",flags:MessageFlags.Ephemeral});board[pos]=b.user.id===i.user.id?"X":"O";turn=b.user.id===i.user.id?u.id:i.user.id;await b.update({embeds:[info("Morpion").setDescription(`${i.user} contre ${u}\nTour de <@${turn}>`)],components:make()});});}});

module.exports = commands;

'@
Write-Utf8NoBom (Join-Path $AdminDir "manager.js") $manager

$guild = @'
const { Events, ActivityType } = require("discord.js");
module.exports = [
  { name: Events.GuildCreate, async execute(guild) {
    const client = guild.client;
    client.user.setPresence({ status: "online", activities: [{ name: `/help | ${client.guilds.cache.size} serveur(s)`, type: ActivityType.Watching }] });
  }},
  { name: Events.GuildDelete, async execute(guild) {
    const client = guild.client;
    client.user.setPresence({ status: "online", activities: [{ name: `/help | ${client.guilds.cache.size} serveur(s)`, type: ActivityType.Watching }] });
  }}
];

'@
Write-Utf8NoBom (Join-Path $EventsDir "managerGuild.js") $guild

$message = @'
const { Events } = require("discord.js");
const db = require("../utils/db");
const cooldown = new Map();
module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot || !message.inGuild()) return;
    const s = db.getSettings(message.guild.id);
    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    if (s.levelsEnabled !== false && (!cooldown.has(key) || now - cooldown.get(key) > 60000)) {
      cooldown.set(key, now);
      const xp = s.xp || {};
      xp[message.author.id] = (xp[message.author.id] || 0) + Math.floor(Math.random() * 11) + 15;
      db.setSetting(message.guild.id, "xp", xp);
    }
    const prefix = s.customPrefix || "!";
    if (!message.content.startsWith(prefix)) return;
    const [name] = message.content.slice(prefix.length).trim().split(/\s+/);
    if (!name) return;
    const response = (s.customCommands || {})[name.toLowerCase()];
    if (response) await message.channel.send({ content: String(response).replaceAll("{user}", `${message.author}`).replaceAll("{server}", message.guild.name) });
  }
};

'@
Write-Utf8NoBom (Join-Path $EventsDir "managerMessage.js") $message

$buttons = @'
const { Events, MessageFlags } = require("discord.js");
module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("role_toggle:")) return;
    const roleId = interaction.customId.split(":")[1];
    const role = interaction.guild.roles.cache.get(roleId);
    if (!role) return interaction.reply({ content: "Role introuvable.", flags: MessageFlags.Ephemeral });
    if (role.managed) return interaction.reply({ content: "Ce role est gere par Discord.", flags: MessageFlags.Ephemeral });
    const member = interaction.member;
    const has = member.roles.cache.has(role.id);
    const done = has ? await member.roles.remove(role).then(() => true).catch(() => false) : await member.roles.add(role).then(() => true).catch(() => false);
    return interaction.reply({ content: done ? (has ? `Role ${role.name} retire.` : `Role ${role.name} ajoute.`) : "Je ne peux pas gerer ce role.", flags: MessageFlags.Ephemeral });
  }
};

'@
Write-Utf8NoBom (Join-Path $EventsDir "managerButtons.js") $buttons

$voice = @'
const { Events, ChannelType } = require("discord.js");
const db = require("../utils/db");
module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    const tv = db.getSettings(newState.guild.id).tempVoice;
    if (!tv) return;
    if (newState.channelId === tv.lobbyId) {
      const c = await newState.guild.channels.create({ name: `${tv.prefix} ${newState.member.displayName}`.slice(0, 100), type: ChannelType.GuildVoice, parent: tv.categoryId }).catch(() => null);
      if (c) await newState.setChannel(c).catch(() => {});
    }
    if (oldState.channelId && oldState.channelId !== tv.lobbyId) {
      const c = oldState.guild.channels.cache.get(oldState.channelId);
      if (c && c.parentId === tv.categoryId && c.members.size === 0) await c.delete().catch(() => {});
    }
  }
};

'@
Write-Utf8NoBom (Join-Path $EventsDir "managerVoice.js") $voice

$scheduler = @'
const { Events } = require("discord.js");
const db = require("../utils/db");
module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    setInterval(async () => {
      for (const guild of client.guilds.cache.values()) {
        const s = db.getSettings(guild.id);
        const r = s.recurringMessage;
        if (r) {
          const key = `_lastRecurring:${guild.id}`;
          const now = Date.now();
          if (now - (global[key] || 0) >= r.minutes * 60000) {
            const c = await guild.channels.fetch(r.channelId).catch(() => null);
            if (c?.isTextBased()) await c.send({ content: r.text }).catch(() => {});
            global[key] = now;
          }
        }
        if (s.statsChannels?.length) {
          for (const x of s.statsChannels) {
            const c = guild.channels.cache.get(x.id);
            if (!c) continue;
            const names = { members: `membres-${guild.memberCount}`, bots: `bots-${guild.members.cache.filter(m => m.user.bot).size}`, channels: `salons-${guild.channels.cache.size}` };
            if (names[x.type]) await c.setName(names[x.type]).catch(() => {});
          }
        }
      }
    }, 60000);
  }
};

'@
Write-Utf8NoBom (Join-Path $EventsDir "managerScheduler.js") $scheduler

$staff = @'
const { Events } = require("discord.js");
const db = require("../utils/db");
async function send(member, key, text) {
  const s = db.getSettings(member.guild.id);
  if (!s[key] || !s.hierarchyRoleId || !member.roles.cache.has(s.hierarchyRoleId)) return;
  const c = await member.guild.channels.fetch(s[key]).catch(() => null);
  if (c?.isTextBased()) await c.send({ content: text }).catch(() => {});
}
module.exports = [
  { name: Events.GuildMemberAdd, async execute(member) { await send(member, "staffWelcomeChannelId", `Bienvenue staff ${member} !`); } },
  { name: Events.GuildMemberRemove, async execute(member) { await send(member, "staffLeaveChannelId", `Depart staff : ${member}.`); } }
];

'@
Write-Utf8NoBom (Join-Path $EventsDir "managerStaff.js") $staff


$giveaway = @'
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require("discord.js");
const db = require("../../utils/db");
const { ok, fail } = require("../../utils/embeds");
const { giveawayEmbed, joinRow, schedule, endGiveaway } = require("../../utils/giveaways");

const UNITS = { s: 1000, m: 60_000, h: 3_600_000, j: 86_400_000, d: 86_400_000 };

// "30m", "2h", "1j" ... ? millisecondes (ou null)
function parseDuration(text) {
  const match = /^(\d+)\s*([smhjd])$/i.exec(text.trim());
  return match ? Number(match[1]) * UNITS[match[2].toLowerCase()] : null;
}

const findByMessage = (guildId, messageId) => db.giveaways.all().find((g) => g.guildId === guildId && g.messageId === messageId);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Organise des giveaways")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName("start")
        .setDescription("Lance un giveaway")
        .addStringOption((o) => o.setName("lot").setDescription("Ce qui est ? gagner").setRequired(true).setMaxLength(200))
        .addStringOption((o) => o.setName("duree").setDescription("Dur?e : 30m, 2h, 1j? (1 minute ? 14 jours)").setRequired(true))
        .addIntegerOption((o) => o.setName("gagnants").setDescription("Nombre de gagnants (1 ? 10)").setMinValue(1).setMaxValue(10))
        .addChannelOption((o) => o.setName("salon").setDescription("Salon du giveaway (par d?faut : celui-ci)").addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand((s) =>
      s
        .setName("end")
        .setDescription("Termine un giveaway tout de suite")
        .addStringOption((o) => o.setName("message_id").setDescription("ID du message du giveaway").setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName("reroll")
        .setDescription("Refait un tirage sur un giveaway termin?")
        .addStringOption((o) => o.setName("message_id").setDescription("ID du message du giveaway").setRequired(true))
    )
    .addSubcommand((s) => s.setName("creer").setDescription("Cr?er un giveaway").addStringOption(o => o.setName("lot").setDescription("Lot").setRequired(true)).addStringOption(o => o.setName("duree").setDescription("Dur?e : 30m, 2h, 1j").setRequired(true)).addIntegerOption(o => o.setName("gagnants").setDescription("Nombre de gagnants").setMinValue(1).setMaxValue(10)).addChannelOption(o => o.setName("salon").setDescription("Salon").addChannelTypes(ChannelType.GuildText)))
    .addSubcommand((s) => s.setName("liste").setDescription("Voir les giveaways en cours"))
    .addSubcommand((s) => s.setName("terminer").setDescription("Terminer un giveaway").addStringOption(o => o.setName("message_id").setDescription("ID du message").setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const reply = (embed) => interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    if (sub === "start" || sub === "creer") {
      const duration = parseDuration(interaction.options.getString("duree"));
      if (!duration || duration < 60_000 || duration > 14 * 86_400_000) {
        return reply(fail("Dur?e invalide. Exemples : `30m`, `2h`, `1j` (entre 1 minute et 14 jours)."));
      }
      const channel = interaction.options.getChannel("salon") ?? interaction.channel;
      const giveaway = {
        id: Date.now().toString(36),
        guildId: interaction.guild.id,
        channelId: channel.id,
        messageId: null,
        prize: interaction.options.getString("lot"),
        hostId: interaction.user.id,
        winners: interaction.options.getInteger("gagnants") ?? 1,
        endsAt: Date.now() + duration,
        entries: [],
        ended: false,
        winnerIds: [],
      };

      let message;
      try {
        message = await channel.send({ embeds: [giveawayEmbed(giveaway)], components: [joinRow(giveaway.id)] });
      } catch {
        return reply(fail(`Je ne peux pas ?crire dans ${channel}.`));
      }
      giveaway.messageId = message.id;
      db.giveaways.set(giveaway.id, giveaway);
      schedule(interaction.client, giveaway);
      return reply(ok(`Giveaway lanc? dans ${channel} : [voir le message](${message.url})`));
    }

    if (sub === "liste") {
      const list = db.giveaways.all().filter((x) => x.guildId === interaction.guild.id && !x.ended);
      return reply(info("Giveaways en cours").setDescription(list.length ? list.map((x) => `**${x.prize}** - <#${x.channelId}> - fin <t:${Math.floor(x.endsAt / 1000)}:R> - ID message: \`${x.messageId}\``).join("\n") : "Aucun giveaway en cours."));
    }

    const g = findByMessage(interaction.guild.id, interaction.options.getString("message_id").trim());
    if (!g) return reply(fail("Giveaway introuvable. Donne l'ID du message du giveaway."));

    if (sub === "end" || sub === "terminer") {
      if (g.ended) return reply(fail("Ce giveaway est d?j? termin?."));
      await endGiveaway(interaction.client, g.id);
      return reply(ok("Giveaway termin?."));
    }

    // reroll
    if (!g.ended) return reply(fail("Ce giveaway n'est pas encore termin?. Utilise `/giveaway end`."));
    await endGiveaway(interaction.client, g.id, { reroll: true });
    return reply(ok("Nouveau tirage effectu?."));
  },
};

'@
Write-Utf8NoBom (Join-Path $Project "commands/community/giveaway.js") $giveaway


# ---------------------------------------------------------------------------
# CORRECTION RAILWAY : chargeur de commandes robuste
# Evite le crash "Cannot read properties of undefined (reading 'name')"
# ---------------------------------------------------------------------------

$indexJs = @'
require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const db = require("./utils/db");

if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === "colle_ton_token_ici") {
  console.error("DISCORD_TOKEN manquant.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message, Partials.Channel],
});

client.commands = new Collection();

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full);
    return entry.name.endsWith(".js") ? [full] : [];
  });
}

// Chargement robuste des commandes.
// Un fichier invalide ne fait plus planter tout le bot.
for (const file of listFiles(path.join(__dirname, "commands"))) {
  try {
    const loaded = require(file);
    const commands = Array.isArray(loaded) ? loaded : [loaded];

    for (const command of commands) {
      if (!command?.data?.name || typeof command.execute !== "function") {
        console.warn(`[SKIP] Commande invalide ignoree : ${path.relative(__dirname, file)}`);
        continue;
      }

      command.category = path.basename(path.dirname(file));
      client.commands.set(command.data.name, command);
    }
  } catch (error) {
    console.error(`[ERREUR] Chargement commande ${path.relative(__dirname, file)} :`, error);
  }
}

// Chargement robuste des events.
for (const file of listFiles(path.join(__dirname, "events"))) {
  try {
    const loaded = require(file);
    const events = Array.isArray(loaded) ? loaded : [loaded];

    for (const event of events) {
      if (!event?.name || typeof event.execute !== "function") {
        console.warn(`[SKIP] Event invalide ignore : ${path.relative(__dirname, file)}`);
        continue;
      }

      const run = (...args) =>
        Promise.resolve(event.execute(...args)).catch((error) => {
          console.error(`Erreur dans l'event ${event.name} :`, error);
        });

      if (event.once) client.once(event.name, run);
      else client.on(event.name, run);
    }
  } catch (error) {
    console.error(`[ERREUR] Chargement event ${path.relative(__dirname, file)} :`, error);
  }
}

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    try {
      db.flush();
    } finally {
      process.exit(0);
    }
  });
}

process.on("unhandledRejection", (error) => {
  console.error("Promesse rejetee :", error);
});

process.on("uncaughtException", (error) => {
  console.error("Exception non geree :", error);
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error("Connexion Discord impossible :", error);
  process.exit(1);
});
'@

Write-Utf8NoBom (Join-Path $Project "index.js") $indexJs
Write-Host "[OK] index.js corrige pour Railway." -ForegroundColor Green

Write-Host "Verification de la syntaxe..." -ForegroundColor Cyan
$files = @(
    (Join-Path $Project "index.js"),
    (Join-Path $AdminDir "manager.js"),
    (Join-Path $EventsDir "managerGuild.js"),
    (Join-Path $EventsDir "managerMessage.js"),
    (Join-Path $EventsDir "managerButtons.js"),
    (Join-Path $EventsDir "managerVoice.js"),
    (Join-Path $EventsDir "managerScheduler.js"),
    (Join-Path $EventsDir "managerStaff.js")
)

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js est requis pour verifier la syntaxe." -ForegroundColor Yellow
    exit 0
}

foreach ($file in $files) {
    node --check $file
    if ($LASTEXITCODE -ne 0) { throw "Erreur JavaScript dans $file" }
}

Write-Host "Syntaxe OK." -ForegroundColor Green
Write-Host "Les fichiers existants n'ont pas ete supprimes ni remplaces." -ForegroundColor Green
Write-Host "Relance avec : npm start" -ForegroundColor Cyan

Write-Host ""
Write-Host "=== NETTOYAGE FINAL ===" -ForegroundColor Cyan

# Supprime uniquement ce script s'il est execute depuis le projet via une copie
# portant un ancien nom. Le fichier actuel reste disponible pour reutilisation.
foreach ($old in @(
    "install-real-commands.ps1",
    "install-real-commands-clean.ps1",
    "install-all-commands.ps1",
    "install-all-commands-v2.ps1"
)) {
    $p = Join-Path $Project $old
    if (Test-Path $p) {
        Remove-Item $p -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "[OK] Les anciens installateurs ont ete supprimes." -ForegroundColor Green
Write-Host "[OK] Aucune commande/event du bot n'a ete supprime." -ForegroundColor Green
Write-Host ""
Write-Host "Prochaine etape :" -ForegroundColor Cyan
Write-Host "  npm start"
Write-Host ""
Write-Host "Puis :" -ForegroundColor Cyan
Write-Host "  git add ."
Write-Host "  git commit -m ""Corrige le chargement des commandes Railway"""
Write-Host "  git pull --rebase origin main"
Write-Host "  git push origin main"
Write-Host ""
Write-Host "=== TERMINE ===" -ForegroundColor Green
