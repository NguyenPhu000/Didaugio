import React, { memo, useMemo, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import {
  Pressable,
  Text,
  View,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
} from "../../../constants/design-tokens";
import { getLocationText } from "../utils/savedHelpers";

const PlaceRow = memo(function PlaceRow({ entry, onSelect }) {
  const place = entry?.place || entry;
  return (
    <Pressable
      onPress={() => onSelect(entry)}
      className="flex-row items-center gap-3 py-3 active:opacity-60"
    >
      <View className="w-9 h-9 rounded-xl items-center justify-center bg-[#007AFF]/10">
        <MaterialIcons name="place" size={18} color="#007AFF" />
      </View>
      <View className="flex-1">
        <Text className="text-[#1D1D1F] text-[15px] font-semibold tracking-[-0.2px]" numberOfLines={1}>
          {place?.name || "Địa điểm"}
        </Text>
        <Text className="text-[#54647A] text-xs mt-0.5" numberOfLines={1}>
          {getLocationText(place)}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={APPLE_THEME.textMuted} />
    </Pressable>
  );
});

export const PlacePickerModal = memo(
  forwardRef(function PlacePickerModal({
    savedData,
    onClose,
    onSelect,
  }, ref) {
    const bottomSheetModalRef = useRef(null);
    const snapPoints = useMemo(() => ["60%", "85%"], []);

    useImperativeHandle(ref, () => ({
      present: () => {
        bottomSheetModalRef.current?.present();
      },
      dismiss: () => {
        bottomSheetModalRef.current?.dismiss();
      },
    }));

    const handleDismiss = useCallback(() => {
      onClose?.();
    }, [onClose]);

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

    const places = useMemo(
      () => (savedData || []).filter((e) => (e?.place || e)?.id),
      [savedData],
    );

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onDismiss={handleDismiss}
        handleIndicatorStyle={{
          backgroundColor: "rgba(0,0,0,0.15)",
          width: 36,
          height: 4,
        }}
        backgroundStyle={{
          backgroundColor: "#FFFFFF",
          borderRadius: 24,
        }}
      >
        <View className="flex-row items-center justify-between px-5 pb-3.5 pt-2">
          <Text className="text-[#1D1D1F] text-[18px] font-semibold tracking-[-0.3px]">Chọn địa điểm</Text>
          <Pressable onPress={() => bottomSheetModalRef.current?.dismiss()} hitSlop={8}>
            <MaterialIcons name="close" size={22} color={APPLE_THEME.textMuted} />
          </Pressable>
        </View>

        {places.length === 0 ? (
          <View className="items-center gap-2.5 py-8 px-8">
            <MaterialIcons name="bookmark-border" size={32} color={APPLE_THEME.textMuted} />
            <Text className="text-[#54647A] text-sm text-center leading-5">
              Bạn chưa lưu địa điểm nào. Hãy lưu địa điểm trước khi tạo ghi chú.
            </Text>
          </View>
        ) : (
          <BottomSheetFlatList
            data={places}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View className="px-5">
                <PlaceRow entry={item} onSelect={onSelect} />
              </View>
            )}
            ItemSeparatorComponent={() => <View className="h-[0.5px] bg-black/[0.08] ml-12" />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        )}
      </BottomSheetModal>
    );
  })
);

PlacePickerModal.displayName = "PlacePickerModal";
