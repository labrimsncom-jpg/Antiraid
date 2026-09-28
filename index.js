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
    console.error("❌ DISCORD_TOKEN manquant.");
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

    return fs.readdirSync(directory, { withFileTypes: true })
        .sort((a, b) => a.name.localeCompare(b.name))
        .flatMap(entry => {
            const full = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                return getFiles(full);
            }

            return entry.name.endsWith(".js") ? [full] : [];
        });
}

function relative(file) {
    return path.relative(__dirname, file);
}

/* =========================
   COMMANDES
========================= */

const commandFiles = getFiles(path.join(__dirname, "commands"));

for (const file of commandFiles) {
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
                console.warn(`[SKIP] Commande invalide : ${relative(file)}`);
                continue;
            }

            const name = command.data.name;

            if (client.commands.has(name)) {
                const old = client.commands.get(name);
                console.warn(
                    `[DUPLICATE] /${name} ignorée : ${relative(file)}`
                );
                console.warn(
                    `           version déjà chargée : ${old.__source ? relative(old.__source) : "inconnue"}`
                );
                continue;
            }

            command.category = path.basename(path.dirname(file));
            command.__source = file;

            client.commands.set(name, command);
        }
    } catch (error) {
        console.error(`[ERREUR COMMANDE] ${relative(file)}`);
        console.error(error);
    }
}

/* =========================
   EVENTS
========================= */

const eventFiles = getFiles(path.join(__dirname, "events"));

for (const file of eventFiles) {
    try {
        const loaded = require(file);
        const events = Array.isArray(loaded) ? loaded : [loaded];

        for (const event of events) {
            if (
                !event ||
                !event.name ||
                typeof event.execute !== "function"
            ) {
                console.warn(`[SKIP] Event invalide : ${relative(file)}`);
                continue;
            }

            const run = (...args) => {
                Promise.resolve(event.execute(...args))
                    .catch(error => {
                        console.error(
                            `❌ Erreur event ${event.name} (${relative(file)})`
                        );
                        console.error(error);
                    });
            };

            if (event.once) {
                client.once(event.name, run);
            } else {
                client.on(event.name, run);
            }
        }
    } catch (error) {
        console.error(`[ERREUR EVENT] ${relative(file)}`);
        console.error(error);
    }
}

/* =========================
   ERREURS
========================= */

process.on("unhandledRejection", error => {
    console.error("❌ Promesse rejetée :", error);
});

process.on("uncaughtException", error => {
    console.error("❌ Exception non gérée :", error);
});

/* =========================
   ARRET PROPRE
========================= */

for (const signal of ["SIGTERM", "SIGINT"]) {
    process.on(signal, () => {
        try {
            if (db && typeof db.flush === "function") {
                db.flush();
            }
        } catch (error) {
            console.error("Erreur sauvegarde DB :", error);
        } finally {
            process.exit(0);
        }
    });
}

/* =========================
   INTERACTION
========================= */

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.warn(`Commande Discord inconnue : /${interaction.commandName}`);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: "❌ Cette commande n'est pas disponible actuellement.",
                ephemeral: true
            }).catch(() => {});
        }

        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(
            `❌ ERREUR /${interaction.commandName}`,
            command.__source ? `(${relative(command.__source)})` : ""
        );
        console.error(error);

        const message = {
            content: "❌ Une erreur est survenue pendant l'exécution de la commande.",
            ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(message).catch(() => {});
        } else {
            await interaction.reply(message).catch(() => {});
        }
    }
});

/* =========================
   CONNEXION
========================= */

client.login(process.env.DISCORD_TOKEN)
    .then(() => {
        console.log("✅ Main bot connecté.");
        console.log(`📦 ${client.commands.size} commande(s) chargée(s).`);
    })
    .catch(error => {
        console.error("❌ Connexion Discord impossible :", error);
        process.exit(1);
    });
