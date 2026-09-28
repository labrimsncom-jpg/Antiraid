const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("role-reaction")
    .setDescription("Gestion des panneaux de roles reactions"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("/role-reaction")
      .setDescription("La commande **/role-reaction** est disponible.")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
