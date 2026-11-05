// Bundles what the runtime image needs besides the Next.js server, since it has no tsx, no
// sources and no Prisma CLI: dist/migrate.mjs, the migrate job (scripts/migrate.ts,
// lib/migrate.ts). Syntax minification keeps the output line-structured.
import { build } from "esbuild";

await build({
  entryPoints: { migrate: "scripts/migrate.ts" },
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  bundle: true,
  minifySyntax: true,
  platform: "node",
  target: "node24",
  format: "esm",
  tsconfig: "tsconfig.json",
  external: ["pg-native", "pg-cloudflare"],
  // Bundled CommonJS dependencies (pg) expect these.
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      "import { fileURLToPath as __fileURLToPath } from 'node:url';",
      "import { dirname as __pathDirname } from 'node:path';",
      "const require = __createRequire(import.meta.url);",
      "const __filename = __fileURLToPath(import.meta.url);",
      "const __dirname = __pathDirname(__filename);",
    ].join("\n"),
  },
  legalComments: "none",
  logLevel: "info",
});
