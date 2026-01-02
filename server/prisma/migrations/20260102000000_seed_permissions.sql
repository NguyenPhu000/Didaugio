-- =============================================================================
-- SEED PERMISSIONS & ROLE_PERMISSIONS - RBAC SYSTEM
-- Ngày tạo: 02/01/2026
-- =============================================================================

-- Xóa dữ liệu cũ nếu có (chỉ cho dev environment)
-- DELETE FROM role_permissions;
-- DELETE FROM permissions;

-- =============================================================================
-- 1. SEED PERMISSIONS (68 quyền)
-- =============================================================================

-- Module: USERS (10 quyền)
INSERT INTO permissions (name, display_name, module, description) VALUES
('users.view', 'Xem danh sách người dùng', 'users', 'Cho phép xem danh sách tất cả người dùng'),
('users.view_detail', 'Xem chi tiết người dùng', 'users', 'Cho phép xem thông tin chi tiết người dùng'),
('users.create', 'Tạo người dùng mới', 'users', 'Cho phép tạo tài khoản người dùng mới'),
('users.edit', 'Chỉnh sửa người dùng', 'users', 'Cho phép chỉnh sửa thông tin người dùng'),
('users.delete', 'Xóa người dùng', 'users', 'Cho phép xóa tài khoản người dùng'),
('users.lock', 'Khóa/mở khóa tài khoản', 'users', 'Cho phép khóa hoặc mở khóa tài khoản'),
('users.change_role', 'Thay đổi vai trò', 'users', 'Cho phép thay đổi vai trò của người dùng'),
('users.reset_password', 'Reset mật khẩu', 'users', 'Cho phép reset mật khẩu người dùng'),
('users.view_login_history', 'Xem lịch sử đăng nhập', 'users', 'Cho phép xem lịch sử đăng nhập'),
('users.export', 'Xuất dữ liệu người dùng', 'users', 'Cho phép xuất danh sách người dùng ra file');

-- Module: ROLES (4 quyền)
INSERT INTO permissions (name, display_name, module, description) VALUES
('roles.view', 'Xem danh sách vai trò', 'roles', 'Cho phép xem danh sách vai trò'),
('roles.view_detail', 'Xem chi tiết vai trò', 'roles', 'Cho phép xem chi tiết vai trò và quyền'),
('roles.manage_permissions', 'Quản lý quyền của vai trò', 'roles', 'Cho phép cấp/thu hồi quyền cho vai trò'),
('roles.view_users', 'Xem người dùng theo vai trò', 'roles', 'Cho phép xem danh sách người dùng theo vai trò');

-- Module: PLACES (12 quyền)
INSERT INTO permissions (name, display_name, module, description) VALUES
('places.view', 'Xem danh sách địa điểm', 'places', 'Cho phép xem danh sách địa điểm'),
('places.view_detail', 'Xem chi tiết địa điểm', 'places', 'Cho phép xem thông tin chi tiết địa điểm'),
('places.create', 'Tạo địa điểm mới', 'places', 'Cho phép tạo địa điểm mới'),
('places.edit', 'Chỉnh sửa địa điểm', 'places', 'Cho phép chỉnh sửa thông tin địa điểm'),
('places.delete', 'Xóa địa điểm', 'places', 'Cho phép xóa địa điểm'),
('places.approve', 'Duyệt địa điểm', 'places', 'Cho phép phê duyệt địa điểm'),
('places.reject', 'Từ chối địa điểm', 'places', 'Cho phép từ chối địa điểm'),
('places.feature', 'Đánh dấu nổi bật', 'places', 'Cho phép đánh dấu địa điểm nổi bật'),
('places.verify', 'Xác minh địa điểm', 'places', 'Cho phép xác minh địa điểm'),
('places.manage_images', 'Quản lý hình ảnh', 'places', 'Cho phép quản lý hình ảnh địa điểm'),
('places.manage_hours', 'Quản lý giờ mở cửa', 'places', 'Cho phép quản lý giờ mở cửa'),
('places.export', 'Xuất dữ liệu địa điểm', 'places', 'Cho phép xuất danh sách địa điểm');

