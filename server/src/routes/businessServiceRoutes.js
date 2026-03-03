import express from "express";
import * as controller from "../controllers/businessServiceController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { checkBusinessOwnership } from "../middlewares/businessOwnership.js";
import { validateBody } from "../middlewares/validateSchema.js";
import { auditLog } from "../middlewares/auditLogMiddleware.js";
import {
  createServiceSchema,
  updateServiceSchema,
} from "../models/schemas/businessServiceSchema.js";

const router = express.Router();

router.use(authenticate);

router.get("/", controller.getAll);

router.get("/:id", controller.getById);

router.post(
  "/",
  validateBody(createServiceSchema),
  auditLog({
    action: "CREATE",
    tableName: "business_services",
    getRecordId: (req, body) => body?.data?.id,
    getNewData: (req) => ({ name: req.body.name, price: req.body.price }),
  }),
  controller.create,
);

router.put(
  "/:id",
  checkBusinessOwnership("service"),
  validateBody(updateServiceSchema),
  auditLog({
    action: "UPDATE",
    tableName: "business_services",
    getNewData: (req) => req.body,
  }),
  controller.update,
);

router.delete(
  "/:id",
  checkBusinessOwnership("service"),
  auditLog({
    action: "DELETE",
    tableName: "business_services",
  }),
  controller.remove,
);

export default router;
