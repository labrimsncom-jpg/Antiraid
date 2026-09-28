const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Faire envoyer un message texte par le bot"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/say")
      .setDescription("La commande **/say** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
