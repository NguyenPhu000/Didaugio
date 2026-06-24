import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
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
  border: "#D2D2D7",
  text: "#1D1D1F",
  textSecondary: "rgba(0,0,0,0.48)",
  textMuted: "rgba(0,0,0,0.36)",
  primaryTint: "rgba(29,29,31,0.06)",
  accent: "#0066FF",
  accentBg: "#EBF1FF",
  accentBorder: "#B3D1FF",
  white: "#FFFFFF",
  danger: "#DC2626",
  dangerBg: "#FEF2F2",
  dangerBorder: "#FECACA",
  green: "#16A34A",
  greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0",
};

const PAYMENT_EXPIRY_MINUTES = 15;
const PAYMENT_EXPIRY_MS = PAYMENT_EXPIRY_MINUTES * 60 * 1000;

const QR_POLL_INTERVAL_MS = 4000;
const QR_MAX_POLLS = Math.ceil(PAYMENT_EXPIRY_MS / QR_POLL_INTERVAL_MS);

/** Deep link scheme cho các ngân hàng VN */
const BANK_DEEP_LINKS = {
  MBBank: { scheme: "mbbank://", package: "com.mbmobile" },
  Vietcombank: { scheme: "vcbdigibank://", package: "com.VCB" },
  Techcombank: { scheme: "tcb://", package: "vn.com.techcombank.bb.app" },
  ACB: { scheme: "acb://", mobile: "https://acb.com.vn/app" },
  "VPBank": { scheme: "vnpay://", package: "vpbank.mobile" },
  TPBank: { scheme: "tpbank://", package: "com.tpb" },
  Sacombank: { scheme: "sacombank://", package: "com.sacombank" },
  BIDV: { scheme: "bidv://", package: "com.bidv.smartbanking" },
  VietinBank: { scheme: "vietinbank://", package: "com.vietinbank" },
  Agribank: { scheme: "agribank://", package: "com.agribank" },
  MSB: { scheme: "msb://", package: "com.msb" },
  VIB: { scheme: "vib://", package: "com.vib" },
  SHB: { scheme: "shb://", package: "com.shb" },
  HDBank: { scheme: "hdbank://", package: "com.hdbank" },
  OCB: { scheme: "ocb://", package: "com.ocb" },
  "LienVietPostBank": { scheme: "lpb://", package: "com.lpb" },
};

const BANKS = [
  { id: "mbbank", name: "MB Bank", scheme: "mbbank://", color: "#00A651" },
  { id: "vietcombank", name: "Vietcombank", scheme: "vietcombank://", color: "#00703C" },
  { id: "techcombank", name: "Techcombank", scheme: "techcombank://", color: "#F58220" },
  { id: "acb", name: "ACB", scheme: "acbmobile://", color: "#0066B3" },
  { id: "bidv", name: "BIDV", scheme: "bidv://", color: "#E31937" },
  { id: "vietinbank", name: "VietinBank", scheme: "vietinbank://", color: "#ED1C24" },
  { id: "tpbank", name: "TPBank", scheme: "tpbank://", color: "#FFC700" },
  { id: "vpbank", name: "VPBank", scheme: "vpbank://", color: "#003B70" },
  { id: "sacombank", name: "Sacombank", scheme: "sacombank://", color: "#ED1C24" },
  { id: "agribank", name: "Agribank", scheme: "agribank://", color: "#00874A" },
];

const normalizeBankId = (name) => {
  if (!name) return null;
  const lower = name.toLowerCase().replace(/\s+/g, "");
  const match = BANKS.find((b) => lower.includes(b.id) || b.id.includes(lower));
  return match?.id ?? null;
};

const formatCountdown = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const formatPrice = (price) => {
  if (price == null || Number.isNaN(Number(price))) return "—";
  return formatPriceLocale(Number(price));
};

function CopyRow({ label, value, onCopy, copied, mono }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text
          style={[styles.infoValue, mono && styles.infoValueMono]}
          numberOfLines={1}
        >
          {value || "—"}
        </Text>
      </View>
      <Pressable
        onPress={onCopy}
        hitSlop={8}
        style={({ pressed }) => [styles.copyBtn, pressed && styles.copyBtnPressed]}
      >
        <MaterialIconsRounded
          name={copied ? "check" : "content-copy"}
          size={16}
          color={copied ? "#16A34A" : THEME.accent}
        />
        <Text style={[styles.copyText, copied && styles.copyTextDone]}>
          {copied ? "Đã chép" : "Sao chép"}
        </Text>
      </Pressable>
    </View>
  );
}

