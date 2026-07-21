import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import prisma from "../src/config/prismaClient.js";
import {
  createTagGroup,
  deleteTagGroup,
  getAllTagGroups,
  updateTagGroup,
} from "../src/services/tag/tagGroup.service.js";
import {
  createTagGroupSchema,
  updateTagGroupSchema,
} from "../src/models/index.js";

const originalTagGroup = prisma.tagGroup;
const originalPlaceTag = prisma.placeTag;
const FOOD = "\u1ea8m th\u1ef1c";
const FOOD_UPPER = "\u1ea8M TH\u1ef0C";

afterEach(() => {
  prisma.tagGroup = originalTagGroup;
  prisma.placeTag = originalPlaceTag;
});

function installTagGroupStore(groups = [], tagCounts = new Map()) {
  let nextId = groups.length + 1;
  const normalizedName = (value) => value.toLocaleLowerCase("vi-VN");
  const calls = {
    create: [],
    delete: [],
    findFirst: [],
    findMany: [],
    findUnique: [],
    update: [],
  };

  prisma.tagGroup = {
    findFirst: async ({ where }) => {
      calls.findFirst.push(where);
      return groups.find(
        (group) =>
          group.isActive === where.isActive &&
          normalizedName(group.nameVi) === normalizedName(where.nameVi.equals) &&
          group.id !== where.id?.not,
      ) ?? null;
    },
    findMany: async (args) => {
      calls.findMany.push(args);
      return groups;
    },
    findUnique: async ({ where }) => {
      calls.findUnique.push(where);
      return groups.find((group) => group.id === where.id) ?? null;
    },
    create: async (args) => {
      calls.create.push(args);
      const group = { id: nextId++, ...args.data };
      groups.push(group);
      return group;
    },
    update: async ({ where, data, ...rest }) => {
      calls.update.push({ where, data, ...rest });
      const group = groups.find((candidate) => candidate.id === where.id);
      Object.assign(group, data);
      return group;
    },
    delete: async ({ where }) => {
      calls.delete.push(where);
      const index = groups.findIndex((group) => group.id === where.id);
      return groups.splice(index, 1)[0];
    },
  };

  prisma.placeTag = {
    count: async ({ where }) => tagCounts.get(where.tagGroupId) ?? 0,
  };

  return calls;
}

test("rejects an active group with a duplicate Vietnamese name", async () => {
  const calls = installTagGroupStore();

  await createTagGroup({ slug: "am-thuc", nameVi: FOOD });

  await assert.rejects(
    createTagGroup({ slug: "food", nameVi: FOOD_UPPER }),
    (error) => error.statusCode === 409,
  );

  assert.deepEqual(calls.findFirst, [
    { nameVi: { equals: FOOD, mode: "insensitive" }, isActive: true },
    { nameVi: { equals: FOOD_UPPER, mode: "insensitive" }, isActive: true },
  ]);
  assert.deepEqual(calls.create, [
    {
      data: {
        slug: "am-thuc",
        nameVi: FOOD,
        nameEn: null,
        sortOrder: 0,
        isActive: true,
      },
      include: { _count: { select: { tags: true } } },
    },
  ]);
});

test("does not delete a group with linked tags", async () => {
  const groupWithTag = { id: 1, slug: "food", nameVi: FOOD, isActive: true };
  installTagGroupStore([groupWithTag], new Map([[groupWithTag.id, 1]]));

  await assert.rejects(
    deleteTagGroup(groupWithTag.id),
    (error) => error.statusCode === 409,
  );
});

test("lists groups with their linked tag counts in display order", async () => {
  const groups = [
    { id: 2, slug: "stay", nameVi: "Luu tru", _count: { tags: 0 } },
    { id: 1, slug: "food", nameVi: FOOD, _count: { tags: 3 } },
  ];
  const calls = installTagGroupStore(groups);

  const result = await getAllTagGroups();

  assert.equal(result, groups);
  assert.deepEqual(calls.findMany, [
    {
      include: { _count: { select: { tags: true } } },
      orderBy: [{ sortOrder: "asc" }, { nameVi: "asc" }],
    },
  ]);
});

