import express from "express";
import * as auditLogController from "../controllers/auditLogController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, auditLogController.getAll);

router.get("/:id", authenticate, auditLogController.getById);

export default router;
