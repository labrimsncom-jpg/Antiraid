const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unwarn")
    .setDescription("Retirer un avertissement"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/unwarn")
      .setDescription("La commande **/unwarn** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
