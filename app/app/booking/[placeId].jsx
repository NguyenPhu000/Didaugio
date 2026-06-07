import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useAuthStore } from "../../src/stores/authStore";
import i18n from "@/i18n";
import {
  usePlaceServices,
  useCreateBooking,
} from "../../src/modules/booking/hooks/useBooking";
import { useServiceAvailability } from "../../src/modules/booking/hooks/useServiceAvailability";
import { usePlaceDetail } from "../../src/modules/place/hooks/usePlaceDetail";
import { BOOKING_APPLE_THEME as APPLE_THEME } from "../../src/constants/design-tokens";
import {
  useCreateTrip,
  useTrips,
} from "../../src/modules/trips/hooks/useTrips";
import { StepIndicator } from "../../src/modules/booking/components/StepIndicator";
import { ServiceCard } from "../../src/modules/booking/components/ServiceCard";
import { useTranslation } from "react-i18next";

const buildTimeSlots = ({
  startHour = 6,
  endHour = 22,
  minuteStep = 30,
} = {}) => {
  const totalMinutes = (endHour - startHour) * 60;
  const steps = Math.floor(totalMinutes / minuteStep);

  return Array.from({ length: steps }).map((_, index) => {
    const minutesFromStart = index * minuteStep;
    const hour = startHour + Math.floor(minutesFromStart / 60);
    const minute = minutesFromStart % 60;
    const label = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    return { value: label, label };
  });
};

const TIME_SLOTS = buildTimeSlots();

const TIME_GROUP_KEYS = ["morning", "afternoon", "evening", "all"];

const resolveTimeGroup = (timeValue) => {
  const [hourStr] = String(timeValue || "").split(":");
  const hour = Number(hourStr);

  if (!Number.isFinite(hour)) return "morning";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
};

const isSlotWithinGroup = (slotValue, groupKey) => {
  if (groupKey === "all") return true;

  const [hourStr] = String(slotValue || "").split(":");
  const hour = Number(hourStr);
  if (!Number.isFinite(hour)) return false;

  if (groupKey === "morning") return hour < 12;
  if (groupKey === "afternoon") return hour >= 12 && hour < 18;
  return hour >= 18;
};

const formatDateYmd = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeMonthStart = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  normalized.setDate(1);
  return normalized;
};

const addMonths = (date, delta) => {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + delta);
  next.setHours(0, 0, 0, 0);
  return next;
};

const buildCalendarDays = (monthDate) => {
  const monthStart = normalizeMonthStart(monthDate);
  const month = monthStart.getMonth();
  const firstWeekdayOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - firstWeekdayOffset);

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      value: formatDateYmd(date),
      day: date.getDate(),
      date,
      isCurrentMonth: date.getMonth() === month,
    };
  });
};

const getLocale = () => i18n.language === "vi" ? "vi-VN" : "en-US";

const formatMonthYearLabel = (monthDate) =>
  monthDate.toLocaleDateString(getLocale(), {
    month: "long",
    year: "numeric",
  });

