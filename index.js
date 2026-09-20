require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const db = require("./utils/db");

if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === "colle_ton_token_ici") {
  console.error("❌ DISCORD_TOKEN manquant. Renseigne-le dans le fichier .env (ou dans les Variables Railway).");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // intent privilégié : à activer dans le Developer Portal
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // intent privilégié : à activer dans le Developer Portal
  ],
  partials: [Partials.Message, Partials.Channel],
});
client.commands = new Collection();

// Liste tous les .js d'un dossier, sous-dossiers compris
function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full);
    return entry.name.endsWith(".js") ? [full] : [];
  });
}

// Commandes : le nom du sous-dossier devient la catégorie (affichée dans /help)
for (const file of listFiles(path.join(__dirname, "commands"))) {
  const command = require(file);
  command.category = path.basename(path.dirname(file));
  client.commands.set(command.data.name, command);
}

// Événements
// (un fichier peut exporter un seul événement ou un tableau d'événements)
for (const file of listFiles(path.join(__dirname, "events"))) {
  for (const event of [].concat(require(file))) {
    const run = (...args) => event.execute(...args).catch((error) => console.error(`Erreur dans ${event.name} :`, error));
    if (event.once) client.once(event.name, run);
    else client.on(event.name, run);
  }
}

// Sauvegarde propre quand Railway redémarre le bot
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    db.flush();
    process.exit(0);
  });
}
process.on("unhandledRejection", (error) => console.error("Promesse rejetée :", error));

client.login(process.env.DISCORD_TOKEN);
