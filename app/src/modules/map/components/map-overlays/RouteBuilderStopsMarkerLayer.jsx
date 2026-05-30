import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import { TOKENS } from "../../../../constants/design-tokens";

const RouteBuilderStopsMarkerLayer = memo(
  function RouteBuilderStopsMarkerLayer({ stops }) {
    if (!Array.isArray(stops) || stops.length === 0) return null;

    return stops.map((stop, index) => {
      if (
        !Number.isFinite(stop?.latitude) ||
        !Number.isFinite(stop?.longitude)
      ) {
        return null;
      }

      return (
        <Marker
          key={`route-builder-stop-${stop.id}`}
          coordinate={{
            latitude: Number(stop.latitude),
            longitude: Number(stop.longitude),
          }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          zIndex={1400}
        >
          <View style={styles.stopMarker}>
            <Text
              style={[
                styles.stopMarkerText,
                {
                  fontFamily: TOKENS.font.semibold,
                },
              ]}
            >
              {index + 1}
            </Text>
          </View>
        </Marker>
      );
    });
  },
);

const styles = StyleSheet.create({
  stopMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  stopMarkerText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
});

export default RouteBuilderStopsMarkerLayer;
