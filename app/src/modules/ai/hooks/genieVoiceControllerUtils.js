import { VOICE_ERROR_CODES } from "../../../constants/voice-error-codes";

export function getNextVoiceTranscriptDispatch({
  transcript,
  transcriptVersion,
  lastTranscriptVersion,
  isLoading,
}) {
  const text = String(transcript || "").trim();
  if (!text || isLoading || lastTranscriptVersion === transcriptVersion) {
    return {
      shouldDispatch: false,
      text: "",
      nextVersion: lastTranscriptVersion,
    };
  }

  return {
    shouldDispatch: true,
    text,
    nextVersion: transcriptVersion,
  };
}

export function getGenieVoiceStatusText({ error, status, t }) {
  if (error === VOICE_ERROR_CODES.PERMISSION_DENIED) {
    return t("aiPlanner.voicePermissionDenied");
  }
  if (error === VOICE_ERROR_CODES.EMPTY_RECORDING) {
    return t("aiPlanner.voiceEmptyRecording");
  }
  if (status === "listening") return t("aiPlanner.voiceListening");
  if (status === "transcribing") return t("aiPlanner.voiceTranscribing");
  if (status === "speaking") return t("aiPlanner.voiceSpeaking");
  if (status === "error") return t("aiPlanner.voiceError");
  return "";
}

export function getGenieVoiceWaveLabel({ status, isLoading, t }) {
  if (status === "listening") return t("aiPlanner.voiceWave.listening");
  if (status === "transcribing") return t("aiPlanner.voiceWave.transcribing");
  if (status === "speaking") return t("aiPlanner.voiceWave.speaking");
  if (isLoading) return t("aiPlanner.voiceWave.thinking");
  return t("aiPlanner.voiceWave.idle");
}

export function getGenieVoiceWaveSublabel({ status, t }) {
  if (status === "listening") return t("aiPlanner.voiceWave.listeningHint");
  if (status === "speaking") return t("aiPlanner.voiceWave.speakingHint");
  return t("aiPlanner.voiceWave.idleHint");
}
