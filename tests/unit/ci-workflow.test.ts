import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parse } from "yaml";

type Job = { "runs-on"?: string; needs?: string[]; if?: string; steps?: { run?: string; env?: Record<string, string> }[] };
const workflow = parse(readFileSync(".github/workflows/ci.yml", "utf8")) as { jobs: Record<string, Job> };
const gate = workflow.jobs["mandatory-checks"];

test("every job runs on arc-1422labs", () => {
  for (const [id, job] of Object.entries(workflow.jobs)) assert.equal(job["runs-on"], "arc-1422labs", id);
});

test("the gate always runs and needs every other job", () => {
  assert.equal(gate.if, "always()");
  const others = Object.keys(workflow.jobs).filter((id) => id !== "mandatory-checks").sort();
  assert.deepEqual([...(gate.needs ?? [])].sort(), others);
  assert.match(gate.steps?.[0].run ?? "", new RegExp(`length == ${others.length} and`));
});

test("the gate script passes only when every need succeeded", () => {
  const script = gate.steps?.[0].run ?? "";
  const run = (needs: Record<string, { result: string }>) => {
    try {
      execFileSync("bash", ["-c", script], { env: { ...process.env, NEEDS: JSON.stringify(needs) }, stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  };
  const ids = gate.needs ?? [];
  const all = (result: string) => Object.fromEntries(ids.map((id) => [id, { result }]));
  assert.equal(run(all("success")), true);
  for (const bad of ["failure", "cancelled", "skipped"]) {
    assert.equal(run({ ...all("success"), [ids[0]]: { result: bad } }), false, bad);
  }
  assert.equal(run({}), false, "empty");
  const { [ids[0]]: _dropped, ...missingOne } = all("success");
  void _dropped;
  assert.equal(run(missingOne), false, "a missing job");
});
