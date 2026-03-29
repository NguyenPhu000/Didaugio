import { memo, useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import {
  useTripDetail,
  useRemoveDestination,
} from "../../src/modules/trips/hooks/useTripDetail";
import { GLASS_THEME } from "../../src/constants/design-tokens";

const TABS = [
  { key: "itinerary", label: "Lịch trình", icon: "route" },
  { key: "services", label: "Dịch vụ", icon: "room-service" },
  { key: "budget", label: "Ngân sách", icon: "account-balance-wallet" },
];

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const DestinationCard = memo(({ dest, onRemove }) => {
  const place = dest.place;
  const imgUri = place?.thumbnail || null;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: GLASS_THEME.glass,
        borderRadius: 20,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: GLASS_THEME.glassBorder,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          overflow: "hidden",
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      >
        {imgUri ? (
          <Image
            source={{ uri: imgUri }}
            style={{ flex: 1 }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons name="place" size={22} color={GLASS_THEME.neon} />
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
          numberOfLines={1}
        >
          {place?.name || "Địa điểm"}
        </Text>
        {place?.address ? (
          <Text
            style={{ color: GLASS_THEME.textSecondary, fontSize: 12, marginTop: 2 }}
            numberOfLines={1}
          >
            {place.address}
          </Text>
        ) : null}
        {dest.note ? (
          <Text
            style={{ color: GLASS_THEME.textSecondary, fontSize: 11, marginTop: 3, fontStyle: "italic" }}
            numberOfLines={1}
          >
            {dest.note}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => onRemove(dest.id)}
        hitSlop={8}
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: "rgba(239,68,68,0.12)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialIcons name="remove-circle-outline" size={18} color="#EF4444" />
      </Pressable>
    </View>
  );
});

const ItineraryTab = ({ trip, onRemove }) => {
  const [activeDay, setActiveDay] = useState(1);
  const days = Array.from({ length: trip.totalDays || 1 }, (_, i) => i + 1);
  const dayDestinations = (trip.destinations || []).filter(
    (d) => d.dayNumber === activeDay,
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 12 }}
      >
        {days.map((day) => {
          const isActive = activeDay === day;
          return (
            <Pressable
              key={day}
              onPress={() => setActiveDay(day)}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: isActive ? GLASS_THEME.neon : GLASS_THEME.glass,
                borderWidth: 1,
                borderColor: isActive ? "rgba(0,240,255,0.5)" : GLASS_THEME.glassBorder,
              }}
            >
              <Text
                style={{
                  color: isActive ? "#03131A" : GLASS_THEME.textSecondary,
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                Ngày {day}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {dayDestinations.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", paddingTop: 48, gap: 12 }}>
          <MaterialIcons name="add-location-alt" size={40} color={GLASS_THEME.glass} />
          <Text style={{ color: GLASS_THEME.textSecondary, fontSize: 14, textAlign: "center" }}>
            Chưa có địa điểm nào cho ngày {activeDay}
          </Text>
        </View>
      ) : (
        <FlatList
          data={dayDestinations}
          renderItem={({ item }) => (
            <DestinationCard dest={item} onRemove={onRemove} />
          )}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const ServicesTab = () => (
  <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 }}>
    <MaterialIcons name="room-service" size={48} color={GLASS_THEME.glass} />
    <Text style={{ color: GLASS_THEME.textSecondary, fontSize: 15, textAlign: "center" }}>
      Tính năng đặt dịch vụ sẽ sớm ra mắt
    </Text>
  </View>
);

const BudgetTab = () => (
  <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 }}>
    <MaterialIcons name="account-balance-wallet" size={48} color={GLASS_THEME.glass} />
    <Text style={{ color: GLASS_THEME.textSecondary, fontSize: 15, textAlign: "center" }}>
      Tính năng quản lý ngân sách sẽ sớm ra mắt
    </Text>
  </View>
);

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("itinerary");

  const { data: trip, isLoading, isError } = useTripDetail(id);
  const removeMutation = useRemoveDestination(id ? parseInt(id) : null);

  const handleRemoveDestination = useCallback(
    (destId) => removeMutation.mutate(destId),
    [removeMutation],
  );

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: GLASS_THEME.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={GLASS_THEME.neon} />
      </View>
    );
  }

  if (isError || !trip) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: GLASS_THEME.background,
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          paddingHorizontal: 40,
        }}
      >
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", textAlign: "center" }}>
          Không tìm thấy chuyến đi
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: GLASS_THEME.neon, fontWeight: "600" }}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const dateRange =
    trip.startDate && trip.endDate
      ? `${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}`
      : null;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: GLASS_THEME.background,
        paddingTop: insets.top,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            backgroundColor: GLASS_THEME.glass,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: GLASS_THEME.glassBorder,
          }}
        >
          <MaterialIcons name="arrow-back" size={20} color="#fff" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text
            style={{ color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: -0.4 }}
            numberOfLines={1}
          >
            {trip.title}
          </Text>
          {dateRange ? (
            <Text style={{ color: GLASS_THEME.textSecondary, fontSize: 12, marginTop: 2 }}>
              {dateRange}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={() => router.push(`/explore`)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            backgroundColor: GLASS_THEME.neon,
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <MaterialIcons name="add" size={16} color="#03131A" />
          <Text style={{ color: "#03131A", fontSize: 12, fontWeight: "800" }}>Thêm</Text>
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 16,
          gap: 6,
          marginBottom: 4,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                paddingVertical: 10,
                borderRadius: 16,
                backgroundColor: isActive ? GLASS_THEME.neon : GLASS_THEME.glass,
                borderWidth: 1,
                borderColor: isActive ? "rgba(0,240,255,0.5)" : GLASS_THEME.glassBorder,
              }}
            >
              <MaterialIcons
                name={tab.icon}
                size={14}
                color={isActive ? "#03131A" : GLASS_THEME.textSecondary}
              />
              <Text
                style={{
                  color: isActive ? "#03131A" : GLASS_THEME.textSecondary,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === "itinerary" ? (
        <ItineraryTab trip={trip} onRemove={handleRemoveDestination} />
      ) : activeTab === "services" ? (
        <ServicesTab />
      ) : (
        <BudgetTab />
      )}
    </View>
  );
}
