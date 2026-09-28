const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Statistiques du serveur"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/stats")
      .setDescription("La commande **/stats** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
