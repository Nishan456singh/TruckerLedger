import fetch from "node-fetch";

const ALLOWED_CATEGORIES = new Set([
  "fuel",
  "food",
  "repair",
  "toll",
  "parking",
  "other",
]);

// ------------------------
// Helpers
// ------------------------

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
    } catch {}
  }

  return null;
}

function getRequestBody(req) {
  if (req.bodyJson) return req.bodyJson;
  if (req.bodyText) return safeJson(req.bodyText) ?? {};
  if (req.body) return safeJson(req.body) ?? {};
  return {};
}

function extractJsonObject(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeAmount(value) {
  if (typeof value === "number" && value > 0) {
    return Number(value.toFixed(2));
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    if (parsed > 0) return Number(parsed.toFixed(2));
  }

  return null;
}

function normalizeDate(value) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const d = new Date(value);
  if (isNaN(d.getTime())) return "";

  return d.toISOString().split("T")[0];
}

function normalizeCategory(value) {
  if (typeof value !== "string") return "other";
  const v = value.toLowerCase().trim();
  return ALLOWED_CATEGORIES.has(v) ? v : "other";
}

// ------------------------
// Prompt Builder
// ------------------------

function buildTaskPrompt(task, payload) {
  const text = payload.text || "";

  if (task === "receipt_parse") {
    return `
Extract:
- vendor
- amount
- date
- category (fuel, food, repair, toll, parking, other)

Return ONLY JSON.

Text:
${text}
`;
  }

  if (task === "bol_parse") {
    return `
Extract:
- pickup_location
- delivery_location
- load_amount
- date
- broker

Return ONLY JSON.

Text:
${text}
`;
  }

  if (task === "business_insights") {
    return `
Analyze trucking business data.

Return JSON:
{
  "headline": "",
  "summary": "",
  "actions": []
}

Data:
${JSON.stringify(payload)}
`;
  }

  return "";
}

// ------------------------
// OpenAI Call
// ------------------------

async function callOpenAI({ apiKey, prompt }) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "Return ONLY valid JSON. No explanation.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${text}`);
  }

  const json = JSON.parse(text);
  const content = json?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  const parsed = extractJsonObject(content);

  if (!parsed) {
    throw new Error("Invalid JSON in AI response");
  }

  return parsed;
}

// ------------------------
// Normalize Output
// ------------------------

function normalizeTaskResponse(task, parsed) {
  if (task === "receipt_parse") {
    return {
      vendor: parsed.vendor || "",
      amount: normalizeAmount(parsed.amount),
      date: normalizeDate(parsed.date),
      category: normalizeCategory(parsed.category),
    };
  }

  if (task === "bol_parse") {
    return {
      pickup_location: parsed.pickup_location || "",
      delivery_location: parsed.delivery_location || "",
      load_amount: normalizeAmount(parsed.load_amount),
      date: normalizeDate(parsed.date),
      broker: parsed.broker || "",
    };
  }

  if (task === "business_insights") {
    return {
      headline: parsed.headline || "Insight",
      summary: parsed.summary || "",
      actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 3) : [],
    };
  }

  return { error: "Unsupported task" };
}

// ------------------------
// MAIN FUNCTION
// ------------------------

export default async ({ req, res, error }) => {
  try {
    const body = getRequestBody(req);
    const task = body.task;
    const payload = safeJson(body.payload) ?? {};

    if (!task) {
      error("Missing task in request");
      return res.json({ error: "Missing task" });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      error("CRITICAL: OPENAI_API_KEY not configured");
      return res.json({ error: "Server misconfigured" }, 500);
    }

    const prompt = buildTaskPrompt(task, payload);

    if (!prompt) {
      error("Failed to build prompt for task: " + task);
      return res.json({ error: "Invalid request payload" }, 400);
    }

    const parsed = await callOpenAI({ apiKey, prompt });
    const result = normalizeTaskResponse(task, parsed);

    return res.json(result, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    error("Function error: " + msg);
    return res.json({ error: "Request failed" }, 500);
  }
};