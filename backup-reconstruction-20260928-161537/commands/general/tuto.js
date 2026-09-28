const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tuto")
    .setDescription("Guide de configuration des commandes"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/tuto")
      .setDescription("La commande **/tuto** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
