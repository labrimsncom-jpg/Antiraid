const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  AttachmentBuilder,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require("discord.js");

const db = require("../../utils/db");

const P = PermissionFlagsBits;
const COLORS = { primary: 0x5865F2, success: 0x57F287, danger: 0xED4245 };

function need(i, permission) {
  if (!i.memberPermissions?.has(permission)) {
    i.reply({ content: "❌ Permission insuffisante.", flags: MessageFlags.Ephemeral }).catch(() => {});
    return false;
  }
  return true;
}

function get(i, key, fallback) {
  const s = db.getSettings(i.guild.id);
  return s[key] ?? fallback;
}

function setting(i, key, value) {
  db.setSetting(i.guild.id, key, value);
}

function info(title) {
  return new EmbedBuilder().setColor(COLORS.primary).setTitle(title).setTimestamp();
}

function ok(text) {
  return new EmbedBuilder().setColor(COLORS.success).setDescription(`✅ ${text}`).setTimestamp();
}

function fail(text) {
  return new EmbedBuilder().setColor(COLORS.danger).setDescription(`❌ ${text}`).setTimestamp();
}

function admin(name, description, permission = P.ManageGuild) {
  return new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
    .setDefaultMemberPermissions(permission.toString());
}

function userOpt(o, name = "membre", required = true) {
  o.setName(name).setDescription("Membre");
  if (required) o.setRequired(true);
  return o;
}

function roleOpt(o, name = "role", required = true) {
  o.setName(name).setDescription("Role");
  if (required) o.setRequired(true);
  return o;
}

function textChannel(o) {
  return o.addChannelTypes(ChannelType.GuildText);
}

async function closeTicket(i) {
  if (!i.channel) return i.reply({ embeds: [fail("Salon introuvable.")], flags: MessageFlags.Ephemeral });
  await i.reply({ embeds: [ok("Fermeture du ticket...")] }).catch(() => {});
  setTimeout(() => i.channel.delete().catch(() => {}), 1500);
}

const commands = [];

// /backup
commands.push({
  data: admin("backup", "Sauvegarder la configuration du serveur"),
  async execute(i) {
    if (!need(i, P.ManageGuild)) return;
    const data = {
      guild: { id: i.guild.id, name: i.guild.name },
      settings: db.getSettings(i.guild.id),
      roles: i.guild.roles.cache.filter(r => !r.managed).map(r => ({ id: r.id, name: r.name, position: r.position })),
      channels: i.guild.channels.cache.map(c => ({ id: c.id, name: c.name, type: c.type, parent: c.parentId }))
    };
    const file = new AttachmentBuilder(
      Buffer.from(JSON.stringify(data, null, 2), "utf8"),
      { name: `backup-${i.guild.id}.json` }
    );
    return i.reply({ content: "Sauvegarde creee.", files: [file], flags: MessageFlags.Ephemeral });
  }
});

// /config
commands.push({
  data: admin("config", "Afficher la configuration du serveur"),
  async execute(i) {
    if (!need(i, P.ManageGuild)) return;
    const s = db.getSettings(i.guild.id);
    const e = info("Configuration").addFields(
      Object.entries(s).slice(0, 20).map(([k, v]) => ({
        name: k,
        value: typeof v === "object" ? JSON.stringify(v).slice(0, 1000) : String(v ?? "Non defini"),
        inline: false
      }))
    );
    return i.reply({ embeds: [e], flags: MessageFlags.Ephemeral });
  }
});

// /embed
commands.push({
  data: admin("embed", "Envoyer un embed dans un salon")
    .addChannelOption(o => textChannel(o.setName("salon").setDescription("Salon").setRequired(true)))
    .addStringOption(o => o.setName("titre").setDescription("Titre").setRequired(true))
    .addStringOption(o => o.setName("texte").setDescription("Description").setRequired(true)),
  async execute(i) {
    if (!need(i, P.ManageMessages)) return;
    const c = i.options.getChannel("salon");
    const e = new EmbedBuilder()
      .setColor(COLORS.primary)
      .setTitle(i.options.getString("titre"))
      .setDescription(i.options.getString("texte"))
      .setTimestamp();
    await c.send({ embeds: [e] });
    return i.reply({ embeds: [ok(`Embed envoye dans ${c}.`)], flags: MessageFlags.Ephemeral });
  }
});

// /fermer-ticket
commands.push({
  data: new SlashCommandBuilder().setName("fermer-ticket").setDescription("Fermer le ticket de ce salon"),
  async execute(i) { return closeTicket(i); }
});

