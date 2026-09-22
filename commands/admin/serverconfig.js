const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("serverconfig")
    .setDescription("Afficher la configuration du serveur")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString()),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: "❌ Tu dois avoir la permission **Gérer le serveur**.",
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("⚙️ Configuration — Holy RP")
      .setDescription(
        [
          "🛡️ **PROTECTIONS**",
          "• `/protection` — Voir les protections",
          "• `/raidmode` — Gérer le mode raid",
          "• Anti-Spam — Actif",
          "• Anti-Link — Actif",
          "",
          "📋 **MODÉRATION & LOGS**",
          "• `/modlogs` — Configuration des logs",
          "• `/warn` — Avertir un membre",
          "• `/warnings` — Voir les avertissements",
          "• `/clear` — Supprimer des messages",
          "",
          "📢 **COMMUNICATION**",
          "• `/announce` — Envoyer une annonce",
          "",
          "🔧 **ADMINISTRATION**",
          "• `/setup` — Configuration initiale",
          "• `/automod` — Activer l'AutoMod",
          "• `/botprofile` — Modifier le profil du bot"
        ].join("\n")
      )
      .setColor(0x5865F2)
      .setFooter({ text: "Server Manager — Holy RP" })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
