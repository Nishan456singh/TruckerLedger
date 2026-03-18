import { appwriteFunctions } from "@/lib/appwrite";

const DEFAULT_FUNCTION_ID = "69b4c5a5000a6e580608";

interface ExecutionResponse {
  error?: string;
  [key: string]: unknown;
}

function getFunctionId(): string {
  return process.env.EXPO_PUBLIC_APPWRITE_RECEIPT_AI_FUNCTION_ID ?? DEFAULT_FUNCTION_ID;
}

function safeParseResponse(raw: string): ExecutionResponse | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as ExecutionResponse;
    }
  } catch {
    return null;
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

    if (!execution.responseBody) {
      console.error("AI Function Client: No response body from execution");
      return null;
    }

    const body = safeParseResponse(execution.responseBody);

    if (!body) {
      console.error("AI Function Client: Failed to parse response", execution.responseBody);
      return null;
    }

    if (body.error) {
      console.error("AI Function Client: API returned error", body.error);
      return null;
    }

    return body as T;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`AI Function Client: Execution failed - ${message}`);
    return null;
  }
}