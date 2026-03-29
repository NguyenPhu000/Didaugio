import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import {
  usePlaceServices,
  useCreateBooking,
} from "../../src/modules/booking/hooks/useBooking";
import { usePlaceDetail } from "../../src/modules/place/hooks/usePlaceDetail";
import { GLASS_THEME } from "../../src/constants/design-tokens";

const STEP_LABELS = ["Dịch vụ", "Xác nhận", "Thanh toán"];

const formatPrice = (price) => {
  if (!price && price !== 0) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const StepIndicator = ({ currentStep }) => (
  <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 24 }}>
    {STEP_LABELS.map((label, index) => {
      const stepNum = index + 1;
      const isDone = stepNum < currentStep;
      const isActive = stepNum === currentStep;
      return (
        <View key={label} style={{ flex: 1, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
            {index > 0 ? (
              <View
                style={{
                  flex: 1,
                  height: 2,
                  backgroundColor: isDone || isActive
                    ? GLASS_THEME.neon
                    : GLASS_THEME.glass,
                }}
              />
            ) : null}
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isActive
                  ? GLASS_THEME.neon
                  : isDone
                    ? "rgba(0,240,255,0.2)"
                    : GLASS_THEME.glass,
                borderWidth: 1,
                borderColor: isDone || isActive
                  ? GLASS_THEME.neon
                  : GLASS_THEME.glassBorder,
              }}
            >
              {isDone ? (
                <MaterialIcons name="check" size={16} color={GLASS_THEME.neon} />
              ) : (
                <Text
                  style={{
                    color: isActive ? "#03131A" : GLASS_THEME.textSecondary,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  {stepNum}
                </Text>
              )}
            </View>
            {index < STEP_LABELS.length - 1 ? (
              <View
                style={{
                  flex: 1,
                  height: 2,
                  backgroundColor: stepNum < currentStep
                    ? GLASS_THEME.neon
                    : GLASS_THEME.glass,
                }}
              />
            ) : null}
          </View>
          <Text
            style={{
              color: isActive ? GLASS_THEME.neon : GLASS_THEME.textSecondary,
              fontSize: 11,
              fontWeight: isActive ? "700" : "400",
              marginTop: 6,
            }}
          >
            {label}
          </Text>
        </View>
      );
    })}
  </View>
);

const ServiceCard = ({ service, isSelected, onSelect }) => (
  <Pressable
    onPress={() => onSelect(service)}
    style={{
      borderRadius: 20,
      padding: 16,
      marginBottom: 12,
      backgroundColor: isSelected ? "rgba(0,240,255,0.08)" : GLASS_THEME.glass,
      borderWidth: 1.5,
      borderColor: isSelected ? GLASS_THEME.neon : GLASS_THEME.glassBorder,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
          {service.name}
        </Text>
        {service.description ? (
          <Text
            style={{ color: GLASS_THEME.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 18 }}
            numberOfLines={2}
          >
            {service.description}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text style={{ color: GLASS_THEME.neon, fontSize: 15, fontWeight: "800" }}>
          {formatPrice(service.price)}
        </Text>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: isSelected ? GLASS_THEME.neon : "transparent",
            borderWidth: 2,
            borderColor: isSelected ? GLASS_THEME.neon : GLASS_THEME.glassBorder,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isSelected ? (
            <MaterialIcons name="check" size={13} color="#03131A" />
          ) : null}
        </View>
      </View>
    </View>
  </Pressable>
);

export default function BookingScreen() {
  const { placeId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [bookingDone, setBookingDone] = useState(false);

  const { data: place } = usePlaceDetail(placeId);
  const { data: services = [], isLoading: servicesLoading } = usePlaceServices(placeId);
  const bookingMutation = useCreateBooking();

  const totalPrice = selectedService?.price ? selectedService.price * quantity : null;

  const handleConfirmBooking = async () => {
    try {
      await bookingMutation.mutateAsync({
        placeId: parseInt(placeId),
        serviceId: selectedService?.id,
        quantity,
        totalAmount: totalPrice,
        note: "",
      });
      setBookingDone(true);
    } catch {
      // Error displayed via mutation state
    }
  };

  if (bookingDone) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: GLASS_THEME.background,
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
            backgroundColor: "rgba(0,240,255,0.12)",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: GLASS_THEME.neon,
            shadowColor: GLASS_THEME.neon,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.4,
            shadowRadius: 24,
            elevation: 16,
          }}
        >
          <MaterialIcons name="check-circle" size={52} color={GLASS_THEME.neon} />
        </View>
        <Text style={{ color: "#fff", fontSize: 26, fontWeight: "800", textAlign: "center" }}>
          Đặt thành công!
        </Text>
        <Text style={{ color: GLASS_THEME.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 22 }}>
          {selectedService?.name
            ? `Dịch vụ "${selectedService.name}" đã được đặt. Chúng tôi sẽ liên hệ để xác nhận.`
            : "Đặt dịch vụ thành công. Chúng tôi sẽ liên hệ để xác nhận."}
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            backgroundColor: GLASS_THEME.neon,
            borderRadius: 20,
            paddingHorizontal: 32,
            paddingVertical: 14,
            shadowColor: GLASS_THEME.neon,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 20,
            elevation: 12,
          }}
        >
          <Text style={{ color: "#03131A", fontSize: 15, fontWeight: "800" }}>
            Quay lại địa điểm
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: GLASS_THEME.background,
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
            backgroundColor: GLASS_THEME.glass,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: GLASS_THEME.glassBorder,
          }}
        >
          <MaterialIcons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>Đặt dịch vụ</Text>
          {place?.name ? (
            <Text style={{ color: GLASS_THEME.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
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
            <Text style={{ color: GLASS_THEME.textSecondary, fontSize: 13, marginBottom: 16 }}>
              Chọn dịch vụ bạn muốn đặt
            </Text>

            {servicesLoading ? (
              <ActivityIndicator size="large" color={GLASS_THEME.neon} style={{ marginTop: 32 }} />
            ) : services.length === 0 ? (
              <View
                style={{
                  alignItems: "center",
                  paddingVertical: 40,
                  gap: 16,
                  backgroundColor: GLASS_THEME.glass,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: GLASS_THEME.glassBorder,
                }}
              >
                <MaterialIcons name="room-service" size={48} color="rgba(255,255,255,0.2)" />
                <Text style={{ color: GLASS_THEME.textSecondary, textAlign: "center", fontSize: 14 }}>
                  Địa điểm này chưa có dịch vụ đặt trước.{"\n"}Vui lòng liên hệ trực tiếp.
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
            <Text style={{ color: GLASS_THEME.textSecondary, fontSize: 13, marginBottom: 16 }}>
              Xác nhận thông tin đặt dịch vụ
            </Text>

            <View
              style={{
                backgroundColor: GLASS_THEME.glass,
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: GLASS_THEME.glassBorder,
                gap: 16,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: GLASS_THEME.textSecondary, fontSize: 13 }}>Địa điểm</Text>
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600", maxWidth: "55%", textAlign: "right" }}>
                  {place?.name || "—"}
                </Text>
              </View>
              <View style={{ height: 1, backgroundColor: GLASS_THEME.glassBorder }} />
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: GLASS_THEME.textSecondary, fontSize: 13 }}>Dịch vụ</Text>
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                  {selectedService?.name || "—"}
                </Text>
              </View>
              <View style={{ height: 1, backgroundColor: GLASS_THEME.glassBorder }} />

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ color: GLASS_THEME.textSecondary, fontSize: 13 }}>Số lượng</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <Pressable
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: GLASS_THEME.glass,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: GLASS_THEME.glassBorder,
                    }}
                  >
                    <MaterialIcons name="remove" size={16} color="#fff" />
                  </Pressable>
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", minWidth: 24, textAlign: "center" }}>
                    {quantity}
                  </Text>
                  <Pressable
                    onPress={() => setQuantity(quantity + 1)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: GLASS_THEME.glass,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: GLASS_THEME.glassBorder,
                    }}
                  >
                    <MaterialIcons name="add" size={16} color="#fff" />
                  </Pressable>
                </View>
              </View>

              {totalPrice !== null ? (
                <>
                  <View style={{ height: 1, backgroundColor: GLASS_THEME.glassBorder }} />
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: GLASS_THEME.textSecondary, fontSize: 13 }}>Tổng tiền</Text>
                    <Text style={{ color: GLASS_THEME.neon, fontSize: 16, fontWeight: "800" }}>
                      {formatPrice(totalPrice)}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          </>
        ) : (
          <>
            <Text style={{ color: GLASS_THEME.textSecondary, fontSize: 13, marginBottom: 16 }}>
              Xác nhận và thanh toán
            </Text>

            <View
              style={{
                backgroundColor: GLASS_THEME.glass,
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: GLASS_THEME.glassBorder,
                alignItems: "center",
                gap: 12,
              }}
            >
              <MaterialIcons name="payment" size={40} color={GLASS_THEME.neon} />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "center" }}>
                Thanh toán khi đến nơi
              </Text>
              <Text style={{ color: GLASS_THEME.textSecondary, fontSize: 13, textAlign: "center", lineHeight: 20 }}>
                Hiện tại chúng tôi hỗ trợ thanh toán trực tiếp tại địa điểm.{"\n"}Đặt chỗ sẽ được xác nhận qua điện thoại.
              </Text>
              {totalPrice !== null ? (
                <View
                  style={{
                    backgroundColor: "rgba(0,240,255,0.1)",
                    borderRadius: 14,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: "rgba(0,240,255,0.25)",
                  }}
                >
                  <Text style={{ color: GLASS_THEME.neon, fontSize: 20, fontWeight: "800" }}>
                    {formatPrice(totalPrice)}
                  </Text>
                </View>
              ) : null}
            </View>

            {bookingMutation.isError ? (
              <View
                style={{
                  marginTop: 16,
                  backgroundColor: "rgba(239,68,68,0.12)",
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "rgba(239,68,68,0.3)",
                }}
              >
                <Text style={{ color: "#EF4444", fontSize: 13 }}>
                  {bookingMutation.error?.message || "Có lỗi xảy ra, vui lòng thử lại"}
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
          backgroundColor: "rgba(5,7,11,0.95)",
          borderTopWidth: 1,
          borderTopColor: GLASS_THEME.glassBorder,
        }}
      >
        {step < 3 ? (
          <Pressable
            onPress={() => {
              if (step === 1 && selectedService) setStep(2);
              else if (step === 2) setStep(3);
            }}
            disabled={step === 1 && !selectedService}
            style={{
              backgroundColor:
                step === 1 && !selectedService
                  ? "rgba(255,255,255,0.12)"
                  : GLASS_THEME.neon,
              borderRadius: 22,
              paddingVertical: 16,
              alignItems: "center",
              shadowColor:
                step === 1 && !selectedService ? "transparent" : GLASS_THEME.neon,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 20,
              elevation: step === 1 && !selectedService ? 0 : 10,
            }}
          >
            <Text
              style={{
                color:
                  step === 1 && !selectedService ? GLASS_THEME.textSecondary : "#03131A",
                fontSize: 15,
                fontWeight: "800",
              }}
            >
              {step === 1 ? "Tiếp theo" : "Xác nhận"}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleConfirmBooking}
            disabled={bookingMutation.isPending}
            style={{
              backgroundColor: GLASS_THEME.neon,
              borderRadius: 22,
              paddingVertical: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              shadowColor: GLASS_THEME.neon,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {bookingMutation.isPending ? (
              <ActivityIndicator size="small" color="#03131A" />
            ) : (
              <MaterialIcons name="check-circle" size={18} color="#03131A" />
            )}
            <Text style={{ color: "#03131A", fontSize: 15, fontWeight: "800" }}>
              Xác nhận đặt chỗ
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
