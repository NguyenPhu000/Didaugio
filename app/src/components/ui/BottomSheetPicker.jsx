import React, { forwardRef, useCallback, useMemo, useState } from "react";
import { Text, View, Pressable, TextInput, ScrollView, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { cn } from "../../lib/cn";
import { TOKENS } from "../../constants/design-tokens";

const ACCENT_BLUE = "#3478F6";

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
  function BottomSheetPickerInner({ data = [], selectedValue, onSelect, title, snapPoints = ["60%", "90%"], isLoading = false, showSearch = true }, ref) {
    const { t } = useTranslation();
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
            className={cn(
              "flex-row items-center justify-between py-[18px] px-3 border-b border-slate-100",
              isSelected && "bg-blue-500/[0.02]",
            )}
            onPress={() => {
              onSelect(item.value);
              ref.current?.dismiss();
            }}
          >
            <Text
              className={cn(
                "flex-1 text-[15px] leading-[22px] tracking-[0.15px] text-slate-800 font-body pr-2.5",
                isSelected && "text-blue-500 font-medium",
              )}
            >
              {item.label}
            </Text>

            {isSelected && (
              <MaterialIconsRounded name="check" size={20} color={ACCENT_BLUE} />
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
        handleIndicatorStyle={{ backgroundColor: "#CBD5E1", width: 36, height: 4, borderRadius: 99 }}
        backgroundStyle={{ backgroundColor: "#FFFFFF", borderRadius: 24 }}
        onDismiss={handleDismiss}
        onChange={handleSheetChange}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-3 border-b border-slate-100">
          <Text className="font-semibold text-base text-slate-800">{title}</Text>
          <Pressable
            onPress={() => ref.current?.dismiss()}
            className="w-7 h-7 rounded-[14px] bg-slate-100 items-center justify-center"
          >
            <MaterialIconsRounded name="close" size={18} color="#64748B" />
          </Pressable>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View className="px-4 py-2">
            <View className="flex-row items-center bg-slate-100 rounded-xl px-3 h-10">
              <MaterialIconsRounded
                name="search"
                size={20}
                color="#64748B"
                style={{ marginRight: 6 }}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t("bottomSheetPicker.searchPlaceholder", { title: String(title || "").toLowerCase() })}
                placeholderTextColor="#94A3B8"
                className="flex-1 text-sm text-slate-800 font-body py-0"
                clearButtonMode="while-editing"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")} className="p-0.5">
                  <MaterialIconsRounded name="cancel" size={18} color="#94A3B8" />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Chips Chọn Nhanh Tỉnh Thành */}
        {!searchQuery && popularChips.length > 0 && !isLoading && (
          <View className="px-4 pb-2">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {popularChips.map((chip) => {
                const isChipSelected = chip.value === selectedValue;
                return (
                  <Pressable
                    key={chip.value}
                    className={cn(
                      "px-3 py-1.5 bg-slate-100 rounded-full mr-1.5 border border-slate-200",
                      isChipSelected && "bg-blue-500/[0.08] border-blue-500/20",
                    )}
                    onPress={() => {
                      onSelect(chip.value);
                      ref.current?.dismiss();
                    }}
                  >
                    <Text
                      className={cn(
                        "text-[12.5px] font-medium text-slate-600",
                        isChipSelected && "text-blue-500 font-semibold",
                      )}
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
          <View className="py-[60px] items-center justify-center gap-2.5">
            <ActivityIndicator size="small" color={ACCENT_BLUE} />
            <Text className="text-[13.5px] font-medium text-slate-500">{t("bottomSheetPicker.loading")}</Text>
          </View>
        ) : filteredData.length === 0 ? (
          <View className="py-10 items-center justify-center gap-2">
            <MaterialIconsRounded name="search-off" size={40} color="#CBD5E1" />
            <Text className="text-[13px] font-medium text-slate-500">{t("bottomSheetPicker.noResults")}</Text>
          </View>
        ) : (
          <BottomSheetFlatList
            data={filteredData}
            keyExtractor={(item, index) => `${item.value}-${index}`}
            renderItem={renderItem}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </BottomSheetModal>
    );
  }
);
