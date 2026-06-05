import { memo, useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { PALETTE, TOKENS } from "../constants/placeSheetConstants";

const VISIT_TYPES = [
  { key: "solo", vi: "Một mình", en: "Solo" },
  { key: "couple", vi: "Cặp đôi", en: "Couple" },
  { key: "family", vi: "Gia đình", en: "Family" },
  { key: "friends", vi: "Bạn bè", en: "Friends" },
  { key: "business", vi: "Công tác", en: "Business" },
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
  placeName,
  isSubmitting,
  t,
  onClose,
  onSubmit,
}) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [visitType, setVisitType] = useState(null);

  const canSubmit = rating > 0 && !isSubmitting;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    onSubmit?.({
      rating,
      content: content.trim() || undefined,
      visitType: visitType || undefined,
    });
  }, [canSubmit, rating, content, visitType, onSubmit]);

  return (
    <BottomSheetView style={styles.sheet}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {t("Viết đánh giá", "Write a review")}
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
          {t("Đánh giá của bạn", "Your rating")}
        </Text>
        <StarSelector value={rating} onChange={setRating} />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>
          {t("Loại chuyến đi", "Trip type")}
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
                {t(vt.vi, vt.en)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>
          {t("Chia sẻ trải nghiệm", "Share your experience")}
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder={t(
            "Điều gì bạn thích nhất?",
            "What did you like the most?",
          )}
          placeholderTextColor={PALETTE.textSoft}
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={1000}
          textAlignVertical="top"
        />
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
            {t("Gửi đánh giá", "Submit review")}
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
