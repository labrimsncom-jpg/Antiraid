const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("soutien")
    .setDescription("Configurer les roles de soutien"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/soutien")
      .setDescription("La commande **/soutien** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
