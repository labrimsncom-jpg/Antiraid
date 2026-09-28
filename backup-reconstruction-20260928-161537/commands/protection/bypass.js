const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { getModule, updateModule } = require("../../utils/shield");
const { ok, fail, info } = require("../../utils/embeds");

const targets = (s) =>
  s
    .addRoleOption((o) => o.setName("role").setDescription("Rôle exempté"))
    .addChannelOption((o) => o.setName("salon").setDescription("Salon exempté"))
    .addUserOption((o) => o.setName("membre").setDescription("Membre exempté"));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bypass")
    .setDescription("Gère les exceptions de l'anti-spam et de l'anti-lien")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => targets(s.setName("ajouter").setDescription("Ajoute une exception")))
    .addSubcommand((s) => targets(s.setName("retirer").setDescription("Retire une exception")))
    .addSubcommand((s) => s.setName("liste").setDescription("Affiche les exceptions")),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const cfg = getModule(guildId, "bypass");

    if (sub === "liste") {
      const fmt = (list, prefix) => (list.length ? list.map((id) => `<${prefix}${id}>`).join(" ") : "Aucun");
      return interaction.reply({
        embeds: [
          info("✅ Exceptions").addFields(
            { name: "Rôles", value: fmt(cfg.roles, "@&") },
            { name: "Salons", value: fmt(cfg.channels, "#") },
            { name: "Membres", value: fmt(cfg.users, "@") }
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const role = interaction.options.getRole("role");
    const channel = interaction.options.getChannel("salon");
    const user = interaction.options.getUser("membre");
    if (!role && !channel && !user) {
      return interaction.reply({ embeds: [fail("Choisis au moins un rôle, un salon ou un membre.")], flags: MessageFlags.Ephemeral });
    }

    const change = (list, id) => (sub === "ajouter" ? [...new Set([...list, id])] : list.filter((x) => x !== id));
    const next = { ...cfg };
    if (role) next.roles = change(cfg.roles, role.id);
    if (channel) next.channels = change(cfg.channels, channel.id);
    if (user) next.users = change(cfg.users, user.id);
    updateModule(guildId, "bypass", next);

    const names = [role, channel, user].filter(Boolean).join(", ");
    await interaction.reply({
      embeds: [ok(sub === "ajouter" ? `Exception ajoutée : ${names}` : `Exception retirée : ${names}`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
