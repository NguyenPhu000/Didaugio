import prisma from "../config/prismaClient.js";
import { USER_STATUS, PAGINATION, ERROR_CODES } from "../config/constants.js";
import {
  idSchema,
  paginationSchema,
  createUserSchema,
  updateUserSchema,
} from "../models/index.js";

// =============================================================================
// CUSTOM ERROR CLASS
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

// =============================================================================
// GET ALL USERS
// =============================================================================

/**
 * Lay danh sach users voi pagination
 * @param {Object} query - Query params tu request
 * @returns {Promise<Object>} - { users, pagination }
 */
export const getAllUsers = async (query = {}) => {
  // Validate va parse query params bang Zod
  const { page, limit } = paginationSchema.parse(query);
  const skip = (page - 1) * Math.min(limit, PAGINATION.MAX_LIMIT);
  const take = Math.min(limit, PAGINATION.MAX_LIMIT);

  // Query database
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        roleId: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        // KHONG select password
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
    }),
    prisma.user.count({
      where: {
        deletedAt: null,
      },
    }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

// =============================================================================
// GET USER BY ID
// =============================================================================

/**
 * Lay user theo ID
 * @param {string|number} id - ID cua user
 * @returns {Promise<Object>}
 * @throws {ServiceError} - Neu khong tim thay
 */
export const getUserById = async (id) => {
  // Validate ID bang Zod
  const userId = idSchema.parse(id);

  // Query database
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
      // KHONG select password va deletedAt
    },
  });

  // Kiem tra ton tai
  if (!user) {
    throw new ServiceError("Khong tim thay user", 404, ERROR_CODES.NOT_FOUND);
  }

  return user;
};

// =============================================================================
// CREATE USER
// =============================================================================

/**
 * Tao user moi
 * @param {Object} userData - Du lieu user tu request body
 * @returns {Promise<Object>}
 * @throws {ServiceError} - Neu email da ton tai
 */
export const createUser = async (userData) => {
  // Validate input bang Zod (tu dong trim, lowercase email)
  const { email, password, roleId } = createUserSchema.parse(userData);

  // Kiem tra email da ton tai
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new ServiceError(
      "Email da duoc su dung",
      400,
      ERROR_CODES.DUPLICATE_ERROR
    );
  }

  // Hash password truoc khi luu
  const bcrypt = await import("bcrypt");
  const hashedPassword = await bcrypt.hash(password, 10);

  // Tao user
  const newUser = await prisma.user.create({
    data: {
      email,
      password,
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

  return newUser;
};

// =============================================================================
// UPDATE USER
// =============================================================================

/**
 * Cap nhat user
 * @param {string|number} id - ID user
 * @param {Object} updateData - Du lieu can cap nhat
 * @returns {Promise<Object>}
 * @throws {ServiceError} - Neu khong tim thay user
 */
export const updateUser = async (id, updateData) => {
  // Validate ID bang Zod
  const userId = idSchema.parse(id);

  // Validate update data bang Zod (strict mode - chi cho phep fields da dinh nghia)
  const validatedData = updateUserSchema.parse(updateData);

  // Kiem tra user ton tai
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, deletedAt: true },
  });

  if (!existingUser || existingUser.deletedAt) {
    throw new ServiceError("Khong tim thay user", 404, ERROR_CODES.NOT_FOUND);
  }

  // Cap nhat user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: validatedData,
    select: {
      id: true,
      email: true,
      roleId: true,
      status: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

// =============================================================================
// DELETE USER (SOFT DELETE)
// =============================================================================

/**
 * Xoa mem user (soft delete)
 * @param {string|number} id - ID user
 * @returns {Promise<Object>}
 * @throws {ServiceError} - Neu khong tim thay user
 */
export const deleteUser = async (id) => {
  // Validate ID bang Zod
  const userId = idSchema.parse(id);

  // Kiem tra user ton tai
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, deletedAt: true },
  });

  if (!existingUser) {
    throw new ServiceError("Khong tim thay user", 404, ERROR_CODES.NOT_FOUND);
  }

  if (existingUser.deletedAt) {
    throw new ServiceError(
      "User da bi xoa truoc do",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Soft delete
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
