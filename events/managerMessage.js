const db = require("../utils/db");

function get(key, fallback) {
  try {
    const value = db.get(key);
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}

module.exports = {
  name: "messageCreate",

  async execute(message) {
    if (!message.guild || message.author.bot) return;

    // Commandes prefix personnalisees
    const prefix = get(`customPrefix:${message.guild.id}`, null);

    if (prefix && message.content.startsWith(prefix)) {
      const body = message.content.slice(prefix.length).trim();
      const parts = body.split(/\s+/);
      const name = (parts.shift() || "").toLowerCase();

      const commands = get(`customCommands:${message.guild.id}`, {});
      const custom = commands[name];

      if (custom && custom.response) {
        await message.channel.send(String(custom.response).slice(0, 2000));
        return;
      }
    }

    // XP simple, avec protection contre le spam
    const now = Date.now();
    const cooldowns = global.__serverManagerXpCooldowns || (global.__serverManagerXpCooldowns = new Map());
    const key = `${message.guild.id}:${message.author.id}`;

    if (cooldowns.has(key) && now - cooldowns.get(key) < 60000) return;
    cooldowns.set(key, now);

    const xpKey = `xp:${message.guild.id}:${message.author.id}`;
    const current = Number(get(xpKey, 0)) || 0;

    if (typeof db.set === "function") {
      db.set(xpKey, current + 10);
    }
  }
};