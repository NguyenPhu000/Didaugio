import express from "express";
import tripController from "../../controllers/trip/trip.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { validateBody } from "../../middlewares/validateSchema.js";
import {
  createTripSchema,
  updateTripSchema,
  addDestinationSchema,
  updateDestinationSchema,
  moveDestinationSchema,
  linkBookingToTripSchema,
  reorderTripStopsSchema,
  generateTripSchema,
  createTripShareSchema,
  accessTripShareSchema,
} from "../../models/index.js";

const router = express.Router();

router.post(
  "/bookings/:id/link-trip",
  authenticate,
  tripController.linkMyBookingToTrip,
);

router.get("/trips", authenticate, tripController.getMyTrips);
router.post(
  "/trips/generate",
  authenticate,
  validateBody(generateTripSchema),
  tripController.generateTrip,
);
router.post(
  "/trips",
  authenticate,
  validateBody(createTripSchema),
  tripController.createTrip,
);
router.post(
  "/trips/:tripId/bookings/:bookingId/link",
  authenticate,
  validateBody(linkBookingToTripSchema),
  tripController.linkBookingToTripPlan,
);
router.patch(
  "/trips/:tripId/stops/reorder",
  authenticate,
  validateBody(reorderTripStopsSchema),
  tripController.reorderTripStops,
);
router.patch(
  "/trips/:tripId/stops/:stopId/move",
  authenticate,
  validateBody(moveDestinationSchema),
  tripController.moveTripStop,
);

router.post(
  "/trips/:tripId/session",
  authenticate,
  tripController.syncTripSession,
);
router.get(
  "/trips/:tripId/session",
  authenticate,
  tripController.getTripSession,
);
router.delete(
  "/trips/:tripId/session",
  authenticate,
  tripController.endTripSession,
);
router.get("/trips/:id", authenticate, tripController.getTripDetail);
router.patch(
  "/trips/:id",
  authenticate,
  validateBody(updateTripSchema),
  tripController.updateTrip,
);
router.delete("/trips/:id", authenticate, tripController.deleteTrip);
router.post("/trips/:id/duplicate", authenticate, tripController.duplicateTrip);
router.post(
  "/trips/:id/stops",
  authenticate,
  validateBody(addDestinationSchema),
  tripController.addDestination,
);
router.delete(
  "/trips/:id/stops/:destId",
  authenticate,
  tripController.removeDestination,
);
router.patch(
  "/trips/:id/stops/:destId",
  authenticate,
  validateBody(updateDestinationSchema),
  tripController.updateDestination,
);
router.post(
  "/trips/:id/share",
  authenticate,
  validateBody(createTripShareSchema),
  tripController.createTripShare,
);
router.get("/trips/:id/share", authenticate, tripController.getTripShares);
router.post(
  "/shared-trip/:shareCode",
  validateBody(accessTripShareSchema),
  tripController.accessTripShare,
);
router.delete(
  "/trips/share/:shareId",
  authenticate,
  tripController.deleteTripShare,
);

export default router;
