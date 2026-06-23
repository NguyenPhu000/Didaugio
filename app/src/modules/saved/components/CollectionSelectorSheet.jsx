import React, {
  memo,
  useMemo,
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import safeAsyncStorage from "../../../utils/safeAsyncStorage";
import { BottomSheetModal, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import {
  useSavePlace,
  useUnsavePlace,
  useSavedCollections,
} from "../hooks/useSaved";
import { useSavedPlacesCached } from "../hooks/useSavedOffline";
import { useAuthStore } from "../../../stores/authStore";
import {
  resolveMediaUrl,
  getCategoryPlaceholder,
} from "../../../lib/media-url";

export const CollectionSelectorSheet = memo(
  forwardRef(function CollectionSelectorSheet(
    { placeId, onSuccess, onClose },
    ref,
  ) {
    const { t } = useTranslation();
    const bottomSheetModalRef = useRef(null);
    const snapPoints = useMemo(() => ["60%", "85%"], []);
    const user = useAuthStore((s) => s.user);
    const isLoggedIn = useAuthStore((s) => !s.isGuest && !!s.accessToken);

    const { data: collections = [], isLoading: isLoadingCollections } =
      useSavedCollections(isLoggedIn);
    const { savedData: savedPlaces = [] } = useSavedPlacesCached(isLoggedIn);

    const saveMutation = useSavePlace();
    const unsaveMutation = useUnsavePlace();

    const [newCollectionName, setNewCollectionName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [localCollections, setLocalCollections] = useState([]);

    useEffect(() => {
      const loadLocalCollections = async () => {
        try {
          const key = user?.id
            ? `local_collections_${user.id}`
            : "local_collections_guest";
          const stored = await safeAsyncStorage.getItem(key);
          if (stored) {
            setLocalCollections(JSON.parse(stored));
          } else {
            setLocalCollections([]);
          }
        } catch (err) {
          // Lỗi âm thầm
        }
      };
      if (isLoggedIn) {
        loadLocalCollections();
      }
    }, [isLoggedIn, user?.id]);

    const savedEntry = useMemo(() => {
      if (!placeId) return null;
      return savedPlaces.find(
        (entry) =>
          Number(entry?.placeId || entry?.place?.id) === Number(placeId),
      );
    }, [savedPlaces, placeId]);

    const currentCollectionName = useMemo(() => {
      if (!savedEntry) return null;
      return savedEntry.collectionName || t("collectionSelector.favorite");
    }, [savedEntry, t]);

    const folderDataList = useMemo(() => {
      const map = new Map();

      map.set("yêu thích", {
        name: t("collectionSelector.favorite"),
        count: 0,
        thumbnail: null,
      });

      localCollections.forEach((name) => {
        const key = name.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            name: name,
            count: 0,
            thumbnail: null,
          });
        }
      });

      collections.forEach((c) => {
        if (!c.name) return;
        map.set(c.name.toLowerCase(), {
          name: c.name,
          count: 0,
          thumbnail: null,
        });
      });

      savedPlaces.forEach((entry) => {
        const colName = String(entry.collectionName || "").trim();
        const key = colName ? colName.toLowerCase() : "yêu thích";

        if (!map.has(key)) {
          map.set(key, {
            name: colName || t("collectionSelector.favorite"),
            count: 0,
            thumbnail: null,
          });
        }

        const folder = map.get(key);
        folder.count += 1;
        if (!folder.thumbnail) {
          const place = entry.place || entry;
          folder.thumbnail =
            resolveMediaUrl(
              place.images?.[0]?.imageData ||
                place.thumbnailUrl ||
                place.thumbnail,
            ) || getCategoryPlaceholder(place?.category?.name);
        }
      });

      return Array.from(map.values());
    }, [collections, savedPlaces, localCollections, t]);

    useImperativeHandle(ref, () => ({
      present: () => {
        bottomSheetModalRef.current?.present();
      },
      dismiss: () => {
        bottomSheetModalRef.current?.dismiss();
      },
    }));

    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.4}
        />
      ),
      [],
    );

    const handleSelectCollection = useCallback(
      async (collectionName) => {
        if (!placeId) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
          const isDefault = collectionName === "Yêu thích";
          const targetCollectionName = isDefault ? null : collectionName;

          if (currentCollectionName === collectionName) {
            await unsaveMutation.mutateAsync(placeId);
            Alert.alert(
              t("collectionSelector.unsaved"),
              t("collectionSelector.unsavedDesc"),
            );
          } else {
            await saveMutation.mutateAsync({
              placeId,
              collectionName: targetCollectionName || undefined,
            });
            Alert.alert(
              t("collectionSelector.saveSuccess"),
              t("collectionSelector.saveSuccessDesc", { name: collectionName }),
            );
          }
          onSuccess?.();
          bottomSheetModalRef.current?.dismiss();
        } catch (err) {
          Alert.alert(
            t("collectionSelector.error"),
            t("collectionSelector.errorDesc"),
          );
        }
      },
      [
        placeId,
        currentCollectionName,
        saveMutation,
        unsaveMutation,
        onSuccess,
        t,
      ],
    );

    const handleCreateCollection = useCallback(async () => {
      const name = newCollectionName.trim();
      if (!name) return;
      if (name.toLowerCase() === "yêu thích") {
        Alert.alert(
          t("collectionSelector.duplicateName"),
          t("collectionSelector.duplicateNameDesc"),
        );
        return;
      }

      setIsCreating(true);
      try {
        await saveMutation.mutateAsync({
          placeId,
          collectionName: name,
        });

        try {
          const key = user?.id
            ? `local_collections_${user.id}`
            : "local_collections_guest";
          const stored = await safeAsyncStorage.getItem(key);
          let currentLocal = stored ? JSON.parse(stored) : [];
          if (!currentLocal.includes(name)) {
            currentLocal.push(name);
            await safeAsyncStorage.setItem(key, JSON.stringify(currentLocal));
          }
        } catch (e) {
          // Lỗi lưu offline âm thầm
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          t("collectionSelector.saveSuccessNew"),
          t("collectionSelector.saveSuccessNewDesc", { name }),
        );
        setNewCollectionName("");
        setShowCreateInput(false);
        onSuccess?.();
        bottomSheetModalRef.current?.dismiss();
      } catch (err) {
        Alert.alert(
          t("collectionSelector.createError"),
          t("collectionSelector.createErrorDesc"),
        );
      } finally {
        setIsCreating(false);
      }
    }, [newCollectionName, placeId, saveMutation, onSuccess, user?.id, t]);

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onDismiss={onClose}
        handleIndicatorStyle={{
          backgroundColor: "rgba(0,0,0,0.15)",
          width: 40,
          height: 5,
        }}
        backgroundStyle={{
          backgroundColor: "#FFFFFF",
          borderRadius: 24,
        }}
      >
        <View className="px-5 pb-2 pt-1">
          <View className="flex-row items-center justify-between mb-5">
            <Text
              className="text-[22px] tracking-tight"
              style={{
                color: APPLE_THEME.text,
                fontFamily: TOKENS.font.heading,
              }}
            >
              {t("collectionSelector.saveToCollection")}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                bottomSheetModalRef.current?.dismiss();
              }}
              className="w-8 h-8 rounded-full bg-black/5 items-center justify-center active:bg-black/10"
            >
              <MaterialIconsRounded
                name="close"
                size={18}
                color={APPLE_THEME.textMuted}
              />
            </Pressable>
          </View>

          {/* Dòng tạo mới chuẩn Apple: Sạch sẽ, không gạch đứt */}
          {!showCreateInput ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowCreateInput(true);
              }}
              className="flex-row items-center gap-3.5 py-3 px-1 mb-2 rounded-2xl active:opacity-70"
            >
              <View className="w-12 h-12 rounded-2xl bg-[#FF9500]/10 items-center justify-center border border-[#FF9500]/10">
                <MaterialIconsRounded name="add" size={24} color="#FF9500" />
              </View>
              <Text
                className="text-[#FF9500] text-[16px]"
                style={{ fontFamily: TOKENS.font.semibold }}
              >
                {t("collectionSelector.createNew")}
              </Text>
            </Pressable>
          ) : (
            <View className="flex-row items-center gap-3 bg-[#F2F2F7] pl-4 pr-2 py-2 mb-4 rounded-2xl">
              <TextInput
                placeholder={t("collectionSelector.namePlaceholder")}
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                className="flex-1 text-[16px] text-[#1D1D1F] p-0"
                style={{ fontFamily: TOKENS.font.medium }}
                placeholderTextColor="#AEAEB2"
                autoFocus
              />
              <Pressable
                onPress={handleCreateCollection}
                disabled={isCreating || !newCollectionName.trim()}
                className={`px-4 py-2.5 rounded-xl active:opacity-80 ${
                  newCollectionName.trim() ? "bg-[#FF9500]" : "bg-[#D1D1D6]"
                }`}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text
                    className="text-white text-[14px]"
                    style={{ fontFamily: TOKENS.font.bold }}
                  >
                    {t("collectionSelector.create")}
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {isLoadingCollections ? (
          <View className="flex-1 items-center justify-center py-8">
            <ActivityIndicator color="#000" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 12 }}
          >
            {folderDataList.map((folder, idx) => {
              const isSelected = currentCollectionName === folder.name;
              return (
                <Animated.View
                  key={folder.name}
                  entering={FadeIn.duration(180)}
                  layout={LinearTransition.duration(180)}
                >
                  <Pressable
                    onPress={() => handleSelectCollection(folder.name)}
                    className="flex-row items-center justify-between px-3 py-2.5 rounded-2xl active:bg-black/5"
                    style={
                      isSelected
                        ? { backgroundColor: "rgba(255, 149, 0, 0.05)" }
                        : {}
                    }
                  >
                    <View className="flex-row items-center gap-3.5 flex-1 mr-4">
                      {folder.thumbnail ? (
                        <Image
                          source={{ uri: folder.thumbnail }}
                          className="w-12 h-12 rounded-2xl bg-gray-50 border border-black/5"
                          contentFit="cover"
                        />
                      ) : (
                        <View
                          className="w-12 h-12 rounded-2xl items-center justify-center border border-black/5"
                          style={{
                            backgroundColor: isSelected
                              ? "rgba(255, 149, 0, 0.15)"
                              : "#F2F2F7",
                          }}
                        >
                          <MaterialIconsRounded
                            name={
                              folder.name === "Yêu thích"
                                ? "favorite"
                                : "folder"
                            }
                            size={22}
                            color={isSelected ? "#FF9500" : "#8E8E93"}
                          />
                        </View>
                      )}

                      <View className="flex-1 justify-center">
                        <Text
                          className={`text-[16px] tracking-tight ${
                            isSelected ? "text-[#FF9500]" : "text-[#1D1D1F]"
                          }`}
                          style={{ fontFamily: TOKENS.font.semibold }}
                        >
                          {folder.name}
                        </Text>
                        <Text
                          className="text-[#8E8E93] text-[13px] mt-0.5"
                          style={{ fontFamily: TOKENS.font.medium }}
                        >
                          {t("collectionSelector.placeCount", {
                            count: folder.count,
                          })}
                        </Text>
                      </View>
                    </View>

                    {/* Vòng tròn Checkmark Minimalist */}
                    <View
                      className="w-[22px] h-[22px] rounded-full border-[1.5px] items-center justify-center"
                      style={{
                        borderColor: isSelected ? "#FF9500" : "#D1D1D6",
                        backgroundColor: isSelected ? "#FF9500" : "transparent",
                      }}
                    >
                      {isSelected && (
                        <MaterialIconsRounded
                          name="check"
                          size={14}
                          color="#FFF"
                        />
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </ScrollView>
        )}
      </BottomSheetModal>
    );
  }),
);

CollectionSelectorSheet.displayName = "CollectionSelectorSheet";
