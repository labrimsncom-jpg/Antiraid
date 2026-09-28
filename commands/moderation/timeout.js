const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Mettre un membre en timeout")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName("membre").setDescription("Membre").setRequired(true))
    .addIntegerOption((o) => o.setName("minutes").setDescription("Duree en minutes").setMinValue(1).setMaxValue(40320).setRequired(true))
    .addStringOption((o) => o.setName("raison").setDescription("Raison").setMaxLength(300)),

  async execute(interaction) {
    const target = interaction.options.getMember("membre");
    const minutes = interaction.options.getInteger("minutes");
    const reason = interaction.options.getString("raison") || "Aucune raison";

    if (!target) {
      return interaction.reply({ content: "Membre introuvable.", flags: MessageFlags.Ephemeral });
    }

    if (!target.moderatable) {
      return interaction.reply({ content: "Je ne peux pas timeout ce membre.", flags: MessageFlags.Ephemeral });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: "Tu ne peux pas te timeout toi-meme.", flags: MessageFlags.Ephemeral });
    }

    await target.timeout(minutes * 60 * 1000, reason);

    return interaction.reply({
      content: `${target} est en timeout pendant ${minutes} minute(s). Raison : ${reason}`,
    });
  },
};