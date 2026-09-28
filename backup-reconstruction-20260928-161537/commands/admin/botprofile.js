const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("botprofile")
    .setDescription("Modifier le profil du bot")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild.toString()
    ),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: "❌ Tu dois avoir la permission Gérer le serveur.",
        ephemeral: true,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("botprofile_modal")
      .setTitle("Modifier le profil du bot");

    const nickname = new TextInputBuilder()
      .setCustomId("nickname")
      .setLabel("Surnom du bot")
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(32)
      .setPlaceholder("Holy RP");

    const bio = new TextInputBuilder()
      .setCustomId("bio")
      .setLabel("Bio")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(190)
      .setPlaceholder("Description du bot");

    const avatar = new TextInputBuilder()
      .setCustomId("avatar")
      .setLabel("Avatar : URL de l'image")
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setPlaceholder("https://exemple.com/avatar.png");

    const banner = new TextInputBuilder()
      .setCustomId("banner")
      .setLabel("Bannière : URL de l'image")
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setPlaceholder("https://exemple.com/banner.png");

    modal.addComponents(
      new ActionRowBuilder().addComponents(nickname),
      new ActionRowBuilder().addComponents(bio),
      new ActionRowBuilder().addComponents(avatar),
      new ActionRowBuilder().addComponents(banner)
    );

    await interaction.showModal(modal);

    try {
      const submitted = await interaction.awaitModalSubmit({
        time: 120000,
        filter: (i) =>
          i.customId === "botprofile_modal" &&
          i.user.id === interaction.user.id,
      });

      await submitted.deferReply({ ephemeral: true });

      const nicknameValue = submitted.fields
        .getTextInputValue("nickname")
        .trim();

      const avatarValue = submitted.fields
        .getTextInputValue("avatar")
        .trim();

      const bannerValue = submitted.fields
        .getTextInputValue("banner")
        .trim();

      const changes = [];

      if (nicknameValue) {
        await interaction.guild.members.me?.setNickname(nicknameValue);
        changes.push("✅ Surnom modifié");
      }

      if (avatarValue) {
        if (!/^https?:\/\/\S+$/i.test(avatarValue)) {
          return submitted.editReply("❌ URL de l'avatar invalide.");
        }

        await interaction.client.user.setAvatar(avatarValue);
        changes.push("✅ Avatar modifié");
      }

      if (bannerValue) {
        if (!/^https?:\/\/\S+$/i.test(bannerValue)) {
          return submitted.editReply("❌ URL de la bannière invalide.");
        }

        await interaction.client.user.setBanner(bannerValue);
        changes.push("✅ Bannière modifiée");
      }

      if (changes.length === 0) {
        return submitted.editReply("ℹ️ Aucun changement effectué.");
      }

      await submitted.editReply(
        `🎉 Profil modifié !\n\n${changes.join("\n")}`
      );
    } catch (error) {
      console.error("Erreur botprofile :", error);
    }
  },
};
