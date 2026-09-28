require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");

const {
    Client,
    Collection,
    GatewayIntentBits,
    Partials
} = require("discord.js");

const db = require("./utils/db");

if (!process.env.DISCORD_TOKEN) {
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
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [
        Partials.Message,
        Partials.Channel
    ]
});

client.commands = new Collection();

function getFiles(directory) {
    if (!fs.existsSync(directory)) return [];

    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            return getFiles(fullPath);
        }

        return entry.name.endsWith(".js") ? [fullPath] : [];
    });
}

/* =========================
   COMMANDES
========================= */

for (const file of getFiles(path.join(__dirname, "commands"))) {
    try {
        const loaded = require(file);
        const commands = Array.isArray(loaded) ? loaded : [loaded];

        for (const command of commands) {

            if (
                !command ||
                !command.data ||
                !command.data.name ||
                typeof command.execute !== "function"
            ) {
                console.warn(
                    "[SKIP] Commande invalide :",
                    path.relative(__dirname, file)
                );
                continue;
            }

            if (client.commands.has(command.data.name)) {
                console.warn(
                    `[DUPLICATE] ${command.data.name} ignorée depuis ${path.relative(__dirname, file)}`
                );
                continue;
            }

            command.category = path.basename(path.dirname(file));
            command.__source = file;

            client.commands.set(command.data.name, command);
        }

    } catch (error) {
        console.error(
            "[ERREUR COMMANDE]",
            path.relative(__dirname, file),
            error
        );
    }
}

/* =========================
   EVENTS
========================= */

for (const file of getFiles(path.join(__dirname, "events"))) {
    try {
        const loaded = require(file);
        const events = Array.isArray(loaded) ? loaded : [loaded];

        for (const event of events) {

            if (
                !event ||
                !event.name ||
                typeof event.execute !== "function"
            ) {
                console.warn(
                    "[SKIP] Event invalide :",
                    path.relative(__dirname, file)
                );
                continue;
            }

            const run = (...args) => {
                Promise.resolve(event.execute(...args))
                    .catch(error => {
                        console.error(
                            `Erreur event ${event.name}:`,
                            error
                        );
                    });
            };

            if (event.once) {
                client.once(event.name, run);
            } else {
                client.on(event.name, run);
            }
        }

    } catch (error) {
        console.error(
            "[ERREUR EVENT]",
            path.relative(__dirname, file),
            error
        );
    }
}

/* =========================
   ARRET PROPRE
========================= */

for (const signal of ["SIGTERM", "SIGINT"]) {
    process.on(signal, () => {
        try {
            if (db && typeof db.flush === "function") {
                db.flush();
            }
        } finally {
            process.exit(0);
        }
    });
}

process.on("unhandledRejection", error => {
    console.error("Promesse rejetée :", error);
});

process.on("uncaughtException", error => {
    console.error("Exception non gérée :", error);
});

/* =========================
   CONNEXION
========================= */

client.login(process.env.DISCORD_TOKEN)
    .catch(error => {
        console.error("Connexion Discord impossible :", error);
        process.exit(1);
    });