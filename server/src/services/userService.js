import prisma from "../config/prismaClient.js";
import { USER_STATUS, PAGINATION, ERROR_CODES } from "../config/constants.js";
import {
  idSchema,
  paginationSchema,
  createUserSchema,
  updateUserSchema,
} from "../models/index.js";

// =============================================================================
// LỚP LỖI TÙY CHỈNH
// =============================================================================

export class ServiceError extends Error {
  constructor(
    message,
    statusCode = 500,
    errorCode = ERROR_CODES.INTERNAL_ERROR
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

// LẤY DANH SÁCH NGƯỜI DÙNG

/**
 * Lấy danh sách users với phân trang
 * @param {Object} query - Query params từ request
 * @returns {Promise<Object>} - { users, pagination }
 */
export const getAllUsers = async (query = {}) => {
  // Validate và parse query params bằng Zod
  const { page, limit } = paginationSchema.parse(query);
  const skip = (page - 1) * Math.min(limit, PAGINATION.MAX_LIMIT);
  const take = Math.min(limit, PAGINATION.MAX_LIMIT);

  // Build where clause for search and filter
  const where = {
    deletedAt: null,
  };

  // Add search condition
  if (query.search && query.search.trim()) {
    where.OR = [
      { email: { contains: query.search.trim(), mode: "insensitive" } },
      {
        profile: {
          fullName: { contains: query.search.trim(), mode: "insensitive" },
        },
      },
    ];
  }

  // Add role filter
  if (query.roleId && !isNaN(Number(query.roleId))) {
    where.roleId = Number(query.roleId);
  }

  // Add status filter
  if (query.status && query.status.trim()) {
    where.status = query.status.trim();
  }

  // Truy vấn cơ sở dữ liệu
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        roleId: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        profile: {
          select: {
            fullName: true,
            phone: true,
            avatar: true,
            gender: true,
            address: true,
            dateOfBirth: true,
            provinceCode: true,
            districtCode: true,
          },
        },
        // KHÔNG select password
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
    }),
    prisma.user.count({
      where,
    }),
  ]);

  // Transform data to flatten profile
  const transformedUsers = users.map((user) => ({
    id: user.id,
    email: user.email,
    roleId: user.roleId,
    status: user.status,
    isActive: user.status === "active",
    emailVerified: user.emailVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    fullName: user.profile?.fullName || null,
    phone: user.profile?.phone || null,
    avatar: user.profile?.avatar || null,
    gender: user.profile?.gender || null,
    address: user.profile?.address || null,
    dateOfBirth: user.profile?.dateOfBirth || null,
    provinceCode: user.profile?.provinceCode || null,
    districtCode: user.profile?.districtCode || null,
  }));

  return {
    users: transformedUsers,
    total,
    totalPages: Math.ceil(total / take),
    pagination: {
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

// LẤY NGƯỜI DÙNG THEO ID

/**
 * Lấy user theo ID
 * @param {string|number} id - ID của user
 * @returns {Promise<Object>}
 * @throws {ServiceError} - Nếu không tìm thấy
 */
export const getUserById = async (id) => {
  // Validate ID bằng Zod
  const userId = idSchema.parse(id);

  // Truy vấn cơ sở dữ liệu
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      roleId: true,
      status: true,
      emailVerified: true,
      lastLoginAt: true,
      failedLoginCount: true,
      createdAt: true,
      updatedAt: true,
      // KHÔNG select password và deletedAt
    },
  });

  // Kiểm tra tồn tại
  if (!user) {
    throw new ServiceError(
      "Không tìm thấy người dùng",
      404,
      ERROR_CODES.NOT_FOUND
    );
  }

  return user;
};

// TẠO NGƯỜI DÙNG

export const createUser = async (userData) => {
  // Validate input bằng Zod (tự động trim, lowercase email)
  const validatedData = createUserSchema.parse(userData);
  const {
    email,
    password,
    roleId,
    fullName,
    phone,
    gender,
    dateOfBirth,
    address,
    provinceCode,
    districtCode,
  } = validatedData;

  // Kiểm tra email đã tồn tại
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new ServiceError(
      "Email đã được sử dụng",
      400,
      ERROR_CODES.DUPLICATE_ERROR
    );
  }

  // Hash password trước khi lưu
  const bcrypt = await import("bcrypt");
  const hashedPassword = await bcrypt.hash(password, 10);

  // Tạo user và profile trong transaction
  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        roleId,
        status: USER_STATUS.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        roleId: true,
        status: true,
        createdAt: true,
      },
    });

    // Create profile if profile fields exist
    const profileData = {
      fullName,
      phone,
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      address,
      provinceCode,
      districtCode,
    };

    // Remove undefined fields
    const cleanProfileData = Object.fromEntries(
      Object.entries(profileData).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(cleanProfileData).length > 0) {
      await tx.userProfile.create({
        data: {
          userId: user.id,
          ...cleanProfileData,
        },
      });
    }

    return user;
  });

  return newUser;
};

// CẬP NHẬT NGƯỜI DÙNG

/**
 * Cập nhật user
 * @param {string|number} id - ID user
 * @param {Object} updateData - Dữ liệu cần cập nhật
 * @returns {Promise<Object>}
 * @throws {ServiceError} - Nếu không tìm thấy user
 */
export const updateUser = async (id, updateData) => {
  // Validate ID bằng Zod
  const userId = idSchema.parse(id);

  // Validate update data bằng Zod
  const validatedData = updateUserSchema.parse(updateData);

  // Kiểm tra user tồn tại
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, deletedAt: true },
  });

  if (!existingUser || existingUser.deletedAt) {
    throw new ServiceError(
      "Không tìm thấy người dùng",
      404,
      ERROR_CODES.NOT_FOUND
    );
  }

  // Tách dữ liệu user và profile
  const {
    fullName,
    phone,
    gender,
    dateOfBirth,
    address,
    provinceCode,
    districtCode,
    password,
    ...userData
  } = validatedData;

  // Hash password nếu có
  if (password) {
    const bcrypt = await import("bcrypt");
    userData.password = await bcrypt.hash(password, 10);
  }

  // Cập nhật user và profile trong transaction
  const updatedUser = await prisma.$transaction(async (tx) => {
    // Update user table
    const user = await tx.user.update({
      where: { id: userId },
      data: userData,
      select: {
        id: true,
        email: true,
        roleId: true,
        status: true,
        updatedAt: true,
      },
    });

    // Update or create profile if profile fields exist
    const profileData = {
      fullName,
      phone,
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      address,
      provinceCode,
      districtCode,
    };

    // Remove undefined fields
    const cleanProfileData = Object.fromEntries(
      Object.entries(profileData).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(cleanProfileData).length > 0) {
      await tx.userProfile.upsert({
        where: { userId },
        update: cleanProfileData,
        create: {
          userId,
          ...cleanProfileData,
        },
      });
    }

    return user;
  });

  return updatedUser;
};

// XÓA NGƯỜI DÙNG

export const deleteUser = async (id) => {
  // Validate ID bằng Zod
  const userId = idSchema.parse(id);

  // Kiểm tra user tồn tại
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, deletedAt: true },
  });

  if (!existingUser) {
    throw new ServiceError(
      "Không tìm thấy người dùng",
      404,
      ERROR_CODES.NOT_FOUND
    );
  }

  if (existingUser.deletedAt) {
    throw new ServiceError(
      "Người dùng đã bị xóa trước đó",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const deletedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      status: USER_STATUS.INACTIVE,
    },
    select: {
      id: true,
      email: true,
      deletedAt: true,
    },
  });

  return deletedUser;
};
