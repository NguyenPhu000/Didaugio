import React, { memo } from "react";
import { View, FlatList, Pressable } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { resolveMediaUrl } from "../../../lib/media-url";
import { cn } from "../../../lib/cn";

const ICON_BUTTON_SHADOW = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 6,
  elevation: 4,
};

export const PlaceHeroGallery = memo(
  ({
    heroHeight,
    palette,
    imageListRef,
    galleryImages,
    fallbackImage,
    handleImageScroll,
    screenWidth,
    insets,
    router,
    handleAddToTrip,
    activeImage,
    t,
  }) => {
    return (
      <View
        className="relative"
        style={{
          height: heroHeight,
          backgroundColor: palette.heroFallback,
        }}
      >
        <FlatList
          ref={imageListRef}
          data={
            galleryImages.length > 0
              ? galleryImages
              : [{ _fallback: true }]
          }
          keyExtractor={(item, index) => String(item?.id || index)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleImageScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          removeClippedSubviews
          maxToRenderPerBatch={3}
          windowSize={3}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          renderItem={({ item }) => {
            const uri = item?._fallback
              ? fallbackImage
              : resolveMediaUrl(
                  item?.secureUrl ||
                    item?.thumbnailUrl ||
                    item?.imageData ||
                    item?.url ||
                    fallbackImage
                );
            return uri ? (
              <Image
                source={{ uri }}
                style={{ width: screenWidth, height: heroHeight }}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            ) : (
              <View
                className="h-full items-center justify-center"
                style={{
                  width: screenWidth,
                  backgroundColor: palette.heroFallback,
                }}
              >
                <MaterialIconsRounded
                  name="travel-explore"
                  size={54}
                  color={TOKENS.color.surface.light}
                />
              </View>
            );
          }}
        />

        {/* BlurView Controls */}
        <View
          className="absolute left-4 right-4 flex-row items-center justify-between"
          style={{ top: insets.top + 10 }}
        >
          <BlurView
            intensity={45}
            tint="light"
            className="h-11 w-11 overflow-hidden rounded-full items-center justify-center"
            style={[
              ICON_BUTTON_SHADOW,
              {
                backgroundColor: "rgba(255,255,255,0.48)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.62)",
              },
            ]}
          >
            <Pressable
              onPress={() => router.back()}
              className="h-full w-full items-center justify-center active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel={t("common.back")}
            >
              <MaterialIconsRounded
                name="arrow-back-ios-new"
                size={17}
                color={palette.text}
              />
            </Pressable>
          </BlurView>

          <BlurView
            intensity={45}
            tint="light"
            className="h-11 w-11 overflow-hidden rounded-full items-center justify-center"
            style={[
              ICON_BUTTON_SHADOW,
              {
                backgroundColor: "rgba(255,255,255,0.48)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.62)",
              },
            ]}
          >
            <Pressable
              onPress={handleAddToTrip}
              className="h-full w-full items-center justify-center active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel={t("place.addLeg")}
            >
              <MaterialIconsRounded
                name="playlist-add"
                size={19}
                color={palette.text}
              />
            </Pressable>
          </BlurView>
        </View>

        {/* Bottom vignette */}
        <View
          className="absolute left-0 right-0 bottom-0 h-20"
          style={{ backgroundColor: "rgba(0,0,0,0.42)" }}
          pointerEvents="none"
        />

        {/* Image Position Indicator */}
        {galleryImages.length > 1 ? (
          <View className="absolute bottom-8 self-center flex-row gap-1.5">
            {galleryImages.map((imageItem, index) => (
              <View
                key={imageItem?.id || index}
                className={cn(
                  "h-[5px] rounded-full",
                  index === activeImage
                    ? "w-4 bg-white"
                    : "w-[5px] bg-white/50"
                )}
              />
            ))}
          </View>
        ) : null}
      </View>
    );
  }
);

PlaceHeroGallery.displayName = "PlaceHeroGallery";
export default PlaceHeroGallery;
