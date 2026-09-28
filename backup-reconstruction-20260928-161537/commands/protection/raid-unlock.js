const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("raid-unlock")
    .setDescription("Deverrouiller le serveur"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/raid-unlock")
      .setDescription("La commande **/raid-unlock** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
