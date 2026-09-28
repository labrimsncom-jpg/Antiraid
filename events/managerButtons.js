const { Events } = require("discord.js");

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("role:")) return;

    const roleId = interaction.customId.slice(5);
    const role = interaction.guild?.roles.cache.get(roleId);

    if (!role) {
      await interaction.reply({
        content: "Role introuvable.",
        ephemeral: true
      });
      return;
    }

    if (interaction.member.roles.cache.has(role.id)) {
      await interaction.member.roles.remove(role);
      await interaction.reply({
        content: `Role retire : ${role.name}`,
        ephemeral: true
      });
    } else {
      await interaction.member.roles.add(role);
      await interaction.reply({
        content: `Role ajoute : ${role.name}`,
        ephemeral: true
      });
    }
  }
};