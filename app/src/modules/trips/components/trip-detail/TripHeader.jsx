import { memo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { formatDate, formatDistance } from "../../utils/tripHelpers";
import s, { T, TOKENS } from "../../utils/tripDetailTokens";

export const TripHeader = memo(function TripHeader({
  trip,
  onEditTrip,
  onDeleteTrip,
  isDeleting,
  isSaved,
  onToggleSave,
  onAddPlace,
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!trip) return null;

  const dateRange =
    trip.startDate && trip.endDate
      ? `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`
      : trip.startDate
        ? `Từ ${formatDate(trip.startDate)}`
        : null;

  const totalDistanceLabel = formatDistance(trip.totalDistance);

  return (
    <View style={s.header}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        style={({ pressed }) => [
          styles.navBtn,
          pressed ? styles.navBtnPressed : null,
        ]}
      >
        <MaterialIcons name="arrow-back-ios-new" size={16} color={T.ink} />
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {trip.title}
        </Text>
        {dateRange || totalDistanceLabel ? (
          <View style={styles.metaRow}>
            {dateRange ? (
              <View style={styles.metaChip}>
                <MaterialIcons name="calendar-today" size={10} color={T.muted48} />
                <Text style={styles.metaText} numberOfLines={1}>{dateRange}</Text>
              </View>
            ) : null}
            {dateRange && totalDistanceLabel ? <View style={styles.metaDot} /> : null}
            {totalDistanceLabel ? (
              <View style={styles.metaChip}>
                <MaterialIcons name="route" size={10} color={T.muted48} />
                <Text style={styles.metaText} numberOfLines={1}>{totalDistanceLabel}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => setIsMenuOpen(true)}
          hitSlop={10}
          style={({ pressed }) => [
            styles.iconBtn,
            pressed ? styles.navBtnPressed : null,
          ]}
        >
          <MaterialIcons name="more-horiz" size={20} color={T.ink} />
        </Pressable>
        <Pressable
          onPress={() => (onAddPlace ? onAddPlace() : router.push("/explore"))}
          style={({ pressed }) => [styles.addBtn, pressed ? { opacity: 0.85 } : null]}
        >
          <MaterialIcons name="add" size={18} color={T.onPrimary} />
          <Text style={styles.addBtnText}>Thêm</Text>
        </Pressable>
      </View>

      <Modal
        visible={isMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setIsMenuOpen(false)}>
          <View
            style={[styles.popover, { top: insets.top + 48 }]}
            onStartShouldSetResponder={() => true}
          >
            {onToggleSave ? (
              <Pressable
                style={styles.rowPressable}
                onPress={() => {
                  setIsMenuOpen(false);
                  onToggleSave();
                }}
              >
                {({ pressed }) => (
                  <View style={[styles.row, pressed && styles.rowPressed]}>
                    <View
                      style={[
                        styles.rowIcon,
                        isSaved && { backgroundColor: "rgba(255,159,10,0.08)" },
                      ]}
                    >
                      <MaterialIcons
                        name={isSaved ? "bookmark" : "bookmark-border"}
                        size={16}
                        color={isSaved ? "#FF9F0A" : T.ink}
                      />
                    </View>
                    <Text
                      style={[styles.rowText, isSaved && styles.rowTextActive]}
                      numberOfLines={1}
                    >
                      {isSaved ? "Bỏ lưu" : "Lưu chuyến đi"}
                    </Text>
                  </View>
                )}
              </Pressable>
            ) : null}

            <Pressable
              style={styles.rowPressable}
              onPress={() => {
                setIsMenuOpen(false);
                onEditTrip();
              }}
            >
              {({ pressed }) => (
                <View style={[styles.row, pressed && styles.rowPressed]}>
                  <View style={styles.rowIcon}>
                    <MaterialIcons name="edit" size={16} color={T.ink} />
                  </View>
                  <Text style={styles.rowText} numberOfLines={1}>
                    Sửa thông tin
                  </Text>
                </View>
              )}
            </Pressable>

            <View style={styles.separator} />

            <Pressable
              style={styles.rowPressable}
              onPress={() => {
                setIsMenuOpen(false);
                onDeleteTrip();
              }}
            >
              {({ pressed }) => (
                <View style={[styles.row, pressed && styles.rowPressed]}>
                  <View
                    style={[
                      styles.rowIcon,
                      { backgroundColor: "rgba(255,59,48,0.06)" },
                    ]}
                  >
                    <MaterialIcons name="delete-outline" size={16} color={T.danger} />
                  </View>
                  <Text style={[styles.rowText, styles.rowTextDanger]} numberOfLines={1}>
                    Xóa chuyến đi
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
    flexShrink: 0,
  },
  navBtnPressed: {
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  center: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontFamily: TOKENS.font.semibold,
    color: T.ink,
    letterSpacing: -0.374,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 1,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flexShrink: 0,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(0,0,0,0.15)",
    flexShrink: 0,
  },
  metaText: {
    fontSize: 11,
    fontFamily: TOKENS.font.body,
    color: T.muted48,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
    marginLeft: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
    flexShrink: 0,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: T.ink,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    flexShrink: 0,
  },
  addBtnText: {
    color: T.onPrimary,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.15,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "transparent",
  },
  popover: {
    position: "absolute",
    right: 16,
    width: 170,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  rowPressable: {
    borderRadius: 10,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  rowPressed: {
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    fontFamily: TOKENS.font.medium,
    color: "#1D1D1F",
    letterSpacing: -0.15,
    minWidth: 0,
  },
  rowTextActive: {
    color: "#FF9F0A",
    fontFamily: TOKENS.font.semibold,
  },
  rowTextDanger: {
    color: T.danger,
    fontFamily: TOKENS.font.semibold,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 4,
    marginHorizontal: 8,
  },
});
