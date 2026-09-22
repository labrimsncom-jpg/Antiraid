const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Envoyer une annonce")
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("Message de l'annonce")
        .setRequired(true)
        .setMaxLength(4000)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString()),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: "❌ Tu dois avoir la permission **Gérer le serveur**.",
        ephemeral: true
      });
    }

    const message = interaction.options.getString("message");

    const embed = new EmbedBuilder()
      .setTitle("📢 ANNONCE")
      .setDescription(message)
      .setColor(0x5865F2)
      .setFooter({ text: `Annonce par ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed] });

    await interaction.reply({
      content: "✅ Annonce envoyée.",
      ephemeral: true
    });
  }
};
