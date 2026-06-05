import { Platform, StyleSheet, View } from "react-native";
import { Circle, Marker } from "react-native-maps";
import Svg, { Defs, Path, RadialGradient, Stop } from "react-native-svg";

const DOT_SIZE = 22;
const CONE_SIZE = 100;

const getSectorPath = (cx, cy, r, angle) => {
  const startAngle = (-90 - angle / 2) * Math.PI / 180;
  const endAngle = (-90 + angle / 2) * Math.PI / 180;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
};

const getConeAngle = (accuracy) => {
  if (accuracy === undefined || accuracy === null) return 60;
  if (Platform.OS === "ios") {
    if (accuracy < 0) return 120;
    return Math.min(Math.max(accuracy * 1.8, 22), 120);
  }
  if (accuracy >= 0 && accuracy <= 3) {
    switch (accuracy) {
      case 3: return 24;
      case 2: return 50;
      case 1: return 85;
      case 0: return 120;
      default: return 60;
    }
  }
  if (accuracy < 0) return 120;
  return Math.min(Math.max(accuracy * 1.8, 22), 120);
};

const CurrentLocationMarker = ({ location, heading, headingAccuracy }) => {
  if (
    !location ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    return null;
  }

  const hasHeading =
    typeof heading === "number" && !Number.isNaN(heading) && heading >= 0;
  const coneAngle = getConeAngle(headingAccuracy);
  const cx = CONE_SIZE / 2;
  const coneRadius = cx - 4;

  return (
    <>
      {/* GPS accuracy circle */}
      <Circle
        center={location}
        radius={40}
        strokeWidth={1.5}
        strokeColor="rgba(66, 133, 244, 0.3)"
        fillColor="rgba(66, 133, 244, 0.1)"
        zIndex={1199}
      />

      {/* Heading cone — rotates with device heading */}
      {hasHeading ? (
        <Marker
          coordinate={location}
          anchor={{ x: 0.5, y: 0.5 }}
          rotation={heading}
          tracksViewChanges={false}
          zIndex={1200}
        >
          <View style={{ width: CONE_SIZE, height: CONE_SIZE }}>
            <Svg width={CONE_SIZE} height={CONE_SIZE} viewBox={`0 0 ${CONE_SIZE} ${CONE_SIZE}`}>
              <Defs>
                <RadialGradient id="cone" cx={cx} cy={cx} rx="50" ry="50" gradientUnits="userSpaceOnUse">
                  <Stop offset="0%" stopColor="#4285F4" stopOpacity="0.45" />
                  <Stop offset="60%" stopColor="#4285F4" stopOpacity="0.15" />
                  <Stop offset="100%" stopColor="#4285F4" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Path d={getSectorPath(cx, cx, coneRadius, coneAngle)} fill="url(#cone)" />
            </Svg>
          </View>
        </Marker>
      ) : null}

      {/* Blue dot */}
      <Marker
        coordinate={location}
        anchor={{ x: 0.5, y: 0.5 }}
        zIndex={1201}
      >
        <View style={styles.dotOuter}>
          <View style={styles.dot} />
        </View>
      </Marker>
    </>
  );
};

const styles = StyleSheet.create({
  dotOuter: {
    width: DOT_SIZE + 6,
    height: DOT_SIZE + 6,
    borderRadius: (DOT_SIZE + 6) / 2,
    backgroundColor: "rgba(66, 133, 244, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: "#4285F4",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
});

export default CurrentLocationMarker;
