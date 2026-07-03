import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { usePollPaymentStatus } from "@/modules/booking/hooks/usePayment";
import { formatPriceLocale } from "../../src/utils/dateFormat";

const THEME = {
  background: "#F5F5F7",
  surface: "#FFFFFF",
  primary: "#1D1D1F",
  border: "#E5E5EA",
  text: "#1D1D1F",
  textSecondary: "#8E8E93",
  textMuted: "#AEAEB2",
  accent: "#007AFF",
  accentLight: "#F0F8FF",
  white: "#FFFFFF",
  danger: "#FF3B30",
  dangerBg: "#FFF2F1",
  dangerBorder: "#FFD9D7",
  green: "#34C759",
  greenBg: "#F0FFF4",
  greenBorder: "#BBF7D0",
};

const PAYMENT_EXPIRY_MINUTES = 15;
const PAYMENT_EXPIRY_MS = PAYMENT_EXPIRY_MINUTES * 60 * 1000;

const QR_POLL_INTERVAL_MS = 4000;
const QR_MAX_POLLS = Math.ceil(PAYMENT_EXPIRY_MS / QR_POLL_INTERVAL_MS);

const QR_SIZE = 280;
const COUNTDOWN_URGENT_SECONDS = 120;

const formatCountdown = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const formatPrice = (price) => {
  if (price == null || Number.isNaN(Number(price))) return "—";
  return formatPriceLocale(Number(price));
};

function CopyButton({ label, value, copied, onCopy, mono }) {
  return (
    <Pressable
      onPress={onCopy}
      hitSlop={12}
      style={({ pressed }) => [
        styles.copyRow,
        pressed && styles.copyRowPressed,
      ]}
    >
      <View style={styles.copyContent}>
        <Text style={styles.copyLabel}>{label}</Text>
        <Text
          style={[styles.copyValue, mono && styles.copyValueMono]}
          numberOfLines={1}
        >
          {value || "—"}
        </Text>
      </View>
      <View style={[styles.copyIcon, copied && styles.copyIconDone]}>
        <MaterialIconsRounded
          name={copied ? "check" : "content-copy"}
          size={16}
          color={copied ? THEME.green : THEME.accent}
        />
      </View>
    </Pressable>
  );
}

