import { memo, useCallback } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { EventCard, EVENT_CARD_W } from "./EventCard";
import { SectionHeading } from "./cinematic";
import { EXPLORE_THEME as C } from "./exploreTheme";

const ITEM_LENGTH = EVENT_CARD_W + 14;

function EventSectionInner({ events, onPressEvent, onPressViewAll }) {
  const { t } = useTranslation();
  const renderItem = useCallback(({ item }) => <EventCard event={item} onPress={() => onPressEvent(item)} />, [onPressEvent]);
  if (!events?.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <SectionHeading
          title={t("explore.event.communityEvents")}
          right={onPressViewAll ? (
            <Pressable onPress={onPressViewAll} accessibilityRole="button" accessibilityLabel={t("explore.event.viewAll")} style={styles.viewAll}>
              <Text style={styles.viewAllText}>{t("explore.event.viewAll")}</Text>
            </Pressable>
          ) : null}
        />
        <Text style={styles.subtitle}>{t("explore.event.subtitle")}</Text>
      </View>
      <FlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={(item, index) => item?.id != null ? String(item.id) : `event-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_LENGTH}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: ITEM_LENGTH, offset: ITEM_LENGTH * index, index })}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 30 },
  header: { paddingHorizontal: C.spacing, marginBottom: 14 },
  subtitle: { marginTop: 3, fontFamily: C.font.body, fontSize: 12, lineHeight: 18, color: C.muted },
  viewAll: { minHeight: 44, justifyContent: "center" },
  viewAllText: { color: C.river, fontFamily: C.font.semibold, fontSize: 12 },
  list: { paddingHorizontal: C.spacing, paddingBottom: 2 },
});

export const EventSection = memo(EventSectionInner);
