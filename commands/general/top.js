const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../../utils/db");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("top")
        .setDescription("Classement XP du serveur"),

    async execute(interaction) {
        const guildId = interaction.guild.id;

        const settings = db.getSettings(guildId) || {};
        const members = settings.levels?.members || {};

        const classement = Object.entries(members)
            .map(([userId, data]) => ({
                userId,
                xp: Number(data.xp || 0),
                level: Number(data.level || 0)
            }))
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 10);

        if (!classement.length) {
            return interaction.reply({
                content: "Aucune statistique XP n'est encore disponible.",
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
                `**${i + 1}.** ${nom} — niveau **${membre.level}** — **${membre.xp} XP**`
            );
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("Classement XP")
            .setDescription(lignes.join("\n"))
            .setFooter({
                text: interaction.guild.name
            });

        return interaction.reply({
            embeds: [embed]
        });
    }
};
