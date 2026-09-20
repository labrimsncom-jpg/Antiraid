const { SlashCommandBuilder } = require("discord.js");
const { info, fail } = require("../../utils/embeds");
const { getJson } = require("../../utils/http");

module.exports = {
  data: new SlashCommandBuilder().setName("joke").setDescription("Raconte une blague au hasard"),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const data = await getJson("https://v2.jokeapi.dev/joke/Any?lang=fr&safe-mode");
      if (data.error) throw new Error("no joke");
      const text = data.type === "twopart" ? `${data.setup}\n\n||${data.delivery}||` : data.joke;
      await interaction.editReply({ embeds: [info("😂 Blague").setDescription(text)] });
    } catch {
      await interaction.editReply({ embeds: [fail("Je n'ai pas trouvé de blague, réessaie dans un instant.")] });
    }
  },
};
