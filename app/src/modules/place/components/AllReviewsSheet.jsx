import { memo, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { resolveMediaUrl } from "../../../lib/media-url";
import { formatShortDate } from "@/utils/dateFormat";
import {
  PALETTE,
  TOKENS,
  REVIEW_FILTER_RATINGS,
  REVIEW_MEDIA_LIMIT,
  formatReviewCount,
} from "../constants/placeSheetConstants";

export function StarRow({ rating, size = 16 }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((value) => (
        <MaterialIconsRounded
          key={value}
          name={value <= Math.round(rating) ? "star" : "star-border"}
          size={size}
          color="#FBBF24"
        />
      ))}
    </View>
  );
}

function getReviewMediaUri(media) {
  return resolveMediaUrl(
    media?.mediaData || media?.thumbnailUrl || media?.secureUrl || media?.url || null,
  );
}

export const ReviewCard = memo(function ReviewCard({ review, t }) {
  const author =
    review?.user?.profile?.fullName ||
    review?.user?.email?.split("@")[0] ||
    t("place.detail.anonymous");
  const avatar = resolveMediaUrl(review?.user?.profile?.avatar);
  const media = (review?.media || []).map(getReviewMediaUri).filter(Boolean);
  const visibleReplies = (review?.replies || []).filter(
    (reply) => reply?.status !== "hidden",
  );

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.reviewAvatarImage} contentFit="cover" />
          ) : (
            <Text style={styles.reviewAvatarFallback}>{author.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.reviewMeta}>
          <View style={styles.reviewAuthorRow}>
            <Text style={styles.reviewAuthor}>{author}</Text>
            {review?.isVerifiedPurchase ? (
              <View style={styles.verifiedBadge}>
                <MaterialIconsRounded name="verified" size={12} color={PALETTE.success} />
                <Text style={styles.verifiedText}>{t("place.detail.verified")}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.reviewStars}>
            <StarRow rating={review?.rating || 0} size={12} />
          </View>
        </View>
        <Text style={styles.reviewDate}>
          {review?.createdAt ? formatShortDate(review.createdAt) : ""}
        </Text>
      </View>
      {review?.content ? <Text style={styles.reviewContent}>{review.content}</Text> : null}
      {media.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewMediaScroller} contentContainerStyle={styles.reviewMediaList}>
          {media.slice(0, REVIEW_MEDIA_LIMIT).map((uri, index) => (
            <Image
              key={`${uri}-${index}`}
              source={{ uri }}
              style={styles.reviewMediaImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ))}
        </ScrollView>
      ) : null}
      {visibleReplies.length > 0 ? (
        <View style={styles.reviewReplyList}>
          {visibleReplies.map((reply) => (
            <View key={reply.id} style={styles.reviewReplyCard}>
              <View style={styles.reviewReplyHeader}>
                <MaterialIconsRounded name="storefront" size={15} color={PALETTE.primaryDark} />
                <Text style={styles.reviewReplyAuthor}>
                  {reply?.user?.profile?.fullName || t("place.detail.businessReply")}
                </Text>
              </View>
              <Text style={styles.reviewReplyContent}>{reply.content}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
});

export const AllReviewsSheetContent = memo(function AllReviewsSheetContent({ reviews, totalCount, onClose, t }) {
  const [ratingFilter, setRatingFilter] = useState(null);
  const [photosOnly, setPhotosOnly] = useState(false);

  const filteredReviews = useMemo(() => {
    return [...reviews]
      .filter((review) => (ratingFilter ? Number(review?.rating) === ratingFilter : true))
      .filter((review) => (photosOnly ? Array.isArray(review?.media) && review.media.length > 0 : true))
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
  }, [photosOnly, ratingFilter, reviews]);

  return (
    <BottomSheetView style={styles.sheet}>
      <View style={styles.sheetHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetTitle}>{t("place.detail.allReviews")}</Text>
          <Text style={styles.sheetSubtitle}>{formatReviewCount(totalCount, t)}</Text>
        </View>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <MaterialIconsRounded name="close" size={20} color={PALETTE.textMuted} />
        </Pressable>
      </View>

      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <Pressable
            onPress={() => setRatingFilter(null)}
            style={[styles.filterChip, ratingFilter == null && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, ratingFilter == null && styles.filterTextActive]}>
              {t("place.detail.latest")}
            </Text>
          </Pressable>
          {REVIEW_FILTER_RATINGS.map((rating) => (
            <Pressable
              key={rating}
              onPress={() => setRatingFilter((current) => (current === rating ? null : rating))}
              style={[styles.filterChip, ratingFilter === rating && styles.filterChipActive]}
            >
              <MaterialIconsRounded name="star" size={14} color={ratingFilter === rating ? "#FFFFFF" : PALETTE.accent} />
              <Text style={[styles.filterText, ratingFilter === rating && styles.filterTextActive]}>{rating}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => setPhotosOnly((value) => !value)}
            style={[styles.filterChip, photosOnly && styles.filterChipActive]}
          >
            <MaterialIconsRounded name="photo-library" size={14} color={photosOnly ? "#FFFFFF" : PALETTE.primaryDark} />
            <Text style={[styles.filterText, photosOnly && styles.filterTextActive]}>
              {t("place.detail.withPhotos")}
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {filteredReviews.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t("place.detail.noMatchingReviews")}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReviews}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ReviewCard review={item} t={t} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </BottomSheetView>
  );
});

const styles = StyleSheet.create({
  sheet: { flex: 1, paddingHorizontal: 18, paddingTop: 8 },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  sheetTitle: { color: PALETTE.text, fontSize: 20, fontFamily: TOKENS.font.heading },
  sheetSubtitle: { color: PALETTE.textMuted, fontSize: 13, marginTop: 4, fontFamily: TOKENS.font.body },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: PALETTE.surfaceAlt,
  },
  filterWrap: {
    marginHorizontal: -18, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: PALETTE.borderSoft, paddingBottom: 12,
  },
  filterRow: { gap: 8, paddingHorizontal: 18 },
  filterChip: {
    minHeight: 36, borderRadius: 999, borderWidth: 1, borderColor: PALETTE.border, backgroundColor: PALETTE.surfaceAlt,
    paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 5,
  },
  filterChipActive: { borderColor: PALETTE.primary, backgroundColor: PALETTE.primary },
  filterText: { color: PALETTE.textMuted, fontSize: 12, fontFamily: TOKENS.font.semibold },
  filterTextActive: { color: "#FFFFFF" },
  emptyState: { flex: 1, justifyContent: "center" },
  emptyText: { color: PALETTE.textMuted, fontSize: 14, textAlign: "center", paddingVertical: 18, fontFamily: TOKENS.font.medium },
  listContent: { paddingBottom: 32 },
  reviewCard: { padding: 16, borderRadius: 20, backgroundColor: PALETTE.surfaceAlt, marginBottom: 10 },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  reviewAvatar: {
    width: 44, height: 44, borderRadius: 22, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: PALETTE.primarySoft,
  },
  reviewAvatarImage: { width: 44, height: 44 },
  reviewAvatarFallback: { color: PALETTE.primaryDark, fontSize: 16, fontFamily: TOKENS.font.heading },
  reviewMeta: { flex: 1 },
  reviewAuthorRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  reviewAuthor: { color: PALETTE.text, fontSize: 14, fontFamily: TOKENS.font.semibold },
  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: "#ECFDF5",
  },
  verifiedText: { color: PALETTE.success, fontSize: 10, fontFamily: TOKENS.font.semibold },
  reviewStars: { flexDirection: "row", gap: 1, marginTop: 2 },
  reviewDate: { color: PALETTE.textSoft, fontSize: 11, fontFamily: TOKENS.font.medium },
  reviewContent: { color: PALETTE.textMuted, fontSize: 13, lineHeight: 21, marginTop: 12, fontFamily: TOKENS.font.body },
  reviewMediaScroller: { marginTop: 12 },
  reviewMediaList: { gap: 8, paddingRight: 4 },
  reviewMediaImage: { width: 92, height: 92, borderRadius: 16, backgroundColor: PALETTE.borderSoft },
  reviewReplyList: { gap: 8, marginTop: 12 },
  reviewReplyCard: { borderLeftWidth: 3, borderLeftColor: PALETTE.primary, borderRadius: 16, padding: 12, backgroundColor: "#FFFFFF" },
  reviewReplyHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  reviewReplyAuthor: { color: PALETTE.primaryDark, fontSize: 12, fontFamily: TOKENS.font.semibold },
  reviewReplyContent: { color: PALETTE.textMuted, fontSize: 13, lineHeight: 20, fontFamily: TOKENS.font.body },
});
