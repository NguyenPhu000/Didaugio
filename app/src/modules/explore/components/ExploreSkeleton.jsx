import { memo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Skeleton } from "../../../components/ui/Skeleton.jsx";
import { TOKENS } from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";

const SCREEN_W = Dimensions.get("window").width;
const PAD = TAB_SCREEN_PADDING;
const CARD_W = Math.min(260, SCREEN_W - PAD * 2 - 60);
const POP_IMAGE_SIZE = 110;

function ExploreSkeletonInner() {
  return (
    <View style={styles.container}>
      {/* Header skeleton — avatar + greeting */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarRow}>
            <Skeleton width={48} height={48} borderRadius={24} />
            <View style={styles.headerTextCol}>
              <Skeleton width="40%" height={13} borderRadius={6} />
              <Skeleton
                width="55%"
                height={16}
                borderRadius={6}
                style={styles.mt4}
              />
            </View>
          </View>
        </View>
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>

      {/* Title skeleton */}
      <Skeleton
        width="80%"
        height={26}
        borderRadius={8}
        style={styles.mt20}
      />
      <Skeleton
        width="60%"
        height={14}
        borderRadius={6}
        style={styles.mt8}
      />

      {/* Search bar skeleton */}
      <Skeleton
        width="100%"
        height={54}
        borderRadius={999}
        style={styles.mt22}
      />

      {/* Category pills skeleton */}
      <View style={styles.pillRow}>
        <Skeleton width={80} height={42} borderRadius={999} />
        <Skeleton width={90} height={42} borderRadius={999} />
        <Skeleton width={75} height={42} borderRadius={999} />
        <Skeleton width={85} height={42} borderRadius={999} />
      </View>

      {/* Quick Actions skeleton — 2 rows of 4 */}
      <View style={styles.quickActionsGrid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`qa-${i}`} style={styles.quickActionItem}>
            <Skeleton width={64} height={64} borderRadius={22} />
            <Skeleton
              width={48}
              height={11}
              borderRadius={6}
              style={styles.mt8}
            />
          </View>
        ))}
      </View>

      {/* Featured section header skeleton */}
      <View style={styles.sectionHeader}>
        <Skeleton width={140} height={22} borderRadius={8} />
        <Skeleton width={70} height={13} borderRadius={6} />
      </View>

      {/* Featured cards skeleton */}
      <View style={styles.cardsRow}>
        <Skeleton width={CARD_W} height={400} borderRadius={32} />
        <Skeleton width={CARD_W} height={400} borderRadius={32} />
      </View>

      {/* Bento section header skeleton */}
      <View style={styles.sectionHeader}>
        <Skeleton width={130} height={22} borderRadius={8} />
      </View>

      {/* Bento grid skeleton */}
      <View style={styles.bentoShell}>
        <View style={styles.bentoRow}>
          <Skeleton width="55%" height={280} borderRadius={20} />
          <View style={styles.bentoSideCol}>
            <Skeleton width="100%" height={136} borderRadius={20} />
            <Skeleton width="100%" height={136} borderRadius={20} />
          </View>
        </View>
      </View>

      {/* Popular section header skeleton */}
      <View style={styles.sectionHeader}>
        <Skeleton width={150} height={22} borderRadius={8} />
      </View>

      {/* Popular list skeleton — horizontal card style */}
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={`pop-${i}`} style={styles.popularCardRow}>
          <Skeleton
            width={POP_IMAGE_SIZE}
            height={POP_IMAGE_SIZE}
            borderRadius={22}
          />
          <View style={styles.popularInfoCol}>
            <Skeleton width="35%" height={11} borderRadius={6} />
            <Skeleton
              width="85%"
              height={16}
              borderRadius={6}
              style={styles.mt4}
            />
            <Skeleton
              width="55%"
              height={12}
              borderRadius={6}
              style={styles.mt4}
            />
            <View style={styles.popularBottomRow}>
              <Skeleton width={60} height={15} borderRadius={6} />
              <Skeleton width={60} height={32} borderRadius={999} />
            </View>
          </View>
        </View>
      ))}
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
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTextCol: {
    gap: 2,
  },
  mt4: {
    marginTop: 4,
  },
  mt8: {
    marginTop: 8,
  },
  mt20: {
    marginTop: 20,
  },
  mt22: {
    marginTop: 22,
  },
  pillRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 0,
    rowGap: 20,
  },
  quickActionItem: {
    width: "25%",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 14,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 14,
  },
  bentoShell: {
    borderRadius: 28,
    padding: 10,
    backgroundColor: "#FFFFFF",
  },
  bentoRow: {
    flexDirection: "row",
    gap: 8,
    height: 280,
  },
  bentoSideCol: {
    flex: 1,
    gap: 8,
  },
  popularCardRow: {
    flexDirection: "row",
    gap: 14,
    padding: 10,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  popularInfoCol: {
    flex: 1,
    gap: 3,
    justifyContent: "center",
  },
  popularBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
  },
});
