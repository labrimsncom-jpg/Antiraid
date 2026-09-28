const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-config")
    .setDescription("Configurer le systeme de tickets"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/ticket-config")
      .setDescription("La commande **/ticket-config** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
