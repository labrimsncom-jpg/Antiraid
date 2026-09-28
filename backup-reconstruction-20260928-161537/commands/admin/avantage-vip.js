const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("avantage-vip")
        .setDescription("Afficher les avantages VIP")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("Afficher les avantages VIP")
            .setDescription(
                "Commande installée sur Main bot."
            )
            .setTimestamp();

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};