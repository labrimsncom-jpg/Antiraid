const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("topinvites")
    .setDescription("Classement des membres qui ont le plus invite"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/topinvites")
      .setDescription("La commande **/topinvites** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