// /forcer-service
commands.push({
  data: admin("forcer-service", "Forcer la fin de service d'un moderateur").addUserOption(o => userOpt(o)),
  async execute(i) {
    if (!need(i, P.ManageGuild)) return;
    const u = i.options.getUser("membre");
    const active = get(i, "serviceActive", {});
    const hours = get(i, "serviceHours", {});
    if (active[u.id]) {
      hours[u.id] = (hours[u.id] || 0) + (Date.now() - active[u.id]);
      delete active[u.id];
      setting(i, "serviceHours", hours);
      setting(i, "serviceActive", active);
    }
    return i.reply({ embeds: [ok(`Service termine pour ${u}.`)], flags: MessageFlags.Ephemeral });
  }
});

// /formulaire
commands.push({
  data: admin("formulaire", "Gerer les formulaires de candidatures")
    .addSubcommand(s => s.setName("creer").setDescription("Creer un formulaire")
      .addStringOption(o => o.setName("nom").setDescription("Nom").setRequired(true))
      .addChannelOption(o => textChannel(o.setName("salon").setDescription("Salon des candidatures").setRequired(true)))
      .addStringOption(o => o.setName("questions").setDescription("Questions separees par |").setRequired(true)))
    .addSubcommand(s => s.setName("liste").setDescription("Lister les formulaires")),
  async execute(i) {
    if (!need(i, P.ManageGuild)) return;
    const s = get(i, "forms", []);
    const sub = i.options.getSubcommand();
    if (sub === "liste") {
      return i.reply({
        embeds: [info("Formulaires").setDescription(
          s.map((x, n) => `**${n + 1}.** ${x.name} -> <#${x.channelId}>`).join("\n") || "Aucun."
        )],
        flags: MessageFlags.Ephemeral
      });
    }
    if (s.length >= 8) {
      return i.reply({ embeds: [fail("Maximum de 8 formulaires.")], flags: MessageFlags.Ephemeral });
    }
    s.push({
      name: i.options.getString("nom"),
      channelId: i.options.getChannel("salon").id,
      questions: i.options.getString("questions").split("|").map(x => x.trim()).filter(Boolean)
    });
    setting(i, "forms", s);
    return i.reply({ embeds: [ok("Formulaire configure.")], flags: MessageFlags.Ephemeral });
  }
});

// /hierarchie-config
commands.push({
  data: admin("hierarchie-config", "Configurer le role hierarchique", P.ManageRoles)
    .addRoleOption(o => roleOpt(o)),
  async execute(i) {
    if (!need(i, P.ManageRoles)) return;
    setting(i, "hierarchyRoleId", i.options.getRole("role").id);
    return i.reply({ embeds: [ok("Role hierarchique configure.")], flags: MessageFlags.Ephemeral });
  }
});

// /identite
commands.push({
  data: new SlashCommandBuilder()
    .setName("identite")
    .setDescription("Afficher votre carte d'identite staff")
    .addUserOption(o => userOpt(o, "membre", false)),
  async execute(i) {
    const u = i.options.getUser("membre") || i.user;
    const m = await i.guild.members.fetch(u.id);
    const e = info("Carte d'identite")
      .setThumbnail(u.displayAvatarURL())
      .addFields(
        { name: "Nom", value: u.tag },
        { name: "ID", value: u.id },
        { name: "Roles", value: m.roles.cache.filter(r => r.id !== i.guild.id).map(r => r.toString()).join(", ") || "Aucun" }
      );
    return i.reply({ embeds: [e] });
  }
});

// /info-config
commands.push({
  data: admin("info-config", "Publier un panneau d'information")
    .addStringOption(o => o.setName("titre").setDescription("Titre").setRequired(true))
    .addStringOption(o => o.setName("texte").setDescription("Texte").setRequired(true))
    .addChannelOption(o => textChannel(o.setName("salon").setDescription("Salon").setRequired(true))),
  async execute(i) {
    if (!need(i, P.ManageGuild)) return;
    const c = i.options.getChannel("salon");
    await c.send({
      embeds: [new EmbedBuilder().setColor(COLORS.primary)
        .setTitle(i.options.getString("titre"))
        .setDescription(i.options.getString("texte"))
        .setTimestamp()]
    });
    return i.reply({ embeds: [ok("Panneau publie.")], flags: MessageFlags.Ephemeral });
  }
});

// /journal et /logs
commands.push({
  data: admin("journal", "Configurer le journal automatique")
    .addChannelOption(o => textChannel(o.setName("salon").setDescription("Salon des logs").setRequired(true))),
  async execute(i) {
    if (!need(i, P.ManageGuild)) return;
    setting(i, "logChannelId", i.options.getChannel("salon").id);
    return i.reply({ embeds: [ok("Journal configure.")], flags: MessageFlags.Ephemeral });
  }
});

