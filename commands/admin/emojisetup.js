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

    if (!interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageGuild
    )) {
      return interaction.reply({
        content: "âŒ Tu dois avoir la permission **GÃ©rer le serveur**.",
        ephemeral: true
      });
    }

    const me = interaction.guild.members.me;

    if (!me.permissions.has("ManageGuildExpressions")) {
      return interaction.reply({
        content:
          "âŒ Le bot doit avoir la permission **GÃ©rer les expressions**.",
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

      const file = path.join(
        emojiDir,
        `${name}.png`
      );

      if (!fs.existsSync(file)) {
        results.push(`âš ï¸ ${name} : image introuvable`);
        continue;
      }

      const existing = interaction.guild.emojis.cache.find(
        emoji => emoji.name === name
      );

      if (existing) {
        results.push(`â„¹ï¸ ${name} : dÃ©jÃ  prÃ©sent`);
        continue;
      }

      try {

        const emoji = await interaction.guild.emojis.create({
          attachment: file,
          name
        });

        results.push(
          `âœ… ${name} : <:${emoji.name}:${emoji.id}>`
        );

      } catch (error) {

        console.error(
          `Erreur crÃ©ation ${name}:`,
          error
        );

        results.push(
          `âŒ ${name} : impossible Ã  crÃ©er`
        );
      }
    }

    await interaction.editReply({
      content:
        "ðŸŽ¨ **Installation des emojis Holy RP terminÃ©e !**\n\n" +
        results.join("\n")
    });
  }
};
