const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const db = require("../../utils/db");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket-config")
        .setDescription("Configurer le système de tickets")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

        .addChannelOption(option =>
            option
                .setName("salon")
                .setDescription("Salon du panneau")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )

        .addRoleOption(option =>
            option
                .setName("role_support")
                .setDescription("Rôle support")
                .setRequired(false)
        )

        .addChannelOption(option =>
            option
                .setName("categorie")
                .setDescription("Catégorie des tickets")
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(false)
        ),

    async execute(interaction) {

        const salon = interaction.options.getChannel("salon");
        const role = interaction.options.getRole("role_support");
        const categorie = interaction.options.getChannel("categorie");

        db.setSetting(
            interaction.guild.id,
            "ticketRoleId",
            role ? role.id : null
        );

        db.setSetting(
            interaction.guild.id,
            "ticketCategoryId",
            categorie ? categorie.id : null
        );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("ticket_open")
                .setLabel("Ouvrir un ticket")
                .setStyle(ButtonStyle.Primary)
        );

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("Support")
            .setDescription(
                "Clique sur le bouton ci-dessous pour ouvrir un ticket privé."
            );

        await salon.send({
            embeds: [embed],
            components: [row]
        });

        return interaction.reply({
            content: "Panneau ticket configuré.",
            ephemeral: true
        });
    }
};