import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { Pressable, Text, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { MAP_TEXT } from "../../constants/mapText.constants";

const FilterPickerModal = memo(
  forwardRef(function FilterPickerModal(
    {
      visible,
      activeFilterGroupLabel,
      options,
      onClose,
      onSelectOption,
    },
    ref,
  ) {
    const sheetRef = useRef(null);
    const visibleRef = useRef(visible);
    const dismissFromStateRef = useRef(false);
    const snapPoints = useMemo(() => ["42%", "62%"], []);

    useImperativeHandle(ref, () => sheetRef.current);

    useEffect(() => {
      visibleRef.current = visible;

      if (visible) {
        dismissFromStateRef.current = false;
        sheetRef.current?.present();
        return;
      }

      dismissFromStateRef.current = true;
      sheetRef.current?.dismiss();
    }, [visible]);

    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.32}
          pressBehavior="close"
        />
      ),
      [],
    );

    const handleDismiss = useCallback(() => {
      if (dismissFromStateRef.current || !visibleRef.current) {
        dismissFromStateRef.current = false;
        return;
      }

      onClose();
    }, [onClose]);

    const handleClosePress = useCallback(() => {
      sheetRef.current?.dismiss();
    }, []);

    const handleSelectOption = useCallback(
      (value) => {
        onSelectOption(value);
        dismissFromStateRef.current = true;
        sheetRef.current?.dismiss();
      },
      [onSelectOption],
    );

    return (
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        handleIndicatorStyle={{
          backgroundColor: "#CBD5E1",
          width: 38,
          height: 4,
          borderRadius: 99,
        }}
        backgroundStyle={{
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
        onDismiss={handleDismiss}
      >
        <View className="flex-row items-center justify-between border-b border-slate-100 px-5 pb-3 pt-2">
          <View className="flex-1 pr-3">
            <Text className="text-[11px] font-semibold uppercase text-slate-500">
              {activeFilterGroupLabel}
            </Text>
            <Text
              className="text-base font-semibold text-slate-950"
              numberOfLines={1}
            >
              {MAP_TEXT.filters.pickerTitle(activeFilterGroupLabel)}
            </Text>
          </View>

          <Pressable
            onPress={handleClosePress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close filter picker"
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
          >
            <MaterialIconsRounded name="close" size={20} color="#475569" />
          </Pressable>
        </View>

        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 6,
            paddingBottom: 28,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {options.map((option) => (
            <Pressable
              key={option.key}
              onPress={() => handleSelectOption(option.value)}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityState={{ selected: option.active }}
              accessibilityLabel={option.label}
              className="min-h-[48px] flex-row items-center justify-between rounded-2xl px-3.5"
              style={{
                backgroundColor: option.active
                  ? "rgba(15, 23, 42, 0.08)"
                  : "transparent",
              }}
            >
              <View className="flex-1 flex-row items-center gap-3">
                <View
                  className="h-9 w-9 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: option.active
                      ? "rgba(15, 23, 42, 0.12)"
                      : "rgba(241, 245, 249, 0.9)",
                  }}
                >
                  <MaterialIconsRounded
                    name={option.icon}
                    size={18}
                    color={option.active ? "#0F172A" : "#475569"}
                  />
                </View>
                <Text
                  className="flex-1 text-[14px] font-medium text-slate-800"
                  numberOfLines={1}
                >
                  {option.label}
                </Text>
              </View>

              {option.active ? (
                <MaterialIconsRounded name="check" size={20} color="#0F172A" />
              ) : null}
            </Pressable>
          ))}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }),
);

export default FilterPickerModal;
