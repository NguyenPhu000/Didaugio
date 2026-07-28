import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";

import { resolveMediaUrl, resolvePlaceImageUri } from "../../../lib/media-url";

export function UpcomingTripCard({ trip, onPress }) {
  const coverImage = trip?.thumbnail
    ? resolveMediaUrl(trip.thumbnail)
    : (trip?.destinations?.[0]?.place
      ? resolvePlaceImageUri(trip.destinations[0].place)
      : "https://picsum.photos/id/408/600/400");
    
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
      className="h-[220px] rounded-[24px] overflow-hidden bg-[#0B0D12] border border-white/15 shadow-xl relative active:opacity-95"
    >
      <Image
        source={{ uri: coverImage }}
        className="absolute inset-0 w-full h-full"
        contentFit="cover"
        transition={250}
        cachePolicy="memory-disk"
      />
      
      {/* 3-stop Linear Gradient Overlay */}
      <LinearGradient
        colors={["transparent", "rgba(8, 9, 12, 0.45)", "rgba(8, 9, 12, 0.95)"]}
        locations={[0, 0.55, 1]}
        className="absolute inset-0 w-full h-full"
      />

      <View className="absolute top-4 right-4 bg-emerald-950/80 border border-emerald-400/40 rounded-full px-3 py-1">
        <Text className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider" style={{ fontVariant: ["tabular-nums"] }}>
          {countdownText}
        </Text>
      </View>

      <View className="absolute bottom-14 left-5 right-5">
        <Text
          className="text-[22px] font-bold text-white tracking-[-0.5px]"
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          className="text-[14px] text-cyan-200/90 font-medium mt-0.5"
          numberOfLines={1}
        >
          {destination}{duration ? ` • ${duration}` : ""}
        </Text>
      </View>

      <View className="absolute bottom-4 left-5 right-5 flex-row justify-between items-end">
        <MaterialIconsRounded name="airplane-ticket" size={24} color="#38BDF8" />

        {duration ? (
          <View className="bg-[#0B0D12]/80 rounded-full px-3 py-1 border border-white/20">
            <Text className="text-xs font-semibold text-white" style={{ fontVariant: ["tabular-nums"] }}>{duration}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
