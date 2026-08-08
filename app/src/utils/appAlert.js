import { useAlertStore } from "../stores/alertStore";
import i18n from "../i18n";

const ALERT_TYPE_KEYWORDS = {
  error: [
    "error",
    "failed",
    "failure",
    "lỗi",
    "thất bại",
    "không thể",
    "missing",
    "required",
  ],
  success: [
    "success",
    "saved",
    "deleted",
    "completed",
    "thành công",
    "đã lưu",
    "đã xóa",
    "hoàn tất",
  ],
  warning: ["warning", "cảnh báo", "chú ý", "lưu ý"],
};

function inferAlertType(title, message, buttons) {
  if (Array.isArray(buttons) && buttons.length > 1) return "confirm";

  const combinedText = `${title || ""} ${message || ""}`.toLowerCase();
  for (const [type, keywords] of Object.entries(ALERT_TYPE_KEYWORDS)) {
    if (keywords.some((keyword) => combinedText.includes(keyword))) return type;
  }

  return "info";
}

export function showAppAlert({ title, message, type = "info", buttons = [], options = {} }) {
  const resolvedButtons = buttons.length > 0
    ? buttons
    : [{ text: i18n.t("common.close"), style: "default" }];

  useAlertStore.getState().showAlert({
    title,
    message,
    type,
    buttons: resolvedButtons.map((button) => ({
      ...button,
      onPress: () => {
        useAlertStore.getState().hideAlert();
        return button.onPress?.();
      },
    })),
    options,
  });
}

/**
 * Explicit compatibility adapter for legacy native alert call sites.
 * It keeps the native call signature while routing every dialog through the
 * shared in-app modal, so screens do not need a global React Native patch.
 */
export function showAppAlertLegacy(title, message, buttons = [], options = {}) {
  showAppAlert({
    title,
    message,
    type: inferAlertType(title, message, buttons),
    buttons: Array.isArray(buttons) ? buttons : [],
    options,
  });
}
