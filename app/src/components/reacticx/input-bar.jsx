import React, { useState, useCallback } from "react";
import { View, TextInput, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";

const MAX_LINES = 5;
const LINE_HEIGHT = 22;
const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES;

export const InputBar = ({ onSend }) => {
  const [value, setValue] = useState("");
  const [inputHeight, setInputHeight] = useState(LINE_HEIGHT);

  const handleContentSizeChange = useCallback((e) => {
    const newHeight = e.nativeEvent.contentSize.height;
    setInputHeight(Math.min(newHeight, MAX_HEIGHT));
  }, []);

  const handleSend = useCallback(() => {
    if (!value.trim()) return;
    onSend(value);
    setValue("");
    setInputHeight(LINE_HEIGHT);
  }, [value, onSend]);

  const hasText = value.trim().length > 0;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="Ask me anything..."
          placeholderTextColor="#8E8E93"
          multiline
          scrollEnabled={inputHeight >= MAX_HEIGHT}
          onContentSizeChange={handleContentSizeChange}
          style={[styles.input, { height: Math.max(inputHeight, LINE_HEIGHT) }]}
          selectionColor="#0A84FF"
          textAlignVertical="top"
          returnKeyType="default"
          blurOnSubmit={false}
        />

        <View style={styles.bottomRow}>
          <View style={styles.leftIcons}>
            <Pressable style={styles.iconBtn} hitSlop={8}>
              <Feather name="plus" size={20} color="#8E8E93" />
            </Pressable>
            <Pressable style={styles.iconBtn} hitSlop={8}>
              <Ionicons name="globe-outline" size={20} color="#8E8E93" />
            </Pressable>
            <Pressable style={styles.iconBtn} hitSlop={8}>
              <MaterialCommunityIcons name="bullhorn-outline" size={20} color="#8E8E93" />
            </Pressable>
          </View>

          <View style={styles.rightIcons}>
            {!hasText ? (
              <>
                <Pressable style={styles.iconBtn} hitSlop={8}>
                  <Feather name="mic" size={20} color="#8E8E93" />
                </Pressable>
                <View style={styles.voiceCircle}>
                  <Ionicons name="pulse" size={20} color="#000" />
                </View>
              </>
            ) : (
              <Pressable onPress={handleSend} style={styles.sendCircle}>
                <Ionicons name="arrow-up" size={20} color="#000" />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    backgroundColor: "#000000",
  },
  container: {
    backgroundColor: "#1C1C1E",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  input: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: LINE_HEIGHT,
    width: "100%",
    padding: 0,
    margin: 0,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  leftIcons: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBtn: {
    padding: 2,
  },
  voiceCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  sendCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
});