commands.push({
  data: admin("logs", "Configurer le systeme de logs")
    .addSubcommand(s => s.setName("activer").setDescription("Activer les logs")
      .addChannelOption(o => textChannel(o.setName("salon").setDescription("Salon").setRequired(true))))
    .addSubcommand(s => s.setName("desactiver").setDescription("Desactiver les logs")),
  async execute(i) {
    if (!need(i, P.ManageGuild)) return;
    const sub = i.options.getSubcommand();
    setting(i, "logChannelId", sub === "activer" ? i.options.getChannel("salon").id : null);
    return i.reply({ embeds: [ok(sub === "activer" ? "Logs actives." : "Logs desactivees.")], flags: MessageFlags.Ephemeral });
  }
});

// /lang
commands.push({
  data: admin("lang", "Choisir la langue du bot")
    .addStringOption(o => o.setName("langue").setDescription("Langue").setRequired(true)
      .addChoices({ name: "Francais", value: "fr" }, { name: "English", value: "en" })),
  async execute(i) {
    if (!need(i, P.ManageGuild)) return;
    setting(i, "language", i.options.getString("langue"));
    return i.reply({ embeds: [ok("Langue enregistree.")], flags: MessageFlags.Ephemeral });
  }
});

// /msg-recurrent
commands.push({
  data: admin("msg-recurrent", "Configurer les messages recurrents")
    .addSubcommand(s => s.setName("configurer").setDescription("Configurer")
      .addChannelOption(o => textChannel(o.setName("salon").setDescription("Salon").setRequired(true)))
      .addIntegerOption(o => o.setName("minutes").setDescription("Intervalle en minutes").setMinValue(1).setRequired(true))
      .addStringOption(o => o.setName("message").setDescription("Message").setRequired(true)))
    .addSubcommand(s => s.setName("desactiver").setDescription("Desactiver")),
  async execute(i) {
    if (!need(i, P.ManageGuild)) return;
    const sub = i.options.getSubcommand();
    if (sub === "desactiver") setting(i, "recurringMessage", null);
    else setting(i, "recurringMessage", {
      channelId: i.options.getChannel("salon").id,
      minutes: i.options.getInteger("minutes"),
      text: i.options.getString("message")
    });
    return i.reply({ embeds: [ok("Configuration du message recurrente mise a jour.")], flags: MessageFlags.Ephemeral });
  }
});

// /niveaux et /top
commands.push({
  data: admin("niveaux", "Configurer le systeme de niveaux")
    .addBooleanOption(o => o.setName("actif").setDescription("Activer XP").setRequired(true)),
  async execute(i) {
    if (!need(i, P.ManageGuild)) return;
    setting(i, "levelsEnabled", i.options.getBoolean("actif"));
    return i.reply({ embeds: [ok("Systeme de niveaux mis a jour.")], flags: MessageFlags.Ephemeral });
  }
});

commands.push({
  data: new SlashCommandBuilder().setName("top").setDescription("Classement XP du serveur"),
  async execute(i) {
    const xp = get(i, "xp", {});
    const list = Object.entries(xp).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([id, v], n) => `**${n + 1}.** <@${id}> - **${v} XP**`).join("\n") || "Aucun XP.";
    return i.reply({ embeds: [info("Top XP").setDescription(list)] });
  }
});

// /nombre-infini-config et /nombre-infini
commands.push({
  data: admin("nombre-infini-config", "Configurer le jeu du comptage")
    .addIntegerOption(o => o.setName("score").setDescription("Score de depart").setMinValue(0).setRequired(true)),
  async execute(i) {
    if (!need(i, P.ManageGuild)) return;
    setting(i, "countNumber", i.options.getInteger("score"));
    return i.reply({ embeds: [ok("Score configure.")], flags: MessageFlags.Ephemeral });
  }
});

commands.push({
  data: new SlashCommandBuilder().setName("nombre-infini").setDescription("Voir le score du comptage"),
  async execute(i) {
    return i.reply({ embeds: [info("Route de l'infini").setDescription(`Score actuel : **${get(i, "countNumber", 0)}**`)] });
  }
});

// /perdu / quiz / pfc
commands.push({
  data: new SlashCommandBuilder().setName("perdu").setDescription("Jouer au perdu"),
  async execute(i) {
    const n = Math.floor(Math.random() * 100) + 1;
    return i.reply({ embeds: [info("Perdu").setDescription(`Nombre tire : **${n}**.`)] });
  }
});

commands.push({
  data: new SlashCommandBuilder().setName("quiz").setDescription("Repondre a une question de culture generale"),
  async execute(i) {
    const q = [
      ["Capitale de la France ?", "Paris"],
      ["Planete rouge ?", "Mars"],
      ["2 + 2 ?", "4"],
      ["Combien de continents ?", "7"]
    ][Math.floor(Math.random() * 4)];
    return i.reply({ embeds: [info("Quiz").setDescription(`**Question :** ${q[0]}\nReponse : **${q[1]}**`)] });
  }
});

