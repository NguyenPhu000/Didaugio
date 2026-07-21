CREATE TABLE IF NOT EXISTS "subscription_plans" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "price_monthly" INTEGER NOT NULL,
  "price_yearly" INTEGER,
  "max_places" INTEGER NOT NULL DEFAULT 5,
  "max_services" INTEGER NOT NULL DEFAULT 5,
  "max_bookings_per_month" INTEGER NOT NULL DEFAULT 100,
  "max_staff" INTEGER NOT NULL DEFAULT 2,
  "features" JSONB NOT NULL DEFAULT '[]',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "subscription_plans_name_key"
  ON "subscription_plans"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_plans_slug_key"
  ON "subscription_plans"("slug");

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" SERIAL NOT NULL,
  "business_id" INTEGER NOT NULL,
  "plan_id" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "billing_cycle" TEXT NOT NULL DEFAULT 'monthly',
  "current_period_start" TIMESTAMP(3) NOT NULL,
  "current_period_end" TIMESTAMP(3) NOT NULL,
  "grace_period_end" TIMESTAMP(3),
  "canceled_at" TIMESTAMP(3),
  "cancel_reason" TEXT,
  "trial_ends_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_business_id_key"
  ON "subscriptions"("business_id");
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx"
  ON "subscriptions"("status");
CREATE INDEX IF NOT EXISTS "subscriptions_current_period_end_idx"
  ON "subscriptions"("current_period_end");

CREATE TABLE IF NOT EXISTS "subscription_invoices" (
  "id" SERIAL NOT NULL,
  "subscription_id" INTEGER NOT NULL,
  "invoice_number" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'VND',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "payment_method" TEXT,
  "transaction_ref" TEXT,
  "qr_url" TEXT,
  "paid_at" TIMESTAMP(3),
  "due_date" TIMESTAMP(3) NOT NULL,
  "period_start" TIMESTAMP(3) NOT NULL,
  "period_end" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscription_invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "subscription_invoices_invoice_number_key"
  ON "subscription_invoices"("invoice_number");
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_invoices_transaction_ref_key"
  ON "subscription_invoices"("transaction_ref");
CREATE INDEX IF NOT EXISTS "subscription_invoices_subscription_id_idx"
  ON "subscription_invoices"("subscription_id");
CREATE INDEX IF NOT EXISTS "subscription_invoices_status_idx"
  ON "subscription_invoices"("status");
CREATE INDEX IF NOT EXISTS "subscription_invoices_due_date_idx"
  ON "subscription_invoices"("due_date");

CREATE TABLE IF NOT EXISTS "subscription_stats" (
  "id" SERIAL NOT NULL,
  "snapshot_date" DATE NOT NULL,
  "mrr" INTEGER NOT NULL DEFAULT 0,
  "arr" INTEGER NOT NULL DEFAULT 0,
  "active_count" INTEGER NOT NULL DEFAULT 0,
  "trial_count" INTEGER NOT NULL DEFAULT 0,
  "grace_count" INTEGER NOT NULL DEFAULT 0,
  "past_due_count" INTEGER NOT NULL DEFAULT 0,
  "canceled_count" INTEGER NOT NULL DEFAULT 0,
  "churn_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "new_count" INTEGER NOT NULL DEFAULT 0,
  "revenue_total" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subscription_stats_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "subscription_stats_snapshot_date_key"
  ON "subscription_stats"("snapshot_date");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_business_id_fkey'
  ) THEN
    ALTER TABLE "subscriptions"
      ADD CONSTRAINT "subscriptions_business_id_fkey"
      FOREIGN KEY ("business_id") REFERENCES "businesses"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_plan_id_fkey'
  ) THEN
    ALTER TABLE "subscriptions"
      ADD CONSTRAINT "subscriptions_plan_id_fkey"
      FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscription_invoices_subscription_id_fkey'
  ) THEN
    ALTER TABLE "subscription_invoices"
      ADD CONSTRAINT "subscription_invoices_subscription_id_fkey"
      FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
