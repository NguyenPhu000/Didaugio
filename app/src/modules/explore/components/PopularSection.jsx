import { memo, useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { TOKENS } from "../../../constants/design-tokens";
import { PopularCard } from "./PopularCard";

const TEXT_COLOR = "#0F172A";
const PAD = 24;

function PopularSectionInner({ places, onPressPlace, title = "Phổ biến" }) {
  if (!places?.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.list}>
        {places.map((place) => (
          <PopularCard
            key={String(place?.id)}
            place={place}
            onPress={() => onPressPlace(place)}
          />
        ))}
      </View>
    </View>
  );
}

export const PopularSection = memo(PopularSectionInner);

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    paddingHorizontal: PAD,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    color: TEXT_COLOR,
    fontSize: 33,
    lineHeight: 38,
    letterSpacing: -0.8,
    fontFamily: TOKENS.font.heading,
  },
  list: {
    gap: 12,
  },
});
