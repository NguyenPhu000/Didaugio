import { memo, useCallback, useMemo } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { BOOKING_APPLE_THEME as APPLE_THEME, TOKENS } from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import {
  ALL_AREAS_KEY,
  ALL_COLLECTIONS_KEY,
} from "../utils/savedHelpers";

const FilterChip = memo(function FilterChip({ icon, label, active, onPress, onLongPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      style={[
        styles.chip,
        active ? styles.chipActive : styles.chipIdle,
      ]}
    >
      {icon ? (
        <MaterialIconsRounded
          name={icon}
          size={13}
          color={active ? "#FFFFFF" : APPLE_THEME.textMuted}
        />
      ) : null}
      <Text
        numberOfLines={1}
        style={[styles.chipText, active && styles.chipTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
});

function FilterRow({ title, data, activeKey, onChange, onLongPressItem }) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterLabel}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {data.map((item) => (
          <FilterChip
            key={item.key}
            icon={item.icon}
            label={item.name}
            active={activeKey === item.key}
            onPress={() => onChange(item.key)}
            onLongPress={item.key !== ALL_COLLECTIONS_KEY && item.key !== ALL_AREAS_KEY
              ? () => onLongPressItem?.(item.key, item.name)
              : undefined
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

export const SavedDashboard = memo(function SavedDashboard({
  savedData,
  filteredCount,
  collectionOptions,
  areaOptions,
  activeCollection,
  activeArea,
  onChangeCollection,
  onChangeArea,
  onRenameCollection,
  onDeleteCollection,
}) {
  const collectionFilterData = useMemo(
    () => [
      {
        key: ALL_COLLECTIONS_KEY,
        icon: "collections-bookmark",
        name: `Tất cả (${savedData.length})`,
      },
      ...collectionOptions.map((option) => ({
        ...option,
        icon: option.icon || "category",
      })),
    ],
    [collectionOptions, savedData.length],
  );

  const areaFilterData = useMemo(
    () => [
      {
        key: ALL_AREAS_KEY,
        icon: "map",
        name: `Mọi khu vực (${savedData.length})`,
      },
      ...areaOptions.map((area) => ({ ...area, icon: "place" })),
    ],
    [areaOptions, savedData.length],
  );

  const handleCollectionLongPress = useCallback((collectionName) => {
    if (!collectionName || collectionName === ALL_COLLECTIONS_KEY) return;

    const showOptions = (options) => {
      const labels = options.map((o) => o.label);
      const handlers = options.map((o) => o.handler);

      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          { options: [...labels, "Hủy"], cancelButtonIndex: labels.length },
          (index) => {
            if (index < labels.length) handlers[index]();
          },
        );
      } else {
        Alert.alert(
          "Quản lý bộ sưu tập",
          `Bộ sưu tập: ${collectionName}`,
          [
            ...options.map((o) => ({ text: o.label, onPress: o.handler })),
            { text: "Hủy", style: "cancel" },
          ],
        );
      }
    };

    showOptions([
      {
        label: "Đổi tên",
        handler: () => {
          if (Platform.OS === "ios") {
            Alert.prompt(
              "Đổi tên bộ sưu tập",
              `Nhập tên mới cho "${collectionName}"`,
              (newName) => {
                if (newName?.trim()) onRenameCollection?.(collectionName, newName.trim());
              },
              "plain-text",
              collectionName,
            );
          } else {
            // On Android, Alert.prompt is not available, use a simple approach
            onRenameCollection?.(collectionName);
          }
        },
      },
      {
        label: "Xóa",
        handler: () => {
          Alert.alert(
            "Xóa bộ sưu tập",
            `Bạn có chắc muốn xóa "${collectionName}"? Các địa điểm sẽ không bị xóa.`,
            [
              { text: "Hủy", style: "cancel" },
              {
                text: "Xóa",
                style: "destructive",
                onPress: () => onDeleteCollection?.(collectionName),
              },
            ],
          );
        },
      },
    ]);
  }, [onRenameCollection, onDeleteCollection]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Đã lưu</Text>
        {filteredCount > 0 ? (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredCount}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.filters}>
        <FilterRow
          title="Bộ sưu tập"
          data={collectionFilterData}
          activeKey={activeCollection}
          onChange={onChangeCollection}
          onLongPressItem={(key, name) => handleCollectionLongPress(key)}
        />
        <FilterRow
          title="Khu vực"
          data={areaFilterData}
          activeKey={activeArea}
          onChange={onChangeArea}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: TAB_SCREEN_PADDING,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: APPLE_THEME.text,
    letterSpacing: -0.8,
    fontFamily: TOKENS.font.heading,
  },
  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  countText: {
    fontSize: 13,
    fontWeight: "600",
    color: APPLE_THEME.textMuted,
    fontFamily: TOKENS.font.semibold,
  },
  filters: {
    gap: 14,
  },
  filterSection: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: APPLE_THEME.textMuted,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    fontFamily: TOKENS.font.semibold,
  },
  filterScroll: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipActive: {
    backgroundColor: APPLE_THEME.text,
  },
  chipIdle: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: APPLE_THEME.text,
    letterSpacing: -0.1,
    fontFamily: TOKENS.font.medium,
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
});
