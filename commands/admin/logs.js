const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("logs")
    .setDescription("Activer ou configurer le systeme de logs"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/logs")
      .setDescription("La commande **/logs** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
