import prisma from "../../config/prismaClient.js";
import crypto from "node:crypto";
import { idSchema, updateProfileSchema } from "../../models/index.js";
import ServiceError from "../../utils/serviceError.js";
import { invalidateUserCache } from "../../utils/permissionCache.js";
import { invalidateUserStatusCache } from "../../utils/userStatusCache.js";

export const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      profile: true,
    },
  });

  if (!user) {
    throw new ServiceError("User khong ton tai", 404, "USER_NOT_FOUND");
  }

  // Loại bỏ password
  const { password, ...userWithoutPassword } = user;

  return userWithoutPassword;
};

export const updateProfile = async (userId, data) => {
  // Validate input
  const validated = updateProfileSchema.parse(data);

  // Kiểm tra user tồn tại
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    throw new ServiceError("User khong ton tai", 404, "USER_NOT_FOUND");
  }

  if (validated.username !== undefined) {
    const existingUsername = await prisma.user.findFirst({
      where: {
        username: validated.username,
        id: { not: userId },
      },
      select: { id: true },
    });

    if (existingUsername) {
      throw new ServiceError(
        "Username da duoc su dung",
        400,
        "VALIDATION_ERROR",
      );
    }
  }

  const userData = {};
  if (validated.username !== undefined) {
    userData.username = validated.username;
  }

  // Chuẩn bị data cho profile
  const profileData = {
    fullName: validated.fullName,
    nickname: validated.nickname,
    phone: validated.phone,
    gender: validated.gender,
    address: validated.address,
    bio: validated.bio,
    provinceCode: validated.provinceCode,
    districtCode: validated.districtCode,
  };

  // Xử lý dateOfBirth nếu có
  if (validated.dateOfBirth) {
    profileData.dateOfBirth = new Date(validated.dateOfBirth);
  }

  // Loại bỏ các field undefined
  Object.keys(profileData).forEach((key) => {
    if (profileData[key] === undefined) {
      delete profileData[key];
    }
  });

  const hasUserUpdates = Object.keys(userData).length > 0;
  const hasProfileUpdates = Object.keys(profileData).length > 0;

  if (hasUserUpdates || hasProfileUpdates) {
    await prisma.$transaction(async (tx) => {
      if (hasUserUpdates) {
        await tx.user.update({
          where: { id: userId },
          data: userData,
        });
      }

      if (hasProfileUpdates) {
        await tx.userProfile.upsert({
          where: { userId },
          update: profileData,
          create: {
            userId,
            ...profileData,
          },
        });
      }
    });
  }

  // Lấy lại user với profile mới
  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      profile: true,
    },
  });

  const { password, ...userWithoutPassword } = updatedUser;

  return userWithoutPassword;
};

export const updateAvatar = async (userId, avatarUrl) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    throw new ServiceError("User khong ton tai", 404, "USER_NOT_FOUND");
  }

  let updatedProfile;

  if (user.profile) {
    updatedProfile = await prisma.userProfile.update({
      where: { userId },
      data: { avatar: avatarUrl },
    });
  } else {
    updatedProfile = await prisma.userProfile.create({
      data: {
        userId,
        avatar: avatarUrl,
      },
    });
  }

  return { avatar: updatedProfile.avatar };
};

export const updateNotificationSettings = async (userId, settings) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    throw new ServiceError("User khong ton tai", 404, "USER_NOT_FOUND");
  }

  let updatedProfile;

  if (user.profile) {
    updatedProfile = await prisma.userProfile.update({
      where: { userId },
      data: { notificationSettings: settings },
    });
  } else {
    updatedProfile = await prisma.userProfile.create({
      data: {
        userId,
        notificationSettings: settings,
      },
    });
  }

  return { notificationSettings: updatedProfile.notificationSettings };
};

export const updateTravelPreferences = async (userId, preferences) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    throw new ServiceError("User khong ton tai", 404, "USER_NOT_FOUND");
  }

  let updatedProfile;

  if (user.profile) {
    updatedProfile = await prisma.userProfile.update({
      where: { userId },
      data: { travelPreferences: preferences },
    });
  } else {
    updatedProfile = await prisma.userProfile.create({
      data: {
        userId,
        travelPreferences: preferences,
      },
    });
  }

  return { travelPreferences: updatedProfile.travelPreferences };
};

export const deleteMyAccount = async (rawUserId) => {
  const userId = idSchema.parse(rawUserId);
  const deletedAt = new Date();
  const deletedIdentity = `deleted-${userId}-${deletedAt.getTime()}`;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, roleId: true, business: { select: { id: true } } },
    });

    if (!user) return;
    if (user.business) {
      throw new ServiceError(
        "Tài khoản doanh nghiệp cần hoàn tất đóng hồ sơ doanh nghiệp trước khi xóa",
        409,
        "ACCOUNT_DELETION_REQUIRES_BUSINESS_CLOSURE",
      );
    }

    await tx.aiPromptHistory.deleteMany({ where: { userId } });
    await tx.reviewReply.deleteMany({ where: { userId } });
    await tx.review.deleteMany({ where: { userId } });
    await tx.eventParticipant.deleteMany({ where: { userId } });
    await tx.eventMoment.deleteMany({ where: { userId } });
    await tx.activeSession.deleteMany({ where: { userId } });
    await tx.userCheckin.deleteMany({ where: { userId } });
    await tx.savedTrip.deleteMany({ where: { userId } });
    await tx.tripExecutionOperation.deleteMany({ where: { userId } });
    await tx.tripExecutionSession.deleteMany({ where: { userId } });
    await tx.tripPlan.deleteMany({ where: { userId } });
    await tx.favorite.deleteMany({ where: { userId } });
    await tx.notificationRecipient.deleteMany({ where: { userId } });
    await tx.pushSubscription.deleteMany({ where: { userId } });
    await tx.userPermission.deleteMany({ where: { userId } });
    await tx.userSession.deleteMany({ where: { userId } });
    await tx.userProfile.deleteMany({ where: { userId } });
    await tx.passwordReset.deleteMany({ where: { userId } });
    await tx.emailVerification.deleteMany({ where: { userId } });

    await tx.user.update({
      where: { id: userId },
      data: {
        email: `${deletedIdentity}@deleted.invalid`,
        username: deletedIdentity,
        password: crypto.randomUUID(),
        status: "inactive",
        deletedAt,
        businessId: null,
        businessRoleId: null,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
  });

  invalidateUserCache(userId);
  await invalidateUserStatusCache(userId);
  return { userId };
};

export default {
  getProfile,
  updateProfile,
  updateAvatar,
  updateNotificationSettings,
  updateTravelPreferences,
  deleteMyAccount,
};
