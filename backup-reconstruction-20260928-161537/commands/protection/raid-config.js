const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("raid-config")
    .setDescription("Configurer le systeme anti-raid et anti-nuke"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/raid-config")
      .setDescription("La commande **/raid-config** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
