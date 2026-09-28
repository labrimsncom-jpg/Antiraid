const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("staff-depart")
    .setDescription("Configurer le depart automatique pour le staff"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/staff-depart")
      .setDescription("La commande **/staff-depart** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
