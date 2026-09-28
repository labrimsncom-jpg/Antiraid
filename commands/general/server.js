const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("Affiche la bannière ou l'icône du serveur")
    .addStringOption((o) =>
      o
        .setName("type")
        .setDescription("Élément à afficher")
        .setRequired(true)
        .addChoices(
          { name: "Bannière", value: "banner" },
          { name: "Icône", value: "icon" }
        )
    ),

  async execute(interaction) {
    const type = interaction.options.getString("type");
    const guild = interaction.guild;

    if (type === "banner") {
      const banner = guild.bannerURL({
        size: 4096,
        extension: "png",
      });

      if (!banner) {
        return interaction.reply({
          content: "Ce serveur n'a pas de bannière.",
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`Bannière de ${guild.name}`)
        .setImage(banner)
        .setColor(0x5865f2);

      return interaction.reply({ embeds: [embed] });
    }

    const icon = guild.iconURL({
      size: 4096,
      extension: "png",
    });

    if (!icon) {
      return interaction.reply({
        content: "Ce serveur n'a pas d'icône.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`Icône de ${guild.name}`)
      .setImage(icon)
      .setColor(0x5865f2);

    return interaction.reply({ embeds: [embed] });
  },
};