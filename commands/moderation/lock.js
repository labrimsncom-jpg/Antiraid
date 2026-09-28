const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} = require("discord.js");

const { ok, fail } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Verrouille ou déverrouille un salon")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((o) =>
      o
        .setName("action")
        .setDescription("Action à effectuer")
        .setRequired(true)
        .addChoices(
          { name: "Verrouiller", value: "lock" },
          { name: "Déverrouiller", value: "unlock" }
        )
    )
    .addChannelOption((o) =>
      o
        .setName("salon")
        .setDescription("Salon concerné (par défaut : celui-ci)")
        .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction) {
    const action = interaction.options.getString("action");
    const channel =
      interaction.options.getChannel("salon") ?? interaction.channel;

    try {
      if (action === "lock") {
        await channel.permissionOverwrites.edit(
          interaction.guild.roles.everyone,
          { SendMessages: false },
          { reason: `Par ${interaction.user.tag}` }
        );

        return interaction.reply({
          embeds: [ok(`🔒 ${channel} est verrouillé.`)],
        });
      }

      await channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        { SendMessages: null },
        { reason: `Par ${interaction.user.tag}` }
      );

      return interaction.reply({
        embeds: [ok(`🔓 ${channel} est déverrouillé.`)],
      });
    } catch {
      return interaction.reply({
        embeds: [
          fail(
            "Impossible de modifier ce salon (permission **Gérer les salons** manquante ?)."
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};