commands.push({
  data: new SlashCommandBuilder().setName("pfc").setDescription("Pierre-Feuille-Ciseaux")
    .addStringOption(o => o.setName("choix").setDescription("Ton choix").setRequired(true)
      .addChoices({ name: "Pierre", value: "pierre" }, { name: "Feuille", value: "feuille" }, { name: "Ciseaux", value: "ciseaux" })),
  async execute(i) {
    const a = i.options.getString("choix");
    const b = ["pierre", "feuille", "ciseaux"][Math.floor(Math.random() * 3)];
    const win = a === b ? "Egalite" :
      ((a === "pierre" && b === "ciseaux") || (a === "feuille" && b === "pierre") || (a === "ciseaux" && b === "feuille") ? "Victoire" : "Defaite");
    return i.reply({ embeds: [info("Pierre-Feuille-Ciseaux").setDescription(`Toi: **${a}**\nBot: **${b}**\n\n**${win}**`)] });
  }
});

// /profile-bot
commands.push({
  data: admin("profile-bot", "Configurer le profil du bot sur ce serveur")
    .addStringOption(o => o.setName("texte").setDescription("Texte du profil").setRequired(true)),
  async execute(i) {
    if (!need(i, P.ManageGuild)) return;
    setting(i, "botProfile", i.options.getString("texte"));
    return i.reply({ embeds: [ok("Profil local enregistre.")], flags: MessageFlags.Ephemeral });
  }
});

// /raid-config / raid-lock / raid-unlock
commands.push({
  data: admin("raid-config", "Configurer le systeme anti-raid")
    .addBooleanOption(o => o.setName("actif").setDescription("Activer le mode anti-raid").setRequired(true)),
  async execute(i) {
    if (!need(i, P.ManageGuild)) return;
    setting(i, "raidAlertEnabled", i.options.getBoolean("actif"));
    return i.reply({ embeds: [ok("Configuration anti-raid mise a jour.")], flags: MessageFlags.Ephemeral });
  }
});

commands.push({
  data: admin("raid-lock", "Verrouiller le serveur en cas de raid", P.ManageChannels),
  async execute(i) {
    if (!need(i, P.ManageChannels)) return;
    for (const c of i.guild.channels.cache.values()) {
      if (c.isTextBased()) await c.permissionOverwrites.edit(i.guild.roles.everyone, { SendMessages: false }).catch(() => {});
    }
    setting(i, "raidLocked", true);
    return i.reply({ embeds: [ok("Serveur verrouille.")] });
  }
});

commands.push({
  data: admin("raid-unlock", "Deverrouiller le serveur", P.ManageChannels),
  async execute(i) {
    if (!need(i, P.ManageChannels)) return;
    for (const c of i.guild.channels.cache.values()) {
      if (c.isTextBased()) await c.permissionOverwrites.edit(i.guild.roles.everyone, { SendMessages: null }).catch(() => {});
    }
    setting(i, "raidLocked", false);
    return i.reply({ embeds: [ok("Serveur deverrouille.")] });
  }
});

// /reglement
commands.push({
  data: admin("reglement", "Publier le reglement")
    .addChannelOption(o => textChannel(o.setName("salon").setDescription("Salon").setRequired(true)))
    .addStringOption(o => o.setName("texte").setDescription("Reglement").setRequired(true)),
  async execute(i) {
    if (!need(i, P.ManageGuild)) return;
    await i.options.getChannel("salon").send({ embeds: [info("Reglement").setDescription(i.options.getString("texte"))] });
    return i.reply({ embeds: [ok("Reglement publie.")], flags: MessageFlags.Ephemeral });
  }
});

// /role-humain
commands.push({
  data: admin("role-humain", "Ajouter ou retirer un role en masse", P.ManageRoles)
    .addStringOption(o => o.setName("action").setDescription("Action").setRequired(true)
      .addChoices({ name: "Ajouter", value: "ajouter" }, { name: "Retirer", value: "retirer" }))
    .addRoleOption(o => roleOpt(o))
    .addRoleOption(o => o.setName("role_cible").setDescription("Role a traiter").setRequired(false)),
  async execute(i) {
    if (!need(i, P.ManageRoles)) return;
    const role = i.options.getRole("role");
    const action = i.options.getString("action");
    const target = i.options.getRole("role_cible");
    const members = i.guild.members.cache.filter(m => !m.user.bot && (target ? m.roles.cache.has(target.id) : true));
    for (const m of members.values()) {
      await (action === "ajouter" ? m.roles.add(role) : m.roles.remove(role)).catch(() => {});
    }
    return i.reply({ embeds: [ok(`${action} effectue sur ${members.size} membre(s).`)], flags: MessageFlags.Ephemeral });
  }
});

