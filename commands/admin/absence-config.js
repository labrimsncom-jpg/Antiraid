const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("absence-config")
    .setDescription("Declarer une absence ou configurer le systeme d'absences"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/absence-config")
      .setDescription("La commande **/absence-config** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
