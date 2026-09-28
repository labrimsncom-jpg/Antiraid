const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require("discord.js");
const { ok, fail } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slowdown")
    .setDescription("Active le mode lent dans un salon (0 pour le désactiver)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((o) =>
      o.setName("secondes").setDescription("Délai entre deux messages (0 à 21600)").setRequired(true).setMinValue(0).setMaxValue(21600)
    )
    .addChannelOption((o) =>
      o.setName("salon").setDescription("Salon ciblé (par défaut : celui-ci)").addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction) {
    const seconds = interaction.options.getInteger("secondes");
    const channel = interaction.options.getChannel("salon") ?? interaction.channel;
    try {
      await channel.setRateLimitPerUser(seconds, `Par ${interaction.user.tag}`);
      await interaction.reply({
        embeds: [ok(seconds === 0 ? `Mode lent désactivé dans ${channel}.` : `🐌 Mode lent de **${seconds}s** activé dans ${channel}.`)],
      });
    } catch {
      await interaction.reply({ embeds: [fail("Impossible de modifier ce salon (permission **Gérer les salons** manquante ?).")], flags: MessageFlags.Ephemeral });
    }
  },
};
