const {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
  PermissionFlagsBits: P,
} = require("discord.js");

const db = require("./db");
const { COLORS, ok, fail } = require("./embeds");
const { sendLog } = require("./logger");

const BRAND = "Server Manager";
const TICKET_COLOR = 0x2b2d31; // même gris que le fond des embeds : pas de barre de couleur
const EPHEMERAL = MessageFlags.Ephemeral;

const MEMBER_ALLOW = [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.AttachFiles, P.EmbedLinks];
const MEMBER_ALLOW_OBJ = { ViewChannel: true, SendMessages: true, ReadMessageHistory: true, AttachFiles: true, EmbedLinks: true };

// Catégories proposées tant que rien n'a été configuré avec /ticket-config ajouter
const DEFAULT_CATEGORIES = [
  { key: "support", label: "SUPPORT", description: "Une question ou un problème ? L'équipe t'aide.", emoji: "🎫" },
  { key: "recrutement-staff", label: "RECRUTEMENT STAFF", description: "Candidature pour rejoindre l'équipe.", emoji: "🛡️" },
  { key: "partenariat", label: "PARTENARIAT", description: "Proposer un partenariat.", emoji: "🤝" },
  { key: "signalement", label: "SIGNALEMENT", description: "Signaler un membre ou un problème.", emoji: "🚨" },
];

// Menu « Actions staff... »
const ACTIONS = [
  { value: "claim", label: "Ticket pris en charge", description: "M'assigner ce ticket", emoji: "🚀" },
  { value: "unclaim", label: "Ticket libéré", description: "Désassigner ce ticket", emoji: "🔨" },
  { value: "add", label: "Ajouter un membre", description: "Ajouter quelqu'un au ticket", emoji: "➕" },
  { value: "remove", label: "Retirer un membre", description: "Retirer quelqu'un du ticket", emoji: "❌" },
  { value: "ping", label: "Avez-vous toujours besoin de ce ticket ?", description: "Demander si le ticket est encore actif", emoji: "🔔" },
  { value: "transcript", label: "Générer le transcript", description: "Recevoir l'historique en fichier", emoji: "📄" },
  { value: "rename", label: "Renommer le ticket", description: "Changer le nom du salon", emoji: "✏️" },
  { value: "close_reason", label: "Fermer avec une raison", description: "Fermer le ticket en précisant pourquoi", emoji: "🔒" },
];

// ---------------------------------------------------------------- Données
const slugify = (text) =>
  String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

function getCategories(guildId) {
  const list = db.getSettings(guildId).ticketCategories;
  return Array.isArray(list) && list.length ? list : DEFAULT_CATEGORIES;
}

const saveCategories = (guildId, list) => db.setSetting(guildId, "ticketCategories", list);
const allTickets = (guildId) => db.getSettings(guildId).tickets ?? {};

function saveTicket(guildId, rec) {
  db.setSetting(guildId, "tickets", { ...allTickets(guildId), [rec.channelId]: rec });
}

function deleteTicket(guildId, channelId) {
  const tickets = { ...allTickets(guildId) };
  delete tickets[channelId];
  db.setSetting(guildId, "tickets", tickets);
}

// Fiche d'un ticket. Les anciens tickets (sans fiche) sont reconnus grâce au topic du salon.
function resolveTicket(channel) {
  if (!channel?.guild) return null;
  const rec = allTickets(channel.guild.id)[channel.id];
  if (rec) return rec;
  if (channel.topic?.startsWith("ticket:")) {
    return {
      channelId: channel.id,
      id: channel.name,
      ownerId: channel.topic.split(":")[1],
      categoryKey: "support",
      categoryLabel: "SUPPORT",
      subject: "—",
      staffRoleId: db.getSettings(channel.guild.id).ticketRoleId ?? null,
      assigneeId: null,
      assigneeText: null,
      messageId: null,
    };
  }
  return null;
}

const isStaff = (member, rec) =>
  Boolean(member?.permissions?.has(P.ManageChannels) || (rec.staffRoleId && member?.roles?.cache?.has(rec.staffRoleId)));

const randomCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

