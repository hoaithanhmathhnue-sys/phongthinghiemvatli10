import { GoogleGenAI } from "@google/genai";

// ============================================================
// GOOGLE AI CLIENT FACTORY & FALLBACK — Tuân thủ api.md v4.1
// ============================================================

export type AiProvider = "gemini" | "agent-platform";

/** Chuỗi fallback model Gemini ổn định theo api.md Section I */
export const FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
] as const;

/** Chuỗi fallback model Agent Platform API theo api.md Section III */
export const AGENT_PLATFORM_FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
] as const;

/** Model mặc định theo api.md Section I */
export const DEFAULT_MODEL = "gemini-3.6-flash";
export const DEFAULT_AGENT_PLATFORM_MODEL = "gemini-2.5-flash";

// ============================================================
// API ERROR PARSER — Phân loại lỗi theo api.md Section II
// ============================================================

export type ApiErrorType =
  | "MODEL_OVERLOADED"
  | "QUOTA_EXCEEDED"
  | "INVALID_API_KEY"
  | "PERMISSION_DENIED"
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
    serialized.includes("500") ||
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

  // 403 / PERMISSION_DENIED
  if (serialized.includes("403") || combined.includes("permission_denied")) {
    return "PERMISSION_DENIED";
  }

  // 401 / API_KEY_INVALID — key sai/hết hạn
  if (
    combined.includes("api_key_invalid") ||
    serialized.includes("401") ||
    combined.includes("api key not valid")
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
// CLIENT FACTORY — Bắt buộc theo api.md Section III
// ============================================================

export const createGoogleAiClient = (
  apiKey: string,
  provider: AiProvider = "gemini"
): GoogleGenAI => {
  if (provider === "agent-platform") {
    return new GoogleGenAI({ vertexai: true, apiKey });
  }
  return new GoogleGenAI({ apiKey });
};

export const createGeminiClient = (apiKey: string): GoogleGenAI => {
  return createGoogleAiClient(apiKey, "gemini");
};

// ============================================================
// GET ORDERED MODELS — User model first, then fallback (no duplicates)
// ============================================================

export const getOrderedModels = (
  selectedModel?: string,
  provider: AiProvider = "gemini"
): string[] => {
  if (provider === "agent-platform") {
    const fallbackList = [...AGENT_PLATFORM_FALLBACK_MODELS];
    const defaultMod = DEFAULT_AGENT_PLATFORM_MODEL;
    if (!selectedModel) return [defaultMod, ...fallbackList.filter((m) => m !== defaultMod)];
    return [selectedModel, ...fallbackList.filter((m) => m !== selectedModel)];
  }

  const fallbackList = [...FALLBACK_MODELS];
  if (!selectedModel) return [DEFAULT_MODEL, ...fallbackList.filter((m) => m !== DEFAULT_MODEL)];
  return [selectedModel, ...fallbackList.filter((m) => m !== selectedModel)];
};

// ============================================================
// GENERATE CONTENT WITH MODEL FALLBACK
// ============================================================

interface FallbackOptions {
  apiKey: string;
  provider?: AiProvider;
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
  const { apiKey, provider = "gemini", selectedModel, contents, config } = options;
  const ai = createGoogleAiClient(apiKey, provider);
  const models = getOrderedModels(selectedModel, provider);
  let lastError: any = null;
  const firstModel = models[0];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const cleanedConfig = { ...(config || {}) };
      // Bỏ sampling cho Gemini 3.x theo api.md Section IV
      if (
        model.includes("3.6") ||
        model.includes("3.5-flash-lite") ||
        model.startsWith("gemini-3")
      ) {
        delete cleanedConfig.temperature;
        delete cleanedConfig.topP;
        delete cleanedConfig.topK;

        if (!cleanedConfig.thinkingConfig) {
          cleanedConfig.thinkingConfig = { thinkingLevel: "HIGH" };
        }
      }

      const response = await ai.models.generateContent({
        model,
        contents,
        ...(Object.keys(cleanedConfig).length > 0 ? { config: cleanedConfig } : {}),
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
        `[AI Server Fallback] Provider: "${provider}", Model "${model}" failed with ${errorType}: ${error.message?.substring(0, 120)}`
      );

      // Lỗi phải dừng ngay, không chuyển model (api.md Section II)
      if (
        errorType === "INVALID_API_KEY" ||
        errorType === "QUOTA_EXCEEDED" ||
        errorType === "INVALID_ARGUMENT"
      ) {
        break;
      }

      // Với Agent Platform: lỗi 403 PERMISSION_DENIED được phép thử model tiếp theo một lần
      if (errorType === "PERMISSION_DENIED") {
        if (provider === "agent-platform" && i < models.length - 1) {
          continue;
        }
        break;
      }

      // MODEL_OVERLOADED hoặc NOT_FOUND → thử model tiếp theo
      if (errorType === "MODEL_OVERLOADED" || errorType === "NOT_FOUND") {
        continue;
      }

      break;
    }
  }

  throw lastError || new Error("Tất cả model AI đều không phản hồi. Vui lòng thử lại sau.");
};

// ============================================================
// FRIENDLY ERROR MESSAGES — Theo api.md Section V
// ============================================================

export const getFriendlyErrorMessage = (
  error: any,
  provider: AiProvider = "gemini"
): { message: string; statusCode: number } => {
  const errorType = parseApiError(error);

  switch (errorType) {
    case "INVALID_API_KEY":
      return {
        message: "API Key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại trong Cài đặt.",
        statusCode: 401,
      };
    case "PERMISSION_DENIED":
      return {
        message:
          provider === "agent-platform"
            ? "Google đã nhận key nhưng dự án/key chưa được cấp quyền gọi Agent Platform API hoặc model này. Vui lòng kiểm tra Agent Platform API đã bật, billing, API restrictions và quyền sử dụng model."
            : "API key không có quyền truy cập Gemini API.",
        statusCode: 403,
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
        message: error?.message || "Lỗi xử lý yêu cầu AI. Vui lòng thử lại sau.",
        statusCode: 500,
      };
  }
};
