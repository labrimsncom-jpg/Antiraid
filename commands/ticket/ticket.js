const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const {
  transcript,
  ticketOwner,
} = require("../../utils/holy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Gestion avancee des tickets")

    .addSubcommand((s) =>
      s
        .setName("claim")
        .setDescription("Prendre en charge le ticket")
    )

    .addSubcommand((s) =>
      s
        .setName("add")
        .setDescription("Ajouter un membre au ticket")
        .addUserOption((o) =>
          o
            .setName("membre")
            .setDescription("Membre")
            .setRequired(true)
        )
    )

    .addSubcommand((s) =>
      s
        .setName("remove")
        .setDescription("Retirer un membre du ticket")
        .addUserOption((o) =>
          o
            .setName("membre")
            .setDescription("Membre")
            .setRequired(true)
        )
    )

    .addSubcommand((s) =>
      s
        .setName("transcript")
        .setDescription("Generer le transcript du ticket")
    )

    .addSubcommand((s) =>
      s
        .setName("close")
        .setDescription("Fermer le ticket")
    ),

  async execute(interaction) {
    const channel = interaction.channel;
    const owner = ticketOwner(channel);

    if (!owner) {
      return interaction.reply({
        content: "Ce salon n'est pas un ticket.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "claim") {
      await channel.setTopic(
        `ticket:${owner}:claimed:${interaction.user.id}`
      );

      return interaction.reply(
        `Ticket pris en charge par ${interaction.user}.`
      );
    }

    if (sub === "add") {
      const member =
        interaction.options.getMember("membre");

      await channel.permissionOverwrites.edit(
        member.id,
        {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
          AttachFiles: true,
          EmbedLinks: true,
        }
      );

      return interaction.reply(
        `${member} a ete ajoute au ticket.`
      );
    }

    if (sub === "remove") {
      const member =
        interaction.options.getMember("membre");

      if (member.id === owner) {
        return interaction.reply({
          content:
            "Impossible de retirer le proprietaire du ticket.",
          flags: MessageFlags.Ephemeral,
        });
      }

      await channel.permissionOverwrites
        .delete(member.id)
        .catch(() => {});

      return interaction.reply(
        `${member} a ete retire du ticket.`
      );
    }

    if (sub === "transcript") {
      const text = await transcript(channel);
      const buffer = Buffer.from(
        text || "Aucun message.",
        "utf8"
      );

      return interaction.reply({
        content: "Transcript genere.",
        files: [
          {
            attachment: buffer,
            name: `${channel.name}-transcript.txt`,
          },
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "close") {
      if (
        !interaction.memberPermissions.has(
          PermissionFlagsBits.ManageChannels
        ) &&
        interaction.user.id !== owner
      ) {
        return interaction.reply({
          content: "Tu ne peux pas fermer ce ticket.",
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.reply(
        "Ticket ferme. Suppression dans 5 secondes."
      );

      setTimeout(
        () =>
          channel
            .delete("Ticket ferme")
            .catch(() => {}),
        5000
      );
    }
  },
};
