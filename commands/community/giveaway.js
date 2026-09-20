const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require("discord.js");
const db = require("../../utils/db");
const { ok, fail } = require("../../utils/embeds");
const { giveawayEmbed, joinRow, schedule, endGiveaway } = require("../../utils/giveaways");

const UNITS = { s: 1000, m: 60_000, h: 3_600_000, j: 86_400_000, d: 86_400_000 };

// "30m", "2h", "1j" ... → millisecondes (ou null)
function parseDuration(text) {
  const match = /^(\d+)\s*([smhjd])$/i.exec(text.trim());
  return match ? Number(match[1]) * UNITS[match[2].toLowerCase()] : null;
}

const findByMessage = (guildId, messageId) => db.giveaways.all().find((g) => g.guildId === guildId && g.messageId === messageId);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Organise des giveaways")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName("start")
        .setDescription("Lance un giveaway")
        .addStringOption((o) => o.setName("lot").setDescription("Ce qui est à gagner").setRequired(true).setMaxLength(200))
        .addStringOption((o) => o.setName("duree").setDescription("Durée : 30m, 2h, 1j… (1 minute à 14 jours)").setRequired(true))
        .addIntegerOption((o) => o.setName("gagnants").setDescription("Nombre de gagnants (1 à 10)").setMinValue(1).setMaxValue(10))
        .addChannelOption((o) => o.setName("salon").setDescription("Salon du giveaway (par défaut : celui-ci)").addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand((s) =>
      s
        .setName("end")
        .setDescription("Termine un giveaway tout de suite")
        .addStringOption((o) => o.setName("message_id").setDescription("ID du message du giveaway").setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName("reroll")
        .setDescription("Refait un tirage sur un giveaway terminé")
        .addStringOption((o) => o.setName("message_id").setDescription("ID du message du giveaway").setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const reply = (embed) => interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    if (sub === "start") {
      const duration = parseDuration(interaction.options.getString("duree"));
      if (!duration || duration < 60_000 || duration > 14 * 86_400_000) {
        return reply(fail("Durée invalide. Exemples : `30m`, `2h`, `1j` (entre 1 minute et 14 jours)."));
      }
      const channel = interaction.options.getChannel("salon") ?? interaction.channel;
      const giveaway = {
        id: Date.now().toString(36),
        guildId: interaction.guild.id,
        channelId: channel.id,
        messageId: null,
        prize: interaction.options.getString("lot"),
        hostId: interaction.user.id,
        winners: interaction.options.getInteger("gagnants") ?? 1,
        endsAt: Date.now() + duration,
        entries: [],
        ended: false,
        winnerIds: [],
      };

      let message;
      try {
        message = await channel.send({ embeds: [giveawayEmbed(giveaway)], components: [joinRow(giveaway.id)] });
      } catch {
        return reply(fail(`Je ne peux pas écrire dans ${channel}.`));
      }
      giveaway.messageId = message.id;
      db.giveaways.set(giveaway.id, giveaway);
      schedule(interaction.client, giveaway);
      return reply(ok(`Giveaway lancé dans ${channel} : [voir le message](${message.url})`));
    }

    const g = findByMessage(interaction.guild.id, interaction.options.getString("message_id").trim());
    if (!g) return reply(fail("Giveaway introuvable. Donne l'ID du message du giveaway."));

    if (sub === "end") {
      if (g.ended) return reply(fail("Ce giveaway est déjà terminé."));
      await endGiveaway(interaction.client, g.id);
      return reply(ok("Giveaway terminé."));
    }

    // reroll
    if (!g.ended) return reply(fail("Ce giveaway n'est pas encore terminé. Utilise `/giveaway end`."));
    await endGiveaway(interaction.client, g.id, { reroll: true });
    return reply(ok("Nouveau tirage effectué."));
  },
};
