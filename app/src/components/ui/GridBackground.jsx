import React, { useMemo } from "react";
import { StyleSheet, useWindowDimensions, View, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export const GridBackground = ({
  cellSize = 60,
  lineColor = "rgba(255, 255, 255, 0.06)",
  lineWidth = StyleSheet.hairlineWidth,
  backgroundColor = "#0A0A0A",
  showVignette = true,
  showTopFade = true,
  showBottomFade = true,
  backgroundImage,
  /**
   * Màu dùng để tint ảnh background khi có `backgroundImage`.
   * Nên là tone tối (vd: "#0B0B0F") để giữ text contrast cao.
   */
  tintColor = "#0B0B0F",
  /** Độ đậm của tint ở top/bottom fade (0-1) */
  tintOpacity = 0.55,
  children,
}) => {
  const { width, height } = useWindowDimensions();

  const verticalLines = useMemo(
    () => Array(Math.ceil(width / cellSize) + 1).fill(null),
    [cellSize, width],
  );
  const horizontalLines = useMemo(
    () => Array(Math.ceil(height / cellSize) + 1).fill(null),
    [cellSize, height],
  );

  // Khi có backgroundImage: tint bằng hex → rgba để fade mượt về tintColor.
  const tintRgba = useMemo(() => {
    if (!backgroundImage) return backgroundColor;
    const hex = tintColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${tintOpacity})`;
  }, [backgroundImage, tintColor, tintOpacity, backgroundColor]);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {backgroundImage ? (
        <Image
          source={backgroundImage}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      ) : null}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {verticalLines.map((_, index) => (
          <View
            key={`v-${index}`}
            style={[
              styles.verticalLine,
              {
                left: index * cellSize,
                width: lineWidth,
                backgroundColor: lineColor,
              },
            ]}
          />
        ))}
        {horizontalLines.map((_, index) => (
          <View
            key={`h-${index}`}
            style={[
              styles.horizontalLine,
              {
                top: index * cellSize,
                height: lineWidth,
                backgroundColor: lineColor,
              },
            ]}
          />
        ))}
        {showTopFade ? (
          <LinearGradient
            colors={[tintRgba, "rgba(11, 11, 15, 0)"]}
            style={[styles.topFade, { height: backgroundImage ? height * 0.25 : height * 0.35 }]}
          />
        ) : null}
        {showVignette ? <View style={styles.vignette} /> : null}
        {showBottomFade ? (
          <LinearGradient
            colors={["rgba(11, 11, 15, 0)", tintRgba]}
            style={[styles.bottomFade, backgroundImage ? { height: "55%" } : { height: "75%" }]}
          />
        ) : null}
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  verticalLine: {
    bottom: 0,
    position: "absolute",
    top: 0,
  },
  horizontalLine: {
    left: 0,
    position: "absolute",
    right: 0,
  },
  topFade: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  bottomFade: {
    bottom: 0,
    height: "75%",
    left: 0,
    position: "absolute",
    right: 0,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
});
