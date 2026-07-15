import { logger } from "../../../lib/logger";
import React from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import safeAsyncStorage from "../../../utils/safeAsyncStorage";

export const CheckInButton = ({
  activeEventId,
  activeNextDestination,
  activeDistanceToTarget,
  currentLocation,
  isActiveTripMode,
  isTripPaused,
  createMomentMutation,
  isMomentUploading,
  setIsMomentUploading,
  t,
  bottomOffset = 180,
}) => {
  const handleCameraCheckIn = async () => {
    if (!activeEventId || !activeNextDestination) return;

    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus.status !== "granted") {
      Alert.alert(t("mapScreen.accessRequired"), t("mapScreen.cameraRequired"));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    setIsMomentUploading(true);

    try {
      // Nén & crop 1:1 resize xuống 400x400
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );

      const response = await fetch(manipulated.uri);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result;

        try {
          await createMomentMutation.mutateAsync({
            id: activeEventId,
            payload: {
              placeId: activeNextDestination.placeId,
              imageUrl: base64data,
              latitude: currentLocation?.latitude,
              longitude: currentLocation?.longitude,
            },
          });

          // Lưu AsyncStorage đánh dấu hoàn thành chặng đi này
          const key = `didaugio:event:${activeEventId}:checkedin:${activeNextDestination.placeId}`;
          await safeAsyncStorage.setItem(key, "true");

          Alert.alert(t("mapScreen.checkinSuccess"), t("mapScreen.checkinSuccessDesc"));
        } catch (err) {
          Alert.alert(t("mapScreen.checkinFailed"), err?.message || t("mapScreen.checkinFailedDesc"));
        } finally {
          setIsMomentUploading(false);
        }
      };
    } catch (err) {
      logger.error(err);
      Alert.alert(t("mapScreen.imageError"), t("mapScreen.imageErrorDesc"));
      setIsMomentUploading(false);
    }
  };

  const shouldShow =
    isActiveTripMode &&
    !isTripPaused &&
    activeEventId &&
    activeDistanceToTarget != null &&
    activeDistanceToTarget <= 50;

  if (!shouldShow) return null;

  return (
    <Pressable
      onPress={handleCameraCheckIn}
      disabled={isMomentUploading}
      style={{
        position: "absolute",
        right: 14,
        bottom: bottomOffset,
        zIndex: 99,
      }}
    >
      <View
        style={{
          backgroundColor: "#34C759",
          borderColor: "#FFFFFF",
          borderWidth: 1.5,
          borderRadius: 24,
          width: 48,
          height: 48,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        {isMomentUploading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <MaterialIconsRounded name="photo-camera" size={22} color="#FFFFFF" />
        )}
      </View>
    </Pressable>
  );
};

export default CheckInButton;
