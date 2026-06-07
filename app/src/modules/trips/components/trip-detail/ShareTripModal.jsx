import { memo, useState, useCallback } from "react";
import {
  Modal,
  Pressable,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useTripShares, useCreateTripShare, useDeleteTripShare } from "../../hooks/useTrips";
import * as Haptics from "expo-haptics";

function ShareLinkRow({ share, onDelete, isDeleting }) {
  const { t } = useTranslation();
  const fullUrl = `didau://shared-trip/${share.shareCode}`;

  const handleCopy = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Clipboard API is async, handle gracefully
  }, []);

  return (
    <View className="bg-black/[0.03] rounded-2xl p-3.5 mb-2">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-1.5">
          <View className={`w-2 h-2 rounded-full ${share.shareType === "edit" ? "bg-[#007AFF]" : "bg-[#34C759]"}`} />
          <Text className="text-[12px] font-medium text-black/50">
            {share.shareType === "edit" ? t("trip.share.editLabel") : t("trip.share.viewOnly")}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {share.expiresAt ? (
            <Text className="text-[11px] text-black/30">
              {new Date(share.expiresAt).toLocaleDateString("vi-VN")}
            </Text>
          ) : null}
          <Pressable
            onPress={() => onDelete(share.id)}
            disabled={isDeleting}
            hitSlop={8}
            className="w-7 h-7 rounded-full items-center justify-center active:bg-black/[0.06]"
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FF3B30" />
            ) : (
              <MaterialIconsRounded name="close" size={14} color="rgba(0,0,0,0.4)" />
            )}
          </Pressable>
        </View>
      </View>

      <View className="flex-row items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-black/[0.06]">
        <Text className="flex-1 text-[13px] font-mono text-black/70" numberOfLines={1}>
          {fullUrl}
        </Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Would use Clipboard.setStringAsync in real impl
          }}
          hitSlop={8}
          className="w-8 h-8 rounded-lg bg-[#007AFF]/10 items-center justify-center"
        >
          <MaterialIconsRounded name="content-copy" size={15} color="#007AFF" />
        </Pressable>
      </View>

      <Text className="text-[11px] text-black/30 mt-1.5 text-center">
        {share.accessCount || 0} lượt truy cập
      </Text>
    </View>
  );
}

export const ShareTripModal = memo(function ShareTripModal({
  visible,
  tripId,
  tripTitle,
  onClose,
}) {
  const { t } = useTranslation();
  const SHARE_TYPE_OPTIONS = [
    { label: t("trip.share.viewOnly"), value: "view" },
    { label: t("trip.share.allowEdit"), value: "edit" },
  ];
  const [shareType, setShareType] = useState("view");

  const { data: shares = [], isLoading: isLoadingShares } = useTripShares(visible ? tripId : null);
  const createMutation = useCreateTripShare();
  const deleteMutation = useDeleteTripShare();

  const handleCreateShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await createMutation.mutateAsync({
        tripId,
        data: { shareType },
      });
    } catch {
      // Error handled by mutation
    }
  }, [tripId, shareType, createMutation]);

  const handleDeleteShare = useCallback(
    async (shareId) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        await deleteMutation.mutateAsync({ tripId, shareId });
      } catch {
        // Error handled by mutation
      }
    },
    [tripId, deleteMutation],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-[#F5F5F7]">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-black/[0.06]">
          <Pressable
            onPress={onClose}
            hitSlop={12}
            className="w-9 h-9 rounded-xl items-center justify-center active:bg-black/[0.06]"
          >
            <MaterialIconsRounded name="close" size={20} color="#1D1D1F" />
          </Pressable>
          <Text className="text-[17px] font-semibold text-[#1D1D1F] tracking-tight">
            {t("tripShare.title")}
          </Text>
          <View className="w-9" />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Trip name */}
          <Text className="text-[13px] font-medium text-black/40 mb-4 text-center">
            {tripTitle}
          </Text>

          {/* Create new share */}
          <View className="bg-white rounded-2xl p-4 mb-5 border border-black/[0.05]">
            <Text className="text-[13px] font-semibold text-[#1D1D1F] mb-3 tracking-tight">
              {t("trip.share.newLink")}
            </Text>

            <View className="flex-row gap-2 mb-3">
              {SHARE_TYPE_OPTIONS.map((opt) => {
                const isActive = shareType === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setShareType(opt.value)}
                    className={`flex-1 py-2.5 rounded-xl items-center border ${
                      isActive
                        ? "bg-[#1D1D1F] border-[#1D1D1F]"
                        : "bg-white border-black/[0.08]"
                    }`}
                  >
                    <Text
                      className={`text-[13px] font-medium tracking-tight ${
                        isActive ? "text-white" : "text-black/50"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleCreateShare}
              disabled={createMutation.isPending}
              className={`h-11 rounded-xl items-center justify-center ${
                createMutation.isPending ? "bg-black/20" : "bg-[#1D1D1F]"
              }`}
            >
              {createMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-[15px] font-semibold tracking-tight">
                  {t("trip.share.createLink")}
                </Text>
              )}
            </Pressable>

            {createMutation.isError ? (
              <Text className="text-[12px] text-[#FF3B30] mt-2 text-center">
                {createMutation.error?.message || t("trip.share.createLinkError")}
              </Text>
            ) : null}
          </View>

          {/* Existing shares */}
          {isLoadingShares ? (
            <View className="items-center py-8">
              <ActivityIndicator size="small" color="#1D1D1F" />
            </View>
          ) : shares.length > 0 ? (
            <View>
              <Text className="text-[13px] font-semibold text-[#1D1D1F] mb-3 tracking-tight">
                {t("trip.share.createdLinks")}
              </Text>
              {shares.map((share) => (
                <ShareLinkRow
                  key={share.id}
                  share={share}
                  onDelete={handleDeleteShare}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </View>
          ) : (
            <View className="items-center py-8">
              <MaterialIconsRounded name="link-off" size={36} color="rgba(0,0,0,0.15)" />
              <Text className="text-[14px] text-black/30 mt-2">
                {t("trip.share.noLinks")}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
});
