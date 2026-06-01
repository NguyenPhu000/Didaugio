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
    
  const title = trip?.title || "Hành trình mới";
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
  if (trip?.status === "cancelled") {
    countdownText = "ĐÃ HỦY";
  } else if (trip?.status === "completed") {
    countdownText = "ĐÃ KẾT THÚC";
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (trip?.endDate) {
      const endObj = new Date(trip.endDate);
      if (!Number.isNaN(endObj.getTime())) {
        endObj.setHours(0, 0, 0, 0);
        if (endObj < today) {
          countdownText = "ĐÃ KẾT THÚC";
        }
      }
    }
    
    if (countdownText !== "ĐÃ KẾT THÚC" && trip?.startDate) {
      const startObj = new Date(trip.startDate);
      if (!Number.isNaN(startObj.getTime())) {
        startObj.setHours(0, 0, 0, 0);
        const diff = Math.round((startObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 1) countdownText = `CÒN ${diff} NGÀY`;
        else if (diff === 1) countdownText = "NGÀY MAI";
        else if (diff === 0) countdownText = "HÔM NAY";
        else if (diff < 0) countdownText = "ĐANG DIỄN RA";
      }
    }
  }

  const shadowStyle = {
    textShadowColor: "rgba(0, 0, 0, 0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  };

  return (
    <Pressable
      onPress={onPress}
      className="h-[220px] rounded-[20px] overflow-hidden bg-white shadow-md elevation-3 relative"
    >
      <Image
        source={{ uri: coverImage }}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, width: "100%", height: "100%" }}
        contentFit="cover"
      />
      
      <LinearGradient
        colors={["transparent", "rgba(15, 23, 42, 0.75)"]}
        className="absolute inset-0"
      />

      <View className="absolute top-4 right-4 bg-[#10B981] rounded-full px-3 py-1">
        <Text className="text-white text-[13px] font-semibold">{countdownText}</Text>
      </View>

      <View className="absolute bottom-14 left-5">
        <Text
          className="text-[22px] font-semibold text-white"
          numberOfLines={1}
          style={shadowStyle}
        >
          {title}
        </Text>
        <Text
          className="text-[15px] text-white font-medium mt-0.5"
          numberOfLines={1}
          style={shadowStyle}
        >
          {destination}{duration ? ` • ${duration}` : ""}
        </Text>
      </View>

      <View className="absolute bottom-4 left-5 right-5 flex-row justify-between items-end">
        <MaterialIcons name="airplane-ticket" size={28} color="#fff" />

        {duration ? (
          <View className="bg-white/20 rounded-full px-3 py-1 border border-white/30">
            <Text className="text-xs font-semibold text-white">{duration}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
