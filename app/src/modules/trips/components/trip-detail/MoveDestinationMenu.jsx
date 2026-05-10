import { memo, useCallback, useMemo, forwardRef } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { TOKENS } from "../../../../constants/design-tokens";
import { formatDate, calcDayCount } from "../../utils/tripHelpers";

const MoveDestinationMenu = forwardRef(function MoveDestinationMenu(
  { trip, currentDayNumber, destId, onMove, isLoading },
  ref,
) {
  const snapPoints = useMemo(() => ["45%"], []);

  const days = useMemo(() => {
    if (!trip) return [];
    const total = calcDayCount(trip);
    const result = [];
    for (let i = 1; i <= total; i++) {
      if (i !== currentDayNumber) {
        const date = trip.startDate
          ? new Date(new Date(trip.startDate).getTime() + (i - 1) * 86400000)
          : null;
        result.push({ dayNumber: i, date });
      }
    }
    return result;
  }, [trip, currentDayNumber]);

  const handlePress = useCallback(
    (dayNumber) => {
      onMove({ destId, newDayNumber: dayNumber, newOrder: 0 });
    },
    [destId, onMove],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <Pressable
        style={({ pressed }) => [
          styles.item,
          pressed && { backgroundColor: "rgba(0,0,0,0.04)" },
        ]}
        onPress={() => handlePress(item.dayNumber)}
        disabled={isLoading}
      >
        <View style={styles.itemLeft}>
          <View style={styles.itemIcon}>
            <MaterialIcons
              name="calendar-today"
              size={16}
              color="rgba(0,0,0,0.4)"
            />
          </View>
          <View>
            <Text style={styles.itemText}>Ngay {item.dayNumber}</Text>
            {item.date && (
              <Text style={styles.itemDate}>{formatDate(item.date)}</Text>
            )}
          </View>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color="#1D1D1F" />
        ) : (
          <MaterialIcons
            name="arrow-forward-ios"
            size={14}
            color="rgba(0,0,0,0.2)"
          />
        )}
      </Pressable>
    ),
    [handlePress, isLoading],
  );

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.indicator}
    >
      <View style={styles.header}>
        <MaterialIcons name="swap-vert" size={20} color="#1D1D1F" />
        <Text style={styles.title}>Chuyen den ngay</Text>
      </View>
      <BottomSheetFlatList
        data={days}
        keyExtractor={(item) => String(item.dayNumber)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  indicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  title: {
    fontSize: 18,
    fontFamily: TOKENS.font.semibold,
    color: "#1D1D1F",
    letterSpacing: -0.3,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.04)",
    borderRadius: 12,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
    color: "#1D1D1F",
    letterSpacing: -0.2,
  },
  itemDate: {
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    color: "rgba(0,0,0,0.4)",
    marginTop: 1,
    letterSpacing: -0.1,
  },
});

export default memo(MoveDestinationMenu);
