-- Enable pg_trgm extension for fast ILIKE fuzzy/substring searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index on places.name for fast substring ILIKE searches
CREATE INDEX IF NOT EXISTS idx_places_name_trgm
  ON places USING gin (name gin_trgm_ops);

-- Create GIN index on places.description for fast substring ILIKE searches
CREATE INDEX IF NOT EXISTS idx_places_description_trgm
  ON places USING gin (description gin_trgm_ops);
