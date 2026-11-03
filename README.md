# Site Mado (menu digital + espace gérant)

- **Site client** : `/` → choix de la langue (FR / EN / TR / DE), puis le menu.
  Lien direct possible : `/?lang=fr`, `/?lang=en`, `/?lang=tr`, `/?lang=de`.
- **Espace gérant** : `/admin` (protégé par mot de passe) → prix, photos, produits visibles ou retirés,
  ajout/suppression, catégories, promos par jour et heure, infos du restaurant, QR code à imprimer.

## Comment ça marche
- Hébergement : un Worker Cloudflare (`src/worker.js`) qui sert les pages de `public/`.
- Le menu et les photos sont stockés dans un espace KV Cloudflare (`MADO`). Gratuit, pas de carte bancaire.
- Au tout premier lancement, le menu de départ est `public/menu.json`. Dès le premier « Enregistrer »
  dans l'admin, c'est la version enregistrée qui fait foi (la précédente est gardée dans `menu-backup`).
- Les promos utilisent l'heure de Paris.

## Mise en ligne (une seule fois, via GitHub)
1. Tableau de bord Cloudflare → Workers & Pages → Créer → Importer un dépôt Git → choisir ce dépôt.
   Commande de déploiement : `npx wrangler deploy` (proposée par défaut). L'espace KV `MADO` est créé tout seul.
2. Une fois déployé : Workers → mado → Paramètres → Variables et secrets → ajouter un **secret**
   `ADMIN_PASSWORD` = le mot de passe de l'espace gérant.
3. Workers → mado → Paramètres → Domaines et routes → ajouter le domaine (ex. `menu.mon-domaine.fr`).
   Le QR code doit pointer vers ce domaine, pas vers l'adresse `workers.dev`.

Ensuite, chaque modification poussée sur GitHub est mise en ligne automatiquement.
Les prix, photos et promos se changent depuis `/admin`, sans toucher au code.

## Commandes à table et impression
- Admin → Infos du restaurant : cocher « Accepter les commandes » et indiquer le nombre de tables.
- Admin → QR code : « Imprimer les QR codes des tables » (un QR par table, adresse `/?t=N`).
- Sur l'ordinateur relié à l'imprimante ticket (ZJ-8250, 80 mm) : ouvrir `/cuisine`, se connecter, toucher « Démarrer ».
- La page `/cuisine` a 4 onglets : Commandes en cours (alerte qui sonne tant que la commande n'est pas vue), Plan des tables (libre / en préparation / prête / à encaisser, addition, « Encaissée »), Historique (par jour : chiffre, produits les plus vendus, rapport imprimable) et Réglages (son, volume, rappel, voix, impression auto, nombre de tickets ; enregistrés sur ce PC).
- Prise de commande serveur : `/serveur`, code à 4-8 chiffres réglé dans l'admin (Infos du restaurant). Le serveur choisit la table ou « À emporter », sans choix de langue ni propositions.
- Panier commun : tous les téléphones d'une même table (QR ?t=N) remplissent le même panier (table D1 `table_baskets`), une personne envoie, un seul ticket. Rappel après 1 min sans ajout. Le panier est vidé quand la table est encaissée.
- Anti-commandes fantômes : chaque QR de table contient un code secret (`?t=N&k=…`, KV `table-keys`, « Changer le code » dans l'onglet QR). Horaires de commande par jour (onglet Infos, `ordering.useSchedule` + `schedule`).
- Impression sans fenêtre : lancer Chrome avec l'option `--kiosk-printing` et mettre l'imprimante ticket par défaut.
- Les commandes sont stockées dans la base D1 `mado-commandes` (créée automatiquement au déploiement).

## Tester sur son ordinateur
Créer `.dev.vars` avec `ADMIN_PASSWORD=motdepasse`, puis `npx wrangler dev`.
