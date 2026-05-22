import { memo } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  CATEGORY_COLORS,
  TOKENS,
} from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import {
  formatPriceLabel,
  formatReviewLabel,
  getCategorySlug,
  getLocationText,
  getReviewCount,
} from "../utils/savedHelpers";

export const SavedCard = memo(function SavedCard({
  entry,
  onPress,
  onOpenNote,
  onUnsave,
  unsaveDisabled,
}) {
  const place = entry?.place || entry;
  const imageUri = resolvePlaceImageUri(place);
  const category = place?.category?.name ?? place?.categoryName ?? "Địa điểm";
  const accent = CATEGORY_COLORS[getCategorySlug(place)] ?? CATEGORY_COLORS.default;
  const ratingValue = Number(place?.ratingAvg ?? place?.averageRating ?? 0);
  const hasRating = Number.isFinite(ratingValue) && ratingValue > 0;
  const reviewLabel = formatReviewLabel(getReviewCount(place));
  const priceLabel = formatPriceLabel(place);
  const collectionName = String(entry?.collectionName || "").trim();
  const note = String(entry?.note || "").trim();
  const locationText = getLocationText(place);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.cardMain}>
        <View style={styles.thumbWrap}>
          {imageUri ? (
            <>
              <Image
                source={{ uri: imageUri }}
                style={styles.thumb}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.15)"]}
                style={StyleSheet.absoluteFill}
              />
            </>
          ) : (
            <View
              style={[styles.thumbFallback, { backgroundColor: `${accent}1A` }]}
            >
              <MaterialIcons name="place" size={28} color={accent} />
            </View>
          )}
          {hasRating ? (
            <View style={styles.ratingPill}>
              <MaterialIcons name="star" size={11} color="#FF9F0A" />
              <Text style={styles.ratingText}>{ratingValue.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {place?.name || "Địa điểm đã lưu"}
            </Text>
            <View style={[styles.accentDot, { backgroundColor: accent }]} />
          </View>

          <View style={styles.metaRow}>
            <MaterialIcons
              name="place"
              size={13}
              color={APPLE_THEME.textMuted}
            />
            <Text style={styles.metaText} numberOfLines={1}>
              {locationText}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <MaterialIcons
              name="category"
              size={13}
              color={APPLE_THEME.textMuted}
            />
            <Text style={styles.metaText} numberOfLines={1}>
              {category}
            </Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaText} numberOfLines={1}>
              {reviewLabel}
            </Text>
          </View>

          {priceLabel ? (
            <View style={styles.priceBadge}>
              <MaterialIcons name="payments" size={12} color="#1D4ED8" />
              <Text style={styles.priceText}>{priceLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {collectionName || note ? (
        <View style={styles.infoStack}>
          {collectionName ? (
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <MaterialIcons
                  name="collections-bookmark"
                  size={14}
                  color={APPLE_THEME.text}
                />
              </View>
              <Text style={styles.infoText} numberOfLines={1}>
                {collectionName}
              </Text>
            </View>
          ) : null}

          {note ? (
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <MaterialIcons
                  name="sticky-note-2"
                  size={14}
                  color={APPLE_THEME.text}
                />
              </View>
              <Text style={styles.infoText} numberOfLines={2}>
                {note}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <Pressable
          onPress={(event) => {
            event?.stopPropagation?.();
            onOpenNote?.(entry);
          }}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionPrimary,
            pressed && styles.actionPressed,
          ]}
        >
          <MaterialIcons name="edit-note" size={15} color={APPLE_THEME.text} />
          <Text style={styles.actionPrimaryText}>
            {note ? "Sửa ghi chú" : "Thêm ghi chú"}
          </Text>
        </Pressable>

        <Pressable
          disabled={unsaveDisabled}
          onPress={(event) => {
            event?.stopPropagation?.();
            onUnsave?.(place?.id);
          }}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionDanger,
            unsaveDisabled && styles.actionDisabled,
            pressed && !unsaveDisabled && styles.actionPressedDanger,
          ]}
        >
          <MaterialIcons name="bookmark-remove" size={15} color="#FF3B30" />
          <Text style={styles.actionDangerText}>Bỏ lưu</Text>
        </Pressable>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: TAB_SCREEN_PADDING,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  cardMain: {
    flexDirection: "row",
    gap: 14,
  },
  thumbWrap: {
    width: 96,
    height: 96,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#F2F2F7",
    position: "relative",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  thumbFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingPill: {
    position: "absolute",
    left: 8,
    top: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  ratingText: {
    color: APPLE_THEME.text,
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.1,
  },
  content: {
    flex: 1,
    gap: 6,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    color: APPLE_THEME.text,
    fontSize: 17,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  accentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    flexShrink: 1,
    color: APPLE_THEME.textMuted,
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    letterSpacing: -0.1,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(0,0,0,0.18)",
    marginHorizontal: 4,
  },
  priceBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#E7F0FF",
  },
  priceText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.1,
  },
  infoStack: {
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#F9F9FB",
  },
  infoIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  infoText: {
    flex: 1,
    color: APPLE_THEME.text,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: TOKENS.font.body,
    letterSpacing: -0.1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.06)",
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  actionPrimary: {
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  actionPressed: {
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  actionDanger: {
    backgroundColor: "rgba(255,59,48,0.08)",
  },
  actionPressedDanger: {
    backgroundColor: "rgba(255,59,48,0.14)",
  },
  actionDisabled: {
    opacity: 0.45,
  },
  actionPrimaryText: {
    color: APPLE_THEME.text,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.1,
  },
  actionDangerText: {
    color: "#FF3B30",
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.1,
  },
});
