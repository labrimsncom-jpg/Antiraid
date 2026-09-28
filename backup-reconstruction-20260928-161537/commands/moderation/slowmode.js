const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Definir le slowmode d'un salon"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/slowmode")
      .setDescription("La commande **/slowmode** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
