require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const db = require("./utils/db");

if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === "colle_ton_token_ici") {
  console.error("DISCORD_TOKEN manquant.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message, Partials.Channel],
});

client.commands = new Collection();

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return listFiles(full);
    }

    return entry.name.endsWith(".js") ? [full] : [];
  });
}

// Chargement sécurisé des commandes
for (const file of listFiles(path.join(__dirname, "commands"))) {
  try {
    const loaded = require(file);
    const commands = Array.isArray(loaded) ? loaded : [loaded];

    for (const command of commands) {
      if (!command?.data?.name || typeof command.execute !== "function") {
        console.warn(
          `[SKIP] Commande invalide ignoree : ${path.relative(__dirname, file)}`
        );
        continue;
      }

      command.category = path.basename(path.dirname(file));
      client.commands.set(command.data.name, command);
    }
  } catch (error) {
    console.error(
      `[ERREUR] Chargement commande ${path.relative(__dirname, file)} :`,
      error
    );
  }
}

// Chargement sécurisé des événements
for (const file of listFiles(path.join(__dirname, "events"))) {
  try {
    const loaded = require(file);
    const events = Array.isArray(loaded) ? loaded : [loaded];

    for (const event of events) {
      if (!event?.name || typeof event.execute !== "function") {
        console.warn(
          `[SKIP] Event invalide ignore : ${path.relative(__dirname, file)}`
        );
        continue;
      }

      const run = (...args) =>
        Promise.resolve(event.execute(...args)).catch((error) => {
          console.error(`Erreur dans l'event ${event.name} :`, error);
        });

      if (event.once) {
        client.once(event.name, run);
      } else {
        client.on(event.name, run);
      }
    }
  } catch (error) {
    console.error(
      `[ERREUR] Chargement event ${path.relative(__dirname, file)} :`,
      error
    );
  }
}

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    try {
      db.flush();
    } finally {
      process.exit(0);
    }
  });
}

process.on("unhandledRejection", (error) => {
  console.error("Promesse rejetee :", error);
});

process.on("uncaughtException", (error) => {
  console.error("Exception non geree :", error);
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error("Connexion Discord impossible :", error);
  process.exit(1);
});
