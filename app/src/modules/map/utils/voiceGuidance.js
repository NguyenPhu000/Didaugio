import * as Speech from "expo-speech";
import safeAsyncStorage from "../../../utils/safeAsyncStorage";

const VOICE_MUTED_KEY = "didaugio:navigation:voice-muted";
const SPEAK_DEBOUNCE_MS = 10_000;
const CACHE_MAX_AGE_MS = 60_000;
const CACHE_MAX_ENTRIES = 100;

const TTS_REPLACEMENTS = Object.freeze({
  "Đ.": "Đường",
  "đ.": "đường",
  QL: "Quốc lộ",
  ql: "quốc lộ",
  "Q.": "Quận",
  "q.": "quận",
  "P.": "Phường",
  "p.": "phường",
  "TP.": "Thành phố",
  "tp.": "thành phố",
  BX: "Bến xe",
  CV: "Công viên",
  BV: "Bệnh viện",
  DH: "Đại học",
  "Ng.": "Ngõ",
});

let lastSpokenAtByKey = new Map();

function pruneVoiceCache() {
  if (lastSpokenAtByKey.size <= CACHE_MAX_ENTRIES) return;
  const cutoff = Date.now() - CACHE_MAX_AGE_MS;
  for (const [key, timestamp] of lastSpokenAtByKey) {
    if (timestamp < cutoff) {
      lastSpokenAtByKey.delete(key);
    }
  }
}

export function sanitizeTextForTTS(text) {
  if (!text) return "";
  let sanitized = String(text);
  Object.entries(TTS_REPLACEMENTS).forEach(([from, to]) => {
    sanitized = sanitized.replaceAll(from, to);
  });
  return sanitized.replace(/\s+/g, " ").trim();
}

export async function getVoiceMutedPreference() {
  const value = await safeAsyncStorage.getItem(VOICE_MUTED_KEY);
  return value === "true";
}

export async function setVoiceMutedPreference(isMuted) {
  await safeAsyncStorage.setItem(VOICE_MUTED_KEY, isMuted ? "true" : "false");
}

export async function speakNavigationInstruction(text, options = {}) {
  const {
    key = text,
    isMuted = false,
    speedKmh = 0,
    language = "vi-VN",
  } = options;
  const sanitized = sanitizeTextForTTS(text);
  if (!sanitized || isMuted) return false;

  const now = Date.now();
  const lastSpokenAt = lastSpokenAtByKey.get(key) ?? 0;
  if (now - lastSpokenAt < SPEAK_DEBOUNCE_MS) return false;

  lastSpokenAtByKey.set(key, now);
  pruneVoiceCache();
  const volume = Number(speedKmh) > 30 ? 1 : 0.85;
  Speech.speak(sanitized, {
    language,
    pitch: 1,
    rate: 0.96,
    volume,
  });
  return true;
}

export function resetVoiceGuidanceDebounce() {
  lastSpokenAtByKey = new Map();
}

export function stopSpeech() {
  Speech.stop();
}
