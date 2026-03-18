export interface ParsedBOL {
  pickup_location: string;
  delivery_location: string;
  load_amount: number | null;
  date: string;
  broker: string;
}

function normalizeAmount(value: string): number | null {
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Number(parsed.toFixed(2));
}

function normalizeDate(value: string): string {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const usMatch = trimmed.match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/);

  if (usMatch) {
    const month = Number(usMatch[1]).toString().padStart(2, "0");
    const day = Number(usMatch[2]).toString().padStart(2, "0");
    return `${usMatch[3]}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return "";
}

function extractField(text: string, labels: string[]): string {
  const lines = text.split(/\r?\n/).map((line) => line.trim());

  for (const line of lines) {
    const lower = line.toLowerCase();

    for (const label of labels) {
      const normalizedLabel = label.toLowerCase();

      if (lower.startsWith(`${normalizedLabel}:`) || lower.startsWith(`${normalizedLabel} -`)) {
        return line
          .slice(line.toLowerCase().indexOf(normalizedLabel) + normalizedLabel.length)
          .replace(/^[:\-]\s*/, "")
          .trim();
      }

      if (lower.includes(normalizedLabel) && line.includes(":")) {
        const parts = line.split(":");
        if (parts.length > 1 && parts[0].toLowerCase().includes(normalizedLabel)) {
          return parts.slice(1).join(":").trim();
        }
      }
    }
  }

  return "";
}

export function parseBOLText(text: string): ParsedBOL {
  const pickup = extractField(text, ["pickup", "pickup location", "origin"]);
  const delivery = extractField(text, ["delivery", "delivery location", "destination"]);
  const broker = extractField(text, ["broker", "broker name", "carrier broker"]);

  const amountRaw =
    extractField(text, ["load amount", "rate", "total"]) ||
    (text.match(/\$\s?(\d{2,7}(?:[.,]\d{2})?)/)?.[1] ?? "");

  const dateRaw =
    extractField(text, ["date", "pickup date", "ship date"]) ||
    (text.match(/\b\d{1,2}[/-]\d{1,2}[/-]20\d{2}\b/)?.[0] ?? "");

  return {
    pickup_location: pickup,
    delivery_location: delivery,
    load_amount: normalizeAmount(amountRaw),
    date: normalizeDate(dateRaw),
    broker,
  };
}

export function isBOLParseWeak(result: ParsedBOL): boolean {
  return !result.pickup_location || !result.delivery_location || result.load_amount === null;
}
