import { View, TextInput, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { ArrowUp, Mic, Square } from "lucide-react-native";
import { TOKENS } from "../../../../constants/design-tokens";

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
  const showMic = !canSend && inputText.trim().length === 0;

  return (
    <View style={[s.inputBarWrapper, { paddingBottom: bottomPadding }]}>
      <View style={s.inputRow}>
        <TextInput
          ref={inputRef}
          placeholder="Hỏi Genie điều gì đó..."
          placeholderTextColor="#8E8E93"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          style={s.textInput}
        />

        {showMic ? (
          <Pressable
            onPress={onToggleRecord}
            style={[s.sendButton, isRecording ? s.recordingActive : s.sendInactive]}
          >
            {isRecording ? (
              <Square size={16} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Mic size={18} color="#8E8E93" />
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={onSend}
            disabled={!canSend}
            style={[s.sendButton, canSend ? s.sendActive : s.sendInactive]}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ArrowUp size={18} color={canSend ? "#000000" : "#71717A"} />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  inputBarWrapper: {
    backgroundColor: "#000000",
    paddingHorizontal: 12,
    paddingTop: 8,
    width: "100%",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 24,
    backgroundColor: "#1C1C1E",
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    paddingHorizontal: 4,
    paddingVertical: 6,
    fontSize: 15,
    color: "#FFFFFF",
    fontFamily: TOKENS.font.body,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  sendActive: {
    backgroundColor: "#FFFFFF",
  },
  sendInactive: {
    backgroundColor: "transparent",
  },
  recordingActive: {
    backgroundColor: "#EF4444",
  },
});
