const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("../../utils/db");
const { info } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Affiche les avertissements d'un membre")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName("membre").setDescription("Membre").setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser("membre");
    const list = db.getWarnings(interaction.guild.id, user.id);

    const embed = info(`⚠️ Avertissements de ${user.tag}`);
    if (list.length === 0) {
      embed.setDescription("Aucun avertissement. 🎉");
    } else {
      embed.setDescription(
        list
          .slice(-10)
          .reverse()
          .map((w) => `**#${w.id}** — ${w.reason}\n> par <@${w.moderatorId}> • <t:${Math.floor(w.date / 1000)}:R>`)
          .join("\n\n")
      );
      embed.setFooter({ text: `${list.length} avertissement(s) au total (10 derniers affichés)` });
    }
    await interaction.reply({ embeds: [embed] });
  },
};
