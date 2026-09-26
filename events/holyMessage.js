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
