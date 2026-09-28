const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { ok, fail } = require("../../utils/embeds");
const { checkHierarchy, reasonOf, dm, logAction } = require("../../utils/moderation");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Rend un membre muet pendant une durée")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName("membre").setDescription("Membre à rendre muet").setRequired(true))
    .addIntegerOption((o) =>
      o
        .setName("duree")
        .setDescription("Durée du mute")
        .setRequired(true)
        .addChoices(
          { name: "1 minute", value: 1 },
          { name: "5 minutes", value: 5 },
          { name: "10 minutes", value: 10 },
          { name: "1 heure", value: 60 },
          { name: "1 jour", value: 1440 },
          { name: "1 semaine", value: 10080 }
        )
    )
    .addStringOption((o) => o.setName("raison").setDescription("Raison du mute")),

  async execute(interaction) {
    const user = interaction.options.getUser("membre");
    const minutes = interaction.options.getInteger("duree");
    const reason = reasonOf(interaction);

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ embeds: [fail("Ce membre n'est pas sur le serveur.")], flags: MessageFlags.Ephemeral });

    const error = checkHierarchy(interaction, member);
    if (error) return interaction.reply({ embeds: [fail(error)], flags: MessageFlags.Ephemeral });

    try {
      await member.timeout(minutes * 60_000, `${interaction.user.tag} : ${reason}`);
    } catch {
      return interaction.reply({
        embeds: [fail("Impossible de rendre ce membre muet (il me manque la permission **Exclure temporairement des membres** ?).")],
        flags: MessageFlags.Ephemeral,
      });
    }

    const until = `<t:${Math.floor((Date.now() + minutes * 60_000) / 1000)}:R>`;
    await dm(user, `🔇 Tu as été rendu muet sur **${interaction.guild.name}**.\nRaison : ${reason}`);
    await interaction.reply({ embeds: [ok(`**${user.tag}** est muet (fin ${until}).\nRaison : ${reason}`)] });
    await logAction(interaction, {
      action: "Mute (timeout)",
      target: user,
      reason,
      fields: [{ name: "Fin", value: until, inline: true }],
    });
  },
};
