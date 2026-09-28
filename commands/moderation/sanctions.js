const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sanctions")
    .setDescription("Consulter les sanctions d'un membre"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/sanctions")
      .setDescription("La commande **/sanctions** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
