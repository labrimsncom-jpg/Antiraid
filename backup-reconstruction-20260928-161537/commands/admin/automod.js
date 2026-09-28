const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { getModule, updateModule, state } = require("../../utils/shield");
const { info } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Active automatiquement toutes les protections du serveur")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    // Une seule commande : toutes les protections sont activées avec des réglages sûrs.
    updateModule(guildId, "antilink", {
      enabled: true,
      mode: "all",
      timeoutMinutes: 0,
    });
    updateModule(guildId, "antispam", {
      enabled: true,
    });
    updateModule(guildId, "antiraid", {
      enabled: true,
    });

    const link = getModule(guildId, "antilink");
    const spam = getModule(guildId, "antispam");
    const raid = getModule(guildId, "antiraid");

    const embed = info("🛡️ AutoMod activé")
      .setDescription("Les trois protections sont maintenant actives. Aucun mot interdit n'est nécessaire.")
      .addFields(
        {
          name: "🔗 Anti-lien",
          value: `${state(link.enabled)}\nTous les liens\nInvitations Discord bloquées`,
          inline: true,
        },
        {
          name: "💬 Anti-spam",
          value: `${state(spam.enabled)}\n${spam.messages} messages / ${spam.seconds}s\nMentions : ${spam.mentions}`,
          inline: true,
        },
        {
          name: "🛡️ Anti-raid",
          value: `${state(raid.enabled)}\n${raid.joins} arrivées / ${raid.seconds}s\nSanction : ${raid.action}`,
          inline: true,
        }
      );

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
