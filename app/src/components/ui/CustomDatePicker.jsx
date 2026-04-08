import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../constants/design-tokens";

// ── Helpers ────────────────────────────────────────────────────────────────

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

function formatDisplay(date) {
  if (!date) return null;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Lấy tất cả các ngày cần render trong lưới tháng (kể cả padding đầu/cuối) */
function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=CN
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  // Padding trước ngày 1
  for (let i = 0; i < firstDay; i++) cells.push(null);
  // Các ngày trong tháng
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Padding cuối để đủ hàng
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

// ── Calendar Modal ─────────────────────────────────────────────────────────

function CalendarModal({ visible, value, minimumDate, onConfirm, onClose }) {
  const today = new Date();
  const initDate = value ?? today;
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());
  const [selected, setSelected] = useState(value ?? null);

  const cells = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleDayPress = (day) => {
    if (!day) return;
    const date = new Date(viewYear, viewMonth, day);
    if (minimumDate && isBeforeDay(date, minimumDate)) return;
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
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.calendarCard} onPress={() => {}}>
          {/* Month navigation */}
          <View style={styles.calNavRow}>
            <Pressable onPress={goToPrevMonth} style={styles.calNavBtn} hitSlop={8}>
              <MaterialIcons name="chevron-left" size={22} color={TOKENS.color.neutral[700]} />
            </Pressable>
            <Text style={styles.calMonthLabel}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <Pressable onPress={goToNextMonth} style={styles.calNavBtn} hitSlop={8}>
              <MaterialIcons name="chevron-right" size={22} color={TOKENS.color.neutral[700]} />
            </Pressable>
          </View>

          {/* Weekday headers */}
          <View style={styles.calWeekRow}>
            {WEEKDAYS.map((d) => (
              <Text key={d} style={styles.calWeekLabel}>{d}</Text>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.calGrid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`empty-${idx}`} style={styles.calCell} />;

              const date = new Date(viewYear, viewMonth, day);
              const isSelected = isSameDay(date, selected);
              const isToday = isSameDay(date, today);
              const disabled = minimumDate ? isBeforeDay(date, minimumDate) : false;

              return (
                <Pressable
                  key={idx}
                  onPress={() => handleDayPress(day)}
                  disabled={disabled}
                  style={({ pressed }) => [
                    styles.calCell,
                    isSelected && styles.calCellSelected,
                    isToday && !isSelected && styles.calCellToday,
                    pressed && !disabled && styles.calCellPressed,
                    disabled && styles.calCellDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.calDayText,
                      isSelected && styles.calDayTextSelected,
                      isToday && !isSelected && styles.calDayTextToday,
                      disabled && styles.calDayTextDisabled,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.calActions}>
            <Pressable onPress={onClose} style={styles.calCancelBtn}>
              <Text style={styles.calCancelText}>Hủy</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              disabled={!selected}
              style={[styles.calConfirmBtn, !selected && styles.calConfirmBtnDisabled]}
            >
              <Text style={[styles.calConfirmText, !selected && styles.calConfirmTextDisabled]}>
                Xác nhận
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Public component ───────────────────────────────────────────────────────

/**
 * CustomDatePicker — pure-JS calendar picker, không cần native module.
 *
 * Props:
 *  label        string
 *  value        Date | null
 *  onChange     (Date | null) => void
 *  minimumDate  Date | null
 *  placeholder  string
 */
export function CustomDatePicker({
  label,
  value,
  onChange,
  minimumDate,
  placeholder = "Chọn ngày",
}) {
  const [open, setOpen] = useState(false);

  const displayText = formatDisplay(value);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <View style={styles.iconWrap}>
          <MaterialIcons
            name="calendar-today"
            size={16}
            color={value ? TOKENS.color.primary[600] : TOKENS.color.neutral[400]}
          />
        </View>

        <Text style={[styles.valueText, !displayText && styles.placeholderText]}>
          {displayText ?? placeholder}
        </Text>

        {value ? (
          <Pressable hitSlop={8} onPress={() => onChange(null)} style={styles.clearBtn}>
            <MaterialIcons name="close" size={16} color={TOKENS.color.neutral[400]} />
          </Pressable>
        ) : (
          <MaterialIcons name="expand-more" size={20} color={TOKENS.color.neutral[400]} />
        )}
      </Pressable>

      <CalendarModal
        visible={open}
        value={value}
        minimumDate={minimumDate}
        onConfirm={(date) => onChange(date)}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const PRIMARY = TOKENS.color.primary[600];
const CELL_SIZE = 40;

const styles = StyleSheet.create({
  /* ── Input row ── */
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    color: TOKENS.color.neutral[500],
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FBFF",
    borderRadius: TOKENS.radius.lg,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.22)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowPressed: {
    borderColor: TOKENS.color.primary[400],
    backgroundColor: "rgba(0,102,230,0.04)",
  },
  iconWrap: {
    width: 20,
    alignItems: "center",
  },
  valueText: {
    flex: 1,
    fontSize: 14,
    fontFamily: TOKENS.font.medium,
    color: TOKENS.color.neutral[900],
  },
  placeholderText: {
    color: TOKENS.color.neutral[400],
    fontFamily: TOKENS.font.body,
  },
  clearBtn: {
    padding: 2,
  },

  /* ── Modal overlay ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.48)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  calendarCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: TOKENS.radius["2xl"],
    padding: 20,
    ...TOKENS.shadow.lg,
  },

  /* ── Nav row ── */
  calNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: TOKENS.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  calMonthLabel: {
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
    color: TOKENS.color.neutral[900],
  },

  /* ── Weekday headers ── */
  calWeekRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  calWeekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
    color: TOKENS.color.neutral[400],
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  /* ── Day grid ── */
  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calCell: {
    width: `${100 / 7}%`,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: CELL_SIZE / 2,
  },
  calCellSelected: {
    backgroundColor: PRIMARY,
  },
  calCellToday: {
    backgroundColor: "rgba(0,102,230,0.1)",
  },
  calCellPressed: {
    backgroundColor: "rgba(0,102,230,0.08)",
  },
  calCellDisabled: {
    opacity: 0.3,
  },
  calDayText: {
    fontSize: 14,
    fontFamily: TOKENS.font.medium,
    color: TOKENS.color.neutral[800],
  },
  calDayTextSelected: {
    color: "#FFFFFF",
    fontFamily: TOKENS.font.semibold,
  },
  calDayTextToday: {
    color: PRIMARY,
    fontFamily: TOKENS.font.semibold,
  },
  calDayTextDisabled: {
    color: TOKENS.color.neutral[400],
  },

  /* ── Actions ── */
  calActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  calCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: TOKENS.radius.lg,
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  calCancelText: {
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
    color: TOKENS.color.neutral[600],
  },
  calConfirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: TOKENS.radius.lg,
    alignItems: "center",
    backgroundColor: PRIMARY,
    ...TOKENS.shadow.accent,
  },
  calConfirmBtnDisabled: {
    backgroundColor: TOKENS.color.neutral[100],
    shadowOpacity: 0,
    elevation: 0,
  },
  calConfirmText: {
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
    color: "#FFFFFF",
  },
  calConfirmTextDisabled: {
    color: TOKENS.color.neutral[400],
  },
});