// ---------------------------------------------------------------- Message du ticket
function ticketEmbed(rec) {
  const subject = String(rec.subject || "—")
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");

  return new EmbedBuilder()
    .setColor(TICKET_COLOR)
    .setTitle(`🎫 Ticket ${rec.id} — ${rec.categoryLabel}`)
    .setDescription(
      [
        "**Sujet :**",
        subject,
        "",
        `**Statut** : ${rec.assigneeId ? "Pris en charge" : "Ouvert"}`,
        `**Assigné à** : ${rec.assigneeId ? rec.assigneeText : "Personne pour le moment"}`,
        `**Catégorie** : ${rec.categoryLabel}`,
      ].join("\n")
    )
    .setFooter({ text: `${BRAND} • ${rec.id}` });
}

function ticketComponents() {
  const close = new ButtonBuilder()
    .setCustomId("ticket_close")
    .setLabel("Confirmer la fermeture")
    .setEmoji("🟥")
    .setStyle(ButtonStyle.Danger);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket_actions")
    .setPlaceholder("Actions staff...")
    .addOptions(ACTIONS.map((a) => ({ ...a })));

  return [new ActionRowBuilder().addComponents(close), new ActionRowBuilder().addComponents(menu)];
}

const ticketPayload = (rec) => ({ embeds: [ticketEmbed(rec)], components: ticketComponents() });

// Met à jour le message du ticket (et remet le menu « Actions staff... » à zéro)
async function refreshTicketMessage(channel, rec) {
  if (!rec.messageId) return;
  const message = await channel.messages.fetch(rec.messageId).catch(() => null);
  if (message) await message.edit(ticketPayload(rec)).catch(() => {});
}

// ---------------------------------------------------------------- Panneau
function categoryOptions(categories) {
  return categories.slice(0, 25).map((c) => {
    const option = { label: c.label.slice(0, 100), value: c.key };
    if (c.description) option.description = c.description.slice(0, 100);
    if (c.emoji) option.emoji = c.emoji;
    return option;
  });
}

const categorySelectRow = (categories) =>
  new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("ticket_select")
      .setPlaceholder("Choisis une catégorie...")
      .addOptions(categoryOptions(categories))
  );

function buildTicketPanel(guild) {
  const settings = db.getSettings(guild.id);
  const categories = getCategories(guild.id);

  const list = categories
    .map((c) => `${c.emoji ? `${c.emoji} ` : ""}**${c.label}**${c.description ? ` — ${c.description}` : ""}`)
    .join("\n");

  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle(settings.ticketPanelTitle || "🎫 Support")
    .setDescription(
      [
        settings.ticketPanelText || "Besoin d'aide ? Choisis une catégorie ci-dessous pour ouvrir un ticket privé avec l'équipe.",
        "",
        list,
      ].join("\n")
    )
    .setFooter({ text: `${BRAND} • Tickets` });

  const row =
    categories.length === 1
      ? new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("ticket_open").setLabel("Ouvrir un ticket").setEmoji("🎫").setStyle(ButtonStyle.Primary)
        )
      : categorySelectRow(categories);

  return { embeds: [embed], components: [row] };
}

async function sendTicketPanel(interaction) {
  await interaction.channel.send(buildTicketPanel(interaction.guild));
  return interaction.reply({ embeds: [ok("Le panneau de tickets a été envoyé dans ce salon.")], flags: EPHEMERAL });
}

async function showTicketConfig(interaction) {
  const { guild } = interaction;
  const settings = db.getSettings(guild.id);
  const categories = getCategories(guild.id);

  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle("⚙️ Configuration des tickets")
    .addFields(
      { name: "Rôle support", value: settings.ticketRoleId ? `<@&${settings.ticketRoleId}>` : "Non défini", inline: true },
      { name: "Dossier des tickets", value: settings.ticketCategoryId ? `<#${settings.ticketCategoryId}>` : "Non défini", inline: true },
      {
        name: `Catégories (${categories.length})`,
        value: categories
          .map((c) => `${c.emoji ?? "•"} **${c.label}**${c.roleId ? ` — <@&${c.roleId}>` : ""}`)
          .join("\n")
          .slice(0, 1000),
      }
    )
    .setFooter({ text: `${BRAND} • /ticket-config ajouter | retirer | role | dossier | panneau` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket_config_send").setLabel("Envoyer le panneau ici").setEmoji("📨").setStyle(ButtonStyle.Success)
  );

  return interaction.reply({ embeds: [embed], components: [row], flags: EPHEMERAL });
}

// ---------------------------------------------------------------- Ouverture
function subjectModal(category) {
  return new ModalBuilder()
    .setCustomId(`ticket_modal:${category.key}`)
    .setTitle(`Ticket — ${category.label}`.slice(0, 45))
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("subject")
          .setLabel("Sujet")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMinLength(3)
          .setMaxLength(1000)
          .setPlaceholder("Explique ta demande en quelques mots...")
      )
    );
}

