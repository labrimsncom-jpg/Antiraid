const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("raid-config")
        .setDescription("Configurer le système anti-raid")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("Configurer le système anti-raid")
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