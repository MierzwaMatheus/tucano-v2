// @ts-nocheck
/// <reference types="vite/client" />
import { describe, test, expect } from "vitest";

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

describe("base64ToBlob", () => {
  test("should convert valid base64 to blob with correct mime type", () => {
    const base64 = "SGVsbG8gV29ybGQh";
    const mimeType = "audio/ogg";

    const blob = base64ToBlob(base64, mimeType);

    expect(blob.type).toBe(mimeType);
    expect(blob.size).toBe(12);
  });

  test("should convert base64 representing binary audio data", () => {
    const base64 = "AAAA";
    const mimeType = "audio/mp3";

    const blob = base64ToBlob(base64, mimeType);

    expect(blob.type).toBe(mimeType);
    expect(blob.size).toBe(3);
  });

  test("should handle empty base64 string", () => {
    const base64 = "";
    const mimeType = "audio/wav";

    const blob = base64ToBlob(base64, mimeType);

    expect(blob.type).toBe(mimeType);
    expect(blob.size).toBe(0);
  });

  test("should preserve mime type exactly as provided", () => {
    const base64 = "dGVzdA==";
    const mimeType = "audio/ogg; codecs=opus";

    const blob = base64ToBlob(base64, mimeType);

    expect(blob.type).toBe("audio/ogg; codecs=opus");
  });

  test("should convert longer base64 string correctly", () => {
    const base64 = "VGhpcyBpcyBhIGxvbmdlciB0ZXN0IHN0cmluZyBmb3IgYXVkaW8=";
    const mimeType = "audio/flac";

    const blob = base64ToBlob(base64, mimeType);

    expect(blob.type).toBe(mimeType);
    expect(blob.size).toBe(38);
  });
});
