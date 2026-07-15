import { memo, useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { PALETTE, TOKENS } from "../constants/placeSheetConstants";
import { compressImageToDataUrl } from "@/lib/image-compress";
import {
  buildReviewMediaPayload,
  REVIEW_MEDIA_LIMIT,
} from "../utils/reviewMedia";
import { toReviewDraft } from "../utils/reviewDraft";

const VISIT_TYPES = [
  { key: "solo" },
  { key: "couple" },
  { key: "family" },
  { key: "friends" },
  { key: "business" },
];

function StarSelector({ value, onChange }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange(star)}
          hitSlop={6}
          style={styles.starBtn}
        >
          <MaterialIconsRounded
            name={star <= value ? "star" : "star-border"}
            size={32}
            color={star <= value ? "#FBBF24" : PALETTE.border}
          />
        </Pressable>
      ))}
    </View>
  );
}

export const ReviewComposerSheetContent = memo(function ReviewComposerSheetContent({
  initialReview,
  placeName,
  isSubmitting,
  t,
  onClose,
  onSubmit,
}) {
  const initialDraft = toReviewDraft(initialReview);
  const [rating, setRating] = useState(initialDraft.rating);
  const [content, setContent] = useState(initialDraft.content);
  const [visitType, setVisitType] = useState(initialDraft.visitType);
  const [selectedMedia, setSelectedMedia] = useState(initialDraft.media);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);

  const canSubmit = rating > 0 && !isSubmitting && !isProcessingMedia;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    onSubmit?.({
      rating,
      content: content.trim() || undefined,
      visitType: visitType || undefined,
      media: buildReviewMediaPayload(selectedMedia),
    });
  }, [canSubmit, rating, content, visitType, selectedMedia, onSubmit]);

  const handlePickMedia = useCallback(async () => {
    const remainingSlots = REVIEW_MEDIA_LIMIT - selectedMedia.length;
    if (remainingSlots <= 0 || isProcessingMedia || isSubmitting) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          t("place.detail.reviewPhotoPermissionTitle"),
          t("place.detail.reviewPhotoPermissionMessage"),
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 1,
      });
      if (result.canceled || !result.assets?.length) return;

      setIsProcessingMedia(true);
      const compressed = await Promise.all(
        result.assets.slice(0, remainingSlots).map(async (asset) => {
          const image = await compressImageToDataUrl(asset.uri, {
            maxBytes: 600 * 1024,
            startWidth: 1280,
          });
          return { dataUrl: image.dataUrl };
        }),
      );
      setSelectedMedia((current) =>
        [...current, ...compressed].slice(0, REVIEW_MEDIA_LIMIT),
      );
    } catch {
      Alert.alert(
        t("place.detail.reviewPhotoErrorTitle"),
        t("place.detail.reviewPhotoErrorMessage"),
      );
    } finally {
      setIsProcessingMedia(false);
    }
  }, [isProcessingMedia, isSubmitting, selectedMedia.length, t]);

  const handleRemoveMedia = useCallback((index) => {
    setSelectedMedia((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }, []);

  return (
    <BottomSheetView style={styles.sheet}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {t("place.writeReview")}
          </Text>
          {placeName ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {placeName}
            </Text>
          ) : null}
        </View>
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
          <MaterialIconsRounded name="close" size={20} color={PALETTE.textMuted} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>
          {t("place.detail.yourRating")}
        </Text>
        <StarSelector value={rating} onChange={setRating} />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>
          {t("place.detail.tripType")}
        </Text>
        <View style={styles.chipRow}>
          {VISIT_TYPES.map((vt) => (
            <Pressable
              key={vt.key}
              onPress={() =>
                setVisitType((current) => (current === vt.key ? null : vt.key))
              }
              style={[
                styles.chip,
                visitType === vt.key && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  visitType === vt.key && styles.chipTextActive,
                ]}
              >
                {t(`place.detail.visitType.${vt.key}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>
          {t("place.detail.shareExperience")}
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder={t("place.detail.whatDidYouLike")}
          placeholderTextColor={PALETTE.textSoft}
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={1000}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.mediaSection}>
        <View style={styles.mediaHeader}>
          <Text style={styles.label}>{t("place.detail.reviewPhotos")}</Text>
          <Text style={styles.mediaCount}>
            {selectedMedia.length}/{REVIEW_MEDIA_LIMIT}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mediaList}
        >
          {selectedMedia.length < REVIEW_MEDIA_LIMIT ? (
            <Pressable
              onPress={handlePickMedia}
              disabled={isProcessingMedia || isSubmitting}
              style={styles.addMediaButton}
              accessibilityRole="button"
              accessibilityLabel={t("place.detail.reviewPhotos")}
            >
              {isProcessingMedia ? (
                <ActivityIndicator size="small" color={PALETTE.primary} />
              ) : (
                <>
                  <MaterialIconsRounded
                    name="add-photo-alternate"
                    size={22}
                    color={PALETTE.primary}
                  />
                  <Text style={styles.addMediaText}>
                    {t("place.detail.addReviewPhoto")}
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}
          {selectedMedia.map((media, index) => (
            <View key={`${media.dataUrl.slice(-16)}-${index}`} style={styles.mediaPreview}>
              <Image
                source={{ uri: media.dataUrl }}
                style={styles.mediaPreviewImage}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
              <Pressable
                onPress={() => handleRemoveMedia(index)}
                style={styles.removeMediaButton}
                accessibilityRole="button"
                accessibilityLabel={t("place.detail.removeReviewPhoto")}
              >
                <MaterialIconsRounded name="close" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </View>

      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit}
        style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.submitText}>
            {t("place.detail.submitReview")}
          </Text>
        )}
      </Pressable>
    </BottomSheetView>
  );
});

const styles = StyleSheet.create({
  sheet: { flex: 1, paddingHorizontal: 18, paddingTop: 8 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  title: {
    color: PALETTE.text,
    fontSize: 20,
    fontFamily: TOKENS.font.heading,
  },
  subtitle: {
    color: PALETTE.textMuted,
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    marginTop: 2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.surfaceAlt,
  },
  section: { marginBottom: 20 },
  mediaSection: { marginBottom: 20 },
  label: {
    color: PALETTE.text,
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
    marginBottom: 10,
  },
  starRow: { flexDirection: "row", gap: 4 },
  starBtn: { padding: 2 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surfaceAlt,
  },
  chipActive: {
    borderColor: PALETTE.primary,
    backgroundColor: PALETTE.primary,
  },
  chipText: {
    color: PALETTE.textMuted,
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
  },
  chipTextActive: { color: "#FFFFFF" },
  textInput: {
    backgroundColor: PALETTE.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    padding: 14,
    minHeight: 100,
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    color: PALETTE.text,
  },
  mediaHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  mediaCount: { color: PALETTE.textSoft, fontSize: 12, fontFamily: TOKENS.font.medium, marginBottom: 10 },
  mediaList: { gap: 10 },
  addMediaButton: {
    width: 76,
    height: 76,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addMediaText: { color: PALETTE.primary, fontSize: 10, fontFamily: TOKENS.font.medium },
  mediaPreview: { width: 76, height: 76, borderRadius: 16, overflow: "hidden" },
  mediaPreviewImage: { width: 76, height: 76 },
  removeMediaButton: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  submitBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 20,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
  },
});
