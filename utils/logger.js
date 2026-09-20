const db = require("./db");

// Envoie un embed dans le salon de logs configuré avec /setup logs
async function sendLog(guild, embed) {
  const { logChannelId } = db.getSettings(guild.id);
  if (!logChannelId) return;
  const channel = await guild.channels.fetch(logChannelId).catch(() => null);
  if (!channel?.isTextBased()) return;
  await channel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = { sendLog };