test("updates a group name, status, and sort order", async () => {
  const group = {
    id: 1,
    slug: "food",
    nameVi: FOOD,
    nameEn: null,
    isActive: true,
    sortOrder: 0,
  };
  const calls = installTagGroupStore([group]);

  const result = await updateTagGroup(group.id, {
    nameVi: "An uong",
    isActive: false,
    sortOrder: 4,
  });

  assert.deepEqual(result, {
    id: 1,
    slug: "food",
    nameVi: "An uong",
    nameEn: null,
    isActive: false,
    sortOrder: 4,
  });
  assert.deepEqual(calls.update, [
    {
      where: { id: 1 },
      data: { nameVi: "An uong", isActive: false, sortOrder: 4 },
      include: { _count: { select: { tags: true } } },
    },
  ]);
});

test("rejects an active rename to another active Vietnamese name", async () => {
  const calls = installTagGroupStore([
    { id: 1, slug: "food", nameVi: FOOD, isActive: true },
    { id: 2, slug: "stay", nameVi: "Luu tru", isActive: true },
  ]);

  await assert.rejects(
    updateTagGroup(2, { nameVi: FOOD_UPPER }),
    (error) => error.statusCode === 409,
  );

  assert.deepEqual(calls.findFirst, [
    {
      nameVi: { equals: FOOD_UPPER, mode: "insensitive" },
      isActive: true,
      id: { not: 2 },
    },
  ]);
});

test("rejects reactivation when an active group has the same Vietnamese name", async () => {
  const calls = installTagGroupStore([
    { id: 1, slug: "food", nameVi: FOOD, isActive: true },
    { id: 2, slug: "food-legacy", nameVi: FOOD_UPPER, isActive: false },
  ]);

  await assert.rejects(
    updateTagGroup(2, { isActive: true }),
    (error) => error.statusCode === 409,
  );

  assert.deepEqual(calls.findFirst, [
    {
      nameVi: { equals: FOOD_UPPER, mode: "insensitive" },
      isActive: true,
      id: { not: 2 },
    },
  ]);
});

test("maps an atomic create name conflict to 409", async () => {
  prisma.tagGroup = {
    findFirst: async () => null,
    create: async () => {
      throw { code: "P2002" };
    },
  };

  await assert.rejects(
    createTagGroup({ slug: "food", nameVi: FOOD }),
    (error) => error.statusCode === 409,
  );
});

test("maps an atomic reactivation name conflict to 409", async () => {
  prisma.tagGroup = {
    findUnique: async () => ({ id: 2, nameVi: FOOD, isActive: false }),
    findFirst: async () => null,
    update: async () => {
      throw { code: "P2002" };
    },
  };

  await assert.rejects(
    updateTagGroup(2, { isActive: true }),
    (error) => error.statusCode === 409,
  );
});

test("maps a delete foreign-key race to 409", async () => {
  prisma.tagGroup = {
    findUnique: async () => ({ id: 1 }),
    delete: async () => {
      throw { code: "P2003" };
    },
  };
  prisma.placeTag = { count: async () => 0 };

  await assert.rejects(
    deleteTagGroup(1),
    (error) => error.statusCode === 409,
  );
});

test("validates create and patch payloads for the tag-group routes", () => {
  assert.deepEqual(
    createTagGroupSchema.parse({
      slug: "food",
      nameVi: FOOD,
      nameEn: "Food",
      sortOrder: "2",
    }),
    { slug: "food", nameVi: FOOD, nameEn: "Food", sortOrder: 2 },
  );
  assert.equal(createTagGroupSchema.safeParse({ slug: "", nameVi: "" }).success, false);
  assert.equal(updateTagGroupSchema.safeParse({}).success, false);
});
