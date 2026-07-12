import { memo, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { PALETTE } from "../constants/placeSheetConstants";
import { getSpeechText, hasSpokenGuide } from "../utils/spokenGuide";
import { cn } from "../../../lib/cn";

const FAQItem = memo(function FAQItem({ faq, index, isSpeaking, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSpeaking }}
      accessibilityLabel={isSpeaking ? `Dừng câu trả lời ${index + 1}` : `Nghe câu trả lời ${index + 1}`}
      className={cn(
        "min-h-[58px] flex-row items-center gap-3 rounded-[16px] px-4 py-3 active:opacity-85",
        isSpeaking ? "bg-[#E3F6F8]" : "bg-[#F5F5F7]"
      )}
      style={{ borderCurve: "continuous" }}
    >
      <Text
        numberOfLines={2}
        className="flex-1 text-[14px] leading-5 font-semibold"
        style={{ color: PALETTE.text, fontFamily: TOKENS.font.medium }}
      >
        {faq.question}
      </Text>

      <View
        className={cn(
          "h-9 w-9 items-center justify-center rounded-full",
          isSpeaking ? "bg-[#087E8B]" : "bg-white"
        )}
        style={!isSpeaking ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        } : null}
      >
        <MaterialIconsRounded
          name={isSpeaking ? "pause" : "play-arrow"}
          size={21}
          color={isSpeaking ? "#FFFFFF" : "#087E8B"}
        />
      </View>
    </Pressable>
  );
});

function SpokenGuideSection({ activeSpeechKey, guide, onSpeak }) {
  const faqs = useMemo(
    () => (guide?.faqs || []).filter((faq) => faq?.question?.trim() && faq?.answer?.trim()),
    [guide?.faqs]
  );

  if (!hasSpokenGuide(guide) || faqs.length === 0) return null;

  return (
    <View className="gap-3 px-3 py-3">
      <Text
        className="text-[12px] uppercase tracking-wider px-1"
        style={{ color: PALETTE.textMuted, fontFamily: TOKENS.font.semibold }}
      >
        Có thể bạn muốn biết
      </Text>
      
      <View className="gap-2">
        {faqs.map((faq, index) => (
          <FAQItem
            key={faq.id || `${faq.question}-${index}`}
            faq={faq}
            index={index}
            isSpeaking={activeSpeechKey === `faq-${index}`}
            onPress={() => onSpeak?.(`faq-${index}`, getSpeechText({ ...guide, faqs }, index))}
          />
        ))}
      </View>
    </View>
  );
}

const MemoizedSpokenGuideSection = memo(SpokenGuideSection);
MemoizedSpokenGuideSection.displayName = "SpokenGuideSection";

export default MemoizedSpokenGuideSection;
