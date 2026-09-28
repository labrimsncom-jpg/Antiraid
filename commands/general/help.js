const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { info } = require("../../utils/embeds");

const TITLES = {
  general: "📌 Général",
  moderation: "🔨 Modération",
  protection: "🛡️ Protection (anti-raid, anti-spam, anti-lien)",
  admin: "⚙️ Administration",
  ticket: "🎫 Tickets",
  community: "🎁 Communauté",
  utility: "🧰 Utilitaires",
  fun: "🎉 Fun",
};

// Limites Discord : 1024 caractères par champ, 25 champs et 6000 caractères par embed
const FIELD_MAX = 1000;
const EMBED_MAX = 5000;

function chunkLines(lines) {
  const chunks = [];
  let current = "";
  for (const line of lines) {
    if (current && current.length + line.length + 1 > FIELD_MAX) {
      chunks.push(current);
      current = "";
    }
    current += (current ? "\n" : "") + line;
  }
  if (current) chunks.push(current);
  return chunks;
}

module.exports = {
  data: new SlashCommandBuilder().setName("help").setDescription("Affiche la liste des commandes"),

  async execute(interaction) {
    const groups = {};
    for (const command of interaction.client.commands.values()) {
      (groups[command.category] ??= []).push(command);
    }

    const order = [...Object.keys(TITLES), ...Object.keys(groups).filter((c) => !(c in TITLES))];
    const total = interaction.client.commands.size;

    const embeds = [];
    let embed = info("📖 Aide — Server Manager").setDescription(
      `Voici mes **${total}** commandes. Celles de modération et d'administration demandent des permissions.`
    );
    let size = embed.data.description.length;

    for (const category of order.filter((c) => groups[c])) {
      const lines = groups[category]
        .sort((a, b) => a.data.name.localeCompare(b.data.name))
        .map((c) => `\`/${c.data.name}\` — ${c.data.description}`.slice(0, 200));
      const chunks = chunkLines(lines);

      chunks.forEach((value, index) => {
        const name = (TITLES[category] ?? category) + (chunks.length > 1 ? ` (${index + 1}/${chunks.length})` : "");
        if (embed.data.fields?.length >= 24 || size + name.length + value.length > EMBED_MAX) {
          embeds.push(embed);
          embed = info("📖 Aide — suite");
          size = 0;
        }
        embed.addFields({ name, value });
        size += name.length + value.length;
      });
    }
    embeds.push(embed);

    // Discord limite à ~6000 caractères cumulés par message : une page = un message
    await interaction.reply({ embeds: [embeds[0]], flags: MessageFlags.Ephemeral });
    for (const page of embeds.slice(1)) {
      await interaction.followUp({ embeds: [page], flags: MessageFlags.Ephemeral });
    }
  },
};