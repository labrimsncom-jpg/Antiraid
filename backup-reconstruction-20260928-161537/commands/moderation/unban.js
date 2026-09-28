const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { ok, fail } = require("../../utils/embeds");
const { reasonOf, logAction } = require("../../utils/moderation");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Débannit un utilisateur grâce à son ID")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((o) => o.setName("id").setDescription("ID de l'utilisateur banni").setRequired(true))
    .addStringOption((o) => o.setName("raison").setDescription("Raison du débannissement")),

  async execute(interaction) {
    const id = interaction.options.getString("id").trim();
    const reason = reasonOf(interaction);

    const ban = await interaction.guild.bans.fetch(id).catch(() => null);
    if (!ban) {
      return interaction.reply({ embeds: [fail("Aucun bannissement trouvé pour cet ID.")], flags: MessageFlags.Ephemeral });
    }

    try {
      await interaction.guild.bans.remove(id, `${interaction.user.tag} : ${reason}`);
    } catch {
      return interaction.reply({ embeds: [fail("Impossible de débannir cet utilisateur.")], flags: MessageFlags.Ephemeral });
    }

    await interaction.reply({ embeds: [ok(`**${ban.user.tag}** a été débanni.`)] });
    await logAction(interaction, { action: "Débannissement", target: ban.user, reason, color: 0x57f287 });
  },
};
