const { SlashCommandBuilder } = require("discord.js");
const { info, fail } = require("../../utils/embeds");
const { getJson } = require("../../utils/http");

module.exports = {
  data: new SlashCommandBuilder().setName("meme").setDescription("Affiche un meme au hasard"),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      let meme = null;
      for (let i = 0; i < 3 && !meme; i++) {
        const data = await getJson("https://meme-api.com/gimme");
        if (!data.nsfw && !data.spoiler) meme = data;
      }
      if (!meme) throw new Error("no meme");
      const embed = info(meme.title.slice(0, 250)).setURL(meme.postLink).setImage(meme.url).setFooter({ text: `r/${meme.subreddit}` });
      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply({ embeds: [fail("Impossible de récupérer un meme, réessaie dans un instant.")] });
    }
  },
};
