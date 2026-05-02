import test, { after } from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";

dotenv.config({ override: true });

const RUN_DB_TESTS =
  process.env.SAVED_DB_TESTS === "1" ||
  process.env.npm_lifecycle_event === "test:saved-db";
const dbTest = RUN_DB_TESTS ? test : test.skip;

let prisma;

const loadPrisma = async () => {
  if (!prisma) {
    ({ default: prisma } = await import("../../../config/prismaClient.js"));
  }
  return prisma;
};

after(async () => {
  await prisma?.$disconnect();
});

const safeUsername = (prefix, nonce) =>
  `${prefix}_${nonce}`.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 30);

async function createSavedPlacesFixture(tx, nonce) {
  const role = await tx.role.findFirst({ select: { id: true } });
  assert.ok(role?.id, "Database cần có ít nhất một role để chạy saved collections DB test");

  const owner = await tx.user.create({
    data: {
      email: `saved-owner-${nonce}@example.test`,
      username: safeUsername("svown", nonce),
      password: "test-password",
      roleId: role.id,
    },
  });

  const user = await tx.user.create({
    data: {
      email: `saved-user-${nonce}@example.test`,
      username: safeUsername("svusr", nonce),
      password: "test-password",
      roleId: role.id,
    },
  });

  const category = await tx.category.create({
    data: {
      name: `Saved Cat ${nonce}`,
      slug: `saved-cat-${nonce}`,
    },
  });

  const district = await tx.districtCantho.create({
    data: {
      name: `Saved Dist ${nonce}`,
      code: `saved-dist-${nonce}`,
      latitude: 10.0,
      longitude: 105.0,
    },
  });

  const business = await tx.business.create({
    data: {
      ownerId: owner.id,
      businessName: `Saved Biz ${nonce}`,
      businessType: "test",
      status: "approved",
    },
  });

  const placeA = await tx.place.create({
    data: {
      businessId: business.id,
      categoryId: category.id,
      districtId: district.id,
      name: `Saved Place A ${nonce}`,
      slug: `saved-place-a-${nonce}`,
      address: "Test address A",
      latitude: 10.0,
      longitude: 105.0,
      status: "approved",
      createdBy: owner.id,
    },
  });

  const placeB = await tx.place.create({
    data: {
      businessId: business.id,
      categoryId: category.id,
      districtId: district.id,
      name: `Saved Place B ${nonce}`,
      slug: `saved-place-b-${nonce}`,
      address: "Test address B",
      latitude: 10.1,
      longitude: 105.1,
      status: "approved",
      createdBy: owner.id,
    },
  });

  return { owner, user, category, district, business, placeA, placeB };
}

async function cleanupSavedFixture(db, fixture) {
  if (!fixture) return;

  await db.favorite.deleteMany({ where: { userId: fixture.user.id } });
  await db.place.deleteMany({
    where: { id: { in: [fixture.placeA.id, fixture.placeB.id] } },
  });
  await db.business.deleteMany({ where: { id: fixture.business.id } });
  await db.category.deleteMany({ where: { id: fixture.category.id } });
  await db.districtCantho.deleteMany({ where: { id: fixture.district.id } });
  await db.user.deleteMany({
    where: { id: { in: [fixture.owner.id, fixture.user.id] } },
  });
}

async function loadSavedAppService() {
  return import("../app.service.js");
}

dbTest("savePlace + getMySavedCollections: gom đúng theo collectionName", async () => {
  const db = await loadPrisma();
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let fixture;

  try {
    fixture = await db.$transaction((tx) => createSavedPlacesFixture(tx, nonce));
    const {
      savePlace,
      getMySavedCollections,
    } = await loadSavedAppService();
    const coll = `Trip_${nonce}`.slice(0, 40);

    await savePlace(fixture.user.id, fixture.placeA.id, "n1", coll);
    await savePlace(fixture.user.id, fixture.placeB.id, "n2", coll);

    const collections = await getMySavedCollections(fixture.user.id);
    const row = collections.find((c) => c.name === coll);
    assert.ok(row, "Phải có collection vừa gán");
    assert.equal(row.count, 2);
  } finally {
    await cleanupSavedFixture(db, fixture);
  }
});

dbTest("renameMySavedCollection đổi tên hàng loạt", async () => {
  const db = await loadPrisma();
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let fixture;

  try {
    fixture = await db.$transaction((tx) => createSavedPlacesFixture(tx, nonce));
    const {
      savePlace,
      getMySavedCollections,
      renameMySavedCollection,
    } = await loadSavedAppService();

    const from = `Old_${nonce}`.slice(0, 35);
    const to = `New_${nonce}`.slice(0, 35);

    await savePlace(fixture.user.id, fixture.placeA.id, null, from);
    await savePlace(fixture.user.id, fixture.placeB.id, null, from);

    const renamed = await renameMySavedCollection(fixture.user.id, from, to);
    assert.equal(renamed.updatedCount, 2);
    assert.equal(renamed.name, to);

    const collections = await getMySavedCollections(fixture.user.id);
    assert.ok(collections.every((c) => c.name !== from));
    const row = collections.find((c) => c.name === to);
    assert.ok(row);
    assert.equal(row.count, 2);
  } finally {
    await cleanupSavedFixture(db, fixture);
  }
});

dbTest("deleteMySavedCollection đặt collectionName null, vẫn giữ favorite", async () => {
  const db = await loadPrisma();
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let fixture;

  try {
    fixture = await db.$transaction((tx) => createSavedPlacesFixture(tx, nonce));
    const {
      savePlace,
      getMySavedCollections,
      deleteMySavedCollection,
    } = await loadSavedAppService();

    const coll = `Del_${nonce}`.slice(0, 35);
    await savePlace(fixture.user.id, fixture.placeA.id, "keep", coll);

    const del = await deleteMySavedCollection(fixture.user.id, coll);
    assert.equal(del.updatedCount, 1);

    const collections = await getMySavedCollections(fixture.user.id);
    assert.ok(!collections.some((c) => c.name === coll));

    const fav = await db.favorite.findUnique({
      where: {
        userId_placeId: { userId: fixture.user.id, placeId: fixture.placeA.id },
      },
    });
    assert.ok(fav, "Favorite vẫn tồn tại");
    assert.equal(fav.collectionName, null);
    assert.equal(fav.note, "keep");
  } finally {
    await cleanupSavedFixture(db, fixture);
  }
});

dbTest("savePlace không truyền collectionName không xóa collection hiện có", async () => {
  const db = await loadPrisma();
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let fixture;

  try {
    fixture = await db.$transaction((tx) => createSavedPlacesFixture(tx, nonce));
    const { savePlace, getMySavedCollections } = await loadSavedAppService();
    const coll = `Keep_${nonce}`.slice(0, 35);

    await savePlace(fixture.user.id, fixture.placeA.id, "v1", coll);
    await savePlace(fixture.user.id, fixture.placeA.id, "v2 updated note");

    const collections = await getMySavedCollections(fixture.user.id);
    const row = collections.find((c) => c.name === coll);
    assert.ok(row);
    assert.equal(row.count, 1);

    const fav = await db.favorite.findUnique({
      where: {
        userId_placeId: { userId: fixture.user.id, placeId: fixture.placeA.id },
      },
    });
    assert.equal(fav.collectionName, coll);
    assert.equal(fav.note, "v2 updated note");
  } finally {
    await cleanupSavedFixture(db, fixture);
  }
});