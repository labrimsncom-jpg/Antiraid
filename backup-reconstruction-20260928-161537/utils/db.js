const fs = require("node:fs");
const path = require("node:path");

// Petite base JSON (sans dépendance native). Sur Railway, monte un Volume et
// mets DATA_DIR=/data pour que la config et les warns survivent aux redéploiements.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const FILE = path.join(DATA_DIR, "db.json");
fs.mkdirSync(DATA_DIR, { recursive: true });

let data = {};
try {
  data = JSON.parse(fs.readFileSync(FILE, "utf8"));
} catch {
  data = {};
}

let timer = null;

function flush() {
  clearTimeout(timer);
  timer = null;
  try {
    const tmp = `${FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, FILE);
  } catch (error) {
    console.error("Erreur de sauvegarde :", error);
  }
}

function save() {
  if (!timer) timer = setTimeout(flush, 500);
}

function guildData(guildId) {
  data[guildId] ??= { settings: {}, warnings: {} };
  return data[guildId];
}

module.exports = {
  flush,

  // Giveaways (stockés à part, indexés par leur id)
  giveaways: {
    all: () => Object.values(data._giveaways ?? {}),
    get: (id) => data._giveaways?.[id],
    set(id, giveaway) {
      (data._giveaways ??= {})[id] = giveaway;
      save();
    },
  },

  getSettings: (guildId) => guildData(guildId).settings,

  setSetting(guildId, key, value) {
    guildData(guildId).settings[key] = value;
    save();
  },

  getWarnings: (guildId, userId) => guildData(guildId).warnings[userId] ?? [],

  addWarning(guildId, userId, warning) {
    const warnings = guildData(guildId).warnings;
    (warnings[userId] ??= []).push(warning);
    save();
    return warnings[userId].length;
  },

  clearWarnings(guildId, userId) {
    const warnings = guildData(guildId).warnings;
    const count = warnings[userId]?.length ?? 0;
    delete warnings[userId];
    save();
    return count;
  },
};
