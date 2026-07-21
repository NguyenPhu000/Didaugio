import prisma from "../../config/prismaClient.js";
import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";

const tagCountInclude = {
  _count: {
    select: { tags: true },
  },
};

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
    throw new ServiceError(
      "Tên nhóm tag tiếng Việt đã tồn tại",
      409,
      ERROR_CODES.CONFLICT,
    );
  }

  return prisma.tagGroup.create({
    data: {
      slug: data.slug,
      nameVi: data.nameVi,
      nameEn: data.nameEn ?? null,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
    },
    include: tagCountInclude,
  });
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
      throw new ServiceError(
        "Tên nhóm tag tiếng Việt đã tồn tại",
        409,
        ERROR_CODES.CONFLICT,
      );
    }
  }

  const updateData = {};
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.nameVi !== undefined) updateData.nameVi = data.nameVi;
  if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  return prisma.tagGroup.update({
    where: { id },
    data: updateData,
    include: tagCountInclude,
  });
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

  await prisma.tagGroup.delete({ where: { id } });
  return { success: true, message: "Xóa nhóm tag thành công" };
};

export default {
  getAllTagGroups,
  createTagGroup,
  updateTagGroup,
  deleteTagGroup,
};