// /role-reaction
commands.push({
  data: admin("role-reaction", "Publier un bouton de role", P.ManageRoles)
    .addRoleOption(o => roleOpt(o))
    .addChannelOption(o => textChannel(o.setName("salon").setDescription("Salon").setRequired(true))),
  async execute(i) {
    if (!need(i, P.ManageRoles)) return;
    const role = i.options.getRole("role");
    const c = i.options.getChannel("salon");
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`role_toggle:${role.id}`)
        .setLabel(role.name.slice(0, 80))
        .setStyle(ButtonStyle.Primary)
    );
    await c.send({ content: `Clique pour ajouter/retirer ${role}.`, components: [row] });
    return i.reply({ embeds: [ok("Panneau de role publie.")], flags: MessageFlags.Ephemeral });
  }
});

// /say
commands.push({
  data: admin("say", "Faire envoyer un message texte par le bot")
    .addChannelOption(o => textChannel(o.setName("salon").setDescription("Salon").setRequired(true)))
    .addStringOption(o => o.setName("message").setDescription("Message").setRequired(true)),
  async execute(i) {
    if (!need(i, P.ManageMessages)) return;
    const c = i.options.getChannel("salon");
    await c.send({ content: i.options.getString("message") });
    return i.reply({ embeds: [ok("Message envoye.")], flags: MessageFlags.Ephemeral });
  }
});

// /serverbanner / servericon / serverinfo / serveurs
commands.push({
  data: new SlashCommandBuilder().setName("serverbanner").setDescription("Afficher la banniere du serveur"),
  async execute(i) {
    const url = i.guild.bannerURL({ size: 2048, dynamic: true });
    return i.reply({ embeds: [url
      ? new EmbedBuilder().setColor(COLORS.primary).setTitle(i.guild.name).setImage(url)
      : info("Banniere").setDescription("Aucune banniere configuree.")] });
  }
});

commands.push({
  data: new SlashCommandBuilder().setName("servericon").setDescription("Afficher la photo de profil du serveur"),
  async execute(i) {
    const url = i.guild.iconURL({ size: 2048, dynamic: true });
    return i.reply({ embeds: [url
      ? new EmbedBuilder().setColor(COLORS.primary).setTitle(i.guild.name).setImage(url)
      : info("Icone").setDescription("Aucune icone configuree.")] });
  }
});

commands.push({
  data: new SlashCommandBuilder().setName("serveurs").setDescription("Liste des serveurs du bot"),
  async execute(i) {
    const list = [...i.client.guilds.cache.values()].slice(0, 25)
      .map(g => `**${g.name}** - ${g.memberCount} membres`).join("\n") || "Aucun serveur.";
    return i.reply({ embeds: [info(`Serveurs (${i.client.guilds.cache.size})`).setDescription(list)] });
  }
});

// /stats / topinvites
commands.push({
  data: new SlashCommandBuilder().setName("stats").setDescription("Statistiques du serveur"),
  async execute(i) {
    const g = i.guild;
    return i.reply({
      embeds: [info("Statistiques").addFields(
        { name: "Membres", value: String(g.memberCount), inline: true },
        { name: "Bots", value: String(g.members.cache.filter(m => m.user.bot).size), inline: true },
        { name: "Salons", value: String(g.channels.cache.size), inline: true },
        { name: "Roles", value: String(g.roles.cache.size), inline: true }
      )]
    });
  }
});

commands.push({
  data: new SlashCommandBuilder().setName("topinvites").setDescription("Classement des invitations"),
  async execute(i) {
    const inv = await i.guild.invites.fetch().catch(() => null);
    if (!inv) return i.reply({ embeds: [fail("Impossible de lire les invitations.")] });
    const map = {};
    for (const x of inv.values()) {
      if (x.inviter) map[x.inviter.id] = (map[x.inviter.id] || 0) + (x.uses || 0);
    }
    const list = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([id, n], k) => `**${k + 1}.** <@${id}> - ${n}`).join("\n") || "Aucune invitation.";
    return i.reply({ embeds: [info("Top invitations").setDescription(list)] });
  }
});

// /setup-service / sumall
commands.push({
  data: admin("setup-service", "Configurer la prise de service")
    .addRoleOption(o => roleOpt(o))
    .addChannelOption(o => textChannel(o.setName("salon").setDescription("Salon").setRequired(true))),
  async execute(i) {
    if (!need(i, P.ManageGuild)) return;
    setting(i, "serviceRoleId", i.options.getRole("role").id);
    setting(i, "serviceChannelId", i.options.getChannel("salon").id);
    return i.reply({ embeds: [ok("Prise de service configuree.")], flags: MessageFlags.Ephemeral });
  }
});

