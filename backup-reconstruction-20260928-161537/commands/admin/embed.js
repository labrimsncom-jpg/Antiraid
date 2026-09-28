const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ChannelType
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("embed")
        .setDescription("Envoyer un embed dans un salon")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

        .addChannelOption(option =>
            option
                .setName("salon")
                .setDescription("Salon")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName("titre")
                .setDescription("Titre")
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName("texte")
                .setDescription("Description")
                .setRequired(true)
        ),

    async execute(interaction) {

        const salon = interaction.options.getChannel("salon");
        const titre = interaction.options.getString("titre");
        const texte = interaction.options.getString("texte");

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(titre)
            .setDescription(texte)
            .setTimestamp();

        await salon.send({
            embeds: [embed]
        });

        return interaction.reply({
            content: `Embed envoyé dans ${salon}.`,
            ephemeral: true
        });
    }
};