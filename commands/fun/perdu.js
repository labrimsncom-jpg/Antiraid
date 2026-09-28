const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("perdu")
    .setDescription("Jouer au perdu"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/perdu")
      .setDescription("La commande **/perdu** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
