import { GoogleGenAI } from "@google/genai";

// ============================================================
// GEMINI CLIENT FACTORY & FALLBACK — Tuân thủ api.md v4.1
// ============================================================

/** Chuỗi fallback model ổn định theo api.md Section I */
export const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
] as const;

/** Model mặc định */
export const DEFAULT_MODEL = "gemini-2.5-flash";

// ============================================================
// API ERROR PARSER — Phân loại lỗi theo api.md Section II
// ============================================================

export type ApiErrorType =
  | "MODEL_OVERLOADED"
  | "QUOTA_EXCEEDED"
  | "INVALID_API_KEY"
  | "INVALID_ARGUMENT"
  | "NOT_FOUND"
  | "UNKNOWN";

export const parseApiError = (error: any): ApiErrorType => {
  const message = error?.message || error?.toString() || "";
  const serialized = JSON.stringify(error) || "";
  const combined = `${message} ${serialized}`.toLowerCase();

  // 429 / RESOURCE_EXHAUSTED — quota/rate limit; KHÔNG đánh dấu key invalid
  if (
    serialized.includes("429") ||
    combined.includes("resource_exhausted") ||
    combined.includes("quota")
  ) {
    return "QUOTA_EXCEEDED";
  }

  // 503 / UNAVAILABLE / overloaded — model tạm quá tải
  if (
    serialized.includes("503") ||
    serialized.includes("504") ||
    combined.includes("unavailable") ||
    combined.includes("high demand") ||
    combined.includes("overloaded") ||
    combined.includes("try again later") ||
    combined.includes("temporarily unavailable")
  ) {
    return "MODEL_OVERLOADED";
  }

  // 404 / NOT_FOUND — model không tồn tại
  if (serialized.includes("404") || combined.includes("not_found")) {
    return "NOT_FOUND";
  }

  // 401 / API_KEY_INVALID / PERMISSION_DENIED — key sai/hết hạn
  if (
    combined.includes("api_key_invalid") ||
    serialized.includes("401") ||
    combined.includes("permission_denied") ||
    serialized.includes("403")
  ) {
    return "INVALID_API_KEY";
  }

  // 400 / INVALID_ARGUMENT — payload sai
  if (serialized.includes("400") || combined.includes("invalid_argument")) {
    return "INVALID_ARGUMENT";
  }

  return "UNKNOWN";
};

// ============================================================
// CLIENT FACTORY — Theo api.md Section III
// ============================================================

export const createGeminiClient = (apiKey: string): GoogleGenAI => {
  return new GoogleGenAI({ apiKey });
};

// ============================================================
// GET ORDERED MODELS — User model first, then fallback (no duplicates)
// ============================================================

export const getOrderedModels = (selectedModel?: string): string[] => {
  const fallbackList = [...FALLBACK_MODELS];
  if (!selectedModel) return [DEFAULT_MODEL, ...fallbackList.filter((m) => m !== DEFAULT_MODEL)];

  // User's model first, then rest of fallback without duplicates
  const ordered = [selectedModel, ...fallbackList.filter((m) => m !== selectedModel)];
  return ordered;
};

// ============================================================
// GENERATE CONTENT WITH MODEL FALLBACK
// ============================================================

interface FallbackOptions {
  apiKey: string;
  selectedModel?: string;
  contents: any;
  config?: any;
}

interface FallbackResult {
  text: string;
  modelUsed: string;
  fallbackUsed: boolean;
}

export const generateContentWithFallback = async (
  options: FallbackOptions
): Promise<FallbackResult> => {
  const { apiKey, selectedModel, contents, config } = options;
  const ai = createGeminiClient(apiKey);
  const models = getOrderedModels(selectedModel);
  let lastError: any = null;
  const firstModel = models[0];

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        ...(config ? { config } : {}),
      });

      return {
        text: response.text || "",
        modelUsed: model,
        fallbackUsed: model !== firstModel,
      };
    } catch (error: any) {
      lastError = error;
      const errorType = parseApiError(error);

      console.warn(
        `[Gemini Fallback] Model "${model}" failed with ${errorType}: ${error.message?.substring(0, 120)}`
      );

      // Lỗi phải dừng ngay, không chuyển model (api.md Section II)
      if (
        errorType === "INVALID_API_KEY" ||
        errorType === "QUOTA_EXCEEDED" ||
        errorType === "INVALID_ARGUMENT" ||
        errorType === "UNKNOWN"
      ) {
        break;
      }

      // MODEL_OVERLOADED hoặc NOT_FOUND → thử model tiếp theo
      // continue to next model
    }
  }

  throw lastError || new Error("Tất cả model Gemini đều không phản hồi. Vui lòng thử lại sau.");
};

// ============================================================
// FRIENDLY ERROR MESSAGES — Theo api.md Section V
// ============================================================

export const getFriendlyErrorMessage = (error: any): { message: string; statusCode: number } => {
  const errorType = parseApiError(error);

  switch (errorType) {
    case "INVALID_API_KEY":
      return {
        message: "API Key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại trong Cài đặt.",
        statusCode: 401,
      };
    case "QUOTA_EXCEEDED":
      return {
        message: "Đã hết quota hoặc vượt giới hạn tốc độ API. Vui lòng đợi rồi thử lại.",
        statusCode: 429,
      };
    case "MODEL_OVERLOADED":
      return {
        message: "Model đang quá tải; app đang tự động thử model dự phòng.",
        statusCode: 503,
      };
    case "NOT_FOUND":
      return {
        message: "Model không khả dụng. Hệ thống sẽ tự chuyển sang model dự phòng.",
        statusCode: 404,
      };
    case "INVALID_ARGUMENT":
      return {
        message: "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại nội dung gửi.",
        statusCode: 400,
      };
    default:
      return {
        message: "Lỗi xử lý yêu cầu AI. Vui lòng thử lại sau.",
        statusCode: 500,
      };
  }
};
