const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const db = require("../../utils/db");
const { ok, fail } = require("../../utils/embeds");
const { checkHierarchy, reasonOf, dm, logAction } = require("../../utils/moderation");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Donne un avertissement à un membre")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName("membre").setDescription("Membre à avertir").setRequired(true))
    .addStringOption((o) => o.setName("raison").setDescription("Raison de l'avertissement").setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser("membre");
    const reason = reasonOf(interaction);

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ embeds: [fail("Ce membre n'est pas sur le serveur.")], flags: MessageFlags.Ephemeral });

    const error = checkHierarchy(interaction, member);
    if (error) return interaction.reply({ embeds: [fail(error)], flags: MessageFlags.Ephemeral });

    const total = db.addWarning(interaction.guild.id, user.id, {
      id: Date.now().toString(36),
      moderatorId: interaction.user.id,
      reason,
      date: Date.now(),
    });

    await dm(user, `⚠️ Tu as reçu un avertissement sur **${interaction.guild.name}**.\nRaison : ${reason}`);
    await interaction.reply({ embeds: [ok(`**${user.tag}** a reçu un avertissement (total : **${total}**).\nRaison : ${reason}`)] });
    await logAction(interaction, {
      action: "Avertissement",
      target: user,
      reason,
      fields: [{ name: "Total", value: `${total}`, inline: true }],
    });
  },
};
