import { useCallback, useEffect, useRef } from "react";
import { useGenieVoice } from "./useGenieVoice";
import {
  getGenieVoiceStatusText,
  getGenieVoiceWaveLabel,
  getGenieVoiceWaveSublabel,
  getNextVoiceTranscriptDispatch,
} from "./genieVoiceControllerUtils";

export {
  getGenieVoiceStatusText,
  getGenieVoiceWaveLabel,
  getGenieVoiceWaveSublabel,
  getNextVoiceTranscriptDispatch,
};

export function useGenieVoiceController({
  isLoading,
  onTranscript,
  onError,
  t,
}) {
  const voice = useGenieVoice();
  const lastTranscriptVersionRef = useRef(0);

  useEffect(() => {
    const dispatch = getNextVoiceTranscriptDispatch({
      transcript: voice.transcript,
      transcriptVersion: voice.transcriptVersion,
      lastTranscriptVersion: lastTranscriptVersionRef.current,
      isLoading,
    });
    if (!dispatch.shouldDispatch) return;

    lastTranscriptVersionRef.current = dispatch.nextVersion;
    onTranscript?.(dispatch.text);
  }, [isLoading, onTranscript, voice.transcript, voice.transcriptVersion]);

  const handleVoicePress = useCallback(async () => {
    if (voice.status === "listening") {
      try {
        await voice.stopRecordingAndTranscribe();
      } catch (err) {
        onError?.(err?.message || t("aiPlanner.voiceError"));
      }
      return;
    }

    if (isLoading || voice.status === "transcribing") return;

    if (voice.status === "speaking") {
      voice.stopSpeaking();
      return;
    }

    try {
      await voice.startRecording();
    } catch (err) {
      onError?.(err?.message || t("aiPlanner.voiceError"));
    }
  }, [isLoading, onError, t, voice]);

  const getStatusText = useCallback(
    () =>
      getGenieVoiceStatusText({
        error: voice.error,
        status: voice.status,
        t,
      }),
    [t, voice.error, voice.status],
  );

  const getWaveLabel = useCallback(
    () =>
      getGenieVoiceWaveLabel({
        status: voice.status,
        isLoading,
        t,
      }),
    [isLoading, t, voice.status],
  );

  const getWaveSublabel = useCallback(
    () =>
      getGenieVoiceWaveSublabel({
        status: voice.status,
        t,
      }),
    [t, voice.status],
  );

  return {
    ...voice,
    handleVoicePress,
    getStatusText,
    getWaveLabel,
    getWaveSublabel,
  };
}
