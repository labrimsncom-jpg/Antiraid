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
    const batch = await channel.messages
      .fetch({ limit: 100, before })
      .catch(() => null);

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
    .setTitle("Support")
    .setDescription("Besoin d'aide ? Ouvre un ticket prive avec l'equipe.");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_open")
      .setLabel("Ouvrir un ticket")
      .setStyle(ButtonStyle.Primary)
  );

  return {
    embeds: [embed],
    components: [row],
  };
}

function configEmbed(guild) {
  const s = settings(guild.id);

  const mentionChannel = (id) =>
    id ? `<#${id}>` : "Non configure";

  const mentionRole = (id) =>
    id ? `<@&${id}>` : "Non configure";

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("Configuration")
    .addFields(
      {
        name: "Logs",
        value: mentionChannel(db.getSettings(guild.id).logChannelId),
        inline: true,
      },
      {
        name: "Bienvenue",
        value: mentionChannel(db.getSettings(guild.id).welcomeChannelId),
        inline: true,
      },
      {
        name: "Autorole",
        value: mentionRole(db.getSettings(guild.id).autoroleId),
        inline: true,
      },
      {
        name: "Support tickets",
        value: mentionRole(db.getSettings(guild.id).ticketRoleId),
        inline: true,
      },
      {
        name: "Categorie tickets",
        value: mentionChannel(db.getSettings(guild.id).ticketCategoryId),
        inline: true,
      },
      {
        name: "Salon suggestions",
        value: mentionChannel(s.suggestions.channelId),
        inline: true,
      },
      {
        name: "XP active",
        value: s.xpEnabled === false ? "Non" : "Oui",
        inline: true,
      }
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
