const { Events, EmbedBuilder } = require("discord.js");
const { COLORS } = require("../utils/embeds");
const { sendLog } = require("../utils/logger");
const { silent } = require("../utils/shield");

const cut = (text, max = 1000) => (text?.length > max ? `${text.slice(0, max)}…` : text || "*(vide)*");
const embed = (color, title) => new EmbedBuilder().setColor(color).setTitle(title).setTimestamp();

// Un seul fichier pour tous les logs d'événements du serveur
module.exports = [
  {
    name: Events.MessageDelete,
    async execute(message) {
      if (!message.guild || message.author?.bot || silent.has(message.id)) return;
      await sendLog(
        message.guild,
        embed(COLORS.error, "🗑️ Message supprimé").addFields(
          { name: "Auteur", value: message.author ? `${message.author} (\`${message.author.tag}\`)` : "Inconnu", inline: true },
          { name: "Salon", value: `${message.channel}`, inline: true },
          { name: "Contenu", value: message.content ? cut(message.content) : "*(message ancien, contenu inconnu)*" }
        )
      );
    },
  },
  {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
      if (!newMessage.guild || newMessage.author?.bot) return;
      if (oldMessage.content == null || oldMessage.content === newMessage.content) return;
      await sendLog(
        newMessage.guild,
        embed(COLORS.warn, "✏️ Message modifié").addFields(
          { name: "Auteur", value: `${newMessage.author}`, inline: true },
          { name: "Salon", value: `${newMessage.channel}`, inline: true },
          { name: "Avant", value: cut(oldMessage.content) },
          { name: "Après", value: cut(newMessage.content) },
          { name: "Lien", value: `[Aller au message](${newMessage.url})` }
        )
      );
    },
  },
  {
    name: Events.ChannelCreate,
    async execute(channel) {
      if (!channel.guild) return;
      await sendLog(channel.guild, embed(COLORS.success, "📁 Salon créé").setDescription(`${channel} (\`${channel.name}\`)`));
    },
  },
  {
    name: Events.ChannelDelete,
    async execute(channel) {
      if (!channel.guild) return;
      await sendLog(channel.guild, embed(COLORS.error, "📁 Salon supprimé").setDescription(`\`#${channel.name}\``));
    },
  },
  {
    name: Events.GuildRoleCreate,
    async execute(role) {
      await sendLog(role.guild, embed(COLORS.success, "🏷️ Rôle créé").setDescription(`${role} (\`${role.name}\`)`));
    },
  },
  {
    name: Events.GuildRoleDelete,
    async execute(role) {
      await sendLog(role.guild, embed(COLORS.error, "🏷️ Rôle supprimé").setDescription(`\`${role.name}\``));
    },
  },
];
