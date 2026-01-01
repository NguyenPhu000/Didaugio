import express from "express";
import * as userController from "../controllers/userController.js";

const router = express.Router();

// User routes
router.get("/users", userController.getAllUsers);
router.post("/users", userController.createUser);
router.get("/users/:id", userController.getUserById);
router.put("/users/:id", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);

export default router;
