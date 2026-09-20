const { Events, EmbedBuilder } = require("discord.js");
const db = require("../utils/db");
const { COLORS } = require("../utils/embeds");
const { sendLog } = require("../utils/logger");
const { handleJoin } = require("../utils/shield");

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    // Anti-raid : si le membre est bloqué, on n'envoie ni bienvenue ni rôle
    if (await handleJoin(member)) return;

    const { guild } = member;
    const settings = db.getSettings(guild.id);

    if (settings.autoroleId) {
      await member.roles.add(settings.autoroleId, "Rôle automatique").catch(() => {});
    }

    if (settings.welcomeChannelId) {
      const channel = await guild.channels.fetch(settings.welcomeChannelId).catch(() => null);
      if (channel?.isTextBased()) {
        const template = settings.welcomeMessage ?? "Bienvenue {user} sur **{server}** ! Nous sommes maintenant {count} membres 🎉";
        const content = template
          .replaceAll("{user}", `${member}`)
          .replaceAll("{server}", guild.name)
          .replaceAll("{count}", `${guild.memberCount}`);
        await channel.send({ content, allowedMentions: { users: [member.id] } }).catch(() => {});
      }
    }

    await sendLog(
      guild,
      new EmbedBuilder()
        .setColor(COLORS.success)
        .setTitle("📥 Membre arrivé")
        .setDescription(`${member} (\`${member.user.tag}\`)`)
        .addFields({ name: "Compte créé", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>` })
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp()
    );
  },
};
