const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("niveaux")
    .setDescription("Systeme de niveaux et XP"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/niveaux")
      .setDescription("La commande **/niveaux** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
