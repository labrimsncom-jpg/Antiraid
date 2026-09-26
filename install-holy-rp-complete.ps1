$ErrorActionPreference = "Stop"

Write-Host "=== HOLY RP COMPLETE INSTALLER ==="

$root = (Get-Location).Path

if (-not (Test-Path ".\package.json")) {
    throw "package.json introuvable. Lance ce script depuis le dossier du bot."
}

New-Item -ItemType Directory -Force ".\utils" | Out-Null
New-Item -ItemType Directory -Force ".\commands\admin" | Out-Null
New-Item -ItemType Directory -Force ".\commands\community" | Out-Null
New-Item -ItemType Directory -Force ".\commands\general" | Out-Null
New-Item -ItemType Directory -Force ".\commands\moderation" | Out-Null
New-Item -ItemType Directory -Force ".\commands\ticket" | Out-Null
New-Item -ItemType Directory -Force ".\events" | Out-Null

@'
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits: P,
  MessageFlags,
} = require("discord.js");

const db = require("./db");

function settings(guildId) {
  const s = db.getSettings(guildId);
  s.holy ??= {};
  s.holy.xp ??= {};
  s.holy.suggestions ??= { channelId: null, nextId: 1 };
  s.holy.levelRoles ??= {};
  return s.holy;
}

function save(guildId, holy) {
  db.setSetting(guildId, "holy", holy);
}

function levelFromXp(xp) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100));
}

function xpForLevel(level) {
  return level * level * 100;
}

function addXp(guildId, userId, amount) {
  const h = settings(guildId);
  h.xp[userId] ??= { xp: 0, messages: 0 };
  const before = levelFromXp(h.xp[userId].xp);
  h.xp[userId].xp += amount;
  h.xp[userId].messages += 1;
  const after = levelFromXp(h.xp[userId].xp);
  save(guildId, h);
  return { xp: h.xp[userId].xp, level: after, leveled: after > before };
}

function getLeaderboard(guildId) {
  const h = settings(guildId);
  return Object.entries(h.xp)
    .map(([userId, value]) => ({
      userId,
      xp: value.xp || 0,
      messages: value.messages || 0,
      level: levelFromXp(value.xp || 0),
    }))
    .sort((a, b) => b.xp - a.xp);
}

function createSuggestion(guildId, userId, text) {
  const h = settings(guildId);
  h.suggestions ??= { channelId: null, nextId: 1 };
  const id = h.suggestions.nextId++;
  const item = {
    id,
    userId,
    text,
    up: [],
    down: [],
    status: "pending",
    createdAt: Date.now(),
  };
  h.suggestions[id] = item;
  save(guildId, h);
  return item;
}

function getSuggestion(guildId, id) {
  return settings(guildId).suggestions?.[id];
}

function voteSuggestion(guildId, id, userId, direction) {
  const h = settings(guildId);
  const item = h.suggestions?.[id];
  if (!item) return null;
  item.up = item.up || [];
  item.down = item.down || [];
  item.up = item.up.filter((x) => x !== userId);
  item.down = item.down.filter((x) => x !== userId);
  item[direction].push(userId);
  save(guildId, h);
  return item;
}

function setSuggestionStatus(guildId, id, status) {
  const h = settings(guildId);
  const item = h.suggestions?.[id];
  if (!item) return null;
  item.status = status;
  save(guildId, h);
  return item;
}

function ticketOwner(channel) {
  if (!channel?.topic?.startsWith("ticket:")) return null;
  return channel.topic.split(":")[1] || null;
}

async function transcript(channel) {
  const messages = [];
  let before;
  for (let page = 0; page < 20; page++) {
    const batch = await channel.messages.fetch({ limit: 100, before }).catch(() => null);
    if (!batch || batch.size === 0) break;
    messages.push(...batch.values());
    if (batch.size < 100) break;
    before = batch.last().id;
  }

  messages.reverse();
  return messages
    .map((m) => {
      const content = (m.content || "").replace(/\r?\n/g, " ");
      return `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${content}`;
    })
    .join("\n");
}

function ticketPanel() {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("Holy RP - Support")
    .setDescription("Besoin d'aide ? Ouvre un ticket prive avec l'equipe.");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("holy_ticket_open")
      .setLabel("Ouvrir un ticket")
      .setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}

