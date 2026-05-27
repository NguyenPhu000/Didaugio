import { memo, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { ScaleDecorator } from "react-native-draggable-flatlist";
import { TOKENS } from "../../../../constants/design-tokens";
import { TRIP_STATUS_META } from "../../utils/tripTheme";
import { formatPrice } from "../../utils/tripHelpers";
import { StatusBadge } from "./StatusBadge";

function TimelineCard({
  dest,
  bookings,
  onOpenBooking,
  onRemove,
  onMoveRequest,
  onEditRequest,
  drag,
  isActive,
  tripStatus,
}) {
  const statusMeta = TRIP_STATUS_META[tripStatus] || TRIP_STATUS_META.draft;

  const handleEditPress = useCallback(() => {
    onEditRequest?.(dest);
  }, [dest, onEditRequest]);

  const handleMovePress = useCallback(() => {
    onMoveRequest?.(dest);
  }, [dest, onMoveRequest]);

  const router = useRouter();

  const handleViewPress = useCallback(() => {
    const placeId = dest.placeId || dest.place?.id;
    if (placeId) {
      router.push(`/place/${placeId}`);
    }
  }, [dest, router]);

  const placeName = dest.place?.name || "Chưa có tên";
  const placeAddress = dest.place?.address || "";
  const thumbnail = dest.place?.thumbnail;

  const hasStart = !!dest.startTime;
  const hasEnd = !!dest.endTime;

  const toMinutes = (value) => {
    const [h, m] = String(value || "")
      .split(":")
      .map((part) => Number.parseInt(part, 10));
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  };

  const startMin = toMinutes(dest.startTime);
  const endMin = toMinutes(dest.endTime);
  const crossesMidnight =
    startMin !== null && endMin !== null && endMin < startMin;

  let timeLabel;
  if (hasStart && hasEnd) {
    timeLabel = `${dest.startTime} – ${dest.endTime}${
      crossesMidnight ? " (qua hôm sau)" : ""
    }`;
  } else if (hasStart) {
    timeLabel = `Bắt đầu ${dest.startTime}`;
  } else if (hasEnd) {
    timeLabel = `Kết thúc ${dest.endTime}`;
  } else {
    timeLabel = "Chưa xếp giờ";
  }

  return (
    <ScaleDecorator>
      <View style={[styles.card, isActive && styles.cardActive]}>
        <View style={styles.header}>
          <View style={styles.timeIndicator}>
            <View
              style={[styles.dot, { backgroundColor: statusMeta.accent }]}
            />
            <View style={styles.timeLine} />
          </View>
          {!hasStart && !hasEnd ? (
            <View style={{ flex: 1, flexDirection: "row" }}>
              <View style={styles.warningBadge}>
                <MaterialIcons name="info-outline" size={12} color="#FF9500" />
                <Text style={styles.warningBadgeText}>Chưa xếp giờ</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.time} numberOfLines={1}>
              {timeLabel}
            </Text>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.dragHandle,
              pressed && { opacity: 0.5 },
            ]}
            onLongPress={drag}
            disabled={isActive}
            accessibilityLabel="Kéo để sắp xếp"
          >
            <MaterialIcons name="drag-indicator" size={20} color="#C7C7CC" />
          </Pressable>
        </View>

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
                  <Text style={styles.meta}>{dest.durationMinutes} phút</Text>
                </View>
              ) : null}
              {dest.note ? (
                <Text style={styles.note} numberOfLines={2}>
                  {dest.note}
                </Text>
              ) : null}
            </View>
          </View>

          {bookings?.length > 0 && (
            <View style={styles.bookings}>
              {bookings.slice(0, 2).map((b) => (
                <Pressable
                  key={b.id}
                  style={({ pressed }) => [
                    styles.bookingRow,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => onOpenBooking?.(b.id)}
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
                  +{bookings.length - 2} booking khác
                </Text>
              )}
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              onPress={handleViewPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [
                styles.pillOutline,
                pressed && styles.pillOutlinePressed,
              ]}
            >
              <Text style={styles.pillOutlineText}>
                <MaterialIcons name="visibility" size={14} color="#1D1D1F" />{" "}
                Xem
              </Text>
            </Pressable>
            <Pressable
              onPress={handleMovePress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [
                styles.pillOutline,
                pressed && styles.pillOutlinePressed,
              ]}
            >
              <Text style={styles.pillOutlineText}>
                <MaterialIcons name="swap-horiz" size={14} color="#1D1D1F" />{" "}
                Chuyển ngày
              </Text>
            </Pressable>
            <Pressable
              onPress={handleEditPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [
                styles.pillPrimary,
                pressed && styles.pillPrimaryPressed,
              ]}
            >
              <Text style={styles.pillPrimaryText}>
                <MaterialIcons name="edit" size={14} color="#FFFFFF" /> Sửa
              </Text>
            </Pressable>
            <Pressable
              onPress={onRemove}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [
                styles.removeBtn,
                pressed && { opacity: 0.6 },
              ]}
              accessibilityLabel="Bỏ địa điểm khỏi lịch trình"
            >
              <MaterialIcons name="delete-outline" size={16} color="#FF3B30" />
            </Pressable>
          </View>
        </View>
      </View>
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
  timeMuted: {
    color: "rgba(0,0,0,0.4)",
    fontFamily: TOKENS.font.body,
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
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 4,
  },
  pillOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  pillOutlinePressed: {
    backgroundColor: "#F2F2F7",
  },
  pillOutlineText: {
    fontSize: 13,
    color: "#1D1D1F",
    fontFamily: TOKENS.font.semibold,
  },
  pillPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#007AFF",
  },
  pillPrimaryPressed: {
    backgroundColor: "#0056B3",
  },
  pillPrimaryText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontFamily: TOKENS.font.semibold,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,59,48,0.08)",
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,149,0,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  warningBadgeText: {
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
    color: "#FF9500",
  },
});

export default memo(TimelineCard);
