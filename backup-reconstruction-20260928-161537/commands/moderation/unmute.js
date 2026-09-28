const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { ok, fail } = require("../../utils/embeds");
const { reasonOf, logAction } = require("../../utils/moderation");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Retire le mute d'un membre")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName("membre").setDescription("Membre à débloquer").setRequired(true))
    .addStringOption((o) => o.setName("raison").setDescription("Raison")),

  async execute(interaction) {
    const user = interaction.options.getUser("membre");
    const reason = reasonOf(interaction);

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ embeds: [fail("Ce membre n'est pas sur le serveur.")], flags: MessageFlags.Ephemeral });
    if (!member.isCommunicationDisabled()) {
      return interaction.reply({ embeds: [fail("Ce membre n'est pas muet.")], flags: MessageFlags.Ephemeral });
    }

    try {
      await member.timeout(null, `${interaction.user.tag} : ${reason}`);
    } catch {
      return interaction.reply({ embeds: [fail("Impossible de retirer le mute.")], flags: MessageFlags.Ephemeral });
    }

    await interaction.reply({ embeds: [ok(`**${user.tag}** peut de nouveau parler.`)] });
    await logAction(interaction, { action: "Fin de mute", target: user, reason });
  },
};
