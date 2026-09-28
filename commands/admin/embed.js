const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Envoyer un embed dans un salon"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/embed")
      .setDescription("La commande **/embed** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
