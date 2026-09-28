const { Events, ActivityType } = require("discord.js");

function updatePresence(client) {
  if (!client.user) return;

  client.user.setPresence({
    status: "online",
    activities: [
      {
        name: `/help | ${client.guilds.cache.size} serveur(s)`,
        type: ActivityType.Watching
      }
    ]
  });
}

module.exports = [
  {
    name: Events.GuildCreate,
    async execute(guild) {
      updatePresence(guild.client);
    }
  },
  {
    name: Events.GuildDelete,
    async execute(guild) {
      updatePresence(guild.client);
    }
  }
];