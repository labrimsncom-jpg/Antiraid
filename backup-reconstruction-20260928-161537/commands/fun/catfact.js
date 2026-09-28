const { SlashCommandBuilder } = require("discord.js");
const { info, fail } = require("../../utils/embeds");
const { getJson } = require("../../utils/http");

module.exports = {
  data: new SlashCommandBuilder().setName("catfact").setDescription("Un fait intéressant sur les chats (en anglais)"),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const data = await getJson("https://catfact.ninja/fact");
      await interaction.editReply({ embeds: [info("🐱 Cat fact").setDescription(data.fact)] });
    } catch {
      await interaction.editReply({ embeds: [fail("Impossible de récupérer un fait, réessaie dans un instant.")] });
    }
  },
};
