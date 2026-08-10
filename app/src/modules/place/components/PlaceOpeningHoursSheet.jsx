import { forwardRef } from "react";
import { Pressable, Text, View } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { OpeningHours } from "./PlaceDetailComponents";
import {
  PALETTE,
  PLACE_SHEET_BACKGROUND,
  PLACE_SHEET_INDICATOR,
} from "../constants/placeSheetConstants";

const SNAP_POINTS = ["48%"];

export const PlaceOpeningHoursSheet = forwardRef(function PlaceOpeningHoursSheet(
  { hours, openState, onClose, t },
  ref,
) {
  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={SNAP_POINTS}
      enablePanDownToClose
      backgroundStyle={PLACE_SHEET_BACKGROUND}
      handleIndicatorStyle={PLACE_SHEET_INDICATOR}
    >
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-1 gap-0.5 pr-3">
            <Text
              className="text-[18px]"
              style={{ color: PALETTE.text, fontFamily: TOKENS.font.heading }}
            >
              {t("place.detail.openingHoursLabel")}
            </Text>
            <Text
              className="text-[13px]"
              style={{
                color: openState?.color || PALETTE.textMuted,
                fontFamily: TOKENS.font.semibold,
              }}
            >
              {openState?.label || t("place.detail.pendingUpdate")}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            className="h-11 w-11 items-center justify-center rounded-full active:scale-95"
            style={{ backgroundColor: PALETTE.surfaceAlt }}
          >
            <MaterialIconsRounded
              name="close"
              size={18}
              color={PALETTE.textMuted}
            />
          </Pressable>
        </View>

        <OpeningHours hours={hours} t={t} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
});
