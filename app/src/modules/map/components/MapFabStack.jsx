import { memo } from "react";
import { Pressable, View } from "react-native";
import { Layers, Locate } from "lucide-react-native";

const MapFabStack = memo(function MapFabStack({
  visible,
  topOffset,
  onLocate,
  onMapStylePress,
  t,
}) {
  if (!visible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        right: 14,
        top: topOffset,
        zIndex: 50,
      }}
    >
      <View style={{ alignItems: "flex-end", gap: 10 }} pointerEvents="auto">
        <Pressable
          onPress={onMapStylePress}
          accessibilityRole="button"
          accessibilityLabel="Chọn kiểu bản đồ"
          className="h-11 w-11 items-center justify-center rounded-full border border-black/[0.04] bg-white/95 shadow-lg shadow-slate-900/5 active:scale-95"
        >
          <Layers size={20} color="#0F766E" />
        </Pressable>
        <Pressable
          onPress={onLocate}
          accessibilityRole="button"
          accessibilityLabel={t("mapScreen.locateMe", { defaultValue: "Vị trí của tôi" })}
          className="h-11 w-11 items-center justify-center rounded-full border border-black/[0.04] bg-white/95 shadow-lg shadow-slate-900/5 active:scale-95"
        >
          <Locate size={20} color="#0EA5E9" />
        </Pressable>
      </View>
    </View>
  );
});

export default MapFabStack;
