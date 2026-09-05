import { resolveTripCoverUri } from "../../../lib/media-url";

export function getTripSelectorItemViewModel(trip) {
  const title =
    trip?.title ||
    trip?.name ||
    (trip?.id != null ? `Trip #${trip.id}` : "Trip");

  return {
    title,
    thumbnail: resolveTripCoverUri(trip, 160),
    destinationCount: Array.isArray(trip?.destinations)
      ? trip.destinations.length
      : 0,
  };
}
