import { View, Text, Pressable, StyleSheet } from "react-native";
import { RefreshCw, Trash, ArrowRight } from "lucide-react-native";
import { BudgetEstimator } from "../../components/BudgetEstimator";
import { HorizontalPlaceCard } from "../../../../components/composed/HorizontalPlaceCard";
import { TOKENS } from "../../../../constants/design-tokens";
import { formatPriceRange } from "../../lib/chatUtils";

export function InteractiveTimeline({ plan, onRemove, onSwap }) {
  if (!plan || !plan.timeline) return null;

  return (
    <View style={s.timelineContainer}>
      {/* Widget ngân sách dự toán */}
      <BudgetEstimator summary={plan.tripSummary} />

      {/* Danh sách các chặng đi */}
      {plan.timeline.map((item, index) => {
        const place = item.place;
        if (!place) return null;

        const isLast = index === plan.timeline.length - 1;

        return (
          <View key={`${place.id}-${index}`} style={s.timelineItem}>
            {/* Cột mốc thời gian bên trái */}
            <View style={s.timelineLeft}>
              <View style={s.timelineDot}>
                <Text style={s.timelineDotText}>{item.timeSlot[0]}</Text>
              </View>
              {!isLast && <View style={s.timelineLine} />}
            </View>

            {/* Chi tiết nội dung bên phải */}
            <View style={s.timelineRight}>
              <View style={s.timelineCard}>
                <View style={s.timelineCardHeader}>
                  <View style={s.timelineCardInfo}>
                    <Text style={s.timelineTimeSlot} selectable>
                      {item.timeSlot}
                    </Text>
                    <Text style={s.timelinePlaceName} selectable>
                      {place.name}
                    </Text>
                    {/* Hiển thị khoảng giá */}
                    {(place.priceFrom > 0 || place.priceTo > 0) && (
                      <Text style={s.timelinePrice} selectable>
                        {formatPriceRange(place.priceFrom, place.priceTo)}
                      </Text>
                    )}
                  </View>

                  {/* Nút hành động tương tác Swap / Remove */}
                  <View style={s.timelineActions}>
                    {!isLast && (
                      <Pressable
                        onPress={() => onSwap(index)}
                        style={s.swapButton}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <RefreshCw size={11} color="#71717A" />
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => onRemove(index)}
                      style={s.removeButton}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash size={11} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>

                <Text style={s.timelineReason} selectable>
                  {item.reason}
                </Text>

                {/* Place Card nhỏ gọn */}
                <HorizontalPlaceCard place={place} />
              </View>

              {/* Đường nối di chuyển giữa hai chặng */}
              {!isLast && item.navigationToNext && (
                <View style={s.navigationCard}>
                  <ArrowRight size={12} color="rgba(255,255,255,0.4)" />
                  <Text style={s.navigationText} selectable>
                    Di chuyển tiếp theo: {item.navigationToNext.distanceKm} km — ~{item.navigationToNext.durationMin} phút
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  timelineContainer: {
    width: "100%",
    marginTop: 12,
    paddingHorizontal: 4,
  },
  timelineItem: {
    flexDirection: "row",
    width: "100%",
  },
  timelineLeft: {
    alignItems: "center",
    width: 30,
    marginRight: 10,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineDotText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginTop: 4,
    marginBottom: 4,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 20,
  },
  navigationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 2,
    marginBottom: 6,
  },
  navigationText: {
    fontSize: 11.5,
    color: "rgba(255,255,255,0.5)",
    fontFamily: TOKENS.font.medium,
    flex: 1,
  },
  timelineCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  timelineCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  timelineCardInfo: {
    flex: 1,
    marginRight: 8,
  },
  timelineTimeSlot: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    fontFamily: TOKENS.font.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  timelinePlaceName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
  timelinePrice: {
    fontSize: 11,
    color: "#10B981",
    fontFamily: TOKENS.font.medium,
    marginTop: 2,
  },
  timelineActions: {
    flexDirection: "row",
    gap: 4,
  },
  swapButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  removeButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: "rgba(239,68,68,0.15)",
  },
  timelineReason: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
});
