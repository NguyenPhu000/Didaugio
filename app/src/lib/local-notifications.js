import Constants from "expo-constants";

const isExpoGo =
  Constants?.executionEnvironment === "storeClient" ||
  Constants?.appOwnership === "expo";

let Notifications = null;
if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications");
  } catch {
    // expo-notifications chưa khả dụng — local notification sẽ bị bỏ qua.
  }
}

// Cache trigger types để tránh gọi khi Notifications = null
let TriggerTypes = null;
if (Notifications) {
  TriggerTypes = Notifications.SchedulableTriggerInputTypes;
}

/**
 * Bắn thông báo nội bộ ngay lập tức. No-op nếu môi trường không hỗ trợ.
 */
export async function sendLocalNotification({ title, body, data = {} }) {
  if (!Notifications) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: "default" },
      trigger: {
        type: TriggerTypes.TIME_INTERVAL,
        seconds: 1,
      },
    });
  } catch {
    return null;
  }
}

/**
 * Lên lịch thông báo nội bộ tại một mốc thời gian cụ thể.
 *
 * @param {{ title, body, date: Date, data?: object }} params
 * @returns {Promise<string|null>} identifier để có thể hủy về sau, hoặc null.
 */
export async function scheduleLocalNotificationAt({
  title,
  body,
  date,
  data = {},
}) {
  if (!Notifications || !(date instanceof Date)) return null;
  if (date.getTime() <= Date.now()) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: "default" },
      trigger: {
        type: TriggerTypes.DATE,
        date,
      },
    });
  } catch {
    return null;
  }
}

/**
 * Hủy một thông báo đã lên lịch theo identifier.
 */
export async function cancelScheduledNotification(identifier) {
  if (!Notifications || !identifier) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // Bỏ qua lỗi hủy thông báo.
  }
}
