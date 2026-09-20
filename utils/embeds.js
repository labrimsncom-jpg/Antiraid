const { EmbedBuilder } = require("discord.js");

const COLORS = {
  primary: 0x5865f2,
  success: 0x57f287,
  error: 0xed4245,
  warn: 0xfee75c,
};

const base = (color, description) => new EmbedBuilder().setColor(color).setDescription(description);

module.exports = {
  COLORS,
  ok: (description) => base(COLORS.success, `✅ ${description}`),
  fail: (description) => base(COLORS.error, `❌ ${description}`),
  info: (title) => new EmbedBuilder().setColor(COLORS.primary).setTitle(title).setTimestamp(),
};
