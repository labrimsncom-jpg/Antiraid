const { Events, EmbedBuilder } = require("discord.js");
const { COLORS } = require("../utils/embeds");
const { sendLog } = require("../utils/logger");

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    await sendLog(
      member.guild,
      new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle("📤 Membre parti")
        .setDescription(`${member.user} (\`${member.user.tag}\`)`)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp()
    );
  },
};
