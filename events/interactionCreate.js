const {
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

module.exports = {
  name: "interactionCreate",

  async execute(interaction) {
    // Gestion des commandes Slash
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(
      interaction.commandName
    );

    if (!command) {
      return interaction.reply({
        content: "❌ Cette commande n'existe pas.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Vérification du serveur
    if (!interaction.guild) {
      return interaction.reply({
        content: "❌ Cette commande doit être utilisée sur un serveur.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Vérification des permissions configurées dans la commande
    const requiredPermissions =
      command.data.default_member_permissions;

    if (requiredPermissions) {
      const hasPermission =
        interaction.member.permissions.has(requiredPermissions);

      if (!hasPermission) {
        return interaction.reply({
          content:
            "❌ Tu n'as pas les permissions nécessaires pour utiliser cette commande.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    // Exécution sécurisée de la commande
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(
        `Erreur dans la commande /${interaction.commandName} :`,
        error
      );

      const message = {
        content:
          "❌ Une erreur est survenue pendant l'exécution de la commande.",
        flags: MessageFlags.Ephemeral,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(message).catch(console.error);
      } else {
        await interaction.reply(message).catch(console.error);
      }
    }
  },
};