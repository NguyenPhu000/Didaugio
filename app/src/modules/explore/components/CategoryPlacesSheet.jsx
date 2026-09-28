import { memo } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useTranslation } from "react-i18next";
import { getCategoryIconName } from "../../../constants/categoryIcons";
import { EXPLORE_THEME as C } from "./exploreTheme";
import { ExplorePlaceCardHorizontal } from "./ExplorePlaceCardHorizontal";

export const CategoryPlacesSheet = memo(function CategoryPlacesSheet({
  visible,
  category,
  places = [],
  onClose,
  onPressPlace,
  onSavePlace,
  savedPlaceIds,
  userLocation,
}) {
  const { t } = useTranslation();
  if (!visible) return null;

  const categoryName = category?.name || t("explore.sheet.allPlaces");
  const categoryIcon = getCategoryIconName(category);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        {/* Backdrop press to close */}
        <Pressable className="flex-1" onPress={onClose} />

        {/* Sheet Container */}
        <View className="w-full h-[88%] bg-[#F8F7F2] rounded-t-[26px] overflow-hidden flex-col">
          {/* Top Handle Bar */}
          <View className="w-10 h-1 rounded-full bg-[#B6C0B8] self-center my-3" />

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pb-3 border-b border-[#E6E9E2]">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-10 h-10 rounded-[12px] items-center justify-center bg-[#EEE9DF]">
                <MaterialCommunityIcons name={categoryIcon} size={20} color={C.river} />
              </View>
              <View className="flex-1">
                <Text style={{ color: C.ink, fontFamily: C.font.semibold, fontSize: 18 }} numberOfLines={1}>
                  {categoryName}
                </Text>
                <Text style={{ color: C.muted, fontFamily: C.font.medium, fontSize: 12 }}>
                  {t("explore.sheet.placeCount", { count: places.length })}
                </Text>
              </View>
            </View>

            {/* Nút đóng X */}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}
              className="w-10 h-10 rounded-[12px] items-center justify-center bg-[#EEE9DF] active:opacity-75"
            >
              <MaterialIconsRounded name="close" size={20} color={C.ink} />
            </Pressable>
          </View>

          {/* Body: Danh sách địa điểm đầy đủ thông tin chuẩn thiết kế */}
          <FlatList
            data={places}
            keyExtractor={(item, idx) => (item?.id ? String(item.id) : `sheet-place-${idx}`)}
            renderItem={({ item, index }) => (
              <ExplorePlaceCardHorizontal
                place={item}
                index={index}
                userLocation={userLocation}
                isSaved={savedPlaceIds?.has?.(Number(item?.id)) || false}
                onSave={onSavePlace}
                onPress={() => {
                  onClose();
                  onPressPlace(item);
                }}
              />
            )}
            contentContainerStyle={{ paddingVertical: 14, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
});

