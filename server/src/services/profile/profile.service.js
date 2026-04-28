import prisma from "../../config/prismaClient.js";
import { updateProfileSchema } from "../../models/index.js";
import ServiceError from "../../utils/serviceError.js";

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

export default {
  getProfile,
  updateProfile,
  updateAvatar,
  updateNotificationSettings,
  updateTravelPreferences,
};
