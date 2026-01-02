-- CreateTable
CREATE TABLE "user_permissions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "granted_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_user_id_permission_id_key" ON "user_permissions"("user_id", "permission_id");

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
