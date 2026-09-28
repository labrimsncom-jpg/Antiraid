const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sumall")
    .setDescription("Voir les heures de service"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/sumall")
      .setDescription("La commande **/sumall** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
