const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reglement")
    .setDescription("Gestion du reglement"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/reglement")
      .setDescription("La commande **/reglement** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
