const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("serveurs")
    .setDescription("Liste paginee des serveurs avec invitations"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/serveurs")
      .setDescription("La commande **/serveurs** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
