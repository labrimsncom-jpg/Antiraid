const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("serverbanner")
    .setDescription("Afficher la banniere du serveur"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/serverbanner")
      .setDescription("La commande **/serverbanner** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
