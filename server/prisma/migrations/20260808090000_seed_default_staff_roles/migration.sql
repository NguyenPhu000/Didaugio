INSERT INTO business_roles (
  business_id,
  name,
  description,
  permissions,
  is_default,
  created_at,
  updated_at
)
SELECT
  NULL,
  'Reception',
  'View and process booking requests.',
  '["bookings.view", "bookings.confirm", "bookings.cancel"]'::jsonb,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM business_roles
  WHERE business_id IS NULL AND name = 'Reception'
);

INSERT INTO business_roles (
  business_id,
  name,
  description,
  permissions,
  is_default,
  created_at,
  updated_at
)
SELECT
  NULL,
  'Booking Operations',
  'Process booking requests through completion or no-show.',
  '["bookings.view", "bookings.confirm", "bookings.cancel", "bookings.complete"]'::jsonb,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM business_roles
  WHERE business_id IS NULL AND name = 'Booking Operations'
);
