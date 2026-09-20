const { SlashCommandBuilder } = require("discord.js");
const { info } = require("../../utils/embeds");

const stamp = (ms) => `<t:${Math.floor(ms / 1000)}:D> (<t:${Math.floor(ms / 1000)}:R>)`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Affiche les informations d'un membre")
    .addUserOption((o) => o.setName("membre").setDescription("Membre (par défaut : toi)")),

  async execute(interaction) {
    const user = interaction.options.getUser("membre") ?? interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const embed = info(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "ID", value: user.id, inline: true },
        { name: "Bot", value: user.bot ? "Oui" : "Non", inline: true },
        { name: "Compte créé", value: stamp(user.createdTimestamp) }
      );

    if (member) {
      const roles = member.roles.cache.filter((r) => r.id !== interaction.guild.id).sort((a, b) => b.position - a.position);
      embed.addFields(
        { name: "A rejoint le serveur", value: stamp(member.joinedTimestamp) },
        { name: `Rôles (${roles.size})`, value: roles.size ? roles.first(15).join(" ") : "Aucun" }
      );
    }
    await interaction.reply({ embeds: [embed] });
  },
};
