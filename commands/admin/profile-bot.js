const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile-bot")
    .setDescription("Configurer le profil du bot sur ce serveur"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/profile-bot")
      .setDescription("La commande **/profile-bot** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
