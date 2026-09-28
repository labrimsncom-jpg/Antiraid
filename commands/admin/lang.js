const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lang")
    .setDescription("Choisir la langue du bot"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/lang")
      .setDescription("La commande **/lang** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
