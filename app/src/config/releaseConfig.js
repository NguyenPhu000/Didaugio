import { getLegalUrls } from "./legalUrls";
import { isValidSentryDsn } from "./sentryConfig";

export function assertReleaseConfig({
  buildProfile = process.env.EAS_BUILD_PROFILE,
  legalBaseUrl = process.env.EXPO_PUBLIC_LEGAL_BASE_URL,
  sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN,
} = {}) {
  if (buildProfile !== "production") return;

  if (!getLegalUrls(legalBaseUrl)) {
    throw new Error(
      "EXPO_PUBLIC_LEGAL_BASE_URL must be a public HTTPS legal site for production builds.",
    );
  }

  if (!isValidSentryDsn(sentryDsn)) {
    throw new Error(
      "EXPO_PUBLIC_SENTRY_DSN must be configured for production crash reporting.",
    );
  }
}
