const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("quiz")
    .setDescription("Repondre a une question de culture generale"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/quiz")
      .setDescription("La commande **/quiz** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
