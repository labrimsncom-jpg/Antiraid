const { SlashCommandBuilder } = require("discord.js");
const { info, fail } = require("../../utils/embeds");
const { getJson } = require("../../utils/http");

module.exports = {
  data: new SlashCommandBuilder().setName("dogpic").setDescription("Affiche la photo d'un chien au hasard"),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const data = await getJson("https://dog.ceo/api/breeds/image/random");
      await interaction.editReply({ embeds: [info("🐶 Woof !").setImage(data.message)] });
    } catch {
      await interaction.editReply({ embeds: [fail("Impossible de récupérer une photo, réessaie dans un instant.")] });
    }
  },
};