function configEmbed(guild) {
  const s = settings(guild.id);
  const mentionChannel = (id) => id ? `<#${id}>` : "Non configure";
  const mentionRole = (id) => id ? `<@&${id}>` : "Non configure";

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("Holy RP - Configuration")
    .addFields(
      { name: "Logs", value: mentionChannel(db.getSettings(guild.id).logChannelId), inline: true },
      { name: "Bienvenue", value: mentionChannel(db.getSettings(guild.id).welcomeChannelId), inline: true },
      { name: "Autorole", value: mentionRole(db.getSettings(guild.id).autoroleId), inline: true },
      { name: "Support tickets", value: mentionRole(db.getSettings(guild.id).ticketRoleId), inline: true },
      { name: "Categorie tickets", value: mentionChannel(db.getSettings(guild.id).ticketCategoryId), inline: true },
      { name: "Salon suggestions", value: mentionChannel(s.suggestions.channelId), inline: true },
      { name: "XP active", value: s.xpEnabled === false ? "Non" : "Oui", inline: true }
    )
    .setTimestamp();
}

module.exports = {
  P,
  settings,
  save,
  levelFromXp,
  xpForLevel,
  addXp,
  getLeaderboard,
  createSuggestion,
  getSuggestion,
  voteSuggestion,
  setSuggestionStatus,
  ticketOwner,
  transcript,
  ticketPanel,
  configEmbed,
};
'@ | Set-Content ".\utils\holy.js" -Encoding UTF8

