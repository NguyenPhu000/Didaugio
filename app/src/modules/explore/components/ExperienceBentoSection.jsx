import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import { getPlaceLocation } from "../utils/exploreHelpers";

const SECTION_PAD = 24;

function BentoTile({ place, large = false, onPress }) {
  const imageUri = resolvePlaceImageUri(place);
  const category = place?.category?.name || "Ẩm thực";
  const location = getPlaceLocation(place);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.tileBase, large ? styles.tileLarge : styles.tileSmall]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          contentFit="cover"
          transition={220}
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <View style={styles.placeholder}>
          <MaterialIcons
            name="restaurant"
            size={large ? 36 : 28}
            color="#93C5FD"
          />
        </View>
      )}

      <View
        pointerEvents="none"
        style={[
          styles.overlayBase,
          large ? styles.overlayLarge : styles.overlaySmall,
        ]}
      />

      <View style={styles.contentWrap}>
        {!large ? (
          <View style={styles.pillMini}>
            <Text style={styles.pillMiniText} numberOfLines={1}>
              {category}
            </Text>
          </View>
        ) : null}

        <Text
          style={[styles.title, large ? styles.titleLarge : styles.titleSmall]}
          numberOfLines={2}
        >
          {place?.name || "Trải nghiệm đặc sắc"}
        </Text>

        {large ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {location}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function ExperienceBentoSectionInner({ places, onPressPlace }) {
  if (!Array.isArray(places) || places.length < 3) return null;

  const [hero, topRight, bottomRight] = places;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Trải nghiệm ẩm thực</Text>

      <View style={styles.glassShell}>
        <View style={styles.grid}>
          <BentoTile place={hero} large onPress={() => onPressPlace(hero)} />

          <View style={styles.sideColumn}>
            <BentoTile
              place={topRight}
              onPress={() => onPressPlace(topRight)}
            />
            <BentoTile
              place={bottomRight}
              onPress={() => onPressPlace(bottomRight)}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

export const ExperienceBentoSection = memo(ExperienceBentoSectionInner);

const styles = StyleSheet.create({
  container: {
    marginTop: 26,
    paddingHorizontal: SECTION_PAD,
  },
  heading: {
    color: TOKENS.color.neutral[900],
    fontSize: 31,
    lineHeight: 38,
    letterSpacing: -0.7,
    fontFamily: TOKENS.font.heading,
    marginBottom: 14,
  },
  glassShell: {
    borderRadius: 34,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "rgba(196,198,204,0.42)",
    shadowColor: "#191c1e",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 26,
    elevation: 8,
  },
  grid: {
    flexDirection: "row",
    gap: 10,
    height: 308,
  },
  sideColumn: {
    flex: 1,
    gap: 10,
  },
  tileBase: {
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#E0E3E5",
    position: "relative",
  },
  tileLarge: {
    flex: 1.18,
  },
  tileSmall: {
    flex: 1,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0E3E5",
  },
  overlayBase: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayLarge: {
    backgroundColor: "rgba(0,3,8,0.54)",
  },
  overlaySmall: {
    backgroundColor: "rgba(0,3,8,0.34)",
  },
  contentWrap: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
  },
  pillMini: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 999,
    justifyContent: "center",
    marginBottom: 6,
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "rgba(224,227,229,0.9)",
  },
  pillMiniText: {
    color: "#0F172A",
    fontSize: 10,
    fontFamily: TOKENS.font.semibold,
  },
  title: {
    color: "#FFFFFF",
    letterSpacing: -0.2,
    fontFamily: TOKENS.font.heading,
  },
  titleLarge: {
    fontSize: 30,
    lineHeight: 34,
  },
  titleSmall: {
    fontSize: 19,
    lineHeight: 22,
  },
  subtitle: {
    marginTop: 4,
    color: "rgba(255,255,255,0.86)",
    fontSize: 11,
    fontFamily: TOKENS.font.medium,
  },
});
