const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const db = require("./db");

const timers = new Map();

const unix = (ms) => Math.floor(ms / 1000);

function giveawayEmbed(g) {
  const embed = new EmbedBuilder().setTitle(`🎉 ${g.prize}`).setColor(g.ended ? 0x99aab5 : 0xeb459e);
  if (g.ended) {
    const list = g.winnerIds.length ? g.winnerIds.map((id) => `<@${id}>`).join(", ") : "Personne";
    return embed.setDescription(`**Giveaway terminé !**\n🏆 Gagnant(s) : ${list}\n👑 Organisateur : <@${g.hostId}>`);
  }
  return embed.setDescription(
    `Clique sur le bouton pour participer !\n\n⏰ Fin : <t:${unix(g.endsAt)}:R>\n🏆 Gagnant(s) : **${g.winners}**\n` +
      `👑 Organisateur : <@${g.hostId}>\n👥 Participants : **${g.entries.length}**`
  );
}

const joinRow = (id) =>
  new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`gw_join:${id}`).setLabel("Participer").setEmoji("🎉").setStyle(ButtonStyle.Primary)
  );

function pickWinners(entries, count) {
  const pool = [...entries];
  const winners = [];
  while (winners.length < count && pool.length) winners.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return winners;
}

async function fetchMessage(client, g) {
  const channel = await client.channels.fetch(g.channelId).catch(() => null);
  const message = channel ? await channel.messages.fetch(g.messageId).catch(() => null) : null;
  return { channel, message };
}

// Termine (ou retire) un giveaway. reroll = true : nouveau tirage sur un giveaway déjà terminé
async function endGiveaway(client, id, { reroll = false } = {}) {
  const g = db.giveaways.get(id);
  if (!g || (g.ended && !reroll)) return null;
  clearTimeout(timers.get(id));
  timers.delete(id);

  g.ended = true;
  g.winnerIds = pickWinners(g.entries, g.winners);
  db.giveaways.set(id, g);

  const { channel, message } = await fetchMessage(client, g);
  await message?.edit({ embeds: [giveawayEmbed(g)], components: [] }).catch(() => {});
  if (channel) {
    const text = g.winnerIds.length
      ? `🎉 Félicitations ${g.winnerIds.map((w) => `<@${w}>`).join(", ")} ! Vous avez gagné **${g.prize}** !`
      : `😕 Personne n'a participé au giveaway **${g.prize}**.`;
    await channel.send({ content: text, allowedMentions: { users: g.winnerIds } }).catch(() => {});
  }
  return g;
}

function schedule(client, g) {
  const delay = Math.max(g.endsAt - Date.now(), 0);
  timers.set(g.id, setTimeout(() => endGiveaway(client, g.id), delay));
}

function rescheduleAll(client) {
  for (const g of db.giveaways.all()) if (!g.ended) schedule(client, g);
}

// Clic sur le bouton « Participer »
async function joinGiveaway(interaction) {
  const id = interaction.customId.split(":")[1];
  const g = db.giveaways.get(id);
  if (!g || g.ended) {
    return interaction.reply({ content: "❌ Ce giveaway est terminé.", flags: MessageFlags.Ephemeral });
  }
  if (g.entries.includes(interaction.user.id)) {
    return interaction.reply({ content: "✅ Tu participes déjà !", flags: MessageFlags.Ephemeral });
  }
  g.entries.push(interaction.user.id);
  db.giveaways.set(id, g);
  await interaction.update({ embeds: [giveawayEmbed(g)] });
  await interaction.followUp({ content: "🎉 Participation enregistrée, bonne chance !", flags: MessageFlags.Ephemeral });
}

module.exports = { giveawayEmbed, joinRow, schedule, rescheduleAll, endGiveaway, joinGiveaway };
