import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import i18n from "@/i18n";
import { useAuthStore } from "../../../stores/authStore";
import { loginGoogleApi } from "../api/authApi";
import { normalizeAuthSessionResponse } from "../utils/normalizeAuthSession";

WebBrowser.maybeCompleteAuthSession();

const buildLoginError = (message, code) => ({ message, code });
const FALLBACK_ANDROID_CLIENT_ID =
  "missing-google-client-id.apps.googleusercontent.com";
const AUTH_DEBUG = __DEV__ && process.env.EXPO_PUBLIC_AUTH_DEBUG === "true";
const CALLBACK_TIMEOUT_MS = 30000;

const debugLog = (label, payload) => {
  if (!AUTH_DEBUG) return;
  console.log(`[GoogleAuth] ${label}`, payload);
};

const parseIdTokenFromUrl = (url) => {
  if (!url) return null;
  const [baseUrl, fragment = ""] = url.split("#");
  const parsed = Linking.parse(baseUrl);
  const query = parsed?.queryParams || {};
  if (typeof query.id_token === "string" && query.id_token) {
    return query.id_token;
  }
  return new URLSearchParams(fragment).get("id_token");
};

export function useGoogleLogin() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const callbackHandledRef = useRef(false);
  const finishingRef = useRef(false);
  const timeoutRef = useRef(null);

  const isExpoGo =
    Constants.executionEnvironment === "storeClient" ||
    Constants.appOwnership === "expo";

  const googleConfig = useMemo(() => {
    const owner =
      Constants.expoConfig?.owner || process.env.EXPO_PUBLIC_EXPO_OWNER || "";
    const slug =
      Constants.expoConfig?.slug || process.env.EXPO_PUBLIC_EXPO_SLUG || "";

    const hasProxyProject = Boolean(owner && slug);
    const projectNameForProxy = hasProxyProject ? `@${owner}/${slug}` : "";
    const proxyRedirectUri = hasProxyProject
      ? `https://auth.expo.io/${projectNameForProxy}`
      : undefined;
    const appScheme = Constants.expoConfig?.scheme || "didaugio";
    const nativeRedirectUri = makeRedirectUri({ scheme: appScheme });
    const redirectUri = isExpoGo ? proxyRedirectUri : nativeRedirectUri;

    const webClientId = (
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || ""
    ).trim();
    const androidClientIdEnv = (
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || ""
    ).trim();
    const iosClientId = (
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || ""
    ).trim();

    const androidClientId = isExpoGo
      ? webClientId
      : androidClientIdEnv || webClientId;

    return {
      owner,
      slug,
      projectNameForProxy,
      hasProxyProject,
      redirectUri,
      expoClientId: webClientId,
      webClientId,
      // Android always requires a client id at hook creation time.
      androidClientId: androidClientId || FALLBACK_ANDROID_CLIENT_ID,
      iosClientId: iosClientId || undefined,
      scopes: ["openid", "profile", "email"],
      selectAccount: true,
      responseType: "id_token",
    };
  }, [isExpoGo]);

  const clearCallbackTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startCallbackTimeout = useCallback(() => {
    clearCallbackTimeout();
    timeoutRef.current = setTimeout(() => {
      if (callbackHandledRef.current || finishingRef.current) return;
      setIsLoading(false);
      setError(i18n.t("authValidation.googleNoResponse"));
    }, CALLBACK_TIMEOUT_MS);
  }, [clearCallbackTimeout]);

  const [request, response, promptAsync] = Google.useAuthRequest(googleConfig);

  const finalizeGoogleSession = useCallback(
    async (idToken) => {
      if (finishingRef.current) return;

      finishingRef.current = true;
      try {
        const res = await loginGoogleApi(idToken);
        const { accessToken, refreshToken, user, errorMessage } =
          normalizeAuthSessionResponse(res);

        if (!accessToken || !user) {
          throw new Error(
            errorMessage || i18n.t("authValidation.googleInvalidSession"),
          );
        }

        await setSession({
          user,
          accessToken,
          refreshToken: refreshToken || null,
        });
        setError(null);
        router.replace("/(tabs)/map");
      } finally {
        finishingRef.current = false;
      }
    },
    [router, setSession],
  );

  useEffect(() => {
    if (!isExpoGo) return;

    const subscription = Linking.addEventListener("url", async ({ url }) => {
      if (!url || callbackHandledRef.current) return;
      const idToken = parseIdTokenFromUrl(url);
      if (!idToken) return;

      callbackHandledRef.current = true;
      setIsLoading(true);

      debugLog("deep link", { hasIdToken: true });

      try {
        clearCallbackTimeout();
        await finalizeGoogleSession(idToken);
      } catch (e) {
        const normalizedError = buildLoginError(
          e?.message || i18n.t("authValidation.loginFailed"),
          e?.code || "GOOGLE_LOGIN_FAILED",
        );
        setError(normalizedError.message);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [finalizeGoogleSession, isExpoGo]);

  useEffect(() => {
    const completeGoogleLogin = async () => {
      if (!response) return;

      debugLog("response", {
        type: response.type,
        hasAuthIdToken: Boolean(response.authentication?.idToken),
        hasParamIdToken: Boolean(response.params?.id_token),
      });

      if (response.type === "cancel" || response.type === "dismiss") {
        clearCallbackTimeout();
        setIsLoading(false);
        return;
      }

      if (response.type === "error") {
        clearCallbackTimeout();
        setError(
          response.error?.description ||
            response.error?.message ||
            i18n.t("authValidation.googleFailed"),
        );
        setIsLoading(false);
        return;
      }

      if (response.type !== "success") {
        clearCallbackTimeout();
        setError(i18n.t("authValidation.googleFailedRetry"));
        setIsLoading(false);
        return;
      }

      const idToken =
        response.authentication?.idToken || response.params?.id_token || null;
      if (!idToken) {
        clearCallbackTimeout();
        setError(i18n.t("authValidation.googleNoIdToken"));
        setIsLoading(false);
        return;
      }

      callbackHandledRef.current = true;
      try {
        clearCallbackTimeout();
        await finalizeGoogleSession(idToken);
      } catch (e) {
        const normalizedError = buildLoginError(
          e?.message || i18n.t("authValidation.loginFailed"),
          e?.code || "GOOGLE_LOGIN_FAILED",
        );
        setError(normalizedError.message);
      } finally {
        setIsLoading(false);
      }
    };

    completeGoogleLogin();
  }, [clearCallbackTimeout, finalizeGoogleSession, response]);

  useEffect(() => {
    return () => {
      clearCallbackTimeout();
    };
  }, [clearCallbackTimeout]);

  const login = async () => {
    setError(null);

    if (!googleConfig.webClientId) {
      setError(i18n.t("authValidation.googleMissingConfig"));
      return;
    }

    if (isExpoGo && !googleConfig.hasProxyProject) {
      setError(
        i18n.t("authValidation.googleMissingOwner"),
      );
      return;
    }

    if (!request) {
      setError(i18n.t("authValidation.googleNotReady"));
      return;
    }

    setIsLoading(true);
    callbackHandledRef.current = false;

    try {
      const promptOptions = { showInRecents: true };

      if (isExpoGo) {
        startCallbackTimeout();
        const returnUrl = makeRedirectUri({ path: "login" });
        const proxyStartUrl = `${googleConfig.redirectUri}/start?authUrl=${encodeURIComponent(request.url)}&returnUrl=${encodeURIComponent(returnUrl)}`;

        debugLog("proxy start", { returnUrl });

        const result = await promptAsync({
          ...promptOptions,
          url: proxyStartUrl,
        });

        if (result.type === "cancel" || result.type === "dismiss") {
          clearCallbackTimeout();
          setIsLoading(false);
          return;
        }

        if (result.type === "error") {
          clearCallbackTimeout();
          setError(result.error?.message || "Đăng nhập Google thất bại.");
          setIsLoading(false);
          return;
        }

        return;
      }

      const result = await promptAsync(promptOptions);
      if (result.type === "cancel" || result.type === "dismiss") {
        clearCallbackTimeout();
        setIsLoading(false);
      }
    } catch (e) {
      clearCallbackTimeout();
      const normalizedError = buildLoginError(
        e?.message || i18n.t("authValidation.loginFailed"),
        e?.code || "GOOGLE_LOGIN_FAILED",
      );
      setError(normalizedError.message);
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
}
