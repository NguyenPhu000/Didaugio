-- =============================================================================
-- Migration: Thêm cột isProtected vào bảng roles
-- Ngày tạo: 03/01/2026
-- Mục đích: Bảo vệ các role hệ thống khỏi bị xóa/sửa tên
-- =============================================================================

-- Thêm cột is_protected
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_protected BOOLEAN DEFAULT false;

-- Đánh dấu các role hệ thống là protected
UPDATE roles SET is_protected = true WHERE name IN ('super_admin', 'admin', 'business', 'staff', 'guest');

-- Comment cho cột
COMMENT ON COLUMN roles.is_protected IS 'Đánh dấu role hệ thống không được xóa/đổi tên';