// Bouton « Ouvrir un ticket » (ancien panneau ou catégorie unique)
async function openTicket(interaction) {
  const categories = getCategories(interaction.guild.id);
  if (categories.length === 1) return interaction.showModal(subjectModal(categories[0]));
  return interaction.reply({ content: "Choisis une catégorie :", components: [categorySelectRow(categories)], flags: EPHEMERAL });
}

async function createTicket(interaction, categoryKey) {
  const { guild, user } = interaction;
  const category = getCategories(guild.id).find((c) => c.key === categoryKey);
  const subject = interaction.fields.getTextInputValue("subject").trim();

  await interaction.deferReply({ flags: EPHEMERAL });

  if (!category) return interaction.editReply({ embeds: [fail("Cette catégorie n'existe plus.")] });

  // Un seul ticket ouvert par catégorie et par membre (on nettoie les fiches dont le salon a disparu)
  for (const rec of Object.values(allTickets(guild.id))) {
    if (!guild.channels.cache.has(rec.channelId)) deleteTicket(guild.id, rec.channelId);
  }
  const existing = Object.values(allTickets(guild.id)).find((t) => t.ownerId === user.id && t.categoryKey === category.key);
  if (existing) {
    return interaction.editReply({ embeds: [fail(`Tu as déjà un ticket ouvert dans cette catégorie : <#${existing.channelId}>`)] });
  }

  const me = guild.members.me;
  if (!me?.permissions.has(P.ManageChannels)) {
    return interaction.editReply({ embeds: [fail("Il me faut la permission **Gérer les salons** pour créer un ticket.")] });
  }

  const settings = db.getSettings(guild.id);
  const staffRoleId = [category.roleId, settings.ticketRoleId].find((id) => id && guild.roles.cache.has(id)) ?? null;
  const parentId = [category.parentId, settings.ticketCategoryId].find((id) => id && guild.channels.cache.has(id)) ?? undefined;

  const number = (settings.ticketCounter ?? 0) + 1;
  db.setSetting(guild.id, "ticketCounter", number);
  const padded = String(number).padStart(4, "0");
  const id = `TICKET-${padded}-${randomCode()}`;

  const overwrites = [
    { id: guild.roles.everyone.id, deny: [P.ViewChannel] },
    { id: user.id, allow: MEMBER_ALLOW },
    { id: me.id, allow: [...MEMBER_ALLOW, P.ManageChannels, P.ManageMessages] },
  ];
  if (staffRoleId) overwrites.push({ id: staffRoleId, allow: MEMBER_ALLOW });

  let channel;
  try {
    channel = await guild.channels.create({
      name: `${slugify(category.label) || "ticket"}-${padded}`.slice(0, 90),
      type: ChannelType.GuildText,
      parent: parentId,
      topic: `ticket:${user.id}`,
      permissionOverwrites: overwrites,
    });
  } catch (error) {
    console.error("Création du ticket impossible :", error);
    return interaction.editReply({
      embeds: [fail("Impossible de créer le ticket. Vérifie mes permissions et que le dossier des tickets n'est pas plein (50 salons max).")],
    });
  }

  const rec = {
    id,
    number,
    channelId: channel.id,
    ownerId: user.id,
    categoryKey: category.key,
    categoryLabel: category.label,
    subject,
    staffRoleId,
    assigneeId: null,
    assigneeText: null,
    messageId: null,
    createdAt: Date.now(),
  };
  saveTicket(guild.id, rec);

  const mentions = [`<@${user.id}>`, staffRoleId ? `<@&${staffRoleId}>` : null].filter(Boolean).join(" ");
  const message = await channel.send({
    content: mentions,
    ...ticketPayload(rec),
    allowedMentions: { users: [user.id], roles: staffRoleId ? [staffRoleId] : [] },
  });
  rec.messageId = message.id;
  saveTicket(guild.id, rec);

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(TICKET_COLOR)
        .setDescription("🔗 Vous pouvez aussi envoyer directement une image, capture d'écran ou un enregistrement en pièce jointe."),
    ],
  });

  await interaction.editReply({ embeds: [ok(`Ton ticket est ouvert : ${channel}`)] });

  await sendLog(
    guild,
    new EmbedBuilder()
      .setColor(COLORS.success)
      .setTitle(`🎫 Ticket ouvert — ${id}`)
      .setDescription(`${channel} par ${user}`)
      .addFields({ name: "Catégorie", value: category.label, inline: true }, { name: "Sujet", value: subject.slice(0, 1000) })
      .setTimestamp()
  );
}

