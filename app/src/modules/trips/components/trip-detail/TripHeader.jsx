import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { formatDate, formatDistance } from "../../utils/tripHelpers";
import s, { T } from "../../utils/tripDetailTokens";

export const TripHeader = memo(function TripHeader({
  trip,
  onEditTrip,
  onDeleteTrip,
  isDeleting,
  isSaved,
  onToggleSave,
}) {
  const router = useRouter();

  const dateRange =
    trip.startDate && trip.endDate
      ? `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`
      : trip.startDate
        ? `Từ ${formatDate(trip.startDate)}`
        : null;

  const totalDistanceLabel = formatDistance(trip.totalDistance);
  const metaParts = [dateRange, totalDistanceLabel].filter(Boolean);

  return (
    <View style={s.header}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        style={({ pressed }) => [
          s.backBtn,
          pressed && { backgroundColor: "rgba(0,0,0,0.08)" },
        ]}
      >
        <MaterialIcons name="arrow-back-ios-new" size={17} color={T.ink} />
      </Pressable>

      <View style={s.headerCenter}>
        <Text style={s.headerTitle} numberOfLines={1}>
          {trip.title}
        </Text>
        {metaParts.length > 0 ? (
          <Text style={s.headerMeta} numberOfLines={1}>
            {metaParts.join("  ·  ")}
          </Text>
        ) : null}
      </View>

      <View style={s.headerActions}>
        {onToggleSave ? (
          <Pressable
            onPress={onToggleSave}
            style={({ pressed }) => [
              s.headerActionBtn,
              pressed && { backgroundColor: "rgba(0,0,0,0.08)" },
            ]}
          >
            <MaterialIcons
              name={isSaved ? "bookmark" : "bookmark-border"}
              size={18}
              color={isSaved ? "#FF9F0A" : T.ink}
            />
          </Pressable>
        ) : null}
        <Pressable
          onPress={onEditTrip}
          style={({ pressed }) => [
            s.headerActionBtn,
            pressed && { backgroundColor: "rgba(0,0,0,0.08)" },
          ]}
        >
          <Text style={s.headerActionText}>Sửa</Text>
        </Pressable>
        <Pressable
          onPress={onDeleteTrip}
          style={({ pressed }) => [
            s.headerActionBtn,
            pressed && { backgroundColor: "rgba(255,59,48,0.08)" },
          ]}
          disabled={isDeleting}
        >
          <Text style={s.headerActionDanger}>
            {isDeleting ? "..." : "Xóa"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/explore")}
          style={({ pressed }) => [
            s.primaryBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={s.primaryBtnText}>Thêm</Text>
        </Pressable>
      </View>
    </View>
  );
});
