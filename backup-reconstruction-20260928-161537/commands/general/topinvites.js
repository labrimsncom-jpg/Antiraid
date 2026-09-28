const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("topinvites")
        .setDescription("Classement des invitations"),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("Classement des invitations")
            .setDescription(
                "Commande disponible sur Main bot."
            )
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};