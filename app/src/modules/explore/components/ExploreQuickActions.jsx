import { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";

const ACTIONS = Object.freeze([
  {
    key: "nearby",
    title: "Gần bạn",
    subtitle: "Khoảng cách & ETA",
    icon: "near-me",
    tone: "blue",
    href: "/explore/nearby",
  },
  {
    key: "topRated",
    title: "Top đánh giá",
    subtitle: "Được yêu thích",
    icon: "star",
    tone: "amber",
    href: "/explore/top-rated",
  },
  {
    key: "newest",
    title: "Mới nhất",
    subtitle: "Vừa cập nhật",
    icon: "schedule",
    tone: "blue",
    href: "/explore/newest",
  },
  {
    key: "categories",
    title: "Danh mục",
    subtitle: "Chọn chủ đề",
    icon: "category",
    tone: "ink",
    href: "/explore/categories",
  },
  {
    key: "districts",
    title: "Theo quận",
    subtitle: "Khám phá khu vực",
    icon: "map",
    tone: "ink",
    href: "/explore/districts",
  },
]);

function toneStyles(tone) {
  if (tone === "amber") {
    return {
      iconBg: "#FFF4DE",
      iconColor: "#B45309",
      border: "rgba(180, 83, 9, 0.18)",
    };
  }
  if (tone === "ink") {
    return {
      iconBg: "#EEF2FF",
      iconColor: "#1E3A8A",
      border: "rgba(30, 58, 138, 0.16)",
    };
  }
  return {
    iconBg: "rgba(0, 113, 227, 0.12)",
    iconColor: APPLE_THEME.focusBlue,
    border: "rgba(0, 113, 227, 0.16)",
  };
}

function ExploreQuickActionsInner() {
  const router = useRouter();
  const items = useMemo(() => ACTIONS, []);

  const handlePress = useCallback(
    (href) => {
      if (href) router.push(href);
    },
    [router],
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Khám phá nhanh</Text>
      <View style={styles.grid}>
        {items.map((item) => {
          const tone = toneStyles(item.tone);
          return (
            <Pressable
              key={item.key}
              onPress={() => handlePress(item.href)}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: tone.iconBg,
                    borderColor: tone.border,
                  },
                ]}
              >
                <MaterialIcons
                  name={item.icon}
                  size={20}
                  color={tone.iconColor}
                />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.subtitle} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              </View>
              <View style={styles.arrowWrap}>
                <MaterialIcons
                  name="chevron-right"
                  size={17}
                  color={APPLE_THEME.textMuted}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const ExploreQuickActions = memo(ExploreQuickActionsInner);

const styles = StyleSheet.create({
  wrap: {
    marginTop: 18,
    paddingHorizontal: TOKENS.space[6],
  },
  heading: {
    color: APPLE_THEME.text,
    fontSize: 21,
    fontFamily: TOKENS.font.heading,
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  card: {
    width: "48.5%",
    minHeight: 118,
    borderRadius: TOKENS.radius["2xl"],
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: APPLE_THEME.surface,
    borderWidth: 1,
    borderColor: APPLE_THEME.border,
    justifyContent: "space-between",
    ...TOKENS.shadow.sm,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  textWrap: {
    gap: 4,
    flex: 1,
    minWidth: 0,
    marginTop: 10,
  },
  title: {
    color: APPLE_THEME.text,
    fontSize: 17,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: APPLE_THEME.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: TOKENS.font.body,
  },
  arrowWrap: {
    marginTop: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: APPLE_THEME.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_THEME.surfaceElevated,
  },
});
