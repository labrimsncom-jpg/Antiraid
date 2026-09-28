const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../../utils/db");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("topinvites")
        .setDescription("Classement des membres qui ont le plus invité sur le serveur"),

    async execute(interaction) {
        const guildId = interaction.guild.id;

        const settings = db.getSettings(guildId) || {};
        const invites = settings.invites || {};

        const classement = Object.entries(invites)
            .map(([userId, data]) => ({
                userId,
                count: typeof data === "number"
                    ? data
                    : Number(data?.count || data?.invites || 0)
            }))
            .filter(entry => entry.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        if (!classement.length) {
            return interaction.reply({
                content: "Aucune statistique d'invitation n'est encore disponible.",
                ephemeral: true
            });
        }

        const lignes = [];

        for (let i = 0; i < classement.length; i++) {
            const membre = classement[i];

            const user = await interaction.client.users
                .fetch(membre.userId)
                .catch(() => null);

            const nom = user
                ? user.username
                : `Utilisateur ${membre.userId}`;

            lignes.push(
                `**${i + 1}.** ${nom} — **${membre.count}** invitation(s)`
            );
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("Classement des invitations")
            .setDescription(lignes.join("\n"))
            .setFooter({
                text: interaction.guild.name
            });

        return interaction.reply({
            embeds: [embed]
        });
    }
};
