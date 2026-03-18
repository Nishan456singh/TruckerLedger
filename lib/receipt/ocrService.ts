type MlkitTextBlock = {
  text?: unknown;
};

type MlkitResult = {
  text?: unknown;
  blocks?: MlkitTextBlock[];
  lines?: Array<{ text?: unknown } | unknown>;
};

type MlkitModule = {
  extractTextFromImage?: (uri: string) => Promise<unknown>;
  detectFromUri?: (uri: string) => Promise<unknown>;
  scanFromURLAsync?: (uri: string) => Promise<unknown>;
  recognizeText?: (uri: string) => Promise<unknown>;
};

type ExpoTextRecognitionModule = {
  getTextFromFrame?: (uri: string, useVisionCamera?: boolean) => Promise<string[]>;
  recognize?: (uri: string) => Promise<unknown>;
  scanFromURLAsync?: (uri: string) => Promise<unknown>;
  extractTextFromImage?: (uri: string) => Promise<unknown>;
};

export interface OcrExtractionResult {
  text: string;
  engine: "mlkit" | "expo-text-recognition" | "none";
  reason?: string;
}

function buildUriCandidates(uri: string): string[] {
  const trimmed = uri.trim();
  if (!trimmed) return [];

  const candidates = [trimmed];

  if (trimmed.startsWith("file://")) {
    candidates.push(trimmed.replace("file://", ""));
  } else {
    candidates.push(`file://${trimmed}`);
  }

  return [...new Set(candidates)];
}

function normalizeMlkitOutput(result: unknown): string {
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

  const candidate = result as MlkitResult;

  if (typeof candidate.text === "string") {
    return candidate.text.trim();
  }

  if (Array.isArray(candidate.blocks)) {
    const fromBlocks = candidate.blocks
      .map((block) => (typeof block?.text === "string" ? block.text.trim() : ""))
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

  return "";
}

export async function extractTextFromImage(uri: string): Promise<OcrExtractionResult> {
  const uriCandidates = buildUriCandidates(uri);
  if (!uriCandidates.length) {
    return {
      text: "",
      engine: "none",
      reason: "Empty image URI.",
    };
  }

  let attemptedMlkit = false;
  let attemptedExpoTextRecognition = false;

  try {
    const runtimeImport = new Function(
      "return import('expo-mlkit-text-recognition')"
    ) as () => Promise<MlkitModule>;

    const mlkit = await runtimeImport();
    const extractor =
      mlkit.extractTextFromImage ??
      mlkit.detectFromUri ??
      mlkit.scanFromURLAsync ??
      mlkit.recognizeText;

    if (extractor) {
      attemptedMlkit = true;
      for (const candidateUri of uriCandidates) {
        try {
          const raw = await extractor(candidateUri);
          const text = normalizeMlkitOutput(raw);
          if (text) {
            return {
              text,
              engine: "mlkit",
            };
          }
        } catch {
          // Try next URI candidate.
        }
      }
    }
  } catch {
    // Continue to fallback OCR runtime.
  }

  try {
    const runtimeImport = new Function(
      "return import('expo-text-recognition')"
    ) as () => Promise<ExpoTextRecognitionModule>;

    const textRecognition = await runtimeImport();
    attemptedExpoTextRecognition = true;

    for (const candidateUri of uriCandidates) {
      if (textRecognition.getTextFromFrame) {
        try {
          const lines = await textRecognition.getTextFromFrame(candidateUri, false);
          const text = normalizeMlkitOutput(lines);
          if (text) {
            return {
              text,
              engine: "expo-text-recognition",
            };
          }
        } catch {
          // Continue to alternative method fallbacks.
        }
      }

      const altExtractor =
        textRecognition.recognize ??
        textRecognition.scanFromURLAsync ??
        textRecognition.extractTextFromImage;

      if (altExtractor) {
        try {
          const raw = await altExtractor(candidateUri);
          const text = normalizeMlkitOutput(raw);
          if (text) {
            return {
              text,
              engine: "expo-text-recognition",
            };
          }
        } catch {
          // Try next URI candidate.
        }
      }
    }
  } catch {
    // Ignore and return empty text below.
  }

  return {
    text: "",
    engine: "none",
    reason:
      !attemptedMlkit && !attemptedExpoTextRecognition
        ? "No OCR engine found in this runtime (common in Expo Go)."
        : "OCR engine ran but no readable text was extracted.",
  };
}
