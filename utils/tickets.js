const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits: P,
} = require("discord.js");
const db = require("./db");
const { COLORS, ok, fail } = require("./embeds");
const { sendLog } = require("./logger");

const MEMBER_PERMS = [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.AttachFiles, P.EmbedLinks];

async function openTicket(interaction) {
  const { guild, user } = interaction;
  const settings = db.getSettings(guild.id);
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const existing = guild.channels.cache.find((c) => c.topic === `ticket:${user.id}`);
  if (existing) return interaction.editReply({ embeds: [fail(`Tu as déjà un ticket ouvert : ${existing}`)] });

  if (!guild.members.me.permissions.has(P.ManageChannels)) {
    return interaction.editReply({ embeds: [fail("Il me faut la permission **Gérer les salons** pour créer un ticket.")] });
  }

  const overwrites = [
    { id: guild.roles.everyone.id, deny: [P.ViewChannel] },
    { id: user.id, allow: MEMBER_PERMS },
    { id: guild.members.me.id, allow: [...MEMBER_PERMS, P.ManageChannels] },
  ];
  if (settings.ticketRoleId) overwrites.push({ id: settings.ticketRoleId, allow: MEMBER_PERMS });

  const safeName = user.username.toLowerCase().replace(/[^a-z0-9-_]/g, "") || "membre";
  const channel = await guild.channels.create({
    name: `ticket-${safeName}`.slice(0, 90),
    type: ChannelType.GuildText,
    parent: settings.ticketCategoryId || undefined,
    topic: `ticket:${user.id}`,
    permissionOverwrites: overwrites,
  });

  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle("🎫 Ticket ouvert")
    .setDescription("Explique ton problème en détail, l'équipe va te répondre dès que possible.\nQuand c'est réglé, clique sur **Fermer le ticket**.");
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket_close").setLabel("Fermer le ticket").setEmoji("🔒").setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: `${user}${settings.ticketRoleId ? ` <@&${settings.ticketRoleId}>` : ""}`,
    embeds: [embed],
    components: [row],
    allowedMentions: { users: [user.id], roles: settings.ticketRoleId ? [settings.ticketRoleId] : [] },
  });

  await interaction.editReply({ embeds: [ok(`Ton ticket est ouvert : ${channel}`)] });
  await sendLog(guild, new EmbedBuilder().setColor(COLORS.success).setTitle("🎫 Ticket ouvert").setDescription(`${channel} par ${user}`).setTimestamp());
}

async function closeTicket(interaction) {
  const { guild, channel, user, member } = interaction;
  if (!channel.topic?.startsWith("ticket:")) {
    return interaction.reply({ embeds: [fail("Ce salon n'est pas un ticket.")], flags: MessageFlags.Ephemeral });
  }

  const ownerId = channel.topic.split(":")[1];
  const { ticketRoleId } = db.getSettings(guild.id);
  const allowed =
    member.permissions.has(P.ManageChannels) ||
    user.id === ownerId ||
    (ticketRoleId && member.roles.cache.has(ticketRoleId));
  if (!allowed) {
    return interaction.reply({ embeds: [fail("Tu ne peux pas fermer ce ticket.")], flags: MessageFlags.Ephemeral });
  }

  await interaction.reply({ embeds: [ok("Ticket fermé. Suppression du salon dans 5 secondes…")] });
  await sendLog(
    guild,
    new EmbedBuilder().setColor(COLORS.error).setTitle("🔒 Ticket fermé").setDescription(`\`#${channel.name}\` fermé par ${user}`).setTimestamp()
  );
  setTimeout(() => channel.delete(`Ticket fermé par ${user.tag}`).catch(() => {}), 5000);
}

module.exports = { openTicket, closeTicket };
