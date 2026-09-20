const { SlashCommandBuilder } = require("discord.js");
const { info } = require("../../utils/embeds");

const EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Crée un sondage avec des réactions")
    .addStringOption((o) => o.setName("question").setDescription("Question du sondage").setRequired(true).setMaxLength(250))
    .addStringOption((o) => o.setName("choix1").setDescription("Premier choix").setRequired(true).setMaxLength(100))
    .addStringOption((o) => o.setName("choix2").setDescription("Deuxième choix").setRequired(true).setMaxLength(100))
    .addStringOption((o) => o.setName("choix3").setDescription("Troisième choix").setMaxLength(100))
    .addStringOption((o) => o.setName("choix4").setDescription("Quatrième choix").setMaxLength(100))
    .addStringOption((o) => o.setName("choix5").setDescription("Cinquième choix").setMaxLength(100)),

  async execute(interaction) {
    const choices = [1, 2, 3, 4, 5].map((n) => interaction.options.getString(`choix${n}`)).filter(Boolean);
    const embed = info(`📊 ${interaction.options.getString("question")}`)
      .setDescription(choices.map((c, i) => `${EMOJIS[i]} ${c}`).join("\n\n"))
      .setFooter({ text: `Sondage de ${interaction.user.username}` });

    const message = await interaction.reply({ embeds: [embed], fetchReply: true });
    for (let i = 0; i < choices.length; i++) await message.react(EMOJIS[i]).catch(() => {});
  },
};
