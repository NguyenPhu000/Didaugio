import { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";

function ExploreListScaffoldInner({ title, subtitle, children, rightAction }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.headerWrap}>
        <BlurView
          intensity={Platform.OS === "ios" ? 95 : 80}
          tint="light"
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.headerTint} />

        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
          >
            <MaterialIcons name="chevron-left" size={24} color={APPLE_THEME.text} />
          </Pressable>

          {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
        </View>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.content}>{children}</View>
    </View>
  );
}

export const ExploreListScaffold = memo(ExploreListScaffoldInner);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APPLE_THEME.background,
  },
  headerWrap: {
    paddingHorizontal: TOKENS.space[6],
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: APPLE_THEME.borderSoft,
  },
  headerTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(245,245,247,0.86)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: APPLE_THEME.borderSoft,
  },
  rightAction: {
    minHeight: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  titleWrap: {
    marginTop: 10,
    gap: 4,
  },
  title: {
    color: APPLE_THEME.text,
    fontSize: 30,
    letterSpacing: -0.8,
    fontFamily: TOKENS.font.heading,
  },
  subtitle: {
    color: APPLE_THEME.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
  },
  content: {
    flex: 1,
  },
});

