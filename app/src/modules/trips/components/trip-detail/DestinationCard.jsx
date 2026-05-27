import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../../../constants/design-tokens";
import { StatusBadge } from "./StatusBadge";
import { formatDistance, formatBookingDateTime } from "../../utils/tripHelpers";
import s from "../../utils/tripDetailTokens";

export const DestinationCard = memo(function DestinationCard({
  dest,
  bookings,
  onOpenBooking,
  onRemove,
}) {
  const place = dest.place;
  const imgUri = place?.thumbnail || null;
  const bookingPreview = (bookings || []).slice(0, 2);
  const distanceLabel = formatDistance(dest.distanceToNext);

  return (
    <View style={styles.card}>
      <View style={s.destRow}>
        <View style={styles.thumbWrap}>
          {imgUri ? (
            <Image
              source={{ uri: imgUri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.thumbEmpty}>
              <MaterialIcons
                name="place"
                size={20}
                color="rgba(0,0,0,0.15)"
              />
            </View>
          )}
        </View>

        <View style={s.destInfo}>
          <Text style={s.destName} numberOfLines={1}>
            {place?.name || "Dia diem"}
          </Text>
          {place?.address ? (
            <Text style={s.destAddress} numberOfLines={1}>
              {place.address}
            </Text>
          ) : null}
          {dest.note ? (
            <Text style={s.destNote} numberOfLines={2}>
              {dest.note}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={() => onRemove(dest.id)}
          hitSlop={10}
          style={({ pressed }) => [
            styles.removeBtn,
            pressed && { backgroundColor: "rgba(255,59,48,0.08)" },
          ]}
        >
          <Text style={s.destRemoveText}>Bo</Text>
        </Pressable>
      </View>

      {distanceLabel ? (
        <View style={styles.distanceRow}>
          <MaterialIcons
            name="straighten"
            size={12}
            color="rgba(0,0,0,0.35)"
          />
          <Text style={styles.distanceText}>
            {distanceLabel} đến điểm tiếp theo
          </Text>
        </View>
      ) : null}

      {bookingPreview.length > 0 ? (
        <View style={s.destBookings}>
          {bookingPreview.map((booking) => (
            <Pressable
              key={booking.id}
              onPress={() => onOpenBooking(booking.id)}
              style={({ pressed }) => [
                s.bookingRow,
                pressed && s.pressed,
              ]}
            >
              <View style={s.bookingRowInfo}>
                <Text style={s.bookingRowName} numberOfLines={1}>
                  {booking?.service?.name || "Dich vu"}
                </Text>
                <Text style={s.bookingRowMeta} numberOfLines={1}>
                  {formatBookingDateTime(booking)}
                </Text>
              </View>
              <StatusBadge status={booking?.status} />
            </Pressable>
          ))}

          {(bookings?.length ?? 0) > 2 ? (
            <Text style={s.moreText}>+{bookings.length - 2} booking khac</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  thumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F5F5F7",
  },
  thumbEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  distanceText: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: "rgba(0,0,0,0.4)",
    letterSpacing: -0.1,
  },
});
