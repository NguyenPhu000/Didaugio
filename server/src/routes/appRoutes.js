import express from "express";
import appController from "../controllers/appController.js";
import {
  authenticate,
  authenticateOptional,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public / Guest routes
router.get("/home", appController.getHome);
router.get("/services", appController.getServices);
router.get("/places", appController.searchPlaces);
router.get("/places/:id", authenticateOptional, appController.getPlaceDetail);
router.get("/places/:id/reviews", appController.getPlaceReviews);

// User interaction routes (require login)
router.post("/places/:id/reviews", authenticate, appController.createReview);
router.get("/me/profile", authenticate, appController.getMyProfile);
router.get("/me/saved-places", authenticate, appController.getMySavedPlaces);
router.post("/me/saved-places/:placeId", authenticate, appController.savePlace);
router.delete(
  "/me/saved-places/:placeId",
  authenticate,
  appController.unsavePlace,
);
router.get("/me/trips", authenticate, appController.getMyTrips);
router.post("/me/trips/generate", authenticate, appController.generateTrip);

// Feedback allows both guest and logged-in users
router.post("/feedback", authenticateOptional, appController.submitFeedback);

export default router;