// ---------------------------------------------------------------- Actions
async function claimTicket(interaction, rec) {
  if (rec.assigneeId === interaction.user.id) {
    return interaction.reply({ embeds: [fail("Tu as déjà pris en charge ce ticket.")], flags: EPHEMERAL });
  }
  rec.assigneeId = interaction.user.id;
  rec.assigneeText = `<@${interaction.user.id}> (${interaction.user.username})`;
  saveTicket(interaction.guild.id, rec);
  await interaction.reply({ embeds: [ok(`${interaction.user} a pris en charge ce ticket.`)] });
  await refreshTicketMessage(interaction.channel, rec);
}

async function unclaimTicket(interaction, rec) {
  if (!rec.assigneeId) {
    return interaction.reply({ embeds: [fail("Ce ticket n'est assigné à personne.")], flags: EPHEMERAL });
  }
  rec.assigneeId = null;
  rec.assigneeText = null;
  saveTicket(interaction.guild.id, rec);
  await interaction.reply({ embeds: [ok(`${interaction.user} a libéré ce ticket : il est de nouveau disponible.`)] });
  await refreshTicketMessage(interaction.channel, rec);
}

async function grantMembers(channel, ids) {
  for (const id of ids) await channel.permissionOverwrites.edit(id, MEMBER_ALLOW_OBJ).catch(() => {});
}

async function revokeMembers(channel, rec, ids) {
  const removed = [];
  for (const id of ids) {
    if (id === rec.ownerId || id === channel.client.user.id) continue;
    if (!channel.permissionOverwrites.cache.has(id)) continue;
    await channel.permissionOverwrites.delete(id).catch(() => {});
    removed.push(id);
  }
  return removed;
}

function pickMembers(customId, text) {
  return {
    content: text,
    components: [
      new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder().setCustomId(customId).setPlaceholder("Choisis un ou plusieurs membres...").setMinValues(1).setMaxValues(10)
      ),
    ],
    flags: EPHEMERAL,
  };
}

async function askStillNeeded(interaction, rec) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket_still_yes").setLabel("Oui, j'ai encore besoin d'aide").setEmoji("✅").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("ticket_still_no").setLabel("Non, fermer le ticket").setEmoji("🔒").setStyle(ButtonStyle.Danger)
  );
  await interaction.reply({
    content: `<@${rec.ownerId}>`,
    embeds: [
      new EmbedBuilder()
        .setColor(TICKET_COLOR)
        .setTitle("🔔 Avez-vous toujours besoin de ce ticket ?")
        .setDescription(`${interaction.user} souhaite savoir si ce ticket est toujours d'actualité.\nRéponds avec l'un des boutons ci-dessous.`),
    ],
    components: [row],
    allowedMentions: { users: [rec.ownerId] },
  });
}

async function buildTranscript(channel) {
  const messages = [];
  let before;
  for (let page = 0; page < 20; page++) {
    const batch = await channel.messages.fetch({ limit: 100, before }).catch(() => null);
    if (!batch || batch.size === 0) break;
    messages.push(...batch.values());
    if (batch.size < 100) break;
    before = batch.last().id;
  }
  messages.reverse();

  return messages
    .map((m) => {
      const lines = [`[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${(m.content || "").replace(/\r?\n/g, " ")}`];
      for (const embed of m.embeds) if (embed.title || embed.description) lines.push(`   [embed] ${[embed.title, embed.description].filter(Boolean).join(" — ").replace(/\r?\n/g, " ")}`);
      for (const file of m.attachments.values()) lines.push(`   [pièce jointe] ${file.name} : ${file.url}`);
      return lines.join("\n");
    })
    .join("\n");
}

const transcriptFile = async (channel, rec) =>
  new AttachmentBuilder(Buffer.from((await buildTranscript(channel)) || "Aucun message.", "utf8"), { name: `${rec.id}-transcript.txt` });

async function sendTranscript(interaction, rec) {
  await interaction.deferReply({ flags: EPHEMERAL });
  const file = await transcriptFile(interaction.channel, rec);
  return interaction.editReply({ content: "📄 Transcript généré.", files: [file] });
}

