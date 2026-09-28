const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("raid-lock")
    .setDescription("Verrouiller immediatement le serveur en cas de raid"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/raid-lock")
      .setDescription("La commande **/raid-lock** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
