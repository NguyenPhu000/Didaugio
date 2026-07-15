import { ActivityIndicator, Pressable, TextInput, View } from "react-native";
import Animated from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIconsRounded } from "../../../../components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../../constants/design-tokens";

export function AIPlannerComposer({
  animatedInputBarStyle,
  canSend,
  handleSend,
  handleVoicePress,
  inputRef,
  inputText,
  isLoading,
  setInputText,
  t,
  voiceStatus,
}) {
  return (
    <Animated.View
      style={[animatedInputBarStyle]}
      className="w-full bg-transparent px-3"
    >
      <View
        className="mb-1 flex-row items-end gap-2 rounded-[28px] border border-slate-200 bg-white px-3 py-2"
        style={{ boxShadow: "0 10px 30px rgba(15, 23, 42, 0.10)" }}
      >
        <TextInput
          ref={inputRef}
          placeholder={t("aiPlanner.inputPlaceholder")}
          placeholderTextColor="#94A3B8"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          className="min-h-[38px] max-h-[120px] flex-1 px-2 py-1.5 text-[15px] text-slate-800"
          style={{ fontFamily: TOKENS.font.body, textAlignVertical: "center" }}
        />

        <Pressable
          onPress={handleVoicePress}
          disabled={isLoading}
          className={`h-9 w-9 items-center justify-center rounded-full ${
            voiceStatus === "listening" ? "bg-cyan-500" : "bg-slate-100"
          }`}
        >
          <MaterialIconsRounded
            name={
              voiceStatus === "listening" || voiceStatus === "speaking"
                ? "graphic-eq"
                : "mic"
            }
            size={18}
            color={
              voiceStatus === "listening"
                ? "#FFFFFF"
                : voiceStatus === "speaking"
                  ? "#10B981"
                  : "#64748B"
            }
          />
        </Pressable>

        <Pressable
          onPress={() => handleSend()}
          disabled={!canSend}
          style={{ overflow: "hidden" }}
          className="h-9 w-9 items-center justify-center rounded-full"
        >
          {canSend ? (
            <LinearGradient
              colors={["#2563EB", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIconsRounded
                  name="arrow-upward"
                  size={18}
                  color="#FFFFFF"
                />
              )}
            </LinearGradient>
          ) : (
            <View className="h-full w-full items-center justify-center bg-slate-100">
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIconsRounded
                  name="arrow-upward"
                  size={18}
                  color="#94A3B8"
                />
              )}
            </View>
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}
