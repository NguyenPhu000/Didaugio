import { memo, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Circle, Marker } from "react-native-maps";

/**
 * REFACTORED CURRENT LOCATION MARKER
 * Designed to mimic Google Maps precisely while solving Android clipping issues.
 */
const CurrentLocationMarker = memo(function CurrentLocationMarker({
  location,
  nickname,
}) {
  const [trackChanges, setTrackChanges] = useState(true);

  // Robust tracksViewChanges management
  useEffect(() => {
    setTrackChanges(true);
    const timer = setTimeout(() => {
      setTrackChanges(false);
    }, 1000); // 1s is safer for all devices to complete layout/font rendering
    return () => clearTimeout(timer);
  }, [nickname]);

  if (
    !location ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    return null;
  }

  const trimmedNickname =
    typeof nickname === "string" && nickname.trim() ? nickname.trim() : "";
  const label =
    trimmedNickname.length > 18
      ? `${trimmedNickname.slice(0, 15)}...`
      : trimmedNickname;

  return (
    <>
      <Circle
        center={location}
        radius={50}
        strokeWidth={1}
        strokeColor="rgba(66, 133, 244, 0.25)"
        fillColor="rgba(66, 133, 244, 0.12)"
        zIndex={1199}
      />
      <Marker
        coordinate={location}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={trackChanges}
        zIndex={1200}
      >
        {/* 
            BALANCED CONTAINER:
            To keep the blue dot at the exact coordinate with anchor 0.5, 0.5,
            we create a vertical stack where the top has the label and the bottom 
            has an equal amount of empty space.
        */}
        <View style={styles.container}>
          {/* TOP SECTION: Label */}
          <View style={styles.labelContainer}>
            {label ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            ) : null}
          </View>

          {/* CENTER SECTION: The Blue Dot (The actual GPS point) */}
          <View style={styles.dotWrapper}>
            {/* Outer soft glow */}
            <View style={styles.glowLarge} />
            {/* Inner pulsing-style halo */}
            <View style={styles.glowSmall} />
            {/* White border circle */}
            <View style={styles.dotBorder}>
              {/* Blue core */}
              <View style={styles.dotCore} />
            </View>
          </View>

          {/* BOTTOM SECTION: Empty spacer to balance the label height */}
          <View style={styles.labelContainer} />
        </View>
      </Marker>
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    // Large enough bounds to never clip
    width: 160,
    height: 120,
  },
  labelContainer: {
    height: 35, // Fixed height for balance
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  badge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(66, 133, 244, 0.3)",
    // High-end shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    marginBottom: 4,
  },
  badgeText: {
    color: "#1A73E8",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  dotWrapper: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  glowLarge: {
    position: "absolute",
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(66, 133, 244, 0.15)",
  },
  glowSmall: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(66, 133, 244, 0.3)",
  },
  dotBorder: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    // Sharp shadow for the dot itself
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  dotCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1A73E8",
  },
});

export default CurrentLocationMarker;
