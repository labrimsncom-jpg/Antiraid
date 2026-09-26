const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require("discord.js");

const { showTicketConfig } = require("../../utils/tickets");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-config")
    .setDescription("Configurer le système de tickets Holy RP")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild.toString()
    ),

  async execute(interaction) {
    if (
      !interaction.memberPermissions?.has(
        PermissionFlagsBits.ManageGuild
      )
    ) {
      return interaction.reply({
        content:
          "❌ Tu dois avoir la permission **Gérer le serveur**.",
        flags: MessageFlags.Ephemeral
      });
    }

    await showTicketConfig(interaction);
  }
};
