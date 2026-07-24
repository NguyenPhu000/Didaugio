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
import { VOICE_ERROR_CODES } from "../../../constants/voice-error-codes";
import {
  createAsyncGate,
  createMountedCallbackGuard,
  restoreIdleAudioMode,
  startAudioRecording,
  stopAudioRecording,
} from "./audioSessionController";

const VOICE_STATUS = Object.freeze({
  IDLE: "idle",
  LISTENING: "listening",
  TRANSCRIBING: "transcribing",
  SPEAKING: "speaking",
  ERROR: "error",
});

const VOICE_RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
  numberOfChannels: 1,
  bitRate: 64000,
};

const VOICE_SESSION_FAILED = "VOICE_SESSION_FAILED";

export function useGenieVoice() {
  const [status, setStatus] = useState(VOICE_STATUS.IDLE);
  const [transcript, setTranscript] = useState("");
  const [transcriptVersion, setTranscriptVersion] = useState(0);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [error, setError] = useState(null);
  const busyRef = useRef(false);
  const statusRef = useRef(VOICE_STATUS.IDLE);
  const speechSessionRef = useRef(0);
  const mountedGuardRef = useRef(createMountedCallbackGuard());
  const audioGateRef = useRef(createAsyncGate());
  const recorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 140);

  const setSafely = useCallback((setter, value) => (
    mountedGuardRef.current.run(setter, value)
  ), []);

  const setVoiceStatus = useCallback((nextStatus) => {
    if (!mountedGuardRef.current.isMounted()) return false;
    statusRef.current = nextStatus;
    return setSafely(setStatus, nextStatus);
  }, [setSafely]);

  const restoreIdle = useCallback(
    () => restoreIdleAudioMode(setAudioModeAsync),
    [],
  );

  useEffect(() => () => {
    mountedGuardRef.current.unmount();
    speechSessionRef.current += 1;

    void audioGateRef.current.enqueue(async () => {
      try {
        try {
          if (recorder?.isRecording) {
            await recorder.stop();
          }
        } catch {
          // The recorder is being disposed. Idle-mode restoration still follows.
        }
        await Speech.stop();
      } catch {
        // Session teardown must continue even if native speech disposal fails.
      } finally {
        await restoreIdle();
      }
    });
  }, [recorder, restoreIdle]);

  const transcribeAudio = useCallback(async (audioFile) => {
    if (!audioFile?.uri && !audioFile?.buffer) {
      throw new Error("Audio file is required");
    }
    if (busyRef.current || !mountedGuardRef.current.isMounted()) return null;

    busyRef.current = true;
    setVoiceStatus(VOICE_STATUS.TRANSCRIBING);
    setSafely(setError, null);

    try {
      const form = new FormData();
      form.append("audio", {
        uri: audioFile.uri,
        name: audioFile.name || "genie-voice.m4a",
        type: audioFile.type || "audio/m4a",
      });
      form.append("language", audioFile.language || "vi");

      const response = await apiClient.post(ENDPOINTS.ai.voiceTranscribe, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: AI_REQUEST_TIMEOUT,
      });
      const text = response?.data?.text || response?.data?.data?.text || "";
      setSafely(setTranscript, text);
      setSafely(setTranscriptVersion, (version) => version + 1);
      setVoiceStatus(VOICE_STATUS.IDLE);
      setSafely(setVoiceLevel, 0);
      return text;
    } catch (err) {
      setSafely(setError, err?.message || "Voice transcription failed");
      setVoiceStatus(VOICE_STATUS.ERROR);
      setSafely(setVoiceLevel, 0);
      throw err;
    } finally {
      busyRef.current = false;
    }
  }, [setSafely, setVoiceStatus]);

  const startRecording = useCallback(async () => {
    if (
      busyRef.current
      || statusRef.current === VOICE_STATUS.LISTENING
      || audioGateRef.current.isLocked()
    ) {
      return false;
    }

    return audioGateRef.current.run(async () => {
      if (!mountedGuardRef.current.isMounted()) return false;

      setSafely(setError, null);
      setSafely(setTranscript, "");
      setSafely(setVoiceLevel, 0);
      speechSessionRef.current += 1;

      try {
        await Speech.stop();
        if (!mountedGuardRef.current.isMounted()) return false;

        const started = await startAudioRecording({
          requestPermission: requestRecordingPermissionsAsync,
          setAudioMode: setAudioModeAsync,
          recorder,
          recordingOptions: VOICE_RECORDING_OPTIONS,
          canContinue: mountedGuardRef.current.isMounted,
        });

        if (!started) {
          setVoiceStatus(VOICE_STATUS.ERROR);
          setSafely(setError, VOICE_ERROR_CODES.PERMISSION_DENIED);
          return false;
        }

        setVoiceStatus(VOICE_STATUS.LISTENING);
        return true;
      } catch {
        await restoreIdle();
        setVoiceStatus(VOICE_STATUS.ERROR);
        setSafely(setError, VOICE_SESSION_FAILED);
        setSafely(setVoiceLevel, 0);
        return false;
      }
    });
  }, [recorder, restoreIdle, setSafely, setVoiceStatus]);

  const stopRecordingAndTranscribe = useCallback(async () => {
    if (
      statusRef.current !== VOICE_STATUS.LISTENING
      || audioGateRef.current.isLocked()
    ) {
      return "";
    }

    return audioGateRef.current.run(async () => {
      let uri;
      try {
        uri = await stopAudioRecording({
          recorder,
          setAudioMode: setAudioModeAsync,
        });
      } catch {
        setVoiceStatus(VOICE_STATUS.ERROR);
        setSafely(setError, VOICE_SESSION_FAILED);
        setSafely(setVoiceLevel, 0);
        return "";
      }

      setSafely(setVoiceLevel, 0);
      if (!uri) {
        setVoiceStatus(VOICE_STATUS.ERROR);
        setSafely(setError, VOICE_ERROR_CODES.EMPTY_RECORDING);
        return "";
      }
      if (!mountedGuardRef.current.isMounted()) return "";

      return transcribeAudio({
        uri,
        name: uri.split("/").pop() || "genie-voice.m4a",
        type: uri.endsWith(".webm") ? "audio/webm" : "audio/m4a",
        language: "vi",
      });
    });
  }, [recorder, setSafely, setVoiceStatus, transcribeAudio]);

  useEffect(() => {
    if (status !== VOICE_STATUS.LISTENING) return;

    const metering = Number(recorderState?.metering);
    if (!Number.isFinite(metering)) return;

    setSafely(setVoiceLevel, Math.max(0, Math.min(1, (metering + 62) / 42)));
  }, [recorderState?.metering, setSafely, status]);

  const speakText = useCallback(async (text) => {
    const cleanText = String(text || "").trim();
    if (
      !cleanText
      || audioGateRef.current.isLocked()
      || statusRef.current === VOICE_STATUS.LISTENING
      || statusRef.current === VOICE_STATUS.TRANSCRIBING
      || !mountedGuardRef.current.isMounted()
    ) {
      return false;
    }

    return audioGateRef.current.run(async () => {
      if (!mountedGuardRef.current.isMounted()) return false;

      const speechSession = speechSessionRef.current + 1;
      speechSessionRef.current = speechSession;

      try {
        await Speech.stop();
        if (
          !mountedGuardRef.current.isMounted()
          || speechSessionRef.current !== speechSession
        ) {
          return false;
        }

        setVoiceStatus(VOICE_STATUS.SPEAKING);
        setSafely(setError, null);
        setSafely(setVoiceLevel, 0.7);

        const isCurrentSpeech = () => (
          mountedGuardRef.current.isMounted()
          && speechSessionRef.current === speechSession
        );

        Speech.speak(cleanText, {
          language: "vi-VN",
          rate: 0.9,
          pitch: 1.02,
          onDone: () => {
            if (!isCurrentSpeech()) return;
            setSafely(setVoiceLevel, 0);
            setVoiceStatus(VOICE_STATUS.IDLE);
          },
          onStopped: () => {
            if (!isCurrentSpeech()) return;
            setSafely(setVoiceLevel, 0);
            setVoiceStatus(VOICE_STATUS.IDLE);
          },
          onError: () => {
            if (!isCurrentSpeech()) return;
            setSafely(setError, "Voice playback failed");
            setSafely(setVoiceLevel, 0);
            setVoiceStatus(VOICE_STATUS.ERROR);
          },
        });
        return true;
      } catch {
        if (speechSessionRef.current !== speechSession) return false;
        setSafely(setError, VOICE_SESSION_FAILED);
        setSafely(setVoiceLevel, 0);
        setVoiceStatus(VOICE_STATUS.ERROR);
        return false;
      }
    });
  }, [setSafely, setVoiceStatus]);

  const stopSpeaking = useCallback(() => {
    const speechSession = speechSessionRef.current + 1;
    speechSessionRef.current = speechSession;

    return audioGateRef.current.enqueue(async () => {
      try {
        await Speech.stop();
      } catch {
        // Stopping an already disposed speech session is safe to ignore.
      }
      if (speechSessionRef.current !== speechSession) return;
      setSafely(setVoiceLevel, 0);
      setVoiceStatus(VOICE_STATUS.IDLE);
    });
  }, [setSafely, setVoiceStatus]);

  return {
    status,
    transcript,
    transcriptVersion,
    voiceLevel,
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
