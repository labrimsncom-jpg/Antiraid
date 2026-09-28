const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-tempvoice")
    .setDescription("Configurer les salons vocaux temporaires"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/setup-tempvoice")
      .setDescription("La commande **/setup-tempvoice** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