function BankItem({ bank, isHighlighted, onPress }) {
  const initial = bank.name.charAt(0).toUpperCase();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.bankItem,
        isHighlighted && styles.bankItemHighlighted,
        pressed && styles.bankItemPressed,
      ]}
    >
      <View
        style={[
          styles.bankItemCircle,
          { backgroundColor: bank.color },
          isHighlighted && styles.bankItemCircleHighlighted,
        ]}
      >
        <Text style={styles.bankItemInitial}>{initial}</Text>
      </View>
      <Text
        style={[styles.bankItemName, isHighlighted && styles.bankItemNameHighlighted]}
        numberOfLines={1}
      >
        {bank.name}
      </Text>
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

  const matchedBankId = useMemo(() => normalizeBankId(bankName), [bankName]);

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

  // Bắt đầu polling ngay khi vào màn QR
  useEffect(() => {
    if (!bookingId || isExpired) return;
    startPolling(transactionRef, paymentId, bookingId, {
      intervalMs: QR_POLL_INTERVAL_MS,
      maxPolls: QR_MAX_POLLS,
    });
    return () => stopPolling();
  }, [bookingId, paymentId, transactionRef, isExpired, startPolling, stopPolling]);

  // Đếm ngược
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
      copyTimerRef.current = setTimeout(() => setCopiedKey(null), 1800);
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

  const handleOpenBank = useCallback(async (bank) => {
    try {
      const canOpen = await Linking.canOpenURL(bank.scheme);
      if (canOpen) {
        await Linking.openURL(bank.scheme);
        return;
      }
    } catch {
      // Fall through to alert
    }
    Alert.alert(
      "Chưa cài ứng dụng",
      `Bạn chưa cài app ${bank.name}. Vui lòng tải từ CH Play hoặc App Store.`,
    );
  }, []);

  const handleBack = useCallback(() => {
    stopPolling();
    router.back();
  }, [router, stopPolling]);

  const handleGoBookings = useCallback(() => {
    stopPolling();
    router.replace("/profile/bookings");
  }, [router, stopPolling]);

  const isUrgent = timeLeft <= 120;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
          <MaterialIconsRounded name="arrow-back" size={20} color={THEME.text} />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Thanh toán qua chuyển khoản</Text>
          <Text style={styles.headerSubtitle}>Quét QR hoặc mở app ngân hàng</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isExpired ? (
          <View style={styles.expiredCard}>
            <Text style={styles.expiredTitle}>Đơn hàng đã hết hạn</Text>
            <Text style={styles.expiredText}>
              Đã quá thời hạn thanh toán {PAYMENT_EXPIRY_MINUTES} phút. Nếu bạn đã
              chuyển khoản, số tiền sẽ được hoàn lại. Vui lòng đặt lại đơn mới.
            </Text>
            <Pressable onPress={handleGoBookings} style={styles.expiredBtn}>
              <Text style={styles.expiredBtnText}>Xem đơn của tôi</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.timerPill,
                {
                  backgroundColor: isUrgent ? THEME.dangerBg : THEME.accentBg,
                  borderColor: isUrgent ? THEME.dangerBorder : THEME.accentBorder,
                },
              ]}
            >
              <MaterialIconsRounded
                name="schedule"
                size={16}
                color={isUrgent ? THEME.danger : THEME.accent}
              />
              <Text
                style={[
                  styles.timerText,
                  { color: isUrgent ? THEME.danger : THEME.accent },
                ]}
              >
                Đơn hết hạn sau {formatCountdown(timeLeft)}
              </Text>
            </View>

            <View style={styles.qrCard}>
              {qrUrl ? (
                <Image
                  source={{ uri: qrUrl }}
                  style={styles.qrImage}
                  contentFit="contain"
                  transition={150}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={styles.qrFallback}>
                  <ActivityIndicator size="large" color={THEME.primary} />
                </View>
              )}

              <Pressable
                onPress={handleCopyAmount}
                style={({ pressed }) => [
                  styles.amountWrap,
                  pressed && styles.amountWrapPressed,
                ]}
              >
                <Text style={styles.amountLabel}>Số tiền cần chuyển</Text>
                <Text style={styles.amountValue}>{formatPrice(amount)}</Text>
              </Pressable>

              <View style={styles.waitingRow}>
                <ActivityIndicator size="small" color={THEME.textMuted} />
                <Text style={styles.waitingText}>
                  Đang chờ xác nhận thanh toán...
                </Text>
              </View>
            </View>

            <View style={styles.bankGridSection}>
              <Text style={styles.bankGridTitle}>Hoặc mở app ngân hàng</Text>
              <View style={styles.bankGrid}>
                {BANKS.map((bank) => (
                  <BankItem
                    key={bank.id}
                    bank={bank}
                    isHighlighted={bank.id === matchedBankId}
                    onPress={() => handleOpenBank(bank)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.bankHeaderRow}>
                <View style={styles.bankIcon}>
                  <MaterialIconsRounded
                    name="account-balance"
                    size={18}
                    color={THEME.accent}
                  />
                </View>
                <Text style={styles.bankNameText}>{bankName || "Ngân hàng"}</Text>
              </View>

              <CopyRow
                label="Số tài khoản"
                value={bankAccountNumber}
                onCopy={handleCopyAccount}
                copied={copiedKey === "acc"}
                mono
              />
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Chủ tài khoản</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {bankAccountName || "—"}
                  </Text>
                </View>
              </View>
              <View style={styles.divider} />
              <CopyRow
                label="Nội dung chuyển khoản"
                value={transactionRef}
                onCopy={handleCopyContent}
                copied={copiedKey === "ref"}
                mono
              />
            </View>

            <View style={styles.noteCard}>
              <MaterialIconsRounded
                name="info-outline"
                size={16}
                color={THEME.accent}
              />
              <Text style={styles.noteText}>
                Vui lòng giữ nguyên{" "}
                <Text style={styles.noteStrong}>nội dung chuyển khoản</Text> và
                chuyển <Text style={styles.noteStrong}>đúng số tiền</Text>. Hệ
                thống tự xác nhận sau vài giây và chuyển sang màn hình thành công.
              </Text>
            </View>

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
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: THEME.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  headerTextWrap: { flex: 1 },
  headerTitle: { color: THEME.text, fontSize: 18, fontWeight: "800" },
  headerSubtitle: {
    color: THEME.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  timerPill: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  timerText: {
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  qrCard: {
    marginTop: 16,
    backgroundColor: THEME.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  qrImage: {
    width: 240,
    height: 240,
    borderRadius: 12,
    backgroundColor: THEME.white,
  },
  qrFallback: {
    width: 240,
    height: 240,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.primaryTint,
  },
  amountWrap: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: THEME.primaryTint,
    alignSelf: "stretch",
  },
  amountWrapPressed: { opacity: 0.7 },
  amountLabel: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  amountValue: {
    color: THEME.primary,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  waitingRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  waitingText: {
    color: THEME.textMuted,
    fontSize: 13,
    fontWeight: "500",
  },
  infoCard: {
    marginTop: 16,
    backgroundColor: THEME.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  bankHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  bankIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: THEME.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  bankNameText: { color: THEME.text, fontSize: 15, fontWeight: "700" },
  bankGridSection: {
    marginTop: 16,
    backgroundColor: THEME.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  bankGridTitle: {
    color: THEME.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
  },
  bankGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  bankItem: {
    width: "47.5%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: THEME.primaryTint,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  bankItemHighlighted: {
    borderColor: THEME.accent,
    backgroundColor: THEME.accentBg,
  },
  bankItemPressed: {
    opacity: 0.7,
  },
  bankItemCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  bankItemCircleHighlighted: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  bankItemInitial: {
    color: THEME.white,
    fontSize: 14,
    fontWeight: "800",
  },
  bankItemName: {
    flex: 1,
    color: THEME.text,
    fontSize: 13,
    fontWeight: "600",
  },
  bankItemNameHighlighted: {
    color: THEME.accent,
    fontWeight: "700",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  infoTextWrap: { flex: 1, marginRight: 12 },
  infoLabel: { color: THEME.textMuted, fontSize: 12 },
  infoValue: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  infoValueMono: {
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.border,
    opacity: 0.6,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: THEME.accentBg,
    borderWidth: 1,
    borderColor: THEME.accentBorder,
  },
  copyBtnPressed: { opacity: 0.7 },
  copyText: { color: THEME.accent, fontSize: 12, fontWeight: "700" },
  copyTextDone: { color: "#16A34A" },
  noteCard: {
    marginTop: 16,
    flexDirection: "row",
    gap: 8,
    backgroundColor: THEME.accentBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.accentBorder,
  },
  noteText: {
    flex: 1,
    color: "#1D4ED8",
    fontSize: 12,
    lineHeight: 18,
  },
  noteStrong: { fontWeight: "800" },
  secondaryBtn: {
    marginTop: 16,
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.surface,
  },
  secondaryBtnText: {
    color: THEME.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  expiredCard: {
    marginTop: 16,
    backgroundColor: THEME.dangerBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.dangerBorder,
  },
  expiredTitle: {
    color: THEME.danger,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },
  expiredText: {
    color: "#7F1D1D",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  expiredBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  expiredBtnText: { color: THEME.white, fontSize: 14, fontWeight: "700" },
});