-- Module: BOOKINGS (7 quyền)
INSERT INTO permissions (name, display_name, module, description) VALUES
('bookings.view', 'Xem danh sách booking', 'bookings', 'Cho phép xem danh sách đặt chỗ'),
('bookings.view_detail', 'Xem chi tiết booking', 'bookings', 'Cho phép xem chi tiết đặt chỗ'),
('bookings.confirm', 'Xác nhận booking', 'bookings', 'Cho phép xác nhận đặt chỗ'),
('bookings.cancel', 'Hủy booking', 'bookings', 'Cho phép hủy đặt chỗ'),
('bookings.complete', 'Hoàn thành booking', 'bookings', 'Cho phép đánh dấu đặt chỗ hoàn thành'),
('bookings.export', 'Xuất dữ liệu booking', 'bookings', 'Cho phép xuất danh sách đặt chỗ'),
('bookings.view_revenue', 'Xem doanh thu', 'bookings', 'Cho phép xem báo cáo doanh thu');

-- Module: REVIEWS (6 quyền)
INSERT INTO permissions (name, display_name, module, description) VALUES
('reviews.view', 'Xem danh sách đánh giá', 'reviews', 'Cho phép xem danh sách đánh giá'),
('reviews.view_detail', 'Xem chi tiết đánh giá', 'reviews', 'Cho phép xem chi tiết đánh giá'),
('reviews.hide', 'Ẩn đánh giá', 'reviews', 'Cho phép ẩn đánh giá vi phạm'),
('reviews.delete', 'Xóa đánh giá', 'reviews', 'Cho phép xóa đánh giá'),
('reviews.reply', 'Trả lời đánh giá', 'reviews', 'Cho phép trả lời đánh giá'),
('reviews.export', 'Xuất dữ liệu đánh giá', 'reviews', 'Cho phép xuất danh sách đánh giá');

-- Module: BUSINESS (10 quyền)
INSERT INTO permissions (name, display_name, module, description) VALUES
('business.view', 'Xem danh sách doanh nghiệp', 'business', 'Cho phép xem danh sách doanh nghiệp'),
('business.view_detail', 'Xem chi tiết doanh nghiệp', 'business', 'Cho phép xem thông tin chi tiết doanh nghiệp'),
('business.approve', 'Duyệt doanh nghiệp', 'business', 'Cho phép phê duyệt doanh nghiệp'),
('business.reject', 'Từ chối doanh nghiệp', 'business', 'Cho phép từ chối doanh nghiệp'),
('business.edit', 'Chỉnh sửa doanh nghiệp', 'business', 'Cho phép chỉnh sửa thông tin doanh nghiệp'),
('business.lock', 'Khóa doanh nghiệp', 'business', 'Cho phép khóa tài khoản doanh nghiệp'),
('business.manage_services', 'Quản lý dịch vụ', 'business', 'Cho phép quản lý dịch vụ của doanh nghiệp'),
('business.manage_vouchers', 'Quản lý voucher', 'business', 'Cho phép quản lý voucher của doanh nghiệp'),
('business.view_revenue', 'Xem doanh thu', 'business', 'Cho phép xem doanh thu doanh nghiệp'),
('business.export', 'Xuất dữ liệu doanh nghiệp', 'business', 'Cho phép xuất danh sách doanh nghiệp');

-- Module: REPORTS (5 quyền)
INSERT INTO permissions (name, display_name, module, description) VALUES
('reports.view', 'Xem danh sách báo cáo', 'reports', 'Cho phép xem danh sách báo cáo'),
('reports.view_detail', 'Xem chi tiết báo cáo', 'reports', 'Cho phép xem chi tiết báo cáo'),
('reports.resolve', 'Xử lý báo cáo', 'reports', 'Cho phép xử lý báo cáo'),
('reports.reject', 'Từ chối báo cáo', 'reports', 'Cho phép từ chối báo cáo'),
('reports.export', 'Xuất dữ liệu báo cáo', 'reports', 'Cho phép xuất danh sách báo cáo');

-- Module: SYSTEM (8 quyền)
INSERT INTO permissions (name, display_name, module, description) VALUES
('system.view_config', 'Xem cấu hình hệ thống', 'system', 'Cho phép xem cấu hình hệ thống'),
('system.edit_config', 'Chỉnh sửa cấu hình', 'system', 'Cho phép chỉnh sửa cấu hình hệ thống'),
('system.view_logs', 'Xem audit logs', 'system', 'Cho phép xem nhật ký hoạt động'),
('system.manage_api_keys', 'Quản lý API keys', 'system', 'Cho phép quản lý khóa API'),
('system.manage_banners', 'Quản lý banner marketing', 'system', 'Cho phép quản lý banner quảng cáo'),
('system.send_notifications', 'Gửi thông báo toàn hệ thống', 'system', 'Cho phép gửi thông báo đến tất cả người dùng'),
('system.view_analytics', 'Xem thống kê hệ thống', 'system', 'Cho phép xem báo cáo thống kê'),
('system.export_data', 'Xuất dữ liệu hệ thống', 'system', 'Cho phép xuất toàn bộ dữ liệu hệ thống');

