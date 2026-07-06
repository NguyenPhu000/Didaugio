import {
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from "react-native";
import { ArrowUp, Mic, Square } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import { TOKENS } from "../../../../constants/design-tokens";

const LINE_HEIGHT = 22;
const MAX_INPUT_HEIGHT = LINE_HEIGHT * 4;

export function ChatInputBar({
  inputText,
  setInputText,
  onSend,
  isSending,
  canSend,
  inputRef,
  bottomPadding,
  isRecording,
  onToggleRecord,
}) {
  const [inputHeight, setInputHeight] = useState(LINE_HEIGHT);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hasText = inputText.trim().length > 0;

  useEffect(() => {
    let animation;
    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.45,
            duration: 760,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 760,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      animation?.stop();
    };
  }, [isRecording, pulseAnim]);

  const handleContentSizeChange = useCallback((event) => {
    const nextHeight = event.nativeEvent.contentSize.height;
    setInputHeight(Math.min(nextHeight, MAX_INPUT_HEIGHT));
  }, []);

  return (
    <View style={[s.wrapper, { paddingBottom: bottomPadding }]}>
      <View style={s.composer}>
        <TextInput
          ref={inputRef}
          placeholder="Hỏi Genie điều gì đó..."
          placeholderTextColor="#94A3B8"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          scrollEnabled={inputHeight >= MAX_INPUT_HEIGHT}
          onContentSizeChange={handleContentSizeChange}
          selectionColor="#2563EB"
          textAlignVertical="top"
          returnKeyType="default"
          blurOnSubmit={false}
          editable={!isSending}
          style={[
            s.input,
            { height: Math.max(inputHeight, LINE_HEIGHT) },
          ]}
        />

        {!hasText ? (
          <Pressable
            onPress={onToggleRecord}
            disabled={isSending}
            hitSlop={8}
          >
            <Animated.View
              style={[
                s.roundAction,
                isRecording ? s.recordingAction : s.voiceAction,
                { opacity: pulseAnim },
              ]}
            >
              {isRecording ? (
                <Square size={15} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <Mic size={19} color="#475569" />
              )}
            </Animated.View>
          </Pressable>
        ) : (
          <Pressable onPress={onSend} disabled={!canSend} hitSlop={8}>
            {canSend ? (
              <LinearGradient
                colors={["#2563EB", "#7C3AED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.roundAction}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ArrowUp size={19} color="#FFFFFF" />
                )}
              </LinearGradient>
            ) : (
              <View style={[s.roundAction, s.disabledAction]}>
                {isSending ? (
                  <ActivityIndicator size="small" color="#94A3B8" />
                ) : (
                  <ArrowUp size={19} color="#94A3B8" />
                )}
              </View>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    width: "100%",
    paddingHorizontal: 12,
    paddingTop: 6,
    backgroundColor: "rgba(248,250,252,0.96)",
  },
  composer: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderRadius: 28,
    paddingLeft: 18,
    paddingRight: 8,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    boxShadow: "0 12px 34px rgba(15, 23, 42, 0.12)",
  },
  input: {
    flex: 1,
    padding: 0,
    paddingTop: 8,
    paddingBottom: 8,
    margin: 0,
    color: "#0F172A",
    fontSize: 16,
    lineHeight: LINE_HEIGHT,
    fontFamily: TOKENS.font.body,
  },
  roundAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceAction: {
    backgroundColor: "#F1F5F9",
  },
  recordingAction: {
    backgroundColor: "#EF4444",
  },
  disabledAction: {
    backgroundColor: "#F1F5F9",
  },
});
