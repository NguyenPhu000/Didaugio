import React from "react";
import { Keyboard, Pressable, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { MAP_TEXT } from "../constants/mapText.constants";

export const SearchOverlay = ({
  searchOpen,
  searchText,
  setSearchText,
  openSearch,
  closeSearch,
  searchInputRef,
  currentUserAvatarUri,
  onAvatarPress,
}) => (
  <View className="flex-row items-center px-4 gap-3 w-full" pointerEvents="auto">
    <Pressable onPress={searchOpen ? undefined : openSearch} style={{ flex: 1 }}>
      <BlurView
        tint="light"
        intensity={80}
        style={{
          borderRadius: 24,
          flexDirection: "row",
          alignItems: "center",
          overflow: "hidden",
          height: 44,
          backgroundColor: "rgba(255, 255, 255, 0.88)",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.5)",
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <MaterialIconsRounded
            name="search"
            size={20}
            color={
              searchOpen
                ? TOKENS.color.primary[500]
                : TOKENS.color.neutral[500]
            }
          />
        </View>

        {searchOpen ? (
          <>
            <TextInput
              ref={searchInputRef}
              value={searchText}
              onChangeText={setSearchText}
              placeholder={MAP_TEXT.search.placeholder}
              placeholderTextColor={TOKENS.color.neutral[400]}
              style={{
                flex: 1,
                height: 44,
                fontSize: 14,
                color: TOKENS.color.neutral[900],
                fontFamily: TOKENS.font.medium,
              }}
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
              autoCorrect={false}
            />
            {searchText.length > 0 ? (
              <Pressable
                onPress={() => setSearchText("")}
                hitSlop={8}
                style={{
                  width: 36,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIconsRounded
                  name="close"
                  size={18}
                  color={TOKENS.color.neutral[400]}
                />
              </Pressable>
            ) : null}
            <Pressable
              onPress={closeSearch}
              hitSlop={8}
              style={{
                paddingRight: 14,
                paddingLeft: 4,
                height: 44,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: TOKENS.color.neutral[500],
                  fontSize: 13,
                  fontFamily: TOKENS.font.medium,
                }}
              >
                {MAP_TEXT.search.cancel}
              </Text>
            </Pressable>
          </>
        ) : (
          <Text
            style={{
              flex: 1,
              color: TOKENS.color.neutral[400],
              fontSize: 14,
              fontFamily: TOKENS.font.medium,
              paddingRight: 14,
            }}
            numberOfLines={1}
          >
            {MAP_TEXT.search.placeholder}
          </Text>
        )}
      </BlurView>
    </Pressable>

    {!searchOpen ? (
      <Pressable
        onPress={onAvatarPress}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255, 255, 255, 0.88)",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.5)",
          overflow: "hidden",
        }}
      >
        {currentUserAvatarUri ? (
          <Image
            source={{ uri: currentUserAvatarUri }}
            style={{ width: 44, height: 44 }}
            contentFit="cover"
          />
        ) : (
          <MaterialIconsRounded
            name="person"
            size={22}
            color={TOKENS.color.neutral[600]}
          />
        )}
      </Pressable>
    ) : null}
  </View>
);

export default SearchOverlay;
