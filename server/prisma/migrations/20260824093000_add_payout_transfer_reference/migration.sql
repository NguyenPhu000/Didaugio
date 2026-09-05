ALTER TABLE "payouts"
ADD COLUMN "transfer_reference" TEXT;

CREATE UNIQUE INDEX "payouts_transfer_reference_key"
ON "payouts"("transfer_reference");
