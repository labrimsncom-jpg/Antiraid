const { Events, ActivityType } = require("discord.js");

module.exports = [
  {
    name: Events.GuildCreate,
    async execute(guild) {
      const client = guild.client;
      client.user.setPresence({
        status: "online",
        activities: [{ name: `/help | ${client.guilds.cache.size} serveur(s)`, type: ActivityType.Watching }]
      });
    }
  },
  {
    name: Events.GuildDelete,
    async execute(guild) {
      const client = guild.client;
      client.user.setPresence({
        status: "online",
        activities: [{ name: `/help | ${client.guilds.cache.size} serveur(s)`, type: ActivityType.Watching }]
      });
    }
  }
];