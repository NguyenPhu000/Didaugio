import { memo, useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useTrips } from "../../src/modules/trips/hooks/useTrips";
import { GLASS_THEME } from "../../src/constants/design-tokens";

const TRIP_STATUS_COLORS = {
  draft: { bg: "rgba(255,255,255,0.08)", text: "#A3A3A3", label: "Nháp" },
  active: { bg: "rgba(0,240,255,0.12)", text: "#00F0FF", label: "Đang diễn ra" },
  completed: { bg: "rgba(192,132,252,0.12)", text: "#C084FC", label: "Đã hoàn thành" },
  cancelled: { bg: "rgba(239,68,68,0.12)", text: "#EF4444", label: "Đã hủy" },
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const TripCard = memo(({ trip, onPress }) => {
  const statusCfg = TRIP_STATUS_COLORS[trip.status] || TRIP_STATUS_COLORS.draft;
  const destCount = trip.destinations?.length || 0;
  const coverImg =
    trip.thumbnail ||
    trip.destinations?.[0]?.place?.thumbnail ||
    null;
  const dateRange =
    trip.startDate && trip.endDate
      ? `${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}`
      : trip.startDate
        ? `Từ ${formatDate(trip.startDate)}`
        : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          borderRadius: 24,
          overflow: "hidden",
          marginBottom: 16,
          backgroundColor: GLASS_THEME.backgroundElevated,
          borderWidth: 1,
          borderColor: GLASS_THEME.glassBorder,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <View style={{ height: 160 }}>
        {coverImg ? (
          <Image
            source={{ uri: coverImg }}
            style={{ flex: 1 }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.04)",
            }}
          >
            <MaterialIcons name="luggage" size={48} color="rgba(255,255,255,0.2)" />
          </View>
        )}
        <View
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.42)",
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            backgroundColor: statusCfg.bg,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ color: statusCfg.text, fontSize: 11, fontWeight: "700" }}>
            {statusCfg.label}
          </Text>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <Text
          style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 6 }}
          numberOfLines={1}
        >
          {trip.title}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {dateRange ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <MaterialIcons name="calendar-today" size={13} color={GLASS_THEME.textSecondary} />
              <Text style={{ color: GLASS_THEME.textSecondary, fontSize: 12 }}>{dateRange}</Text>
            </View>
          ) : null}

          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <MaterialIcons name="place" size={13} color={GLASS_THEME.textSecondary} />
            <Text style={{ color: GLASS_THEME.textSecondary, fontSize: 12 }}>
              {destCount} điểm đến
            </Text>
          </View>

          {trip.totalDays > 1 ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <MaterialIcons name="today" size={13} color={GLASS_THEME.textSecondary} />
              <Text style={{ color: GLASS_THEME.textSecondary, fontSize: 12 }}>
                {trip.totalDays} ngày
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

const EmptyTrips = ({ onCreate }) => (
  <View
    style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 20 }}
  >
    <View
      style={{
        width: 96,
        height: 96,
        borderRadius: 28,
        backgroundColor: GLASS_THEME.glass,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: GLASS_THEME.glassBorder,
      }}
    >
      <MaterialIcons name="luggage" size={44} color={GLASS_THEME.neon} />
    </View>
    <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", textAlign: "center" }}>
      Chưa có chuyến đi nào
    </Text>
    <Text
      style={{ color: GLASS_THEME.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 22 }}
    >
      Tạo chuyến đi đầu tiên và bắt đầu khám phá Cần Thơ cùng bạn bè!
    </Text>
    <Pressable
      onPress={onCreate}
      style={{
        backgroundColor: GLASS_THEME.neon,
        borderRadius: 20,
        paddingHorizontal: 28,
        paddingVertical: 14,
        shadowColor: GLASS_THEME.neon,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 12,
      }}
    >
      <Text style={{ color: "#03131A", fontSize: 14, fontWeight: "800", letterSpacing: 0.4 }}>
        Tạo chuyến đi đầu tiên
      </Text>
    </Pressable>
  </View>
);

export default function TripsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: trips = [], isLoading, isError, refetch } = useTrips();

  const filteredTrips = trips.filter((t) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "active") return t.status === "active" || t.status === "draft";
    if (activeFilter === "done") return t.status === "completed" || t.status === "cancelled";
    return true;
  });

  const handleCreate = useCallback(() => router.push("/trip/create"), [router]);
  const handlePress = useCallback((id) => router.push(`/trip/${id}`), [router]);

  const renderItem = useCallback(
    ({ item }) => <TripCard trip={item} onPress={() => handlePress(item.id)} />,
    [handlePress],
  );

  const FILTERS = [
    { key: "all", label: "Tất cả" },
    { key: "active", label: "Đang diễn ra" },
    { key: "done", label: "Đã hoàn thành" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: GLASS_THEME.background, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: "#fff", fontSize: 28, fontWeight: "800", letterSpacing: -0.6 }}>
            Chuyến đi
          </Text>
          <Pressable
            onPress={handleCreate}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: GLASS_THEME.neon,
              borderRadius: 18,
              paddingHorizontal: 16,
              paddingVertical: 10,
              shadowColor: GLASS_THEME.neon,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <MaterialIcons name="add" size={18} color="#03131A" />
            <Text style={{ color: "#03131A", fontSize: 13, fontWeight: "800" }}>Tạo mới</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor:
                  activeFilter === f.key ? GLASS_THEME.neon : GLASS_THEME.glass,
                borderWidth: 1,
                borderColor:
                  activeFilter === f.key
                    ? "rgba(0,240,255,0.5)"
                    : GLASS_THEME.glassBorder,
              }}
            >
              <Text
                style={{
                  color: activeFilter === f.key ? "#03131A" : GLASS_THEME.textSecondary,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={GLASS_THEME.neon} />
        </View>
      ) : isError ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 40 }}>
          <MaterialIcons name="wifi-off" size={48} color="#EF4444" />
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", textAlign: "center" }}>
            Lỗi kết nối
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={{
              backgroundColor: GLASS_THEME.glass,
              borderRadius: 16,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: GLASS_THEME.glassBorder,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Thử lại</Text>
          </Pressable>
        </View>
      ) : filteredTrips.length === 0 ? (
        <EmptyTrips onCreate={handleCreate} />
      ) : (
        <FlatList
          data={filteredTrips}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 100,
            paddingTop: 4,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