commands.push({
  data: new SlashCommandBuilder().setName("sumall").setDescription("Voir les heures de service"),
  async execute(i) {
    const hours = get(i, "serviceHours", {});
    const list = Object.entries(hours).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([id, ms], n) => `**${n + 1}.** <@${id}> - **${(ms / 3600000).toFixed(2)} h**`).join("\n") || "Aucune heure.";
    return i.reply({ embeds: [info("Heures de service").setDescription(list)] });
  }
});

// /soutien
commands.push({
  data: admin("soutien", "Configurer les roles de soutien")
    .addRoleOption(o => roleOpt(o)),
  async execute(i) {
    if (!need(i, P.ManageRoles)) return;
    setting(i, "supportRoleId", i.options.getRole("role").id);
    return i.reply({ embeds: [ok("Role de soutien configure.")], flags: MessageFlags.Ephemeral });
  }
});

// /support
commands.push({
  data: new SlashCommandBuilder().setName("support").setDescription("Lien vers le serveur de support officiel"),
  async execute(i) {
    return i.reply({ content: "Serveur de support : https://discord.com/invite/", flags: MessageFlags.Ephemeral });
  }
});

// /support-vocal
commands.push({
  data: admin("support-vocal", "Gerer le systeme de support vocal")
    .addChannelOption(o => o.setName("salon").setDescription("Salon vocal").addChannelTypes(ChannelType.GuildVoice).setRequired(true)),
  async execute(i) {
    if (!need(i, P.ManageChannels)) return;
    setting(i, "supportVoiceChannelId", i.options.getChannel("salon").id);
    return i.reply({ embeds: [ok("Support vocal configure.")], flags: MessageFlags.Ephemeral });
  }
});

// /staff-bienvenue / staff-depart
commands.push({
  data: admin("staff-bienvenue", "Configurer le systeme de bienvenue automatique pour le staff")
    .addChannelOption(o => textChannel(o.setName("salon").setDescription("Salon").setRequired(true))),
  async execute(i) {
    if (!need(i, P.ManageGuild)) return;
    setting(i, "staffWelcomeChannelId", i.options.getChannel("salon").id);
    return i.reply({ embeds: [ok("Bienvenue staff configure.")], flags: MessageFlags.Ephemeral });
  }
});

commands.push({
  data: admin("staff-depart", "Configurer le systeme de depart automatique pour le staff")
    .addChannelOption(o => textChannel(o.setName("salon").setDescription("Salon").setRequired(true))),
  async execute(i) {
    if (!need(i, P.ManageGuild)) return;
    setting(i, "staffLeaveChannelId", i.options.getChannel("salon").id);
    return i.reply({ embeds: [ok("Depart staff configure.")], flags: MessageFlags.Ephemeral });
  }
});

// /setup-tempvoice
commands.push({
  data: admin("setup-tempvoice", "Configurer les salons vocaux temporaires")
    .addChannelOption(o => o.setName("lobby").setDescription("Salon vocal d'entree").addChannelTypes(ChannelType.GuildVoice).setRequired(true))
    .addChannelOption(o => o.setName("categorie").setDescription("Categorie").addChannelTypes(ChannelType.GuildCategory).setRequired(true)),
  async execute(i) {
    if (!need(i, P.ManageChannels)) return;
    setting(i, "tempVoice", {
      lobbyId: i.options.getChannel("lobby").id,
      categoryId: i.options.getChannel("categorie").id,
      prefix: "🔊"
    });
    return i.reply({ embeds: [ok("Salons vocaux temporaires configures.")], flags: MessageFlags.Ephemeral });
  }
});

// /unwarn / sanctions
commands.push({
  data: admin("unwarn", "Retirer un avertissement a un membre")
    .addUserOption(o => userOpt(o)),
  async execute(i) {
    if (!need(i, P.ModerateMembers)) return;
    const u = i.options.getUser("membre");
    const warnings = db.getWarnings(i.guild.id, u.id);
    if (!warnings.length) return i.reply({ embeds: [fail("Aucun avertissement.")] });
    warnings.pop();
    db.setWarnings(i.guild.id, u.id, warnings);
    return i.reply({ embeds: [ok(`Dernier avertissement retire pour ${u}.`)], flags: MessageFlags.Ephemeral });
  }
});

commands.push({
  data: new SlashCommandBuilder().setName("sanctions").setDescription("Consulter les sanctions d'un membre")
    .addUserOption(o => userOpt(o)),
  async execute(i) {
    const u = i.options.getUser("membre");
    const w = db.getWarnings(i.guild.id, u.id);
    return i.reply({ embeds: [info(`Sanctions de ${u.tag}`).setDescription(w.length ? w.map((x, n) => `${n + 1}. ${x.reason || "Sans raison"}`).join("\n") : "Aucune sanction.")] });
  }
});

