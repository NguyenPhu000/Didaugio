import { memo, useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScaleDecorator } from "react-native-draggable-flatlist";
import { TOKENS } from "../../../../constants/design-tokens";
import { TRIP_STATUS_META } from "../../utils/tripTheme";
import { formatPrice } from "../../utils/tripHelpers";
import { StatusBadge } from "./StatusBadge";
import EditDestinationForm from "./EditDestinationForm";

function TimelineCard({
  dest,
  bookings,
  onOpenBooking,
  onRemove,
  onLongPress,
  onSave,
  isSaving,
  drag,
  isActive,
  tripStatus,
}) {
  const [expanded, setExpanded] = useState(false);
  const statusMeta = TRIP_STATUS_META[tripStatus] || TRIP_STATUS_META.draft;

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.(dest);
  }, [dest, onLongPress]);

  const handleEditPress = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleSave = useCallback(
    (payload) => {
      onSave(payload);
      setExpanded(false);
    },
    [onSave],
  );

  const placeName = dest.place?.name || "Chua co ten";
  const placeAddress = dest.place?.address || "";
  const thumbnail = dest.place?.thumbnail;

  return (
    <ScaleDecorator>
      <Pressable
        onLongPress={handleLongPress}
        style={[styles.card, isActive && styles.cardActive]}
      >
        {/* Timeline indicator + time */}
        <View style={styles.header}>
          <View style={styles.timeIndicator}>
            <View
              style={[styles.dot, { backgroundColor: statusMeta.accent }]}
            />
            <View style={styles.timeLine} />
          </View>
          <Text style={styles.time}>
            {dest.startTime || "??:??"}
            {dest.endTime ? ` - ${dest.endTime}` : ""}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.dragHandle,
              pressed && { opacity: 0.5 },
            ]}
            onLongPress={drag}
            disabled={isActive}
          >
            <MaterialIcons name="drag-indicator" size={20} color="#C7C7CC" />
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.body}>
            <View style={styles.thumbWrap}>
              {thumbnail ? (
                <Image
                  source={{ uri: thumbnail }}
                  style={styles.thumb}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <MaterialIcons
                    name="place"
                    size={20}
                    color="rgba(0,0,0,0.15)"
                  />
                </View>
              )}
            </View>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {placeName}
              </Text>
              {placeAddress ? (
                <Text style={styles.address} numberOfLines={1}>
                  {placeAddress}
                </Text>
              ) : null}
              {dest.durationMinutes ? (
                <View style={styles.metaRow}>
                  <MaterialIcons
                    name="schedule"
                    size={12}
                    color="rgba(0,0,0,0.35)"
                  />
                  <Text style={styles.meta}>{dest.durationMinutes} phut</Text>
                </View>
              ) : null}
              {dest.note ? (
                <Text style={styles.note} numberOfLines={2}>
                  {dest.note}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Bookings */}
          {bookings?.length > 0 && (
            <View style={styles.bookings}>
              {bookings.slice(0, 2).map((b) => (
                <Pressable
                  key={b.id}
                  style={({ pressed }) => [
                    styles.bookingRow,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => onOpenBooking?.(b)}
                >
                  <StatusBadge status={b.status} />
                  <Text style={styles.bookingName} numberOfLines={1}>
                    {b.serviceName || b.placeName}
                  </Text>
                  {b.totalAmount ? (
                    <Text style={styles.bookingPrice}>
                      {formatPrice(b.totalAmount)}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
              {bookings.length > 2 && (
                <Text style={styles.bookingMore}>
                  +{bookings.length - 2} booking khac
                </Text>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={onRemove}
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && { backgroundColor: "rgba(255,59,48,0.08)" },
              ]}
            >
              <Text style={styles.actionDanger}>Bo</Text>
            </Pressable>
            <Pressable
              onPress={handleEditPress}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionEditBtn,
                pressed && { backgroundColor: "rgba(0,0,0,0.08)" },
              ]}
            >
              <Text style={styles.actionPrimary}>
                {expanded ? "Thu gon" : "Sua"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Inline edit form */}
        {expanded && (
          <EditDestinationForm
            dest={dest}
            onSave={handleSave}
            onCancel={() => setExpanded(false)}
            isLoading={isSaving}
          />
        )}
      </Pressable>
    </ScaleDecorator>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  cardActive: {
    opacity: 0.92,
    transform: [{ scale: 1.02 }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timeIndicator: {
    alignItems: "center",
    gap: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
  },
  timeLine: {
    width: 2,
    height: 8,
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 1,
  },
  time: {
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
    color: "#1D1D1F",
    flex: 1,
    letterSpacing: -0.2,
  },
  dragHandle: {
    padding: 4,
    borderRadius: 8,
  },
  content: {
    paddingLeft: 20,
    gap: 10,
  },
  body: {
    flexDirection: "row",
    gap: 12,
  },
  thumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: "hidden",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  thumbPlaceholder: {
    flex: 1,
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: "#1D1D1F",
    letterSpacing: -0.3,
  },
  address: {
    fontSize: 12,
    color: "rgba(0,0,0,0.4)",
    fontFamily: TOKENS.font.body,
    letterSpacing: -0.1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  meta: {
    fontSize: 12,
    color: "rgba(0,0,0,0.4)",
    fontFamily: TOKENS.font.body,
    letterSpacing: -0.1,
  },
  note: {
    fontSize: 12,
    color: "rgba(0,0,0,0.4)",
    fontFamily: TOKENS.font.body,
    fontStyle: "italic",
    marginTop: 2,
    letterSpacing: -0.1,
  },
  bookings: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.06)",
    paddingTop: 10,
    gap: 6,
  },
  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bookingName: {
    flex: 1,
    fontSize: 13,
    color: "#1D1D1F",
    fontFamily: TOKENS.font.body,
    letterSpacing: -0.1,
  },
  bookingPrice: {
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: "#1D1D1F",
    letterSpacing: -0.1,
  },
  bookingMore: {
    fontSize: 12,
    color: "rgba(0,0,0,0.4)",
    fontFamily: TOKENS.font.body,
    paddingLeft: 12,
    letterSpacing: -0.1,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actionEditBtn: {
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  actionDanger: {
    fontSize: 13,
    color: "#FF3B30",
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.1,
  },
  actionPrimary: {
    fontSize: 13,
    color: "#1D1D1F",
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.1,
  },
});

export default memo(TimelineCard);
