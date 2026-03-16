import fetch from "node-fetch";

const ALLOWED_CATEGORIES = new Set([
  "fuel",
  "food",
  "repair",
  "toll",
  "parking",
  "other",
]);

function toJsonObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return null;
    }
  }

  return null;
}

function extractJsonObject(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function normalizeCategory(value) {
  if (typeof value !== "string") return "other";

  const normalized = value.toLowerCase().trim();
  return ALLOWED_CATEGORIES.has(normalized) ? normalized : "other";
}

function normalizeAmount(value) {
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

function normalizeDate(value) {
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

function getRequestBody(req) {
  if (req.bodyJson && typeof req.bodyJson === "object") {
    return req.bodyJson;
  }

  if (typeof req.bodyText === "string") {
    return toJsonObject(req.bodyText) ?? {};
  }

  if (typeof req.body === "string") {
    return toJsonObject(req.body) ?? {};
  }

  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  return {};
}

function parseOcrText(body) {
  if (typeof body.text === "string") return body.text;
  if (typeof body.ocr_text === "string") return body.ocr_text;
  if (typeof body.ocrText === "string") return body.ocrText;
  return "";
}

export default async ({ req, res, log, error }) => {
  try {
    const openAiApiKey = process.env.OPENAI_API_KEY;

    if (!openAiApiKey) {
      error("Missing OPENAI_API_KEY environment variable.");
      return res.json({ error: "AI parsing failed" }, 500);
    }

    const body = getRequestBody(req);
    const receiptText = parseOcrText(body).trim();

    if (!receiptText) {
      return res.json({ error: "AI parsing failed" }, 400);
    }

    const prompt = [
      "Extract vendor, amount, date and category from this receipt text.",
      "Return JSON only.",
      "",
      "Categories allowed:",
      "fuel, food, repair, toll, parking, other",
      "",
      "Receipt text:",
      receiptText,
    ].join("\n");

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0,
        max_tokens: 180,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You extract structured receipt fields and return strict JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const failureBody = await aiResponse.text();
      error(`OpenAI error ${aiResponse.status}: ${failureBody}`);
      return res.json({ error: "AI parsing failed" }, 502);
    }

    const payload = await aiResponse.json();
    const content = payload?.choices?.[0]?.message?.content;

    if (typeof content !== "string" || !content.trim()) {
      error("OpenAI response content was empty.");
      return res.json({ error: "AI parsing failed" }, 502);
    }

    const extracted = extractJsonObject(content);

    if (!extracted) {
      error("Could not parse JSON from OpenAI response.");
      return res.json({ error: "AI parsing failed" }, 502);
    }

    const amount = normalizeAmount(extracted.amount ?? extracted.total_amount);
    const parsedDate = normalizeDate(extracted.date);

    const result = {
      vendor:
        typeof extracted.vendor === "string" ? extracted.vendor.trim() : "",
      amount: amount ?? 0,
      date: parsedDate ?? "",
      category: normalizeCategory(extracted.category),
    };

    log("Receipt parsed successfully.");

    return res.json(result, 200, {
      "Content-Type": "application/json",
    });
  } catch (err) {
    error(`Unhandled receipt parser error: ${String(err)}`);
    return res.json({ error: "AI parsing failed" }, 500);
  }
};
