const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType
} = require("discord.js");

const configs = new Map();

function getConfig(guildId) {
  if (!configs.has(guildId)) {
    configs.set(guildId, {
      language: "Français",
      prefix: "/",
      autorraid: "Désactivé",
      captcha: "Activé",
      age: "Aucun",
      antispam: "Activé",
      logs: "Non configurés",
      sanctions: "Standard",
      reports: "Activés",
      tagrole: "Désactivé",
      lockedChannels: "Désactivé",
      dm: "Activés"
    });
  }

  return configs.get(guildId);
}

/*
 * Retourne l'emoji personnalisé Holy RP s'il existe.
 * Sinon, utilise l'emoji Unicode de secours.
 */
function getEmoji(guild, name, fallback) {
  const emoji = guild.emojis.cache.find(e => e.name === name);

  if (emoji) {
    return {
      id: emoji.id,
      name: emoji.name
    };
  }

  return fallback;
}

function createEmbed(guild) {
  const config = getConfig(guild.id);

  return new EmbedBuilder()
    .setTitle("⚙️ Configuration du serveur")
    .setDescription(
      "Configure les protections et fonctionnalités de ton serveur depuis ce panneau."
    )
    .addFields(
      {
        name: "🌐 Langue",
        value: `\`${config.language}\``,
        inline: true
      },
      {
        name: "↪️ Préfixe",
        value: `\`${config.prefix}\``,
        inline: true
      },
      {
        name: "🔑 Permissions",
        value: "`Gérer le serveur`",
        inline: true
      },
      {
        name: "🔒 Chaînes verrouillées",
        value: `\`${config.lockedChannels}\``,
        inline: true
      },
      {
        name: "🛡️ Auto RaidMode",
        value: `\`${config.autorraid}\``,
        inline: true
      },
      {
        name: "🤖 Captcha",
        value: `\`${config.captcha}\``,
        inline: true
      },
      {
        name: "🔞 Âge minimum",
        value: `\`${config.age}\``,
        inline: true
      },
      {
        name: "🚫 Anti-spam",
        value: `\`${config.antispam}\``,
        inline: true
      },
      {
        name: "⚖️ Sanctions",
        value: `\`${config.sanctions}\``,
        inline: true
      },
      {
        name: "📋 Logs",
        value: `\`${config.logs}\``,
        inline: true
      },
      {
        name: "🚨 Signalements",
        value: `\`${config.reports}\``,
        inline: true
      },
      {
        name: "🏷️ Rôle de Tag",
        value: `\`${config.tagrole}\``,
        inline: true
      },
      {
        name: "💬 Fermeture des MP",
        value: `\`${config.dm}\``,
        inline: true
      }
    )
    .setColor(0xd92332)
    .setFooter({
      text: "Holy RP • Server Manager"
    })
    .setTimestamp();
}

function createButtons(guild) {
  const e = (name, fallback) => getEmoji(guild, name, fallback);

  return [

    new ActionRowBuilder().addComponents(

      new ButtonBuilder()
        .setCustomId("config_language")
        .setLabel("Langue")
        .setEmoji(e("iconLanguage", "🌐"))
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_prefix")
        .setLabel("Préfixe")
        .setEmoji(e("iconPrefix", "↪️"))
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_permissions")
        .setLabel("Permissions")
        .setEmoji(e("iconPermissions", "🔑"))
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_locked")
        .setLabel("Chaînes verrouillées")
        .setEmoji(e("iconLock", "🔒"))
        .setStyle(ButtonStyle.Primary)

    ),

    new ActionRowBuilder().addComponents(

      new ButtonBuilder()
        .setCustomId("config_raid")
        .setLabel("Auto RaidMode")
        .setEmoji(e("iconRaid", "🛡️"))
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_captcha")
        .setLabel("Captcha")
        .setEmoji(e("iconCaptcha", "🤖"))
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_age")
        .setLabel("Âge Minimum")
        .setEmoji(e("iconAge", "🔞"))
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_antispam")
        .setLabel("Anti-spam")
        .setEmoji(e("iconAntispam", "🚫"))
        .setStyle(ButtonStyle.Secondary)

    ),

    new ActionRowBuilder().addComponents(

      new ButtonBuilder()
        .setCustomId("config_sanctions")
        .setLabel("Sanctions")
        .setEmoji(e("iconSanctions", "⚖️"))
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_logs")
        .setLabel("Logs")
        .setEmoji(e("iconLogs", "📋"))
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_reports")
        .setLabel("Signalements")
        .setEmoji(e("iconReports", "🚨"))
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_tagrole")
        .setLabel("Rôle de Tag")
        .setEmoji(e("iconTag", "🏷️"))
        .setStyle(ButtonStyle.Secondary)

    ),

    new ActionRowBuilder().addComponents(

      new ButtonBuilder()
        .setCustomId("config_dm")
        .setLabel("Fermeture des MP")
        .setEmoji(e("iconDM", "💬"))
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("config_refresh")
        .setLabel("Actualiser")
        .setEmoji(e("iconCustomize", "🔄"))
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
      components: createButtons(interaction.guild),
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
            config.language === "Français"
              ? "English"
              : "Français";
          break;

        case "config_raid":
          config.autorraid =
            config.autorraid === "Activé"
              ? "Désactivé"
              : "Activé";
          break;

        case "config_captcha":
          config.captcha =
            config.captcha === "Activé"
              ? "Désactivé"
              : "Activé";
          break;

        case "config_antispam":
          config.antispam =
            config.antispam === "Activé"
              ? "Désactivé"
              : "Activé";
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
        components: createButtons(interaction.guild)
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
