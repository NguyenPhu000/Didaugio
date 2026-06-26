import { useCallback, useEffect, useRef, useState } from "react";
import * as Speech from "expo-speech";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { ENDPOINTS } from "../../../api/endpoints";
import apiClient from "../../../api/client";
import { AI_REQUEST_TIMEOUT } from "../../../constants/api";

const VOICE_STATUS = Object.freeze({
  IDLE: "idle",
  LISTENING: "listening",
  TRANSCRIBING: "transcribing",
  SPEAKING: "speaking",
  ERROR: "error",
});

const SILENCE_DB_THRESHOLD = -46;
const SILENCE_AUTO_STOP_MS = 1100;
const MIN_RECORDING_MS = 900;
const MAX_WAIT_FOR_SPEECH_MS = 6500;

const VOICE_RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
  numberOfChannels: 1,
  bitRate: 64000,
};

export function useNhiVoice() {
  const [status, setStatus] = useState(VOICE_STATUS.IDLE);
  const [transcript, setTranscript] = useState("");
  const [transcriptVersion, setTranscriptVersion] = useState(0);
  const [error, setError] = useState(null);
  const busyRef = useRef(false);
  const stoppingRef = useRef(false);
  const silenceStartedAtRef = useRef(null);
  const heardSpeechRef = useRef(false);
  const recorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 140);

  const transcribeAudio = useCallback(async (audioFile) => {
    if (!audioFile?.uri && !audioFile?.buffer) {
      throw new Error("Audio file is required");
    }
    if (busyRef.current) return null;

    busyRef.current = true;
    setStatus(VOICE_STATUS.TRANSCRIBING);
    setError(null);

    try {
      const form = new FormData();
      form.append("audio", {
        uri: audioFile.uri,
        name: audioFile.name || "nhi-voice.m4a",
        type: audioFile.type || "audio/m4a",
      });
      form.append("language", audioFile.language || "vi");

      const response = await apiClient.post(ENDPOINTS.ai.voiceTranscribe, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: AI_REQUEST_TIMEOUT,
      });
      const text = response?.data?.text || response?.data?.data?.text || "";
      setTranscript(text);
      setTranscriptVersion((version) => version + 1);
      setStatus(VOICE_STATUS.IDLE);
      return text;
    } catch (err) {
      setError(err?.message || "Voice transcription failed");
      setStatus(VOICE_STATUS.ERROR);
      throw err;
    } finally {
      busyRef.current = false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (busyRef.current || status === VOICE_STATUS.LISTENING) return false;

    setError(null);
    setTranscript("");
    silenceStartedAtRef.current = null;
    heardSpeechRef.current = false;
    stoppingRef.current = false;
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setStatus(VOICE_STATUS.ERROR);
      setError("VOICE_PERMISSION_DENIED");
      return false;
    }

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      interruptionMode: "doNotMix",
    });
    await recorder.prepareToRecordAsync(VOICE_RECORDING_OPTIONS);
    recorder.record({ forDuration: 45 });
    setStatus(VOICE_STATUS.LISTENING);
    return true;
  }, [recorder, status]);

  const stopRecordingAndTranscribe = useCallback(async () => {
    if (status !== VOICE_STATUS.LISTENING) return "";
    if (stoppingRef.current) return "";
    stoppingRef.current = true;

    await recorder.stop();
    const uri = recorder.uri;
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      interruptionMode: "duckOthers",
    });

    if (!uri) {
      setStatus(VOICE_STATUS.ERROR);
      setError("VOICE_EMPTY_RECORDING");
      stoppingRef.current = false;
      return "";
    }

    try {
      return await transcribeAudio({
        uri,
        name: uri.split("/").pop() || "nhi-voice.m4a",
        type: uri.endsWith(".webm") ? "audio/webm" : "audio/m4a",
        language: "vi",
      });
    } finally {
      stoppingRef.current = false;
    }
  }, [recorder, status, transcribeAudio]);

  useEffect(() => {
    if (status !== VOICE_STATUS.LISTENING || stoppingRef.current) return;

    const duration = recorderState.durationMillis || 0;
    const metering =
      typeof recorderState.metering === "number" ? recorderState.metering : null;
    const hasVoice = metering == null ? duration < MIN_RECORDING_MS : metering > SILENCE_DB_THRESHOLD;

    if (hasVoice) {
      if (duration >= MIN_RECORDING_MS) heardSpeechRef.current = true;
      silenceStartedAtRef.current = null;
      return;
    }

    if (!silenceStartedAtRef.current) {
      silenceStartedAtRef.current = Date.now();
      return;
    }

    const silentFor = Date.now() - silenceStartedAtRef.current;
    const shouldAutoStopAfterSpeech =
      heardSpeechRef.current &&
      duration >= MIN_RECORDING_MS &&
      silentFor >= SILENCE_AUTO_STOP_MS;
    const shouldStopNoSpeech = !heardSpeechRef.current && duration >= MAX_WAIT_FOR_SPEECH_MS;

    if (shouldAutoStopAfterSpeech || shouldStopNoSpeech) {
      void stopRecordingAndTranscribe();
    }
  }, [
    recorderState.durationMillis,
    recorderState.metering,
    status,
    stopRecordingAndTranscribe,
  ]);

  const speakText = useCallback(async (text) => {
    const cleanText = String(text || "").trim();
    if (!cleanText) return;

    Speech.stop();
    setStatus(VOICE_STATUS.SPEAKING);
    setError(null);

    Speech.speak(cleanText, {
      language: "vi-VN",
      rate: 0.9,
      pitch: 1.02,
      onDone: () => setStatus(VOICE_STATUS.IDLE),
      onStopped: () => setStatus(VOICE_STATUS.IDLE),
      onError: () => {
        setError("Voice playback failed");
        setStatus(VOICE_STATUS.ERROR);
      },
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setStatus(VOICE_STATUS.IDLE);
  }, []);

  return {
    status,
    transcript,
    transcriptVersion,
    error,
    isSpeaking: status === VOICE_STATUS.SPEAKING,
    isTranscribing: status === VOICE_STATUS.TRANSCRIBING,
    transcribeAudio,
    startRecording,
    stopRecordingAndTranscribe,
    speakText,
    stopSpeaking,
  };
}

export { VOICE_STATUS };
