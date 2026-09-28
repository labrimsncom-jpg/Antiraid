const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require("discord.js");
const { ok, fail } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Verrouille un salon : les membres ne peuvent plus écrire")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((o) =>
      o.setName("salon").setDescription("Salon à verrouiller (par défaut : celui-ci)").addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel("salon") ?? interaction.channel;
    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }, { reason: `Par ${interaction.user.tag}` });
      await interaction.reply({ embeds: [ok(`🔒 ${channel} est verrouillé.`)] });
    } catch {
      await interaction.reply({ embeds: [fail("Impossible de verrouiller ce salon (permission **Gérer les salons** manquante ?).")], flags: MessageFlags.Ephemeral });
    }
  },
};
