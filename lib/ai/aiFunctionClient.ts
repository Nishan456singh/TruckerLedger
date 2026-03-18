import { appwriteFunctions } from "@/lib/appwrite";

const DEFAULT_FUNCTION_ID = "69b4c5a5000a6e580608";

interface ExecutionResponse {
  error?: string;
  [key: string]: unknown;
}

function getFunctionId(): string {
  return (
    process.env.EXPO_PUBLIC_APPWRITE_RECEIPT_AI_FUNCTION_ID ??
    DEFAULT_FUNCTION_ID
  );
}

function safeParseResponse(raw: string): ExecutionResponse | null {
  try {
    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as ExecutionResponse;
    }
  } catch (err) {
    console.error("AI Function Client: JSON parse error", raw);
  }

  return null;
}

export async function executeAiTask<T>(
  task: "receipt_parse" | "bol_parse" | "business_insights",
  payload: object
): Promise<T | null> {
  const functionId = getFunctionId();

  if (!functionId) {
    console.error("AI Function Client: Missing function ID");
    return null;
  }

  try {
    const execution = await appwriteFunctions.createExecution({
      functionId,
      async: false,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        task,
        payload,
      }),
    });

    // 🔥 DEBUG: log full execution
    console.log("AI Function Client: FULL EXECUTION", execution);

    const raw = execution.responseBody;

    // 🔥 FIX: handle empty / undefined / blank response
    if (!raw || raw.trim() === "") {
      console.error(
        "AI Function Client: Empty response body. Execution:",
        {
          status: (execution as any).status,
          logs: (execution as any).logs,
        }
      );
      return null;
    }

    const body = safeParseResponse(raw);

    if (!body) {
      console.error(
        "AI Function Client: Failed to parse response",
        raw
      );
      return null;
    }

    if (body.error) {
      console.error(
        "AI Function Client: API returned error",
        body.error
      );
      return null;
    }

    return body as T;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    console.error(
      `AI Function Client: Execution failed - ${message}`
    );

    return null;
  }
}