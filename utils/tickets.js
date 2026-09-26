const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits: P
} = require("discord.js");

const db = require("./db");
const { COLORS, ok, fail } = require("./embeds");
const { sendLog } = require("./logger");

const MEMBER_PERMS = [
  P.ViewChannel,
  P.SendMessages,
  P.ReadMessageHistory,
  P.AttachFiles,
  P.EmbedLinks
];

function getSettings(guildId) {
  const settings = db.getSettings(guildId);

  if (!settings.ticketRoleId) {
    settings.ticketRoleId = null;
  }

  if (!settings.ticketCategoryId) {
    settings.ticketCategoryId = null;
  }

  return settings;
}

function buildTicketPanel() {
  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle("🎫 Support — Holy RP")
    .setDescription(
      [
        "Besoin d'aide ?",
        "",
        "Clique sur le bouton ci-dessous pour ouvrir un ticket.",
        "",
        "🔒 Ton ticket sera visible uniquement par toi et l'équipe de support."
      ].join("\n")
    )
    .setFooter({
      text: "Holy RP • Support"
    });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_open")
      .setLabel("Ouvrir un ticket")
      .setEmoji("🎫")
      .setStyle(ButtonStyle.Primary)
  );

  return {
    embeds: [embed],
    components: [row]
  };
}

async function showTicketConfig(interaction) {
  const settings = getSettings(interaction.guild.id);

  const categoryText = settings.ticketCategoryId
    ? `<#${settings.ticketCategoryId}>`
    : "Non configurée";

  const roleText = settings.ticketRoleId
    ? `<@&${settings.ticketRoleId}>`
    : "Non configuré";

  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle("🎫 Configuration des tickets — Holy RP")
    .setDescription(
      [
        "Configure et publie le système de tickets.",
        "",
        `📁 **Catégorie :** ${categoryText}`,
        `👥 **Rôle support :** ${roleText}`,
        "",
        "Utilise le bouton ci-dessous pour publier le panneau de tickets."
      ].join("\n")
    )
    .setFooter({
      text: "Holy RP • Ticket System"
    });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_config_send")
      .setLabel("Envoyer le panneau")
      .setEmoji("📨")
      .setStyle(ButtonStyle.Success)
  );

  await interaction.reply({
    embeds: [embed],
    components: [row],
    flags: MessageFlags.Ephemeral
  });
}

async function sendTicketPanel(interaction) {
  const payload = buildTicketPanel();

  await interaction.channel.send(payload);

  return interaction.reply({
    embeds: [
      ok("Le panneau de tickets a été envoyé dans ce salon.")
    ],
    flags: MessageFlags.Ephemeral
  });
}

async function openTicket(interaction) {
  const { guild, user } = interaction;

  const settings = getSettings(guild.id);

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  const existing = guild.channels.cache.find(
    (c) => c.topic === `ticket:${user.id}`
  );

  if (existing) {
    return interaction.editReply({
      embeds: [
        fail(`Tu as déjà un ticket ouvert : ${existing}`)
      ]
    });
  }

  if (!guild.members.me?.permissions.has(P.ManageChannels)) {
    return interaction.editReply({
      embeds: [
        fail(
          "Il me faut la permission **Gérer les salons** pour créer un ticket."
        )
      ]
    });
  }

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [P.ViewChannel]
    },
    {
      id: user.id,
      allow: MEMBER_PERMS
    },
    {
      id: guild.members.me.id,
      allow: [...MEMBER_PERMS, P.ManageChannels]
    }
  ];

  if (settings.ticketRoleId) {
    overwrites.push({
      id: settings.ticketRoleId,
      allow: MEMBER_PERMS
    });
  }

  const safeName =
    user.username
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "") || "membre";

  const channel = await guild.channels.create({
    name: `ticket-${safeName}`.slice(0, 90),
    type: ChannelType.GuildText,
    parent: settings.ticketCategoryId || undefined,
    topic: `ticket:${user.id}`,
    permissionOverwrites: overwrites
  });

  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle("🎫 Ticket ouvert")
    .setDescription(
      "Explique ton problème en détail, l'équipe va te répondre dès que possible.\n\nQuand c'est réglé, clique sur **Fermer le ticket**."
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("Fermer le ticket")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: `${user}${
      settings.ticketRoleId
        ? ` <@&${settings.ticketRoleId}>`
        : ""
    }`,
    embeds: [embed],
    components: [row],
    allowedMentions: {
      users: [user.id],
      roles: settings.ticketRoleId
        ? [settings.ticketRoleId]
        : []
    }
  });

  await interaction.editReply({
    embeds: [
      ok(`Ton ticket est ouvert : ${channel}`)
    ]
  });

  await sendLog(
    guild,
    new EmbedBuilder()
      .setColor(COLORS.success)
      .setTitle("🎫 Ticket ouvert")
      .setDescription(`${channel} par ${user}`)
      .setTimestamp()
  );
}

async function closeTicket(interaction) {
  const {
    guild,
    channel,
    user,
    member
  } = interaction;

  if (!channel.topic?.startsWith("ticket:")) {
    return interaction.reply({
      embeds: [
        fail("Ce salon n'est pas un ticket.")
      ],
      flags: MessageFlags.Ephemeral
    });
  }

  const ownerId = channel.topic.split(":")[1];

  const { ticketRoleId } = getSettings(guild.id);

  const allowed =
    member.permissions.has(P.ManageChannels) ||
    user.id === ownerId ||
    (
      ticketRoleId &&
      member.roles.cache.has(ticketRoleId)
    );

  if (!allowed) {
    return interaction.reply({
      embeds: [
        fail("Tu ne peux pas fermer ce ticket.")
      ],
      flags: MessageFlags.Ephemeral
    });
  }

  await interaction.reply({
    embeds: [
      ok(
        "Ticket fermé. Suppression du salon dans 5 secondes…"
      )
    ]
  });

  await sendLog(
    guild,
    new EmbedBuilder()
      .setColor(COLORS.error)
      .setTitle("🔒 Ticket fermé")
      .setDescription(
        `\`#${channel.name}\` fermé par ${user}`
      )
      .setTimestamp()
  );

  setTimeout(
    () =>
      channel
        .delete(`Ticket fermé par ${user.tag}`)
        .catch(() => {}),
    5000
  );
}

async function handleTicketInteraction(interaction) {
  const id = interaction.customId || "";

  if (
    interaction.isButton() &&
    id === "ticket_open"
  ) {
    return openTicket(interaction);
  }

  if (
    interaction.isButton() &&
    id === "ticket_close"
  ) {
    return closeTicket(interaction);
  }

  if (
    interaction.isButton() &&
    id === "ticket_config_send"
  ) {
    if (
      !interaction.memberPermissions?.has(
        P.ManageGuild
      )
    ) {
      return interaction.reply({
        content:
          "❌ Tu dois avoir la permission **Gérer le serveur**.",
        flags: MessageFlags.Ephemeral
      });
    }

    return sendTicketPanel(interaction);
  }
}

module.exports = {
  showTicketConfig,
  handleTicketInteraction,
  openTicket,
  closeTicket
};
