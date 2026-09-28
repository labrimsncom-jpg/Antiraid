const db = require("./db");

// Envoie un embed (et éventuellement des fichiers) dans le salon de logs configuré avec /setup logs
async function sendLog(guild, embed, files = []) {
  const { logChannelId } = db.getSettings(guild.id);
  if (!logChannelId) return;
  const channel = await guild.channels.fetch(logChannelId).catch(() => null);
  if (!channel?.isTextBased()) return;
  await channel.send({ embeds: [embed], files }).catch(() => {});
}

module.exports = { sendLog };