import { Router } from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { ROLES } from "../../config/constants.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import { validateBody, validateQuery } from "../../middlewares/validateSchema.js";
import {
  aiDraftUpdateSchema,
  aiKillSwitchSchema,
  aiLogsQuerySchema,
  aiPublishSchema,
  aiRollbackSchema,
  aiTestRequestSchema,
} from "../../models/schemas/adminAi/index.js";
import * as controller from "../../controllers/adminAi/index.js";

const router = Router();

const requireAdminAiRole = (req, res, next) => {
  if (req.user?.roleId === ROLES.SUPER_ADMIN || req.user?.roleId === ROLES.ADMIN) {
    return next();
  }
  return res.status(403).json({
    success: false,
    data: null,
    message: "Admin access is required.",
    errorCode: "FORBIDDEN",
  });
};

router.use(authenticate);
router.use(requireAdminAiRole);
router.get("/overview", hasPermission("ai.view"), controller.getOverview);
router.get("/config", hasPermission("ai.view"), controller.getConfig);
router.put("/config/draft", hasPermission("ai.config.manage"), validateBody(aiDraftUpdateSchema), controller.saveDraft);
router.post("/config/test", hasPermission("ai.test.run"), validateBody(aiTestRequestSchema), controller.testConfig);
router.post("/config/publish", hasPermission("ai.config.publish"), validateBody(aiPublishSchema), controller.publishConfig);
router.post("/config/rollback", hasPermission("ai.config.publish"), validateBody(aiRollbackSchema), controller.rollbackConfig);
router.put("/kill-switch", hasPermission("ai.kill_switch.manage"), validateBody(aiKillSwitchSchema), controller.updateKillSwitch);
router.get("/logs", hasPermission("ai.logs.view"), validateQuery(aiLogsQuerySchema), controller.getLogs);

export default router;
