const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("formulaire")
    .setDescription("Gerer les formulaires de candidatures"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/formulaire")
      .setDescription("La commande **/formulaire** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
