const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats-channels")
    .setDescription("Gerer les salons de statistiques")
    .addSubcommand(s => s.setName("creer").setDescription("Gestion de creer"))
    .addSubcommand(s => s.setName("liste").setDescription("Gestion de liste"))
    .addSubcommand(s => s.setName("supprimer").setDescription("Gestion de supprimer"))

  ,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand(false) || "default";

    const embed = new EmbedBuilder()
      .setTitle("/stats-channels")
      .setDescription("Sous-commande : **" + sub + "**")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