async function renameTicket(interaction, rec, value) {
  await interaction.deferReply({ flags: EPHEMERAL });
  const name = slugify(value) || slugify(rec.id);
  try {
    // Discord limite à 2 renommages toutes les 10 minutes : on n'attend pas indéfiniment
    await Promise.race([
      interaction.channel.setName(name.slice(0, 90)),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000)),
    ]);
  } catch {
    return interaction.editReply({ embeds: [fail("Renommage impossible pour le moment (Discord limite à 2 renommages toutes les 10 minutes).")] });
  }
  return interaction.editReply({ embeds: [ok(`Ticket renommé en **${name}**.`)] });
}

async function closeTicket(interaction, reason = null) {
  const { guild, channel, user, member } = interaction;
  const rec = resolveTicket(channel);

  if (!rec) return interaction.reply({ embeds: [fail("Ce salon n'est pas un ticket.")], flags: EPHEMERAL });
  if (!isStaff(member, rec) && user.id !== rec.ownerId) {
    return interaction.reply({ embeds: [fail("Tu ne peux pas fermer ce ticket.")], flags: EPHEMERAL });
  }

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle("🔒 Ticket fermé")
        .setDescription(`Fermé par ${user}.${reason ? `\n**Raison :** ${reason}` : ""}\n\nSuppression du salon dans quelques secondes...`),
    ],
  });

  const logEmbed = new EmbedBuilder()
    .setColor(COLORS.error)
    .setTitle(`🔒 Ticket fermé — ${rec.id}`)
    .setDescription(`#${channel.name} fermé par ${user}`)
    .addFields(
      { name: "Auteur", value: `<@${rec.ownerId}>`, inline: true },
      { name: "Catégorie", value: rec.categoryLabel, inline: true },
      { name: "Assigné à", value: rec.assigneeText ?? "Personne", inline: true }
    )
    .setTimestamp();
  if (reason) logEmbed.addFields({ name: "Raison", value: reason.slice(0, 1000) });

  let files = [];
  try {
    files = [await transcriptFile(channel, rec)];
  } catch (error) {
    console.error("Transcript impossible :", error);
  }

  deleteTicket(guild.id, channel.id);
  await sendLog(guild, logEmbed, files);

  const owner = await interaction.client.users.fetch(rec.ownerId).catch(() => null);
  if (owner) {
    const dmFiles = files.length ? [await transcriptFile(channel, rec)] : [];
    await owner
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.error)
            .setTitle(`🔒 Ton ticket ${rec.id} a été fermé`)
            .setDescription(`Serveur : **${guild.name}**${reason ? `\n**Raison :** ${reason}` : ""}\nTu trouveras l'historique en pièce jointe.`)
            .setFooter({ text: BRAND }),
        ],
        files: dmFiles,
      })
      .catch(() => {});
  }

  setTimeout(() => channel.delete(`Ticket fermé par ${user.tag}`).catch(() => {}), 5000);
}

// ---------------------------------------------------------------- Routeur d'interactions
const staffOnly = (interaction) =>
  interaction.reply({ embeds: [fail("Seule l'équipe peut utiliser cette action.")], flags: EPHEMERAL });

async function handleAction(interaction) {
  const rec = resolveTicket(interaction.channel);
  if (!rec) return interaction.reply({ embeds: [fail("Ce salon n'est pas un ticket.")], flags: EPHEMERAL });

  // Réinitialise l'affichage du menu dès que possible
  const reset = () => (interaction.message?.id === rec.messageId ? interaction.message.edit(ticketPayload(rec)).catch(() => {}) : null);

  if (!isStaff(interaction.member, rec)) {
    await staffOnly(interaction);
    return reset();
  }

  switch (interaction.values[0]) {
    case "claim":
      return claimTicket(interaction, rec);
    case "unclaim":
      return unclaimTicket(interaction, rec);
    case "add":
      await interaction.reply(pickMembers("ticket_add_pick", "Choisis les membres à ajouter au ticket :"));
      return reset();
    case "remove":
      await interaction.reply(pickMembers("ticket_remove_pick", "Choisis les membres à retirer du ticket :"));
      return reset();
    case "ping":
      await askStillNeeded(interaction, rec);
      return reset();
    case "transcript":
      await sendTranscript(interaction, rec);
      return reset();
    case "rename": {
      await interaction.showModal(
        new ModalBuilder()
          .setCustomId("ticket_rename_modal")
          .setTitle("Renommer le ticket")
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId("name").setLabel("Nouveau nom du salon").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(90)
            )
          )
      );
      return reset();
    }
    case "close_reason": {
      await interaction.showModal(
        new ModalBuilder()
          .setCustomId("ticket_closereason_modal")
          .setTitle("Fermer le ticket")
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId("reason").setLabel("Raison de la fermeture").setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(500)
            )
          )
      );
      return reset();
    }
  }
}

