import { memo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { formatDate, formatDistance } from "../../utils/tripHelpers";
import s, { T, STYLES } from "../../utils/tripDetailTokens";

export const TripHeader = memo(function TripHeader({
  trip,
  onEditTrip,
  onDeleteTrip,
  isSaved,
  onToggleSave,
  onAddPlace,
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!trip) return null;

  const dateRange =
    trip.startDate && trip.endDate
      ? `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`
      : trip.startDate
        ? t('tripHeader.from', { date: formatDate(trip.startDate) })
        : null;

  const totalDistanceLabel = formatDistance(trip.totalDistance);

  return (
    <View className={STYLES.header}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        style={({ pressed }) => [
          pressed && { backgroundColor: "rgba(0,0,0,0.08)" },
        ]}
        className="w-9 h-9 rounded-xl items-center justify-center bg-black/[0.04] flex-shrink-0"
      >
        <MaterialIconsRounded name="arrow-back-ios-new" size={16} color={T.ink} />
      </Pressable>

      <View className="flex-1 min-w-0">
        <Text
          className="text-[17px] font-semibold text-[#1D1D1F] tracking-tight"
          numberOfLines={1}
        >
          {trip.title}
        </Text>
        {dateRange || totalDistanceLabel ? (
          <View className="flex-row items-center gap-1.5 mt-0.25">
            {dateRange ? (
              <View className="flex-row items-center gap-0.75 flex-shrink-0">
                <MaterialIconsRounded name="calendar-today" size={10} color={T.muted48} />
                <Text className="text-[11px] font-normal text-black/50" numberOfLines={1}>
                  {dateRange}
                </Text>
              </View>
            ) : null}
            {dateRange && totalDistanceLabel ? (
              <View className="w-[3px] h-[3px] rounded-full bg-black/15 flex-shrink-0" />
            ) : null}
            {totalDistanceLabel ? (
              <View className="flex-row items-center gap-0.75 flex-shrink-0">
                <MaterialIconsRounded name="route" size={10} color={T.muted48} />
                <Text className="text-[11px] font-normal text-black/50" numberOfLines={1}>
                  {totalDistanceLabel}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center gap-1.5 flex-shrink-0 ml-2">
        <Pressable
          onPress={() => setIsMenuOpen(true)}
          hitSlop={10}
          style={({ pressed }) => [
            pressed && { backgroundColor: "rgba(0,0,0,0.08)" },
          ]}
          className="w-9 h-9 rounded-xl items-center justify-center bg-black/[0.04] flex-shrink-0"
        >
          <MaterialIconsRounded name="more-horiz" size={20} color={T.ink} />
        </Pressable>
        <Pressable
          onPress={() => (onAddPlace ? onAddPlace() : router.push("/explore"))}
          style={({ pressed }) => [pressed ? { opacity: 0.85 } : null]}
          className="flex-row items-center gap-1 bg-[#1D1D1F] px-3.5 py-2 rounded-lg flex-shrink-0"
        >
          <MaterialIconsRounded name="add" size={18} color={T.onPrimary} />
          <Text className="text-white text-[13px] font-semibold tracking-tight">{t('tripHeader.add')}</Text>
        </Pressable>
      </View>

      <Modal
        visible={isMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <Pressable className="flex-1 bg-transparent" onPress={() => setIsMenuOpen(false)}>
          <View
            className="absolute right-4 w-[170px] bg-white rounded-2xl py-1 px-1 border-[0.5px] border-black/10 shadow-lg elevation-4"
            style={{ top: insets.top + 10 }}
            onStartShouldSetResponder={() => true}
          >
            {onToggleSave ? (
              <Pressable
                className="rounded-xl overflow-hidden"
                onPress={() => {
                  setIsMenuOpen(false);
                  onToggleSave();
                }}
              >
                {({ pressed }) => (
                  <View
                    className="flex-row items-center gap-2 py-2.25 px-2 rounded-xl"
                    style={[pressed && { backgroundColor: "rgba(0,0,0,0.04)" }]}
                  >
                    <View
                      className="w-7 h-7 rounded-lg bg-black/[0.04] items-center justify-center flex-shrink-0"
                      style={[
                        isSaved && { backgroundColor: "rgba(255,159,10,0.08)" },
                      ]}
                    >
                      <MaterialIconsRounded
                        name={isSaved ? "bookmark" : "bookmark-border"}
                        size={16}
                        color={isSaved ? "#FF9F0A" : T.ink}
                      />
                    </View>
                    <Text
                      className="flex-1 text-[14px] font-medium text-[#1D1D1F] tracking-tight min-w-0"
                      style={[isSaved && { color: "#FF9F0A", fontWeight: "600" }]}
                      numberOfLines={1}
                    >
                      {isSaved ? t('tripHeader.unsave') : t('tripHeader.saveTrip')}
                    </Text>
                  </View>
                )}
              </Pressable>
            ) : null}

            <Pressable
              className="rounded-xl overflow-hidden"
              onPress={() => {
                setIsMenuOpen(false);
                onEditTrip();
              }}
            >
              {({ pressed }) => (
                <View
                  className="flex-row items-center gap-2 py-2.25 px-2 rounded-xl"
                  style={[pressed && { backgroundColor: "rgba(0,0,0,0.04)" }]}
                >
                  <View className="w-7 h-7 rounded-lg bg-black/[0.04] items-center justify-center flex-shrink-0">
                    <MaterialIconsRounded name="edit" size={16} color={T.ink} />
                  </View>
                  <Text className="flex-1 text-[14px] font-medium text-[#1D1D1F] tracking-tight min-w-0" numberOfLines={1}>
                    {t('tripHeader.editInfo')}
                  </Text>
                </View>
              )}
            </Pressable>

            <View className="h-[0.5px] bg-black/[0.06] my-1 mx-2" />

            <Pressable
              className="rounded-xl overflow-hidden"
              onPress={() => {
                setIsMenuOpen(false);
                onDeleteTrip();
              }}
            >
              {({ pressed }) => (
                <View
                  className="flex-row items-center gap-2 py-2.25 px-2 rounded-xl"
                  style={[pressed && { backgroundColor: "rgba(0,0,0,0.04)" }]}
                >
                  <View
                    className="w-7 h-7 rounded-lg bg-black/[0.04] items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(255,59,48,0.06)" }}
                  >
                    <MaterialIconsRounded name="delete-outline" size={16} color={T.danger} />
                  </View>
                  <Text className="flex-1 text-[14px] text-[#FF3B30] font-semibold tracking-tight min-w-0" numberOfLines={1}>
                    {t('tripHeader.deleteTrip')}
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
