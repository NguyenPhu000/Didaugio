const fs = require("fs");
const files = [
  "d:/didaugio/app/src/i18n/locales/vi.json",
  "d:/didaugio/app/src/i18n/locales/en.json",
];
for (const f of files) {
  try {
    JSON.parse(fs.readFileSync(f, "utf8"));
    console.log(f + ": OK");
  } catch (e) {
    console.log(f + " ERROR: " + e.message);
  }
}
