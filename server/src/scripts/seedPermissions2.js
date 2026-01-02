import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Danh sách 68 permissions theo module
const permissions = [
  // Module: USERS (10 quyền)
  {
    name: "users.view",
    displayName: "Xem danh sách người dùng",
    module: "users",
    description: "Cho phép xem danh sách tất cả người dùng",
  },
  {
    name: "users.view_detail",
    displayName: "Xem chi tiết người dùng",
    module: "users",
    description: "Cho phép xem thông tin chi tiết người dùng",
  },
  {
    name: "users.create",
    displayName: "Tạo người dùng mới",
    module: "users",
    description: "Cho phép tạo tài khoản người dùng mới",
  },
  {
    name: "users.edit",
    displayName: "Chỉnh sửa người dùng",
    module: "users",
    description: "Cho phép chỉnh sửa thông tin người dùng",
  },
  {
    name: "users.delete",
    displayName: "Xóa người dùng",
    module: "users",
    description: "Cho phép xóa tài khoản người dùng",
  },
  {
    name: "users.lock",
    displayName: "Khóa/mở khóa tài khoản",
    module: "users",
    description: "Cho phép khóa hoặc mở khóa tài khoản",
  },
  {
    name: "users.change_role",
    displayName: "Thay đổi vai trò",
    module: "users",
    description: "Cho phép thay đổi vai trò của người dùng",
  },
  {
    name: "users.reset_password",
    displayName: "Reset mật khẩu",
    module: "users",
    description: "Cho phép reset mật khẩu người dùng",
  },
  {
    name: "users.view_login_history",
    displayName: "Xem lịch sử đăng nhập",
    module: "users",
    description: "Cho phép xem lịch sử đăng nhập",
  },
  {
    name: "users.export",
    displayName: "Xuất dữ liệu người dùng",
    module: "users",
    description: "Cho phép xuất danh sách người dùng ra file",
  },

  // Module: ROLES (4 quyền)
  {
    name: "roles.view",
    displayName: "Xem danh sách vai trò",
    module: "roles",
    description: "Cho phép xem danh sách vai trò",
  },
  {
    name: "roles.view_detail",
    displayName: "Xem chi tiết vai trò",
    module: "roles",
    description: "Cho phép xem chi tiết vai trò và quyền",
  },
  {
    name: "roles.manage_permissions",
    displayName: "Quản lý quyền của vai trò",
    module: "roles",
    description: "Cho phép cấp/thu hồi quyền cho vai trò",
  },
  {
    name: "roles.view_users",
    displayName: "Xem người dùng theo vai trò",
    module: "roles",
    description: "Cho phép xem danh sách người dùng theo vai trò",
  },

  // Module: PLACES (12 quyền)
  {
    name: "places.view",
    displayName: "Xem danh sách địa điểm",
    module: "places",
    description: "Cho phép xem danh sách địa điểm",
  },
  {
    name: "places.view_detail",
    displayName: "Xem chi tiết địa điểm",
    module: "places",
    description: "Cho phép xem thông tin chi tiết địa điểm",
  },
  {
    name: "places.create",
    displayName: "Tạo địa điểm mới",
    module: "places",
    description: "Cho phép tạo địa điểm mới",
  },
  {
    name: "places.edit",
    displayName: "Chỉnh sửa địa điểm",
    module: "places",
    description: "Cho phép chỉnh sửa thông tin địa điểm",
  },
  {
    name: "places.delete",
    displayName: "Xóa địa điểm",
    module: "places",
    description: "Cho phép xóa địa điểm",
  },
  {
    name: "places.approve",
    displayName: "Duyệt địa điểm",
    module: "places",
    description: "Cho phép phê duyệt địa điểm",
  },
  {
    name: "places.reject",
    displayName: "Từ chối địa điểm",
    module: "places",
    description: "Cho phép từ chối địa điểm",
  },
  {
    name: "places.feature",
    displayName: "Đánh dấu nổi bật",
    module: "places",
    description: "Cho phép đánh dấu địa điểm nổi bật",
  },
  {
    name: "places.verify",
    displayName: "Xác minh địa điểm",
    module: "places",
    description: "Cho phép xác minh địa điểm",
  },
  {
    name: "places.manage_images",
    displayName: "Quản lý hình ảnh",
    module: "places",
    description: "Cho phép quản lý hình ảnh địa điểm",
  },
  {
    name: "places.manage_hours",
    displayName: "Quản lý giờ mở cửa",
    module: "places",
    description: "Cho phép quản lý giờ mở cửa",
  },
  {
    name: "places.export",
    displayName: "Xuất dữ liệu địa điểm",
    module: "places",
    description: "Cho phép xuất danh sách địa điểm",
  },

  // Module: BOOKINGS (7 quyền)
  {
    name: "bookings.view",
    displayName: "Xem danh sách booking",
    module: "bookings",
    description: "Cho phép xem danh sách đặt chỗ",
  },
  {
    name: "bookings.view_detail",
    displayName: "Xem chi tiết booking",
    module: "bookings",
    description: "Cho phép xem chi tiết đặt chỗ",
  },
  {
    name: "bookings.confirm",
    displayName: "Xác nhận booking",
    module: "bookings",
    description: "Cho phép xác nhận đặt chỗ",
  },
  {
    name: "bookings.cancel",
    displayName: "Hủy booking",
    module: "bookings",
    description: "Cho phép hủy đặt chỗ",
  },
  {
    name: "bookings.complete",
    displayName: "Hoàn thành booking",
    module: "bookings",
    description: "Cho phép đánh dấu đặt chỗ hoàn thành",
  },
  {
    name: "bookings.export",
    displayName: "Xuất dữ liệu booking",
    module: "bookings",
    description: "Cho phép xuất danh sách đặt chỗ",
  },
  {
    name: "bookings.view_revenue",
    displayName: "Xem doanh thu",
    module: "bookings",
    description: "Cho phép xem báo cáo doanh thu",
  },

  // Module: REVIEWS (6 quyền)
  {
    name: "reviews.view",
    displayName: "Xem danh sách đánh giá",
    module: "reviews",
    description: "Cho phép xem danh sách đánh giá",
  },
  {
    name: "reviews.view_detail",
    displayName: "Xem chi tiết đánh giá",
    module: "reviews",
    description: "Cho phép xem chi tiết đánh giá",
  },
  {
    name: "reviews.hide",
    displayName: "Ẩn đánh giá",
    module: "reviews",
    description: "Cho phép ẩn đánh giá vi phạm",
  },
  {
    name: "reviews.delete",
    displayName: "Xóa đánh giá",
    module: "reviews",
    description: "Cho phép xóa đánh giá",
  },
  {
    name: "reviews.reply",
    displayName: "Trả lời đánh giá",
    module: "reviews",
    description: "Cho phép trả lời đánh giá",
  },
  {
    name: "reviews.export",
    displayName: "Xuất dữ liệu đánh giá",
    module: "reviews",
    description: "Cho phép xuất danh sách đánh giá",
  },

  // Module: BUSINESS (10 quyền)
  {
    name: "business.view",
    displayName: "Xem danh sách doanh nghiệp",
    module: "business",
    description: "Cho phép xem danh sách doanh nghiệp",
  },
  {
    name: "business.view_detail",
    displayName: "Xem chi tiết doanh nghiệp",
    module: "business",
    description: "Cho phép xem thông tin chi tiết doanh nghiệp",
  },
  {
    name: "business.approve",
    displayName: "Duyệt doanh nghiệp",
    module: "business",
    description: "Cho phép phê duyệt doanh nghiệp",
  },
  {
    name: "business.reject",
    displayName: "Từ chối doanh nghiệp",
    module: "business",
    description: "Cho phép từ chối doanh nghiệp",
  },
  {
    name: "business.edit",
    displayName: "Chỉnh sửa doanh nghiệp",
    module: "business",
    description: "Cho phép chỉnh sửa thông tin doanh nghiệp",
  },
  {
    name: "business.lock",
    displayName: "Khóa doanh nghiệp",
    module: "business",
    description: "Cho phép khóa tài khoản doanh nghiệp",
  },
  {
    name: "business.manage_services",
    displayName: "Quản lý dịch vụ",
    module: "business",
    description: "Cho phép quản lý dịch vụ của doanh nghiệp",
  },
  {
    name: "business.manage_vouchers",
    displayName: "Quản lý voucher",
    module: "business",
    description: "Cho phép quản lý voucher của doanh nghiệp",
  },
  {
    name: "business.view_revenue",
    displayName: "Xem doanh thu",
    module: "business",
    description: "Cho phép xem doanh thu doanh nghiệp",
  },
  {
    name: "business.export",
    displayName: "Xuất dữ liệu doanh nghiệp",
    module: "business",
    description: "Cho phép xuất danh sách doanh nghiệp",
  },

  // Module: REPORTS (5 quyền)
  {
    name: "reports.view",
    displayName: "Xem danh sách báo cáo",
    module: "reports",
    description: "Cho phép xem danh sách báo cáo",
  },
  {
    name: "reports.view_detail",
    displayName: "Xem chi tiết báo cáo",
    module: "reports",
    description: "Cho phép xem chi tiết báo cáo",
  },
  {
    name: "reports.resolve",
    displayName: "Xử lý báo cáo",
    module: "reports",
    description: "Cho phép xử lý báo cáo",
  },
  {
    name: "reports.reject",
    displayName: "Từ chối báo cáo",
    module: "reports",
    description: "Cho phép từ chối báo cáo",
  },
  {
    name: "reports.export",
    displayName: "Xuất dữ liệu báo cáo",
    module: "reports",
    description: "Cho phép xuất danh sách báo cáo",
  },

  // Module: SYSTEM (8 quyền)
  {
    name: "system.view_config",
    displayName: "Xem cấu hình hệ thống",
    module: "system",
    description: "Cho phép xem cấu hình hệ thống",
  },
  {
    name: "system.edit_config",
    displayName: "Chỉnh sửa cấu hình",
    module: "system",
    description: "Cho phép chỉnh sửa cấu hình hệ thống",
  },
  {
    name: "system.view_logs",
    displayName: "Xem audit logs",
    module: "system",
    description: "Cho phép xem nhật ký hoạt động",
  },
  {
    name: "system.manage_api_keys",
    displayName: "Quản lý API keys",
    module: "system",
    description: "Cho phép quản lý khóa API",
  },
  {
    name: "system.manage_banners",
    displayName: "Quản lý banner marketing",
    module: "system",
    description: "Cho phép quản lý banner quảng cáo",
  },
  {
    name: "system.send_notifications",
    displayName: "Gửi thông báo toàn hệ thống",
    module: "system",
    description: "Cho phép gửi thông báo đến tất cả người dùng",
  },
  {
    name: "system.view_analytics",
    displayName: "Xem thống kê hệ thống",
    module: "system",
    description: "Cho phép xem báo cáo thống kê",
  },
  {
    name: "system.export_data",
    displayName: "Xuất dữ liệu hệ thống",
    module: "system",
    description: "Cho phép xuất toàn bộ dữ liệu hệ thống",
  },

  // Module: CATEGORIES (5 quyền)
  {
    name: "categories.view",
    displayName: "Xem danh mục",
    module: "categories",
    description: "Cho phép xem danh sách danh mục",
  },
  {
    name: "categories.create",
    displayName: "Tạo danh mục",
    module: "categories",
    description: "Cho phép tạo danh mục mới",
  },
  {
    name: "categories.edit",
    displayName: "Chỉnh sửa danh mục",
    module: "categories",
    description: "Cho phép chỉnh sửa danh mục",
  },
  {
    name: "categories.delete",
    displayName: "Xóa danh mục",
    module: "categories",
    description: "Cho phép xóa danh mục",
  },
  {
    name: "categories.manage_tags",
    displayName: "Quản lý tags",
    module: "categories",
    description: "Cho phép quản lý tags của danh mục",
  },

  // Module: PAYMENTS (5 quyền)
  {
    name: "payments.view",
    displayName: "Xem danh sách thanh toán",
    module: "payments",
    description: "Cho phép xem danh sách thanh toán",
  },
  {
    name: "payments.view_detail",
    displayName: "Xem chi tiết thanh toán",
    module: "payments",
    description: "Cho phép xem chi tiết giao dịch",
  },
  {
    name: "payments.refund",
    displayName: "Hoàn tiền",
    module: "payments",
    description: "Cho phép hoàn tiền cho khách hàng",
  },
  {
    name: "payments.export",
    displayName: "Xuất dữ liệu thanh toán",
    module: "payments",
    description: "Cho phép xuất danh sách thanh toán",
  },
  {
    name: "payments.view_revenue",
    displayName: "Xem báo cáo doanh thu",
    module: "payments",
    description: "Cho phép xem báo cáo doanh thu chi tiết",
  },
];

