const { SlashCommandBuilder } = require("discord.js");
const { info } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Affiche l'avatar d'un membre")
    .addUserOption((o) => o.setName("membre").setDescription("Membre (par défaut : toi)")),

  async execute(interaction) {
    const user = interaction.options.getUser("membre") ?? interaction.user;
    const embed = info(`🖼️ Avatar de ${user.username}`).setImage(user.displayAvatarURL({ size: 1024 }));
    await interaction.reply({ embeds: [embed] });
  },
};
