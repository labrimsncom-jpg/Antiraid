const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { getModule, updateModule, state } = require("../../utils/shield");
const { ok, info } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("antispam")
    .setDescription("Configure l'anti-spam (flood, messages répétés, mentions en masse)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName("activer")
        .setDescription("Active ou désactive l'anti-spam")
        .addBooleanOption((o) => o.setName("actif").setDescription("true = activer, false = désactiver").setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName("config")
        .setDescription("Règle la détection")
        .addIntegerOption((o) => o.setName("messages").setDescription("Messages qui déclenchent le flood (2 à 20)").setMinValue(2).setMaxValue(20))
        .addIntegerOption((o) => o.setName("secondes").setDescription("Fenêtre de détection en secondes (2 à 60)").setMinValue(2).setMaxValue(60))
        .addIntegerOption((o) => o.setName("mentions").setDescription("Mentions dans un message (2 à 30)").setMinValue(2).setMaxValue(30))
        .addIntegerOption((o) => o.setName("mute").setDescription("Durée du mute en minutes (0 = aucun, max 1440)").setMinValue(0).setMaxValue(1440))
    )
    .addSubcommand((s) => s.setName("statut").setDescription("Affiche la configuration de l'anti-spam")),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();
    const reply = (embed) => interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    if (sub === "activer") {
      const on = interaction.options.getBoolean("actif");
      updateModule(guildId, "antispam", { enabled: on });
      return reply(ok(`Anti-spam ${on ? "activé" : "désactivé"}.`));
    }

    if (sub === "config") {
      const o = interaction.options;
      const patch = {};
      if (o.getInteger("messages") !== null) patch.messages = o.getInteger("messages");
      if (o.getInteger("secondes") !== null) patch.seconds = o.getInteger("secondes");
      if (o.getInteger("mentions") !== null) patch.mentions = o.getInteger("mentions");
      if (o.getInteger("mute") !== null) patch.timeoutMinutes = o.getInteger("mute");
      if (!Object.keys(patch).length) return reply(ok("Aucun changement demandé."));
      updateModule(guildId, "antispam", patch);
    }

    const cfg = getModule(guildId, "antispam");
    const embed = info("💬 Anti-spam").addFields(
      { name: "État", value: state(cfg.enabled), inline: true },
      { name: "Flood", value: `${cfg.messages} messages / ${cfg.seconds}s`, inline: true },
      { name: "Mentions", value: `${cfg.mentions} max`, inline: true },
      { name: "Mute", value: cfg.timeoutMinutes > 0 ? `${cfg.timeoutMinutes} min` : "Aucun", inline: true }
    );
    return reply(embed);
  },
};