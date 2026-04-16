import { memo } from "react";
import { View } from "react-native";
import { Circle, Marker } from "react-native-maps";

const CurrentLocationMarker = memo(function CurrentLocationMarker({
  location,
}) {
  if (
    !location ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    return null;
  }

  return (
    <>
      <Circle
        center={location}
        radius={38}
        strokeWidth={1}
        strokeColor="rgba(37, 99, 235, 0.35)"
        fillColor="rgba(59, 130, 246, 0.16)"
      />
      <Marker
        coordinate={location}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={false}
        zIndex={1200}
      >
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(59, 130, 246, 0.25)",
            borderWidth: 1,
            borderColor: "rgba(37, 99, 235, 0.35)",
          }}
        >
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#2563EB",
              borderWidth: 2,
              borderColor: "#FFFFFF",
            }}
          />
        </View>
      </Marker>
    </>
  );
});

export default CurrentLocationMarker;
