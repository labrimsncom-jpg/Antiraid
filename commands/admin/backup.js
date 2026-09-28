const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("backup")
    .setDescription("Sauvegardes du serveur"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/backup")
      .setDescription("La commande **/backup** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
