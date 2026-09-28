const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cmd-config")
    .setDescription("Gerer les commandes personnalisees")
    .addSubcommand(s => s.setName("add").setDescription("Gestion de add"))
    .addSubcommand(s => s.setName("liste").setDescription("Gestion de liste"))
    .addSubcommand(s => s.setName("prefix").setDescription("Gestion de prefix"))
    .addSubcommand(s => s.setName("supprimer").setDescription("Gestion de supprimer"))

  ,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand(false) || "default";

    const embed = new EmbedBuilder()
      .setTitle("/cmd-config")
      .setDescription("Sous-commande : **" + sub + "**")
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
