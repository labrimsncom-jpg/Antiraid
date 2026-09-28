const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("protection")
    .setDescription("Afficher l'état des protections")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString()),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: "❌ Tu dois avoir la permission **Gérer le serveur**.",
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("🛡️ Protections du serveur")
      .setDescription(
        [
          "🟢 **Anti-Raid** — Disponible",
          "🟢 **Anti-Spam** — Actif",
          "🟢 **Anti-Link** — Actif",
          "🟢 **Anti-Mass Mention** — Actif",
          "🟢 **Protection Anti-Bot** — Active",
          "🟢 **Protection des permissions** — Active",
          "",
          "⚙️ Utilise `/raidmode` pour gérer le mode raid."
        ].join("\n")
      )
      .setColor(0x57F287)
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
