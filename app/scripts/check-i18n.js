// Compare i18n keys between vi and en
const fs = require("fs");
const path = require("path");

const localeDir = path.join(__dirname, "src/i18n/locales");
const vi = JSON.parse(fs.readFileSync(path.join(localeDir, "vi.json"), "utf8"));
const en = JSON.parse(fs.readFileSync(path.join(localeDir, "en.json"), "utf8"));

const flat = (obj, prefix = "") => {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? prefix + "." + k : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flat(v, key));
    } else {
      out[key] = typeof v;
    }
  }
  return out;
};

const a = flat(vi);
const b = flat(en);

const missingInEn = Object.keys(a).filter((k) => !(k in b));
const missingInVi = Object.keys(b).filter((k) => !(k in a));
const typeMismatch = [];
for (const k of Object.keys(a)) {
  if (k in b && a[k] !== b[k])
    typeMismatch.push(`${k} (vi=${a[k]} en=${b[k]})`);
}

console.log("--- missing in en.json ---");
console.log(missingInEn.length ? missingInEn.join("\n") : "(none)");
console.log("\n--- missing in vi.json ---");
console.log(missingInVi.length ? missingInVi.join("\n") : "(none)");
console.log("\n--- type mismatch ---");
console.log(typeMismatch.length ? typeMismatch.join("\n") : "(none)");
console.log(
  `\ntotals: vi=${Object.keys(a).length} keys, en=${Object.keys(b).length} keys`,
);
