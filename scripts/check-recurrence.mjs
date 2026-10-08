// Checks the site's date engine (src/lib/recurrence.ts) against dates the
// bot's recurrence.py produced with python-dateutil. If they disagree, the
// Telegram draft and the website would list different dates for a series.
//
//   node scripts/check-recurrence.mjs
//
// To refresh the expected dates after changing the bot, regenerate
// scripts/recurrence-golden.json from recurrence.occurrences() in the bot repo.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = (f) => fs.readFileSync(path.join(here, "..", "src", "lib", f), "utf8");
const out = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || process.env.TEMP || "/tmp"), "rec-"));
for (const f of ["recurrence.ts", "hijri.ts"]) {
  const js = ts.transpileModule(src(f), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText.replace(/from "\.\/hijri"/g, 'from "./hijri.mjs"');
  fs.writeFileSync(path.join(out, f.replace(".ts", ".mjs")), js);
}
const rec = await import(pathToFileURL(path.join(out, "recurrence.mjs")).href);

const cases = JSON.parse(fs.readFileSync(path.join(here, "recurrence-golden.json"), "utf8"));
let failed = 0, dates = 0;
for (const c of cases) {
  const got = rec.occurrenceInstants(c.start, c.rule);
  const want = c.expect.map((s) => new Date(s).getTime());
  dates += want.length;
  const same = got.length === want.length && got.every((t, i) => t === want[i]);
  if (!same) {
    failed++;
    let first = got.findIndex((t, i) => t !== want[i]);
    if (first === -1) first = Math.min(got.length, want.length);
    const show = (t) => (t === undefined ? "(none)" : new Date(t).toISOString());
    console.log(`FAIL ${c.rule ?? "(one-off)"} from ${c.start}: ${got.length} dates vs ${want.length}; ` +
      `first difference at #${first}: site ${show(got[first])} bot ${show(want[first])}`);
  }
}
console.log(failed ? `${failed} of ${cases.length} cases differ` : `all ${cases.length} cases match (${dates} dates)`);
process.exit(failed ? 1 : 0);
