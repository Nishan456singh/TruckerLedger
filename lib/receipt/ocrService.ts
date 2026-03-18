import * as TextRecognition from "expo-text-recognition";
import { Platform } from "react-native";

const WEB = Platform.OS === "web";

export interface OCRResult {
  fullText: string;
  lines: string[];
  success: boolean;
  error?: string;
}

/**
 * Extract text from a receipt image using device ML.
 * Uses expo-text-recognition for on-device OCR.
 */
export async function extractReceiptText(imageUri: string): Promise<OCRResult> {
  if (WEB) {
    return {
      fullText: "",
      lines: [],
      success: false,
      error: "OCR not available on web",
    };
  }

  try {
    const result = await TextRecognition.recognizeTextFromImage(imageUri);

    if (!result) {
      return {
        fullText: "",
        lines: [],
        success: false,
        error: "No text detected in image",
      };
    }

    const fullText = result.map((block) => block.text).join("\n");
    const lines = fullText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return {
      fullText,
      lines,
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown OCR error";
    console.error("OCR extraction failed:", message);

    return {
      fullText: "",
      lines: [],
      success: false,
      error: message,
    };
  }
}

/**
 * Extract text without throwing - graceful fallback.
 * Use this when you want to continue even if OCR fails.
 */
export async function tryExtractReceiptText(
  imageUri: string
): Promise<{ text: string; success: boolean }> {
  const result = await extractReceiptText(imageUri);
  return {
    text: result.fullText,
    success: result.success,
  };
}
