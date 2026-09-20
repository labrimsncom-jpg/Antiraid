const { SlashCommandBuilder } = require("discord.js");
const { info, fail } = require("../../utils/embeds");
const { getJson } = require("../../utils/http");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("define")
    .setDescription("Cherche la définition d'un mot")
    .addStringOption((o) => o.setName("mot").setDescription("Mot à chercher").setRequired(true).setMaxLength(60))
    .addStringOption((o) =>
      o
        .setName("langue")
        .setDescription("Langue du mot (français par défaut)")
        .addChoices({ name: "Français", value: "fr" }, { name: "English", value: "en" })
    ),

  async execute(interaction) {
    const word = interaction.options.getString("mot").trim();
    const lang = interaction.options.getString("langue") ?? "fr";

    await interaction.deferReply();
    try {
      const data = await getJson(`https://api.dictionaryapi.dev/api/v2/entries/${lang}/${encodeURIComponent(word)}`);
      const embed = info(`📖 ${data[0].word}`);
      for (const meaning of data[0].meanings.slice(0, 3)) {
        const def = meaning.definitions[0];
        embed.addFields({
          name: meaning.partOfSpeech || "Définition",
          value: `${def.definition}${def.example ? `\n*${def.example}*` : ""}`.slice(0, 1000),
        });
      }
      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply({ embeds: [fail(`Aucune définition trouvée pour **${word}**.`)] });
    }
  },
};
