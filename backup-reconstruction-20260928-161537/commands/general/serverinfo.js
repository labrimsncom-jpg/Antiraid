const { SlashCommandBuilder } = require("discord.js");
const { info } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder().setName("serverinfo").setDescription("Affiche les informations du serveur"),

  async execute(interaction) {
    const g = interaction.guild;
    const embed = info(`🏠 ${g.name}`)
      .setThumbnail(g.iconURL({ size: 256 }))
      .addFields(
        { name: "Propriétaire", value: `<@${g.ownerId}>`, inline: true },
        { name: "Membres", value: `${g.memberCount}`, inline: true },
        { name: "Salons", value: `${g.channels.cache.size}`, inline: true },
        { name: "Rôles", value: `${g.roles.cache.size}`, inline: true },
        { name: "Boosts", value: `${g.premiumSubscriptionCount ?? 0}`, inline: true },
        { name: "Créé le", value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true }
      )
      .setFooter({ text: `ID : ${g.id}` });
    await interaction.reply({ embeds: [embed] });
  },
};
