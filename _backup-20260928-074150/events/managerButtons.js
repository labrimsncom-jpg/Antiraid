const { Events, MessageFlags } = require("discord.js");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("role_toggle:")) return;

    const roleId = interaction.customId.split(":")[1];
    const role = interaction.guild.roles.cache.get(roleId);

    if (!role) return interaction.reply({
      content: "Role introuvable.",
      flags: MessageFlags.Ephemeral
    });

    if (role.managed) return interaction.reply({
      content: "Ce role est gere par Discord.",
      flags: MessageFlags.Ephemeral
    });

    const member = interaction.member;
    const has = member.roles.cache.has(role.id);
    const done = has
      ? await member.roles.remove(role).then(() => true).catch(() => false)
      : await member.roles.add(role).then(() => true).catch(() => false);

    return interaction.reply({
      content: done
        ? (has ? `Role ${role.name} retire.` : `Role ${role.name} ajoute.`)
        : "Je ne peux pas gerer ce role.",
      flags: MessageFlags.Ephemeral
    });
  }
};