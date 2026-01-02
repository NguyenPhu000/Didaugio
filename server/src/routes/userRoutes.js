import express from "express";
import * as userController from "../controllers/userController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";
import { checkRoleHierarchy } from "../middlewares/checkRoleHierarchy.js";

const router = express.Router();

// User routes
router.get("/users", authenticate, requirePermission("users.view"), userController.getAllUsers);
router.post("/users", authenticate, requirePermission("users.create"), userController.createUser);
router.get("/users/:id", authenticate, requirePermission("users.view"), userController.getUserById);
router.put("/users/:id", authenticate, requirePermission("users.update"), checkRoleHierarchy, userController.updateUser);
router.delete("/users/:id", authenticate, requirePermission("users.delete"), checkRoleHierarchy, userController.deleteUser);

// Route đặc biệt: cập nhật role (chỉ Super Admin và Admin)
router.patch("/users/:id/role", authenticate, requirePermission("roles.assign_to_users"), checkRoleHierarchy, userController.updateUserRole);

export default router;
