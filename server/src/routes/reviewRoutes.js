import express from "express";
import * as controller from "../controllers/reviewController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", controller.getAll);
router.get("/stats", controller.getStats);
router.get("/:id", controller.getById);

router.post("/:id/reply", controller.reply);

export default router;
