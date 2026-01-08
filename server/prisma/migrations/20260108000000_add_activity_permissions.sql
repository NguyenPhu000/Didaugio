-- Migration: Add permissions for Email Verification, Password Reset, Audit Log, Login History
-- Date: 08/01/2026
-- Note: Cần chạy sau khi đã có bảng permissions và roles

-- Thêm permissions cho Email Verification
INSERT INTO permissions (name, display_name, module, description, created_at)
VALUES 
  ('email_verification.view', 'Xem danh sách xác thực email', 'email_verification', 'Quyền xem danh sách email verifications', NOW()),
  ('email_verification.create', 'Tạo/Gửi lại email xác thực', 'email_verification', 'Quyền tạo token và gửi lại email xác thực', NOW())
ON CONFLICT (name) DO NOTHING;

-- Thêm permissions cho Password Reset
INSERT INTO permissions (name, display_name, module, description, created_at)
VALUES 
  ('password_reset.view', 'Xem danh sách reset mật khẩu', 'password_reset', 'Quyền xem danh sách password reset requests', NOW())
ON CONFLICT (name) DO NOTHING;

-- Thêm permissions cho Audit Log
INSERT INTO permissions (name, display_name, module, description, created_at)
VALUES 
  ('audit_log.view', 'Xem lịch sử hoạt động', 'audit_log', 'Quyền xem audit logs', NOW())
ON CONFLICT (name) DO NOTHING;

-- Thêm permissions cho Login History
INSERT INTO permissions (name, display_name, module, description, created_at)
VALUES 
  ('login_history.view', 'Xem lịch sử đăng nhập', 'login_history', 'Quyền xem tất cả login history', NOW()),
  ('login_history.revoke', 'Vô hiệu hóa session', 'login_history', 'Quyền revoke session của user khác', NOW())
ON CONFLICT (name) DO NOTHING;

-- Gán permissions cho Super Admin (role_id = 1)
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 1, p.id, NOW()
FROM permissions p
WHERE p.name IN (
  'email_verification.view',
  'email_verification.create',
  'password_reset.view',
  'audit_log.view',
  'login_history.view',
  'login_history.revoke'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Gán permissions cho Admin (role_id = 2)
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 2, p.id, NOW()
FROM permissions p
WHERE p.name IN (
  'email_verification.view',
  'email_verification.create',
  'password_reset.view',
  'audit_log.view',
  'login_history.view',
  'login_history.revoke'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

