const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getModule, updateModule } = require("../../utils/shield");
const { ok } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("raidmode")
    .setDescription("Active ou coupe manuellement le mode raid (les nouveaux arrivants sont bloqués)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addBooleanOption((o) => o.setName("actif").setDescription("true = activer, false = désactiver").setRequired(true)),

  async execute(interaction) {
    const on = interaction.options.getBoolean("actif");
    const cfg = getModule(interaction.guild.id, "antiraid");

    if (on) {
      updateModule(interaction.guild.id, "antiraid", { enabled: true, raidUntil: Date.now() + cfg.raidMinutes * 60_000 });
      return interaction.reply({
        embeds: [ok(`🚨 Mode raid activé pour **${cfg.raidMinutes} minute(s)** : les nouveaux arrivants seront ${cfg.action === "ban" ? "bannis" : "expulsés"}.`)],
      });
    }
    updateModule(interaction.guild.id, "antiraid", { raidUntil: 0 });
    await interaction.reply({ embeds: [ok("Mode raid désactivé. Les arrivées sont de nouveau autorisées.")] });
  },
};
