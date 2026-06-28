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

  const fadeColor = useMemo(() => {
    if (backgroundImage) {
      return "rgba(2, 6, 23, 0.45)"; // Màu xanh đen bán trong suốt nhẹ để lộ ảnh bầu trời
    }
    return backgroundColor;
  }, [backgroundImage, backgroundColor]);

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
            colors={[fadeColor, "rgba(2, 6, 23, 0)"]}
            style={[styles.topFade, { height: backgroundImage ? height * 0.18 : height * 0.35 }]}
          />
        ) : null}
        {showVignette ? <View style={styles.vignette} /> : null}
        {showBottomFade ? (
          <LinearGradient
            colors={["rgba(2, 6, 23, 0)", fadeColor]}
            style={[styles.bottomFade, backgroundImage ? { height: "45%" } : { height: "75%" }]}
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
    backgroundColor: "rgba(0,0,0,0.22)",
  },
});
