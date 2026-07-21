import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import prisma from "../src/config/prismaClient.js";
import {
  createTag,
  bulkCreateTags,
  getAllTags,
  getTagById,
  getTagBySlug,
  getPopularTags,
  updateTag,
} from "../src/services/tag/tag.service.js";
import {
  createTagSchema,
  updateTagSchema,
} from "../src/models/schemas/tag/tag.schema.js";

const originalPlaceTag = prisma.placeTag;
const originalTagGroup = prisma.tagGroup;
const originalTransaction = prisma.$transaction;

afterEach(() => {
  prisma.placeTag = originalPlaceTag;
  prisma.tagGroup = originalTagGroup;
  prisma.$transaction = originalTransaction;
});

function installTagStore(groups) {
  const tags = [
    {
      id: 1,
      name: "Tag cũ",
      slug: "tag-cu",
      tagType: "feature",
      tagGroupId: null,
      isActive: true,
      usageCount: 2,
    },
  ];
  const calls = { create: [], findMany: [], findUnique: [] };

  prisma.tagGroup = {
    findFirst: async ({ where }) =>
      groups.find((group) => group.id === where.id && group.isActive === where.isActive) ?? null,
  };

  prisma.placeTag = {
    findUnique: async ({ where, include, select }) => {
      calls.findUnique.push({ where, include, select });
      const tag = tags.find((candidate) =>
        where.id !== undefined ? candidate.id === where.id : candidate.slug === where.slug,
      );
      if (!tag) return null;
      if (select) return { slug: tag.slug };
      return include?.tagGroup ? { ...tag, tagGroup: groups.find((group) => group.id === tag.tagGroupId) ?? null } : tag;
    },
    findMany: async (args) => {
      calls.findMany.push(args);
      return tags.map((tag) =>
        args.include?.tagGroup
          ? { ...tag, tagGroup: groups.find((group) => group.id === tag.tagGroupId) ?? null }
          : tag,
      );
    },
    create: async ({ data, include }) => {
      calls.create.push({ data, include });
      const tag = { id: tags.length + 1, ...data };
      tags.push(tag);
      return include?.tagGroup
        ? { ...tag, tagGroup: groups.find((group) => group.id === tag.tagGroupId) ?? null }
        : tag;
    },
    update: async ({ where, data, include }) => {
      const tag = tags.find((candidate) => candidate.id === where.id);
      Object.assign(tag, data);
      return include?.tagGroup
        ? { ...tag, tagGroup: groups.find((group) => group.id === tag.tagGroupId) ?? null }
        : tag;
    },
  };

  prisma.$transaction = async (operations) => Promise.all(operations);

  return calls;
}

test("creates a tag with an active group and legacy general type", async () => {
  const activeGroup = { id: 10, slug: "moods", isActive: true };
  installTagStore([activeGroup]);

  const tag = await createTag({
    name: "Yên tĩnh",
    slug: "yen-tinh",
    tagGroupId: activeGroup.id,
    tagType: "feature",
  });

  assert.equal(tag.tagGroupId, activeGroup.id);
  assert.equal(tag.tagType, "general");
  assert.deepEqual(tag.tagGroup, activeGroup);
});

test("rejects assigning an inactive group", async () => {
  const inactiveGroup = { id: 11, slug: "legacy", isActive: false };
  installTagStore([inactiveGroup]);

  await assert.rejects(
    createTag({ name: "X", slug: "x", tagGroupId: inactiveGroup.id }),
    (error) => error.statusCode === 400,
  );
});

test("moves a tag to an active group while retaining the legacy general type", async () => {
  const activeGroup = { id: 10, slug: "moods", isActive: true };
  installTagStore([activeGroup]);

  const tag = await updateTag(1, {
    tagGroupId: activeGroup.id,
    tagType: "feature",
  });

  assert.equal(tag.tagGroupId, activeGroup.id);
  assert.equal(tag.tagType, "general");
  assert.deepEqual(tag.tagGroup, activeGroup);
});

test("rejects moving a tag to an inactive group", async () => {
  const inactiveGroup = { id: 11, slug: "legacy", isActive: false };
  installTagStore([inactiveGroup]);

  await assert.rejects(
    updateTag(1, { tagGroupId: inactiveGroup.id }),
    (error) => error.statusCode === 400,
  );
});

test("bulk creates tags only with active groups and legacy general types", async () => {
  const activeGroup = { id: 10, slug: "moods", isActive: true };
  installTagStore([activeGroup]);

  const [tag] = await bulkCreateTags([
    {
      name: "Yên tĩnh",
      slug: "yen-tinh",
      tagGroupId: activeGroup.id,
      tagType: "feature",
    },
  ]);

  assert.equal(tag.tagGroupId, activeGroup.id);
  assert.equal(tag.tagType, "general");
  assert.deepEqual(tag.tagGroup, activeGroup);
});

test("bulk rejects inactive groups before creating any tags", async () => {
  const activeGroup = { id: 10, slug: "moods", isActive: true };
  const inactiveGroup = { id: 11, slug: "legacy", isActive: false };
  const calls = installTagStore([activeGroup, inactiveGroup]);

  await assert.rejects(
    bulkCreateTags([
      { name: "A", slug: "a", tagGroupId: activeGroup.id },
      { name: "B", slug: "b", tagGroupId: inactiveGroup.id },
    ]),
    (error) => error.statusCode === 400,
  );

  assert.equal(calls.create.length, 0);
});

test("returns tag-group data on tag queries while legacy tags remain readable", async () => {
  const calls = installTagStore([]);

  const [legacyTag] = await getAllTags();
  const tagById = await getTagById(1);
  const tagBySlug = await getTagBySlug("tag-cu");
  const [popularTag] = await getPopularTags();

  assert.equal(legacyTag.tagGroup, null);
  assert.equal(tagById.tagGroup, null);
  assert.equal(tagBySlug.tagGroup, null);
  assert.equal(popularTag.tagGroup, null);
  assert.equal(calls.findMany.every((call) => call.include.tagGroup === true), true);
  assert.equal(calls.findUnique.every((call) => call.include.tagGroup === true), true);
});

test("accepts tagGroupId instead of tagType in create and update payloads", () => {
  assert.deepEqual(
    createTagSchema.parse({ name: "Yên tĩnh", slug: "yen-tinh", tagGroupId: 10 }),
    { name: "Yên tĩnh", slug: "yen-tinh", tagGroupId: 10 },
  );
  assert.deepEqual(
    updateTagSchema.parse({ tagGroupId: 10, tagType: "feature" }),
    { tagGroupId: 10 },
  );
  assert.deepEqual(
    createTagSchema.parse({
      name: "Yên tĩnh",
      slug: "yen-tinh",
      tagGroupId: 10,
      tagType: "feature",
    }),
    { name: "Yên tĩnh", slug: "yen-tinh", tagGroupId: 10 },
  );
});