// /botinfo / tuto / avantage-vip
commands.push({
  data: new SlashCommandBuilder().setName("botinfo").setDescription("Informations sur Server Manager"),
  async execute(i) {
    return i.reply({ embeds: [info("Server Manager").setDescription(`Serveurs : **${i.client.guilds.cache.size}**\nUtilisateurs en cache : **${i.client.users.cache.size}**`)] });
  }
});

commands.push({
  data: new SlashCommandBuilder().setName("tuto").setDescription("Guide de configuration de toutes les commandes"),
  async execute(i) {
    return i.reply({
      embeds: [info("Guide").setDescription(
        "Configure les fonctions d'administration avec les commandes correspondantes.\n\n" +
        "`/config` · `/logs` · `/raid-config` · `/ticket-config` · `/setup-service` · `/setup-tempvoice`"
      )],
      flags: MessageFlags.Ephemeral
    });
  }
});

commands.push({
  data: new SlashCommandBuilder().setName("avantage-vip").setDescription("Affiche les avantages VIP du bot et le statut VIP de ce serveur"),
  async execute(i) {
    const vip = get(i, "vip", false);
    return i.reply({ embeds: [info("Avantages VIP").setDescription(`Statut de ce serveur : **${vip ? "VIP" : "Standard"}**\n\nFonctionnalites supplementaires selon la configuration du serveur.`)] });
  }
});

// /cmd-config
commands.push({
  data: admin("cmd-config", "Gerer les commandes personnalisees")
    .addSubcommand(s => s.setName("add").setDescription("Creer une nouvelle commande")
      .addStringOption(o => o.setName("nom").setDescription("Nom").setRequired(true))
      .addStringOption(o => o.setName("reponse").setDescription("Reponse").setRequired(true)))
    .addSubcommand(s => s.setName("liste").setDescription("Voir les commandes"))
    .addSubcommand(s => s.setName("prefix").setDescription("Definir le prefixe")
      .addStringOption(o => o.setName("prefixe").setDescription("Prefixe").setRequired(true)))
    .addSubcommand(s => s.setName("supprimer").setDescription("Supprimer une commande")
      .addStringOption(o => o.setName("nom").setDescription("Nom").setRequired(true))),
  async execute(i) {
    if (!need(i, P.ManageGuild)) return;
    const sub = i.options.getSubcommand();
    const cc = get(i, "customCommands", {});
    if (sub === "add") {
      const n = i.options.getString("nom").toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if (!n) return i.reply({ embeds: [fail("Nom invalide.")], flags: MessageFlags.Ephemeral });
      cc[n] = i.options.getString("reponse");
      setting(i, "customCommands", cc);
      return i.reply({ embeds: [ok(`Commande ${n} creee.`)], flags: MessageFlags.Ephemeral });
    }
    if (sub === "supprimer") {
      delete cc[i.options.getString("nom").toLowerCase()];
      setting(i, "customCommands", cc);
      return i.reply({ embeds: [ok("Commande supprimee.")], flags: MessageFlags.Ephemeral });
    }
    if (sub === "prefix") {
      setting(i, "customPrefix", i.options.getString("prefixe"));
      return i.reply({ embeds: [ok("Prefixe modifie.")], flags: MessageFlags.Ephemeral });
    }
    return i.reply({
      embeds: [info("Commandes personnalisees").setDescription(Object.keys(cc).map(x => `\`${x}\``).join(", ") || "Aucune.")],
      flags: MessageFlags.Ephemeral
    });
  }
});

