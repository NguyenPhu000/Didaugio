import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { TOKENS } from "../../constants/design-tokens";

/* ── Apple tokens ── */
const INK = "#1D1D1F";
const CANVAS = "#FFFFFF";
const PARCHMENT = "#F5F5F7";
const PRIMARY = "#0066CC";
const MUTED = "rgba(0,0,0,0.48)";
const BORDER_SOFT = "rgba(0,0,0,0.06)";

/* ── Helpers ── */

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

function formatDisplay(date) {
  if (!date) return null;
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeDay(a, b) {
  if (!a || !b) return false;
  const as = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bs = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return as < bs;
}

/* ── Calendar Modal ── */

function CalendarModal({ visible, value, minimumDate, onConfirm, onClose }) {
  const { t } = useTranslation();
  const { width: screenW } = useWindowDimensions();
  const cellSize = Math.floor((screenW - 80) / 7);

  const today = new Date();
  const initDate = value ?? today;
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());
  const [selected, setSelected] = useState(value ?? null);

  const cells = useMemo(
    () => buildCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayPress = (day) => {
    if (!day) return;
    const date = new Date(viewYear, viewMonth, day);
    if (minimumDate && isBeforeDay(date, minimumDate)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(date);
  };

  const handleConfirm = () => {
    if (selected) onConfirm(selected);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={st.overlay} onPress={onClose}>
        <Pressable style={st.card} onPress={() => {}}>
          {/* Month nav */}
          <View style={st.navRow}>
            <Pressable onPress={goToPrevMonth} hitSlop={10} style={st.navBtn}>
              <Ionicons name="chevron-back" size={18} color={INK} />
            </Pressable>
            <Text style={st.monthLabel}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <Pressable onPress={goToNextMonth} hitSlop={10} style={st.navBtn}>
              <Ionicons name="chevron-forward" size={18} color={INK} />
            </Pressable>
          </View>

          {/* Weekday headers */}
          <View style={st.weekRow}>
            {WEEKDAYS.map((d) => (
              <Text key={d} style={[st.weekLabel, { width: cellSize }]}>
                {d}
              </Text>
            ))}
          </View>

          {/* Day grid */}
          <View style={st.grid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`e-${idx}`} style={[st.cell, { width: cellSize, height: cellSize }]} />;

              const date = new Date(viewYear, viewMonth, day);
              const isSelected = isSameDay(date, selected);
              const isToday = isSameDay(date, today);
              const disabled = minimumDate
                ? isBeforeDay(date, minimumDate)
                : false;

              return (
                <Pressable
                  key={idx}
                  onPress={() => handleDayPress(day)}
                  disabled={disabled}
                  style={[st.cell, { width: cellSize, height: cellSize }, isSelected && st.cellSelected]}
                >
                  <Text
                    style={[
                      st.dayText,
                      isSelected && st.dayTextSelected,
                      isToday && !isSelected && st.dayTextToday,
                      disabled && st.dayTextDisabled,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Actions */}
          <View style={st.actions}>
            <Pressable onPress={onClose} style={st.cancelBtn}>
              <Text style={st.cancelText}>{t("datePicker.cancel")}</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              disabled={!selected}
              style={[st.confirmBtn, !selected && st.confirmBtnDisabled]}
            >
              <Text
                style={[st.confirmText, !selected && st.confirmTextDisabled]}
              >
                {t("datePicker.confirm")}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ── Public: iOS table row date picker ── */

export function CustomDatePicker({
  label,
  value,
  onChange,
  minimumDate,
  placeholder,
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const defaultPlaceholder = placeholder || t("datePicker.select");
  const displayText = formatDisplay(value);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setOpen(true)}
        style={st.row}
      >
        <Text style={st.rowLabel}>{label}</Text>

        <Text style={[st.rowValue, !displayText && st.rowPlaceholder]} numberOfLines={1}>
          {displayText ?? defaultPlaceholder}
        </Text>

        {value ? (
          <TouchableOpacity
            hitSlop={8}
            onPress={(e) => {
              e.stopPropagation?.();
              onChange(null);
            }}
            style={st.rowClear}
          >
            <Ionicons name="close-circle" size={16} color={MUTED} />
          </TouchableOpacity>
        ) : null}

        <Ionicons name="chevron-forward" size={16} color="#C8C8CC" />
      </TouchableOpacity>

      <CalendarModal
        visible={open}
        value={value}
        minimumDate={minimumDate}
        onConfirm={(date) => onChange(date)}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

/* ── Styles ── */

const st = StyleSheet.create({
  /* ── iOS table row ── */
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 4,
    minHeight: 48,
  },
  rowPressed: {
    backgroundColor: PARCHMENT,
  },
  rowLabel: {
    fontSize: 17,
    fontFamily: TOKENS.font.body,
    color: INK,
    letterSpacing: -0.374,
  },
  rowValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 17,
    fontFamily: TOKENS.font.body,
    color: PRIMARY,
    letterSpacing: -0.374,
    marginRight: 6,
  },
  rowPlaceholder: {
    color: MUTED,
  },
  rowClear: {
    paddingHorizontal: 4,
    marginRight: 4,
  },

  /* ── Modal ── */
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.48)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    backgroundColor: CANVAS,
    borderRadius: 18,
    padding: 20,
  },

  /* ── Nav ── */
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PARCHMENT,
  },
  monthLabel: {
    fontSize: 17,
    fontFamily: TOKENS.font.semibold,
    color: INK,
    letterSpacing: -0.374,
  },

  /* ── Weekday headers ── */
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekLabel: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
    color: MUTED,
    letterSpacing: -0.08,
  },

  /* ── Day grid ── */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
  },
  cellSelected: {
    backgroundColor: INK,
  },
  dayText: {
    fontSize: 15,
    fontFamily: TOKENS.font.body,
    color: INK,
  },
  dayTextSelected: {
    color: CANVAS,
    fontFamily: TOKENS.font.semibold,
  },
  dayTextToday: {
    color: PRIMARY,
    fontFamily: TOKENS.font.semibold,
  },
  dayTextDisabled: {
    color: "#C8C8CC",
  },

  /* ── Actions ── */
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: "center",
    backgroundColor: PARCHMENT,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: TOKENS.font.body,
    color: INK,
    letterSpacing: -0.374,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: "center",
    backgroundColor: PRIMARY,
  },
  confirmBtnDisabled: {
    backgroundColor: PARCHMENT,
  },
  confirmText: {
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: CANVAS,
    letterSpacing: -0.374,
  },
  confirmTextDisabled: {
    color: MUTED,
  },
});
