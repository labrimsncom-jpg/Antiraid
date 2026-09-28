const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");

const {
  getLeaderboard,
} = require("../../utils/holy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Afficher le classement XP"),

  async execute(interaction) {
    const rows = getLeaderboard(interaction.guild.id).slice(0, 10);

    if (!rows.length) {
      return interaction.reply(
        "Aucun XP enregistre pour le moment."
      );
    }

    const lines = rows.map(
      (r, i) =>
        `${i + 1}. <@${r.userId}> - niveau ${r.level} - ${r.xp} XP`
    );

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Classement XP")
      .setDescription(lines.join("\n"));

    return interaction.reply({
      embeds: [embed],
    });
  },
};
