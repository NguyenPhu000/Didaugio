import express from "express";
import profileController from "../controllers/profileController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, profileController.getProfile);
router.get("/summary", authenticate, profileController.getProfileSummary);

router.put("/", authenticate, profileController.updateProfile);
router.put("/avatar", authenticate, profileController.updateAvatar);

router.put(
  "/notifications",
  authenticate,
  profileController.updateNotificationSettings,
);

router.put(
  "/travel-preferences",
  authenticate,
  profileController.updateTravelPreferences,
);

router.get("/saved-places", authenticate, profileController.getSavedPlaces);
router.post("/saved-places/:placeId", authenticate, profileController.savePlace);
router.delete("/saved-places/:placeId", authenticate, profileController.unsavePlace);

router.get("/trips", authenticate, profileController.getMyTrips);
router.post("/trips/generate", authenticate, profileController.generateTrip);

export default router;
