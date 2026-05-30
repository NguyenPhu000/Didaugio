import { memo, useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Circle, Marker } from "react-native-maps";
import Svg, { Defs, Path, RadialGradient, Stop } from "react-native-svg";
import { Image } from "expo-image";

const ACCURACY_RADIUS = 40;
const AVATAR_SIZE = 34;
const SVG_CONTAINER_SIZE = 120;

// Hàm tính toán đường dẫn hình rẻ quạt trong SVG (nón la bàn)
// cx, cy: Tâm SVG
// r: Bán kính nón
// angle: Góc mở của nón (độ loe la bàn)
const getSectorPath = (cx, cy, r, angle) => {
  // Góc bắt đầu (trái) và kết thúc (phải) đối xứng qua trục dọc hướng lên (-90 độ toán học)
  const startAngle = (-90 - angle / 2) * Math.PI / 180;
  const endAngle = (-90 + angle / 2) * Math.PI / 180;

  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);

  // M cx cy L x1 y1 A r r 0 0 1 x2 y2 Z
  // 0 0 1: large-arc-flag = 0 (vì góc loe < 180 độ), sweep-flag = 1 (vẽ theo chiều kim đồng hồ)
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
};

// Hàm map từ độ chính xác la bàn thô sang góc loe nón la bàn (tính bằng độ)
const getConeAngle = (accuracy) => {
  if (accuracy === undefined || accuracy === null) {
    return 60; // Góc mở mặc định trung bình
  }

  if (Platform.OS === "ios") {
    // iOS: accuracy là độ lệch góc thực tế tính bằng độ. Số nhỏ = chính xác cao.
    if (accuracy < 0) return 120; // Chưa được calibrate
    return Math.min(Math.max(accuracy * 1.8, 22), 120);
  } else {
    // Android: accuracy thường là cấp độ cảm biến (0: Unreliable, 1: Low, 2: Medium, 3: High)
    // Nếu accuracy nằm ngoài dải cấp độ, xử lý như độ lệch góc
    if (accuracy >= 0 && accuracy <= 3) {
      switch (accuracy) {
        case 3: return 24;  // Rất sắc nét và hẹp
        case 2: return 50;  // Vừa phải
        case 1: return 85;  // Loãng/Nhiễu nhẹ
        case 0: return 120; // Chưa được calibrate / Nhiễu nặng
        default: return 60;
      }
    }
    if (accuracy < 0) return 120;
    return Math.min(Math.max(accuracy * 1.8, 22), 120);
  }
};

