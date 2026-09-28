const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { ok, fail } = require("../../utils/embeds");
const { checkHierarchy, reasonOf, dm, logAction } = require("../../utils/moderation");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulse un membre du serveur")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((o) => o.setName("membre").setDescription("Membre à expulser").setRequired(true))
    .addStringOption((o) => o.setName("raison").setDescription("Raison de l'expulsion")),

  async execute(interaction) {
    const user = interaction.options.getUser("membre");
    const reason = reasonOf(interaction);

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ embeds: [fail("Il me faut la permission **Expulser des membres**.")], flags: MessageFlags.Ephemeral });
    }

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ embeds: [fail("Ce membre n'est pas sur le serveur.")], flags: MessageFlags.Ephemeral });

    const error = checkHierarchy(interaction, member);
    if (error) return interaction.reply({ embeds: [fail(error)], flags: MessageFlags.Ephemeral });

    await dm(user, `👢 Tu as été expulsé de **${interaction.guild.name}**.\nRaison : ${reason}`);
    try {
      await member.kick(`${interaction.user.tag} : ${reason}`);
    } catch {
      return interaction.reply({ embeds: [fail("Impossible d'expulser ce membre.")], flags: MessageFlags.Ephemeral });
    }

    await interaction.reply({ embeds: [ok(`**${user.tag}** a été expulsé.\nRaison : ${reason}`)] });
    await logAction(interaction, { action: "Expulsion", target: user, reason });
  },
};
