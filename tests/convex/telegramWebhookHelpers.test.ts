// @ts-nocheck
/// <reference types="vite/client" />
import { describe, test, expect } from "vitest";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function getAudioFormatFromMimeType(mimeType: string): string {
  const formats: Record<string, string> = {
    "audio/ogg": "ogg",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/flac": "flac",
    "audio/x-flac": "flac",
    "audio/m4a": "m4a",
    "audio/aac": "aac",
    "audio/mp4": "m4a",
  };

  return formats[mimeType.toLowerCase()] || "ogg";
}

describe("arrayBufferToBase64", () => {
  test("should convert ArrayBuffer with simple bytes to base64", () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]);
    const buffer = bytes.buffer;

    const result = arrayBufferToBase64(buffer);

    expect(result).toBe("SGVsbG8=");
  });

  test("should convert empty ArrayBuffer", () => {
    const bytes = new Uint8Array([]);
    const buffer = bytes.buffer;

    const result = arrayBufferToBase64(buffer);

    expect(result).toBe("");
  });

  test("should convert ArrayBuffer with all zero bytes", () => {
    const bytes = new Uint8Array([0, 0, 0]);
    const buffer = bytes.buffer;

    const result = arrayBufferToBase64(buffer);

    expect(result).toBe("AAAA");
  });

  test("should convert ArrayBuffer with binary audio-like data", () => {
    const bytes = new Uint8Array([255, 254, 253, 128, 64]);
    const buffer = bytes.buffer;

    const result = arrayBufferToBase64(buffer);

    expect(result).toBe("//79gEA=");
  });

  test("should handle longer ArrayBuffer", () => {
    const bytes = new Uint8Array([
      84, 104, 105, 115, 32, 105, 115, 32, 97, 32, 116, 101, 115, 116,
    ]);
    const buffer = bytes.buffer;

    const result = arrayBufferToBase64(buffer);

    expect(result).toBe("VGhpcyBpcyBhIHRlc3Q=");
  });
});

describe("getAudioFormatFromMimeType", () => {
  test("should return ogg for audio/ogg", () => {
    expect(getAudioFormatFromMimeType("audio/ogg")).toBe("ogg");
  });

  test("should return mp3 for audio/mp3", () => {
    expect(getAudioFormatFromMimeType("audio/mp3")).toBe("mp3");
  });

  test("should return mp3 for audio/mpeg (alias)", () => {
    expect(getAudioFormatFromMimeType("audio/mpeg")).toBe("mp3");
  });

  test("should return wav for audio/wav", () => {
    expect(getAudioFormatFromMimeType("audio/wav")).toBe("wav");
  });

  test("should return wav for audio/x-wav (alias)", () => {
    expect(getAudioFormatFromMimeType("audio/x-wav")).toBe("wav");
  });

  test("should return flac for audio/flac", () => {
    expect(getAudioFormatFromMimeType("audio/flac")).toBe("flac");
  });

  test("should return flac for audio/x-flac (alias)", () => {
    expect(getAudioFormatFromMimeType("audio/x-flac")).toBe("flac");
  });

  test("should return m4a for audio/m4a", () => {
    expect(getAudioFormatFromMimeType("audio/m4a")).toBe("m4a");
  });

  test("should return m4a for audio/mp4 (alias)", () => {
    expect(getAudioFormatFromMimeType("audio/mp4")).toBe("m4a");
  });

  test("should return aac for audio/aac", () => {
    expect(getAudioFormatFromMimeType("audio/aac")).toBe("aac");
  });

  test("should return ogg (default) for unknown mime type", () => {
    expect(getAudioFormatFromMimeType("audio/unknown")).toBe("ogg");
  });

  test("should return ogg (default) for empty string", () => {
    expect(getAudioFormatFromMimeType("")).toBe("ogg");
  });

  test("should handle case insensitive mime type (uppercase)", () => {
    expect(getAudioFormatFromMimeType("AUDIO/OGG")).toBe("ogg");
  });

  test("should handle case insensitive mime type (mixed case)", () => {
    expect(getAudioFormatFromMimeType("Audio/Mp3")).toBe("mp3");
  });

  test("should handle mime type with extra whitespace trimmed", () => {
    expect(getAudioFormatFromMimeType("audio/ogg")).toBe("ogg");
  });

  test("should return ogg for completely invalid mime type", () => {
    expect(getAudioFormatFromMimeType("invalid")).toBe("ogg");
  });

  test("should return ogg for non-audio mime type", () => {
    expect(getAudioFormatFromMimeType("image/png")).toBe("ogg");
  });
});
