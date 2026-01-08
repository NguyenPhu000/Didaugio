-- Migration: Enhance Category & Tag System
-- Date: 2026-01-03
-- Description: Add level to Category, create CategoryTag table, add indexes

-- 1. Add level column to categories
ALTER TABLE categories ADD COLUMN level INT DEFAULT 1 NOT NULL;

-- 2. Update level for existing categories
UPDATE categories SET level = 1 WHERE parent_id IS NULL;
UPDATE categories c SET level = 2 WHERE parent_id IS NOT NULL AND parent_id IN (SELECT id FROM categories WHERE parent_id IS NULL);
UPDATE categories c SET level = 3 WHERE parent_id IS NOT NULL AND parent_id IN (SELECT id FROM categories WHERE level = 2);

-- 3. Add indexes to categories
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_level ON categories(level);

-- 4. Create category_tags table
CREATE TABLE IF NOT EXISTS category_tags (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  tag_id INT NOT NULL REFERENCES place_tags(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(category_id, tag_id)
);

-- 5. Add indexes to place_tags
CREATE INDEX IF NOT EXISTS idx_place_tags_tag_type ON place_tags(tag_type);
CREATE INDEX IF NOT EXISTS idx_place_tags_usage_count ON place_tags(usage_count DESC);

-- 6. Add comment for documentation
COMMENT ON TABLE category_tags IS 'Gợi ý tag cho category - giúp AI context và UX';
COMMENT ON COLUMN category_tags.is_default IS 'Tag được gợi ý mặc định khi tạo place thuộc category này';
