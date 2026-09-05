import prisma from "../../config/prismaClient.js";
import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";

const tagCountInclude = {
  _count: {
    select: { tags: true },
  },
};

const tagGroupNameConflictError = () =>
  new ServiceError(
    "Tên nhóm tag tiếng Việt đã tồn tại",
    409,
    ERROR_CODES.CONFLICT,
  );

const findActiveNameConflict = (nameVi, excludeId) =>
  prisma.tagGroup.findFirst({
    where: {
      nameVi: { equals: nameVi, mode: "insensitive" },
      isActive: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

export const getAllTagGroups = async () =>
  prisma.tagGroup.findMany({
    include: tagCountInclude,
    orderBy: [{ sortOrder: "asc" }, { nameVi: "asc" }],
  });

export const createTagGroup = async (data) => {
  const existing = await findActiveNameConflict(data.nameVi);
  if (existing) {
    throw tagGroupNameConflictError();
  }

  try {
    return await prisma.tagGroup.create({
      data: {
        slug: data.slug,
        nameVi: data.nameVi,
        nameEn: data.nameEn ?? null,
        sortOrder: data.sortOrder ?? 0,
        isActive: true,
      },
      include: tagCountInclude,
    });
  } catch (error) {
    if (error?.code === "P2002") throw tagGroupNameConflictError();
    throw error;
  }
};

export const updateTagGroup = async (id, data) => {
  const existing = await prisma.tagGroup.findUnique({
    where: { id },
    select: { id: true, nameVi: true, isActive: true },
  });
  if (!existing) {
    throw new ServiceError("Không tìm thấy nhóm tag", 404, ERROR_CODES.NOT_FOUND);
  }

  const nextNameVi = data.nameVi ?? existing.nameVi;
  const nextIsActive = data.isActive ?? existing.isActive;
  if (nextIsActive && (data.nameVi !== undefined || data.isActive === true)) {
    const conflict = await findActiveNameConflict(nextNameVi, id);
    if (conflict) {
      throw tagGroupNameConflictError();
    }
  }

  const updateData = {};
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.nameVi !== undefined) updateData.nameVi = data.nameVi;
  if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  try {
    return await prisma.tagGroup.update({
      where: { id },
      data: updateData,
      include: tagCountInclude,
    });
  } catch (error) {
    if (error?.code === "P2002") throw tagGroupNameConflictError();
    throw error;
  }
};

export const deleteTagGroup = async (id) => {
  const group = await prisma.tagGroup.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!group) {
    throw new ServiceError("Không tìm thấy nhóm tag", 404, ERROR_CODES.NOT_FOUND);
  }

  const tagCount = await prisma.placeTag.count({ where: { tagGroupId: id } });
  if (tagCount > 0) {
    throw new ServiceError(
      "Không thể xóa nhóm tag vì vẫn còn tag liên kết",
      409,
      ERROR_CODES.CONFLICT,
    );
  }

  try {
    await prisma.tagGroup.delete({ where: { id } });
  } catch (error) {
    if (error?.code === "P2003") {
      throw new ServiceError(
        "Không thể xóa nhóm tag vì vẫn còn tag liên kết",
        409,
        ERROR_CODES.CONFLICT,
      );
    }
    throw error;
  }
  return { success: true, message: "Xóa nhóm tag thành công" };
};

export default {
  getAllTagGroups,
  createTagGroup,
  updateTagGroup,
  deleteTagGroup,
};
