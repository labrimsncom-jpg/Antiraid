const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("modlogs")
    .setDescription("Afficher la configuration des logs")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString()),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: "❌ Tu dois avoir la permission **Gérer le serveur**.",
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("📋 Modération & Logs")
      .setDescription(
        [
          "📌 **Événements surveillés**",
          "• 🔨 Bannissements",
          "• 👢 Expulsions",
          "• 🔇 Mutes",
          "• ⚠️ Avertissements",
          "• 🗑️ Messages supprimés",
          "• ✏️ Modifications du serveur",
          "• 👋 Arrivées et départs",
          "",
          "⚙️ Cette commande affiche l'état du système de logs."
        ].join("\n")
      )
      .setColor(0xFEE75C)
      .setFooter({ text: "Server Manager — Holy RP" })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
