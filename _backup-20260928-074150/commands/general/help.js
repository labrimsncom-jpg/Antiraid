const { SlashCommandBuilder } = require("discord.js");
const { info } = require("../../utils/embeds");

const TITLES = {
  general: "📌 Général",
  moderation: "🔨 Modération",
  protection: "🛡️ Protection (anti-raid, anti-spam, anti-lien)",
  admin: "⚙️ Administration",
  community: "🎁 Communauté",
  utility: "🧰 Utilitaires",
  fun: "🎉 Fun",
};

module.exports = {
  data: new SlashCommandBuilder().setName("help").setDescription("Affiche la liste des commandes"),

  async execute(interaction) {
    const groups = {};
    for (const command of interaction.client.commands.values()) {
      (groups[command.category] ??= []).push(command);
    }

    const embed = info("📖 Aide — Server Manager").setDescription(
      "Voici toutes mes commandes. Les commandes de modération et d'administration demandent des permissions."
    );
    // Ordre des catégories : celui de TITLES, puis les autres
    const order = [...Object.keys(TITLES), ...Object.keys(groups).filter((c) => !(c in TITLES))];
    for (const category of order.filter((c) => groups[c])) {
      const commands = groups[category];
      embed.addFields({
        name: TITLES[category] ?? category,
        value: commands.map((c) => `\`/${c.data.name}\` — ${c.data.description}`).join("\n"),
      });
    }
    await interaction.reply({ embeds: [embed] });
  },
};
