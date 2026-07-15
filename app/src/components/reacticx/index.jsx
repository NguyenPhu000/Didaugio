import React, { useCallback, useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, LayoutAnimation, UIManager } from "react-native";
import { GiftedChat, Bubble } from "react-native-gifted-chat";
import { useHeaderHeight } from "@react-navigation/elements";
import { StreamingText } from "./streaming-text";
import { InputBar } from "./input-bar";
import { EmptyChipGrid } from "./empty-chat-options";
import { ChatHeader } from "./header";

const isNewArchitectureEnabled = global?.nativeFabricUIManager != null;
if (
  Platform.OS === "android" &&
  !isNewArchitectureEnabled &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const BOT_REPLIES = [
  "That's interesting! Tell me more about your travel plans.",
  "I understand! Let me help you find the perfect destination.",
  "Great question! Here are some suggestions for your trip...",
  "I'd be happy to help you plan an amazing journey!",
  "That's a wonderful idea! Let me look into that for you.",
  "Based on your preferences, I think you'll love these options!",
];

const SUGGESTIONS = [
  { text: "Surprise me", icon: "sparkles" },
  { text: "Plan a trip", icon: "map" },
  { text: "Find restaurants", icon: "restaurant" },
  { text: "Nearby attractions", icon: "location" },
];

export default function ChatV1() {
  const [messages, setMessages] = useState([]);
  const [streamingIds] = useState(() => new Set());
  const headerHeight = useHeaderHeight();
  const botTimeoutRef = useRef();

  const hasMessages = messages.length > 0;

  useEffect(() => {
    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    };
  }, []);

  const onSend = useCallback((text) => {
    if (!text?.trim()) return;

    const userMsg = {
      _id: Date.now().toString(),
      text: text.trim(),
      createdAt: new Date(),
      user: { _id: 1 },
    };

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages((prev) => GiftedChat.append(prev, [userMsg]));

    const botId = `bot-${Date.now()}`;
    const replyIndex = Number.parseInt(botId.slice(-6), 10) % BOT_REPLIES.length;
    const reply = BOT_REPLIES[replyIndex];
    streamingIds.add(botId);

    botTimeoutRef.current = setTimeout(() => {
      const botMessage = {
        _id: botId,
        text: reply,
        createdAt: new Date(),
        user: { _id: 2, name: "AI Assistant" },
      };
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages((prev) => GiftedChat.append(prev, [botMessage]));
      streamingIds.delete(botId);
    }, 2000);
  }, [streamingIds]);

  const handleSuggestion = useCallback((text) => {
    onSend(text);
  }, [onSend]);

  const renderBubble = useCallback((props) => {
    const isBot = props.currentMessage?.user?._id === 2;
    const isStreaming = streamingIds.has(props.currentMessage?._id);

    if (isBot && isStreaming) {
      return (
        <View style={styles.streamingBubble}>
          <StreamingText
            text={props.currentMessage?.text || ""}
            style={styles.streamingText}
          />
        </View>
      );
    }

    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: { backgroundColor: "#2C2C2E", borderRadius: 18, borderBottomLeftRadius: 4 },
          right: { backgroundColor: "#0A84FF", borderRadius: 18, borderBottomRightRadius: 4 },
        }}
        textStyle={{
          left: { color: "#FFFFFF", fontSize: 15, lineHeight: 20 },
          right: { color: "#FFFFFF", fontSize: 15, lineHeight: 20 },
        }}
        timeTextStyle={{
          left: { color: "rgba(255,255,255,0.5)", fontSize: 11 },
          right: { color: "rgba(255,255,255,0.5)", fontSize: 11 },
        }}
      />
    );
  }, [streamingIds]);

  return (
    <View style={styles.container}>
      <ChatHeader title="AI Assistant" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={headerHeight}
      >
        {!hasMessages ? (
          <View style={styles.emptyContainer}>
            <View style={styles.greetingSection}>
              <Text style={styles.greetingHello}>Hello there!</Text>
              <Text style={styles.greetingSub}>How can I help you today?</Text>
            </View>
            <EmptyChipGrid
              options={SUGGESTIONS.map((s) => ({
                ...s,
                onPress: () => handleSuggestion(s.text),
              }))}
              columns={2}
              gap={10}
            />
          </View>
        ) : (
          <GiftedChat
            messages={messages}
            onSend={(msgs) => onSend(msgs[0]?.text)}
            user={{ _id: 1 }}
            renderBubble={renderBubble}
            renderInputToolbar={() => null}
            scrollToBottom
            alwaysShowSend={false}
            bottomOffset={0}
            maxComposerHeight={120}
            renderAvatar={null}
          />
        )}

        <InputBar onSend={onSend} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  flex: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  greetingSection: {
    marginBottom: 32,
    alignItems: "center",
  },
  greetingHello: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  greetingSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    fontWeight: "400",
  },
  streamingBubble: {
    backgroundColor: "#2C2C2E",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: "80%",
    marginLeft: 0,
  },
  streamingText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 20,
  },
});