async function seedPermissions() {
  try {
    console.log("🚀 Bắt đầu seed permissions...\n");

    // Insert permissions (skip duplicates)
    let insertedCount = 0;
    for (const permission of permissions) {
      try {
        await prisma.permission.create({
          data: permission,
        });
        insertedCount++;
      } catch (error) {
        // Skip if already exists (unique constraint)
        if (error.code === "P2002") {
          console.log(`⏭️  Bỏ qua: ${permission.name} (đã tồn tại)`);
        } else {
          throw error;
        }
      }
    }

    console.log(
      `\n✅ Đã thêm ${insertedCount}/${permissions.length} permissions mới`
    );

    // Verify
    const totalPermissions = await prisma.permission.count();
    console.log(`📊 Tổng số permissions trong DB: ${totalPermissions}\n`);

    // Get all permission IDs
    const allPermissions = await prisma.permission.findMany({
      select: { id: true, name: true },
    });

    const permissionMap = {};
    allPermissions.forEach((p) => {
      permissionMap[p.name] = p.id;
    });

    console.log("🔗 Bắt đầu gán quyền cho các vai trò...\n");

    // SUPER_ADMIN (roleId=1): TẤT CẢ quyền
    await assignPermissionsToRole(
      1,
      "Super Admin",
      Object.values(permissionMap)
    );

    // ADMIN (roleId=2): Loại trừ một số quyền nhạy cảm
    const adminExclude = [
      "users.delete",
      "users.change_role",
      "roles.manage_permissions",
      "system.edit_config",
      "system.manage_api_keys",
      "system.export_data",
    ];
    const adminPermissions = allPermissions
      .filter((p) => !adminExclude.includes(p.name))
      .map((p) => p.id);
    await assignPermissionsToRole(2, "Admin", adminPermissions);

    // BUSINESS (roleId=3): Chỉ quản lý data của mình
    const businessPermissions = [
      "places.view",
      "places.view_detail",
      "places.create",
      "places.edit",
      "places.delete",
      "places.manage_images",
      "places.manage_hours",
      "bookings.view",
      "bookings.view_detail",
      "bookings.confirm",
      "bookings.cancel",
      "bookings.complete",
      "bookings.export",
      "bookings.view_revenue",
      "reviews.view",
      "reviews.view_detail",
      "reviews.reply",
      "business.view_detail",
      "business.edit",
      "business.manage_services",
      "business.manage_vouchers",
      "business.view_revenue",
      "categories.view",
      "payments.view",
      "payments.view_detail",
      "payments.export",
      "payments.view_revenue",
    ]
      .map((name) => permissionMap[name])
      .filter(Boolean);
    await assignPermissionsToRole(3, "Business Owner", businessPermissions);

    // STAFF (roleId=4): Xử lý reports, ẩn reviews
    const staffPermissions = [
      "places.view",
      "places.view_detail",
      "reviews.view",
      "reviews.view_detail",
      "reviews.hide",
      "reports.view",
      "reports.view_detail",
      "reports.resolve",
      "reports.reject",
      "categories.view",
    ]
      .map((name) => permissionMap[name])
      .filter(Boolean);
    await assignPermissionsToRole(4, "Staff", staffPermissions);

    // GUEST (roleId=5): 0 quyền
    console.log("⚠️  Guest: 0 quyền (không có quyền truy cập admin)\n");

    // Final verification
    console.log("=== KIỂM TRA KẾT QUẢ ===\n");
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        _count: {
          select: { rolePermissions: true },
        },
      },
      orderBy: { id: "asc" },
    });

    roles.forEach((role) => {
      console.log(`${role.displayName}: ${role._count.rolePermissions} quyền`);
    });

    console.log("\n🎉 Seed hoàn tất thành công!");
  } catch (error) {
    console.error("❌ Lỗi khi seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function assignPermissionsToRole(roleId, roleName, permissionIds) {
  try {
    // Delete existing permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Insert new permissions
    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }

    console.log(`✅ ${roleName}: ${permissionIds.length} quyền`);
  } catch (error) {
    console.error(`❌ Lỗi khi gán quyền cho ${roleName}:`, error.message);
  }
}

seedPermissions();
