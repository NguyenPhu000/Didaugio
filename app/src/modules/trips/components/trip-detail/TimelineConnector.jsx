import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../../../constants/design-tokens";
import { formatDistance } from "../../utils/tripHelpers";

function getFriendlyTransportLabel(transport) {
  if (!transport) return null;
  const t = transport.toLowerCase();
  if (t.includes("walk") || t.includes("đi bộ")) return "Đi bộ";
  if (t.includes("bike") || t.includes("xe máy")) return "Xe máy";
  if (t.includes("bus") || t.includes("buýt")) return "Xe buýt";
  if (t.includes("car") || t.includes("xe hơi") || t === "xe") return "Xe hơi";
  return transport;
}

function TimelineConnector({ distanceToNext, transportToNext }) {
  if (!distanceToNext && !transportToNext) return null;

  const distanceText = distanceToNext ? formatDistance(distanceToNext) : null;
  const transportIcon = getTransportIcon(transportToNext);
  const friendlyTransport = getFriendlyTransportLabel(transportToNext);
  const parts = [distanceText, friendlyTransport].filter(Boolean);
  const label = parts.join(" · ");

  return (
    <View style={styles.connector}>
      <View style={styles.lineWrap}>
        <View style={styles.line} />
        <View style={styles.dotMid} />
        <View style={styles.line} />
      </View>
      {label ? (
        <View style={styles.labelWrap}>
          {transportIcon ? (
            <MaterialIcons
              name={transportIcon}
              size={12}
              color="rgba(0,0,0,0.3)"
            />
          ) : null}
          <Text style={styles.labelText}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

function getTransportIcon(transport) {
  if (!transport) return null;
  const t = transport.toLowerCase();
  if (t.includes("walk") || t.includes("đi bộ")) return "directions-walk";
  if (t.includes("bike") || t.includes("xe máy")) return "motorcycle";
  if (t.includes("bus") || t.includes("buýt")) return "directions-bus";
  if (t.includes("car") || t.includes("xe hơi") || t.includes("xe")) return "directions-car";
  return "swap-vert";
}

const styles = StyleSheet.create({
  connector: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    paddingVertical: 2,
    gap: 10,
  },
  lineWrap: {
    alignItems: "center",
    gap: 0,
  },
  line: {
    width: 1.5,
    height: 12,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  dotMid: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.12)",
    marginVertical: 2,
  },
  labelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.03)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  labelText: {
    fontSize: 11,
    color: "rgba(0,0,0,0.4)",
    fontFamily: TOKENS.font.body,
    letterSpacing: -0.1,
  },
});

export default memo(TimelineConnector);
