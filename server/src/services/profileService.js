import prisma from "../config/prismaClient.js";
import { updateProfileSchema } from "../models/schemas/authSchema.js";

// PROFILE SERVICE
// Quản lý thông tin profile người dùng

class ServiceError extends Error {
  constructor(message, statusCode = 400, errorCode = "SERVICE_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

// =============================================================================
// GET PROFILE
// =============================================================================
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

// =============================================================================
// UPDATE PROFILE
// =============================================================================
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

  // Chuẩn bị data cho profile
  const profileData = {
    fullName: validated.fullName,
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

  let updatedProfile;

  if (user.profile) {
    // Update profile hiện có
    updatedProfile = await prisma.userProfile.update({
      where: { userId },
      data: profileData,
    });
  } else {
    // Tạo profile mới nếu chưa có
    updatedProfile = await prisma.userProfile.create({
      data: {
        userId,
        ...profileData,
      },
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

// =============================================================================
// UPDATE AVATAR
// =============================================================================
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

// =============================================================================
// UPDATE NOTIFICATION SETTINGS
// =============================================================================
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

// =============================================================================
// UPDATE TRAVEL PREFERENCES
// =============================================================================
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
