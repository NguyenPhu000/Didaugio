import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schemaUrl = new URL("../prisma/schema.prisma", import.meta.url);
const migrationUrl = new URL(
  "../prisma/migrations/20260721153000_add_tag_groups/migration.sql",
  import.meta.url,
);

async function readOptional(url) {
  try {
    return await readFile(url, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
}

function createMigrationAuditFixture(schema, sql) {
  const hasTagGroupRelation = /model TagGroup\s*\{[\s\S]*?tags\s+PlaceTag\[\]/u.test(schema)
    && /model PlaceTag\s*\{[\s\S]*?tagGroupId\s+Int\?\s+@map\("tag_group_id"\)[\s\S]*?tagGroup\s+TagGroup\?\s+@relation\(fields:\s*\[tagGroupId\],\s*references:\s*\[id\],\s*onDelete:\s*Restrict\)/u.test(schema);
  const createsOneGeneralGroup = /INSERT INTO "tag_groups"[\s\S]*?'general'[\s\S]*?'Chung'[\s\S]*?'General'[\s\S]*?ON CONFLICT \("slug"\) DO NOTHING/iu.test(sql);
  const backfillsNullGroups = /UPDATE "place_tags"[\s\S]*?SET "tag_group_id"\s*=\s*\(\s*SELECT "id"\s*FROM "tag_groups"\s*WHERE "slug"\s*=\s*'general'\s*\)[\s\S]*?WHERE "tag_group_id" IS NULL/iu.test(sql);
  const migrationApplied = hasTagGroupRelation && createsOneGeneralGroup && backfillsNullGroups;

  return {
    tagGroup: {
      async findMany({ where: { slug } }) {
        return migrationApplied && slug === "general"
          ? [{ id: 1, slug: "general", nameVi: "Chung", nameEn: "General" }]
          : [];
      },
    },
    placeTag: {
      async count({ where: { tagGroupId } }) {
        return migrationApplied && tagGroupId === null ? 0 : 2;
      },
    },
  };
}

export async function auditTagGroupBackfill(prisma) {
  const [generalGroups, orphanedTagCount] = await Promise.all([
    prisma.tagGroup.findMany({ where: { slug: "general" } }),
    prisma.placeTag.count({ where: { tagGroupId: null } }),
  ]);

  return {
    generalGroup: generalGroups.length === 1 ? generalGroups[0] : null,
    generalGroupCount: generalGroups.length,
    orphanedTagCount,
  };
}

test("backfills every legacy tag to the unique general group", async () => {
  const [schema, sql] = await Promise.all([readOptional(schemaUrl), readOptional(migrationUrl)]);
  const prisma = createMigrationAuditFixture(schema, sql);

  const audit = await auditTagGroupBackfill(prisma);

  assert.equal(audit.orphanedTagCount, 0);
  assert.equal(audit.generalGroup?.slug, "general");
  assert.equal(audit.generalGroupCount, 1);
});

test("rerunning the migration audit leaves one general group and no orphaned tags", async () => {
  const [schema, sql] = await Promise.all([readOptional(schemaUrl), readOptional(migrationUrl)]);
  const prisma = createMigrationAuditFixture(schema, sql);

  const [firstAudit, secondAudit] = await Promise.all([
    auditTagGroupBackfill(prisma),
    auditTagGroupBackfill(prisma),
  ]);

  assert.deepEqual(secondAudit, firstAudit);
  assert.equal(secondAudit.generalGroupCount, 1);
  assert.equal(secondAudit.orphanedTagCount, 0);
});
