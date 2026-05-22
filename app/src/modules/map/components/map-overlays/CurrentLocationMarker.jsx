import { memo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Circle, Marker } from "react-native-maps";

const ACCURACY_RADIUS = 50;
const AVATAR_SIZE = 32;
const CONTAINER_SIZE = 70;
const ARROW_OFFSET = 10;

const CurrentLocationMarker = memo(function CurrentLocationMarker({
  location,
  avatarUri,
  heading,
}) {
  if (
    !location ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    return null;
  }

  const hasHeading = Number.isFinite(heading);
  const halfContainer = CONTAINER_SIZE / 2;

  return (
    <>
      <Circle
        center={location}
        radius={ACCURACY_RADIUS}
        strokeWidth={1}
        strokeColor="rgba(66, 133, 244, 0.25)"
        fillColor="rgba(66, 133, 244, 0.12)"
        zIndex={1199}
      />

      {/* Heading arrow — rotates around the avatar */}
      {hasHeading ? (
        <Marker
          coordinate={location}
          anchor={{ x: 0.5, y: 0.5 }}
          rotation={heading}
          tracksViewChanges={true}
          zIndex={1202}
        >
          <View
            style={[
              styles.headingContainer,
              { width: CONTAINER_SIZE, height: CONTAINER_SIZE },
            ]}
          >
            <View
              style={[
                styles.headingArrow,
                { top: halfContainer - ARROW_OFFSET - 12 },
              ]}
            />
          </View>
        </Marker>
      ) : null}

      {/* Avatar — stays fixed, never rotates */}
      <Marker coordinate={location} anchor={{ x: 0.5, y: 0.5 }} zIndex={1200}>
        <View style={styles.avatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarDot} />
          )}
        </View>
      </Marker>
    </>
  );
});

const styles = StyleSheet.create({
  headingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  headingArrow: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 24,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "rgba(59, 130, 246, 0.7)",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#93C5FD",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatarDot: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#3B82F6",
  },
});

export default CurrentLocationMarker;
