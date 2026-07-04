import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGroqSpeechRequest,
  buildGroqTranscriptionRequest,
  validateSpeechInput,
  validateTranscriptionFile,
} from "../groqSpeech.service.js";

test("validates audio uploads accepted by Groq transcription", () => {
  const file = {
    originalname: "question.wav",
    mimetype: "audio/wav",
    size: 12000,
    buffer: Buffer.from("audio"),
  };

  assert.doesNotThrow(() => validateTranscriptionFile(file));
});

test("rejects missing or unsupported transcription files", () => {
  assert.throws(() => validateTranscriptionFile(null), /Audio file is required/);
  assert.throws(
    () =>
      validateTranscriptionFile({
        originalname: "note.txt",
        mimetype: "text/plain",
        size: 20,
        buffer: Buffer.from("nope"),
      }),
    /Unsupported audio type/,
  );
});

test("builds fast Vietnamese transcription request defaults", () => {
  const request = buildGroqTranscriptionRequest({
    file: {
      originalname: "voice.m4a",
      mimetype: "audio/m4a",
      buffer: Buffer.from("audio"),
    },
    language: "vi",
  });

  assert.equal(request.model, "whisper-large-v3-turbo");
  assert.equal(request.language, "vi");
  assert.equal(request.response_format, "json");
  assert.match(request.prompt, /Genie/);
});

test("builds speech request using Groq Orpheus defaults", () => {
  const input = validateSpeechInput("Xin chào, Genie nghe bạn nè.");
  const request = buildGroqSpeechRequest({ input });

  assert.equal(request.model, "canopylabs/orpheus-v1-english");
  assert.equal(request.voice, "hannah");
  assert.equal(request.response_format, "wav");
  assert.equal(request.input, "Xin chào, Genie nghe bạn nè.");
});
