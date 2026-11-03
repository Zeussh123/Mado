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

## Tester sur son ordinateur
Créer `.dev.vars` avec `ADMIN_PASSWORD=motdepasse`, puis `npx wrangler dev`.
