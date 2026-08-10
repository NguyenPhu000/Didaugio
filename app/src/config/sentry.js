import * as Sentry from "@sentry/react-native";
import { getSentryOptions } from "./sentryConfig";

const options = getSentryOptions({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.EXPO_PUBLIC_APP_ENV || process.env.NODE_ENV,
});

export const isSentryEnabled = Boolean(options);

if (options) Sentry.init(options);
