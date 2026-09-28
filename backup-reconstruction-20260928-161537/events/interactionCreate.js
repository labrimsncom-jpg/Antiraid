const {
  Events,
  MessageFlags
} = require("discord.js");

const {
  handleTicketInteraction
} = require("../utils/tickets");

const {
  joinGiveaway
} = require("../utils/giveaways");

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        if (!interaction.inGuild()) {
          return interaction.reply({
            content:
              "Cette commande fonctionne uniquement dans un serveur.",
            flags: MessageFlags.Ephemeral
          });
        }

        const command =
          interaction.client.commands.get(
            interaction.commandName
          );

        if (command) {
          await command.execute(interaction);
        }

        return;
      }

      if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
        const id = interaction.customId || "";

        if (id.startsWith("ticket_")) {
          await handleTicketInteraction(interaction);
          return;
        }

        if (id.startsWith("gw_join:")) {
          await joinGiveaway(interaction);
        }
      }
    } catch (error) {
      console.error(
        "Erreur interaction :",
        error
      );

      const payload = {
        content: "Une erreur est survenue.",
        flags: MessageFlags.Ephemeral
      };

      if (
        interaction.replied ||
        interaction.deferred
      ) {
        await interaction
          .followUp(payload)
          .catch(() => {});
      } else {
        await interaction
          .reply(payload)
          .catch(() => {});
      }
    }
  }
};