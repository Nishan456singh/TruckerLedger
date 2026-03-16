type MlkitModule = {
  extractTextFromImage?: (imageUri: string) => Promise<unknown>;
  scanFromURLAsync?: (imageUri: string) => Promise<unknown>;
  recognizeText?: (imageUri: string) => Promise<unknown>;
};

type ExpoTextRecognitionModule = {
  getTextFromFrame?: (
    imageUri: string,
    visionCamera?: boolean
  ) => Promise<string[]>;
};

function normalizeMlkitResult(result: unknown): string {
  if (!result) return "";

  if (typeof result === "string") {
    return result.trim();
  }

  if (Array.isArray(result)) {
    return result
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join("\n");
  }

  if (typeof result === "object") {
    const candidate = result as {
      text?: unknown;
      blocks?: Array<{ text?: unknown }>;
      lines?: Array<{ text?: unknown } | unknown>;
    };

    if (typeof candidate.text === "string") {
      return candidate.text.trim();
    }

    if (Array.isArray(candidate.blocks)) {
      const fromBlocks = candidate.blocks
        .map((block) =>
          typeof block?.text === "string" ? block.text.trim() : ""
        )
        .filter(Boolean)
        .join("\n");

      if (fromBlocks) return fromBlocks;
    }

    if (Array.isArray(candidate.lines)) {
      return candidate.lines
        .map((line) => {
          if (typeof line === "string") return line.trim();
          if (line && typeof line === "object" && "text" in line) {
            const text = (line as { text?: unknown }).text;
            return typeof text === "string" ? text.trim() : "";
          }
          return "";
        })
        .filter(Boolean)
        .join("\n");
    }
  }

  return "";
}

export async function extractReceiptText(imageUri: string): Promise<string> {
  if (!imageUri) return "";

  try {
    // Optional dependency path: use MLKit package when available in native runtime.
    const runtimeImport = new Function(
      "return import('expo-mlkit-text-recognition')"
    ) as () => Promise<MlkitModule>;

    const mlkit = await runtimeImport();

    const extractor =
      mlkit.extractTextFromImage ??
      mlkit.scanFromURLAsync ??
      mlkit.recognizeText;

    if (extractor) {
      const mlkitResult = await extractor(imageUri);
      const mlkitText = normalizeMlkitResult(mlkitResult);

      if (mlkitText) {
        return mlkitText;
      }
    }
  } catch {
    // Fallback OCR path below.
  }

  try {
    // Optional dependency path: use Expo text recognition when installed.
    const runtimeImport = new Function(
      "return import('expo-text-recognition')"
    ) as () => Promise<ExpoTextRecognitionModule>;

    const textRecognition = await runtimeImport();

    if (textRecognition.getTextFromFrame) {
      const lines = await textRecognition.getTextFromFrame(imageUri, false);

      return lines
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n");
    }
  } catch {
    // Final fallback below.
  }

  // Keep the flow resilient if no OCR native module is currently available.
  return "";
}
