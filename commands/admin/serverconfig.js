const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType
} = require("discord.js");

const configs = new Map();

function getConfig(guildId) {
  if (!configs.has(guildId)) {
    configs.set(guildId, {
      language: "Français",
      prefix: "Désactivé",
      autorraid: "Désactivé",
      captcha: "Désactivé",
      age: "Aucun",
      antispam: "Activé",
      logs: "Non configurés",
      sanctions: "Standard",
      reports: "Désactivés",
      tagrole: "Désactivé",
      lockedChannels: "Désactivé",
      dm: "Activés"
    });
  }

  return configs.get(guildId);
}

function createEmbed(guild) {
  const config = getConfig(guild.id);

  return new EmbedBuilder()
    .setTitle("⚙️ Menu principal de configuration")
    .setDescription(
      "Ce menu vous permet de visualiser, ajuster ou personnaliser les fonctionnalités !\n\n" +
      "Chaque catégorie présente une liste d'options modifiables sous forme de boutons ou menus déroulants. " +
      "Utilisez les boutons ci-dessous pour configurer les différentes fonctionnalités."
    )
    .addFields(
      {
        name: "🌐 Langue",
        value: `┃ ${config.language}`,
        inline: true
      },
      {
        name: "↪️ Préfixe",
        value: `┃ ${config.prefix}`,
        inline: true
      },
      {
        name: "🛡️ Auto RaidMode",
        value: `┃ ${config.autorraid}`,
        inline: true
      },
      {
        name: "🔒 Verrouillage de salon",
        value: `┃ ${config.lockedChannels}`,
        inline: true
      },
      {
        name: "🤖 Captcha",
        value: `┃ ${config.captcha}`,
        inline: true
      },
      {
        name: "📅 Âge Minimum",
        value: `┃ ${config.age}`,
        inline: true
      },
      {
        name: "🚫 Anti-spam",
        value: `┃ ${config.antispam}`,
        inline: true
      },
      {
        name: "📋 Logs",
        value: `┃ ${config.logs}`,
        inline: true
      },
      {
        name: "🚩 Signalements",
        value: `┃ ${config.reports}`,
        inline: true
      },
      {
        name: "🏷️ Rôle de Tag",
        value: `┃ ${config.tagrole}`,
        inline: true
      },
      {
        name: "⚖️ Sanctions",
        value: `┃ ${config.sanctions}`,
        inline: true
      },
      {
        name: "💬 Messages privés",
        value: `┃ ${config.dm}`,
        inline: true
      }
    )
    .setColor(0x5865f2)
    .setFooter({
      text: "Server Manager — Holy RP • Configuration"
    })
    .setTimestamp();
}

function createButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("config_language")
        .setLabel("Langue")
        .setEmoji("🌐")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_prefix")
        .setLabel("Préfixe")
        .setEmoji("↪️")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_permissions")
        .setLabel("Permissions")
        .setEmoji("🔑")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_locked")
        .setLabel("Chaînes verrouillées")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Primary)
    ),

    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("config_raid")
        .setLabel("Auto RaidMode")
        .setEmoji("🛡️")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_captcha")
        .setLabel("Captcha")
        .setEmoji("🔄")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_age")
        .setLabel("Âge Minimum")
        .setEmoji("📅")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_antispam")
        .setLabel("Anti-spam")
        .setEmoji("🚫")
        .setStyle(ButtonStyle.Secondary)
    ),

    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("config_sanctions")
        .setLabel("Sanctions")
        .setEmoji("⚖️")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_logs")
        .setLabel("Logs")
        .setEmoji("📋")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_reports")
        .setLabel("Signalements")
        .setEmoji("🚩")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_tagrole")
        .setLabel("Rôle de Tag")
        .setEmoji("🏷️")
        .setStyle(ButtonStyle.Secondary)
    ),

    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("config_dm")
        .setLabel("Fermeture des MP")
        .setEmoji("💬")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_refresh")
        .setLabel("Actualiser")
        .setEmoji("🔄")
        .setStyle(ButtonStyle.Success)
    )
  ];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("serverconfig")
    .setDescription("Ouvrir le panneau de configuration du serveur")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild.toString()
    ),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: "❌ Tu dois avoir la permission **Gérer le serveur**.",
        ephemeral: true
      });
    }

    const message = await interaction.reply({
      embeds: [createEmbed(interaction.guild)],
      components: createButtons(),
      fetchReply: true
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 10 * 60 * 1000
    });

    collector.on("collect", async (button) => {
      if (button.user.id !== interaction.user.id) {
        return button.reply({
          content: "❌ Ce panneau de configuration ne t'appartient pas.",
          ephemeral: true
        });
      }

      const config = getConfig(interaction.guild.id);

      switch (button.customId) {

        case "config_language":
          config.language =
            config.language === "Français" ? "English" : "Français";
          break;

        case "config_raid":
          config.autorraid =
            config.autorraid === "Activé" ? "Désactivé" : "Activé";
          break;

        case "config_captcha":
          config.captcha =
            config.captcha === "Activé" ? "Désactivé" : "Activé";
          break;

        case "config_antispam":
          config.antispam =
            config.antispam === "Activé" ? "Désactivé" : "Activé";
          break;

        case "config_locked":
          config.lockedChannels =
            config.lockedChannels === "Activé"
              ? "Désactivé"
              : "Activé";
          break;

        case "config_reports":
          config.reports =
            config.reports === "Activés"
              ? "Désactivés"
              : "Activés";
          break;

        case "config_dm":
          config.dm =
            config.dm === "Activés"
              ? "Fermés"
              : "Activés";
          break;

        case "config_logs":
          config.logs =
            config.logs === "Non configurés"
              ? "Activés"
              : "Non configurés";
          break;

        case "config_tagrole":
          config.tagrole =
            config.tagrole === "Activé"
              ? "Désactivé"
              : "Activé";
          break;

        case "config_sanctions":
          config.sanctions =
            config.sanctions === "Standard"
              ? "Sévères"
              : "Standard";
          break;

        case "config_age":
          config.age =
            config.age === "Aucun"
              ? "13+"
              : config.age === "13+"
                ? "16+"
                : "Aucun";
          break;

        case "config_prefix":
          return button.reply({
            content:
              "ℹ️ Les commandes slash `/` sont utilisées par défaut. Aucun préfixe n'est nécessaire.",
            ephemeral: true
          });

        case "config_permissions":
          return button.reply({
            content:
              "🔑 Les commandes d'administration nécessitent la permission **Gérer le serveur**.",
            ephemeral: true
          });

        case "config_refresh":
          break;
      }

      await button.update({
        embeds: [createEmbed(interaction.guild)],
        components: createButtons()
      });
    });

    collector.on("end", async () => {
      try {
        await message.edit({
          components: []
        });
      } catch {}
    });
  }
};
