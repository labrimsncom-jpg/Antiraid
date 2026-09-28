const { EmbedBuilder } = require("discord.js");
const { COLORS } = require("./embeds");
const { sendLog } = require("./logger");

// Renvoie un message d'erreur si le modérateur ou le bot ne peut pas agir sur ce membre
function checkHierarchy(interaction, target) {
  const { guild, user, member: moderator, client } = interaction;
  if (target.id === user.id) return "Tu ne peux pas faire ça sur toi-même.";
  if (target.id === client.user.id) return "Je ne peux pas me sanctionner moi-même.";
  if (target.id === guild.ownerId) return "Impossible de sanctionner le propriétaire du serveur.";
  if (user.id !== guild.ownerId && target.roles.highest.position >= moderator.roles.highest.position) {
    return "Ce membre a un rôle supérieur ou égal au tien.";
  }
  if (target.roles.highest.position >= guild.members.me.roles.highest.position) {
    return "Ce membre a un rôle supérieur ou égal au mien. Monte mon rôle dans la liste des rôles.";
  }
  return null;
}

const reasonOf = (interaction) => (interaction.options.getString("raison") ?? "Aucune raison fournie").slice(0, 400);

// Message privé au membre sanctionné (ignoré s'il a fermé ses MP)
const dm = (user, text) => user.send(text).catch(() => {});

// Ajoute une ligne dans le salon de logs
function logAction(interaction, { action, target, reason, color, fields = [] }) {
  const embed = new EmbedBuilder()
    .setColor(color ?? COLORS.warn)
    .setTitle(`🔨 ${action}`)
    .addFields(
      { name: "Membre", value: `${target} (\`${target.id}\`)`, inline: true },
      { name: "Modérateur", value: `${interaction.user}`, inline: true },
      { name: "Raison", value: reason },
      ...fields
    )
    .setTimestamp();
  return sendLog(interaction.guild, embed);
}

module.exports = { checkHierarchy, reasonOf, dm, logAction };
