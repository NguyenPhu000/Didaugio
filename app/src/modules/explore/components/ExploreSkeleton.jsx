import { memo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Skeleton } from "../../../components/ui/Skeleton.jsx";

const SCREEN_W = Dimensions.get("window").width;
const PAD = 24;
const CARD_W = Math.min(260, SCREEN_W - PAD * 2 - 60);
const GRID_GAP = 12;
const POP_W = (SCREEN_W - PAD * 2 - GRID_GAP) / 2;

function ExploreSkeletonInner() {
  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Skeleton width="65%" height={22} borderRadius={8} />
          <Skeleton
            width="50%"
            height={13}
            borderRadius={6}
            style={styles.mt4}
          />
        </View>
        <Skeleton width={90} height={36} borderRadius={999} />
      </View>

      {/* Search bar skeleton */}
      <Skeleton
        width="100%"
        height={54}
        borderRadius={18}
        style={styles.mt18}
      />

      {/* Category pills skeleton */}
      <View style={styles.pillRow}>
        <Skeleton width={80} height={38} borderRadius={999} />
        <Skeleton width={90} height={38} borderRadius={999} />
        <Skeleton width={75} height={38} borderRadius={999} />
        <Skeleton width={85} height={38} borderRadius={999} />
      </View>

      {/* Section header skeleton */}
      <View style={styles.sectionHeader}>
        <Skeleton width={140} height={18} borderRadius={8} />
        <Skeleton width={70} height={13} borderRadius={6} />
      </View>

      {/* Featured cards skeleton */}
      <View style={styles.cardsRow}>
        <Skeleton width={CARD_W} height={300} borderRadius={24} />
        <Skeleton width={CARD_W} height={300} borderRadius={24} />
      </View>

      {/* Popular section header */}
      <View style={styles.sectionHeader2}>
        <Skeleton width={100} height={18} borderRadius={8} />
      </View>

      {/* Popular grid skeleton */}
      <View style={styles.gridRow}>
        <View>
          <Skeleton width={POP_W} height={POP_W * 1.05} borderRadius={20} />
          <View style={styles.gridInfo}>
            <Skeleton width="70%" height={14} borderRadius={6} />
            <Skeleton
              width="50%"
              height={11}
              borderRadius={6}
              style={styles.mt4}
            />
          </View>
        </View>
        <View>
          <Skeleton width={POP_W} height={POP_W * 1.05} borderRadius={20} />
          <View style={styles.gridInfo}>
            <Skeleton width="60%" height={14} borderRadius={6} />
            <Skeleton
              width="45%"
              height={11}
              borderRadius={6}
              style={styles.mt4}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

export const ExploreSkeleton = memo(ExploreSkeletonInner);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: PAD,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
  },
  mt4: {
    marginTop: 4,
  },
  mt18: {
    marginTop: 18,
  },
  pillRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 16,
  },
  sectionHeader2: {
    marginTop: 28,
    marginBottom: 16,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 14,
  },
  gridRow: {
    flexDirection: "row",
    gap: GRID_GAP,
  },
  gridInfo: {
    padding: 12,
  },
});
