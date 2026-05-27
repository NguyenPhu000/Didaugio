import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../../constants/design-tokens";

export function UpcomingTripCard({ trip, onPress }) {
  const coverImage =
    trip?.thumbnail ||
    trip?.destinations?.[0]?.place?.thumbnail ||
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4";
    
  const title = trip?.name || "Hành trình mới";
  const destination = trip?.destinations?.[0]?.place?.address || trip?.destinations?.[0]?.place?.name || "Chưa xác định";

  let duration = "";
  if (trip?.startDate && trip?.endDate) {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (days > 0) duration = `${days} Ngày`;
    }
  }

  let countdownText = "ĐANG DIỄN RA";
  if (trip?.startDate) {
    const startObj = new Date(trip.startDate);
    if (!Number.isNaN(startObj.getTime())) {
      startObj.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diff = Math.round((startObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 1) countdownText = `CÒN ${diff} NGÀY`;
      else if (diff === 1) countdownText = "NGÀY MAI";
      else if (diff === 0) countdownText = "HÔM NAY";
    }
  }

  return (
    <Pressable onPress={onPress} style={styles.upcomingCard}>
      <Image source={{ uri: coverImage }} style={styles.cardImage} contentFit="cover" />
      
      <LinearGradient
        colors={["transparent", "rgba(15, 23, 42, 0.75)"]}
        style={styles.cardGradient}
      />

      <View style={styles.daysBadge}>
        <Text style={styles.daysBadgeText}>{countdownText}</Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.tripTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.tripSubtitle} numberOfLines={1}>
          {destination}{duration ? ` • ${duration}` : ""}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <MaterialIcons name="airplane-ticket" size={28} color="#fff" />
        
        <View style={styles.avatarsWrapper}>
          <View style={styles.avatarStack}>
            <View style={[styles.miniAvatar, { zIndex: 3 }]}>
              <Image source={{ uri: "https://i.pravatar.cc/32?img=1" }} style={styles.miniAvatarImg} />
            </View>
            <View style={[styles.miniAvatar, { zIndex: 2, left: -12 }]}>
              <Image source={{ uri: "https://i.pravatar.cc/32?img=2" }} style={styles.miniAvatarImg} />
            </View>
            <View style={[styles.miniAvatar, { zIndex: 1, left: -24 }]}>
              <Image source={{ uri: "https://i.pravatar.cc/32?img=3" }} style={styles.miniAvatarImg} />
            </View>
          </View>
          <View style={styles.moreAvatarsPill}>
            <Text style={styles.moreAvatarsText}>+2</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  upcomingCard: {
    height: 220,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardImage: { ...StyleSheet.absoluteFillObject },
  cardGradient: { ...StyleSheet.absoluteFillObject },
  daysBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#10B981",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  daysBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
  cardContent: {
    position: "absolute",
    bottom: 56,
    left: 20,
  },
  tripTitle: {
    fontSize: 22,
    fontFamily: TOKENS.font.semibold,
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  tripSubtitle: {
    fontSize: 15,
    color: "#fff",
    fontFamily: TOKENS.font.medium,
    marginTop: 2,
    textShadowColor: "rgba(0, 0, 0, 0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  cardFooter: {
    position: "absolute",
    bottom: 16,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  avatarsWrapper: { flexDirection: "row", alignItems: "center" },
  avatarStack: { flexDirection: "row", position: "relative", width: 68 },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#fff",
  },
  miniAvatarImg: { width: "100%", height: "100%", borderRadius: 999 },
  moreAvatarsPill: {
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: -8,
  },
  moreAvatarsText: { fontSize: 12, fontFamily: TOKENS.font.semibold, color: "#0F172A" },
});