const CurrentLocationMarker = ({
  location,
  avatarUri,
  heading,
  headingAccuracy,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const hasHeading = Number.isFinite(heading);
  const coneAngle = getConeAngle(headingAccuracy);

  // Xác định la bàn có đang bị nhiễu hoặc chưa cân chỉnh
  const isUncalibrated =
    headingAccuracy !== undefined &&
    headingAccuracy !== null &&
    (Platform.OS === "ios"
      ? headingAccuracy < 0 || headingAccuracy > 40
      : headingAccuracy === 0 || headingAccuracy === 1);

  // Hiệu ứng nhấp nháy pulsing cho nón định vị khi bị nhiễu
  useEffect(() => {
    if (
      !location ||
      !Number.isFinite(location.latitude) ||
      !Number.isFinite(location.longitude)
    ) {
      return;
    }
    let animation = null;
    if (isUncalibrated) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.35,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.9,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      animation?.stop();
    };
  }, [isUncalibrated, pulseAnim, location]);

  // Tự động tắt tooltip sau 5 giây
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  if (
    !location ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    return null;
  }

  const handleMarkerPress = () => {
    setShowTooltip((prev) => !prev);
  };

  return (
    <>
      {/* Vòng tròn bán kính độ chính xác địa lý (GPS Accuracy Circle) */}
      <Circle
        center={location}
        radius={ACCURACY_RADIUS}
        strokeWidth={1.2}
        strokeColor={
          isUncalibrated
            ? "rgba(249, 115, 22, 0.25)"
            : "rgba(66, 133, 244, 0.25)"
        }
        fillColor={
          isUncalibrated
            ? "rgba(249, 115, 22, 0.08)"
            : "rgba(66, 133, 244, 0.08)"
        }
        zIndex={1199}
      />

      {/* 1. Svg Direction Cone la bàn — xoay quanh avatar theo heading */}
      {hasHeading ? (
        <Marker
          coordinate={location}
          anchor={{ x: 0.5, y: 0.5 }}
          rotation={heading}
          tracksViewChanges={false} // Tắt tracksViewChanges để tăng hiệu năng tối đa
          zIndex={1201}
        >
          <Animated.View
            style={{
              width: SVG_CONTAINER_SIZE,
              height: SVG_CONTAINER_SIZE,
              alignItems: "center",
              justifyContent: "center",
              opacity: pulseAnim,
            }}
          >
            <Svg
              width={SVG_CONTAINER_SIZE}
              height={SVG_CONTAINER_SIZE}
              viewBox={`0 0 ${SVG_CONTAINER_SIZE} ${SVG_CONTAINER_SIZE}`}
            >
              <Defs>
                {/* Gradient màu xanh dịu mắt cho la bàn chuẩn */}
                <RadialGradient
                  id="coneGrad"
                  cx="60"
                  cy="60"
                  rx="50"
                  ry="50"
                  fx="60"
                  fy="60"
                  gradientUnits="userSpaceOnUse"
                >
                  <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.48" />
                  <Stop offset="65%" stopColor="#3B82F6" stopOpacity="0.18" />
                  <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </RadialGradient>
                {/* Gradient màu cam neon cho la bàn bị nhiễu */}
                <RadialGradient
                  id="coneGradWarning"
                  cx="60"
                  cy="60"
                  rx="50"
                  ry="50"
                  fx="60"
                  fy="60"
                  gradientUnits="userSpaceOnUse"
                >
                  <Stop offset="0%" stopColor="#F97316" stopOpacity="0.55" />
                  <Stop offset="65%" stopColor="#F97316" stopOpacity="0.22" />
                  <Stop offset="100%" stopColor="#F97316" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Path
                d={getSectorPath(60, 60, 50, coneAngle)}
                fill={
                  isUncalibrated
                    ? "url(#coneGradWarning)"
                    : "url(#coneGrad)"
                }
              />
            </Svg>
          </Animated.View>
        </Marker>
      ) : null}

      {/* 2. Avatar của người dùng — cố định không xoay */}
      <Marker
        coordinate={location}
        anchor={{ x: 0.5, y: 0.5 }}
        zIndex={1202}
        onPress={handleMarkerPress}
      >
        <View style={styles.container}>
          {/* Tooltip hướng dẫn cân chỉnh la bàn viết bằng tiếng Việt đầy đủ dấu */}
          {showTooltip && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>
                {isUncalibrated
                  ? "⚠️ Cảm biến la bàn bị nhiễu. Hãy lắc điện thoại theo hình số 8 để cân chỉnh lại."
                  : "✨ La bàn của bạn đang hoạt động rất chính xác!"}
              </Text>
              {/* Mũi tên trỏ xuống của Tooltip */}
              <View style={styles.tooltipArrow} />
            </View>
          )}

          {/* Vòng phát sáng Neon mượt mà xung quanh Avatar */}
          <View style={styles.neonRing} />

          {/* Khung viền Avatar chính */}
          <View style={styles.avatarRing}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>BẠN</Text>
              </View>
            )}
          </View>
        </View>
      </Marker>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  tooltip: {
    position: "absolute",
    bottom: 48,
    backgroundColor: "rgba(23, 23, 23, 0.95)",
    borderWidth: 1,
    borderColor: "#262626",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    width: 208,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 50,
  },
  tooltipText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 16,
  },
  tooltipArrow: {
    width: 10,
    height: 10,
    backgroundColor: "rgba(23, 23, 23, 0.95)",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#262626",
    transform: [{ rotate: "45deg" }, { translateX: -3.5 }],
    position: "absolute",
    bottom: -6,
    left: 104,
  },
  neonRing: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(96, 165, 250, 0.35)",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#BFDBFE",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default CurrentLocationMarker;
