import { memo } from "react";
import RoutePolyline from "../RoutePolyline";

const ActiveRouteLayer = memo(function ActiveRouteLayer({
  routeBuilderEnabled,
  routeBuilderRecoveryMode,
  routeBuilderRecoveryCoordinates,
  routeBuilderRecoverySource,
  routeBuilderLegVisuals,
  routeCoordinates,
  routeSource,
}) {
  if (routeBuilderEnabled) {
    if (
      routeBuilderRecoveryMode &&
      Array.isArray(routeBuilderRecoveryCoordinates) &&
      routeBuilderRecoveryCoordinates.length > 1
    ) {
      return (
        <RoutePolyline
          coordinates={routeBuilderRecoveryCoordinates}
          source={routeBuilderRecoverySource || "osrm"}
          strokeWidth={6}
          isPrimary
          dashed={routeBuilderRecoverySource === "fallback"}
          color="#DC2626"
          strokeOpacity={0.95}
        />
      );
    }

    if (
      !Array.isArray(routeBuilderLegVisuals) ||
      routeBuilderLegVisuals.length === 0
    ) {
      return null;
    }

    return routeBuilderLegVisuals.map((leg) => {
      if (leg.shouldHide) return null;
      return (
        <RoutePolyline
          key={leg.key}
          coordinates={leg.coordinates}
          geometry={leg.geometry}
          source={leg.source}
          strokeWidth={5}
          isPrimary
          dashed={leg.dashed}
          color={leg.color}
          strokeOpacity={leg.opacity}
        />
      );
    });
  }

  return (
    <RoutePolyline
      coordinates={routeCoordinates}
      source={routeSource || "osrm"}
      strokeWidth={5}
      isPrimary
      dashed={routeSource === "fallback"}
    />
  );
});

export default ActiveRouteLayer;
