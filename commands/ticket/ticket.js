const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { fail, ok } = require("../../utils/embeds");
const {
  resolveTicket,
  isStaff,
  claimTicket,
  unclaimTicket,
  grantMembers,
  revokeMembers,
  sendTranscript,
  renameTicket,
  closeTicket,
} = require("../../utils/tickets");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Gère le ticket de ce salon")
    .addSubcommand((s) => s.setName("claim").setDescription("Prendre en charge le ticket"))
    .addSubcommand((s) => s.setName("unclaim").setDescription("Libérer le ticket (le désassigner)"))
    .addSubcommand((s) =>
      s
        .setName("add")
        .setDescription("Ajouter un membre au ticket")
        .addUserOption((o) => o.setName("membre").setDescription("Membre").setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName("remove")
        .setDescription("Retirer un membre du ticket")
        .addUserOption((o) => o.setName("membre").setDescription("Membre").setRequired(true))
    )
    .addSubcommand((s) => s.setName("transcript").setDescription("Générer le transcript du ticket"))
    .addSubcommand((s) =>
      s
        .setName("rename")
        .setDescription("Renommer le salon du ticket")
        .addStringOption((o) => o.setName("nom").setDescription("Nouveau nom").setRequired(true).setMaxLength(90))
    )
    .addSubcommand((s) =>
      s
        .setName("close")
        .setDescription("Fermer le ticket")
        .addStringOption((o) => o.setName("raison").setDescription("Raison de la fermeture").setMaxLength(500))
    ),

  async execute(interaction) {
    const rec = resolveTicket(interaction.channel);
    if (!rec) {
      return interaction.reply({ embeds: [fail("Ce salon n'est pas un ticket.")], flags: MessageFlags.Ephemeral });
    }

    const sub = interaction.options.getSubcommand();
    if (sub === "close") return closeTicket(interaction, interaction.options.getString("raison"));

    if (!isStaff(interaction.member, rec)) {
      return interaction.reply({ embeds: [fail("Seule l'équipe peut utiliser cette commande.")], flags: MessageFlags.Ephemeral });
    }

    switch (sub) {
      case "claim":
        return claimTicket(interaction, rec);
      case "unclaim":
        return unclaimTicket(interaction, rec);
      case "transcript":
        return sendTranscript(interaction, rec);
      case "rename":
        return renameTicket(interaction, rec, interaction.options.getString("nom"));
      case "add": {
        const user = interaction.options.getUser("membre");
        await grantMembers(interaction.channel, [user.id]);
        return interaction.reply({ embeds: [ok(`${user} a été ajouté au ticket.`)], allowedMentions: { users: [user.id] } });
      }
      case "remove": {
        const user = interaction.options.getUser("membre");
        const removed = await revokeMembers(interaction.channel, rec, [user.id]);
        if (!removed.length) {
          return interaction.reply({ embeds: [fail("Ce membre n'a pas d'accès direct (ou c'est l'auteur du ticket).")], flags: MessageFlags.Ephemeral });
        }
        return interaction.reply({ embeds: [ok(`${user} a été retiré du ticket.`)], allowedMentions: { parse: [] } });
      }
    }
  },
};