import fetch from "node-fetch";

const ALLOWED_CATEGORIES = new Set([
  "fuel",
  "food",
  "repair",
  "toll",
  "parking",
  "other",
]);

function safeJson(value) {
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

function getRequestBody(req) {
  if (req.bodyJson && typeof req.bodyJson === "object") {
    return req.bodyJson;
  }

  if (typeof req.bodyText === "string") {
    return safeJson(req.bodyText) ?? {};
  }

  if (typeof req.body === "string") {
    return safeJson(req.body) ?? {};
  }

  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  return {};
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

function normalizeAmount(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Number(value.toFixed(2));
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) {
      return Number(parsed.toFixed(2));
    }
  }

  return null;
}

function normalizeDate(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().split("T")[0];
}

function normalizeCategory(value) {
  if (typeof value !== "string") return "other";

  const normalized = value.toLowerCase().trim();
  return ALLOWED_CATEGORIES.has(normalized) ? normalized : "other";
}

function buildTaskPrompt(task, payload) {
  const text = typeof payload.text === "string" ? payload.text.trim() : "";

  if (task === "receipt_parse") {
    return [
      "Extract structured expense fields from this receipt OCR text.",
      "Return strict JSON only with: vendor, amount, date, category.",
      "Category must be one of: fuel, food, repair, toll, parking, other.",
      "Date format must be YYYY-MM-DD when possible.",
      "If a value is missing, return empty string for text fields and null for amount.",
      "",
      "OCR text:",
      text,
    ].join("\n");
  }

  if (task === "bol_parse") {
    return [
      "Extract structured BOL fields from this OCR text.",
      "Return strict JSON only with: pickup_location, delivery_location, load_amount, date, broker.",
      "Date format must be YYYY-MM-DD when possible.",
      "If a value is missing, return empty string for text fields and null for load_amount.",
      "",
      "OCR text:",
      text,
    ].join("\n");
  }

  if (task === "business_insights") {
    return [
      "You are a trucking business assistant.",
      "Generate concise operational insights from these metrics.",
      "Return strict JSON only with: headline, summary, actions (array of 1-3 short action strings).",
      "Avoid generic fluff and be practical.",
      "",
      "Metrics JSON:",
      JSON.stringify(payload),
    ].join("\n");
  }

  return "";
}

async function callOpenAI({ apiKey, model, prompt }) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 350,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a strict JSON extraction assistant. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI ${response.status}: ${text}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenAI returned empty message content");
  }

  const parsed = extractJsonObject(content);
  if (!parsed) {
    throw new Error("Unable to parse JSON object from model response");
  }

  return parsed;
}

function normalizeTaskResponse(task, parsed) {
  if (task === "receipt_parse") {
    return {
      vendor: typeof parsed.vendor === "string" ? parsed.vendor.trim() : "",
      amount: normalizeAmount(parsed.amount ?? parsed.total_amount),
      date: normalizeDate(parsed.date),
      category: normalizeCategory(parsed.category),
    };
  }

  if (task === "bol_parse") {
    return {
      pickup_location:
        typeof parsed.pickup_location === "string" ? parsed.pickup_location.trim() : "",
      delivery_location:
        typeof parsed.delivery_location === "string" ? parsed.delivery_location.trim() : "",
      load_amount: normalizeAmount(parsed.load_amount),
      date: normalizeDate(parsed.date),
      broker: typeof parsed.broker === "string" ? parsed.broker.trim() : "",
    };
  }

  if (task === "business_insights") {
    const actions = Array.isArray(parsed.actions)
      ? parsed.actions
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
          .slice(0, 3)
      : [];

    return {
      headline:
        typeof parsed.headline === "string" && parsed.headline.trim()
          ? parsed.headline.trim()
          : "AI Insight",
      summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "",
      actions,
    };
  }

  return { error: "Unsupported task" };
}

export default async ({ req, res, log, error }) => {
  try {
    const body = getRequestBody(req);
    const task = typeof body.task === "string" ? body.task : "";
    const payload = safeJson(body.payload) ?? {};

    log(`AI function called: task=${task}, bodyKeys=${Object.keys(body).join(",")}`);

    if (!task || !["receipt_parse", "bol_parse", "business_insights"].includes(task)) {
      error(`Invalid task: ${task}`);
      return res.json({ error: "Invalid task" }, 400);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      error("CRITICAL: Missing OPENAI_API_KEY in function environment variables");
      return res.json({ error: "AI is not configured. Missing OPENAI_API_KEY." }, 500);
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    log(`Using model: ${model}`);

    const prompt = buildTaskPrompt(task, payload);

    if (!prompt) {
      error("Failed to build task prompt");
      return res.json({ error: "Invalid request payload" }, 400);
    }

    log(`Calling OpenAI with model ${model}, prompt length=${prompt.length}`);
    const parsed = await callOpenAI({ apiKey, model, prompt });
    const normalized = normalizeTaskResponse(task, parsed);

    log(`AI task completed: ${task}, result=${JSON.stringify(normalized)}`);

    return res.json(normalized, 200, {
      "Content-Type": "application/json",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    error(`EXCEPTION: AI function failed: ${message}`);
    return res.json({ error: `AI request failed: ${message}` }, 500);
  }
};
