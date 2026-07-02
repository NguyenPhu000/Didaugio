import { BlurView } from "expo-blur";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

function AnimatedItem({
  index,
  scrollY,
  itemHeight,
  spacing,
  rotationAngle,
  scaleInactive,
  opacityInactive,
  showBlur,
  blurIntensity,
  children,
  totalItems,
  endSpacing,
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * (itemHeight + spacing),
      index * (itemHeight + spacing),
      (index + 1) * (itemHeight + spacing),
    ];

    const scale = interpolate(
      scrollY.value,
      inputRange,
      [scaleInactive, 1, scaleInactive],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      scrollY.value,
      inputRange,
      [opacityInactive, 1, opacityInactive],
      Extrapolation.CLAMP,
    );

    const rotateZ = interpolate(
      scrollY.value,
      inputRange,
      [rotationAngle, 0, -rotationAngle],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        { scale },
        { rotateZ: `${rotateZ}deg` },
        { perspective: 1000 },
      ],
      opacity,
    };
  });

  const blurOpacity = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * (itemHeight + spacing),
      index * (itemHeight + spacing),
      (index + 1) * (itemHeight + spacing),
    ];

    const blur = interpolate(
      scrollY.value,
      inputRange,
      [1, 0, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity: blur,
    };
  });

  return (
    <Animated.View
      style={[
        styles.itemContainer,
        animatedStyle,
        {
          marginBottom: index === totalItems - 1 ? endSpacing : spacing,
        },
      ]}
    >
      <View style={styles.itemContent}>
        {children}
        {showBlur && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              blurOpacity,
              { overflow: "hidden" },
            ]}
            pointerEvents="none"
          >
            <BlurView
              intensity={blurIntensity}
              style={[
                StyleSheet.absoluteFill,
                {
                  overflow: "hidden",
                },
              ]}
              tint="dark"
            />
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

export default function VerticalFlowCarousel({
  data = [],
  renderItem,
  keyExtractor,
  itemHeight = 120,
  spacing = 50,
  containerStyle,
  contentContainerStyle,
  ListHeaderComponent,
  ListEmptyComponent,
  ListFooterComponent,
  refreshControl,
  showBlur = true,
  blurIntensity = 16,
  rotationAngle = 12,
  scaleInactive = 0.85,
  opacityInactive = 0.5,
  snapEnabled = true,
  endSpacing = 400,
}) {
  const scrollY = useSharedValue(0);
  const [headerHeight, setHeaderHeight] = React.useState(0);
  const hasHeader = Boolean(ListHeaderComponent);

  const snapToOffsets = React.useMemo(() => {
    if (!snapEnabled || !hasHeader || data.length === 0) return undefined;
    return data.map((_, index) => headerHeight + index * (itemHeight + spacing));
  }, [data, hasHeader, headerHeight, itemHeight, snapEnabled, spacing]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        snapToInterval={
          snapEnabled && !hasHeader ? itemHeight + spacing : undefined
        }
        snapToOffsets={snapToOffsets}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      >
        {ListHeaderComponent ? (
          <View
            onLayout={(event) => {
              const nextHeight = event.nativeEvent.layout.height;
              if (Math.abs(nextHeight - headerHeight) > 1) {
                setHeaderHeight(nextHeight);
              }
            }}
          >
            {typeof ListHeaderComponent === "function" ? (
              <ListHeaderComponent />
            ) : (
              ListHeaderComponent
            )}
          </View>
        ) : null}
        {data.length === 0 && ListEmptyComponent
          ? typeof ListEmptyComponent === "function"
            ? <ListEmptyComponent />
            : ListEmptyComponent
          : null}
        {data.map((item, index) => (
          <AnimatedItem
            key={keyExtractor ? keyExtractor(item, index) : index}
            index={index}
            scrollY={scrollY}
            itemHeight={itemHeight}
            spacing={spacing}
            rotationAngle={rotationAngle}
            scaleInactive={scaleInactive}
            opacityInactive={opacityInactive}
            showBlur={showBlur}
            blurIntensity={blurIntensity}
            totalItems={data.length}
            endSpacing={endSpacing}
          >
            {renderItem(item, index)}
          </AnimatedItem>
        ))}
        {ListFooterComponent ? (
          typeof ListFooterComponent === "function" ? (
            <ListFooterComponent />
          ) : (
            ListFooterComponent
          )
        ) : null}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {},
  itemContainer: {
    width: "100%",
  },
  itemContent: {
    width: "100%",
  },
});
