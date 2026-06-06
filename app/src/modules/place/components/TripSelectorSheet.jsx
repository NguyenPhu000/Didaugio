import { memo, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useTrips } from "../../trips/hooks/useTrips";
import { addDestinationApi } from "../../trips/api/tripsApi";
import { resolveMediaUrl } from "../../../lib/media-url";
import { PALETTE, TOKENS } from "../constants/placeSheetConstants";

const STEP_SELECT = 1;
const STEP_CONFIRM = 2;

function TripListItem({ trip, selected, onPress }) {
  const thumbnail = resolveMediaUrl(
    trip?.coverImage || trip?.destinations?.[0]?.place?.images?.[0]?.imageData,
  );

  return (
    <Pressable
      onPress={onPress}
      style={[styles.tripRow, selected && styles.tripRowActive]}
    >
      {thumbnail ? (
        <Image
          source={{ uri: thumbnail }}
          style={styles.tripThumb}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.tripThumb, styles.tripThumbFallback]}>
          <MaterialIconsRounded name="map" size={18} color={PALETTE.textMuted} />
        </View>
      )}
      <View style={styles.tripMeta}>
        <Text style={styles.tripName} numberOfLines={1}>
          {trip.name}
        </Text>
        <Text style={styles.tripInfo}>
          {trip.destinations?.length || 0} điểm đến
        </Text>
      </View>
      {selected && (
        <MaterialIconsRounded name="check-circle" size={22} color={PALETTE.primary} />
      )}
    </Pressable>
  );
}

export const TripSelectorSheet = memo(function TripSelectorSheet({
  placeId,
  placeName,
  t,
  onClose,
  onStepChange,
}) {
  const { data: trips = [], isLoading } = useTrips();
  const [step, setStep] = useState(STEP_SELECT);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleSelectTrip = useCallback(
    (trip) => {
      setSelectedTrip(trip);
      setStep(STEP_CONFIRM);
      onStepChange?.(STEP_CONFIRM);
    },
    [onStepChange],
  );

  const handleBack = useCallback(() => {
    setStep(STEP_SELECT);
    setSelectedTrip(null);
    onStepChange?.(STEP_SELECT);
  }, [onStepChange]);

  const handleAdd = useCallback(async () => {
    if (!selectedTrip || !placeId) return;
    setIsAdding(true);
    try {
      await addDestinationApi(selectedTrip.id, { placeId });
      Alert.alert(
        t("place.detail.addedToTrip"),
        t("place.detail.addedToTripDesc", { placeName, tripName: selectedTrip.name }),
      );
      onClose?.();
    } catch (err) {
      Alert.alert(
        t("place.detail.somethingWentWrong"),
        t("place.detail.addToTripError"),
      );
    } finally {
      setIsAdding(false);
    }
  }, [selectedTrip, placeId, placeName, t, onClose]);

  const emptyMessage = useMemo(
    () =>
      t("place.detail.noTripsYet"),
    [t],
  );

  if (step === STEP_CONFIRM && selectedTrip) {
    return (
      <BottomSheetView style={styles.sheet}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <MaterialIconsRounded name="arrow-back" size={20} color={PALETTE.text} />
        </Pressable>
        <Text style={styles.sheetTitle}>
          {t("place.detail.addToTripTitle")}
        </Text>
        <Text style={styles.confirmText}>
          {t("place.detail.addPlaceConfirm", { placeName, tripName: selectedTrip.name })}
        </Text>
        <Pressable
          onPress={handleAdd}
          disabled={isAdding}
          style={[styles.addBtn, isAdding && styles.addBtnDisabled]}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.addBtnText}>
              {t("common.confirm")}
            </Text>
          )}
        </Pressable>
      </BottomSheetView>
    );
  }

  return (
    <BottomSheetView style={styles.sheet}>
      <Text style={styles.sheetTitle}>
        {t("place.detail.selectTrip")}
      </Text>
      <Text style={styles.sheetSubtitle}>
        {t("place.detail.addPlaceToTrip")}
      </Text>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={PALETTE.primary} />
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MaterialIconsRounded name="luggage" size={40} color={PALETTE.textMuted} />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TripListItem
              trip={item}
              selected={selectedTrip?.id === item.id}
              onPress={() => handleSelectTrip(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </BottomSheetView>
  );
});

const styles = StyleSheet.create({
  sheet: { flex: 1, paddingHorizontal: 18, paddingTop: 8 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.surfaceAlt,
    marginBottom: 12,
  },
  sheetTitle: {
    color: PALETTE.text,
    fontSize: 20,
    fontFamily: TOKENS.font.heading,
    marginBottom: 4,
  },
  sheetSubtitle: {
    color: PALETTE.textMuted,
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    marginBottom: 16,
  },
  confirmText: {
    color: PALETTE.text,
    fontSize: 15,
    fontFamily: TOKENS.font.medium,
    lineHeight: 22,
    marginTop: 16,
    marginBottom: 24,
  },
  addBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  addBtnDisabled: { opacity: 0.6 },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
  },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingBottom: 40,
  },
  emptyText: {
    color: PALETTE.textMuted,
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  listContent: { paddingBottom: 32 },
  tripRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 6,
  },
  tripRowActive: { backgroundColor: PALETTE.primarySoft },
  tripThumb: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: PALETTE.surfaceAlt,
  },
  tripThumbFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  tripMeta: { flex: 1 },
  tripName: {
    color: PALETTE.text,
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
  },
  tripInfo: {
    color: PALETTE.textMuted,
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    marginTop: 2,
  },
});
