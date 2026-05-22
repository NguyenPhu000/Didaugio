import express from "express";
import profileController from "../../controllers/profile/profile.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { validateBody } from "../../middlewares/validateSchema.js";
import { notificationSettingsSchema } from "../../models/index.js";

const router = express.Router();

router.get("/", authenticate, profileController.getProfile);
router.get("/summary", authenticate, profileController.getProfileSummary);

router.put("/", authenticate, profileController.updateProfile);
router.put("/avatar", authenticate, profileController.updateAvatar);

router.put(
  "/notifications",
  authenticate,
  validateBody(notificationSettingsSchema),
  profileController.updateNotificationSettings,
);

router.put(
  "/travel-preferences",
  authenticate,
  profileController.updateTravelPreferences,
);

router.get("/saved-places", authenticate, profileController.getSavedPlaces);
router.get(
  "/saved-collections",
  authenticate,
  profileController.getSavedCollections,
);
router.patch(
  "/saved-collections/:name",
  authenticate,
  profileController.renameSavedCollection,
);
router.delete(
  "/saved-collections/:name",
  authenticate,
  profileController.deleteSavedCollection,
);
router.post(
  "/saved-places/:placeId",
  authenticate,
  profileController.savePlace,
);
router.delete(
  "/saved-places/:placeId",
  authenticate,
  profileController.unsavePlace,
);

router.get("/saved-trips", authenticate, profileController.getSavedTrips);
router.post("/saved-trips/:tripId", authenticate, profileController.saveTrip);
router.delete(
  "/saved-trips/:tripId",
  authenticate,
  profileController.unsaveTrip,
);

router.get("/trips", authenticate, profileController.getMyTrips);
router.get("/bookings", authenticate, profileController.getMyBookings);
router.get("/bookings/:id", authenticate, profileController.getMyBookingDetail);
router.get("/bookings/:id/qr", authenticate, profileController.getMyBookingQR);
router.post(
  "/bookings/:id/link-trip",
  authenticate,
  profileController.linkMyBookingToTrip,
);
router.post("/trips/generate", authenticate, profileController.generateTrip);
router.post("/trips", authenticate, profileController.createTrip);
router.get("/trips/:id", authenticate, profileController.getTripDetail);
router.patch("/trips/:id", authenticate, profileController.updateTrip);
router.delete("/trips/:id", authenticate, profileController.deleteTrip);
router.post(
  "/trips/:id/destinations",
  authenticate,
  profileController.addDestination,
);
router.delete(
  "/trips/:id/destinations/:destId",
  authenticate,
  profileController.removeDestination,
);
router.patch(
  "/trips/:id/destinations/reorder",
  authenticate,
  profileController.reorderDestinations,
);
router.patch(
  "/trips/:id/destinations/:destId",
  authenticate,
  profileController.updateDestination,
);
router.patch(
  "/trips/:id/destinations/:destId/move",
  authenticate,
  profileController.moveDestination,
);

router.patch("/push-token", authenticate, profileController.updatePushToken);

export default router;
