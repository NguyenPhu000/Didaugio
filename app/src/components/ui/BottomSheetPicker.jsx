import React, { forwardRef, useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View, Pressable, TextInput, ScrollView, ActivityIndicator } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../constants/design-tokens";

const ACCENT_BLUE = "#3478F6";
const APPLE_COLORS = {
  background: "#FFFFFF",
  text: "#1E293B",
  mutedText: "#64748B",
  border: "#F1F5F9",
  accent: "#3478F6",
  searchBg: "#F1F5F9",
};

// Các tỉnh thành phổ biến để hiển thị chọn nhanh
const POPULAR_PROVINCES = [
  "Cần Thơ",
  "Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Hậu Giang",
  "Vĩnh Long",
];

export const BottomSheetPicker = forwardRef(
  ({ data = [], selectedValue, onSelect, title, snapPoints = ["60%", "90%"], isLoading = false, showSearch = true }, ref) => {
    const [searchQuery, setSearchQuery] = useState("");

    // Reset search khi sheet đóng/mở ổn định qua onChange
    const handleSheetChange = useCallback((index) => {
      if (index === -1) {
        setSearchQuery("");
      }
    }, []);

    const handleDismiss = useCallback(() => {
      setSearchQuery("");
    }, []);

    // Sắp xếp dữ liệu theo Alphabet tiếng Việt
    const sortedData = useMemo(() => {
      if (!Array.isArray(data)) return [];
      return [...data].sort((a, b) =>
        String(a.label).localeCompare(String(b.label), "vi")
      );
    }, [data]);

    // Các tỉnh/thành phổ biến chọn nhanh
    const popularChips = useMemo(() => {
      const isProvincePicker =
        String(title || "").toLowerCase().includes("tỉnh") ||
        String(title || "").toLowerCase().includes("thành phố");

      if (!isProvincePicker || !sortedData.length) return [];

      return POPULAR_PROVINCES.map((name) => {
        const found = sortedData.find((item) =>
          String(item.label).toLowerCase().includes(name.toLowerCase())
        );
        return found ? { label: name, value: found.value } : null;
      }).filter(Boolean);
    }, [sortedData, title]);

    // Lọc dữ liệu theo từ khóa tìm kiếm
    const filteredData = useMemo(() => {
      if (!searchQuery.trim()) return sortedData;
      const query = searchQuery.toLowerCase().trim();
      return sortedData.filter(
        (item) =>
          String(item.label).toLowerCase().includes(query) ||
          String(item.value).toLowerCase().includes(query)
      );
    }, [sortedData, searchQuery]);

    // Backdrop với hiệu ứng mượt
    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.3}
        />
      ),
      []
    );

    // List Item render tối giản
    const renderItem = useCallback(
      ({ item }) => {
        const isSelected = item.value === selectedValue;

        return (
          <Pressable
            style={[
              styles.itemRow,
              isSelected && styles.itemRowSelected,
            ]}
            onPress={() => {
              onSelect(item.value);
              ref.current?.dismiss();
            }}
          >
            <Text
              style={[
                styles.itemText,
                isSelected && styles.itemTextSelected,
              ]}
            >
              {item.label}
            </Text>

            {isSelected && (
              <MaterialIcons name="check" size={20} color={ACCENT_BLUE} />
            )}
          </Pressable>
        );
      },
      [selectedValue, onSelect, ref]
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.bottomSheetBackground}
        onDismiss={handleDismiss}
        onChange={handleSheetChange}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable
            onPress={() => ref.current?.dismiss()}
            style={styles.closeBtn}
          >
            <MaterialIcons name="close" size={18} color={APPLE_COLORS.mutedText} />
          </Pressable>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <MaterialIcons
                name="search"
                size={20}
                color={APPLE_COLORS.mutedText}
                style={styles.searchIcon}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={`Tìm kiếm ${String(title || "").toLowerCase()}...`}
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                clearButtonMode="while-editing"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")} style={styles.clearBtn}>
                  <MaterialIcons name="cancel" size={18} color="#94A3B8" />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Chips Chọn Nhanh Tỉnh Thành */}
        {!searchQuery && popularChips.length > 0 && !isLoading && (
          <View style={styles.popularContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {popularChips.map((chip) => {
                const isChipSelected = chip.value === selectedValue;
                return (
                  <Pressable
                    key={chip.value}
                    style={[
                      styles.chipItem,
                      isChipSelected && styles.chipItemSelected,
                    ]}
                    onPress={() => {
                      onSelect(chip.value);
                      ref.current?.dismiss();
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isChipSelected && styles.chipTextSelected,
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* List Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={ACCENT_BLUE} />
            <Text style={styles.loadingText}>Đang tải danh sách...</Text>
          </View>
        ) : filteredData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>Không tìm thấy kết quả phù hợp</Text>
          </View>
        ) : (
          <BottomSheetFlatList
            data={filteredData}
            keyExtractor={(item, index) => `${item.value}-${index}`}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: APPLE_COLORS.background,
    borderRadius: 24,
  },
  handleIndicator: {
    backgroundColor: "#CBD5E1",
    width: 36,
    height: 4,
    borderRadius: 99,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: APPLE_COLORS.border,
  },
  title: {
    fontFamily: TOKENS.font.semibold,
    fontSize: 16,
    color: APPLE_COLORS.text,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: APPLE_COLORS.searchBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: APPLE_COLORS.text,
    fontFamily: TOKENS.font.body,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 2,
  },
  popularContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  chipsScroll: {
    paddingRight: 16,
  },
  chipItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 99,
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipItemSelected: {
    backgroundColor: "rgba(52, 120, 246, 0.08)",
    borderColor: "rgba(52, 120, 246, 0.2)",
  },
  chipText: {
    fontSize: 12.5,
    fontFamily: TOKENS.font.medium,
    color: "#475569",
  },
  chipTextSelected: {
    color: ACCENT_BLUE,
    fontFamily: TOKENS.font.semibold,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  itemRowSelected: {
    backgroundColor: "rgba(52, 120, 246, 0.02)",
  },
  itemText: {
    fontFamily: TOKENS.font.body,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.15,
    color: APPLE_COLORS.text,
    flex: 1,
    paddingRight: 10,
  },
  itemTextSelected: {
    color: ACCENT_BLUE,
    fontFamily: TOKENS.font.medium,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13.5,
    fontFamily: TOKENS.font.medium,
    color: APPLE_COLORS.mutedText,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
    color: APPLE_COLORS.mutedText,
  },
});
