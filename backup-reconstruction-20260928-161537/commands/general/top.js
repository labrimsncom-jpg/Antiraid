const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("top")
        .setDescription("Classement XP du serveur"),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("Classement XP du serveur")
            .setDescription(
                "Commande disponible sur Main bot."
            )
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};