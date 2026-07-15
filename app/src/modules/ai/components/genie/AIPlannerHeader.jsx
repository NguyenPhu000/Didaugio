import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIconsRounded } from "../../../../components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../../constants/design-tokens";
import { GenieAvatar } from "./GenieAvatar";

export function AIPlannerHeader({
  conversationTopic,
  handleClearPlannerHistory,
  handleGoHome,
  hasPlannerHistory,
  headerExpanded,
  historyPreviewItems,
  insets,
  isLoading,
  setHeaderExpanded,
  setInputText,
  sidebarWidth,
  t,
}) {
  return (
    <>
      <View
        className="border-b border-slate-100 bg-white px-3 pb-2"
        style={{
          paddingTop: Math.max(insets.top, 8),
          boxShadow: "0 8px 26px rgba(15, 23, 42, 0.06)",
        }}
      >
        <LinearGradient
          colors={["rgba(14, 165, 233, 0.10)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <View className="flex-row items-center gap-2 rounded-[20px] border border-slate-100 bg-white/90 px-2 py-2">
          <Pressable
            onPress={() => setHeaderExpanded(true)}
            accessibilityRole="button"
            accessibilityLabel="Mở thanh bên"
            className="h-9 w-9 items-center justify-center rounded-full bg-slate-50"
          >
            <MaterialIconsRounded name="menu-open" size={20} color="#475569" />
          </Pressable>
          <View className="min-w-0 flex-1">
            <Text
              className="text-[15px] leading-5 text-slate-950"
              style={{ fontFamily: TOKENS.font.semibold }}
              numberOfLines={1}
            >
              Genie
            </Text>
            <View className="mt-0.5 flex-row items-center gap-1.5">
              <View className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
              <Text
                className="text-[10.5px] text-slate-500"
                style={{ fontFamily: TOKENS.font.medium }}
                numberOfLines={1}
              >
                Sẵn sàng lên lịch trình
              </Text>
            </View>
          </View>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-blue-50">
            <MaterialIconsRounded
              name="auto-awesome"
              size={18}
              color="#2563EB"
            />
          </View>
        </View>
      </View>

      {headerExpanded ? (
        <View
          pointerEvents="box-none"
          style={[StyleSheet.absoluteFillObject, { zIndex: 50 }]}
        >
          <Pressable
            onPress={() => setHeaderExpanded(false)}
            style={StyleSheet.absoluteFillObject}
            className="bg-slate-950/30"
            accessibilityRole="button"
            accessibilityLabel="Đóng thanh bên"
          />
          <View
            className="h-full gap-4 border-r border-slate-100 bg-white px-4 pb-4"
            style={{
              width: sidebarWidth,
              paddingTop: Math.max(insets.top, 8) + 12,
              boxShadow: "10px 0 34px rgba(15, 23, 42, 0.16)",
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <GenieAvatar size={38} />
                <View>
                  <Text
                    className="text-[15px] text-slate-950"
                    style={{ fontFamily: TOKENS.font.semibold }}
                    numberOfLines={1}
                  >
                    Genie
                  </Text>
                  <Text
                    className="text-[11px] text-slate-500"
                    style={{ fontFamily: TOKENS.font.medium }}
                  >
                    {t("aiPlanner.readyToHelp")}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setHeaderExpanded(false)}
                className="h-9 w-9 items-center justify-center rounded-full bg-slate-100"
                accessibilityRole="button"
                accessibilityLabel="Đóng thanh bên"
              >
                <MaterialIconsRounded name="close" size={20} color="#475569" />
              </Pressable>
            </View>

            <View className="rounded-[22px] border border-slate-100 bg-slate-50 p-3">
              <Text
                className="text-[11px] uppercase tracking-[0.7px] text-slate-500"
                style={{ fontFamily: TOKENS.font.semibold }}
              >
                Chủ đề hiện tại
              </Text>
              <Text
                className="mt-1 text-[15px] leading-5 text-slate-950"
                style={{ fontFamily: TOKENS.font.semibold }}
                numberOfLines={2}
              >
                {conversationTopic}
              </Text>
              <View className="mt-3 flex-row items-center gap-2">
                <Pressable
                  onPress={handleGoHome}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-white px-3 py-2.5"
                  accessibilityRole="button"
                  accessibilityLabel="Về trang chủ"
                >
                  <MaterialIconsRounded name="home" size={18} color="#475569" />
                  <Text
                    className="text-[12.5px] text-slate-700"
                    style={{ fontFamily: TOKENS.font.semibold }}
                  >
                    Trang chủ
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="min-h-0 flex-1 gap-2 rounded-[22px] bg-slate-50 p-3">
              <View className="flex-row items-center justify-between">
                <Text
                  className="text-[12px] uppercase tracking-[0.7px] text-slate-500"
                  style={{ fontFamily: TOKENS.font.semibold }}
                >
                  Lịch sử chat
                </Text>
                {hasPlannerHistory ? (
                  <Pressable
                    onPress={handleClearPlannerHistory}
                    disabled={isLoading}
                    className={`h-8 w-8 items-center justify-center rounded-full bg-white ${isLoading ? "opacity-40" : ""}`}
                    accessibilityRole="button"
                    accessibilityLabel="Xóa lịch sử chat"
                  >
                    <MaterialIconsRounded
                      name="delete-sweep"
                      size={18}
                      color="#EF4444"
                    />
                  </Pressable>
                ) : null}
              </View>

              {historyPreviewItems.length > 0 ? (
                historyPreviewItems.map((message, index) => (
                  <Pressable
                    key={message.id ?? `history-${index}`}
                    onPress={() => {
                      setInputText(message.text ?? message.content ?? "");
                      setHeaderExpanded(false);
                    }}
                    className="flex-row items-center gap-2 rounded-xl bg-white px-3 py-2"
                  >
                    <MaterialIconsRounded
                      name="history"
                      size={16}
                      color="#64748B"
                    />
                    <Text
                      className="min-w-0 flex-1 text-[12.5px] text-slate-700"
                      style={{ fontFamily: TOKENS.font.medium }}
                      numberOfLines={1}
                    >
                      {message.text ?? message.content}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <Text
                  className="rounded-xl bg-white px-3 py-2 text-[12.5px] text-slate-500"
                  style={{ fontFamily: TOKENS.font.body }}
                >
                  Chưa có cuộc trò chuyện nào.
                </Text>
              )}
            </View>
          </View>
        </View>
      ) : null}
    </>
  );
}
