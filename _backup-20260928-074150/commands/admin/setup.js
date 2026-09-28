const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const db = require("../../utils/db");
const { COLORS, ok, fail, info } = require("../../utils/embeds");

const salon = (o) =>
  o.setName("salon").setDescription("Salon").addChannelTypes(ChannelType.GuildText).setRequired(true);

const FONCTIONS = {
  logs: "logChannelId",
  bienvenue: "welcomeChannelId",
  autorole: "autoroleId",
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configure le bot sur ce serveur")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName("logs").setDescription("Définit le salon des logs").addChannelOption(salon))
    .addSubcommand((s) =>
      s
        .setName("bienvenue")
        .setDescription("Active le message de bienvenue")
        .addChannelOption(salon)
        .addStringOption((o) => o.setName("message").setDescription("Variables : {user} {server} {count}").setMaxLength(500))
    )
    .addSubcommand((s) =>
      s
        .setName("autorole")
        .setDescription("Rôle donné automatiquement aux nouveaux membres")
        .addRoleOption((o) => o.setName("role").setDescription("Rôle à donner").setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName("tickets")
        .setDescription("Envoie le panneau de tickets dans un salon")
        .addChannelOption(salon)
        .addRoleOption((o) => o.setName("role_support").setDescription("Rôle de l'équipe qui voit les tickets"))
        .addChannelOption((o) =>
          o.setName("categorie").setDescription("Catégorie où créer les tickets").addChannelTypes(ChannelType.GuildCategory)
        )
    )
    .addSubcommand((s) =>
      s
        .setName("desactiver")
        .setDescription("Désactive une fonctionnalité")
        .addStringOption((o) =>
          o
            .setName("fonction")
            .setDescription("Fonctionnalité à désactiver")
            .setRequired(true)
            .addChoices(
              { name: "Logs", value: "logs" },
              { name: "Message de bienvenue", value: "bienvenue" },
              { name: "Rôle automatique", value: "autorole" }
            )
        )
    )
    .addSubcommand((s) => s.setName("afficher").setDescription("Affiche la configuration actuelle")),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const reply = (embed) => interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    switch (sub) {
      case "logs": {
        const channel = interaction.options.getChannel("salon");
        db.setSetting(guildId, "logChannelId", channel.id);
        return reply(ok(`Les logs seront envoyés dans ${channel}.`));
      }

      case "bienvenue": {
        const channel = interaction.options.getChannel("salon");
        const message = interaction.options.getString("message");
        db.setSetting(guildId, "welcomeChannelId", channel.id);
        if (message) db.setSetting(guildId, "welcomeMessage", message);
        return reply(ok(`Message de bienvenue activé dans ${channel}.\nVariables : \`{user}\` \`{server}\` \`{count}\``));
      }

      case "autorole": {
        const role = interaction.options.getRole("role");
        if (role.managed || role.id === interaction.guild.id) {
          return reply(fail("Ce rôle ne peut pas être attribué automatiquement."));
        }
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
          return reply(fail("Ce rôle est au-dessus du mien. Monte mon rôle dans la liste des rôles, puis réessaie."));
        }
        db.setSetting(guildId, "autoroleId", role.id);
        return reply(ok(`Les nouveaux membres recevront ${role}.`));
      }

      case "tickets": {
        const channel = interaction.options.getChannel("salon");
        const role = interaction.options.getRole("role_support");
        const category = interaction.options.getChannel("categorie");
        db.setSetting(guildId, "ticketRoleId", role?.id ?? null);
        db.setSetting(guildId, "ticketCategoryId", category?.id ?? null);

        const embed = new EmbedBuilder()
          .setColor(COLORS.primary)
          .setTitle("🎫 Support")
          .setDescription("Besoin d'aide ? Clique sur le bouton ci-dessous pour ouvrir un ticket privé avec l'équipe.");
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("ticket_open").setLabel("Ouvrir un ticket").setEmoji("🎫").setStyle(ButtonStyle.Primary)
        );
        try {
          await channel.send({ embeds: [embed], components: [row] });
        } catch {
          return reply(fail(`Je ne peux pas écrire dans ${channel}. Vérifie mes permissions dans ce salon.`));
        }
        return reply(ok(`Panneau de tickets envoyé dans ${channel}.`));
      }

      case "desactiver": {
        const fonction = interaction.options.getString("fonction");
        db.setSetting(guildId, FONCTIONS[fonction], null);
        return reply(ok(`Fonctionnalité **${fonction}** désactivée.`));
      }

      case "afficher": {
        const s = db.getSettings(guildId);
        const ch = (id) => (id ? `<#${id}>` : "Non défini");
        const role = (id) => (id ? `<@&${id}>` : "Non défini");
        const embed = info("⚙️ Configuration").addFields(
          { name: "Logs", value: ch(s.logChannelId), inline: true },
          { name: "Bienvenue", value: ch(s.welcomeChannelId), inline: true },
          { name: "Rôle automatique", value: role(s.autoroleId), inline: true },
          { name: "Rôle support (tickets)", value: role(s.ticketRoleId), inline: true },
          { name: "Catégorie tickets", value: ch(s.ticketCategoryId), inline: true }
        );
        return reply(embed);
      }
    }
  },
};
