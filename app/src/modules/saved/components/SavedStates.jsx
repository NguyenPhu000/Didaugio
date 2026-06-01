import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";

export function LoadingState() {
  return (
    <View className="items-center justify-center px-10 pt-14 pb-10 gap-2.5">
      <View className="w-14 h-14 rounded-[28px] bg-black/[0.04] items-center justify-center mb-2">
        <ActivityIndicator size="small" color="#1D1D1F" />
      </View>
      <Text className="text-[17px] font-semibold tracking-tight" style={{ color: APPLE_THEME.text }}>
        Đang tải bộ sưu tập
      </Text>
      <Text className="text-sm font-body tracking-tight" style={{ color: APPLE_THEME.textMuted }}>
        Đồng bộ địa điểm đã lưu của bạn...
      </Text>
    </View>
  );
}

export function EmptyState({ onExplore, activeFilter }) {
  const isFiltered = Boolean(activeFilter);
  return (
    <View style={{ paddingHorizontal: TAB_SCREEN_PADDING }} className="pt-4">
      <View className="rounded-3xl p-8 bg-white items-center border border-black/5">
        <View
          className={`w-[88px] h-[88px] rounded-3xl items-center justify-center mb-[22px] ${isFiltered ? "bg-black/[0.03]" : "bg-black/[0.04]"}`}
        >
          <MaterialIconsRounded
            name={isFiltered ? "filter-alt-off" : "bookmark-border"}
            size={36}
            color={isFiltered ? APPLE_THEME.textMuted : "#1D1D1F"}
          />
        </View>
        <Text className="text-[21px] text-center font-heading tracking-tight" style={{ color: APPLE_THEME.text }}>
          {isFiltered ? "Không có địa điểm" : "Chưa có địa điểm nào"}
        </Text>
        <Text
          className="mt-2 text-sm leading-[21px] text-center font-body max-w-[300px] tracking-tight"
          style={{ color: APPLE_THEME.textMuted }}
        >
          {isFiltered
            ? "Thử đổi bộ lọc hoặc khu vực để xem các địa điểm khác bạn đã lưu."
            : "Hãy thử khám phá và lưu các địa điểm yêu thích để dễ truy cập."}
        </Text>
        {!isFiltered && onExplore ? (
          <Pressable
            onPress={onExplore}
            className="flex-row items-center gap-2 mt-6 rounded-full px-6 py-[13px] bg-[#1D1D1F]"
            style={({ pressed }) => pressed && { backgroundColor: "#000000", transform: [{ scale: 0.97 }] }}
          >
            <MaterialIconsRounded name="explore" size={18} color="#FFFFFF" />
            <Text className="text-[15px] font-semibold tracking-tight text-white">Khám phá địa điểm</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function ErrorState({ onRetry }) {
  return (
    <View style={{ paddingHorizontal: TAB_SCREEN_PADDING }} className="pt-4">
      <View className="rounded-3xl p-8 bg-white items-center border border-black/5">
        <View className="w-[88px] h-[88px] rounded-3xl items-center justify-center bg-red-500/[0.08] mb-[22px]">
          <MaterialIconsRounded name="cloud-off" size={36} color="#FF3B30" />
        </View>
        <Text className="text-[21px] text-center font-heading tracking-tight" style={{ color: APPLE_THEME.text }}>
          Không tải được dữ liệu
        </Text>
        <Text
          className="mt-2 text-sm leading-[21px] text-center font-body max-w-[300px] tracking-tight"
          style={{ color: APPLE_THEME.textMuted }}
        >
          Vui lòng kiểm tra kết nối mạng và thử lại để đồng bộ địa điểm đã lưu.
        </Text>
        {onRetry ? (
          <Pressable
            onPress={onRetry}
            className="flex-row items-center gap-2 mt-6 rounded-full px-6 py-[13px] bg-red-500/[0.08] border border-red-500/15"
            style={({ pressed }) => pressed && { backgroundColor: "rgba(255,59,48,0.14)", transform: [{ scale: 0.97 }] }}
          >
            <MaterialIconsRounded name="refresh" size={18} color="#FF3B30" />
            <Text className="text-[15px] font-semibold tracking-tight text-red-500">Thử lại</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