async function handleMemberPick(interaction, adding) {
  const rec = resolveTicket(interaction.channel);
  if (!rec || !isStaff(interaction.member, rec)) {
    return interaction.update({ content: "❌ Seule l'équipe peut utiliser cette action.", components: [] });
  }

  const ids = [...interaction.values];
  const mentions = ids.map((id) => `<@${id}>`).join(", ");

  if (adding) {
    await grantMembers(interaction.channel, ids);
    await interaction.update({ content: `✅ ${ids.length} membre(s) ajouté(s).`, components: [] });
    return interaction.channel.send({ embeds: [ok(`${mentions} ajouté(s) au ticket par ${interaction.user}.`)], allowedMentions: { users: ids } });
  }

  const removed = await revokeMembers(interaction.channel, rec, ids);
  await interaction.update({
    content: removed.length ? `✅ ${removed.length} membre(s) retiré(s).` : "❌ Personne à retirer (l'auteur du ticket ne peut pas être retiré).",
    components: [],
  });
  if (removed.length) {
    return interaction.channel.send({ embeds: [ok(`${removed.map((id) => `<@${id}>`).join(", ")} retiré(s) du ticket par ${interaction.user}.`)], allowedMentions: { parse: [] } });
  }
}

async function handleTicketInteraction(interaction) {
  const id = interaction.customId || "";

  if (interaction.isButton()) {
    if (id === "ticket_open") return openTicket(interaction);
    if (id === "ticket_close") return closeTicket(interaction);

    if (id === "ticket_still_yes" || id === "ticket_still_no") {
      const rec = resolveTicket(interaction.channel);
      if (!rec || interaction.user.id !== rec.ownerId) {
        return interaction.reply({ embeds: [fail("Seul l'auteur du ticket peut répondre.")], flags: EPHEMERAL });
      }
      if (id === "ticket_still_no") return closeTicket(interaction, "Le membre n'a plus besoin du ticket.");
      return interaction.update({
        content: "",
        embeds: [ok(`${interaction.user} a encore besoin de ce ticket : il reste ouvert.`)],
        components: [],
      });
    }

    if (id === "ticket_config_send") {
      if (!interaction.memberPermissions?.has(P.ManageGuild)) {
        return interaction.reply({ content: "Tu dois avoir la permission Gérer le serveur.", flags: EPHEMERAL });
      }
      return sendTicketPanel(interaction);
    }
    return;
  }

  if (interaction.isStringSelectMenu()) {
    if (id === "ticket_select") {
      const category = getCategories(interaction.guild.id).find((c) => c.key === interaction.values[0]);
      if (!category) return interaction.reply({ embeds: [fail("Cette catégorie n'existe plus.")], flags: EPHEMERAL });
      return interaction.showModal(subjectModal(category));
    }
    if (id === "ticket_actions") return handleAction(interaction);
    return;
  }

  if (interaction.isUserSelectMenu()) {
    if (id === "ticket_add_pick") return handleMemberPick(interaction, true);
    if (id === "ticket_remove_pick") return handleMemberPick(interaction, false);
    return;
  }

  if (interaction.isModalSubmit()) {
    if (id.startsWith("ticket_modal:")) return createTicket(interaction, id.slice("ticket_modal:".length));

    const rec = resolveTicket(interaction.channel);
    if (!rec) return interaction.reply({ embeds: [fail("Ce salon n'est pas un ticket.")], flags: EPHEMERAL });
    if (!isStaff(interaction.member, rec)) return staffOnly(interaction);

    if (id === "ticket_rename_modal") return renameTicket(interaction, rec, interaction.fields.getTextInputValue("name"));
    if (id === "ticket_closereason_modal") return closeTicket(interaction, interaction.fields.getTextInputValue("reason").trim() || null);
  }
}

module.exports = {
  DEFAULT_CATEGORIES,
  slugify,
  getCategories,
  saveCategories,
  buildTicketPanel,
  showTicketConfig,
  handleTicketInteraction,
  openTicket,
  closeTicket,
  resolveTicket,
  isStaff,
  claimTicket,
  unclaimTicket,
  grantMembers,
  revokeMembers,
  sendTranscript,
  renameTicket,
};