import { memo } from "react";
import { Image, Text, View } from "react-native";
import { Circle, Marker } from "react-native-maps";

const CurrentLocationMarker = memo(function CurrentLocationMarker({
  location,
  nickname,
  avatarUri,
}) {
  if (
    !location ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    return null;
  }

  const trimmedNickname =
    typeof nickname === "string" && nickname.trim() ? nickname.trim() : "";
  const label =
    trimmedNickname.length > 20
      ? `${trimmedNickname.slice(0, 17)}...`
      : trimmedNickname;
  const resolvedAvatarUri =
    typeof avatarUri === "string" && avatarUri.trim() ? avatarUri.trim() : null;
  const fallbackInitial = (label || "U").charAt(0).toUpperCase();

  return (
    <>
      <Circle
        center={location}
        radius={38}
        strokeWidth={1}
        strokeColor="rgba(37, 99, 235, 0.35)"
        fillColor="rgba(59, 130, 246, 0.16)"
      />
      <Marker
        coordinate={location}
        anchor={{ x: 0.5, y: 1 }}
        tracksViewChanges={Boolean(resolvedAvatarUri)}
        zIndex={1200}
      >
        <View style={{ alignItems: "center" }}>
          {label ? (
            <View
              style={{
                marginBottom: 6,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                borderWidth: 1,
                borderColor: "rgba(59, 130, 246, 0.45)",
              }}
            >
              <Text
                style={{
                  color: "#DBEAFE",
                  fontSize: 11,
                  fontWeight: "700",
                }}
              >
                {label}
              </Text>
            </View>
          ) : null}

          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(37, 99, 235, 0.18)",
              borderWidth: 2,
              borderColor: "rgba(59, 130, 246, 0.55)",
            }}
          >
            {resolvedAvatarUri ? (
              <Image
                source={{ uri: resolvedAvatarUri }}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  borderWidth: 1.5,
                  borderColor: "rgba(255,255,255,0.95)",
                }}
              />
            ) : (
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#1D4ED8",
                  borderWidth: 1.5,
                  borderColor: "rgba(255,255,255,0.95)",
                }}
              >
                <Text
                  style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}
                >
                  {fallbackInitial}
                </Text>
              </View>
            )}
          </View>

          <View
            style={{
              marginTop: 4,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#2563EB",
              borderWidth: 2,
              borderColor: "#FFFFFF",
            }}
          />
        </View>
      </Marker>
    </>
  );
});

export default CurrentLocationMarker;
