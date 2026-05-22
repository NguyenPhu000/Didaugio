import { memo, useMemo } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { getLocationText } from "../utils/savedHelpers";

const PlaceRow = memo(function PlaceRow({ entry, onSelect }) {
  const place = entry?.place || entry;
  return (
    <Pressable
      onPress={() => onSelect(entry)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowIconWrap}>
        <MaterialIcons name="place" size={18} color="#007AFF" />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {place?.name || "Địa điểm"}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {getLocationText(place)}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={APPLE_THEME.textMuted} />
    </Pressable>
  );
});

export const PlacePickerModal = memo(function PlacePickerModal({
  visible,
  savedData,
  onClose,
  onSelect,
}) {
  const places = useMemo(
    () => (savedData || []).filter((e) => (e?.place || e)?.id),
    [savedData],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Chọn địa điểm</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={22} color={APPLE_THEME.textMuted} />
            </Pressable>
          </View>

          {places.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialIcons name="bookmark-border" size={32} color={APPLE_THEME.textMuted} />
              <Text style={styles.emptyText}>
                Bạn chưa lưu địa điểm nào. Hãy lưu địa điểm trước khi tạo ghi chú.
              </Text>
            </View>
          ) : (
            <FlatList
              data={places}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <PlaceRow entry={item} onSelect={onSelect} />
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    maxHeight: "70%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
    paddingBottom: 34,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignSelf: "center",
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  title: {
    color: APPLE_THEME.text,
    fontSize: 18,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.3,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,122,255,0.1)",
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    color: APPLE_THEME.text,
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.2,
  },
  rowSubtitle: {
    color: APPLE_THEME.textMuted,
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginLeft: 48,
  },
  emptyWrap: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 32,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: APPLE_THEME.textMuted,
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    textAlign: "center",
    lineHeight: 20,
  },
});
