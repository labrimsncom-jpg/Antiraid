const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { ok, fail } = require("../../utils/embeds");
const { checkHierarchy, reasonOf, dm, logAction } = require("../../utils/moderation");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bannit un membre du serveur")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName("membre").setDescription("Membre à bannir").setRequired(true))
    .addStringOption((o) => o.setName("raison").setDescription("Raison du bannissement"))
    .addIntegerOption((o) =>
      o.setName("jours").setDescription("Jours de messages à supprimer (0 à 7)").setMinValue(0).setMaxValue(7)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("membre");
    const reason = reasonOf(interaction);
    const days = interaction.options.getInteger("jours") ?? 0;

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ embeds: [fail("Il me faut la permission **Bannir des membres**.")], flags: MessageFlags.Ephemeral });
    }

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    const error = member ? checkHierarchy(interaction, member) : user.id === interaction.user.id ? "Tu ne peux pas te bannir toi-même." : null;
    if (error) return interaction.reply({ embeds: [fail(error)], flags: MessageFlags.Ephemeral });

    await dm(user, `🔨 Tu as été banni de **${interaction.guild.name}**.\nRaison : ${reason}`);
    try {
      await interaction.guild.members.ban(user, {
        reason: `${interaction.user.tag} : ${reason}`,
        deleteMessageSeconds: days * 86400,
      });
    } catch {
      return interaction.reply({ embeds: [fail("Impossible de bannir ce membre.")], flags: MessageFlags.Ephemeral });
    }

    await interaction.reply({ embeds: [ok(`**${user.tag}** a été banni.\nRaison : ${reason}`)] });
    await logAction(interaction, { action: "Bannissement", target: user, reason });
  },
};
