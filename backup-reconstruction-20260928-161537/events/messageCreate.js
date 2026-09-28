const { Events } = require("discord.js");
const { handleMessage } = require("../utils/shield");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot || !message.inGuild()) return;
    await handleMessage(message);
  },
};
