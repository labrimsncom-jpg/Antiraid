const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getModule, state } = require("../../utils/shield");
const { info } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("protection")
    .setDescription("Affiche l'état de toutes les protections du serveur")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const id = interaction.guild.id;
    const raid = getModule(id, "antiraid");
    const spam = getModule(id, "antispam");
    const link = getModule(id, "antilink");
    const raidActive = raid.raidUntil > Date.now();

    const embed = info("🛡️ Protections du serveur").addFields(
      {
        name: "Anti-raid",
        value: `${state(raid.enabled)}\n${raid.joins} arrivées / ${raid.seconds}s → ${raid.action === "ban" ? "ban" : "kick"}${raidActive ? "\n🚨 **Mode raid actif**" : ""}`,
        inline: true,
      },
      {
        name: "Anti-spam",
        value: `${state(spam.enabled)}\n${spam.messages} msg / ${spam.seconds}s • ${spam.mentions} mentions`,
        inline: true,
      },
      {
        name: "Anti-lien",
        value: `${state(link.enabled)}\n${link.mode === "all" ? "Tous les liens" : "Invitations"}`,
        inline: true,
      }
    );
    embed.setFooter({ text: "Configure avec /antiraid, /antispam, /antilink et /bypass." });
    await interaction.reply({ embeds: [embed] });
  },
};
