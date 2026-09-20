const { EmbedBuilder, PermissionFlagsBits: P } = require("discord.js");
const db = require("./db");
const { COLORS } = require("./embeds");
const { sendLog } = require("./logger");

// ---------------------------------------------------------------- Réglages
const DEFAULTS = {
  antiraid: { enabled: false, joins: 5, seconds: 10, action: "kick", minAccountDays: 0, raidMinutes: 10, raidUntil: 0 },
  antispam: { enabled: false, messages: 5, seconds: 5, mentions: 5, timeoutMinutes: 10 },
  antilink: { enabled: false, mode: "invites", whitelist: [], timeoutMinutes: 0 },
  bypass: { roles: [], channels: [], users: [] },
};

const getModule = (guildId, name) => ({ ...DEFAULTS[name], ...(db.getSettings(guildId)[name] ?? {}) });

function updateModule(guildId, name, patch) {
  const next = { ...getModule(guildId, name), ...patch };
  db.setSetting(guildId, name, next);
  return next;
}

const state = (on) => (on ? "🟢 Activé" : "🔴 Désactivé");

// Les admins / modérateurs et les exceptions (/bypass) ne sont jamais filtrés
function isExempt(member, channelId) {
  if (!member) return false;
  if (member.id === member.guild.ownerId) return true;
  if (member.permissions.any([P.Administrator, P.ManageGuild, P.ManageMessages])) return true;
  const bypass = getModule(member.guild.id, "bypass");
  return (
    bypass.users.includes(member.id) ||
    bypass.channels.includes(channelId) ||
    member.roles.cache.some((role) => bypass.roles.includes(role.id))
  );
}

// Alerte dans le salon de logs (ou, à défaut, le salon système du serveur)
async function notify(guild, title, description, color = COLORS.warn, fields = []) {
  const embed = new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).addFields(fields).setTimestamp();
  if (db.getSettings(guild.id).logChannelId) return sendLog(guild, embed);
  await guild.systemChannel?.send({ embeds: [embed] }).catch(() => {});
}

async function tempWarn(channel, text) {
  const sent = await channel.send(text).catch(() => null);
  if (sent) setTimeout(() => sent.delete().catch(() => {}), 6000);
}

// Messages supprimés par le bot : on évite de les logger deux fois
const silent = new Set();
const markSilent = (id) => {
  silent.add(id);
  setTimeout(() => silent.delete(id), 15_000).unref();
};

// ---------------------------------------------------------------- Anti-raid
const joinLog = new Map(); // guildId -> [{ id, at }]

async function punishJoin(member, action, reason) {
  try {
    if (action === "ban") await member.guild.members.ban(member.id, { reason });
    else await member.kick(reason);
    return true;
  } catch {
    return false;
  }
}

// Renvoie true si le nouveau membre a été retiré (le reste des événements est alors ignoré)
async function handleJoin(member) {
  if (member.user.bot) return false;
  const { guild } = member;
  const cfg = getModule(guild.id, "antiraid");
  if (!cfg.enabled) return false;
  const now = Date.now();

  // 1) Mode raid actif : toute nouvelle arrivée est bloquée
  if (cfg.raidUntil > now) {
    const done = await punishJoin(member, cfg.action, "Anti-raid : mode raid actif");
    if (done) await notify(guild, "🛡️ Anti-raid", `${member.user.tag} bloqué (mode raid actif).`, COLORS.error);
    return done;
  }

  // 2) Âge minimum du compte
  if (cfg.minAccountDays > 0) {
    const ageDays = (now - member.user.createdTimestamp) / 86_400_000;
    if (ageDays < cfg.minAccountDays) {
      await member.send(`Ton compte est trop récent pour rejoindre **${guild.name}** (minimum ${cfg.minAccountDays} jour(s)).`).catch(() => {});
      const done = await punishJoin(member, "kick", `Anti-raid : compte de moins de ${cfg.minAccountDays} jour(s)`);
      if (done) await notify(guild, "🛡️ Compte trop récent", `${member.user.tag} expulsé (compte créé il y a ${ageDays.toFixed(1)} jour(s)).`);
      return done;
    }
  }

  // 3) Arrivées en rafale
  const recent = (joinLog.get(guild.id) ?? []).filter((j) => now - j.at < cfg.seconds * 1000);
  recent.push({ id: member.id, at: now });
  joinLog.set(guild.id, recent);
  if (recent.length < cfg.joins) return false;

  joinLog.delete(guild.id);
  updateModule(guild.id, "antiraid", { raidUntil: now + cfg.raidMinutes * 60_000 });

  let punished = 0;
  for (const { id } of recent) {
    const target = id === member.id ? member : await guild.members.fetch(id).catch(() => null);
    if (target && (await punishJoin(target, cfg.action, "Anti-raid : arrivée massive"))) punished++;
  }

  await notify(
    guild,
    "🚨 RAID DÉTECTÉ",
    `**${recent.length}** membres ont rejoint en moins de **${cfg.seconds}s**.\n` +
      `${punished} raider(s) ${cfg.action === "ban" ? "banni(s)" : "expulsé(s)"}.\n\n` +
      `Le **mode raid** est actif pendant **${cfg.raidMinutes} minute(s)** : toute nouvelle arrivée sera bloquée.\n` +
      "Utilise `/raidmode actif:false` pour l'arrêter.",
    COLORS.error
  );
  return true;
}

