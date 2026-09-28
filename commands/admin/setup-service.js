const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-service")
    .setDescription("Configurer le systeme de prise de service"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/setup-service")
      .setDescription("La commande **/setup-service** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
