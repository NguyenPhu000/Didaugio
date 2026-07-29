import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import {
  useApplicableVouchers,
  useValidateVoucherCode,
} from "../hooks/useVoucherQueries";

const formatCurrency = (value, locale = "vi-VN") => {
  if (value == null) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  } catch {
    return `${Number(value || 0).toLocaleString()}đ`;
  }
};

const formatExpiry = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Field cho phép User:
 *   - Nhập mã voucher thủ công (validate qua POST /vouchers/validate)
 *   - Hoặc chọn nhanh từ danh sách voucher khả dụng (GET /vouchers/public)
 *
 * Props:
 *   - serviceId      : number  (bắt buộc)
 *   - businessId     : number  (optional — fallback từ selectedService.place.businessId)
 *   - amount         : number  (tổng tiền trước giảm)
 *   - value          : { voucherId: number|null, code: string, discountAmount: number }
 *   - onChange(value): callback khi áp dụng / bỏ voucher
 *   - theme          : BOOKING_THEME token (đồng bộ style với màn booking)
 */
export function VoucherApplyField({
  serviceId,
  businessId,
  amount,
  value,
  onChange,
  theme,
}) {
  const { t } = useTranslation();
  const [code, setCode] = useState(value?.code || "");
  const [showPicker, setShowPicker] = useState(false);

  const { data: vouchers = [], isLoading: loadingList } = useApplicableVouchers({
    serviceId,
    businessId,
    amount,
  });

  const validateMutation = useValidateVoucherCode();

  useEffect(() => {
    if (value?.code) setCode(value.code);
  }, [value?.code]);

  const handleApplyManual = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    try {
      const res = await validateMutation.mutateAsync({
        code: trimmed,
        serviceId: Number(serviceId),
        originalPrice: Number(amount) || 0,
      });
      const data = res?.data || res;
      onChange?.({
        voucherId: data?.id || data?.voucherId || null,
        code: data?.code || trimmed.toUpperCase(),
        discountAmount: Number(data?.discountAmount) || 0,
        finalPrice:
          data?.finalPrice != null
            ? Number(data.finalPrice)
            : Math.max(0, (Number(amount) || 0) - (Number(data?.discountAmount) || 0)),
      });
    } catch {
      // Error đã được hiển thị bởi UI thông qua mutation.error
    }
  };

  const handlePickVoucher = (voucher) => {
    setCode(voucher.code);
    setShowPicker(false);
    onChange?.({
      voucherId: voucher.id,
      code: voucher.code,
      discountAmount: Number(voucher.discountAmount) || 0,
      finalPrice:
        voucher.finalPrice != null
          ? Number(voucher.finalPrice)
          : Math.max(0, (Number(amount) || 0) - (Number(voucher.discountAmount) || 0)),
    });
  };

  const handleClear = () => {
    setCode("");
    onChange?.({ voucherId: null, code: "", discountAmount: 0, finalPrice: null });
  };

  const applied = Boolean(value?.voucherId);

  const helperText = useMemo(() => {
    if (validateMutation.isPending) return t("booking.voucher.validating");
    if (validateMutation.isError)
      return validateMutation.error?.message || t("booking.voucher.invalid");
    return null;
  }, [validateMutation.isPending, validateMutation.isError, validateMutation.error, t]);

  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
          {t("booking.voucher.title")}
        </Text>
        {applied ? (
          <Pressable
            hitSlop={8}
            onPress={handleClear}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <MaterialIconsRounded
              name="close"
              size={14}
              color={theme.textSecondary}
            />
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
              {t("booking.voucher.remove")}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          borderWidth: 1,
          borderColor: applied ? theme.neon : theme.glassBorder,
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 4,
          backgroundColor: theme.backgroundElevated,
        }}
      >
        <MaterialIconsRounded
          name="local-offer"
          size={18}
          color={applied ? theme.neon : theme.textSecondary}
        />
        <TextInput
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase())}
          placeholder={t("booking.voucher.placeholder")}
          placeholderTextColor={theme.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!applied && !validateMutation.isPending}
          style={{
            flex: 1,
            color: theme.text,
            fontSize: 14,
            fontWeight: "600",
            paddingVertical: 10,
            letterSpacing: 0.5,
          }}
        />
        <Pressable
          onPress={handleApplyManual}
          disabled={applied || !code.trim() || validateMutation.isPending}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor:
              applied || !code.trim() || validateMutation.isPending
                ? theme.surfaceMuted
                : theme.neon,
          }}
        >
          {validateMutation.isPending ? (
            <ActivityIndicator size="small" color={theme.white} />
          ) : (
            <Text
              style={{
                color:
                  applied || !code.trim() ? theme.textSecondary : theme.white,
                fontSize: 12,
                fontWeight: "800",
              }}
            >
              {t("booking.voucher.apply")}
            </Text>
          )}
        </Pressable>
      </View>

      {helperText ? (
        <Text
          style={{
            color: validateMutation.isError ? "#EF4444" : theme.textSecondary,
            fontSize: 12,
          }}
        >
          {helperText}
        </Text>
      ) : null}

      {applied && value?.discountAmount > 0 ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: theme.neon,
            backgroundColor: theme.neonGlow,
          }}
        >
          <Text style={{ color: theme.neon, fontSize: 12, fontWeight: "700" }}>
            {t("booking.voucher.discountLabel", {
              code: value.code,
              amount: formatCurrency(value.discountAmount),
            })}
          </Text>
        </View>
      ) : null}

      {!applied && vouchers.length > 0 ? (
        <>
          <Pressable
            onPress={() => setShowPicker((prev) => !prev)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              alignSelf: "flex-start",
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: theme.glassBorder,
              backgroundColor: theme.glass,
            }}
          >
            <MaterialIconsRounded
              name="confirmation-number"
              size={14}
              color={theme.textSecondary}
            />
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              {showPicker
                ? t("booking.voucher.hideList")
                : t("booking.voucher.showList", { count: vouchers.length })}
            </Text>
          </Pressable>

          {showPicker ? (
            <View style={{ gap: 8 }}>
              {loadingList ? (
                <ActivityIndicator size="small" color={theme.neon} />
              ) : (
                vouchers.map((voucher) => {
                  const isPercent = String(voucher.discountType).toLowerCase() === "percent";
                  return (
                    <Pressable
                      key={voucher.id}
                      onPress={() => handlePickVoucher(voucher)}
                      style={{
                        borderWidth: 1,
                        borderColor: theme.glassBorder,
                        borderRadius: 12,
                        padding: 12,
                        backgroundColor: theme.glass,
                        gap: 6,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: theme.text,
                            fontSize: 13,
                            fontWeight: "800",
                            letterSpacing: 0.5,
                          }}
                        >
                          {voucher.code}
                        </Text>
                        <Text
                          style={{
                            color: theme.neon,
                            fontSize: 13,
                            fontWeight: "800",
                          }}
                        >
                          {isPercent
                            ? `-${voucher.discountValue}%`
                            : `-${formatCurrency(voucher.discountValue)}`}
                          {voucher.maxDiscount
                            ? ` ${t("booking.voucher.upTo", {
                                amount: formatCurrency(voucher.maxDiscount),
                              })}`
                            : ""}
                        </Text>
                      </View>

                      {voucher.description ? (
                        <Text
                          style={{
                            color: theme.textSecondary,
                            fontSize: 12,
                          }}
                          numberOfLines={2}
                        >
                          {voucher.description}
                        </Text>
                      ) : null}

                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        {voucher.minOrderValue > 0 ? (
                          <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                            {t("booking.voucher.minOrder", {
                              amount: formatCurrency(voucher.minOrderValue),
                            })}
                          </Text>
                        ) : (
                          <View />
                        )}
                        {voucher.endDate ? (
                          <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                            {t("booking.voucher.expires", {
                              date: formatExpiry(voucher.endDate),
                            })}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

export default VoucherApplyField;
