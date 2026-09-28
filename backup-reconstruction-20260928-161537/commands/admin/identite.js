const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("identite")
    .setDescription("Afficher votre carte d'identite staff ou configurer le systeme"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/identite")
      .setDescription("La commande **/identite** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
