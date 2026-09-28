const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avis-staff")
    .setDescription("Donner un avis sur un membre du staff"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/avis-staff")
      .setDescription("La commande **/avis-staff** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
