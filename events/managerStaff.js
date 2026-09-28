const { Events } = require("discord.js");
const db = require("../utils/db");

function get(key, fallback) {
  try {
    const value = db.get(key);
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}

module.exports = [
  {
    name: Events.GuildMemberAdd,
    async execute(member) {
      const channelId = get(`staffWelcome:${member.guild.id}`, null);
      if (!channelId) return;

      const channel = member.guild.channels.cache.get(channelId);
      if (!channel || !channel.isTextBased()) return;

      await channel.send(
        `Bienvenue dans le staff ${member} !`
      ).catch(() => {});
    }
  },
  {
    name: Events.GuildMemberRemove,
    async execute(member) {
      const channelId = get(`staffDepart:${member.guild.id}`, null);
      if (!channelId) return;

      const channel = member.guild.channels.cache.get(channelId);
      if (!channel || !channel.isTextBased()) return;

      await channel.send(
        `${member.user?.tag || "Un membre"} a quitte le serveur.`
      ).catch(() => {});
    }
  }
];