import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const assetsDirectory = path.resolve("dist", "assets");
const budgets = [
  { label: "web entry", pattern: /^index-.*\.js$/, maxBytes: 600_000 },
  { label: "map chunk", pattern: /^map-.*\.js$/, maxBytes: 850_000 },
];

const assetNames = await readdir(assetsDirectory);
const failures = [];

for (const budget of budgets) {
  const assetName = assetNames.find((name) => budget.pattern.test(name));
  if (!assetName) {
    failures.push(`${budget.label}: no matching asset in ${assetsDirectory}`);
    continue;
  }

  const assetPath = path.join(assetsDirectory, assetName);
  const { size } = await stat(assetPath);
  const sizeInKb = (size / 1024).toFixed(1);
  const limitInKb = (budget.maxBytes / 1024).toFixed(1);
  console.log(`${budget.label}: ${assetName} ${sizeInKb} KB / ${limitInKb} KB`);

  if (size > budget.maxBytes) {
    failures.push(
      `${budget.label} exceeds ${limitInKb} KB: ${assetName} is ${sizeInKb} KB`,
    );
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
