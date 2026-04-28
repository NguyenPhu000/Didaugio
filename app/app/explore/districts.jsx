import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../src/constants/design-tokens";
import { useBoundaryData } from "../../src/modules/map/hooks/useBoundaryData";
import { ExploreListScaffold } from "../../src/modules/explore/components/ExploreListScaffold";

function pickDistricts(geojson) {
  const features = Array.isArray(geojson?.features) ? geojson.features : [];
  return features
    .map((f) => ({
      id:
        f?.properties?.id ??
        f?.properties?.districtId ??
        f?.properties?.gid ??
        f?.id ??
        null,
      name:
        f?.properties?.name ||
        f?.properties?.district ||
        f?.properties?.ten ||
        "Khu vực",
    }))
    .filter((d) => d.id != null)
    .sort((a, b) => String(a.name).localeCompare(String(b.name), "vi"));
}

export default function ExploreDistrictsScreen() {
  const router = useRouter();
  const { districts, isLoading } = useBoundaryData();

  const items = useMemo(() => pickDistricts(districts), [districts]);

  return (
    <ExploreListScaffold
      title="Theo quận"
      subtitle="Chọn khu vực để xem các địa điểm nổi bật."
    >
      <View style={styles.list}>
        {isLoading ? (
          <Text style={styles.loadingText}>Đang tải...</Text>
        ) : (
          items.map((item) => (
            <Pressable
              key={String(item.id)}
              onPress={() =>
                router.push({
                  pathname: "/explore/district/[id]",
                  params: { id: String(item.id), name: item.name },
                })
              }
              style={({ pressed }) => [
                styles.row,
                pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
              ]}
            >
              <View style={styles.iconWrap}>
                <MaterialIcons name="map" size={20} color={APPLE_THEME.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  Xem địa điểm theo khu vực
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={APPLE_THEME.textMuted}
              />
            </Pressable>
          ))
        )}
      </View>
    </ExploreListScaffold>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: TOKENS.space[6],
    paddingTop: 16,
    paddingBottom: 24,
    gap: 10,
  },
  loadingText: {
    color: APPLE_THEME.textSecondary,
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    paddingVertical: 20,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: TOKENS.radius["3xl"],
    backgroundColor: APPLE_THEME.surface,
    borderWidth: 1,
    borderColor: APPLE_THEME.borderSoft,
    ...TOKENS.shadow.sm,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_THEME.surfaceElevated,
    borderWidth: 1,
    borderColor: APPLE_THEME.border,
  },
  name: {
    color: APPLE_THEME.text,
    fontSize: 15.5,
    fontFamily: TOKENS.font.semibold,
  },
  sub: {
    color: APPLE_THEME.textSecondary,
    fontSize: 12.5,
    fontFamily: TOKENS.font.body,
  },
});

