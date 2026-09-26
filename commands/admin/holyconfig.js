const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} = require("discord.js");
const db = require("../../utils/db");
const { settings, save, configEmbed } = require("../../utils/holy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("holy-config")
    .setDescription("Configurer les fonctions avancees de Holy RP")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s.setName("afficher").setDescription("Afficher la configuration")
    )
    .addSubcommand((s) =>
      s
        .setName("suggestions")
        .setDescription("Definir le salon des suggestions")
        .addChannelOption((o) =>
          o.setName("salon").setDescription("Salon texte").addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s
        .setName("xp")
        .setDescription("Activer ou desactiver le systeme XP")
        .addBooleanOption((o) => o.setName("active").setDescription("Etat").setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName("role-niveau")
        .setDescription("Associer un role a un niveau")
        .addIntegerOption((o) => o.setName("niveau").setDescription("Niveau").setMinValue(1).setMaxValue(100).setRequired(true))
        .addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const h = settings(interaction.guild.id);

    if (sub === "afficher") {
      return interaction.reply({
        embeds: [configEmbed(interaction.guild)],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "suggestions") {
      const channel = interaction.options.getChannel("salon");
      h.suggestions.channelId = channel.id;
      save(interaction.guild.id, h);
      return interaction.reply({
        content: `Salon suggestions configure : ${channel}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "xp") {
      h.xpEnabled = interaction.options.getBoolean("active");
      save(interaction.guild.id, h);
      return interaction.reply({
        content: `Systeme XP : ${h.xpEnabled ? "active" : "desactive"}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "role-niveau") {
      const level = interaction.options.getInteger("niveau");
      const role = interaction.options.getRole("role");
      if (role.managed || role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({
          content: "Le bot ne peut pas attribuer ce role.",
          flags: MessageFlags.Ephemeral,
        });
      }
      h.levelRoles[level] = role.id;
      save(interaction.guild.id, h);
      return interaction.reply({
        content: `Le niveau ${level} donnera ${role}.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
