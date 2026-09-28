
const { Events, ActivityType } = require("discord.js");
const { rescheduleAll } = require("../utils/giveaways");

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);

    try {
      // Supprime les anciennes commandes de serveur
      for (const guild of client.guilds.cache.values()) {
        await guild.commands.set([]);
      }

      console.log("🧹 Anciennes commandes de serveur supprimées");

      // Enregistre les commandes globales
      const commands = client.commands.map((command) =>
        command.data.toJSON()
      );

      await client.application.commands.set(commands);

      console.log(`📦 ${commands.length} commande(s) enregistrée(s)`);

    } catch (error) {
      console.error("❌ Erreur lors de l'enregistrement des commandes :", error);
    }

    // Relance les giveaways
    rescheduleAll(client);

    // Présence du bot
    client.user.setPresence({
      status: "online",
      activities: [
        {
          name: `/help • ${client.guilds.cache.size} serveur(s)`,
          type: ActivityType.Watching,
        },
      ],
    });

    console.log("🚀 Bot prêt !");
  },
};