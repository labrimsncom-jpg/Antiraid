const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("forcer-service")
    .setDescription("Forcer la fin de service d'un moderateur"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/forcer-service")
      .setDescription("La commande **/forcer-service** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
