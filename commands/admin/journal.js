const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("journal")
    .setDescription("Configurer le journal automatique du serveur"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/journal")
      .setDescription("La commande **/journal** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
