const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hierarchie-config")
    .setDescription("Ouvrir le panneau de configuration de l'effectif hierarchique"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/hierarchie-config")
      .setDescription("La commande **/hierarchie-config** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
