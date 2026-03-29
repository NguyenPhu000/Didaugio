import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import {
  useSavedPlaces,
  useUnsavePlace,
} from "../../src/modules/saved/hooks/useSaved";
import { useAuthStore } from "../../src/stores/authStore";
import { PlaceCard } from "../../src/components/ui/PlaceCard";
import { PlaceCardSkeleton } from "../../src/components/ui/Skeleton";
import { GuestGate } from "../../src/components/ui/GuestGate";
import { TOKENS } from "../../src/constants/design-tokens";

const EmptyState = () => (
  <View className="flex-1 items-center justify-center px-10 gap-4">
    <View className="w-24 h-24 rounded-[28px] items-center justify-center bg-primary-50">
      <MaterialIcons name="bookmark-border" size={42} color={TOKENS.color.primary[500]} />
    </View>
    <Text className="text-[22px] font-bold text-ink text-center">
      Chưa có địa điểm nào
    </Text>
    <Text className="text-sm text-ink-secondary text-center leading-6">
      Lưu lại các điểm đến bạn yêu thích để quay lại nhanh bất cứ lúc nào.
    </Text>
  </View>
);

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);
  const isLoggedIn = !!accessToken && !isGuest;

  const {
    data: savedData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useSavedPlaces();
  const unsaveMutation = useUnsavePlace();
  const items = savedData || [];

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-5 pt-4 pb-3">
        <View
          className="rounded-[32px] border border-primary-100 px-5 py-6"
          style={[
            TOKENS.shadow.md,
            { backgroundColor: "rgba(255,255,255,0.96)" },
          ]}
        >
          <Text className="text-[30px] font-bold text-ink" style={{ letterSpacing: -0.8 }}>
            Bộ sưu tập đã lưu
          </Text>
          <Text className="text-[14px] text-ink-secondary leading-6 mt-2">
            Gom lại những quán ăn, điểm tham quan và trải nghiệm bạn muốn quay lại.
          </Text>
          {isLoggedIn && items.length > 0 ? (
            <Text className="text-[13px] text-primary-700 font-semibold mt-4 uppercase tracking-[0.8px]">
              {items.length} địa điểm
            </Text>
          ) : null}
        </View>
      </View>

      {!isLoggedIn ? (
        <GuestGate
          icon="bookmark-border"
          title="Đăng nhập để lưu hành trình"
          description="Danh sách đã lưu sẽ đồng bộ với tài khoản của bạn trên mọi thiết bị."
        />
      ) : isLoading ? (
        <View className="px-4 py-4 gap-4">
          <PlaceCardSkeleton />
          <PlaceCardSkeleton />
          <PlaceCardSkeleton />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-10 gap-4">
          <View className="w-24 h-24 rounded-[28px] items-center justify-center bg-rose-50">
            <MaterialIcons name="error-outline" size={42} color="#EF4444" />
          </View>
          <Text className="text-[22px] font-bold text-ink text-center">Không tải được dữ liệu</Text>
          <Text className="text-sm text-ink-secondary text-center leading-6">
            {error?.message || "Không thể tải danh sách đã lưu."}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="px-6 py-3 rounded-[20px] bg-primary-600"
            style={TOKENS.shadow.glow}
          >
            <Text className="text-white text-[13px] font-bold uppercase tracking-[0.8px]">
              Thử lại
            </Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
          refreshing={isRefetching}
          onRefresh={refetch}
          ItemSeparatorComponent={() => <View className="h-1" />}
          renderItem={({ item }) => {
            const place = item?.place || item;
            return (
              <PlaceCard
                place={place}
                onSave={() => unsaveMutation.mutate(place.id)}
                isSaved
                style={{ marginBottom: 4 }}
              />
            );
          }}
        />
      )}
    </View>
  );
}
