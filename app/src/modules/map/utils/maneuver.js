/**
 * Ánh xạ maneuver của OSRM sang nhãn tiếng Việt + icon MaterialIcons.
 */

const MODIFIER_LABELS = {
  left: "trái",
  right: "phải",
  "slight left": "chếch trái",
  "slight right": "chếch phải",
  "sharp left": "gắt sang trái",
  "sharp right": "gắt sang phải",
  straight: "đi thẳng",
  uturn: "quay đầu",
};

const MODIFIER_ICONS = {
  left: "turn-left",
  right: "turn-right",
  "slight left": "turn-slight-left",
  "slight right": "turn-slight-right",
  "sharp left": "turn-sharp-left",
  "sharp right": "turn-sharp-right",
  straight: "straight",
  uturn: "u-turn-left",
};

/**
 * Tạo nhãn hướng dẫn tiếng Việt từ step OSRM.
 */
export function buildManeuverLabel(step) {
  const maneuver = step?.maneuver || {};
  const type = maneuver.type || "";
  const modifier = maneuver.modifier || "";
  const road = step?.name ? ` vào ${step.name}` : "";

  switch (type) {
    case "depart":
      return step?.name ? `Xuất phát trên ${step.name}` : "Bắt đầu di chuyển";
    case "arrive":
      return "Đã đến nơi";
    case "roundabout":
    case "rotary":
      return `Đi vào vòng xuyến${road}`;
    case "merge":
      return `Nhập làn${road}`;
    case "fork":
      return `Đi theo nhánh ${MODIFIER_LABELS[modifier] || ""}`.trim() + road;
    case "continue":
      return `Tiếp tục đi thẳng${road}`;
    case "turn":
    case "end of road":
    default: {
      const dir = MODIFIER_LABELS[modifier];
      if (modifier === "straight") return `Đi thẳng${road}`;
      if (modifier === "uturn") return `Quay đầu${road}`;
      if (dir) return `Rẽ ${dir}${road}`;
      return step?.name ? `Tiếp tục${road}` : "Tiếp tục di chuyển";
    }
  }
}

/**
 * Lấy icon MaterialIcons tương ứng với maneuver.
 */
export function getManeuverIcon(step) {
  const maneuver = step?.maneuver || {};
  if (maneuver.type === "arrive") return "place";
  if (maneuver.type === "depart") return "my-location";
  if (maneuver.type === "roundabout" || maneuver.type === "rotary") {
    return "data-usage";
  }
  return MODIFIER_ICONS[maneuver.modifier] || "navigation";
}

/**
 * Chọn step kế tiếp dựa trên vị trí GPS hiện tại: step có maneuver location
 * gần nhất nhưng còn ở phía trước (> ngưỡng đã qua).
 *
 * @param {Array} steps - danh sách step của leg đầu tiên.
 * @param {{ latitude:number, longitude:number }} location
 * @param {(la,lo,la2,lo2)=>number} distanceFn - hàm Haversine.
 */
export function pickUpcomingStep(steps, location, distanceFn) {
  if (!Array.isArray(steps) || steps.length === 0) return null;
  if (!location) return steps[0];

  const PASSED_RADIUS_M = 25;
  let best = null;
  let bestDist = Number.POSITIVE_INFINITY;

  for (const step of steps) {
    const loc = step?.maneuver?.location;
    if (!Array.isArray(loc) || loc.length < 2) continue;
    const [lng, lat] = loc;
    const d = distanceFn(location.latitude, location.longitude, lat, lng);
    if (d <= PASSED_RADIUS_M) continue; // đã đi qua maneuver này
    if (d < bestDist) {
      bestDist = d;
      best = step;
    }
  }

  return best || steps[steps.length - 1];
}
