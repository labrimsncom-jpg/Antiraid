$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "       HOLY RP - SYSTEME DE TICKETS" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".\package.json")) {
    Write-Host "package.json introuvable." -ForegroundColor Red
    Write-Host "Lance ce script depuis le dossier server-manager."
    exit 1
}

New-Item -ItemType Directory -Force ".\commands\admin" | Out-Null
New-Item -ItemType Directory -Force ".\utils" | Out-Null
New-Item -ItemType Directory -Force ".\events" | Out-Null

@'
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require("discord.js");

const { showTicketConfig } = require("../../utils/tickets");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-config")
    .setDescription("Configurer le système de tickets Holy RP")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild.toString()
    ),

  async execute(interaction) {
    if (
      !interaction.memberPermissions?.has(
        PermissionFlagsBits.ManageGuild
      )
    ) {
      return interaction.reply({
        content: "Tu dois avoir la permission Gérer le serveur.",
        flags: MessageFlags.Ephemeral
      });
    }

    await showTicketConfig(interaction);
  }
};
'@ | Set-Content ".\commands\admin\ticketconfig.js" -Encoding UTF8

@'
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
    .setTitle("Support - Holy RP")
    .setDescription(
      [
        "Besoin d'aide ?",
        "",
        "Clique sur le bouton ci-dessous pour ouvrir un ticket.",
        "",
        "Ton ticket sera visible uniquement par toi et l'equipe de support."
      ].join("\n")
    )
    .setFooter({
      text: "Holy RP - Support"
    });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_open")
      .setLabel("Ouvrir un ticket")
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
    : "Non configuree";

  const roleText = settings.ticketRoleId
    ? `<@&${settings.ticketRoleId}>`
    : "Non configure";

  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle("Configuration des tickets - Holy RP")
    .setDescription(
      [
        "Configure et publie le systeme de tickets.",
        "",
        `Categorie : ${categoryText}`,
        `Role support : ${roleText}`,
        "",
        "Utilise le bouton ci-dessous pour publier le panneau de tickets."
      ].join("\n")
    )
    .setFooter({
      text: "Holy RP - Ticket System"
    });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_config_send")
      .setLabel("Envoyer le panneau")
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
      ok("Le panneau de tickets a ete envoye dans ce salon.")
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
        fail(`Tu as deja un ticket ouvert : ${existing}`)
      ]
    });
  }

  if (!guild.members.me?.permissions.has(P.ManageChannels)) {
    return interaction.editReply({
      embeds: [
        fail(
          "Il me faut la permission Gerer les salons pour creer un ticket."
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
    .setTitle("Ticket ouvert")
    .setDescription(
      "Explique ton probleme en detail, l'equipe va te repondre des que possible.\n\nQuand c'est regle, clique sur Fermer le ticket."
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("Fermer le ticket")
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
      .setTitle("Ticket ouvert")
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
      ok("Ticket ferme. Suppression du salon dans 5 secondes...")
    ]
  });

  await sendLog(
    guild,
    new EmbedBuilder()
      .setColor(COLORS.error)
      .setTitle("Ticket ferme")
      .setDescription(
        `#${channel.name} ferme par ${user}`
      )
      .setTimestamp()
  );

  setTimeout(
    () =>
      channel
        .delete(`Ticket ferme par ${user.tag}`)
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
        content: "Tu dois avoir la permission Gerer le serveur.",
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
'@ | Set-Content ".\utils\tickets.js" -Encoding UTF8

@'
const {
  Events,
  MessageFlags
} = require("discord.js");

const {
  handleTicketInteraction
} = require("../utils/tickets");

const {
  joinGiveaway
} = require("../utils/giveaways");

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        if (!interaction.inGuild()) {
          return interaction.reply({
            content:
              "Cette commande fonctionne uniquement dans un serveur.",
            flags: MessageFlags.Ephemeral
          });
        }

        const command =
          interaction.client.commands.get(
            interaction.commandName
          );

        if (command) {
          await command.execute(interaction);
        }

        return;
      }

      if (
        interaction.isButton() ||
        interaction.isStringSelectMenu() ||
        interaction.isChannelSelectMenu() ||
        interaction.isRoleSelectMenu() ||
        interaction.isModalSubmit()
      ) {
        const id = interaction.customId || "";

        if (id.startsWith("ticket_")) {
          await handleTicketInteraction(interaction);
          return;
        }

        if (id.startsWith("gw_join:")) {
          await joinGiveaway(interaction);
        }
      }
    } catch (error) {
      console.error(
        "Erreur interaction :",
        error
      );

      const payload = {
        content: "Une erreur est survenue.",
        flags: MessageFlags.Ephemeral
      };

      if (
        interaction.replied ||
        interaction.deferred
      ) {
        await interaction
          .followUp(payload)
          .catch(() => {});
      } else {
        await interaction
          .reply(payload)
          .catch(() => {});
      }
    }
  }
};
'@ | Set-Content ".\events\interactionCreate.js" -Encoding UTF8

Write-Host ""
Write-Host "Verification JavaScript..." -ForegroundColor Yellow
Write-Host ""

node --check ".\commands\admin\ticketconfig.js"
if ($LASTEXITCODE -ne 0) {
    throw "ticketconfig.js invalide."
}

node --check ".\utils\tickets.js"
if ($LASTEXITCODE -ne 0) {
    throw "tickets.js invalide."
}

node --check ".\events\interactionCreate.js"
if ($LASTEXITCODE -ne 0) {
    throw "interactionCreate.js invalide."
}

Write-Host "JavaScript valide." -ForegroundColor Green

Write-Host ""
Write-Host "Preparation Git..." -ForegroundColor Yellow

git add `
    ".\commands\admin\ticketconfig.js" `
    ".\utils\tickets.js" `
    ".\events\interactionCreate.js"

if ($LASTEXITCODE -ne 0) {
    throw "git add a echoue."
}

$changes = git diff --cached --name-only

if ($changes) {
    git commit -m "Ajout systeme de tickets"

    if ($LASTEXITCODE -ne 0) {
        throw "Le commit Git a echoue."
    }

    git push origin main

    if ($LASTEXITCODE -ne 0) {
        throw "Le push GitHub a echoue."
    }

    Write-Host ""
    Write-Host "GitHub mis a jour !" -ForegroundColor Green
}
else {
    Write-Host "Aucun changement Git." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "                  TERMINE" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Apres le redeploiement Railway :"
Write-Host "1. Discord -> /ticket-config"
Write-Host "2. Clique sur Envoyer le panneau"
Write-Host "3. Le panneau apparait dans le salon"
Write-Host "4. Clique sur Ouvrir un ticket"
Write-Host ""