const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { COLORS, fail } = require("./embeds");
const { EmbedBuilder } = require("discord.js");
const { getJson } = require("./http");

// Fabrique une commande sociale (hug, kiss, slap) avec un GIF venant de nekos.best
function makeSocial({ name, description, endpoint, text }) {
  return {
    data: new SlashCommandBuilder()
      .setName(name)
      .setDescription(description)
      .addUserOption((o) => o.setName("membre").setDescription("Membre ciblé").setRequired(true)),

    async execute(interaction) {
      const target = interaction.options.getUser("membre");
      if (target.id === interaction.user.id) {
        return interaction.reply({ embeds: [fail("Choisis quelqu'un d'autre 😅")], flags: MessageFlags.Ephemeral });
      }

      const embed = new EmbedBuilder().setColor(COLORS.primary).setDescription(`**${interaction.user.username}** ${text} **${target.username}**`);
      await interaction.deferReply();
      try {
        const data = await getJson(`https://nekos.best/api/v2/${endpoint}`);
        embed.setImage(data.results[0].url);
      } catch {
        // pas de GIF disponible : on envoie quand même le texte
      }
      await interaction.editReply({ content: `${target}`, embeds: [embed], allowedMentions: { users: [target.id] } });
    },
  };
}

module.exports = { makeSocial };