-- Module: CATEGORIES (5 quyền)
INSERT INTO permissions (name, display_name, module, description) VALUES
('categories.view', 'Xem danh mục', 'categories', 'Cho phép xem danh sách danh mục'),
('categories.create', 'Tạo danh mục', 'categories', 'Cho phép tạo danh mục mới'),
('categories.edit', 'Chỉnh sửa danh mục', 'categories', 'Cho phép chỉnh sửa danh mục'),
('categories.delete', 'Xóa danh mục', 'categories', 'Cho phép xóa danh mục'),
('categories.manage_tags', 'Quản lý tags', 'categories', 'Cho phép quản lý tags của danh mục');

-- Module: PAYMENTS (5 quyền)
INSERT INTO permissions (name, display_name, module, description) VALUES
('payments.view', 'Xem danh sách thanh toán', 'payments', 'Cho phép xem danh sách thanh toán'),
('payments.view_detail', 'Xem chi tiết thanh toán', 'payments', 'Cho phép xem chi tiết giao dịch'),
('payments.refund', 'Hoàn tiền', 'payments', 'Cho phép hoàn tiền cho khách hàng'),
('payments.export', 'Xuất dữ liệu thanh toán', 'payments', 'Cho phép xuất danh sách thanh toán'),
('payments.view_revenue', 'Xem báo cáo doanh thu', 'payments', 'Cho phép xem báo cáo doanh thu chi tiết');

-- =============================================================================
-- 2. SEED ROLE_PERMISSIONS (Gán quyền cho 5 vai trò)
-- =============================================================================

-- Lấy ID của các permissions (sử dụng subquery)

-- SUPER_ADMIN (roleId=1): TẤT CẢ 68 quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- ADMIN (roleId=2): 52/68 quyền (không có users.delete, users.change_role, roles.manage_permissions, system.edit_config, system.manage_api_keys, system.export_data)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions 
WHERE name NOT IN (
    'users.delete', 
    'users.change_role', 
    'roles.manage_permissions',
    'system.edit_config',
    'system.manage_api_keys',
    'system.export_data'
);

-- BUSINESS (roleId=3): 28/68 quyền (chỉ quản lý data của mình)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions 
WHERE name IN (
    -- Places
    'places.view', 'places.view_detail', 'places.create', 'places.edit', 'places.delete',
    'places.manage_images', 'places.manage_hours',
    -- Bookings
    'bookings.view', 'bookings.view_detail', 'bookings.confirm', 'bookings.cancel', 
    'bookings.complete', 'bookings.export', 'bookings.view_revenue',
    -- Reviews
    'reviews.view', 'reviews.view_detail', 'reviews.reply',
    -- Business
    'business.view_detail', 'business.edit', 'business.manage_services', 
    'business.manage_vouchers', 'business.view_revenue',
    -- Categories
    'categories.view',
    -- Payments
    'payments.view', 'payments.view_detail', 'payments.export', 'payments.view_revenue'
);

-- STAFF (roleId=4): 15/68 quyền (xử lý reports, ẩn reviews)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions 
WHERE name IN (
    -- Places (chỉ xem)
    'places.view', 'places.view_detail',
    -- Reviews
    'reviews.view', 'reviews.view_detail', 'reviews.hide',
    -- Reports
    'reports.view', 'reports.view_detail', 'reports.resolve', 'reports.reject',
    -- Categories (chỉ xem)
    'categories.view'
);

-- GUEST (roleId=5): 0 quyền (không có quyền truy cập admin panel)
-- Không insert gì cho GUEST

-- =============================================================================
-- 3. VERIFY DATA
-- =============================================================================

-- Kiểm tra số lượng permissions
-- SELECT COUNT(*) FROM permissions; -- Phải = 68

-- Kiểm tra permissions theo module
-- SELECT module, COUNT(*) as total FROM permissions GROUP BY module ORDER BY module;

-- Kiểm tra số quyền của từng role
-- SELECT r.name, r.display_name, COUNT(rp.permission_id) as total_permissions
-- FROM roles r
-- LEFT JOIN role_permissions rp ON r.id = rp.role_id
-- GROUP BY r.id, r.name, r.display_name
-- ORDER BY r.id;

-- Kết quả mong đợi:
-- super_admin: 68 quyền
-- admin: 62 quyền
-- business: 28 quyền
-- staff: 10 quyền
-- guest: 0 quyền
