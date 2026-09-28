const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { getModule, updateModule, state } = require("../../utils/shield");
const { ok, fail, info } = require("../../utils/embeds");

// Nettoie un domaine saisi : "https://www.Exemple.com/page" -> "exemple.com"
function cleanDomain(input) {
  try {
    return new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("antilink")
    .setDescription("Configure l'anti-lien (invitations Discord ou tous les liens)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName("activer")
        .setDescription("Active ou désactive l'anti-lien")
        .addBooleanOption((o) => o.setName("actif").setDescription("true = activer, false = désactiver").setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName("mode")
        .setDescription("Choisit ce qui est bloqué")
        .addStringOption((o) =>
          o
            .setName("type")
            .setDescription("Type de liens bloqués")
            .setRequired(true)
            .addChoices({ name: "Invitations Discord uniquement", value: "invites" }, { name: "Tous les liens", value: "all" })
        )
    )
    .addSubcommand((s) =>
      s
        .setName("mute")
        .setDescription("Mute automatique après un lien interdit")
        .addIntegerOption((o) => o.setName("minutes").setDescription("Durée en minutes (0 = aucun, max 1440)").setRequired(true).setMinValue(0).setMaxValue(1440))
    )
    .addSubcommand((s) =>
      s
        .setName("autoriser")
        .setDescription("Autorise un domaine (mode « tous les liens »)")
        .addStringOption((o) => o.setName("domaine").setDescription("Ex : youtube.com").setRequired(true).setMaxLength(100))
    )
    .addSubcommand((s) =>
      s
        .setName("retirer")
        .setDescription("Retire un domaine autorisé")
        .addStringOption((o) => o.setName("domaine").setDescription("Ex : youtube.com").setRequired(true).setMaxLength(100))
    )
    .addSubcommand((s) => s.setName("statut").setDescription("Affiche la configuration de l'anti-lien")),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();
    const reply = (embed) => interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    const cfg = getModule(guildId, "antilink");

    if (sub === "activer") {
      const on = interaction.options.getBoolean("actif");
      updateModule(guildId, "antilink", { enabled: on });
      return reply(ok(`Anti-lien ${on ? "activé" : "désactivé"}.`));
    }

    if (sub === "mode") {
      const mode = interaction.options.getString("type");
      updateModule(guildId, "antilink", { mode });
      return reply(ok(mode === "all" ? "Tous les liens sont maintenant bloqués." : "Seules les invitations Discord sont bloquées."));
    }

    if (sub === "mute") {
      const minutes = interaction.options.getInteger("minutes");
      updateModule(guildId, "antilink", { timeoutMinutes: minutes });
      return reply(ok(minutes > 0 ? `Mute de ${minutes} min après un lien interdit.` : "Plus de mute automatique."));
    }

    if (sub === "autoriser" || sub === "retirer") {
      const domain = cleanDomain(interaction.options.getString("domaine"));
      if (!domain || !domain.includes(".")) return reply(fail("Domaine invalide. Exemple : `youtube.com`."));
      const whitelist = sub === "autoriser" ? [...new Set([...cfg.whitelist, domain])] : cfg.whitelist.filter((d) => d !== domain);
      updateModule(guildId, "antilink", { whitelist });
      return reply(ok(sub === "autoriser" ? `Domaine autorisé : \`${domain}\`` : `Domaine retiré : \`${domain}\``));
    }

    // statut
    const embed = info("🔗 Anti-lien").addFields(
      { name: "État", value: state(cfg.enabled), inline: true },
      { name: "Mode", value: cfg.mode === "all" ? "Tous les liens" : "Invitations Discord", inline: true },
      { name: "Mute", value: cfg.timeoutMinutes > 0 ? `${cfg.timeoutMinutes} min` : "Aucun", inline: true },
      { name: "Domaines autorisés", value: cfg.whitelist.length ? cfg.whitelist.map((d) => `\`${d}\``).join(", ") : "Aucun" }
    );
    return reply(embed);
  },
};