const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("support-vocal")
    .setDescription("Gerer le systeme de support vocal"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/support-vocal")
      .setDescription("La commande **/support-vocal** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