// ---------------------------------------------------------------- Anti-lien / anti-spam
const INVITE_RE = /(discord\.(gg|io|me|li)|discord(app)?\.com\/invite|dsc\.gg)\/[a-z0-9-]+/i;
const LINK_RE = /((https?:\/\/)|(www\.))[^\s<>]+/gi;

function hostOf(link) {
  try {
    return new URL(/^https?:\/\//i.test(link) ? link : `https://${link}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

const isWhitelisted = (link, whitelist) => {
  const host = hostOf(link);
  return whitelist.some((domain) => host === domain || host.endsWith(`.${domain}`));
};

async function checkLinks(message) {
  const { guild, member, author, channel, content } = message;
  const cfg = getModule(guild.id, "antilink");
  if (!cfg.enabled || !content) return false;

  let kind = null;
  if (INVITE_RE.test(content)) kind = "invitation Discord";
  else if (cfg.mode === "all" && (content.match(LINK_RE) ?? []).some((link) => !isWhitelisted(link, cfg.whitelist))) kind = "lien";
  if (!kind) return false;

  markSilent(message.id);
  await message.delete().catch(() => {});
  if (cfg.timeoutMinutes > 0 && member.moderatable) {
    await member.timeout(cfg.timeoutMinutes * 60_000, `Anti-lien : ${kind}`).catch(() => {});
  }
  await tempWarn(channel, `🔗 ${author}, les ${kind === "lien" ? "liens" : "invitations"} ne sont pas autorisé(e)s ici.`);
  await notify(guild, "🔗 Anti-lien", `Message de ${author} supprimé dans ${channel} (${kind}).`, COLORS.warn, [
    { name: "Contenu", value: content.slice(0, 500) },
  ]);
  return true;
}

const spamLog = new Map(); // "guildId:userId" -> [{ id, channelId, at, content }]

async function checkSpam(message) {
  const { guild, member, author, channel, content } = message;
  const cfg = getModule(guild.id, "antispam");
  if (!cfg.enabled) return;

  const now = Date.now();
  const key = `${guild.id}:${author.id}`;
  const list = (spamLog.get(key) ?? []).filter((e) => now - e.at < cfg.seconds * 1000);
  list.push({ id: message.id, channelId: channel.id, at: now, content });
  spamLog.set(key, list);

  const mentions = message.mentions.users.size + message.mentions.roles.size + (message.mentions.everyone ? 1 : 0);
  const duplicates = content ? list.filter((e) => e.content === content).length : 0;

  let reason = null;
  if (list.length >= cfg.messages) reason = "flood de messages";
  else if (duplicates >= 3) reason = "messages répétés";
  else if (mentions >= cfg.mentions) reason = "mentions en masse";
  if (!reason) return;

  spamLog.delete(key);
  const byChannel = {};
  for (const entry of list) (byChannel[entry.channelId] ??= []).push(entry.id);
  for (const [channelId, ids] of Object.entries(byChannel)) {
    await guild.channels.cache.get(channelId)?.bulkDelete(ids, true).catch(() => {});
  }
  if (cfg.timeoutMinutes > 0 && member.moderatable) {
    await member.timeout(cfg.timeoutMinutes * 60_000, `Anti-spam : ${reason}`).catch(() => {});
  }
  await tempWarn(channel, `⚠️ ${author}, arrête le spam (${reason}).`);
  await notify(guild, "💬 Anti-spam", `${author} sanctionné dans ${channel} : **${reason}**.`, COLORS.warn, [
    { name: "Messages supprimés", value: `${list.length}`, inline: true },
    { name: "Mute", value: cfg.timeoutMinutes > 0 ? `${cfg.timeoutMinutes} min` : "Aucun", inline: true },
  ]);
}

async function handleMessage(message) {
  if (!message.member || isExempt(message.member, message.channel.id)) return;
  if (await checkLinks(message)) return;
  await checkSpam(message);
}

// Nettoyage de la mémoire
setInterval(() => {
  const now = Date.now();
  for (const [key, list] of spamLog) if (!list.length || now - list[list.length - 1].at > 60_000) spamLog.delete(key);
  for (const [key, list] of joinLog) if (!list.length || now - list[list.length - 1].at > 300_000) joinLog.delete(key);
}, 60_000).unref();

module.exports = { DEFAULTS, getModule, updateModule, state, isExempt, notify, silent, handleJoin, handleMessage };
