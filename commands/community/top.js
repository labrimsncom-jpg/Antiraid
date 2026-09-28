const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("top")
    .setDescription("Classement XP du serveur"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/top")
      .setDescription("La commande **/top** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
