-- =============================================================================
-- ADD MISSING PERMISSION: roles.assign_to_users
-- Ngày tạo: 04/01/2026
-- Mục đích: Fix bug 403 khi update user permissions
-- =============================================================================

-- Thêm permission mới
INSERT INTO permissions (name, display_name, module, description) VALUES
('roles.assign_to_users', 'Gán quyền cho người dùng', 'roles', 'Cho phép gán/thu hồi quyền cho người dùng cá nhân')
ON CONFLICT (name) DO NOTHING;

-- Gán permission cho Super Admin (roleId = 1)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions WHERE name = 'roles.assign_to_users'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Gán permission cho Admin (roleId = 2)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE name = 'roles.assign_to_users'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Verify
-- SELECT p.*, COUNT(rp.role_id) as assigned_to_roles
-- FROM permissions p
-- LEFT JOIN role_permissions rp ON p.id = rp.permission_id
-- WHERE p.name = 'roles.assign_to_users'
-- GROUP BY p.id;
