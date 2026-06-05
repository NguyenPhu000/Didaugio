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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomSheetModal, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { BOOKING_APPLE_THEME as APPLE_THEME } from "../../../constants/design-tokens";
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

    // Tải localCollections từ AsyncStorage để hiển thị các folder trống đồng bộ với màn Saved
    useEffect(() => {
      const loadLocalCollections = async () => {
        try {
          const key = user?.id
            ? `local_collections_${user.id}`
            : "local_collections_guest";
          const stored = await AsyncStorage.getItem(key);
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

    // Xác định xem địa điểm này đã được lưu vào collection nào chưa
    const savedEntry = useMemo(() => {
      if (!placeId) return null;
      return savedPlaces.find(
        (entry) =>
          Number(entry?.placeId || entry?.place?.id) === Number(placeId),
      );
    }, [savedPlaces, placeId]);

    const currentCollectionName = useMemo(() => {
      if (!savedEntry) return null;
      return savedEntry.collectionName || "Yêu thích";
    }, [savedEntry]);

    // Gom dữ liệu để lấy ảnh đại diện và đếm số lượng items cho từng folder
    const folderDataList = useMemo(() => {
      const map = new Map();

      // Mặc định luôn có Yêu thích
      map.set("yêu thích", {
        name: "Yêu thích",
        count: 0,
        thumbnail: null,
      });

      // Thêm các local collections để đảm bảo các folder trống cục bộ hiển thị đầy đủ
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
            name: colName || "Yêu thích",
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
    }, [collections, savedPlaces, localCollections]);

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
          opacity={0.3}
        />
      ),
      [],
    );

    const handleSelectCollection = useCallback(
      async (collectionName) => {
        if (!placeId) return;

        try {
          const isDefault = collectionName === "Yêu thích";
          const targetCollectionName = isDefault ? null : collectionName;

          if (currentCollectionName === collectionName) {
            await unsaveMutation.mutateAsync(placeId);
            Alert.alert("Đã bỏ lưu", "Đã xóa địa điểm khỏi bộ sưu tập.");
          } else {
            await saveMutation.mutateAsync({
              placeId,
              collectionName: targetCollectionName || undefined,
            });
            Alert.alert("Lưu thành công", `Đã lưu vào ${collectionName}`);
          }
          onSuccess?.();
          bottomSheetModalRef.current?.dismiss();
        } catch (err) {
          Alert.alert("Có lỗi xảy ra", "Vui lòng thử lại sau.");
        }
      },
      [placeId, currentCollectionName, saveMutation, unsaveMutation, onSuccess],
    );

    const handleCreateCollection = useCallback(async () => {
      const name = newCollectionName.trim();
      if (!name) return;
      if (name.toLowerCase() === "yêu thích") {
        Alert.alert("Trùng tên", "Tên bộ sưu tập đã tồn tại.");
        return;
      }

      setIsCreating(true);
      try {
        await saveMutation.mutateAsync({
          placeId,
          collectionName: name,
        });

        // Đồng bộ lưu tên collection mới vào AsyncStorage để màn hình Saved nạp được
        try {
          const key = user?.id
            ? `local_collections_${user.id}`
            : "local_collections_guest";
          const stored = await AsyncStorage.getItem(key);
          let currentLocal = stored ? JSON.parse(stored) : [];
          if (!currentLocal.includes(name)) {
            currentLocal.push(name);
            await AsyncStorage.setItem(key, JSON.stringify(currentLocal));
          }
        } catch (e) {
          // Lỗi lưu offline âm thầm
        }

        Alert.alert("Lưu thành công", `Đã lưu vào ${name}`);
        setNewCollectionName("");
        setShowCreateInput(false);
        onSuccess?.();
        bottomSheetModalRef.current?.dismiss();
      } catch (err) {
        Alert.alert("Có lỗi xảy ra", "Không thể tạo bộ sưu tập.");
      } finally {
        setIsCreating(false);
      }
    }, [newCollectionName, placeId, saveMutation, onSuccess, user?.id]);

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onDismiss={onClose}
        handleIndicatorStyle={{
          backgroundColor: "rgba(0,0,0,0.15)",
          width: 36,
          height: 4,
        }}
        backgroundStyle={{
          backgroundColor: "#FFFFFF",
          borderRadius: 28,
        }}
      >
        <View className="px-5 pb-4 pt-2">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[#1D1D1F] text-lg font-extrabold tracking-[-0.3px]">
              Lưu vào bộ sưu tập
            </Text>
            <Pressable
              onPress={() => bottomSheetModalRef.current?.dismiss()}
              hitSlop={8}
            >
              <MaterialIconsRounded
                name="close"
                size={22}
                color={APPLE_THEME.textMuted}
              />
            </Pressable>
          </View>

          {/* Dòng kích hoạt tạo mới nhanh dạng nét vẽ đứt quãng sang xịn */}
          {!showCreateInput ? (
            <Pressable
              onPress={() => setShowCreateInput(true)}
              className="flex-row items-center gap-3 py-3.5 px-3 border border-dashed border-[#D1D1D6] rounded-2xl active:bg-black/[0.01]"
            >
              <View className="w-8 h-8 rounded-lg bg-orange-50 items-center justify-center">
                <MaterialIconsRounded name="add" size={18} color="#FF9500" />
              </View>
              <Text className="text-[#FF9500] text-[14px] font-bold">
                Tạo bộ sưu tập mới
              </Text>
            </Pressable>
          ) : (
            <View className="flex-row items-center gap-2.5 bg-[#F2F2F7] px-3.5 py-2.5 rounded-2xl border border-black/[0.01]">
              <TextInput
                placeholder="Tên bộ sưu tập..."
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                className="flex-1 text-[#1D1D1F] text-[14px] p-0 font-bold"
                placeholderTextColor="#AEAEB2"
                autoFocus
              />
              <Pressable
                onPress={handleCreateCollection}
                disabled={isCreating}
                className="bg-black px-4 py-2 rounded-xl active:opacity-85"
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text className="text-white text-xs font-bold">Tạo mới</Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowCreateInput(false);
                  setNewCollectionName("");
                }}
                className="p-1 rounded-full bg-white/80 active:bg-white"
              >
                <MaterialIconsRounded name="close" size={14} color="#8E8E93" />
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
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {folderDataList.map((folder) => {
              const isSelected = currentCollectionName === folder.name;
              return (
                <Pressable
                  key={folder.name}
                  onPress={() => handleSelectCollection(folder.name)}
                  className="flex-row items-center justify-between px-5 py-4 border-b border-black/[0.03] active:bg-black/[0.01]"
                  style={
                    isSelected
                      ? { backgroundColor: "rgba(255, 149, 0, 0.02)" }
                      : {}
                  }
                >
                  <View className="flex-row items-center gap-3.5 flex-1 mr-4">
                    {/* Thumbnail folder hoặc Icon */}
                    {folder.thumbnail ? (
                      <Image
                        source={{ uri: folder.thumbnail }}
                        className="w-12 h-12 rounded-2xl bg-gray-50 border border-black/[0.04]"
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        className="w-12 h-12 rounded-2xl items-center justify-center border border-black/[0.03]"
                        style={{
                          backgroundColor: isSelected
                            ? "rgba(255, 149, 0, 0.1)"
                            : "#F2F2F7",
                        }}
                      >
                        <MaterialIconsRounded
                          name={
                            folder.name === "Yêu thích" ? "favorite" : "folder"
                          }
                          size={20}
                          color={isSelected ? "#FF9500" : "#8E8E93"}
                        />
                      </View>
                    )}

                    <View className="flex-1">
                      <Text
                        className={`text-[15px] font-bold ${isSelected ? "text-[#FF9500]" : "text-[#1D1D1F]"}`}
                      >
                        {folder.name}
                      </Text>
                      <Text className="text-[#8E8E93] text-xs mt-0.5 font-semibold">
                        {folder.count} địa điểm
                      </Text>
                    </View>
                  </View>

                  {/* Radio button Checkmark màu cam ấm cực kỳ đồng bộ */}
                  <View
                    className="w-5.5 h-5.5 rounded-full border-2 items-center justify-center"
                    style={{
                      borderColor: isSelected ? "#FF9500" : "#D1D1D6",
                      backgroundColor: isSelected ? "#FF9500" : "transparent",
                    }}
                  >
                    {isSelected && (
                      <MaterialIconsRounded
                        name="check"
                        size={13}
                        color="#FFF"
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </BottomSheetModal>
    );
  }),
);

CollectionSelectorSheet.displayName = "CollectionSelectorSheet";
