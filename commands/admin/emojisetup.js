const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const path = require("node:path");
const fs = require("node:fs");

const EMOJIS = [
  "iconLanguage",
  "iconPrefix",
  "iconPermissions",
  "iconLock",
  "iconRaid",
  "iconCaptcha",
  "iconAge",
  "iconAntispam",
  "iconHoneyPot",
  "iconSanctions",
  "iconLogs",
  "iconReports",
  "iconTransparency",
  "iconTag",
  "iconDM",
  "iconAuth",
  "iconSupport",
  "iconDocs",
  "iconChangelog",
  "iconCustomize"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("emojisetup")
    .setDescription("Installer les emojis Holy RP")
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

    if (!interaction.guild.members.me?.permissions.has("ManageGuildExpressions")) {
      return interaction.reply({
        content: "❌ Le bot doit avoir la permission **Gérer les expressions**.",
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const emojiDir = path.join(
      process.cwd(),
      "assets",
      "emojis"
    );

    const results = [];

    for (const name of EMOJIS) {
      const file = path.join(emojiDir, `${name}.png`);

      if (!fs.existsSync(file)) {
        results.push(`⚠️ ${name} : image manquante`);
        continue;
      }

      const existing = interaction.guild.emojis.cache.find(
        emoji => emoji.name === name
      );

      if (existing) {
        results.push(`ℹ️ ${name} : déjà installé`);
        continue;
      }

      try {
        const emoji = await interaction.guild.emojis.create({
          attachment: file,
          name
        });

        results.push(`✅ ${name} : <:${emoji.name}:${emoji.id}>`);
      } catch (error) {
        console.error(`Erreur ${name}:`, error);
        results.push(`❌ ${name} : erreur`);
      }
    }

    await interaction.editReply({
      content:
        "🎨 **Installation des emojis Holy RP**\n\n" +
        results.join("\n")
    });
  }
};
