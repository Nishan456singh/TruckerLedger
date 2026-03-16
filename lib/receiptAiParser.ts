import type { Category } from "./types";

export interface ParsedReceiptFields {
  vendor: string;
  amount: number | null;
  date: string | null;
  category: Category | null;
}

type RawAIResponse = {
  vendor?: unknown;
  total_amount?: unknown;
  amount?: unknown;
  date?: unknown;
  category?: unknown;
};

function normalizeCategory(value: unknown): Category | null {
  if (typeof value !== "string") return null;

  const normalized = value.toLowerCase().trim();

  if (
    normalized === "fuel" ||
    normalized === "food" ||
    normalized === "repair" ||
    normalized === "toll" ||
    normalized === "parking" ||
    normalized === "other"
  ) {
    return normalized;
  }

  return null;
}

function normalizeDate(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().split("T")[0];
}

function normalizeAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number(value.toFixed(2));
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));

    if (Number.isFinite(parsed)) {
      return Number(parsed.toFixed(2));
    }
  }

  return null;
}

function extractJsonObject(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("AI response did not include JSON.");
  }

  return match[0];
}

export async function parseReceiptWithAI(
  ocrText: string
): Promise<ParsedReceiptFields | null> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  if (!apiKey || !ocrText.trim()) {
    return null;
  }

  const prompt = [
    "Extract the following fields from this receipt:",
    "",
    "- vendor",
    "- total_amount",
    "- date",
    "- category (fuel, food, repair, toll, parking, other)",
    "",
    "Return JSON only.",
    "",
    "Receipt OCR text:",
    ocrText,
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You extract structured fields from receipt OCR. Output strict JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content ?? "";

  if (!content) {
    throw new Error("OpenAI returned empty content.");
  }

  const parsed = JSON.parse(extractJsonObject(content)) as RawAIResponse;

  const vendor = typeof parsed.vendor === "string" ? parsed.vendor.trim() : "";
  const amount = normalizeAmount(parsed.total_amount ?? parsed.amount);
  const date = normalizeDate(parsed.date);
  const category = normalizeCategory(parsed.category);

  return {
    vendor,
    amount,
    date,
    category,
  };
}
