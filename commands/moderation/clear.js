const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { ok, fail } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Supprime des messages dans ce salon")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((o) =>
      o.setName("nombre").setDescription("Nombre de messages (1 à 100)").setRequired(true).setMinValue(1).setMaxValue(100)
    )
    .addUserOption((o) => o.setName("membre").setDescription("Supprimer seulement les messages de ce membre")),

  async execute(interaction) {
    const amount = interaction.options.getInteger("nombre");
    const target = interaction.options.getUser("membre");
    const channel = interaction.channel;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      let deleted;
      if (target) {
        const fetched = await channel.messages.fetch({ limit: 100 });
        const messages = fetched.filter((m) => m.author.id === target.id).first(amount);
        deleted = await channel.bulkDelete(messages, true);
      } else {
        deleted = await channel.bulkDelete(amount, true);
      }
      await interaction.editReply({
        embeds: [ok(`${deleted.size} message(s) supprimé(s). (Discord ne permet pas de supprimer en masse les messages de plus de 14 jours.)`)],
      });
    } catch {
      await interaction.editReply({ embeds: [fail("Impossible de supprimer les messages (permission **Gérer les messages** manquante ?).")] });
    }
  },
};
