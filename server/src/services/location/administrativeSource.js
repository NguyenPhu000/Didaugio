import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { normalizeSourceDataset } from "./administrativeDataset.domain.js";

const sha256File = (filePath) =>
  new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });

export const loadAdministrativeManifest = async (manifestPath) => {
  const raw = await readFile(manifestPath, "utf8");
  return {
    manifest: JSON.parse(raw),
    manifestChecksum: createHash("sha256").update(raw).digest("hex"),
  };
};

export const verifyAdministrativeArtifacts = async ({ manifest, sourceDir }) => {
  const verified = [];
  for (const artifact of manifest.artifacts) {
    const artifactPath = path.resolve(sourceDir, artifact.path);
    const metadata = await stat(artifactPath);
    if (artifact.bytes != null && metadata.size !== artifact.bytes) {
      throw new Error(
        `Artifact size mismatch for ${artifact.path}: expected ${artifact.bytes}, received ${metadata.size}`,
      );
    }
    const checksum = await sha256File(artifactPath);
    if (checksum.toLowerCase() !== artifact.sha256.toLowerCase()) {
      throw new Error(`Artifact checksum mismatch for ${artifact.path}`);
    }
    verified.push({ ...artifact, absolutePath: artifactPath, bytes: metadata.size });
  }
  return verified;
};

const countTypes = (wards) =>
  wards.reduce((counts, ward) => {
    counts[ward.administrativeType] = (counts[ward.administrativeType] ?? 0) + 1;
    return counts;
  }, {});

export const loadAndValidateAdministrativeSource = async ({ manifest, sourceDir }) => {
  const sourceArtifact = manifest.artifacts.find(
    (artifact) => artifact.purpose === "canonical administrative source",
  );
  if (!sourceArtifact) throw new Error("Manifest has no canonical administrative source");

  const rawProvinces = JSON.parse(
    await readFile(path.resolve(sourceDir, sourceArtifact.path), "utf8"),
  );
  const dataset = normalizeSourceDataset(rawProvinces);
  const typeCounts = countTypes(dataset.wards);

  if (dataset.provinces.length !== manifest.expected.provinceCount) {
    throw new Error(`Expected ${manifest.expected.provinceCount} provinces, received ${dataset.provinces.length}`);
  }
  if (dataset.wards.length !== manifest.expected.wardCount) {
    throw new Error(`Expected ${manifest.expected.wardCount} wards, received ${dataset.wards.length}`);
  }
  for (const [type, expected] of Object.entries(manifest.expected.wardTypeCounts)) {
    if ((typeCounts[type] ?? 0) !== expected) {
      throw new Error(`Expected ${expected} ${type} records, received ${typeCounts[type] ?? 0}`);
    }
  }

  return { rawProvinces, dataset, typeCounts };
};
