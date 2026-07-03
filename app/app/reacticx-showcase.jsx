import React from "react";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIconsRounded } from "../src/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../src/constants/design-tokens";
import { Glow } from "../src/components/reacticx/glow";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionThemes,
  AccordionTrigger,
} from "../src/components/reacticx/accordion";
import Dropdown from "../src/components/reacticx/dropdown";
import { BlurCarousel } from "../src/components/reacticx/blur-carousel";
import { CinematicCarousel } from "../src/components/reacticx/cinematic-carousel";
import VerticalFlowCarousel from "../src/components/reacticx/vertical-flow-carousel";
import { VerticalPageCarousel } from "../src/components/reacticx/vertical-page-carousel";
import { FlipCard } from "../src/components/reacticx/flip-card";
import { ParallaxCarousel } from "../src/components/reacticx/parallax-carousel";

const demoCards = [
  { id: "ai", title: "Nhi AI", tone: "#2563EB", body: "Chat, voice, itinerary" },
  { id: "trip", title: "Trip", tone: "#10B981", body: "Preview, route, places" },
  { id: "business", title: "Business", tone: "#F97316", body: "Plan, payment, places" },
];

function DemoCard({ item, compact = false }) {
  return (
    <View
      style={{
        width: compact ? "100%" : 230,
        minHeight: compact ? 88 : 150,
        borderRadius: 22,
        overflow: "hidden",
        backgroundColor: "#0F172A",
        boxShadow: "0 16px 38px rgba(15, 23, 42, 0.14)",
      }}
    >
      <LinearGradient
        colors={[item.tone, "#111827"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, padding: 18, justifyContent: "flex-end" }}
      >
        <Text style={{ color: "white", fontSize: 18, fontFamily: TOKENS.font.semibold }}>
          {item.title}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.72)", marginTop: 4, fontFamily: TOKENS.font.body }}>
          {item.body}
        </Text>
      </LinearGradient>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: "#0F172A", fontSize: 17, fontFamily: TOKENS.font.semibold }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function ReacticxShowcase() {
  const { width } = useWindowDimensions();
  const pageHeight = Math.min(360, Math.max(280, width * 0.86));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      contentContainerStyle={{ padding: 18, paddingTop: 28, paddingBottom: 60, gap: 28 }}
    >
      <View style={{ gap: 6 }}>
        <Text style={{ color: "#020617", fontSize: 26, fontFamily: TOKENS.font.heading }}>
          Reacticx lab
        </Text>
        <Text style={{ color: "#64748B", fontSize: 14, lineHeight: 20, fontFamily: TOKENS.font.body }}>
          Internal preview for adapted Reacticx components before production rollout.
        </Text>
      </View>

      <Section title="Glow">
        <Glow radius={24} color="#2563EB" secondaryColor="#DB2777" style="breathe">
          <View style={{ borderRadius: 24, backgroundColor: "#020617", padding: 18 }}>
            <Text style={{ color: "white", fontSize: 18, fontFamily: TOKENS.font.semibold }}>
              Voice assistant highlight
            </Text>
            <Text style={{ color: "#CBD5E1", marginTop: 5, fontFamily: TOKENS.font.body }}>
              Used on the Nhi AI avatar now.
            </Text>
          </View>
        </Glow>
      </Section>

      <Section title="Accordion">
        <Accordion theme={AccordionThemes.light}>
          <AccordionItem value="trip">
            <AccordionTrigger>
              <Text style={{ color: "#0F172A", fontFamily: TOKENS.font.semibold }}>
                Trip flow
              </Text>
            </AccordionTrigger>
            <AccordionContent>
              <Text style={{ color: "#475569", lineHeight: 20, fontFamily: TOKENS.font.body }}>
                Preview route first, then start navigation with clear pause and stop controls.
              </Text>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      <Section title="Dropdown">
        <Dropdown>
          <Dropdown.Trigger
            style={{
              alignSelf: "flex-start",
              borderRadius: 18,
              backgroundColor: "#0F172A",
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialIconsRounded name="tune" size={17} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontFamily: TOKENS.font.semibold }}>
                Filter mode
              </Text>
            </View>
          </Dropdown.Trigger>
          <Dropdown.Content>
            {["Hot places", "Saved first", "Near me"].map((label) => (
              <Dropdown.Item key={label} onPress={() => {}}>
                <Text style={{ color: "#111827", fontFamily: TOKENS.font.medium }}>
                  {label}
                </Text>
              </Dropdown.Item>
            ))}
          </Dropdown.Content>
        </Dropdown>
      </Section>

      <Section title="Blur carousel">
        <BlurCarousel
          data={demoCards}
          itemWidth={230}
          horizontalSpacing={0}
          renderItem={({ item }) => <DemoCard item={item} />}
        />
      </Section>

      <Section title="Cinematic carousel">
        <CinematicCarousel
          data={demoCards}
          itemWidth={230}
          horizontalSpacing={0}
          renderItem={({ item }) => <DemoCard item={item} />}
        />
      </Section>

      <Section title="Vertical flow carousel">
        <View style={{ height: 300 }}>
          <VerticalFlowCarousel
            data={demoCards}
            itemHeight={92}
            spacing={18}
            renderItem={(item) => <DemoCard item={item} compact />}
          />
        </View>
      </Section>

      <Section title="Vertical page carousel">
        <View style={{ height: pageHeight, overflow: "hidden", borderRadius: 24 }}>
          <VerticalPageCarousel
            data={demoCards}
            itemHeight={pageHeight * 0.78}
            cardSpacing={18}
            useBlur={false}
            renderItem={({ item }) => <DemoCard item={item} compact />}
          />
        </View>
      </Section>

      <Section title="Flip card">
        <FlipCard
          style={{ height: 180, borderRadius: 20, overflow: "hidden" }}
          front={
            <View style={{ flex: 1, borderRadius: 20, overflow: "hidden", backgroundColor: "#1e3a5f", justifyContent: "center", alignItems: "center", padding: 20 }}>
              <MaterialIconsRounded name="flip" size={40} color="#FFFFFF" />
              <Text style={{ color: "#FFF", fontSize: 20, fontFamily: TOKENS.font.bold, marginTop: 12 }}>Banner Title</Text>
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: TOKENS.font.medium, marginTop: 4 }}>Chạm để xem chi tiết</Text>
            </View>
          }
          back={
            <View style={{ flex: 1, borderRadius: 20, overflow: "hidden", backgroundColor: "#1C1C1E", padding: 20, justifyContent: "center" }}>
              <Text style={{ color: "#FFF", fontSize: 18, fontFamily: TOKENS.font.bold, marginBottom: 8 }}>Banner Info</Text>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 20, fontFamily: TOKENS.font.medium }}>
                Đây là nội dung chi tiết của banner. Lật thẻ để quay lại.
              </Text>
            </View>
          }
        />
      </Section>

      <Section title="Parallax carousel">
        <ParallaxCarousel
          data={demoCards}
          itemWidth={width}
          itemHeight={220}
          spacing={24}
          parallaxIntensity={0.3}
          renderItem={({ item }) => <DemoCard item={item} />}
        />
      </Section>

      <Pressable
        style={{
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 18,
          paddingVertical: 14,
          backgroundColor: "#111827",
        }}
      >
        <Text style={{ color: "#FFFFFF", fontFamily: TOKENS.font.semibold }}>
          Showcase only
        </Text>
      </Pressable>
    </ScrollView>
  );
}
