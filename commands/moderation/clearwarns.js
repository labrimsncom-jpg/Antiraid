const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("../../utils/db");
const { ok } = require("../../utils/embeds");
const { logAction } = require("../../utils/moderation");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clearwarns")
    .setDescription("Supprime tous les avertissements d'un membre")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName("membre").setDescription("Membre").setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser("membre");
    const count = db.clearWarnings(interaction.guild.id, user.id);

    await interaction.reply({ embeds: [ok(`${count} avertissement(s) supprimé(s) pour **${user.tag}**.`)] });
    await logAction(interaction, { action: "Avertissements effacés", target: user, reason: `${count} avertissement(s) supprimé(s)`, color: 0x57f287 });
  },
};
