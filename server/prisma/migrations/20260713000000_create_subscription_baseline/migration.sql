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
DECLARE
  fk RECORD;
  existing_oid OID;
  structurally_valid BOOLEAN;
BEGIN
  FOR fk IN
    SELECT *
    FROM (VALUES
      ('subscriptions', 'subscriptions_business_id_fkey', 'business_id', 'businesses', 'id'),
      ('subscriptions', 'subscriptions_plan_id_fkey', 'plan_id', 'subscription_plans', 'id'),
      ('subscription_invoices', 'subscription_invoices_subscription_id_fkey', 'subscription_id', 'subscriptions', 'id')
    ) AS expected(owning_table, constraint_name, owning_column, referenced_table, referenced_column)
  LOOP
    SELECT
      c.oid,
      c.contype = 'f'
        AND referenced_namespace.nspname = 'public'
        AND referenced_relation.relname = fk.referenced_table
        AND c.conkey = ARRAY[owning_column.attnum]::SMALLINT[]
        AND c.confkey = ARRAY[referenced_column.attnum]::SMALLINT[]
        AND owning_column.attname = fk.owning_column
        AND referenced_column.attname = fk.referenced_column
        AND c.confupdtype = 'c'
        AND c.confdeltype = 'r'
        AND c.confmatchtype = 's'
        AND NOT c.condeferrable
        AND NOT c.condeferred
        AND c.convalidated
    INTO existing_oid, structurally_valid
    FROM pg_constraint c
    JOIN pg_class owning_relation
      ON owning_relation.oid = c.conrelid
    JOIN pg_namespace namespace
      ON namespace.oid = owning_relation.relnamespace
    LEFT JOIN pg_class referenced_relation
      ON referenced_relation.oid = c.confrelid
    LEFT JOIN pg_namespace referenced_namespace
      ON referenced_namespace.oid = referenced_relation.relnamespace
    LEFT JOIN pg_attribute owning_column
      ON owning_column.attrelid = owning_relation.oid
      AND owning_column.attnum = ANY(c.conkey)
      AND NOT owning_column.attisdropped
    LEFT JOIN pg_attribute referenced_column
      ON referenced_column.attrelid = referenced_relation.oid
      AND referenced_column.attnum = ANY(c.confkey)
      AND NOT referenced_column.attisdropped
    WHERE namespace.nspname = 'public'
      AND owning_relation.relname = fk.owning_table
      AND c.conname = fk.constraint_name;

    IF existing_oid IS NULL THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I (%I) ON DELETE RESTRICT ON UPDATE CASCADE',
        fk.owning_table,
        fk.constraint_name,
        fk.owning_column,
        fk.referenced_table,
        fk.referenced_column
      );
    ELSIF structurally_valid IS NOT TRUE THEN
      RAISE EXCEPTION 'Existing subscription constraint % is incompatible with %.%(%) -> %.%(%) ON DELETE RESTRICT ON UPDATE CASCADE',
        fk.constraint_name,
        'public',
        fk.owning_table,
        fk.owning_column,
        'public',
        fk.referenced_table,
        fk.referenced_column;
    END IF;
  END LOOP;
END $$;
