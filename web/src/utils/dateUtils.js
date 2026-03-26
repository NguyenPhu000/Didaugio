const LOCALE = "vi-VN";

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return "—";

  try {
    return new Date(dateString).toLocaleDateString(LOCALE, {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...options,
    });
  } catch {
    return "—";
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return "—";

  try {
    return new Date(dateString).toLocaleString(LOCALE, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

export const formatDateForInput = (dateValue) => {
  if (!dateValue) return "";

  try {
    return new Date(dateValue).toISOString().split("T")[0];
  } catch {
    return "";
  }
};
