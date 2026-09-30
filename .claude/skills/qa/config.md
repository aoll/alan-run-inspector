# Config QA

Faits stables de la skill `qa`. Aucun secret ici. Si un fait ne correspond plus au code, le code gagne : corrige ce fichier hors passe.

## Environnement (`env=local`)

```bash
node .claude/hooks/session-start.mjs          # Postgres
grep DATABASE_URL .env.local                    # la base du checkout
pnpm db:migrate && pnpm db:seed                 # migrée et seedée (le seed est idempotent)

QA=<scratchpad>/qa/<YYYY-MM-DD>-<scénario> && mkdir -p "$QA" && export QA

# Serveur de dev : port 3000 dans le checkout principal, un port libre (3200) dans un worktree.
# `.env.local` pose déjà AI_MODE=mock et INFRA_MODE=local ; BETTER_AUTH_URL doit viser le port utilisé.
fuser 3200/tcp && echo "port 3200 pris : choisis-en un autre"
BETTER_AUTH_URL=http://localhost:3200 \
  setsid sh -c 'echo $$ > "$QA/dev.pgid"; exec pnpm dev -p 3200' > "$QA/dev.log" 2>&1 &

# Attente : sort seule (200, ou échec après ~2 min). Le premier rendu compile (5 à 15 s).
curl -s -o /dev/null -w '%{http_code}\n' --retry 60 --retry-delay 2 \
  --retry-connrefused --retry-all-errors --max-time 120 http://localhost:3200/

# Arrêt, en fin de passe
kill -TERM -- -"$(cat "$QA/dev.pgid")"
fuser 3200/tcp || echo "port libéré"   # encore pris : kill -KILL -- -<pgid>
```

Jamais de `until`/`while pgrep -f …`. `fuser <port>/tcp` dit si un port est pris (`lsof` ne voit pas les sockets ici). Les ports 3100+ sont ceux des E2E (`E2E_PORT`) : ne les utilise pas.

La file de queue locale (`INFRA_MODE=local`) est consommée dans le serveur de dev : une tâche de fond démarre sans service externe.

## Playwright (repli et méthode par défaut)

```js
import { createRequire } from "node:module";
const require = createRequire("/chemin/du/checkout/package.json");
const { chromium } = require("@playwright/test"); // pas "playwright-core" : pnpm ne le hisse pas
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const context = await browser.newContext({ locale: "en", viewport: { width: 1280, height: 800 } }); // un contexte par persona et par locale
const page = await context.newPage();
page.on("console", (m) => m.type() === "error" && console.log("console:", m.text()));
page.on("pageerror", (e) => console.log("pageerror:", e.message));
page.on("response", (r) => r.request().method() !== "GET" && console.log(r.status(), r.request().method(), r.url()));
```

Un contexte par locale : la négociation `Accept-Language` change la locale d'arrivée. Mobile : `viewport: { width: 390, height: 844 }`. Sombre : `colorScheme: "dark"`.

## `/_next/mcp` en HTTP (si le MCP `next-devtools` n'est pas branché)

```bash
mcp() { curl -s --max-time 30 -X POST "http://localhost:3200/_next/mcp" \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"$1\",\"arguments\":{}}}" \
  | sed -n 's/^data: //p'; }
mcp get_errors    # après chaque parcours ; aussi get_logs, get_routes
```

## Environnements déployés (`env=preview|prod`)

Pas de serveur ni de base à gérer. Le proxy sortant du conteneur re-termine le TLS avec sa propre CA : épingle son hash SPKI, recalculé à chaque passe (jamais `ignoreHTTPSErrors`) :

```bash
SPKI=$(openssl x509 -in /root/.ccr/agent-proxy-ca.crt -pubkey -noout \
  | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64)
```

```js
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  proxy: { server: process.env.HTTPS_PROXY },
  args: [`--ignore-certificate-errors-spki-list=${process.env.SPKI}`],
});
```

`AI_MODE=live` y appelle un vrai modèle (tokens réels) : ne déclenche l'IA que pour les parcours qui la demandent.
