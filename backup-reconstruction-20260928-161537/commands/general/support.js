const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("support")
    .setDescription("Lien vers le serveur de support"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/support")
      .setDescription("La commande **/support** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
