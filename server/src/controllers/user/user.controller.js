import * as userService from "../../services/user/user.service.js";

/**
 * [GET] /api/users
 * Lay danh sach users voi pagination
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const result = await userService.getAllUsers(req.query);

    return res.status(200).json({
      success: true,
      data: result,
      message: "Lay danh sach user thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [GET] /api/users/:id
 * Lay user theo ID
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);

    return res.status(200).json({
      success: true,
      data: user,
      message: "Lay thong tin user thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [POST] /api/users
 * Tao user moi
 */
export const createUser = async (req, res, next) => {
  try {
    const newUser = await userService.createUser(req.body);

    return res.status(201).json({
      success: true,
      data: newUser,
      message: "Tao user thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [PUT] /api/users/:id
 * Cap nhat user
 */
export const updateUser = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      data: updatedUser,
      message: "Cap nhat user thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [DELETE] /api/users/:id
 * Xoa mem user (soft delete)
 */
export const deleteUser = async (req, res, next) => {
  try {
    const deletedUser = await userService.deleteUser(req.params.id);

    return res.status(200).json({
      success: true,
      data: deletedUser,
      message: "Xoa user thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [PATCH] /api/users/:id/role
 * Cap nhat role cua user (chi Super Admin va Admin)
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { roleId } = req.body;
    const updatedUser = await userService.updateUserRole(
      req.params.id,
      roleId,
      req.user
    );

    return res.status(200).json({
      success: true,
      data: updatedUser,
      message: "Cap nhat vai tro thanh cong",
    });
  } catch (error) {
    next(error);
  }
};
