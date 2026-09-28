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

## Tickets
1. `/ticket-config role` (rôle staff) et `/ticket-config dossier` (catégorie Discord où créer les salons).
2. `/ticket-config ajouter` pour créer tes catégories (ex : RECRUTEMENT STAFF), `/ticket-config retirer` pour en supprimer.
3. `/ticket-config panneau` envoie le panneau : le membre choisit une catégorie, écrit son sujet, et son ticket s'ouvre avec le statut, l'assigné et le menu **Actions staff...**.

## Liste complète des commandes (98)

> Discord limite un bot à **100 commandes slash globales**. Il en reste 2 de disponibles.

### Général (7)
| Commande | Description |
|---|---|
| `/avatar` | Affiche l'avatar d'un membre |
| `/botinfo` | Afficher les informations du bot |
| `/help` | Affiche la liste des commandes |
| `/leaderboard` | Afficher le classement XP |
| `/ping` | Vérifie que le bot est en ligne |
| `/serverinfo` | Affiche les informations du serveur |
| `/userinfo` | Affiche les informations d'un membre |

### Modération (13)
| Commande | Description |
|---|---|
| `/ban` | Bannit un membre du serveur |
| `/clear` | Supprime des messages dans ce salon |
| `/clearwarns` | Supprime tous les avertissements d'un membre |
| `/kick` | Expulse un membre du serveur |
| `/lock` | Verrouille un salon : les membres ne peuvent plus écrire |
| `/mute` | Rend un membre muet pendant une durée |
| `/slowdown` | Active le mode lent dans un salon (0 pour le désactiver) |
| `/timeout` | Mettre un membre en timeout |
| `/unban` | Débannit un utilisateur grâce à son ID |
| `/unlock` | Déverrouille un salon |
| `/unmute` | Retire le mute d'un membre |
| `/warn` | Donne un avertissement à un membre |
| `/warnings` | Affiche les avertissements d'un membre |

### Protection (6)
| Commande | Description |
|---|---|
| `/antilink` | Configure l'anti-lien (invitations Discord ou tous les liens) |
| `/antiraid` | Configure l'anti-raid (arrivées en rafale, âge minimum des comptes) |
| `/antispam` | Configure l'anti-spam (flood, messages répétés, mentions en masse) |
| `/bypass` | Gère les exceptions de l'anti-spam et de l'anti-lien |
| `/protection` | Affiche l'état de toutes les protections du serveur |
| `/raidmode` | Active ou coupe manuellement le mode raid (les nouveaux arrivants sont bloqués) |

### Administration (58)
| Commande | Description |
|---|---|
| `/absence-config` | Declarer ou gerer les absences |
| `/automod` | Active automatiquement toutes les protections du serveur |
| `/avantage-vip` | Afficher les avantages VIP |
| `/avis` | Donner un avis ou configurer le systeme |
| `/avis-staff` | Donner un avis sur un membre du staff |
| `/backup` | Sauvegarder la configuration du serveur |
| `/cmd-config` | Gerer les commandes personnalisees |
| `/config` | Afficher la configuration du serveur |
| `/embed` | Envoyer un embed dans un salon |
| `/emojisetup` | Installer les emojis Holy RP |
| `/fermer-ticket` | Fermer le ticket de ce salon |
| `/forcer-service` | Forcer la fin de service d'un moderateur |
| `/formulaire` | Gerer les formulaires de candidatures |
| `/hierarchie-config` | Configurer le role hierarchique |
| `/holy-config` | Configurer les fonctions avancees de Holy RP |
| `/identite` | Afficher votre carte d'identite staff |
| `/info-config` | Publier un panneau d'information |
| `/invites` | Voir les invitations d'un membre |
| `/journal` | Configurer le journal automatique |
| `/lang` | Choisir la langue du bot |
| `/logs` | Configurer le systeme de logs |
| `/morpion` | Jouer au morpion contre un autre membre |
| `/msg-recurrent` | Configurer les messages recurrents |
| `/niveaux` | Configurer le systeme de niveaux |
| `/nombre-infini` | Voir le score du comptage |
| `/nombre-infini-config` | Configurer le jeu du comptage |
| `/perdu` | Jouer au perdu |
| `/pfc` | Pierre-Feuille-Ciseaux |
| `/profile-bot` | Configurer le profil du bot sur ce serveur |
| `/quiz` | Repondre a une question de culture generale |
| `/raid-config` | Configurer le systeme anti-raid |
| `/raid-lock` | Verrouiller le serveur en cas de raid |
| `/raid-unlock` | Deverrouiller le serveur |
| `/reglement` | Publier le reglement |
| `/role-humain` | Ajouter ou retirer un role en masse |
| `/role-reaction` | Publier un bouton de role |
| `/sanctions` | Consulter les sanctions d'un membre |
| `/say` | Faire envoyer un message texte par le bot |
| `/serverbanner` | Afficher la banniere du serveur |
| `/servericon` | Afficher la photo de profil du serveur |
| `/serveurs` | Liste des serveurs du bot |
| `/setup` | Configure le bot sur ce serveur |
| `/setup-service` | Configurer la prise de service |
| `/setup-tempvoice` | Configurer les salons vocaux temporaires |
| `/slowmode` | Definir le slowmode d'un salon |
| `/soutien` | Configurer le role de soutien |
| `/staff-bienvenue` | Configurer la bienvenue staff |
| `/staff-depart` | Configurer le depart staff |
| `/stats` | Statistiques du serveur |
| `/stats-channels` | Gerer les salons de statistiques |
| `/sumall` | Voir les heures de service |
| `/support` | Lien vers le serveur de support officiel |
| `/support-vocal` | Configurer le support vocal |
| `/ticket-config` | Configure le système de tickets (catégories, rôle support, panneau) |
| `/top` | Classement XP du serveur |
| `/topinvites` | Classement des invitations |
| `/tuto` | Guide de configuration |
| `/unwarn` | Retirer un avertissement |

### Tickets (1)
| Commande | Description |
|---|---|
| `/ticket` | Gère le ticket de ce salon |

### Communauté (2)
| Commande | Description |
|---|---|
| `/giveaway` | Organise des giveaways |
| `/suggest` | Envoyer une suggestion |

### Utilitaires (3)
| Commande | Description |
|---|---|
| `/define` | Cherche la définition d'un mot |
| `/poll` | Crée un sondage avec des réactions |
| `/timer` | Lance un minuteur : je te ping quand il est terminé |

### Fun (8)
| Commande | Description |
|---|---|
| `/8ball` | Pose une question à la boule magique |
| `/catfact` | Un fait intéressant sur les chats (en anglais) |
| `/dogpic` | Affiche la photo d'un chien au hasard |
| `/hug` | Fais un câlin à quelqu'un |
| `/joke` | Raconte une blague au hasard |
| `/kiss` | Envoie un bisou à quelqu'un |
| `/meme` | Affiche un meme au hasard |
| `/slap` | Mets une claque (pour rire) à quelqu'un |