export default function SepayQrScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { startPolling, stopPolling } = usePollPaymentStatus();

  const bookingId = params.bookingId;
  const paymentId = params.paymentId;
  const transactionRef = params.transactionRef;
  const qrUrl = params.qrUrl;
  const bankName = params.bankName;
  const bankAccountNumber = params.bankAccountNumber;
  const bankAccountName = params.bankAccountName;
  const amount = params.amount;

  const expiresAt = useMemo(() => {
    const parsed = Number(params.expiresAt);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    return Date.now() + PAYMENT_EXPIRY_MS;
  }, [params.expiresAt]);

  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)),
  );
  const [isExpired, setIsExpired] = useState(() => expiresAt - Date.now() <= 0);
  const [copiedKey, setCopiedKey] = useState(null);
  const copyTimerRef = useRef(null);

  useEffect(() => {
    if (!bookingId || isExpired) return;
    startPolling(paymentId, bookingId, {
      intervalMs: QR_POLL_INTERVAL_MS,
      maxPolls: QR_MAX_POLLS,
    });
    return () => stopPolling();
  }, [bookingId, paymentId, isExpired, startPolling, stopPolling]);

  useEffect(() => {
    if (isExpired) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isExpired]);

  useEffect(() => {
    if (isExpired) stopPolling();
  }, [isExpired, stopPolling]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async (key, value) => {
    if (!value) return;
    try {
      await Clipboard.setStringAsync(String(value));
      setCopiedKey(key);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Ignore clipboard errors
    }
  }, []);

  const handleCopyAccount = useCallback(
    () => handleCopy("acc", bankAccountNumber),
    [handleCopy, bankAccountNumber],
  );
  const handleCopyContent = useCallback(
    () => handleCopy("ref", transactionRef),
    [handleCopy, transactionRef],
  );
  const handleCopyAmount = useCallback(
    () => handleCopy("amount", amount),
    [handleCopy, amount],
  );

  const handleBack = useCallback(() => {
    stopPolling();
    router.back();
  }, [router, stopPolling]);

  const handleGoBookings = useCallback(() => {
    stopPolling();
    router.replace("/profile/bookings");
  }, [router, stopPolling]);

  const isUrgent = timeLeft <= COUNTDOWN_URGENT_SECONDS;
  const progressPercent = (timeLeft / (PAYMENT_EXPIRY_MINUTES * 60)) * 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
          <MaterialIconsRounded name="arrow-back" size={20} color={THEME.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Thanh toán chuyển khoản</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isExpired ? (
          <View style={styles.expiredContainer}>
            <View style={styles.expiredIcon}>
              <MaterialIconsRounded
                name="access-time-filled"
                size={48}
                color={THEME.danger}
              />
            </View>
            <Text style={styles.expiredTitle}>Đã hết hạn thanh toán</Text>
            <Text style={styles.expiredText}>
              Đơn hàng đã quá {PAYMENT_EXPIRY_MINUTES} phút. Nếu bạn đã chuyển
              khoản, hệ thống sẽ hoàn tiền tự động.
            </Text>
            <Pressable onPress={handleGoBookings} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Xem đơn của tôi</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Countdown Timer */}
            <View
              style={[
                styles.timerCard,
                isUrgent && styles.timerCardUrgent,
              ]}
            >
              <View style={styles.timerHeader}>
                <MaterialIconsRounded
                  name="schedule"
                  size={18}
                  color={isUrgent ? THEME.danger : THEME.accent}
                />
                <Text
                  style={[
                    styles.timerLabel,
                    isUrgent && styles.timerLabelUrgent,
                  ]}
                >
                  {isUrgent ? "Sắp hết hạn" : "Thời gian còn lại"}
                </Text>
              </View>
              <Text
                style={[
                  styles.timerValue,
                  isUrgent && styles.timerValueUrgent,
                ]}
              >
                {formatCountdown(timeLeft)}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: isUrgent ? THEME.danger : THEME.accent,
                    },
                  ]}
                />
              </View>
            </View>

            {/* QR Code Card */}
            <View style={styles.qrCard}>
              <View style={styles.qrWrapper}>
                {qrUrl ? (
                  <Image
                    source={{ uri: qrUrl }}
                    style={styles.qrImage}
                    contentFit="contain"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <ActivityIndicator size="large" color={THEME.accent} />
                    <Text style={styles.qrPlaceholderText}>
                      Đang tạo mã QR...
                    </Text>
                  </View>
                )}
              </View>

              <Pressable
                onPress={handleCopyAmount}
                style={({ pressed }) => [
                  styles.amountContainer,
                  pressed && styles.amountContainerPressed,
                ]}
              >
                <Text style={styles.amountLabel}>Số tiền thanh toán</Text>
                <Text style={styles.amountValue}>{formatPrice(amount)}</Text>
                <View style={styles.amountCopyHint}>
                  <MaterialIconsRounded
                    name="content-copy"
                    size={12}
                    color={THEME.textMuted}
                  />
                  <Text style={styles.amountCopyText}>Chạm để sao chép</Text>
                </View>
              </Pressable>
            </View>

            {/* Waiting Status */}
            <View style={styles.waitingCard}>
              <ActivityIndicator size="small" color={THEME.accent} />
              <Text style={styles.waitingText}>
                Đang chờ xác nhận thanh toán...
              </Text>
            </View>

            {/* Transfer Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <View style={styles.bankBadge}>
                  <MaterialIconsRounded
                    name="account-balance"
                    size={20}
                    color={THEME.accent}
                  />
                </View>
                <View style={styles.bankInfo}>
                  <Text style={styles.bankName}>{bankName || "Ngân hàng"}</Text>
                  <Text style={styles.bankHint}>Thông tin chuyển khoản</Text>
                </View>
              </View>

              <View style={styles.infoRows}>
                <CopyButton
                  label="Số tài khoản"
                  value={bankAccountNumber}
                  onCopy={handleCopyAccount}
                  copied={copiedKey === "acc"}
                  mono
                />
                <View style={styles.infoDivider} />
                <View style={styles.infoRowStatic}>
                  <Text style={styles.infoLabel}>Chủ tài khoản</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {bankAccountName || "—"}
                  </Text>
                </View>
                <View style={styles.infoDivider} />
                <CopyButton
                  label="Nội dung chuyển khoản"
                  value={transactionRef}
                  onCopy={handleCopyContent}
                  copied={copiedKey === "ref"}
                  mono
                />
              </View>
            </View>

            {/* Note */}
            <View style={styles.noteCard}>
              <MaterialIconsRounded
                name="info-outline"
                size={18}
                color={THEME.accent}
              />
              <Text style={styles.noteText}>
                Giữ nguyên nội dung chuyển khoản và chuyển đúng số tiền. Hệ
                thống tự xác nhận sau vài giây.
              </Text>
            </View>

            {/* Pay Later Button */}
            <Pressable onPress={handleGoBookings} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>
                Tôi sẽ thanh toán sau
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: THEME.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  headerTitle: {
    color: THEME.text,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  // Countdown Timer
  timerCard: {
    backgroundColor: THEME.accentLight,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#D0E8FF",
    marginBottom: 20,
  },
  timerCardUrgent: {
    backgroundColor: THEME.dangerBg,
    borderColor: THEME.dangerBorder,
  },
  timerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  timerLabel: {
    color: THEME.accent,
    fontSize: 13,
    fontWeight: "600",
  },
  timerLabelUrgent: {
    color: THEME.danger,
  },
  timerValue: {
    color: THEME.accent,
    fontSize: 42,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: 2,
    marginBottom: 12,
  },
  timerValueUrgent: {
    color: THEME.danger,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(0,122,255,0.15)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },

  // QR Code Card
  qrCard: {
    backgroundColor: THEME.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  qrWrapper: {
    width: QR_SIZE,
    height: QR_SIZE,
    borderRadius: 16,
    backgroundColor: THEME.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  qrImage: {
    width: QR_SIZE - 16,
    height: QR_SIZE - 16,
  },
  qrPlaceholder: {
    alignItems: "center",
    gap: 12,
  },
  qrPlaceholderText: {
    color: THEME.textMuted,
    fontSize: 13,
    fontWeight: "500",
  },
  amountContainer: {
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: THEME.background,
    borderRadius: 14,
    alignSelf: "stretch",
  },
  amountContainerPressed: {
    opacity: 0.7,
  },
  amountLabel: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amountValue: {
    color: THEME.primary,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  amountCopyHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  amountCopyText: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: "500",
  },

  // Waiting Status
  waitingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    marginBottom: 16,
  },
  waitingText: {
    color: THEME.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },

  // Info Card
  infoCard: {
    backgroundColor: THEME.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  bankBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: THEME.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: "700",
  },
  bankHint: {
    color: THEME.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  infoRows: {
    gap: 0,
  },
  infoRowStatic: {
    paddingVertical: 12,
  },
  infoLabel: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  infoValue: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: "600",
  },
  infoDivider: {
    height: 1,
    backgroundColor: THEME.border,
  },

  // Copy Button
  copyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  copyRowPressed: {
    opacity: 0.7,
  },
  copyContent: {
    flex: 1,
    marginRight: 12,
  },
  copyLabel: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  copyValue: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: "600",
  },
  copyValueMono: {
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.5,
  },
  copyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: THEME.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  copyIconDone: {
    backgroundColor: THEME.greenBg,
  },

  // Note
  noteCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: THEME.accentLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  noteText: {
    flex: 1,
    color: THEME.accent,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },

  // Buttons
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.surface,
  },
  secondaryBtnText: {
    color: THEME.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },

  // Expired State
  expiredContainer: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  expiredIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: THEME.dangerBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  expiredTitle: {
    color: THEME.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  expiredText: {
    color: THEME.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 32,
  },
  primaryBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    alignSelf: "stretch",
  },
  primaryBtnText: {
    color: THEME.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
