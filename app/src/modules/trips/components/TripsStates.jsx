import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { cn } from "../../../lib/cn";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../../src/constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";

export function LoadingState() {
  return (
    <View className="items-center justify-center px-10 pt-14 pb-10 gap-2.5">
      <View className="w-14 h-14 rounded-[28px] bg-black/[0.04] items-center justify-center mb-2">
        <ActivityIndicator size="small" color="#1D1D1F" />
      </View>
      <Text className="text-[17px] font-semibold tracking-tight" style={{ color: APPLE_THEME.text }}>
        Chuẩn bị hành trình
      </Text>
      <Text className="text-sm font-body tracking-tight" style={{ color: APPLE_THEME.textMuted }}>
        Đang đồng bộ dữ liệu chuyến đi...
      </Text>
    </View>
  );
}

export function EmptyTrips({ onCreate, activeFilter, onClearFilter }) {
  const isFiltered = activeFilter !== "all";

  return (
    <View style={{ paddingHorizontal: TAB_SCREEN_PADDING }} className="pt-4">
      <View className="rounded-3xl p-9 bg-white items-center border border-black/5">
        <View
          className={cn(
            "w-[88px] h-[88px] rounded-3xl items-center justify-center mb-6",
            isFiltered ? "bg-black/[0.03]" : "bg-black/[0.04]",
          )}
        >
          <MaterialIconsRounded
            name={isFiltered ? "filter-alt-off" : "explore"}
            size={36}
            color={isFiltered ? APPLE_THEME.textMuted : "#1D1D1F"}
          />
        </View>

        <Text className="text-[22px] text-center font-heading tracking-tight" style={{ color: APPLE_THEME.text }}>
          {isFiltered ? "Không có kết quả" : "Khám phá thế giới"}
        </Text>
        <Text
          className="mt-2.5 text-[15px] leading-[22px] text-center font-body max-w-[300px] tracking-tight"
          style={{ color: APPLE_THEME.textMuted }}
        >
          {isFiltered
            ? "Thử đổi bộ lọc để xem lại các hành trình khác trong tài khoản của bạn."
            : "Tạo hành trình đầu tiên để gom điểm đến, lịch trình và ghi chú vào cùng một nơi gọn gàng."}
        </Text>

        {!isFiltered ? (
          <Pressable
            onPress={() => onCreate?.()}
            className="flex-row items-center gap-2 mt-7 rounded-full px-6 py-3.5 bg-[#1D1D1F]"
            style={({ pressed }) => pressed && { backgroundColor: "#000000", transform: [{ scale: 0.97 }] }}
          >
            <MaterialIconsRounded name="add" size={18} color="#FFFFFF" />
            <Text className="text-[15px] font-semibold tracking-tight text-white">Tạo chuyến đi mới</Text>
          </Pressable>
        ) : null}

        {isFiltered && onClearFilter ? (
          <Pressable
            onPress={() => onClearFilter?.()}
            className="flex-row items-center gap-2 mt-7 rounded-full px-6 py-3.5 bg-[#1D1D1F]"
            style={({ pressed }) => pressed && { backgroundColor: "#000000", transform: [{ scale: 0.97 }] }}
          >
            <MaterialIconsRounded name="filter-alt-off" size={18} color="#FFFFFF" />
            <Text className="text-[15px] font-semibold tracking-tight text-white">Xóa bộ lọc</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function ErrorState({ onRetry }) {
  return (
    <View style={{ paddingHorizontal: TAB_SCREEN_PADDING }} className="pt-4">
      <View className="rounded-3xl p-9 bg-white items-center border border-black/5">
        <View className="w-[88px] h-[88px] rounded-3xl items-center justify-center bg-red-500/[0.08] mb-6">
          <MaterialIconsRounded name="cloud-off" size={36} color="#FF3B30" />
        </View>
        <Text className="text-[22px] text-center font-heading tracking-tight" style={{ color: APPLE_THEME.text }}>
          Không tải được dữ liệu
        </Text>
        <Text
          className="mt-2.5 text-[15px] leading-[22px] text-center font-body max-w-[300px] tracking-tight"
          style={{ color: APPLE_THEME.textMuted }}
        >
          Vui lòng kiểm tra lại kết nối mạng và thử lại để đồng bộ hành trình.
        </Text>
        <Pressable
          onPress={() => onRetry?.()}
          className="flex-row items-center gap-2 mt-7 rounded-full px-6 py-3.5 bg-red-500/[0.08] border border-red-500/15"
          style={({ pressed }) => pressed && { backgroundColor: "rgba(255,59,48,0.12)", transform: [{ scale: 0.97 }] }}
        >
          <MaterialIconsRounded name="refresh" size={18} color="#FF3B30" />
          <Text className="text-[15px] font-semibold tracking-tight text-red-500">Thử lại</Text>
        </Pressable>
      </View>
    </View>
  );
}
