import { executeAiTask } from "@/lib/ai/aiFunctionClient";

export interface AiInsightInput {
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  weekCount: number;
  monthCount: number;
  weeklyIncome: number;
  weeklyFuel: number;
  weeklyOtherExpenses: number;
  weeklyProfit: number;
}

export interface AiInsightResult {
  headline: string;
  summary: string;
  actions: string[];
}

export async function getBusinessInsights(
  input: AiInsightInput
): Promise<AiInsightResult | null> {
  const body = await executeAiTask<Record<string, unknown>>("business_insights", input);

  if (!body) {
    return null;
  }

  const actionsRaw = Array.isArray(body.actions) ? body.actions : [];

  return {
    headline:
      typeof body.headline === "string" && body.headline.trim()
        ? body.headline.trim()
        : "AI Insight",
    summary: typeof body.summary === "string" ? body.summary.trim() : "",
    actions: actionsRaw
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .slice(0, 3),
  };
}