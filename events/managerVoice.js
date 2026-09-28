const { ChannelType, PermissionsBitField } = require("discord.js");

module.exports = {
  name: "voiceStateUpdate",

  async execute(oldState, newState) {
    const guild = newState.guild || oldState.guild;
    if (!guild) return;

    const config = guild.client.tempVoiceConfig?.get?.(guild.id);
    if (!config) return;

    if (
      newState.channelId === config.triggerChannelId &&
      oldState.channelId !== newState.channelId
    ) {
      const category = config.categoryId
        ? guild.channels.cache.get(config.categoryId)
        : null;

      const channel = await guild.channels.create({
        name: `Vocal de ${newState.member.user.username}`.slice(0, 100),
        type: ChannelType.GuildVoice,
        parent: category?.type === ChannelType.GuildCategory ? category.id : undefined,
        permissionOverwrites: [
          {
            id: newState.member.id,
            allow: [
              PermissionsBitField.Flags.Connect,
              PermissionsBitField.Flags.Speak,
              PermissionsBitField.Flags.MoveMembers,
              PermissionsBitField.Flags.ManageChannels
            ]
          }
        ]
      });

      await newState.setChannel(channel);

      if (!guild.client.tempVoiceChannels) {
        guild.client.tempVoiceChannels = new Set();
      }

      guild.client.tempVoiceChannels.add(channel.id);
    }

    if (
      oldState.channelId &&
      guild.client.tempVoiceChannels?.has?.(oldState.channelId)
    ) {
      const oldChannel = guild.channels.cache.get(oldState.channelId);

      if (oldChannel && oldChannel.members.size === 0) {
        guild.client.tempVoiceChannels.delete(oldChannel.id);
        await oldChannel.delete().catch(() => {});
      }
    }
  }
};