@'
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} = require("discord.js");
const db = require("../../utils/db");
const { settings, save, configEmbed } = require("../../utils/holy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("holy-config")
    .setDescription("Configurer les fonctions avancees de Holy RP")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s.setName("afficher").setDescription("Afficher la configuration")
    )
    .addSubcommand((s) =>
      s
        .setName("suggestions")
        .setDescription("Definir le salon des suggestions")
        .addChannelOption((o) =>
          o.setName("salon").setDescription("Salon texte").addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s
        .setName("xp")
        .setDescription("Activer ou desactiver le systeme XP")
        .addBooleanOption((o) => o.setName("active").setDescription("Etat").setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName("role-niveau")
        .setDescription("Associer un role a un niveau")
        .addIntegerOption((o) => o.setName("niveau").setDescription("Niveau").setMinValue(1).setMaxValue(100).setRequired(true))
        .addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const h = settings(interaction.guild.id);

    if (sub === "afficher") {
      return interaction.reply({
        embeds: [configEmbed(interaction.guild)],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "suggestions") {
      const channel = interaction.options.getChannel("salon");
      h.suggestions.channelId = channel.id;
      save(interaction.guild.id, h);
      return interaction.reply({
        content: `Salon suggestions configure : ${channel}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "xp") {
      h.xpEnabled = interaction.options.getBoolean("active");
      save(interaction.guild.id, h);
      return interaction.reply({
        content: `Systeme XP : ${h.xpEnabled ? "active" : "desactive"}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "role-niveau") {
      const level = interaction.options.getInteger("niveau");
      const role = interaction.options.getRole("role");
      if (role.managed || role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({
          content: "Le bot ne peut pas attribuer ce role.",
          flags: MessageFlags.Ephemeral,
        });
      }
      h.levelRoles[level] = role.id;
      save(interaction.guild.id, h);
      return interaction.reply({
        content: `Le niveau ${level} donnera ${role}.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
'@ | Set-Content ".\commands\admin\holyconfig.js" -Encoding UTF8

@'
const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require("discord.js");
const { createSuggestion, settings } = require("../../utils/holy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Envoyer une suggestion")
    .addStringOption((o) =>
      o.setName("idee").setDescription("Ta suggestion").setMinLength(5).setMaxLength(1000).setRequired(true)
    ),

  async execute(interaction) {
    const h = settings(interaction.guild.id);
    const channelId = h.suggestions.channelId;

    if (!channelId) {
      return interaction.reply({
        content: "Le salon des suggestions n'est pas configure. Utilise /holy-config suggestions.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) {
      return interaction.reply({
        content: "Le salon des suggestions configure est introuvable.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const item = createSuggestion(
      interaction.guild.id,
      interaction.user.id,
      interaction.options.getString("idee", true)
    );

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`Suggestion #${item.id}`)
      .setDescription(item.text)
      .addFields(
        { name: "Auteur", value: `${interaction.user}`, inline: true },
        { name: "Votes", value: "0 pour / 0 contre", inline: true },
        { name: "Statut", value: "En attente", inline: true }
      )
      .setTimestamp();

    await channel.send({
      embeds: [embed],
      components: [
        {
          type: 1,
          components: [
            { type: 2, custom_id: `holy_suggest_up:${item.id}`, label: "Pour", style: 3 },
            { type: 2, custom_id: `holy_suggest_down:${item.id}`, label: "Contre", style: 4 },
          ],
        },
      ],
    });

    return interaction.reply({
      content: `Suggestion #${item.id} envoyee dans ${channel}.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
'@ | Set-Content ".\commands\community\suggest.js" -Encoding UTF8

@'
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getLeaderboard } = require("../../utils/holy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Afficher le classement XP"),

  async execute(interaction) {
    const rows = getLeaderboard(interaction.guild.id).slice(0, 10);

    if (!rows.length) {
      return interaction.reply("Aucun XP enregistre pour le moment.");
    }

    const lines = rows.map((r, i) =>
      `${i + 1}. <@${r.userId}> - niveau ${r.level} - ${r.xp} XP`
    );

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Classement XP")
      .setDescription(lines.join("\n"));

    return interaction.reply({ embeds: [embed] });
  },
};
'@ | Set-Content ".\commands\general\leaderboard.js" -Encoding UTF8

@'
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Mettre un membre en timeout")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName("membre").setDescription("Membre").setRequired(true))
    .addIntegerOption((o) => o.setName("minutes").setDescription("Duree en minutes").setMinValue(1).setMaxValue(40320).setRequired(true))
    .addStringOption((o) => o.setName("raison").setDescription("Raison").setMaxLength(300)),

  async execute(interaction) {
    const target = interaction.options.getMember("membre");
    const minutes = interaction.options.getInteger("minutes");
    const reason = interaction.options.getString("raison") || "Aucune raison";

    if (!target) {
      return interaction.reply({ content: "Membre introuvable.", flags: MessageFlags.Ephemeral });
    }

    if (!target.moderatable) {
      return interaction.reply({ content: "Je ne peux pas timeout ce membre.", flags: MessageFlags.Ephemeral });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: "Tu ne peux pas te timeout toi-meme.", flags: MessageFlags.Ephemeral });
    }

    await target.timeout(minutes * 60 * 1000, reason);

    return interaction.reply({
      content: `${target} est en timeout pendant ${minutes} minute(s). Raison : ${reason}`,
    });
  },
};
'@ | Set-Content ".\commands\moderation\timeout.js" -Encoding UTF8

@'
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const { transcript, ticketOwner } = require("../../utils/holy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Gestion avancee des tickets")
    .addSubcommand((s) =>
      s.setName("claim").setDescription("Prendre en charge le ticket")
    )
    .addSubcommand((s) =>
      s.setName("add").setDescription("Ajouter un membre au ticket").addUserOption((o) => o.setName("membre").setDescription("Membre").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("remove").setDescription("Retirer un membre du ticket").addUserOption((o) => o.setName("membre").setDescription("Membre").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("transcript").setDescription("Generer le transcript du ticket")
    )
    .addSubcommand((s) =>
      s.setName("close").setDescription("Fermer le ticket")
    ),

  async execute(interaction) {
    const channel = interaction.channel;
    const owner = ticketOwner(channel);

    if (!owner) {
      return interaction.reply({ content: "Ce salon n'est pas un ticket.", flags: MessageFlags.Ephemeral });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "claim") {
      await channel.setTopic(`ticket:${owner}:claimed:${interaction.user.id}`);
      return interaction.reply(`Ticket pris en charge par ${interaction.user}.`);
    }

    if (sub === "add") {
      const member = interaction.options.getMember("membre");
      await channel.permissionOverwrites.edit(member.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
        EmbedLinks: true,
      });
      return interaction.reply(`${member} a ete ajoute au ticket.`);
    }

    if (sub === "remove") {
      const member = interaction.options.getMember("membre");
      if (member.id === owner) {
        return interaction.reply({ content: "Impossible de retirer le proprietaire du ticket.", flags: MessageFlags.Ephemeral });
      }
      await channel.permissionOverwrites.delete(member.id).catch(() => {});
      return interaction.reply(`${member} a ete retire du ticket.`);
    }

    if (sub === "transcript") {
      const text = await transcript(channel);
      const buffer = Buffer.from(text || "Aucun message.", "utf8");
      return interaction.reply({
        content: "Transcript genere.",
        files: [{ attachment: buffer, name: `${channel.name}-transcript.txt` }],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "close") {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels) && interaction.user.id !== owner) {
        return interaction.reply({ content: "Tu ne peux pas fermer ce ticket.", flags: MessageFlags.Ephemeral });
      }
      await interaction.reply("Ticket ferme. Suppression dans 5 secondes.");
      setTimeout(() => channel.delete("Ticket ferme").catch(() => {}), 5000);
    }
  },
};
'@ | Set-Content ".\commands\ticket\ticket.js" -Encoding UTF8

@'
const { Events, MessageFlags, EmbedBuilder } = require("discord.js");
const {
  voteSuggestion,
  getSuggestion,
  setSuggestionStatus,
} = require("../utils/holy");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) return;

    try {
      const id = interaction.customId || "";

      if (id.startsWith("holy_suggest_up:") || id.startsWith("holy_suggest_down:")) {
        const [kind, suggestionId] = id.split(":");
        const item = getSuggestion(interaction.guild.id, Number(suggestionId));

        if (!item) {
          return interaction.reply({ content: "Suggestion introuvable.", flags: MessageFlags.Ephemeral });
        }

        const direction = kind.endsWith("up") ? "up" : "down";
        const updated = voteSuggestion(interaction.guild.id, Number(suggestionId), interaction.user.id, direction);

        return interaction.reply({
          content: `Vote enregistre. ${updated.up.length} pour / ${updated.down.length} contre.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (id.startsWith("holy_suggest_status:")) {
        const [, suggestionId, status] = id.split(":");
        if (!interaction.memberPermissions?.has("ManageGuild")) {
          return interaction.reply({ content: "Permission insuffisante.", flags: MessageFlags.Ephemeral });
        }
        const updated = setSuggestionStatus(interaction.guild.id, Number(suggestionId), status);
        if (!updated) return interaction.reply({ content: "Suggestion introuvable.", flags: MessageFlags.Ephemeral });
        return interaction.reply(`Suggestion #${suggestionId} : ${status}.`);
      }
    } catch (error) {
      console.error("Holy interaction error:", error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "Erreur.", flags: MessageFlags.Ephemeral }).catch(() => {});
      }
    }
  },
};
'@ | Set-Content ".\events\holyInteraction.js" -Encoding UTF8

@'
const { Events } = require("discord.js");
const { addXp, settings } = require("../utils/holy");

const cooldown = new Map();

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const h = settings(message.guild.id);
    if (h.xpEnabled === false) return;

    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    const last = cooldown.get(key) || 0;
    if (now - last < 60000) return;
    cooldown.set(key, now);

    const result = addXp(message.guild.id, message.author.id, 10);

    if (result.leveled && result.level > 0) {
      const roleId = h.levelRoles[result.level];
      if (roleId) {
        const role = message.guild.roles.cache.get(roleId);
        if (role && role.position < message.guild.members.me.roles.highest.position) {
          await message.member.roles.add(role).catch(() => {});
        }
      }

      await message.channel.send(`${message.author} passe niveau ${result.level} !`).catch(() => {});
    }
  },
};
'@ | Set-Content ".\events\holyMessage.js" -Encoding UTF8

@'
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("Afficher les informations du bot"),

  async execute(interaction) {
    const client = interaction.client;
    const memory = process.memoryUsage();

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Holy RP - Bot Info")
      .addFields(
        { name: "Serveurs", value: String(client.guilds.cache.size), inline: true },
        { name: "Commandes", value: String(client.commands.size), inline: true },
        { name: "Node", value: process.version, inline: true },
        { name: "RAM", value: `${Math.round(memory.rss / 1024 / 1024)} MB`, inline: true },
        { name: "Uptime", value: `${Math.floor(process.uptime() / 60)} min`, inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
'@ | Set-Content ".\commands\general\botinfo.js" -Encoding UTF8

Write-Host "Verification JavaScript..."

$files = @(
  ".\utils\holy.js",
  ".\commands\admin\holyconfig.js",
  ".\commands\community\suggest.js",
  ".\commands\general\leaderboard.js",
  ".\commands\general\botinfo.js",
  ".\commands\moderation\timeout.js",
  ".\commands\ticket\ticket.js",
  ".\events\holyInteraction.js",
  ".\events\holyMessage.js"
)

foreach ($file in $files) {
    node --check $file
    if ($LASTEXITCODE -ne 0) {
        throw "Erreur de syntaxe dans $file"
    }
    Write-Host "OK $file"
}

Write-Host "Installation des dependances..."
npm install

Write-Host ""
Write-Host "Installation terminee."
Write-Host ""
Write-Host "Nouvelles commandes principales:"
Write-Host "/config afficher"
Write-Host "/config suggestions"
Write-Host "/config xp"
Write-Host "/config role-niveau"
Write-Host "/suggest"
Write-Host "/leaderboard"
Write-Host "/timeout"
Write-Host "/ticket claim"
Write-Host "/ticket add"
Write-Host "/ticket remove"
Write-Host "/ticket transcript"
Write-Host "/ticket close"
Write-Host "/botinfo"
Write-Host ""
Write-Host "Redemarre ensuite le bot avec: npm start"
Write-Host "Ne colle pas ce script morceau par morceau dans PowerShell."
