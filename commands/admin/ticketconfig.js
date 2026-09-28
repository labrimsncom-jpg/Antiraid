const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require("discord.js");
const db = require("../../utils/db");
const { ok, fail } = require("../../utils/embeds");
const { getCategories, saveCategories, slugify, buildTicketPanel, showTicketConfig } = require("../../utils/tickets");

const EMOJI_RE = /^(<a?:\w{2,32}:\d{17,21}>|[\p{Extended_Pictographic}\uFE0F\u200D]+)$/u;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-config")
    .setDescription("Configure le système de tickets (catégories, rôle support, panneau)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName("afficher").setDescription("Affiche la configuration des tickets"))
    .addSubcommand((s) =>
      s
        .setName("role")
        .setDescription("Définit le rôle de l'équipe qui voit tous les tickets")
        .addRoleOption((o) => o.setName("role").setDescription("Rôle support").setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName("dossier")
        .setDescription("Définit le dossier (catégorie Discord) où les tickets sont créés")
        .addChannelOption((o) =>
          o.setName("dossier").setDescription("Catégorie Discord").addChannelTypes(ChannelType.GuildCategory).setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s
        .setName("ajouter")
        .setDescription("Ajoute ou modifie une catégorie de ticket")
        .addStringOption((o) => o.setName("nom").setDescription("Nom (ex : RECRUTEMENT STAFF)").setRequired(true).setMaxLength(40))
        .addStringOption((o) => o.setName("description").setDescription("Description courte").setMaxLength(90))
        .addStringOption((o) => o.setName("emoji").setDescription("Emoji de la catégorie"))
        .addRoleOption((o) => o.setName("role").setDescription("Rôle staff propre à cette catégorie (sinon le rôle support)"))
        .addChannelOption((o) =>
          o.setName("dossier").setDescription("Dossier propre à cette catégorie").addChannelTypes(ChannelType.GuildCategory)
        )
    )
    .addSubcommand((s) =>
      s
        .setName("retirer")
        .setDescription("Supprime une catégorie de ticket")
        .addStringOption((o) => o.setName("nom").setDescription("Nom de la catégorie").setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName("panneau")
        .setDescription("Envoie le panneau d'ouverture de tickets")
        .addChannelOption((o) => o.setName("salon").setDescription("Salon du panneau (par défaut : celui-ci)").addChannelTypes(ChannelType.GuildText))
        .addStringOption((o) => o.setName("titre").setDescription("Titre du panneau").setMaxLength(100))
        .addStringOption((o) => o.setName("texte").setDescription("Texte d'introduction").setMaxLength(1000))
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();
    const reply = (embed) => interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    if (sub === "afficher") return showTicketConfig(interaction);

    if (sub === "role") {
      const role = interaction.options.getRole("role");
      db.setSetting(guildId, "ticketRoleId", role.id);
      return reply(ok(`Rôle support défini : ${role}.`));
    }

    if (sub === "dossier") {
      const folder = interaction.options.getChannel("dossier");
      db.setSetting(guildId, "ticketCategoryId", folder.id);
      return reply(ok(`Les tickets seront créés dans **${folder.name}**.`));
    }

    if (sub === "ajouter") {
      const label = interaction.options.getString("nom").trim().toUpperCase();
      const key = slugify(label);
      if (!key) return reply(fail("Nom invalide."));

      const emoji = interaction.options.getString("emoji")?.trim() || null;
      if (emoji && !EMOJI_RE.test(emoji)) return reply(fail("Emoji invalide. Utilise un emoji classique ou un emoji du serveur."));

      const list = [...getCategories(guildId)];
      const index = list.findIndex((c) => c.key === key);
      if (index === -1 && list.length >= 25) return reply(fail("Maximum 25 catégories."));

      const entry = {
        key,
        label,
        description: interaction.options.getString("description") ?? list[index]?.description ?? null,
        emoji: emoji ?? list[index]?.emoji ?? null,
        roleId: interaction.options.getRole("role")?.id ?? list[index]?.roleId ?? null,
        parentId: interaction.options.getChannel("dossier")?.id ?? list[index]?.parentId ?? null,
      };
      if (index === -1) list.push(entry);
      else list[index] = entry;
      saveCategories(guildId, list);
      return reply(ok(`Catégorie **${label}** ${index === -1 ? "ajoutée" : "modifiée"}. Renvoie le panneau avec \`/ticket-config panneau\` pour la voir.`));
    }

    if (sub === "retirer") {
      const wanted = slugify(interaction.options.getString("nom"));
      const list = getCategories(guildId);
      if (!list.some((c) => c.key === wanted)) return reply(fail("Catégorie introuvable. Vois la liste avec `/ticket-config afficher`."));
      if (list.length === 1) return reply(fail("Il faut garder au moins une catégorie."));
      saveCategories(guildId, list.filter((c) => c.key !== wanted));
      return reply(ok("Catégorie supprimée. Renvoie le panneau avec `/ticket-config panneau`."));
    }

    if (sub === "panneau") {
      const channel = interaction.options.getChannel("salon") ?? interaction.channel;
      const title = interaction.options.getString("titre");
      const text = interaction.options.getString("texte");
      if (title) db.setSetting(guildId, "ticketPanelTitle", title);
      if (text) db.setSetting(guildId, "ticketPanelText", text);
      try {
        await channel.send(buildTicketPanel(interaction.guild));
      } catch {
        return reply(fail(`Je ne peux pas écrire dans ${channel}. Vérifie mes permissions dans ce salon.`));
      }
      return reply(ok(`Panneau de tickets envoyé dans ${channel}.`));
    }
  },
};