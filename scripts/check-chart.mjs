// `pnpm check:chart`: lints the Helm chart, renders it for dev and prod with safe test values,
// and checks the manifests: one image for web and migrate, the 1Password item → Sync-hook
// migrate job → Deployment order, probes, read-only root filesystems with a /tmp, runtime
// APP_URL and purchase links, no default 1Password item, and no secret value in any manifest.
// Needs `helm` on the PATH. Nothing is applied to any cluster. Pattern: 1422labs/llmgw.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { parseAllDocuments } from "yaml";

const helm = (...args) => execFileSync("helm", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const sets = (values) => Object.entries(values).flatMap(([key, value]) => ["--set", `${key}=${value}`]);

process.stdout.write(helm("lint", "chart", "--strict", ...sets({ "onepassword.itemPath": "vaults/kube/items/lint" })));

const render = (values) =>
  parseAllDocuments(helm("template", "seobasics", "chart", ...sets(values)))
    .map((document) => document.toJS())
    .filter(Boolean);

const dev = { host: "dev.seobasics.app", "image.tag": "sha-abc123", "onepassword.itemPath": "vaults/kube/items/seobasics-dev" };
const prod = {
  host: "seobasics.app",
  "image.tag": "sha-abc123",
  "onepassword.itemPath": "vaults/kube/items/seobasics-prod",
  "ingress.redirectWww": "true",
  "purchase.checkoutUrl": "https://checkout.example.com/x",
  "purchase.appStoreUrl": "https://apps.apple.com/app/id0",
};

for (const [name, values] of [["dev", dev], ["prod", prod]]) {
  const docs = render(values);
  const one = (kind, suffix = "") => {
    const found = docs.filter((doc) => doc.kind === kind && doc.metadata.name.endsWith(suffix));
    assert.equal(found.length, 1, `${name}: exactly one ${kind}${suffix ? ` ending in ${suffix}` : ""}`);
    return found[0];
  };
  const container = (workload) => workload.spec.template.spec.containers[0];
  const wave = (doc) => Number(doc.metadata.annotations?.["argocd.argoproj.io/sync-wave"] ?? 0);

  const web = one("Deployment");
  assert.equal(container(web).image, "registry.hilars.dev/seobasics/app:sha-abc123");
  assert.deepEqual(container(web).command, ["node", "server.js"]);
  assert.deepEqual(container(web).envFrom, [{ secretRef: { name: "seobasics" } }]);
  const env = Object.fromEntries(container(web).env.map((entry) => [entry.name, entry.value]));
  const expectedEnv = { APP_URL: `https://${values.host}`, HOSTNAME: "0.0.0.0" };
  if (values["purchase.checkoutUrl"]) expectedEnv.CHECKOUT_URL = values["purchase.checkoutUrl"];
  if (values["purchase.appStoreUrl"]) expectedEnv.APP_STORE_URL = values["purchase.appStoreUrl"];
  assert.deepEqual(env, expectedEnv, `${name}: web env`);
  for (const probe of ["livenessProbe", "readinessProbe"]) assert.equal(container(web)[probe].httpGet.path, "/healthz");
  const annotations = web.spec.template.metadata.annotations;
  assert.equal(annotations["operator.1password.io/auto-restart"], "true");
  assert.equal(annotations["operator.1password.io/item-path"], values["onepassword.itemPath"]);

  // Order on every sync: OnePasswordItem (-20) → migrate Job (Sync hook, -10) → Deployment (0).
  const item = one("OnePasswordItem");
  assert.equal(item.spec.itemPath, values["onepassword.itemPath"]);
  assert.equal(item.metadata.annotations["argocd.argoproj.io/hook"], undefined, "the item is not a hook");
  const migrate = one("Job", "-migrate");
  assert.equal(migrate.metadata.annotations["argocd.argoproj.io/hook"], "Sync", "Sync, never PreSync");
  assert.equal(migrate.metadata.annotations["argocd.argoproj.io/hook-delete-policy"], "BeforeHookCreation");
  assert.ok(wave(item) < wave(migrate) && wave(migrate) < wave(web), `${name}: wave order item < migrate < web`);
  assert.deepEqual(container(migrate).command, ["node", "dist/migrate.mjs"]);
  assert.equal(container(migrate).image, container(web).image);
  assert.deepEqual(container(migrate).envFrom, container(web).envFrom);
  assert.equal(migrate.spec.backoffLimit, 3);
  assert.equal(migrate.spec.activeDeadlineSeconds, 600);

  for (const workload of [web, migrate]) {
    const pod = workload.spec.template.spec;
    assert.equal(pod.securityContext.runAsNonRoot, true);
    assert.equal(pod.securityContext.runAsUser, 1001);
    assert.equal(container(workload).securityContext.allowPrivilegeEscalation, false);
    assert.equal(container(workload).securityContext.readOnlyRootFilesystem, true);
    assert.deepEqual(container(workload).securityContext.capabilities, { drop: ["ALL"] });
    assert.deepEqual(container(workload).volumeMounts, [{ name: "tmp", mountPath: "/tmp" }]);
    assert.deepEqual(pod.dnsConfig.options, [{ name: "ndots", value: "1" }]);
  }

  const service = one("Service");
  assert.deepEqual(service.spec.selector, web.spec.selector.matchLabels);
  const ingress = one("Ingress");
  assert.equal(ingress.spec.ingressClassName, "nginx");
  assert.equal(ingress.metadata.annotations["cert-manager.io/cluster-issuer"], "letsencrypt-prod");
  assert.equal(ingress.spec.rules[0].host, values.host);
  assert.equal(ingress.spec.rules[0].http.paths[0].backend.service.name, service.metadata.name);
  const www = values["ingress.redirectWww"] === "true";
  assert.equal(ingress.metadata.annotations["nginx.ingress.kubernetes.io/from-to-www-redirect"], www ? "true" : undefined);
  assert.deepEqual(ingress.spec.tls[0].hosts, www ? [values.host, `www.${values.host}`] : [values.host]);

  // No secret value in any manifest: secrets only ever come from the 1Password item.
  const text = JSON.stringify(docs);
  assert.doesNotMatch(text, /LICENSE_SIGNING_KEY|PRIVATE KEY|DATABASE_URL|postgres(ql)?:\/\/|sk_(live|test)_|whsec_|SEOB-[0-9A-Z]{5}/, `${name}: no secrets`);
  assert.equal(docs.some((doc) => ["Secret", "ConfigMap", "PersistentVolumeClaim"].includes(doc.kind)), false);
  console.log(`OK (${name}): ${docs.length} resources: ${docs.map((doc) => doc.kind).join(", ")}`);
}

// Every release must name its own 1Password item: there is no shared default.
assert.throws(() => render({ host: "dev.seobasics.app" }), /onepassword.itemPath is required/);
// Without a host there is no Ingress.
assert.equal(render({ "onepassword.itemPath": "vaults/kube/items/x" }).some((doc) => doc.kind === "Ingress"), false);
console.log("OK: no default 1Password item; no host renders no Ingress");