const formatBookingDateTime = (dateYmd, timeValue, notSelectedLabel) => {
  if (!dateYmd) return notSelectedLabel || "—";
  const dateObj = new Date(`${dateYmd}T00:00:00`);
  const dateLabel = Number.isNaN(dateObj.getTime())
    ? dateYmd
    : dateObj.toLocaleDateString(getLocale(), {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

  return `${dateLabel} • ${timeValue || "--:--"}`;
};

const formatPrice = (price, contactLabel) => {
  if (!price && price !== 0) return contactLabel || "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const BOOKING_THEME = {
  ...APPLE_THEME,
  background: APPLE_THEME.background,
  backgroundElevated: APPLE_THEME.surface,
  glass: APPLE_THEME.surface,
  glassBorder: APPLE_THEME.border,
  glassBorderStrong: APPLE_THEME.borderSoft,
  neon: APPLE_THEME.primary,
  neonAccent: APPLE_THEME.primaryPressed,
  neonGlow: APPLE_THEME.primaryTint,
  text: APPLE_THEME.text,
  textSecondary: APPLE_THEME.textSecondary,
  textMuted: APPLE_THEME.textMuted,
  white: APPLE_THEME.white,
  focusBlue: APPLE_THEME.focusBlue,
};



export default function BookingScreen() {
  const { t } = useTranslation();
  const { placeId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);
  const currentUser = useAuthStore((s) => s.user);
  const isLoggedIn = Boolean(accessToken) && !isGuest;

  const STEP_LABELS = [t("booking.steps.service"), t("booking.steps.confirm"), t("booking.steps.submit")];
  const WEEKDAY_LABELS = [t("common.weekdays.mon"), t("common.weekdays.tue"), t("common.weekdays.wed"), t("common.weekdays.thu"), t("common.weekdays.fri"), t("common.weekdays.sat"), t("common.weekdays.sun")];
  const TIME_GROUPS = TIME_GROUP_KEYS.map((key) => ({ key, label: t(`booking.timeGroups.${key}`) }));

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedDate, setSelectedDate] = useState(() =>
    formatDateYmd(new Date()),
  );
  const [calendarMonth, setCalendarMonth] = useState(() =>
    normalizeMonthStart(new Date()),
  );
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [activeTimeGroup, setActiveTimeGroup] = useState(() =>
    resolveTimeGroup("09:00"),
  );
  const [tripLinkMode, setTripLinkMode] = useState("none");
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [newTripTitle, setNewTripTitle] = useState("");
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [bookingDone, setBookingDone] = useState(false);
  const [linkedTripSummary, setLinkedTripSummary] = useState(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const didPrefillContactRef = useRef(false);

  const { data: place } = usePlaceDetail(placeId);
  const { data: services = [], isLoading: servicesLoading } =
    usePlaceServices(placeId);
  const { data: trips = [] } = useTrips(isLoggedIn);
  const bookingMutation = useCreateBooking();
  const createTripMutation = useCreateTrip();

  const { data: availabilityData } = useServiceAvailability(
    selectedService?.id,
    selectedDate,
  );

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (didPrefillContactRef.current || !currentUser) return;

    const profile = currentUser.profile || {};
    setGuestName(profile.fullName || currentUser.fullName || "");
    setGuestPhone(profile.phone || currentUser.phone || "");
    setGuestEmail(currentUser.email || "");
    didPrefillContactRef.current = true;
  }, [currentUser]);

  const calendarDays = useMemo(
    () => buildCalendarDays(calendarMonth),
    [calendarMonth],
  );
  const calendarMonthLabel = useMemo(
    () => formatMonthYearLabel(calendarMonth),
    [calendarMonth],
  );
  const visibleTimeSlots = useMemo(
    () =>
      TIME_SLOTS.filter((slot) =>
        isSlotWithinGroup(slot.value, activeTimeGroup),
      ),
    [activeTimeGroup],
  );
  const canMovePrevMonth = useMemo(() => {
    const currentMonth = normalizeMonthStart(new Date(nowTs));
    return calendarMonth.getTime() > currentMonth.getTime();
  }, [calendarMonth, nowTs]);

  const isDateSelectable = (date) => {
    const candidate = new Date(date);
    candidate.setHours(0, 0, 0, 0);
    const today = new Date(nowTs);
    today.setHours(0, 0, 0, 0);
    return candidate.getTime() >= today.getTime();
  };

  const isSlotAvailable = (dateValue, timeValue) => {
    const slot = new Date(`${dateValue}T${timeValue}:00`);
    if (Number.isNaN(slot.getTime())) return false;
    if (slot.getTime() <= nowTs + 5 * 60 * 1000) return false;

    if (availabilityData?.bookingModel === "capacity" && availabilityData?.slots) {
      const slotData = availabilityData.slots.find(
        (s) => s.time?.startsWith(`${dateValue}T${timeValue}`) || s.time?.includes(`T${timeValue}:`),
      );
      if (slotData && !slotData.available) return false;
    }

    if (availabilityData?.bookingModel === "resource" && availabilityData?.bookedSlots?.length > 0) {
      const slotStart = new Date(`${dateValue}T${timeValue}:00`);
      const slotDurationMs = (selectedService?.slotDurationMinutes || 60) * 60_000;
      const slotEnd = new Date(slotStart.getTime() + slotDurationMs);

      const isBooked = availabilityData.bookedSlots.some((booked) => {
        const bookedStart = new Date(booked.startTime);
        const bookedEnd = new Date(booked.endTime);
        return bookedStart < slotEnd && bookedEnd > slotStart;
      });
      if (isBooked) return false;
    }

    return true;
  };

  const createdTripDefaultTitle = useMemo(() => {
    const placeLabel = place?.name ? ` - ${place.name}` : "";
    return `${t("booking.title")} ${selectedDate}${placeLabel}`;
  }, [place?.name, selectedDate, t]);

  useEffect(() => {
    if (isSlotAvailable(selectedDate, selectedTime)) return;
    const next = TIME_SLOTS.find((slot) =>
      isSlotAvailable(selectedDate, slot.value),
    );
    if (next) {
      setSelectedTime(next.value);
      setActiveTimeGroup(resolveTimeGroup(next.value));
    }
  }, [selectedDate, selectedTime, nowTs]);

  useEffect(() => {
    if (tripLinkMode !== "create") return;
    if (newTripTitle.trim()) return;
    setNewTripTitle(createdTripDefaultTitle);
  }, [tripLinkMode, newTripTitle, createdTripDefaultTitle]);

  const unitPrice =
    selectedService?.salePrice ?? selectedService?.price ?? null;
  const totalPrice = unitPrice !== null ? unitPrice * quantity : null;
  const isSelectedTimeAvailable = isSlotAvailable(selectedDate, selectedTime);
  const slotWarningRef = useRef("");

  useEffect(() => {
    if (step < 2) return;

    if (isSelectedTimeAvailable) {
      slotWarningRef.current = "";
      return;
    }

    const warningKey = `${selectedDate}-${selectedTime}`;
    if (slotWarningRef.current === warningKey) return;
    slotWarningRef.current = warningKey;

    Alert.alert(
      t("booking.alerts.slotUnavailable.title"),
      t("booking.alerts.slotUnavailable.message"),
      [{ text: t("booking.alerts.slotUnavailable.ok") }],
    );
  }, [step, isSelectedTimeAvailable, selectedDate, selectedTime]);

  const depositInfo = useMemo(() => {
    if (!selectedService?.requireDeposit || totalPrice == null) return null;

    const type =
      selectedService.depositType === "PERCENT" ? "PERCENT" : "FIXED";
    const rawAmount = Number(selectedService.depositAmount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) return null;

    const amount =
      type === "PERCENT"
        ? Math.round((totalPrice * rawAmount) / 100)
        : Math.round(rawAmount);
    const refundPercent = Number(selectedService.depositRefundPercent);

    return {
      type,
      rateOrAmount: rawAmount,
      amount,
      refundable: selectedService.depositRefundable !== false,
      refundPercent:
        Number.isFinite(refundPercent) && refundPercent >= 0
          ? Math.min(refundPercent, 100)
          : 50,
    };
  }, [selectedService, totalPrice]);

  const canProceedFromStep2 =
    !!selectedTime &&
    isSelectedTimeAvailable &&
    (tripLinkMode !== "existing" || !!selectedTripId);
  const normalizedGuestName = guestName.trim();
  const normalizedGuestPhone = guestPhone.trim();
  const normalizedGuestEmail = guestEmail.trim();
  const normalizedRequestNote = requestNote.trim();
  const hasValidContact =
    normalizedGuestName.length >= 2 &&
    normalizedGuestPhone.replace(/\D/g, "").length >= 8 &&
    (!normalizedGuestEmail || /\S+@\S+\.\S+/.test(normalizedGuestEmail));
  const isSubmittingBooking =
    bookingMutation.isPending || createTripMutation.isPending;

  if (!isLoggedIn) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: BOOKING_THEME.background,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 28,
          paddingTop: insets.top,
          gap: 16,
        }}
      >
        <View
          style={{
            width: 92,
            height: 92,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: BOOKING_THEME.neonGlow,
            borderWidth: 1,
            borderColor: BOOKING_THEME.glassBorderStrong,
          }}
        >
          <MaterialIconsRounded
            name="lock-outline"
            size={44}
            color={BOOKING_THEME.neon}
          />
        </View>

        <Text
          style={{
            color: BOOKING_THEME.text,
            fontSize: 24,
            fontWeight: "800",
            textAlign: "center",
          }}
        >
          {t("booking.loginRequired")}
        </Text>
        <Text
          style={{
            color: BOOKING_THEME.textSecondary,
            fontSize: 14,
            textAlign: "center",
            lineHeight: 22,
            maxWidth: 320,
          }}
        >
          {t("booking.loginDescription")}
        </Text>

        <Pressable
          onPress={() => router.replace("/(auth)/login")}
          style={{
            marginTop: 6,
            backgroundColor: BOOKING_THEME.neon,
            borderRadius: 20,
            paddingHorizontal: 28,
            paddingVertical: 13,
          }}
        >
          <Text
            style={{
              color: BOOKING_THEME.white,
              fontSize: 14,
              fontWeight: "800",
            }}
          >
            {t("booking.loginNow")}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={{
            borderRadius: 20,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: BOOKING_THEME.glassBorder,
            backgroundColor: BOOKING_THEME.glass,
          }}
        >
          <Text
            style={{
              color: BOOKING_THEME.text,
              fontSize: 13,
              fontWeight: "700",
            }}
          >
            {t("common.back")}
          </Text>
        </Pressable>
      </View>
    );
  }

  const handleConfirmBooking = async () => {
    if (!hasValidContact) {
      Alert.alert(
        t("booking.alerts.missingContact.title"),
        t("booking.alerts.missingContact.message"),
      );
      return;
    }

    if (!isSelectedTimeAvailable) {
      Alert.alert(
        t("booking.alerts.slotUnavailable.title"),
        t("booking.alerts.slotUnavailable.expired"),
      );
      setStep(2);
      return;
    }

    if (tripLinkMode === "existing" && !selectedTripId) {
      Alert.alert(t("booking.alerts.selectTrip.title"), t("booking.alerts.selectTrip.message"));
      setStep(2);
      return;
    }

    try {
      let tripIdPayload = null;

      if (tripLinkMode === "existing") {
        tripIdPayload = Number(selectedTripId);
      }

      if (tripLinkMode === "create") {
        const title = (newTripTitle || "").trim() || createdTripDefaultTitle;
        const createdTripRes = await createTripMutation.mutateAsync({
          title,
          description: selectedService?.name
            ? t("booking.tripDescription.withService", { service: selectedService.name })
            : t("booking.tripDescription.default"),
          startDate: selectedDate,
          endDate: selectedDate,
          totalDays: 1,
          groupSize: 1,
        });

        tripIdPayload = Number(createdTripRes?.data?.id || createdTripRes?.id);

        if (!Number.isInteger(tripIdPayload) || tripIdPayload <= 0) {
          throw {
            message: t("booking.errors.tripCreateFailed"),
            status: 500,
            code: "TRIP_CREATE_FAILED",
          };
        }
      }

      const bookingRes = await bookingMutation.mutateAsync({
        placeId: parseInt(placeId),
        serviceId: selectedService?.id,
        tripId: tripIdPayload || undefined,
        quantity,
        useDate: selectedDate,
        useTime: selectedTime,
        guestName: normalizedGuestName,
        guestPhone: normalizedGuestPhone,
        guestEmail: normalizedGuestEmail || undefined,
        note: normalizedRequestNote || null,
      });

      const linkedTrip = bookingRes?.data?.linkedTrip || null;
      if (linkedTrip) {
        setLinkedTripSummary(linkedTrip);
      } else {
        setLinkedTripSummary(null);
      }

      setBookingDone(true);
    } catch (error) {
      Alert.alert(
        t("booking.errors.bookingFailed"),
        error?.message || t("booking.errors.generic"),
      );
    }
  };

  if (bookingDone) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: BOOKING_THEME.background,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 40,
          paddingTop: insets.top,
          gap: 24,
        }}
      >
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 30,
            backgroundColor: BOOKING_THEME.neonGlow,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: BOOKING_THEME.neon,
            shadowColor: BOOKING_THEME.neon,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.4,
            shadowRadius: 24,
            elevation: 16,
          }}
        >
          <MaterialIconsRounded
            name="check-circle"
            size={52}
            color={BOOKING_THEME.neon}
          />
        </View>
        <Text
          style={{
            color: BOOKING_THEME.text,
            fontSize: 26,
            fontWeight: "800",
            textAlign: "center",
          }}
        >
          {t("booking.success.title")}
        </Text>
        <Text
          style={{
            color: BOOKING_THEME.textSecondary,
            fontSize: 14,
            textAlign: "center",
            lineHeight: 22,
          }}
        >
          {selectedService?.name
            ? t("booking.success.descriptionWithService", { service: selectedService.name })
            : t("booking.success.description")}
        </Text>

        {linkedTripSummary ? (
          <Text
            style={{
              color: BOOKING_THEME.neon,
              fontSize: 12,
              textAlign: "center",
              lineHeight: 18,
            }}
          >
            {t("booking.success.linkedTrip", { title: linkedTripSummary.title || `#${linkedTripSummary.id}`, day: linkedTripSummary.dayNumber || 1 })}
          </Text>
        ) : null}

        {linkedTripSummary?.id ? (
          <Pressable
            onPress={() => router.replace(`/trip/${linkedTripSummary.id}`)}
            style={{
              borderRadius: 20,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: BOOKING_THEME.neon,
              backgroundColor: BOOKING_THEME.neonGlow,
            }}
          >
            <Text
              style={{
                color: BOOKING_THEME.neon,
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              {t("booking.success.viewInTrip")}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => router.replace("/profile/bookings")}
          style={{
            backgroundColor: BOOKING_THEME.neon,
            borderRadius: 20,
            paddingHorizontal: 32,
            paddingVertical: 14,
            shadowColor: BOOKING_THEME.neon,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 20,
            elevation: 12,
          }}
        >
          <Text
            style={{
              color: BOOKING_THEME.white,
              fontSize: 15,
              fontWeight: "800",
            }}
          >
            {t("booking.success.viewBookings")}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={{
            borderRadius: 20,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: BOOKING_THEME.glassBorder,
            backgroundColor: BOOKING_THEME.glass,
          }}
        >
          <Text
            style={{
              color: BOOKING_THEME.text,
              fontSize: 13,
              fontWeight: "700",
            }}
          >
            {t("booking.success.backToPlace")}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: BOOKING_THEME.background,
        paddingTop: insets.top,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => (step > 1 ? setStep(step - 1) : router.back())}
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            backgroundColor: BOOKING_THEME.glass,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: BOOKING_THEME.glassBorder,
          }}
        >
          <MaterialIconsRounded
            name="arrow-back"
            size={20}
            color={BOOKING_THEME.text}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: BOOKING_THEME.text,
              fontSize: 18,
              fontWeight: "800",
            }}
          >
            {t("booking.title")}
          </Text>
          {place?.name ? (
            <Text
              style={{
                color: BOOKING_THEME.textSecondary,
                fontSize: 12,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {place.name}
            </Text>
          ) : null}
        </View>
      </View>

      <StepIndicator currentStep={step} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 ? (
          <>
            <Text
              style={{
                color: BOOKING_THEME.textSecondary,
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {t("booking.selectService")}
            </Text>

            {servicesLoading ? (
              <ActivityIndicator
                size="large"
                color={BOOKING_THEME.neon}
                style={{ marginTop: 32 }}
              />
            ) : services.length === 0 ? (
              <View
                style={{
                  alignItems: "center",
                  paddingVertical: 40,
                  gap: 16,
                  backgroundColor: BOOKING_THEME.glass,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: BOOKING_THEME.glassBorder,
                }}
              >
                <MaterialIconsRounded
                  name="room-service"
                  size={48}
                  color={BOOKING_THEME.textMuted}
                />
                <Text
                  style={{
                    color: BOOKING_THEME.textSecondary,
                    textAlign: "center",
                    fontSize: 14,
                  }}
                >
                  {t("booking.noServices")}
                </Text>
              </View>
            ) : (
              services.map((svc) => (
                <ServiceCard
                  key={svc.id}
                  service={svc}
                  isSelected={selectedService?.id === svc.id}
                  onSelect={setSelectedService}
                />
              ))
            )}
          </>
        ) : step === 2 ? (
          <>
            <Text
              style={{
                color: BOOKING_THEME.textSecondary,
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {t("booking.confirmTitle")}
            </Text>

            <View
              style={{
                backgroundColor: BOOKING_THEME.glass,
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: BOOKING_THEME.glassBorder,
                gap: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{ color: BOOKING_THEME.textSecondary, fontSize: 13 }}
                >
                  {t("booking.fields.place")}
                </Text>
                <Text
                  style={{
                    color: BOOKING_THEME.text,
                    fontSize: 13,
                    fontWeight: "600",
                    maxWidth: "55%",
                    textAlign: "right",
                  }}
                >
                  {place?.name || "—"}
                </Text>
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: BOOKING_THEME.glassBorder,
                }}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{ color: BOOKING_THEME.textSecondary, fontSize: 13 }}
                >
                  {t("booking.fields.service")}
                </Text>
                <Text
                  style={{
                    color: BOOKING_THEME.text,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  {selectedService?.name || "—"}
                </Text>
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: BOOKING_THEME.glassBorder,
                }}
              />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{ color: BOOKING_THEME.textSecondary, fontSize: 13 }}
                >
                  {t("booking.fields.quantity")}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <Pressable
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: BOOKING_THEME.glass,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: BOOKING_THEME.glassBorder,
                    }}
                  >
                    <MaterialIconsRounded
                      name="remove"
                      size={16}
                      color={BOOKING_THEME.text}
                    />
                  </Pressable>
                  <Text
                    style={{
                      color: BOOKING_THEME.text,
                      fontSize: 16,
                      fontWeight: "700",
                      minWidth: 24,
                      textAlign: "center",
                    }}
                  >
                    {quantity}
                  </Text>
                  <Pressable
                    onPress={() => setQuantity(quantity + 1)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: BOOKING_THEME.glass,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: BOOKING_THEME.glassBorder,
                    }}
                  >
                    <MaterialIconsRounded
                      name="add"
                      size={16}
                      color={BOOKING_THEME.text}
                    />
                  </Pressable>
                </View>
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: BOOKING_THEME.glassBorder,
                }}
              />

              <View style={{ gap: 10 }}>
                <Text
                  style={{ color: BOOKING_THEME.textSecondary, fontSize: 13 }}
                >
                  {t("booking.fields.usageDate")}
                </Text>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: BOOKING_THEME.glassBorder,
                    borderRadius: 16,
                    backgroundColor: BOOKING_THEME.backgroundElevated,
                    padding: 12,
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        if (!canMovePrevMonth) return;
                        setCalendarMonth((prev) => addMonths(prev, -1));
                      }}
                      disabled={!canMovePrevMonth}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: BOOKING_THEME.glassBorder,
                        backgroundColor: BOOKING_THEME.glass,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: canMovePrevMonth ? 1 : 0.35,
                      }}
                    >
                      <MaterialIconsRounded
                        name="chevron-left"
                        size={18}
                        color={BOOKING_THEME.text}
                      />
                    </Pressable>

                    <Text
                      style={{
                        color: BOOKING_THEME.text,
                        fontSize: 14,
                        fontWeight: "700",
                        textTransform: "capitalize",
                      }}
                    >
                      {calendarMonthLabel}
                    </Text>

                    <Pressable
                      onPress={() =>
                        setCalendarMonth((prev) => addMonths(prev, 1))
                      }
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: BOOKING_THEME.glassBorder,
                        backgroundColor: BOOKING_THEME.glass,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialIconsRounded
                        name="chevron-right"
                        size={18}
                        color={BOOKING_THEME.text}
                      />
                    </Pressable>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    {WEEKDAY_LABELS.map((label) => (
                      <Text
                        key={label}
                        style={{
                          width: "14.285%",
                          textAlign: "center",
                          color: BOOKING_THEME.textMuted,
                          fontSize: 11,
                          fontWeight: "600",
                        }}
                      >
                        {label}
                      </Text>
                    ))}
                  </View>

                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {calendarDays.map((dayItem) => {
                      const isSelected = dayItem.value === selectedDate;
                      const selectable = isDateSelectable(dayItem.date);

                      return (
                        <View
                          key={dayItem.value}
                          style={{ width: "14.285%", padding: 2 }}
                        >
                          <Pressable
                            disabled={!selectable}
                            onPress={() => {
                              setSelectedDate(dayItem.value);
                              setCalendarMonth(
                                normalizeMonthStart(dayItem.date),
                              );
                            }}
                            style={{
                              height: 34,
                              borderRadius: 10,
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: isSelected
                                ? BOOKING_THEME.neon
                                : BOOKING_THEME.glass,
                              borderWidth: 1,
                              borderColor: isSelected
                                ? BOOKING_THEME.neon
                                : BOOKING_THEME.glassBorder,
                              opacity: selectable ? 1 : 0.35,
                            }}
                          >
                            <Text
                              style={{
                                color: isSelected
                                  ? BOOKING_THEME.white
                                  : dayItem.isCurrentMonth
                                    ? BOOKING_THEME.text
                                    : BOOKING_THEME.textMuted,
                                fontSize: 12,
                                fontWeight: isSelected ? "700" : "500",
                              }}
                            >
                              {dayItem.day}
                            </Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                </View>

                <Text style={{ color: BOOKING_THEME.textMuted, fontSize: 12 }}>
                  {t("booking.fields.selected")}: {formatBookingDateTime(selectedDate, selectedTime, t("booking.fields.notSelected"))}
                </Text>
              </View>

              <View style={{ gap: 10 }}>
                <Text
                  style={{ color: BOOKING_THEME.textSecondary, fontSize: 13 }}
                >
                  {t("booking.fields.selectTime")}
                </Text>

                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {TIME_GROUPS.map((group) => {
                    const isActive = activeTimeGroup === group.key;

                    return (
                      <Pressable
                        key={group.key}
                        onPress={() => {
                          setActiveTimeGroup(group.key);

                          if (isSlotWithinGroup(selectedTime, group.key))
                            return;

                          const fallbackSlot = TIME_SLOTS.find(
                            (slot) =>
                              isSlotWithinGroup(slot.value, group.key) &&
                              isSlotAvailable(selectedDate, slot.value),
                          );

                          if (fallbackSlot) {
                            setSelectedTime(fallbackSlot.value);
                          }
                        }}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: isActive
                            ? BOOKING_THEME.neon
                            : BOOKING_THEME.glassBorder,
                          backgroundColor: isActive
                            ? BOOKING_THEME.neonGlow
                            : BOOKING_THEME.glass,
                        }}
                      >
                        <Text
                          style={{
                            color: isActive
                              ? BOOKING_THEME.neon
                              : BOOKING_THEME.textSecondary,
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          {group.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View
                  style={{
                    borderWidth: 1,
                    borderColor: BOOKING_THEME.glassBorder,
                    borderRadius: 12,
                    backgroundColor: BOOKING_THEME.backgroundElevated,
                    paddingVertical: 8,
                  }}
                >
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingHorizontal: 8 }}
                  >
                    {visibleTimeSlots.map((slot) => {
                      const available = isSlotAvailable(
                        selectedDate,
                        slot.value,
                      );
                      const isSelected = selectedTime === slot.value;

                      let remaining = null;
                      if (availabilityData?.bookingModel === "capacity" && availabilityData?.slots) {
                        const slotData = availabilityData.slots.find(
                          (s) => s.time?.startsWith(`${selectedDate}T${slot.value}`) || s.time?.includes(`T${slot.value}:`),
                        );
                        if (slotData) {
                          remaining = slotData.remaining;
                        }
                      }

                      return (
                        <Pressable
                          key={slot.value}
                          disabled={!available}
                          onPress={() => {
                            setSelectedTime(slot.value);
                            setActiveTimeGroup(resolveTimeGroup(slot.value));
                          }}
                          style={{
                            minWidth: 64,
                            paddingHorizontal: 11,
                            paddingVertical: 8,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: isSelected
                              ? BOOKING_THEME.neon
                              : BOOKING_THEME.glassBorder,
                            backgroundColor: !available
                              ? "rgba(0,0,0,0.06)"
                              : isSelected
                                ? BOOKING_THEME.neonGlow
                                : BOOKING_THEME.glass,
                            opacity: available ? 1 : 0.45,
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: isSelected
                                ? BOOKING_THEME.neon
                                : BOOKING_THEME.text,
                              fontSize: 12,
                              fontWeight: "700",
                            }}
                          >
                            {slot.label}
                          </Text>
                          {remaining !== null ? (
                            <Text
                              style={{
                                color: remaining > 0
                                  ? "#22C55E"
                                  : "#EF4444",
                                fontSize: 10,
                                fontWeight: "600",
                              }}
                            >
                              {remaining > 0 ? `${remaining}` : "Full"}
                            </Text>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                <Text style={{ color: BOOKING_THEME.textMuted, fontSize: 11 }}>
                  {t("booking.timeSlotsCount", { count: visibleTimeSlots.length })}
                </Text>

                {!isSelectedTimeAvailable ? (
                  <Text style={{ color: "#F59E0B", fontSize: 12 }}>
                    {t("booking.slotUnavailableWarning")}
                  </Text>
                ) : null}
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: BOOKING_THEME.glassBorder,
                }}
              />

              <View style={{ gap: 10 }}>
                <Text
                  style={{ color: BOOKING_THEME.textSecondary, fontSize: 13 }}
                >
                  {t("booking.tripLink.title")}
                </Text>

                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {[
                    { key: "none", label: t("booking.tripLink.none") },
                    { key: "existing", label: t("booking.tripLink.selectExisting") },
                    { key: "create", label: t("booking.tripLink.createNew") },
                  ].map((item) => {
                    const selected = tripLinkMode === item.key;
                    return (
                      <Pressable
                        key={item.key}
                        onPress={() => {
                          setTripLinkMode(item.key);
                          if (item.key !== "existing") {
                            setSelectedTripId(null);
                          }
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: selected
                            ? BOOKING_THEME.neon
                            : BOOKING_THEME.glassBorder,
                          backgroundColor: selected
                            ? BOOKING_THEME.neonGlow
                            : BOOKING_THEME.glass,
                        }}
                      >
                        <Text
                          style={{
                            color: selected
                              ? BOOKING_THEME.neon
                              : BOOKING_THEME.text,
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {tripLinkMode === "existing" ? (
                  trips.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8 }}
                    >
                      {trips.map((trip) => {
                        const selected =
                          Number(selectedTripId) === Number(trip.id);
                        return (
                          <Pressable
                            key={trip.id}
                            onPress={() => setSelectedTripId(trip.id)}
                            style={{
                              minWidth: 170,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: selected
                                ? BOOKING_THEME.neon
                                : BOOKING_THEME.glassBorder,
                              backgroundColor: selected
                                ? BOOKING_THEME.neonGlow
                                : BOOKING_THEME.glass,
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                            }}
                          >
                            <Text
                              style={{
                                color: selected
                                  ? BOOKING_THEME.neon
                                  : BOOKING_THEME.text,
                                fontSize: 12,
                                fontWeight: "700",
                              }}
                              numberOfLines={1}
                            >
                              {trip.title || `Trip #${trip.id}`}
                            </Text>
                            <Text
                              style={{
                                marginTop: 2,
                                color: BOOKING_THEME.textSecondary,
                                fontSize: 11,
                              }}
                            >
                              {t("booking.tripDays", { count: trip.totalDays || 1 })}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  ) : (
                    <Text
                      style={{
                        color: BOOKING_THEME.textSecondary,
                        fontSize: 12,
                      }}
                    >
                      {t("booking.tripLink.noTrips")}
                    </Text>
                  )
                ) : null}

                {tripLinkMode === "create" ? (
                  <View style={{ gap: 8 }}>
                    <TextInput
                      value={newTripTitle}
                      onChangeText={setNewTripTitle}
                      placeholder={t("booking.tripLink.newTripPlaceholder")}
                      placeholderTextColor={BOOKING_THEME.textMuted}
                      style={{
                        borderWidth: 1,
                        borderColor: BOOKING_THEME.glassBorder,
                        backgroundColor: BOOKING_THEME.glass,
                        borderRadius: 12,
                        color: BOOKING_THEME.text,
                        fontSize: 13,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                      }}
                    />
                    <Text
                      style={{
                        color: BOOKING_THEME.textSecondary,
                        fontSize: 12,
                      }}
                    >
                      {t("booking.tripLink.tripCreateInfo", { date: selectedDate })}
                    </Text>
                  </View>
                ) : null}
              </View>

              {totalPrice !== null ? (
                <>
                  <View
                    style={{
                      height: 1,
                      backgroundColor: BOOKING_THEME.glassBorder,
                    }}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{
                        color: BOOKING_THEME.textSecondary,
                        fontSize: 13,
                      }}
                    >
                      {t("booking.pricing.total")}
                    </Text>
                    <Text
                      style={{
                        color: BOOKING_THEME.neon,
                        fontSize: 16,
                        fontWeight: "800",
                      }}
                    >
                      {formatPrice(totalPrice, t("booking.pricing.contact"))}
                    </Text>
                  </View>

                  {depositInfo ? (
                    <>
                      <View
                        style={{
                          height: 1,
                          backgroundColor: BOOKING_THEME.glassBorder,
                        }}
                      />
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          style={{
                            color: BOOKING_THEME.textSecondary,
                            fontSize: 13,
                          }}
                        >
                          {t("booking.pricing.deposit")}
                        </Text>
                        <Text
                          style={{
                            color: BOOKING_THEME.text,
                            fontSize: 14,
                            fontWeight: "700",
                          }}
                        >
                          {formatPrice(depositInfo.amount, t("booking.pricing.contact"))}
                        </Text>
                      </View>
                    </>
                  ) : null}
                </>
              ) : null}
            </View>
          </>
        ) : (
          <>
            <Text
              style={{
                color: BOOKING_THEME.textSecondary,
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {t("booking.submitRequest")}
            </Text>

            <View
              style={{
                backgroundColor: BOOKING_THEME.glass,
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: BOOKING_THEME.glassBorder,
                alignItems: "center",
                gap: 12,
              }}
            >
              <MaterialIconsRounded
                name="fact-check"
                size={40}
                color={BOOKING_THEME.neon}
              />
              <Text
                style={{
                  color: BOOKING_THEME.text,
                  fontSize: 16,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                {t("booking.payAtPlace")}
              </Text>
              <Text
                style={{
                  color: BOOKING_THEME.textSecondary,
                  fontSize: 13,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                {t("booking.payAtPlaceDescription")}
              </Text>

              <View style={{ width: "100%", gap: 10 }}>
                <Text
                  style={{
                    color: BOOKING_THEME.text,
                    fontSize: 14,
                    fontWeight: "800",
                  }}
                >
                  {t("booking.contactInfo")}
                </Text>

                <TextInput
                  value={guestName}
                  onChangeText={setGuestName}
                  placeholder={t("booking.placeholders.name")}
                  placeholderTextColor={BOOKING_THEME.textMuted}
                  style={{
                    borderWidth: 1,
                    borderColor: BOOKING_THEME.glassBorder,
                    backgroundColor: BOOKING_THEME.backgroundElevated,
                    borderRadius: 14,
                    color: BOOKING_THEME.text,
                    fontSize: 13,
                    paddingHorizontal: 12,
                    paddingVertical: 11,
                  }}
                  autoCapitalize="words"
                  maxLength={100}
                />

                <TextInput
                  value={guestPhone}
                  onChangeText={setGuestPhone}
                  placeholder={t("booking.placeholders.phone")}
                  placeholderTextColor={BOOKING_THEME.textMuted}
                  style={{
                    borderWidth: 1,
                    borderColor: BOOKING_THEME.glassBorder,
                    backgroundColor: BOOKING_THEME.backgroundElevated,
                    borderRadius: 14,
                    color: BOOKING_THEME.text,
                    fontSize: 13,
                    paddingHorizontal: 12,
                    paddingVertical: 11,
                  }}
                  keyboardType="phone-pad"
                  maxLength={20}
                />

                <TextInput
                  value={guestEmail}
                  onChangeText={setGuestEmail}
                  placeholder={t("booking.placeholders.email")}
                  placeholderTextColor={BOOKING_THEME.textMuted}
                  style={{
                    borderWidth: 1,
                    borderColor: BOOKING_THEME.glassBorder,
                    backgroundColor: BOOKING_THEME.backgroundElevated,
                    borderRadius: 14,
                    color: BOOKING_THEME.text,
                    fontSize: 13,
                    paddingHorizontal: 12,
                    paddingVertical: 11,
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  maxLength={120}
                />

                <TextInput
                  value={requestNote}
                  onChangeText={setRequestNote}
                  placeholder={t("booking.placeholders.note")}
                  placeholderTextColor={BOOKING_THEME.textMuted}
                  style={{
                    minHeight: 82,
                    borderWidth: 1,
                    borderColor: BOOKING_THEME.glassBorder,
                    backgroundColor: BOOKING_THEME.backgroundElevated,
                    borderRadius: 14,
                    color: BOOKING_THEME.text,
                    fontSize: 13,
                    paddingHorizontal: 12,
                    paddingVertical: 11,
                    textAlignVertical: "top",
                  }}
                  multiline
                  maxLength={500}
                />

                {!hasValidContact ? (
                  <Text style={{ color: "#F59E0B", fontSize: 12 }}>
                    {t("booking.contactValidation")}
                  </Text>
                ) : null}
              </View>

              <View
                style={{
                  width: "100%",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: BOOKING_THEME.glassBorder,
                  backgroundColor: BOOKING_THEME.surfaceMuted,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  gap: 6,
                }}
              >
                <Text
                  style={{ color: BOOKING_THEME.textSecondary, fontSize: 12 }}
                >
                  {t("booking.fields.usageDate")}
                </Text>
                <Text
                  style={{
                    color: BOOKING_THEME.text,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  {formatBookingDateTime(selectedDate, selectedTime, t("booking.fields.notSelected"))}
                </Text>
                {depositInfo ? (
                  <Text
                    style={{ color: BOOKING_THEME.textSecondary, fontSize: 12 }}
                  >
                    {t("booking.pricing.depositLabel", { amount: formatPrice(depositInfo.amount, t("booking.pricing.contact")) })}
                    {depositInfo.type === "PERCENT"
                      ? ` (${depositInfo.rateOrAmount}%)`
                      : ""}
                    {depositInfo.refundable
                      ? ` • ${t("booking.pricing.refundable", { percent: depositInfo.refundPercent })}`
                      : ` • ${t("booking.pricing.nonRefundable")}`}
                  </Text>
                ) : null}

                <Text
                  style={{ color: BOOKING_THEME.textSecondary, fontSize: 12 }}
                >
                  {t("booking.tripLink.summaryPrefix")}{" "}
                  {tripLinkMode === "none"
                    ? t("booking.tripLink.none")
                    : tripLinkMode === "existing"
                      ? selectedTripId
                        ? t("booking.tripLink.linkedTripId", { id: selectedTripId })
                        : t("booking.tripLink.notSelected")
                      : t("booking.tripLink.createOnConfirm")}
                </Text>
              </View>

              {totalPrice !== null ? (
                <View
                  style={{
                    backgroundColor: BOOKING_THEME.neonGlow,
                    borderRadius: 14,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: BOOKING_THEME.glassBorderStrong,
                  }}
                >
                  <Text
                    style={{
                      color: BOOKING_THEME.neon,
                      fontSize: 20,
                      fontWeight: "800",
                    }}
                  >
                    {formatPrice(totalPrice, t("booking.pricing.contact"))}
                  </Text>
                </View>
              ) : null}
            </View>

            {bookingMutation.isError ? (
              <View
                style={{
                  marginTop: 16,
                  backgroundColor: "rgba(255,59,48,0.08)",
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "rgba(255,59,48,0.22)",
                }}
              >
                <Text style={{ color: BOOKING_THEME.danger, fontSize: 13 }}>
                  {bookingMutation.error?.message ||
                    t("booking.errors.generic")}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: BOOKING_THEME.background,
          borderTopWidth: 1,
          borderTopColor: BOOKING_THEME.glassBorder,
        }}
      >
        {step < 3 ? (
          <Pressable
            onPress={() => {
              if (step === 1 && selectedService) setStep(2);
              else if (step === 2 && canProceedFromStep2) setStep(3);
            }}
            disabled={
              (step === 1 && !selectedService) ||
              (step === 2 && !canProceedFromStep2)
            }
            style={{
              backgroundColor:
                (step === 1 && !selectedService) ||
                (step === 2 && !canProceedFromStep2)
                  ? BOOKING_THEME.surfaceMuted
                  : BOOKING_THEME.neon,
              borderRadius: 22,
              paddingVertical: 16,
              alignItems: "center",
              shadowColor:
                (step === 1 && !selectedService) ||
                (step === 2 && !canProceedFromStep2)
                  ? "transparent"
                  : BOOKING_THEME.neon,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 20,
              elevation:
                (step === 1 && !selectedService) ||
                (step === 2 && !canProceedFromStep2)
                  ? 0
                  : 10,
            }}
          >
            <Text
              style={{
                color:
                  (step === 1 && !selectedService) ||
                  (step === 2 && !canProceedFromStep2)
                    ? BOOKING_THEME.textSecondary
                    : BOOKING_THEME.white,
                fontSize: 15,
                fontWeight: "800",
              }}
            >
              {step === 1 ? t("booking.buttons.next") : t("booking.buttons.confirm")}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleConfirmBooking}
            disabled={isSubmittingBooking || !hasValidContact}
            style={{
              backgroundColor: hasValidContact
                ? BOOKING_THEME.neon
                : BOOKING_THEME.surfaceMuted,
              borderRadius: 22,
              paddingVertical: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              shadowColor: hasValidContact ? BOOKING_THEME.neon : "transparent",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: hasValidContact ? 0.35 : 0,
              shadowRadius: 20,
              elevation: hasValidContact ? 10 : 0,
            }}
          >
            {isSubmittingBooking ? (
              <ActivityIndicator size="small" color={BOOKING_THEME.white} />
            ) : (
              <MaterialIconsRounded
                name="check-circle"
                size={18}
                color={
                  hasValidContact
                    ? BOOKING_THEME.white
                    : BOOKING_THEME.textSecondary
                }
              />
            )}
            <Text
              style={{
                color: hasValidContact
                  ? BOOKING_THEME.white
                  : BOOKING_THEME.textSecondary,
                fontSize: 15,
                fontWeight: "800",
              }}
            >
              {t("booking.buttons.confirmBooking")}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
