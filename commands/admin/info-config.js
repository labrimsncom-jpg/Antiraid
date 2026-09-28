const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info-config")
    .setDescription("Configuration des panneaux d'informations"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/info-config")
      .setDescription("La commande **/info-config** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
