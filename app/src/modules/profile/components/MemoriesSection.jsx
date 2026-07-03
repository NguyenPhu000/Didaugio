import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { resolveMediaUrl, resolvePlaceImageUri } from "../../../lib/media-url";
import { formatMonthYear } from "@/utils/dateFormat";

export function MemoriesSection({ completedTrips }) {
  const { t } = useTranslation();

  if (!completedTrips || completedTrips.length === 0) {
    return (
      <View className="mt-2 items-center py-8">
        <MaterialIconsRounded name="photo-library" size={32} color="#CBD5E1" />
        <Text className="mt-3 text-sm text-[#64748B] font-medium">
          {t("profile.memoriesSection.noMemories")}
        </Text>
      </View>
    );
  }

  const mem1 = completedTrips[0];
  const mem2 = completedTrips[1];
  const extraCount = Math.max(0, completedTrips.length - 2);

  const coverImage1 = mem1?.thumbnail
    ? resolveMediaUrl(mem1.thumbnail)
    : (mem1?.destinations?.[0]?.place
      ? resolvePlaceImageUri(mem1.destinations[0].place)
      : "https://picsum.photos/id/408/600/400");

  const memory1 = {
    title: mem1?.title || t("profile.memoriesSection.journey"),
    date: mem1?.endDate
      ? (formatMonthYear(mem1.endDate) || "").toUpperCase()
      : "",
    image: coverImage1,
  };

  const coverImage2 = mem2
    ? (mem2?.thumbnail
      ? resolveMediaUrl(mem2.thumbnail)
      : (mem2?.destinations?.[0]?.place
        ? resolvePlaceImageUri(mem2.destinations[0].place)
        : "https://picsum.photos/id/1040/600/400"))
    : null;

  const memory2 = mem2
    ? {
        title: mem2?.title || t("profile.memoriesSection.journey"),
        image: coverImage2,
      }
    : null;

  const shadowStyle = {
    textShadowColor: "rgba(0, 0, 0, 0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  };

  return (
    <View className="mt-2">
      <View className="flex-row gap-3">
        {/* Left Card */}
        <View className="flex-1 h-[220px] rounded-[20px] overflow-hidden bg-white shadow-sm elevation-2 relative">
          <Image
            source={{ uri: memory1.image }}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(15, 23, 42, 0.7)"]}
            className="absolute inset-0"
          />
          <View className="absolute bottom-3.5 left-4">
            <Text
              className="text-[17px] font-semibold text-white"
              numberOfLines={2}
              style={shadowStyle}
            >
              {memory1.title}
            </Text>
            {memory1.date ? (
              <Text
                className="text-[13px] text-white font-medium mt-0.5"
                style={shadowStyle}
              >
                {memory1.date}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Right column */}
        {memory2 ? (
          <View className="flex-1 justify-start">
            {/* Top Right Card */}
            <View className="h-[104px] rounded-[20px] overflow-hidden mb-3 bg-white shadow-sm elevation-2 relative">
              <Image
                source={{ uri: memory2.image }}
                style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, width: "100%", height: "100%" }}
                contentFit="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(15, 23, 42, 0.7)"]}
                className="absolute inset-0"
              />
              <View className="absolute bottom-3.5 left-4">
                <Text
                  className="text-[17px] font-semibold text-white"
                  numberOfLines={1}
                  style={shadowStyle}
                >
                  {memory2.title}
                </Text>
              </View>
            </View>

            {/* +N More */}
            {extraCount > 0 ? (
              <Pressable className="h-[104px] rounded-[20px] overflow-hidden">
                <LinearGradient
                  colors={["#3478F6", "#1E40AF"]}
                  className="flex-1 items-center justify-center"
                >
                  <Text className="text-[17px] font-semibold text-white">
                    {t("profile.memoriesSection.moreCount", { count: extraCount })}
                  </Text>
                </LinearGradient>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
