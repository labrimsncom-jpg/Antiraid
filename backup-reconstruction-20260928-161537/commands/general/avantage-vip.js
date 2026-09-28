const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avantage-vip")
    .setDescription("Afficher les avantages VIP du bot et du serveur"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/avantage-vip")
      .setDescription("La commande **/avantage-vip** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
