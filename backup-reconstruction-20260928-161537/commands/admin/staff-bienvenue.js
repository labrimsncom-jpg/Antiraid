const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("staff-bienvenue")
    .setDescription("Configurer la bienvenue automatique pour le staff"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/staff-bienvenue")
      .setDescription("La commande **/staff-bienvenue** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
