---
name: qa
description: Passe QA d'une demo forgée, en `local` (serveur de dev, base migrée et seedée, AI_MODE=mock) ou sur une URL déployée (`preview`/`prod`). Joue les parcours de docs/offer/spec.md dans un vrai navigateur, confronte l'app aux specs de features (critères d'acceptation) et consigne chaque écart en BUG ou MANQUE dans .claude/qa/reports/<date>-<scénario>.md. Constat seulement, aucune correction. À utiliser après un run d'orchestration, avant de livrer, ou avec /qa [env=local|preview|prod] [url=…] [scenario=…] [focus=…] [since=<ref>] [recheck=<rapport>].
---

# QA de la demo

Tu joues les utilisateurs de la demo sur la cible désignée par `env`, et tu compares ce que tu vois à ce que décrivent la spec globale et les specs de features. Tu ne corriges rien : tu constates, tu prouves, tu consignes. Les faits stables (ports, commandes, snippet Playwright, recette d'une URL déployée) sont dans `config.md`, à côté de ce fichier : lis-le avant de commencer.

## 0. Paramètres

- **`env`** : `local` (défaut), `preview` ou `prod`. Toute opération de la demo est permise sur les trois (c'est une démo, données fictives), avec les garde-fous de la section 5.
- **`url`** : obligatoire si `env=preview`, optionnel pour `prod`, ignoré en `local`.
- **`scenario`** : `full` (défaut) = tous les parcours de `docs/offer/spec.md › Journeys` plus les critères d'acceptation de chaque feature `done`. Ou le nom d'un fichier de `.claude/skills/qa/scenarios/` si le repo en fournit (facultatif, absent par défaut).
- **`focus`** : routes ou features (`F03`, `/runs`) qui limitent la passe. Ce qui est hors focus est `NON TESTÉ (hors focus)` dans le rapport, jamais omis en silence.
- **`since`** : une référence git (`main`, un SHA), `env=local` seulement. Les fichiers modifiés depuis cette référence (`git diff --name-status <since>...HEAD -- app lib messages fixtures proxy.ts`) sont testés en **profondeur** (variantes, états) ; le reste en **régression légère** (la route charge, l'action principale aboutit, pas d'erreur console ni serveur). Sans `since`, tout est en profondeur.
- **`recheck`** : chemin d'un rapport précédent ; chaque constat est rejoué d'après sa repro et reçoit un verdict (CORRIGÉ, TOUJOURS PRÉSENT, NON TESTÉ) dans une section « Recheck ».
- **`commit`** : `oui` (défaut) ou `non` (quand l'orchestrateur t'appelle et commite lui-même).

## 1. Lire le contexte d'abord, et en entier

La QA juge l'app contre les specs, pas contre ta mémoire ni contre le code.

1. `CLAUDE.md`, `README.md`, `docs/offer/spec.md` (parcours, données, pages, hors périmètre) en entier.
2. Chaque `docs/offer/features/F<nn>-*.md`, en entier, et `docs/offer/features/README.md` (statuts). Un point de « Hors périmètre » n'est ni un BUG ni un MANQUE.
3. `docs/offer/concept.md` s'il existe (le critère de réussite de la demo).

## 2. Atteindre la cible

`env=local` : suis `config.md › Environnement`. En résumé : Postgres relancé par le hook SessionStart (`node .claude/hooks/session-start.mjs`), base migrée puis seedée (`pnpm db:migrate && pnpm db:seed`), serveur de dev en arrière-plan dans son propre groupe de processus (journal dans le scratchpad), attente par `curl --retry`, arrêt du groupe à la fin (même si la passe échoue) et port vérifié libéré. Jamais de boucle `until pgrep -f` : elle se voit elle-même. Dans un worktree, un port libre et `BETTER_AUTH_URL` aligné dessus.

`env=preview|prod` : pas de serveur ni de base ; le proxy sortant re-termine le TLS, épingle son hash SPKI (`config.md › Environnements déployés`), repli Playwright obligatoire.

## 3. Outillage

- **Playwright** (`@playwright/test` du repo, Chromium préinstallé `/opt/pw-browsers/chromium`, jamais `playwright install`) : méthode par défaut ; scripts jetables dans le scratchpad, jamais commités.
- **`agent-browser`** et **MCP `next-devtools`** (si le repo les fournit) en `local` : erreurs de compilation et d'exécution, logs, routes. Repli : `curl` sur `/_next/mcp` (`config.md`). Après chaque parcours : erreurs du serveur de dev et journal.
- Note dans le rapport les outils réellement utilisés.

## 4. Personas

Déduis-les de `docs/offer/spec.md › Users and roles` : chacun est un parcours navigateur avec son contexte neuf. Le compte de démo se lit dans `scripts/seed.ts` (constantes de `lib/auth-demo.ts`) ; les autres comptes sont jetables, un par parcours (email unique). Toujours jouer aussi le **visiteur anonyme** : chaque route protégée l'envoie à la connexion, et l'API répond 401. N'écris jamais un vrai secret dans le rapport.

## 5. Garde-fous

- Comptes jetables, jamais de création en masse ; passe sous la limite de débit sauf pour la tester exprès.
- État restauré : ce que tu modifies sur des données seedées, remets-le en l'état ; sinon crée tes propres données pendant la passe.
- **Aucune correction de code**, même triviale.
- Captures et scripts dans le scratchpad (`<scratchpad>/qa/<date>-<scénario>/`), jamais dans le repo.
- Sur une URL déployée : opérations autorisées comme en local, mais chaque mutation est faite proprement (compte jetable, état restauré).

## 6. Dérouler

Pour chaque parcours et chaque critère d'acceptation :

1. **Trouve le vrai point d'entrée dans le code** (page, `_components/`, `_actions.ts`, libellé dans `messages/<locale>/*.json`) avant d'agir. Un libellé introuvable est un indice de MANQUE, pas une raison d'improviser.
2. **Agis comme la persona**, puis vérifie le résultat attendu et sa référence (spec globale, critère `F<nn>`).
3. **Capture le réseau** de chaque mutation (Server Action, route API) : statut et corps. Une mutation en 4xx/5xx est un échec serveur ; un 200 avec une UI figée est un problème d'affichage. Le rapport dit lequel.
4. **Console et erreurs de page**, erreurs et journal du serveur après chaque étape.
5. **Variantes** quand l'écran est touché : chaque locale (`en`, `fr`, sans préfixe pour la locale par défaut), largeur mobile (390 × 844), clair et sombre, états d'écran (vide, chargement, erreur, non autorisé, « introuvable » pour l'objet d'un autre utilisateur).
6. **Règles de sécurité de la spec** : lecture d'un objet d'un autre utilisateur (doit répondre « introuvable »), pas de route utilisable sans session hors connexion/inscription, limite de débit, DTO sans champ interne.
7. **Capture d'écran** de chaque écart, nommée `<n°>-<slug>.png`.

Une étape impossible (prérequis cassé, outil absent) : `NON TESTÉ` avec la raison, puis continue.

## 7. Le rapport

Écris `.claude/qa/reports/<YYYY-MM-DD>-<scénario>.md` (suffixe `-2`, `-3` si le fichier existe). Chaque constat est l'un de :

- **BUG** : implémenté, mais se comporte mal. Sévérité (**bloquant** : casse le script de démo ou perd des données ; **majeur** : un critère d'acceptation échoue, contournable ; **mineur** : cosmétique, libellé, état secondaire), étapes de repro exactes, attendu avec sa référence, observé, réponse réseau ou erreur console, chemin de la capture, fichier de la route.
- **MANQUE** : décrit par une spec mais absent ou incomplet. Référence, ce qui manque, où tu l'as cherché (chemins, `grep`).
- **À qualifier** : référence ambiguë, avec les deux lectures possibles.

Contenu : tableau d'environnement (env, URL, commit et branche, base, serveur et variables, outils, personas, focus, mode, recheck, artefacts), synthèse (décompte par catégorie et sévérité), tableau par étape (PASS / BUG / MANQUE / NON TESTÉ, raison, profondeur appliquée), constats détaillés, et avec `recheck` la section « Recheck ». Un rapport se modifie seulement pour ajouter le lien d'une correction.

Avec `commit=oui` : le rapport est commité seul (`docs(qa): add the <scénario> QA report of <date>`). Sur `main` ou sur la branche d'intégration (`git config forge.integration`), ne commite pas dessus : crée `qa/<date>-<scénario>` depuis elle et commite-y le rapport. Pousse seulement si le repo a un `origin` et que l'utilisateur l'a demandé.

Termine par le chemin du rapport et le décompte. La correction des constats est décidée par l'humain, pas ici.
