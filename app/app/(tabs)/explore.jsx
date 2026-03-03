import {
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import {
  useExplore,
  useCategories,
} from "../../src/modules/explore/hooks/useExplore";
import { PlaceCard } from "../../src/components/ui/PlaceCard";
import { PlaceCardSkeleton } from "../../src/components/ui/Skeleton";
import { cn } from "../../src/lib/cn";

const CategoryChip = ({ label, active, onPress }) => (
  <Pressable
    onPress={onPress}
    className={cn(
      "h-9 px-4 rounded-full border-[1.5px] justify-center",
      active ? "bg-primary border-primary" : "bg-white border-gray-200",
    )}
    style={
      active
        ? {
            shadowColor: "#0077b8",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
            elevation: 3,
          }
        : {}
    }
  >
    <Text
      className={cn(
        "text-[13px]",
        active ? "text-white font-bold" : "text-gray-500 font-medium",
      )}
    >
      {label}
    </Text>
  </Pressable>
);

const EmptyState = ({ query }) => (
  <View className="flex-1 items-center justify-center px-10 pt-16 gap-3">
    <MaterialIcons name="search-off" size={64} color="#9ca3af" />
    <Text className="text-lg font-bold text-ink text-center">
      Không tìm thấy kết quả
    </Text>
    <Text className="text-sm text-ink-secondary text-center leading-5">
      {query
        ? `Không có địa điểm nào khớp với "${query}"`
        : "Thử tìm kiếm một địa điểm nào đó!"}
    </Text>
  </View>
);

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const searchRef = useRef(null);

  const [searchText, setSearchText] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  const deferredSearch = useDeferredValue(searchText);

  const { data: categoriesData } = useCategories();
  const categories = categoriesData || [];

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
    error,
  } = useExplore({ search: deferredSearch, categoryId: activeCategoryId });

  const places = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page?.data || []);
  }, [data]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }) => <PlaceCard place={item} style={{ marginHorizontal: 16 }} />,
    [],
  );

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* ── Header ── */}
      <View className="px-5 pt-3 pb-2">
        <Text
          className="text-[24px] font-bold text-ink"
          style={{ letterSpacing: -0.3 }}
        >
          Khám phá
        </Text>
        <Text className="text-[13px] text-ink-secondary mt-0.5">
          Tìm địa điểm tuyệt vời tại Cần Thơ
        </Text>
      </View>

      {/* ── Search bar ── */}
      <View
        className="flex-row items-center bg-white rounded-2xl mx-4 mb-3 px-3.5 h-12 gap-2"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <MaterialIcons
          name="search"
          size={20}
          color={searchText ? "#0077b8" : "#9ca3af"}
        />
        <TextInput
          ref={searchRef}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Tìm nhà hàng, quán cà phê, địa danh..."
          placeholderTextColor="#9ca3af"
          className="flex-1 text-sm text-ink h-12"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => setSearchText("")} hitSlop={8}>
            <MaterialIcons name="close" size={18} color="#9ca3af" />
          </Pressable>
        )}
      </View>

      {/* ── Category chips ── */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="max-h-12 mb-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 8,
            paddingRight: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <CategoryChip
            label="Tất cả"
            active={activeCategoryId === null}
            onPress={() => setActiveCategoryId(null)}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              label={cat.name}
              active={activeCategoryId === cat.id}
              onPress={() =>
                setActiveCategoryId(activeCategoryId === cat.id ? null : cat.id)
              }
            />
          ))}
        </ScrollView>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 4 }}
          showsVerticalScrollIndicator={false}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <PlaceCardSkeleton key={i} />
          ))}
        </ScrollView>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-10 gap-3">
          <MaterialIcons name="wifi-off" size={56} color="#ef4444" />
          <Text className="text-lg font-bold text-danger text-center">
            Lỗi kết nối
          </Text>
          <Text className="text-sm text-ink-secondary text-center">
            {error?.message}
          </Text>
        </View>
      ) : (
        <FlatList
          data={places}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            !isLoading && places.length > 0 ? (
              <Text className="text-[13px] text-ink-secondary px-4 pb-2">
                {places.length} địa điểm
                {deferredSearch ? ` cho "${deferredSearch}"` : ""}
              </Text>
            ) : null
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="flex-row items-center justify-center gap-2 py-5">
                <ActivityIndicator size="small" color="#0077b8" />
                <Text className="text-[13px] text-ink-secondary">
                  Đang tải thêm...
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={<EmptyState query={deferredSearch} />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}
