const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("servericon")
    .setDescription("Afficher la photo de profil du serveur"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/servericon")
      .setDescription("La commande **/servericon** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
