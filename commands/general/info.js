const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Afficher les informations du serveur"),

  async execute(interaction) {
    const guild = interaction.guild;

    const embed = new EmbedBuilder()
      .setTitle(`ℹ️ Informations — ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: "👑 Propriétaire", value: `<@${guild.ownerId}>`, inline: true },
        { name: "👥 Membres", value: `${guild.memberCount}`, inline: true },
        { name: "💬 Salons", value: `${guild.channels.cache.size}`, inline: true },
        { name: "🎭 Rôles", value: `${guild.roles.cache.size}`, inline: true },
        { name: "🆔 ID", value: guild.id, inline: true },
        {
          name: "📅 Créé le",
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,
          inline: true
        }
      )
      .setColor(0x5865F2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
