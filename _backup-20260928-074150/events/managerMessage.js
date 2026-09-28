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
    if (response) {
      await message.channel.send({
        content: String(response)
          .replaceAll("{user}", `${message.author}`)
          .replaceAll("{server}", message.guild.name)
      });
    }
  }
};