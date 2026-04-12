import { useMemo, useState, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GuestGate } from "../../src/components/ui/GuestGate";
import { ChatPanel } from "../../src/modules/ai-assistant/ChatPanel";
import { AIPlanner } from "../../src/modules/ai-assistant/AIPlanner";
import { TOKENS } from "../../src/constants/design-tokens";
import GradientBackground from "../../src/components/ui/GradientBackground";

const STITCH_PRIMARY = "#101E2C";
const STITCH_TEXT = "#191C1E";
const STITCH_MUTED = "#54647A";

const SEGMENTS = [
  { id: "chat", label: "em Nhi", icon: "chat-bubble-outline" },
  { id: "planner", label: "Planner", icon: "event-note" },
];

export default function AITab() {
  const [activeSegment, setActiveSegment] = useState("chat");
  const insets = useSafeAreaInsets();

  const handleSegmentChange = useCallback((id) => {
    setActiveSegment(id);
  }, []);

  return (
    <GuestGate
      icon="auto-awesome"
      title="Đăng nhập để dùng AI Concierge"
      description="Trò chuyện cùng em Nhi hoặc để AI sắp xếp lịch trình theo phong cách của bạn."
    >
      <GradientBackground variant="ocean" style={styles.page}>
        <View style={[styles.root, { paddingTop: insets.top }]}>
          {/* ── Top bar: compact, ChatGPT-style ── */}
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              <View style={styles.aiDot}>
                <View style={styles.aiDotInner} />
              </View>
              <Text style={styles.topBarTitle}>AI Concierge</Text>
            </View>

            <View style={styles.segmentPill}>
              {SEGMENTS.map((seg) => {
                const active = activeSegment === seg.id;
                return (
                  <Pressable
                    key={seg.id}
                    onPress={() => handleSegmentChange(seg.id)}
                    style={[
                      styles.segmentBtn,
                      active && styles.segmentBtnActive,
                    ]}
                  >
                    <MaterialIcons
                      name={seg.icon}
                      size={14}
                      color={active ? "#FFFFFF" : STITCH_MUTED}
                    />
                    <Text
                      style={[
                        styles.segmentText,
                        active && styles.segmentTextActive,
                      ]}
                    >
                      {seg.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Chat / Planner panel — takes remaining space ── */}
          <View style={styles.panelContainer}>
            {activeSegment === "chat" ? <ChatPanel /> : <AIPlanner />}
          </View>
        </View>
      </GradientBackground>
    </GuestGate>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  /* ── Top bar ── */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.86)",
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  aiDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(16,30,44,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  aiDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: STITCH_PRIMARY,
  },
  topBarTitle: {
    fontSize: 17,
    fontFamily: TOKENS.font.semibold,
    color: STITCH_TEXT,
  },
  /* ── Segment switcher ── */
  segmentPill: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.78)",
    borderRadius: 24,
    padding: 4,
    borderWidth: 0,
  },
  segmentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  segmentBtnActive: {
    backgroundColor: STITCH_PRIMARY,
    shadowColor: "#191c1e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 5,
  },
  segmentText: {
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
    color: STITCH_MUTED,
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },
  /* ── Panel ── */
  panelContainer: {
    flex: 1,
  },
});
