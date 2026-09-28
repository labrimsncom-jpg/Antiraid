const { Events, ChannelType } = require("discord.js");
const db = require("../utils/db");

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    const tv = db.getSettings(newState.guild.id).tempVoice;
    if (!tv) return;

    if (newState.channelId === tv.lobbyId) {
      const c = await newState.guild.channels.create({
        name: `${tv.prefix} ${newState.member.displayName}`.slice(0, 100),
        type: ChannelType.GuildVoice,
        parent: tv.categoryId
      }).catch(() => null);

      if (c) await newState.setChannel(c).catch(() => {});
    }

    if (oldState.channelId && oldState.channelId !== tv.lobbyId) {
      const c = oldState.guild.channels.cache.get(oldState.channelId);
      if (c && c.parentId === tv.categoryId && c.members.size === 0) {
        await c.delete().catch(() => {});
      }
    }
  }
};