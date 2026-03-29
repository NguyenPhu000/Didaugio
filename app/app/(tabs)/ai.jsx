import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GuestGate } from "../../src/components/ui/GuestGate";
import { ChatPanel } from "../../src/modules/ai-assistant/ChatPanel";
import { AIPlanner } from "../../src/modules/ai-assistant/AIPlanner";
import { TOKENS } from "../../src/constants/design-tokens";

const SEGMENTS = [
  { id: "chat", label: "Chi Mai", helper: "Hoi nhanh" },
  { id: "planner", label: "Planner", helper: "Len lich trinh" },
];

export default function AITab() {
  const [activeSegment, setActiveSegment] = useState("chat");
  const insets = useSafeAreaInsets();

  return (
    <GuestGate
      icon="auto-awesome"
      title="Dang nhap de dung AI Concierge"
      description="Tro chuyen cung Chi Mai hoac de AI len ke hoach chuyen di theo phong cach cua ban."
    >
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="px-5 pt-4">
          <View
            className="rounded-[32px] px-5 py-6"
            style={[
              TOKENS.shadow.md,
              {
                backgroundColor: "#0B1120",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              },
            ]}
          >
            <View className="flex-row items-center justify-between">
              <Text
                className="text-[11px] font-bold uppercase tracking-[1px]"
                style={{ color: "#67E8F9" }}
              >
                AI Concierge
              </Text>
              <View
                className="rounded-full px-3 py-1.5"
                style={{ backgroundColor: "rgba(34,211,238,0.14)" }}
              >
                <Text
                  className="text-[10px] font-bold uppercase tracking-[0.8px]"
                  style={{ color: "#67E8F9" }}
                >
                  Smart travel
                </Text>
              </View>
            </View>

            <Text
              className="text-[30px] font-bold mt-3"
              style={{ letterSpacing: -0.8, color: "#FFFFFF" }}
            >
              Tro ly du lich thong minh
            </Text>
            <Text className="text-[14px] leading-6 mt-2" style={{ color: "#CBD5E1" }}>
              Hoi nhanh ve dia diem, am thuc va lich trinh. Tat ca tap trung trong mot man hinh gon gang hon.
            </Text>

            <View
              className="flex-row mt-5 rounded-[24px] p-1.5"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              {SEGMENTS.map((seg) => {
                const isActive = activeSegment === seg.id;
                return (
                  <Pressable
                    key={seg.id}
                    onPress={() => setActiveSegment(seg.id)}
                    className="flex-1 rounded-[20px] px-3 py-3"
                    style={isActive ? TOKENS.shadow.sm : undefined}
                  >
                    <View
                      className="rounded-[18px] px-2 py-2"
                      style={{
                        backgroundColor: isActive ? "#0EA5E9" : "transparent",
                      }}
                    >
                      <Text
                        className="text-center text-[14px] font-bold"
                        style={{ color: isActive ? "#FFFFFF" : "#E2E8F0" }}
                      >
                        {seg.label}
                      </Text>
                      <Text
                        className="text-center text-[11px] mt-0.5"
                        style={{
                          color: isActive ? "rgba(255,255,255,0.82)" : "#94A3B8",
                        }}
                      >
                        {seg.helper}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View className="flex-1 mt-4">
          {activeSegment === "chat" ? <ChatPanel /> : <AIPlanner />}
        </View>
      </View>
    </GuestGate>
  );
}
