const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fermer-ticket")
    .setDescription("Fermer le ticket de ce salon"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/fermer-ticket")
      .setDescription("La commande **/fermer-ticket** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
