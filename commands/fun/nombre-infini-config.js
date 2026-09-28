const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nombre-infini-config")
    .setDescription("Configurer le jeu du comptage"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/nombre-infini-config")
      .setDescription("La commande **/nombre-infini-config** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
