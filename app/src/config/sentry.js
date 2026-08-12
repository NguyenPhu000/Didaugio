import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";
import { getSentryOptions } from "./sentryConfig";

const appSlug = Constants.expoConfig?.slug || "ipointgenie-app";
const appVersion =
  Constants.nativeAppVersion || Constants.expoConfig?.version || "unknown";

const options = getSentryOptions({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.EXPO_PUBLIC_APP_ENV || process.env.NODE_ENV,
  release: `${appSlug}@${appVersion}`,
});

export const isSentryEnabled = Boolean(options);

if (options) Sentry.init(options);
