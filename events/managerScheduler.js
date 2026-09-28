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
            if (c?.isTextBased()) {
              await c.send({ content: r.text }).catch(() => {});
            }
            global[key] = now;
          }
        }

        if (s.statsChannels?.length) {
          for (const x of s.statsChannels) {
            const c = guild.channels.cache.get(x.id);
            if (!c) continue;

            const names = {
              members: `membres-${guild.memberCount}`,
              bots: `bots-${guild.members.cache.filter(m => m.user.bot).size}`,
              channels: `salons-${guild.channels.cache.size}`
            };

            if (names[x.type]) await c.setName(names[x.type]).catch(() => {});
          }
        }
      }
    }, 60000);
  }
};