/**
 * Ánh xạ maneuver của OSRM sang nhãn tiếng Việt + icon MaterialIcons.
 */
import i18n from "../../../i18n";
import { hasPassedManeuver } from "./routeEngine";

const MODIFIER_LABELS = {
  left: i18n.t("maneuver.left"),
  right: i18n.t("maneuver.right"),
  "slight left": i18n.t("maneuver.slightLeft"),
  "slight right": i18n.t("maneuver.slightRight"),
  "sharp left": i18n.t("maneuver.sharpLeft"),
  "sharp right": i18n.t("maneuver.sharpRight"),
  straight: i18n.t("maneuver.straight"),
  uturn: i18n.t("maneuver.uturn"),
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
  const road = step?.name ? ` ${step.name}` : "";

  switch (type) {
    case "depart":
      return step?.name ? i18n.t("maneuver.depart", { road: step.name }) : i18n.t("maneuver.startMoving");
    case "arrive":
      return i18n.t("maneuver.arrived");
    case "roundabout":
    case "rotary":
      return i18n.t("maneuver.roundabout", { road });
    case "merge":
      return i18n.t("maneuver.merge", { road });
    case "fork":
      return i18n.t("maneuver.fork", { road: MODIFIER_LABELS[modifier] || "" }).trim() + road;
    case "continue":
      return i18n.t("maneuver.continueStraight", { road });
    case "turn":
    case "end of road":
    default: {
      const dir = MODIFIER_LABELS[modifier];
      if (modifier === "straight") return i18n.t("maneuver.goStraight", { road });
      if (modifier === "uturn") return i18n.t("maneuver.makeUturn", { road });
      if (dir) return i18n.t("maneuver.turn", { dir, road });
      return step?.name ? i18n.t("maneuver.continue", { road }) : i18n.t("maneuver.continueMoving");
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
 * @param {{ currentHeading?: number }} options
 */
export function pickUpcomingStep(steps, location, distanceFn, options = {}) {
  if (!Array.isArray(steps) || steps.length === 0) return null;
  if (!location) return steps[0];

  const PASSED_RADIUS_M = 25;
  const currentHeading = options.currentHeading ?? location.heading;
  let best = null;
  let bestDist = Number.POSITIVE_INFINITY;

  for (const step of steps) {
    const loc = step?.maneuver?.location;
    if (!Array.isArray(loc) || loc.length < 2) continue;
    const [lng, lat] = loc;
    const maneuverPoint = { lat, lng };
    const bearingAfter = Number(step?.maneuver?.bearing_after);
    if (
      hasPassedManeuver(
        location,
        maneuverPoint,
        Number.isFinite(bearingAfter) ? bearingAfter : null,
        currentHeading,
      )
    ) {
      continue;
    }

    const d = distanceFn(location.latitude, location.longitude, lat, lng);
    if (!Number.isFinite(currentHeading) && d <= PASSED_RADIUS_M) continue;
    if (d < bestDist) {
      bestDist = d;
      best = step;
    }
  }

  return best || steps[steps.length - 1];
}
