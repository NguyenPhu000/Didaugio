import * as tagGroupService from "../../services/tag/tagGroup.service.js";

export const getTagGroups = async (req, res, next) => {
  try {
    const groups = await tagGroupService.getAllTagGroups();
    res.json({
      success: true,
      data: groups,
      total: groups.length,
      message: "Lấy danh sách nhóm tag thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const createTagGroup = async (req, res, next) => {
  try {
    const group = await tagGroupService.createTagGroup(req.body);
    res.status(201).json({
      success: true,
      data: group,
      message: "Tạo nhóm tag thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const updateTagGroup = async (req, res, next) => {
  try {
    const group = await tagGroupService.updateTagGroup(req.params.id, req.body);
    res.json({
      success: true,
      data: group,
      message: "Cập nhật nhóm tag thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTagGroup = async (req, res, next) => {
  try {
    const result = await tagGroupService.deleteTagGroup(req.params.id);
    res.json({
      success: true,
      data: null,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
