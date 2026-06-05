import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import { PALETTE } from "../constants/placeSheetConstants";
import { TOKENS } from "../../../constants/design-tokens";

const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function OpeningHours({ hours, t }) {
  const today = new Date().getDay();

  return (
    <View style={styles.openingHoursList}>
      {DAY_NAMES.map((day, index) => {
        const dayNumber = index === 6 ? 0 : index + 1;
        const item = hours?.find((entry) => entry.dayOfWeek === dayNumber);
        const isToday = today === dayNumber;
        const label = item?.isClosed
          ? t("Đóng cửa", "Closed")
          : item?.openTime && item?.closeTime
            ? `${item.openTime} - ${item.closeTime}`
            : t("Chưa cập nhật", "Not updated");

        return (
          <View
            key={day}
            style={[styles.openingRow, isToday && styles.openingRowActive]}
          >
            <Text
              style={[styles.openingDay, isToday && styles.openingDayActive]}
            >
              {day}
            </Text>
            <Text
              style={[
                styles.openingLabel,
                isToday && styles.openingLabelActive,
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function SectionCard({ title, actionLabel, onActionPress, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {actionLabel ? (
          <Pressable onPress={onActionPress} hitSlop={8}>
            <Text style={styles.sectionAction}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function StatPill({ icon, label }) {
  return (
    <View style={styles.statPill}>
      <MaterialIconsRounded name={icon} size={15} color={PALETTE.textMuted} />
      <Text style={styles.statPillText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function FactCard({ icon, label, value }) {
  return (
    <View style={styles.factCard}>
      <View style={styles.factIconWrap}>
        <MaterialIconsRounded
          name={icon}
          size={18}
          color={PALETTE.primaryDark}
        />
      </View>
      <View style={styles.factContent}>
        <Text style={styles.factLabel}>{label}</Text>
        <Text style={styles.factValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
      <MaterialIconsRounded
        name="chevron-right"
        size={18}
        color={PALETTE.textSoft}
      />
    </View>
  );
}

export function AmenityCard({ icon, label, tag, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.amenityCard}>
      <View style={styles.amenityIconWrap}>
        <MaterialIconsRounded
          name={icon}
          size={22}
          color={PALETTE.primaryDark}
        />
      </View>
      <Text style={styles.amenityLabel} numberOfLines={1}>
        {label}
      </Text>
      {tag ? (
        <Text style={styles.amenityTagText} numberOfLines={1}>
          {tag}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function DetailRow({ icon, label, value, onPress, highlight = false }) {
  const content = (
    <View style={styles.detailRow}>
      <View style={styles.detailIconWrap}>
        <MaterialIconsRounded
          name={icon}
          size={17}
          color={highlight ? PALETTE.primaryDark : PALETTE.textMuted}
        />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text
          style={[styles.detailValue, highlight && styles.detailValueHighlight]}
          numberOfLines={3}
        >
          {value}
        </Text>
      </View>
      {onPress ? (
        <MaterialIconsRounded
          name="open-in-new"
          size={17}
          color={PALETTE.textSoft}
        />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.detailRowPressable}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  sectionCard: {
    marginTop: 14,
    borderRadius: 26,
    padding: 18,
    backgroundColor: PALETTE.surface,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    color: PALETTE.text,
    fontSize: 18,
    fontFamily: TOKENS.font.heading,
  },
  sectionAction: {
    color: PALETTE.primary,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: PALETTE.surfaceAlt,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
  },
  statPillText: {
    maxWidth: 120,
    color: PALETTE.textMuted,
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
  },
  amenityCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  amenityIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.surfaceAlt,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    marginBottom: 8,
  },
  amenityLabel: {
    color: PALETTE.text,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    textAlign: "center",
  },
  amenityTagText: {
    color: PALETTE.textSoft,
    fontSize: 11,
    fontFamily: TOKENS.font.medium,
    textAlign: "center",
    marginTop: 2,
  },
  factCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 78,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
  },
  factIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.primarySoft,
  },
  factContent: {
    flex: 1,
    minWidth: 0,
  },
  factLabel: {
    color: PALETTE.textSoft,
    fontSize: 11,
    marginBottom: 4,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    fontFamily: TOKENS.font.semibold,
  },
  factValue: {
    color: PALETTE.text,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: TOKENS.font.semibold,
  },
  detailRowPressable: {
    borderRadius: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    backgroundColor: PALETTE.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  detailIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  detailContent: {
    flex: 1,
    minWidth: 0,
  },
  detailLabel: {
    color: PALETTE.textSoft,
    fontSize: 11,
    marginBottom: 2,
    fontFamily: TOKENS.font.medium,
  },
  detailValue: {
    color: PALETTE.text,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: TOKENS.font.semibold,
  },
  detailValueHighlight: {
    color: PALETTE.primaryDark,
  },
  openingHoursList: { gap: 8 },
  openingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: PALETTE.surfaceAlt,
  },
  openingRowActive: { backgroundColor: PALETTE.primarySoft },
  openingDay: {
    color: PALETTE.textMuted,
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
  },
  openingDayActive: {
    color: PALETTE.primaryDark,
    fontFamily: TOKENS.font.semibold,
  },
  openingLabel: {
    color: PALETTE.textMuted,
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
  },
  openingLabelActive: {
    color: PALETTE.primaryDark,
    fontFamily: TOKENS.font.semibold,
  },
});
