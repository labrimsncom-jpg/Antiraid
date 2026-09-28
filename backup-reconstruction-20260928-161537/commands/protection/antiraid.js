const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { getModule, updateModule, state } = require("../../utils/shield");
const { ok, info } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("antiraid")
    .setDescription("Configure l'anti-raid (arrivées en rafale, âge minimum des comptes)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName("activer")
        .setDescription("Active ou désactive l'anti-raid")
        .addBooleanOption((o) => o.setName("actif").setDescription("true = activer, false = désactiver").setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName("config")
        .setDescription("Règle la détection")
        .addIntegerOption((o) => o.setName("arrivees").setDescription("Arrivées qui déclenchent le raid (2 à 50)").setMinValue(2).setMaxValue(50))
        .addIntegerOption((o) => o.setName("secondes").setDescription("Fenêtre de détection en secondes (2 à 120)").setMinValue(2).setMaxValue(120))
        .addStringOption((o) =>
          o
            .setName("sanction")
            .setDescription("Sanction appliquée aux raiders")
            .addChoices({ name: "Expulser (kick)", value: "kick" }, { name: "Bannir", value: "ban" })
        )
        .addIntegerOption((o) => o.setName("age_minimum").setDescription("Âge minimum du compte en jours (0 = aucun, max 365)").setMinValue(0).setMaxValue(365))
        .addIntegerOption((o) => o.setName("duree_raid").setDescription("Durée du mode raid en minutes (1 à 120)").setMinValue(1).setMaxValue(120))
    )
    .addSubcommand((s) => s.setName("statut").setDescription("Affiche la configuration de l'anti-raid")),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();
    const reply = (embed) => interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    if (sub === "activer") {
      const on = interaction.options.getBoolean("actif");
      updateModule(guildId, "antiraid", { enabled: on, ...(on ? {} : { raidUntil: 0 }) });
      return reply(ok(`Anti-raid ${on ? "activé" : "désactivé"}.`));
    }

    if (sub === "config") {
      const o = interaction.options;
      const patch = {};
      if (o.getInteger("arrivees") !== null) patch.joins = o.getInteger("arrivees");
      if (o.getInteger("secondes") !== null) patch.seconds = o.getInteger("secondes");
      if (o.getString("sanction")) patch.action = o.getString("sanction");
      if (o.getInteger("age_minimum") !== null) patch.minAccountDays = o.getInteger("age_minimum");
      if (o.getInteger("duree_raid") !== null) patch.raidMinutes = o.getInteger("duree_raid");
      if (!Object.keys(patch).length) return reply(ok("Aucun changement demandé."));
      updateModule(guildId, "antiraid", patch);
    }

    const cfg = getModule(guildId, "antiraid");
    const embed = info("🛡️ Anti-raid").addFields(
      { name: "État", value: state(cfg.enabled), inline: true },
      { name: "Détection", value: `${cfg.joins} arrivées / ${cfg.seconds}s`, inline: true },
      { name: "Sanction", value: cfg.action === "ban" ? "Ban" : "Kick", inline: true },
      { name: "Âge minimum du compte", value: cfg.minAccountDays > 0 ? `${cfg.minAccountDays} jour(s)` : "Aucun", inline: true },
      { name: "Durée du mode raid", value: `${cfg.raidMinutes} min`, inline: true },
      { name: "Mode raid", value: cfg.raidUntil > Date.now() ? "🚨 Actif" : "Inactif", inline: true }
    );
    return reply(embed);
  },
};