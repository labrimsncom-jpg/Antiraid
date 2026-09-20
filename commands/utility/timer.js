const { SlashCommandBuilder } = require("discord.js");
const { ok } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timer")
    .setDescription("Lance un minuteur : je te ping quand il est terminé")
    .addIntegerOption((o) => o.setName("minutes").setDescription("Durée en minutes (1 à 1440)").setRequired(true).setMinValue(1).setMaxValue(1440))
    .addStringOption((o) => o.setName("raison").setDescription("Rappel associé (optionnel)").setMaxLength(200)),

  async execute(interaction) {
    const minutes = interaction.options.getInteger("minutes");
    const reason = interaction.options.getString("raison");
    const { channel, user } = interaction;

    await interaction.reply({ embeds: [ok(`⏲️ Minuteur de **${minutes} minute(s)** lancé.${reason ? `\nRappel : ${reason}` : ""}`)] });

    setTimeout(() => {
      channel
        .send({ content: `⏰ ${user}, ton minuteur de ${minutes} minute(s) est terminé !${reason ? ` (${reason})` : ""}`, allowedMentions: { users: [user.id] } })
        .catch(() => {});
    }, minutes * 60_000);
  },
};
