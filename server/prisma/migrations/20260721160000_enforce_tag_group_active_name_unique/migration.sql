-- Active groups must have unique Vietnamese display names irrespective of case.
-- Prisma cannot model this expression/partial unique index, so this migration is
-- the authoritative concurrency boundary for creates, renames, and reactivation.
CREATE UNIQUE INDEX "tag_groups_active_name_vi_key"
  ON "tag_groups" (LOWER("name_vi"))
  WHERE "is_active";
