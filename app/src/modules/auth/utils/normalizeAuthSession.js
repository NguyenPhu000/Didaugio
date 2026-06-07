import i18n from "@/i18n";

const pickFirstString = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
};

const pickFirstObject = (...values) => {
  for (const value of values) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value;
    }
  }
  return null;
};

const parsePayloadErrorMessage = (payload) => {
  if (!payload) return null;

  if (typeof payload === "string") {
    const text = payload.trim();
    if (!text) return null;

    const htmlLike = /<!doctype html|<html[\s>]/i.test(text);
    const expoLike = /expo-router\/entry\.bundle|id="expo-reset"/i.test(text);

    if (htmlLike || expoLike) {
      return i18n.t("authValidation.apiPointingToExpo");
    }

    return null;
  }

  const level1 = pickFirstObject(
    payload?.data,
    payload?.result,
    payload?.session,
    payload,
  );

  return pickFirstString(
    level1?.message,
    level1?.error,
    level1?.errorMessage,
    payload?.message,
    payload?.error,
    payload?.errorMessage,
  );
};

export function normalizeAuthSessionResponse(raw) {
  const level1 = pickFirstObject(raw?.data, raw?.result, raw?.session, raw);
  const level2 = pickFirstObject(
    level1?.data,
    level1?.result,
    level1?.session,
    level1,
  );

  const accessToken = pickFirstString(
    level2?.accessToken,
    level2?.access_token,
    level2?.token,
    level2?.jwt,
    level2?.access?.token,
  );

  const refreshToken = pickFirstString(
    level2?.refreshToken,
    level2?.refresh_token,
    level2?.refresh?.token,
  );

  const user = pickFirstObject(
    level2?.user,
    level2?.account,
    level2?.profile,
    level1?.user,
  );

  const errorMessage = parsePayloadErrorMessage(raw);

  return { accessToken, refreshToken, user, raw: level2, errorMessage };
}
