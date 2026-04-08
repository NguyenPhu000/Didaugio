import { StyleSheet, Text, View, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../../constants/design-tokens";

const AnimatedLoadingCard = () => {
  return (
    <View style={[styles.container, styles.shimmer]}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.content}>
        <View style={[styles.titlePlaceholder, styles.shimmer]} />
        <View style={[styles.subtitlePlaceholder, styles.shimmer]} />
        <View style={styles.footer}>
          <View style={[styles.pricePlaceholder, styles.shimmer]} />
          <View style={[styles.buttonPlaceholder, styles.shimmer]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280,
    height: 320,
    borderRadius: TOKENS.radius["2xl"],
    backgroundColor: TOKENS.color.card.light,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: TOKENS.color.neutral[900],
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
    }),
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: TOKENS.color.neutral[200],
  },
  content: {
    padding: 16,
    gap: 8,
  },
  titlePlaceholder: {
    height: 20,
    width: "80%",
    borderRadius: 4,
    backgroundColor: TOKENS.color.neutral[200],
  },
  subtitlePlaceholder: {
    height: 14,
    width: "60%",
    borderRadius: 4,
    backgroundColor: TOKENS.color.neutral[200],
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  pricePlaceholder: {
    height: 16,
    width: 60,
    borderRadius: 4,
    backgroundColor: TOKENS.color.neutral[200],
  },
  buttonPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: TOKENS.color.neutral[200],
  },
  shimmer: {
    backgroundColor: TOKENS.color.neutral[200],
  },
});

export default AnimatedLoadingCard;
