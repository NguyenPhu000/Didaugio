export const NOTIFICATION_GROUPS = [
  {
    title: "EMAIL",
    key: "email",
    toggles: [
      ["bookingConfirmed", "profile.notifications.bookingConfirmed"],
      ["bookingCancelled", "profile.notifications.bookingCancelled"],
      ["bookingPending", "profile.notifications.bookingPending"],
      ["newReview", "profile.notifications.newReview"],
      ["paymentReceived", "profile.notifications.paymentReceived"],
      ["systemAlerts", "profile.notifications.systemAlerts"],
    ],
  },
  {
    title: "PUSH",
    key: "push",
    toggles: [
      ["bookingConfirmed", "profile.notifications.bookingConfirmed"],
      ["bookingCancelled", "profile.notifications.bookingCancelled"],
      ["newReview", "profile.notifications.newReview"],
      ["systemAlerts", "profile.notifications.systemAlerts"],
    ],
  },
];

export const DEFAULT_NOTIFICATIONS = {
  email: {
    bookingConfirmed: true,
    bookingCancelled: true,
    bookingPending: true,
    newReview: true,
    paymentReceived: true,
    systemAlerts: true,
  },
  push: {
    bookingConfirmed: true,
    bookingCancelled: true,
    newReview: false,
    systemAlerts: false,
  },
};

export const getInitials = (name, email) => {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email?.charAt(0).toUpperCase() || "U";
};
