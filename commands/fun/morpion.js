const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("morpion")
    .setDescription("Jouer au morpion contre un autre membre"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/morpion")
      .setDescription("La commande **/morpion** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
