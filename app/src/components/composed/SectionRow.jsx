import { memo, useCallback } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { GLASS_THEME } from "../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../lib/media-url";

const CompactPlaceCard = memo(({ place, onPress }) => {
  const imgUri = resolvePlaceImageUri(place);
  const rating = Number(place?.ratingAvg || 0).toFixed(1);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 160,
        height: 200,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: GLASS_THEME.backgroundElevated,
        borderWidth: 1,
        borderColor: GLASS_THEME.glassBorder,
        opacity: pressed ? 0.92 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      {imgUri ? (
        <Image
          source={{ uri: imgUri }}
          style={{ flex: 1 }}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(255,255,255,0.04)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name="place" size={36} color="rgba(255,255,255,0.2)" />
        </View>
      )}

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(0,0,0,0.72)",
          padding: 12,
        }}
      >
        <Text
          style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}
          numberOfLines={1}
        >
          {place?.name}
        </Text>
        {Number(rating) > 0 ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              marginTop: 3,
            }}
          >
            <MaterialIcons name="star" size={11} color="#FCD34D" />
            <Text style={{ color: "#FCD34D", fontSize: 11, fontWeight: "600" }}>
              {rating}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

export function SectionRow({ title, data = [], onSeeAll, loading = false }) {
  const router = useRouter();

  const renderItem = useCallback(
    ({ item }) => (
      <CompactPlaceCard
        place={item}
        onPress={() => router.push(`/place/${item.id}`)}
      />
    ),
    [router],
  );

  if (!loading && data.length === 0) return null;

  return (
    <View style={{ marginBottom: 32 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
          {title}
        </Text>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <Text
              style={{
                color: GLASS_THEME.neon,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              Xem tất cả
            </Text>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View
          style={{
            paddingHorizontal: 20,
            flexDirection: "row",
            gap: 12,
          }}
        >
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                width: 160,
                height: 200,
                borderRadius: 20,
                backgroundColor: GLASS_THEME.glass,
                borderWidth: 1,
                borderColor: GLASS_THEME.glassBorder,
              }}
            />
          ))}
        </View>
      ) : (
        <FlatList
          horizontal
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        />
      )}
    </View>
  );
}
