const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("Afficher les informations du bot"),

  async execute(interaction) {
    const client = interaction.client;
    const memory = process.memoryUsage();

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Holy RP - Bot Info")
      .addFields(
        { name: "Serveurs", value: String(client.guilds.cache.size), inline: true },
        { name: "Commandes", value: String(client.commands.size), inline: true },
        { name: "Node", value: process.version, inline: true },
        { name: "RAM", value: `${Math.round(memory.rss / 1024 / 1024)} MB`, inline: true },
        { name: "Uptime", value: `${Math.floor(process.uptime() / 60)} min`, inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
