import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  useSavedPlaces,
  useUnsavePlace,
} from "../../src/modules/saved/hooks/useSaved";
import { useAuthStore } from "../../src/stores/authStore";
import { PlaceCard } from "../../src/components/ui/PlaceCard";
import { GuestGate } from "../../src/components/ui/GuestGate";

const EmptyState = () => (
  <View className="flex-1 items-center justify-center px-10 gap-3">
    <View className="w-20 h-20 rounded-full items-center justify-center bg-blue-50">
      <MaterialIcons name="bookmark-border" size={40} color="#0077b8" />
    </View>
    <Text className="text-lg font-bold text-ink text-center">
      Chưa có địa điểm nào
    </Text>
    <Text className="text-sm text-ink-secondary text-center leading-5">
      Khám phá bản đồ và nhấn ikon bookmark để lưu địa điểm yêu thích
    </Text>
  </View>
);

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);

  const isLoggedIn = !!accessToken && !isGuest;

  const {
    data: savedData,
    isLoading,
    refetch,
    isRefetching,
  } = useSavedPlaces();
  const unsaveMutation = useUnsavePlace();

  const items = savedData || [];

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-3 bg-white border-b border-gray-100">
        <Text
          className="text-[22px] font-bold text-ink"
          style={{ letterSpacing: -0.3 }}
        >
          Đã lưu
        </Text>
        {isLoggedIn && items.length > 0 && (
          <Text className="text-[13px] text-ink-secondary">
            {items.length} địa điểm
          </Text>
        )}
      </View>

      {!isLoggedIn ? (
        <GuestGate
          icon="bookmark-border"
          title="Chưa đăng nhập"
          description="Đăng nhập để xem và quản lý các địa điểm đã lưu yêu thích"
        />
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0077b8" />
        </View>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          refreshing={isRefetching}
          onRefresh={refetch}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => {
            const place = item?.place || item;
            return (
              <Pressable onPress={() => router.push(`/place/${place.id}`)}>
                <PlaceCard
                  place={place}
                  onUnsave={() => unsaveMutation.mutate(place.id)}
                  showUnsave
                />
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