// /stats-channels
commands.push({
  data: admin("stats-channels", "Gerer les salons de statistiques")
    .addSubcommand(s => s.setName("creer").setDescription("Creer un salon statistique")
      .addStringOption(o => o.setName("type").setDescription("Type").setRequired(true)
        .addChoices({ name: "Membres", value: "members" }, { name: "Bots", value: "bots" }, { name: "Salons", value: "channels" })))
    .addSubcommand(s => s.setName("liste").setDescription("Lister les salons"))
    .addSubcommand(s => s.setName("supprimer").setDescription("Supprimer un salon")
      .addChannelOption(o => o.setName("salon").setDescription("Salon").setRequired(true))),
  async execute(i) {
    if (!need(i, P.ManageChannels)) return;
    const s = db.getSettings(i.guild.id);
    s.statsChannels ??= [];
    const sub = i.options.getSubcommand();

    if (sub === "liste") {
      return i.reply({
        embeds: [info("Salons stats").setDescription(
          s.statsChannels.map(x => `<#${x.id}> - ${x.type}`).join("\n") || "Aucun."
        )],
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === "supprimer") {
      const c = i.options.getChannel("salon");
      s.statsChannels = s.statsChannels.filter(x => x.id !== c.id);
      db.setSetting(i.guild.id, "statsChannels", s.statsChannels);
      await c.delete().catch(() => {});
      return i.reply({ embeds: [ok("Salon supprime.")], flags: MessageFlags.Ephemeral });
    }

    const type = i.options.getString("type");
    const names = {
      members: `membres-${i.guild.memberCount}`,
      bots: `bots-${i.guild.members.cache.filter(m => m.user.bot).size}`,
      channels: `salons-${i.guild.channels.cache.size}`
    };
    const c = await i.guild.channels.create({ name: names[type], type: ChannelType.GuildVoice });
    s.statsChannels.push({ id: c.id, type });
    db.setSetting(i.guild.id, "statsChannels", s.statsChannels);
    return i.reply({ embeds: [ok(`Salon cree : ${c}`)], flags: MessageFlags.Ephemeral });
  }
});

// /suggest
commands.push({
  data: new SlashCommandBuilder().setName("suggest").setDescription("Soumettre une suggestion")
    .addStringOption(o => o.setName("texte").setDescription("Suggestion").setRequired(true)),
  async execute(i) {
    const c = i.guild.channels.cache.get(get(i, "suggestChannelId", null));
    const e = info("Suggestion")
      .setDescription(i.options.getString("texte"))
      .setAuthor({ name: i.user.tag, iconURL: i.user.displayAvatarURL() });
    if (c?.isTextBased()) await c.send({ embeds: [e] });
    else await i.channel.send({ embeds: [e] });
    return i.reply({ embeds: [ok("Suggestion envoyee.")], flags: MessageFlags.Ephemeral });
  }
});

// /slowmode
commands.push({
  data: admin("slowmode", "Definir le slowmode d'un salon", P.ManageChannels)
    .addIntegerOption(o => o.setName("secondes").setDescription("Secondes").setMinValue(0).setMaxValue(21600).setRequired(true))
    .addChannelOption(o => o.setName("salon").setDescription("Salon").addChannelTypes(ChannelType.GuildText)),
  async execute(i) {
    if (!need(i, P.ManageChannels)) return;
    const c = i.options.getChannel("salon") || i.channel;
    await c.setRateLimitPerUser(i.options.getInteger("secondes"));
    return i.reply({ embeds: [ok(`Slowmode defini a ${i.options.getInteger("secondes")} seconde(s).`)], flags: MessageFlags.Ephemeral });
  }
});

// /morpion
commands.push({
  data: new SlashCommandBuilder().setName("morpion").setDescription("Jouer au morpion contre un autre membre")
    .addUserOption(o => userOpt(o)),
  async execute(i) {
    const u = i.options.getUser("membre");
    if (u.bot || u.id === i.user.id) {
      return i.reply({ embeds: [fail("Choisis un autre membre.")], flags: MessageFlags.Ephemeral });
    }
    const board = Array(9).fill("?");
    let turn = i.user.id;

    const make = () => {
      const rows = [];
      for (let r = 0; r < 3; r++) {
        const row = new ActionRowBuilder();
        for (let c = 0; c < 3; c++) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`morpion:${i.id}:${r * 3 + c}`)
              .setLabel(board[r * 3 + c])
              .setStyle(ButtonStyle.Secondary)
          );
        }
        rows.push(row);
      }
      return rows;
    };

    const m = await i.reply({
      embeds: [info("Morpion").setDescription(`${i.user} contre ${u}\nTour de ${i.user}`)],
      components: make(),
      fetchReply: true
    });

    const col = m.createMessageComponentCollector({ time: 300000 });

    col.on("collect", async b => {
      if (![i.user.id, u.id].includes(b.user.id)) {
        return b.reply({ content: "Tu ne participes pas a cette partie.", flags: MessageFlags.Ephemeral });
      }
      if (b.user.id !== turn) {
        return b.reply({ content: "Ce n'est pas ton tour.", flags: MessageFlags.Ephemeral });
      }

      const pos = Number(b.customId.split(":").pop());
      if (board[pos] !== "?") {
        return b.reply({ content: "Case deja prise.", flags: MessageFlags.Ephemeral });
      }

      board[pos] = b.user.id === i.user.id ? "X" : "O";
      turn = b.user.id === i.user.id ? u.id : i.user.id;

      await b.update({
        embeds: [info("Morpion").setDescription(`${i.user} contre ${u}\nTour de <@${turn}>`)],
        components: make()
      });
    });
  }
});

module.exports = commands;