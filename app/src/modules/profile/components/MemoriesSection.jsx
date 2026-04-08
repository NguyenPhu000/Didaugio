import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../../constants/design-tokens";

export function MemoriesSection({ completedTrips }) {
  if (!completedTrips || completedTrips.length === 0) {
    return (
      <View style={[styles.memoriesContainer, { alignItems: "center", paddingVertical: 32 }]}>
        <MaterialIcons name="photo-library" size={32} color="#CBD5E1" />
        <Text style={{ marginTop: 12, fontSize: 14, color: "#64748B", fontFamily: TOKENS.font.medium }}>
          Bạn chưa có kỷ niệm nào
        </Text>
      </View>
    );
  }

  const mem1 = completedTrips[0];
  const mem2 = completedTrips[1];
  const extraCount = Math.max(0, completedTrips.length - 2);

  const memory1 = {
    title: mem1?.name || "Hành trình",
    date: mem1?.endDate
      ? new Date(mem1.endDate).toLocaleDateString("vi-VN", { month: "long", year: "numeric" }).toUpperCase()
      : "",
    image:
      mem1?.thumbnail ||
      mem1?.destinations?.[0]?.place?.thumbnail ||
      "https://images.unsplash.com/photo-1527668752968-14ce70a6a7ae",
  };

  const memory2 = mem2
    ? {
        title: mem2?.name || "Hành trình",
        image:
          mem2?.thumbnail ||
          mem2?.destinations?.[0]?.place?.thumbnail ||
          "https://images.unsplash.com/photo-1542051812871-757511640570",
      }
    : null;

  return (
    <View style={styles.memoriesContainer}>
      <View style={styles.memoriesRow}>
        {/* Left Card */}
        <View style={styles.memoryCardLeft}>
          <Image source={{ uri: memory1.image }} style={styles.memoryImage} contentFit="cover" />
          <LinearGradient
            colors={["transparent", "rgba(15, 23, 42, 0.7)"]}
            style={styles.memoryGradient}
          />
          <View style={styles.memoryTextContainer}>
            <Text style={styles.memoryTitle} numberOfLines={2}>{memory1.title}</Text>
            {memory1.date ? <Text style={styles.memoryDate}>{memory1.date}</Text> : null}
          </View>
        </View>

        {/* Right column */}
        {memory2 ? (
          <View style={styles.memoriesRightColumn}>
            {/* Top Right Card */}
            <View style={styles.memoryCardRightTop}>
              <Image source={{ uri: memory2.image }} style={styles.memoryImage} contentFit="cover" />
              <LinearGradient
                colors={["transparent", "rgba(15, 23, 42, 0.7)"]}
                style={styles.memoryGradient}
              />
              <View style={styles.memoryTextContainer}>
                <Text style={styles.memoryTitle} numberOfLines={1}>{memory2.title}</Text>
              </View>
            </View>

            {/* +N More */}
            {extraCount > 0 ? (
              <Pressable style={styles.moreCard}>
                <LinearGradient
                  colors={["#3478F6", "#1E40AF"]}
                  style={styles.moreGradient}
                >
                  <Text style={styles.moreText}>+{extraCount} Nữa</Text>
                </LinearGradient>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  memoriesContainer: { marginTop: 8 },
  memoriesRow: {
    flexDirection: "row",
    gap: 12,
  },
  memoryCardLeft: {
    flex: 1,
    height: 220,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  memoryCardRightTop: {
    height: 104,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  memoryImage: { ...StyleSheet.absoluteFillObject },
  memoryGradient: { ...StyleSheet.absoluteFillObject },
  memoryTextContainer: {
    position: "absolute",
    bottom: 14,
    left: 16,
  },
  memoryTitle: {
    fontSize: 17,
    fontFamily: TOKENS.font.semibold,
    color: "#fff",
  },
  memoryDate: {
    fontSize: 13,
    color: "#fff",
    fontFamily: TOKENS.font.medium,
    marginTop: 2,
  },
  memoriesRightColumn: { flex: 1, justifyContent: "flex-start" },

  moreCard: {
    height: 104,
    borderRadius: 20,
    overflow: "hidden",
  },
  moreGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: {
    fontSize: 17,
    fontFamily: TOKENS.font.semibold,
    color: "#fff",
  },
});
