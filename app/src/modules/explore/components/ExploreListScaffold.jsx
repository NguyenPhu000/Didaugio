import { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { TOKENS } from "../../../constants/design-tokens";

function ExploreListScaffoldInner({ title, subtitle, children, rightAction }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.headerWrap}>
        <BlurView
          intensity={Platform.OS === "ios" ? 90 : 100}
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
              pressed && { opacity: 0.6 },
            ]}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
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
    backgroundColor: "#FFFFFF",
  },
  headerWrap: {
    paddingHorizontal: TOKENS.space[6],
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
  },
  headerTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rightAction: {
    minHeight: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  titleWrap: {
    marginTop: 14,
    gap: 4,
  },
  title: {
    color: "#000000",
    fontSize: 28,
    letterSpacing: -0.5,
    fontFamily: TOKENS.font.heading,
  },
  subtitle: {
    color: "#6B7280", // Gray 500
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
  },
  content: {
    flex: 1,
  },
});
