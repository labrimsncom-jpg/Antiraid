const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avis")
    .setDescription("Donner un avis ou configurer le systeme"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/avis")
      .setDescription("La commande **/avis** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
