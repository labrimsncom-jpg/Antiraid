const { Events, MessageFlags, EmbedBuilder } = require("discord.js");
const {
  voteSuggestion,
  getSuggestion,
  setSuggestionStatus,
} = require("../utils/holy");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) return;

    try {
      const id = interaction.customId || "";

      if (id.startsWith("holy_suggest_up:") || id.startsWith("holy_suggest_down:")) {
        const [kind, suggestionId] = id.split(":");
        const item = getSuggestion(interaction.guild.id, Number(suggestionId));

        if (!item) {
          return interaction.reply({ content: "Suggestion introuvable.", flags: MessageFlags.Ephemeral });
        }

        const direction = kind.endsWith("up") ? "up" : "down";
        const updated = voteSuggestion(interaction.guild.id, Number(suggestionId), interaction.user.id, direction);

        return interaction.reply({
          content: `Vote enregistre. ${updated.up.length} pour / ${updated.down.length} contre.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (id.startsWith("holy_suggest_status:")) {
        const [, suggestionId, status] = id.split(":");
        if (!interaction.memberPermissions?.has("ManageGuild")) {
          return interaction.reply({ content: "Permission insuffisante.", flags: MessageFlags.Ephemeral });
        }
        const updated = setSuggestionStatus(interaction.guild.id, Number(suggestionId), status);
        if (!updated) return interaction.reply({ content: "Suggestion introuvable.", flags: MessageFlags.Ephemeral });
        return interaction.reply(`Suggestion #${suggestionId} : ${status}.`);
      }
    } catch (error) {
      console.error("Holy interaction error:", error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "Erreur.", flags: MessageFlags.Ephemeral }).catch(() => {});
      }
    }
  },
};