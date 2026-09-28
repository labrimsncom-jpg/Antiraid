const { Events } = require("discord.js");
const db = require("../utils/db");

async function send(member, key, text) {
  const s = db.getSettings(member.guild.id);

  if (!s[key] || !s.hierarchyRoleId || !member.roles.cache.has(s.hierarchyRoleId)) return;

  const c = await member.guild.channels.fetch(s[key]).catch(() => null);
  if (c?.isTextBased()) await c.send({ content: text }).catch(() => {});
}

module.exports = [
  {
    name: Events.GuildMemberAdd,
    async execute(member) {
      await send(member, "staffWelcomeChannelId", `Bienvenue staff ${member} !`);
    }
  },
  {
    name: Events.GuildMemberRemove,
    async execute(member) {
      await send(member, "staffLeaveChannelId", `Depart staff : ${member}.`);
    }
  }
];