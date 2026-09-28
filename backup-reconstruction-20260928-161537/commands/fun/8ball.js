const { SlashCommandBuilder } = require("discord.js");
const { info } = require("../../utils/embeds");

const REPONSES = [
  "Oui, c'est certain.", "Sans aucun doute.", "Tout indique que oui.", "Très probablement.",
  "Les signes sont favorables.", "Je ne sais pas, redemande plus tard.", "Impossible de le dire maintenant.",
  "Concentre-toi et redemande.", "N'y compte pas.", "Ma réponse est non.", "Mes sources disent non.",
  "Très peu probable.", "Franchement, non.",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Pose une question à la boule magique")
    .addStringOption((o) => o.setName("question").setDescription("Ta question").setRequired(true).setMaxLength(200)),

  async execute(interaction) {
    const question = interaction.options.getString("question");
    const reponse = REPONSES[Math.floor(Math.random() * REPONSES.length)];
    const embed = info("🎱 Boule magique").addFields({ name: "Question", value: question }, { name: "Réponse", value: reponse });
    await interaction.reply({ embeds: [embed] });
  },
};
