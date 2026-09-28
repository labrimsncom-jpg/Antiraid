# Server Manager v2

Bot Discord tout-en-un (discord.js v14) : modération, **anti-raid / anti-spam / anti-lien**, tickets, giveaways, logs, fun et utilitaires.

## Lancer en local
```
npm install
npm start
```
Le token du bot va dans `.env` (`DISCORD_TOKEN=...`).

## À faire dans le Discord Developer Portal (onglet Bot)
Active les **deux** intents privilégiés, sinon le bot refuse de démarrer :
- **Server Members Intent** (anti-raid, bienvenue, autorole)
- **Message Content Intent** (anti-spam, anti-lien, logs des messages)

Puis invite le bot (scopes `bot` + `applications.commands`) et mets son rôle **au-dessus** des rôles qu'il doit gérer.

## Sur Railway
- Variable `DISCORD_TOKEN` = token du bot.
- Pour garder la config, les warns et les giveaways entre les redéploiements : ajoute un **Volume** monté sur `/data` et la variable `DATA_DIR=/data`.

## Protection
| Commande | Rôle |
|---|---|
| `/antiraid` | Détecte les arrivées en rafale, bloque le raid (kick/ban), âge minimum du compte |
| `/raidmode` | Active / coupe à la main le mode raid |
| `/antispam` | Flood, messages répétés, mentions en masse (suppression + mute) |
| `/antilink` | Invitations Discord ou tous les liens, liste de domaines autorisés |
| `/bypass` | Exceptions (rôles, salons, membres) |
| `/protection` | Vue d'ensemble |

Les admins et les modérateurs (Gérer les messages) ne sont jamais filtrés. Pour tester, utilise un compte sans ces permissions.

## Autres commandes
`/help` liste tout. Configuration rapide : `/setup logs`, `/setup bienvenue`, `/setup autorole`, `/setup tickets`.
Ajouter une commande : crée un fichier dans `commands/<catégorie>/` sur le modèle de `ping.js`.
