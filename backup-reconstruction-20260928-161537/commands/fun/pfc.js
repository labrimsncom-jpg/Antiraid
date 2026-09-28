const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pfc")
    .setDescription("Pierre Feuille Ciseaux"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/pfc")
      .setDescription("La commande **/pfc** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
