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

afterEach(() => {
  prisma.tagGroup = originalTagGroup;
  prisma.placeTag = originalPlaceTag;
});

function installTagGroupStore(groups = [], tagCounts = new Map()) {
  let nextId = groups.length + 1;
  const normalizedName = (value) => value.toLocaleLowerCase("vi-VN");

  prisma.tagGroup = {
    findFirst: async ({ where }) =>
      groups.find(
        (group) =>
          group.isActive === where.isActive &&
          normalizedName(group.nameVi) === normalizedName(where.nameVi.equals) &&
          group.id !== where.NOT?.id?.not,
      ) ?? null,
    findMany: async () => groups,
    findUnique: async ({ where }) =>
      groups.find((group) => group.id === where.id) ?? null,
    create: async ({ data }) => {
      const group = { id: nextId++, isActive: true, sortOrder: 0, ...data };
      groups.push(group);
      return group;
    },
    update: async ({ where, data }) => {
      const group = groups.find((candidate) => candidate.id === where.id);
      Object.assign(group, data);
      return group;
    },
    delete: async ({ where }) => {
      const index = groups.findIndex((group) => group.id === where.id);
      return groups.splice(index, 1)[0];
    },
  };

  prisma.placeTag = {
    count: async ({ where }) => tagCounts.get(where.tagGroupId) ?? 0,
  };
}

test("rejects an active group with a duplicate Vietnamese name", async () => {
  installTagGroupStore();

  await createTagGroup({ slug: "am-thuc", nameVi: "Ẩm thực" });

  await assert.rejects(
    createTagGroup({ slug: "food", nameVi: "ẩm THỰC" }),
    (error) => error.statusCode === 409,
  );
});

test("does not delete a group with linked tags", async () => {
  const groupWithTag = { id: 1, slug: "food", nameVi: "Ẩm thực", isActive: true };
  installTagGroupStore([groupWithTag], new Map([[groupWithTag.id, 1]]));

  await assert.rejects(
    deleteTagGroup(groupWithTag.id),
    (error) => error.statusCode === 409,
  );
});

test("lists groups with their linked tag counts in display order", async () => {
  const groups = [
    { id: 2, slug: "stay", nameVi: "Lưu trú", _count: { tags: 0 } },
    { id: 1, slug: "food", nameVi: "Ẩm thực", _count: { tags: 3 } },
  ];
  installTagGroupStore(groups);

  const result = await getAllTagGroups();

  assert.equal(result, groups);
});

test("updates a group name, status, and sort order", async () => {
  const group = {
    id: 1,
    slug: "food",
    nameVi: "Ẩm thực",
    nameEn: null,
    isActive: true,
    sortOrder: 0,
  };
  installTagGroupStore([group]);

  const result = await updateTagGroup(group.id, {
    nameVi: "Ăn uống",
    isActive: false,
    sortOrder: 4,
  });

  assert.deepEqual(result, {
    ...group,
    nameVi: "Ăn uống",
    isActive: false,
    sortOrder: 4,
  });
});

test("validates create and patch payloads for the tag-group routes", () => {
  assert.deepEqual(
    createTagGroupSchema.parse({
      slug: "food",
      nameVi: "Ẩm thực",
      nameEn: "Food",
      sortOrder: "2",
    }),
    { slug: "food", nameVi: "Ẩm thực", nameEn: "Food", sortOrder: 2 },
  );
  assert.equal(createTagGroupSchema.safeParse({ slug: "", nameVi: "" }).success, false);
  assert.equal(updateTagGroupSchema.safeParse({}).success, false);
});
