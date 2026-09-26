const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require("discord.js");
const { createSuggestion, settings } = require("../../utils/holy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Envoyer une suggestion")
    .addStringOption((o) =>
      o.setName("idee").setDescription("Ta suggestion").setMinLength(5).setMaxLength(1000).setRequired(true)
    ),

  async execute(interaction) {
    const h = settings(interaction.guild.id);
    const channelId = h.suggestions.channelId;

    if (!channelId) {
      return interaction.reply({
        content: "Le salon des suggestions n'est pas configure. Utilise /holy-config suggestions.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) {
      return interaction.reply({
        content: "Le salon des suggestions configure est introuvable.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const item = createSuggestion(
      interaction.guild.id,
      interaction.user.id,
      interaction.options.getString("idee", true)
    );

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`Suggestion #${item.id}`)
      .setDescription(item.text)
      .addFields(
        { name: "Auteur", value: `${interaction.user}`, inline: true },
        { name: "Votes", value: "0 pour / 0 contre", inline: true },
        { name: "Statut", value: "En attente", inline: true }
      )
      .setTimestamp();

    await channel.send({
      embeds: [embed],
      components: [
        {
          type: 1,
          components: [
            { type: 2, custom_id: `holy_suggest_up:${item.id}`, label: "Pour", style: 3 },
            { type: 2, custom_id: `holy_suggest_down:${item.id}`, label: "Contre", style: 4 },
          ],
        },
      ],
    });

    return interaction.reply({
      content: `Suggestion #${item.id} envoyee dans ${channel}.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
