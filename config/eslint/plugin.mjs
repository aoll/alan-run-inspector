// Local ESLint rules enforcing the career-hub conventions (docs/ROADMAP.md).

const TEXT_ATTRIBUTES = new Set(["alt", "title", "placeholder", "aria-label", "aria-description", "label"]);
const HAS_LETTER = /\p{L}/u;

/** i18n: no hardcoded user-facing text in JSX. Everything goes through the messages. */
const noHardcodedText = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      text: "Hardcoded text in JSX: use the messages (messages/<locale>/<zone>.json).",
      attribute: 'Hardcoded text in the "{{name}}" attribute: use the messages.',
    },
  },
  create(context) {
    return {
      JSXText(node) {
        if (HAS_LETTER.test(node.value)) context.report({ node, messageId: "text" });
      },
      JSXAttribute(node) {
        const name = node.name.type === "JSXIdentifier" ? node.name.name : undefined;
        if (!name || !TEXT_ATTRIBUTES.has(name)) return;
        const value = node.value;
        if (value?.type === "Literal" && typeof value.value === "string" && HAS_LETTER.test(value.value)) {
          context.report({ node, messageId: "attribute", data: { name } });
        }
      },
    };
  },
};

/** DAL and services are server code: their first statement must be `import "server-only"`. */
const requireServerOnly = {
  meta: {
    type: "problem",
    schema: [],
    messages: { missing: 'Server module: add `import "server-only";` as the first statement.' },
  },
  create(context) {
    return {
      Program(node) {
        const first = node.body[0];
        const ok = first?.type === "ImportDeclaration" && first.source.value === "server-only";
        if (!ok) context.report({ node: first ?? node, messageId: "missing" });
      },
    };
  },
};

const SERVER_ONLY_PATH = /(^|\/)lib\/(dal|services|db|env|auth)(\/|$)|(^|\/)lib\/(env|auth)(\.|$)/;

/** A "use client" module must never import the DAL, the services, the database, `env` or the auth server. */
const noServerImportInClient = {
  meta: {
    type: "problem",
    schema: [],
    messages: { forbidden: 'A "use client" module cannot import "{{source}}" (server code).' },
  },
  create(context) {
    let isClient = false;
    return {
      Program(node) {
        isClient = node.body.some((n) => n.type === "ExpressionStatement" && n.directive === "use client");
      },
      ImportDeclaration(node) {
        if (!isClient || node.importKind === "type") return;
        const source = String(node.source.value);
        if (SERVER_ONLY_PATH.test(source)) context.report({ node, messageId: "forbidden", data: { source } });
      },
    };
  },
};

const plugin = {
  meta: { name: "career-hub" },
  rules: {
    "no-hardcoded-text": noHardcodedText,
    "require-server-only": requireServerOnly,
    "no-server-import-in-client": noServerImportInClient,
  },
};

export default plugin;
