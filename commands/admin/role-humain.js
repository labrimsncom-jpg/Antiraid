const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("role-humain")
    .setDescription("Ajouter ou retirer un role en masse"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/role-humain")
      .setDescription("La commande **/role-humain** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
