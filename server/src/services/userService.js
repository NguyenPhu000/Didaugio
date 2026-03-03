import prisma from "../config/prismaClient.js";
import {
  USER_STATUS,
  PAGINATION,
  ROLES,
  ROLE_HIERARCHY,
} from "../config/constants.js";
import { ERROR_MESSAGES, ERROR_CODES } from "../config/messages.js";
import {
  idSchema,
  paginationSchema,
  createUserSchema,
  updateUserSchema,
} from "../models/index.js";

export class ServiceError extends Error {
  constructor(message, statusCode = 500, errorCode = ERROR_CODES.SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export const getAllUsers = async (query = {}) => {
  const { page, limit } = paginationSchema.parse(query);
  const skip = (page - 1) * Math.min(limit, PAGINATION.MAX_LIMIT);
  const take = Math.min(limit, PAGINATION.MAX_LIMIT);

  const where = {
    deletedAt: null,
  };

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

  if (query.roleId && !isNaN(Number(query.roleId))) {
    where.roleId = Number(query.roleId);
  }

  if (query.status && query.status.trim()) {
    where.status = query.status.trim();
  }

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
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  const transformedUsers = users.map((user) => ({
    id: user.id,
    email: user.email,
    roleId: user.roleId,
    status: user.status,
    isActive: user.status === USER_STATUS.ACTIVE,
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

export const getUserById = async (id) => {
  const userId = idSchema.parse(id);

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
    },
  });

  if (!user) {
    throw new ServiceError(
      ERROR_MESSAGES.NOT_FOUND,
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  return user;
};

export const createUser = async (userData) => {
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

  if (roleId === ROLES.USER || roleId === ROLES.GUEST) {
    throw new ServiceError(
      "USER/GUEST role cannot be created via web admin",
      400,
      "ROLE_CREATION_NOT_ALLOWED",
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new ServiceError(ERROR_MESSAGES.EXISTED, 400, ERROR_CODES.EXISTED);
  }

  const bcrypt = await import("bcrypt");
  const hashedPassword = await bcrypt.hash(password, 10);

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

    const profileData = {
      fullName,
      phone,
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      address,
      provinceCode,
      districtCode,
    };

    const cleanProfileData = Object.fromEntries(
      Object.entries(profileData).filter(([_, v]) => v !== undefined),
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

export const updateUser = async (id, updateData) => {
  const userId = idSchema.parse(id);
  const validatedData = updateUserSchema.parse(updateData);

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, deletedAt: true },
  });

  if (!existingUser || existingUser.deletedAt) {
    throw new ServiceError(
      ERROR_MESSAGES.NOT_FOUND,
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

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

  if (password) {
    const bcrypt = await import("bcrypt");
    userData.password = await bcrypt.hash(password, 10);
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
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

    const profileData = {
      fullName,
      phone,
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      address,
      provinceCode,
      districtCode,
    };

    const cleanProfileData = Object.fromEntries(
      Object.entries(profileData).filter(([_, v]) => v !== undefined),
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

export const deleteUser = async (id) => {
  const userId = idSchema.parse(id);

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, deletedAt: true },
  });

  if (!existingUser) {
    throw new ServiceError(
      ERROR_MESSAGES.NOT_FOUND,
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  if (existingUser.deletedAt) {
    throw new ServiceError(
      "Người dùng đã bị xóa trước đó",
      400,
      ERROR_CODES.VALIDATION_ERROR,
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

export const updateUserRole = async (userId, newRoleId, currentUser) => {
  const validUserId = idSchema.parse(userId);
  const validRoleId = idSchema.parse(newRoleId);

  const targetUser = await prisma.user.findUnique({
    where: { id: validUserId },
    select: {
      id: true,
      email: true,
      roleId: true,
      status: true,
      profile: {
        select: {
          fullName: true,
        },
      },
    },
  });

  if (!targetUser) {
    throw new ServiceError(
      ERROR_MESSAGES.NOT_FOUND,
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  const newRole = await prisma.role.findUnique({
    where: { id: validRoleId },
    select: { id: true, name: true, displayName: true },
  });

  if (!newRole) {
    throw new ServiceError(
      ERROR_MESSAGES.NOT_FOUND,
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  // Check hierarchy
  const currentRole = ROLE_HIERARCHY[currentUser.roleId];
  if (!currentRole.canManage.includes(validRoleId)) {
    throw new ServiceError(
      ERROR_MESSAGES.FORBIDDEN,
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: validUserId },
    data: {
      roleId: validRoleId,
    },
    select: {
      id: true,
      email: true,
      roleId: true,
      status: true,
      role: {
        select: {
          id: true,
          name: true,
          displayName: true,
          description: true,
        },
      },
      profile: {
        select: {
          fullName: true,
          avatar: true,
        },
      },
    },
  });

  return updatedUser;
};
