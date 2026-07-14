import { memo, useCallback } from "react";
import { LayoutAnimation, Pressable, Text, View } from "react-native";
import { Layers, Locate, X } from "lucide-react-native";

const MapFabStack = memo(function MapFabStack({
  visible,
  topOffset,
  mapStyle,
  mapStyles,
  layerModalVisible,
  setLayerModalVisible,
  setMapStyle,
  onLocate,
  t,
}) {
  const handleToggleLayers = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLayerModalVisible((prev) => !prev);
  }, [setLayerModalVisible]);

  const handleSelectStyle = useCallback(
    (nextStyle) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMapStyle(nextStyle);
      setLayerModalVisible(false);
    },
    [setLayerModalVisible, setMapStyle],
  );

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
          onPress={onLocate}
          accessibilityRole="button"
          accessibilityLabel={t("mapScreen.locateMe", { defaultValue: "Vi tri cua toi" })}
          className="h-11 w-11 items-center justify-center rounded-full border border-black/[0.04] bg-white/95 shadow-lg shadow-slate-900/5 active:scale-95"
        >
          <Locate size={20} color="#0EA5E9" />
        </Pressable>

        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
          <Pressable
            onPress={handleToggleLayers}
            accessibilityRole="button"
            accessibilityLabel={t("mapScreen.layers", { defaultValue: "Lop ban do" })}
            className="h-11 w-11 items-center justify-center rounded-full border border-black/[0.04] bg-white/95 shadow-lg shadow-slate-900/5 active:scale-95"
          >
            {layerModalVisible ? (
              <X size={20} color="#475569" />
            ) : (
              <Layers size={20} color="#475569" />
            )}
          </Pressable>

          {layerModalVisible ? (
            <View className="flex-row items-center gap-1 rounded-full border border-black/[0.04] bg-white/95 p-1 shadow-lg shadow-slate-900/5">
              {[
                { style: mapStyles.OSM, label: t("mapScreen.map") },
                { style: mapStyles.HYBRID, label: t("mapScreen.satellite") },
              ].map((item) => {
                const active = mapStyle.key === item.style.key;
                return (
                  <Pressable
                    key={item.style.key}
                    onPress={() => handleSelectStyle(item.style)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    className={`h-8 flex-row items-center justify-center rounded-full px-3.5 ${
                      active ? "bg-slate-900" : "bg-transparent active:bg-slate-100"
                    }`}
                  >
                    <Text
                      className={`text-[13px] font-medium ${
                        active ? "text-white" : "text-slate-600"
                      }`}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
});

export default MapFabStack;
