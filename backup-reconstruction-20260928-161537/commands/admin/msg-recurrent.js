const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("msg-recurrent")
    .setDescription("Configurer les messages recurrents du serveur"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/msg-recurrent")
      .setDescription("La commande **/msg-recurrent** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
