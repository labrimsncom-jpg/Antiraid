const { Events, EmbedBuilder } = require("discord.js");

const OWNER_ID = process.env.BOT_OWNER_ID;

module.exports = {
  name: Events.GuildMemberAdd,

  async execute(member) {
    if (!OWNER_ID || member.id !== OWNER_ID) return;

    const guild = member.guild;

    const channel =
      guild.systemChannel ||
      guild.channels.cache
        .filter(
          (c) =>
            c.isTextBased() &&
            c.permissionsFor(guild.members.me)?.has("SendMessages")
        )
        .sort((a, b) => a.rawPosition - b.rawPosition)
        .first();

    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setDescription(
        `⚡ **Le créateur de Main bot est là**\n\n` +
        `**${member.user.tag}** — **Owner de Main bot** — vient de rejoindre **${guild.name}**.\n\n` +
        `> 🫡 **Accueil premium**`
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setTimestamp();

    await channel.send({
      content: `**${member.user}**`,
      embeds: [embed],
    }).catch((error) => {
      console.error("Impossible d'envoyer le message ownerWelcome :", error);
    });
  },
};
