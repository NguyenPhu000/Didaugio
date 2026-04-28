import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../src/constants/design-tokens";
import { useExplore } from "../../src/modules/explore/hooks/useExplore";
import { useExploreLocation } from "../../src/modules/explore/hooks/useExploreLocation";
import { ExploreListScaffold } from "../../src/modules/explore/components/ExploreListScaffold";
import { ExplorePlaceList } from "../../src/modules/explore/components/ExplorePlaceList";
import { distanceMeters, formatDistance } from "../../src/modules/explore/utils/geo";

export default function ExploreNearbyScreen() {
  const [watchEnabled, setWatchEnabled] = useState(false);
  const { currentLocation, permission, locateNow } = useExploreLocation({
    watchEnabled,
  });

  const { data, isLoading, refetch } = useExplore({ categoryId: null });

  const places = useMemo(() => {
    const raw = data?.pages.flatMap((p) => p?.data || []) ?? [];
    if (!currentLocation) return raw.slice(0, 60);

    return [...raw]
      .map((p) => {
        const meters = distanceMeters(currentLocation, p);
        return { ...p, __distanceMeters: meters };
      })
      .filter((p) => Number.isFinite(p.__distanceMeters))
      .sort((a, b) => a.__distanceMeters - b.__distanceMeters)
      .slice(0, 60);
  }, [data, currentLocation]);

  const subtitle = currentLocation
    ? "Sắp xếp theo khoảng cách từ vị trí hiện tại của bạn."
    : "Bật vị trí để xem các địa điểm gần bạn hơn.";

  return (
    <ExploreListScaffold
      title="Gần bạn"
      subtitle={subtitle}
      rightAction={
        <View style={styles.actionRow}>
          <Pressable
            onPress={async () => {
              await locateNow();
              setWatchEnabled(true);
            }}
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
          >
            <MaterialIcons
              name={permission === "granted" ? "my-location" : "location-off"}
              size={16}
              color={APPLE_THEME.white}
            />
            <Text style={styles.actionText}>
              {permission === "granted" ? "Định vị" : "Bật vị trí"}
            </Text>
          </Pressable>
        </View>
      }
    >
      {currentLocation ? (
        <View style={styles.hintPill}>
          <MaterialIcons
            name="near-me"
            size={14}
            color={APPLE_THEME.textSecondary}
          />
          <Text style={styles.hintText} numberOfLines={1}>
            {`Vị trí hiện tại • ${currentLocation.latitude.toFixed(3)}, ${currentLocation.longitude.toFixed(3)}`}
          </Text>
        </View>
      ) : null}

      <ExplorePlaceList
        data={places}
        loading={isLoading}
        emptyTitle="Chưa có địa điểm phù hợp"
        emptyCopy="Hãy thử lại hoặc bật vị trí để sắp xếp theo khoảng cách."
        onEndReached={refetch}
      />
    </ExploreListScaffold>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: TOKENS.radius.full,
    backgroundColor: APPLE_THEME.primary,
    ...TOKENS.shadow.sm,
  },
  actionText: {
    color: APPLE_THEME.white,
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.2,
  },
  hintPill: {
    marginHorizontal: TOKENS.space[6],
    marginTop: 12,
    marginBottom: -2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: TOKENS.radius.full,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: APPLE_THEME.borderSoft,
  },
  hintText: {
    color: APPLE_THEME.textSecondary,
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
    flex: 1,
    minWidth: 0,
  },
});

