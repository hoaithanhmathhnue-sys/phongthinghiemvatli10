import { GoogleGenAI } from "@google/genai";

// ============================================================================
// ĐỊNH NGHĨA KIỂU & HẰNG SỐ — Tuân thủ api.md v4.1 (09/08/2026)
// ============================================================================

export type AiProvider = "gemini" | "agent-platform";

/** Regex kiểm tra định dạng API Key theo api.md Section V (hỗ trợ cả AIzaSy... và AQ...) */
export const GOOGLE_AI_API_KEY_PATTERN = /^(?:AIzaSy|AQ)\S{8,}$/;

/** Danh sách Model Gemini API ổn định/GA theo api.md Section I */
export const GEMINI_MODELS = [
  { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash (Khuyên dùng - Nhanh, mạnh)", priority: 1, isDefault: true },
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash (Dự phòng chất lượng cao)", priority: 2 },
  { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash-Lite (Tốc độ cao, tối ưu token)", priority: 3 },
  { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash-Lite (Tương thích ngược)", priority: 4 },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Ổn định)", priority: 5 },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (Suy luận sâu, tài liệu dài)", priority: 6 },
] as const;

export const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";

/** Chuỗi Fallback Gemini mặc định theo api.md Section II */
export const GEMINI_FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
] as const;

/** Danh sách Model Agent Platform API theo api.md Section III */
export const AGENT_PLATFORM_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Khuyên dùng - Mặc định)", isDefault: true },
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash-Lite (Tốc độ cao)", isDefault: false },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (Suy luận mạnh)", isDefault: false },
  { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview (Thử nghiệm)", isDefault: false },
] as const;

export const DEFAULT_AGENT_PLATFORM_MODEL = "gemini-2.5-flash";

/** Chuỗi Fallback Agent Platform API theo api.md Section III */
export const AGENT_PLATFORM_FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
] as const;

// ============================================================================
// QUẢN LÝ LƯU TRỮ (LOCALSTORAGE) — Theo api.md Section III & V
// ============================================================================

export const STORAGE_KEYS = {
  GEMINI_KEY: "gemini_api_key",
  AGENT_PLATFORM_KEY: "agent_platform_api_key",
  PROVIDER: "google_ai_provider",
  PROVIDER_SOURCE: "google_ai_provider_selection_source",
  GEMINI_MODEL: "google_ai_gemini_model",
  AGENT_PLATFORM_MODEL: "google_ai_agent_platform_model",
} as const;

/** Lấy Provider đã lưu (mặc định 'gemini', tự chuyển nếu lưu 'vertex' cũ) */
export const getStoredProvider = (): AiProvider => {
  if (typeof window === "undefined") return "gemini";
  const saved = localStorage.getItem(STORAGE_KEYS.PROVIDER);
  if (saved === "agent-platform") return "agent-platform";
  // Nếu app cũ từng lưu vertex, chuyển về gemini mặc định theo api.md Section III
  if (saved === "vertex") {
    localStorage.setItem(STORAGE_KEYS.PROVIDER, "gemini");
    localStorage.setItem(STORAGE_KEYS.PROVIDER_SOURCE, "manual");
  }
  return "gemini";
};

/** Lưu Provider người dùng chọn thủ công */
export const setStoredProvider = (provider: AiProvider): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.PROVIDER, provider);
  localStorage.setItem(STORAGE_KEYS.PROVIDER_SOURCE, "manual");
};

/** Lấy API Key theo Provider cụ thể (lưu riêng, không ghi đè) */
export const getStoredApiKey = (provider?: AiProvider): string => {
  if (typeof window === "undefined") return "";
  const targetProvider = provider || getStoredProvider();
  if (targetProvider === "agent-platform") {
    return localStorage.getItem(STORAGE_KEYS.AGENT_PLATFORM_KEY) || "";
  }
  // Gemini API: lấy từ localStorage, nếu không có thử biến môi trường client
  const localKey = localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || "";
  if (localKey) return localKey;

  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEYS || "";
  return envKey ? envKey.split(",")[0].trim() : "";
};

/** Lưu API Key theo Provider cụ thể */
export const setStoredApiKey = (provider: AiProvider, key: string): void => {
  if (typeof window === "undefined") return;
  const cleanKey = key.trim();
  if (provider === "agent-platform") {
    if (cleanKey) localStorage.setItem(STORAGE_KEYS.AGENT_PLATFORM_KEY, cleanKey);
    else localStorage.removeItem(STORAGE_KEYS.AGENT_PLATFORM_KEY);
  } else {
    if (cleanKey) localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, cleanKey);
    else localStorage.removeItem(STORAGE_KEYS.GEMINI_KEY);
  }
};

/** Lấy Model đã chọn theo Provider */
export const getStoredModel = (provider?: AiProvider): string => {
  if (typeof window === "undefined") return DEFAULT_GEMINI_MODEL;
  const targetProvider = provider || getStoredProvider();
  if (targetProvider === "agent-platform") {
    const model = localStorage.getItem(STORAGE_KEYS.AGENT_PLATFORM_MODEL);
    const valid = AGENT_PLATFORM_MODELS.some((m) => m.id === model);
    return valid && model ? model : DEFAULT_AGENT_PLATFORM_MODEL;
  }
  const model = localStorage.getItem(STORAGE_KEYS.GEMINI_MODEL);
  const valid = GEMINI_MODELS.some((m) => m.id === model);
  return valid && model ? model : DEFAULT_GEMINI_MODEL;
};

/** Lưu Model đã chọn theo Provider */
export const setStoredModel = (provider: AiProvider, model: string): void => {
  if (typeof window === "undefined") return;
  if (provider === "agent-platform") {
    localStorage.setItem(STORAGE_KEYS.AGENT_PLATFORM_MODEL, model);
  } else {
    localStorage.setItem(STORAGE_KEYS.GEMINI_MODEL, model);
  }
};

/** Xóa Key của Provider cụ thể */
export const clearStoredApiKey = (provider: AiProvider): void => {
  if (typeof window === "undefined") return;
  if (provider === "agent-platform") {
    localStorage.removeItem(STORAGE_KEYS.AGENT_PLATFORM_KEY);
  } else {
    localStorage.removeItem(STORAGE_KEYS.GEMINI_KEY);
  }
};

/** Kiểm tra định dạng API Key hợp lệ */
export const validateApiKey = (key: string): boolean => {
  if (!key) return false;
  return GOOGLE_AI_API_KEY_PATTERN.test(key.trim());
};

/** Kiểm tra xem ứng dụng đã có cấu hình API Key khả dụng hay chưa */
export const hasConfiguredKey = (): boolean => {
  const currentProvider = getStoredProvider();
  const key = getStoredApiKey(currentProvider);
  return !!key && validateApiKey(key);
};

// ============================================================================
// CLIENT FACTORY DÙNG CHUNG — Bắt buộc theo api.md Section III
// ============================================================================

/**
 * Khởi tạo client Google GenAI duy nhất.
 * Cờ vertexai: true chỉ là cờ kỹ thuật của SDK để định tuyến tới Agent Platform.
 */
export const createGoogleAiClient = (apiKey: string, provider: AiProvider): GoogleGenAI => {
  if (provider === "agent-platform") {
    return new GoogleGenAI({ vertexai: true, apiKey });
  }
  return new GoogleGenAI({ apiKey });
};

// ============================================================================
// PHÂN TÍCH LỖI & THÔNG BÁO THÂN THIỆN — api.md Section II & V
// ============================================================================

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

  // 429 / RESOURCE_EXHAUSTED — Quota/rate limit; KHÔNG đánh dấu key là invalid
  if (
    serialized.includes("429") ||
    combined.includes("resource_exhausted") ||
    combined.includes("quota")
  ) {
    return "QUOTA_EXCEEDED";
  }

  // 500, 503, 504, overloaded, high demand, unavailable — Tạm thời quá tải
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

  // 404 / NOT_FOUND
  if (serialized.includes("404") || combined.includes("not_found")) {
    return "NOT_FOUND";
  }

  // 403 / PERMISSION_DENIED
  if (serialized.includes("403") || combined.includes("permission_denied")) {
    return "PERMISSION_DENIED";
  }

  // 401 / API_KEY_INVALID
  if (
    combined.includes("api_key_invalid") ||
    serialized.includes("401") ||
    combined.includes("api key not valid")
  ) {
    return "INVALID_API_KEY";
  }

  // 400 / INVALID_ARGUMENT
  if (serialized.includes("400") || combined.includes("invalid_argument")) {
    return "INVALID_ARGUMENT";
  }

  return "UNKNOWN";
};

export const getFriendlyErrorMessage = (error: any, provider: AiProvider = "gemini"): string => {
  const type = parseApiError(error);

  switch (type) {
    case "INVALID_API_KEY":
      return "API Key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại trong Cài đặt.";
    case "PERMISSION_DENIED":
      if (provider === "agent-platform") {
        return "Google đã nhận key nhưng dự án/key chưa được cấp quyền gọi Agent Platform API hoặc model này. Vui lòng kiểm tra: Agent Platform API đã bật, billing, API restrictions và quyền sử dụng model.";
      }
      return "API key không có quyền truy cập Gemini API.";
    case "QUOTA_EXCEEDED":
      return "Đã hết quota hoặc vượt giới hạn tốc độ API. Vui lòng đợi rồi thử lại.";
    case "MODEL_OVERLOADED":
      return "Model đang quá tải; app đang tự động thử model dự phòng.";
    case "NOT_FOUND":
      return "Model hoặc endpoint không tồn tại hoặc đã ngừng hỗ trợ.";
    case "INVALID_ARGUMENT":
      return "Yêu cầu hoặc tham số gửi lên không hợp lệ.";
    default:
      return error?.message || "Lỗi xử lý yêu cầu AI. Vui lòng thử lại sau.";
  }
};

// ============================================================================
// HÀM LẤY DANH SÁCH MODEL FALLBACK THEO THỨ TỰ
// ============================================================================

export const getOrderedFallbackModels = (
  provider: AiProvider,
  userSelectedModel?: string
): string[] => {
  if (provider === "agent-platform") {
    const baseList = [...AGENT_PLATFORM_FALLBACK_MODELS] as string[];
    const chosen = userSelectedModel || DEFAULT_AGENT_PLATFORM_MODEL;
    return [chosen, ...baseList.filter((m) => m !== chosen)];
  }

  const baseList = [...GEMINI_FALLBACK_MODELS] as string[];
  const chosen = userSelectedModel || DEFAULT_GEMINI_MODEL;
  return [chosen, ...baseList.filter((m) => m !== chosen)];
};

// ============================================================================
// GENERATE CONTENT WITH FALLBACK — Toàn bộ tác vụ AI đi qua hàm này
// ============================================================================

export interface FallbackCallParams {
  contents: any;
  config?: any;
  provider?: AiProvider;
  apiKey?: string;
  selectedModel?: string;
  onFallback?: (fromModel: string, toModel: string, reason: string) => void;
}

export interface FallbackCallResult {
  text: string;
  modelUsed: string;
  fallbackUsed: boolean;
  providerUsed: AiProvider;
}

export const generateContentWithFallback = async (
  params: FallbackCallParams
): Promise<FallbackCallResult> => {
  const provider = params.provider || getStoredProvider();
  const apiKey = params.apiKey || getStoredApiKey(provider);

  if (!apiKey) {
    throw new Error("Vui lòng cấu hình API Key trước khi sử dụng tính năng này.");
  }

  const userModel = params.selectedModel || getStoredModel(provider);
  const modelsToTry = getOrderedFallbackModels(provider, userModel);
  const ai = createGoogleAiClient(apiKey, provider);

  let lastError: any = null;
  const firstModel = modelsToTry[0];

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];

    try {
      // Chuẩn hóa config theo api.md Section IV:
      // Không gửi temperature, topP, topK với các model mới (gemini-3.6, 3.5 Lite, v.v.)
      const cleanedConfig = { ...(params.config || {}) };
      if (
        currentModel.includes("3.6") ||
        currentModel.includes("3.5-flash-lite") ||
        currentModel.startsWith("gemini-3")
      ) {
        delete cleanedConfig.temperature;
        delete cleanedConfig.topP;
        delete cleanedConfig.topK;

        // Bật thinking HIGH nếu chưa có config riêng
        if (!cleanedConfig.thinkingConfig) {
          cleanedConfig.thinkingConfig = { thinkingLevel: "HIGH" };
        }
      }

      const response = await ai.models.generateContent({
        model: currentModel,
        contents: params.contents,
        ...(Object.keys(cleanedConfig).length > 0 ? { config: cleanedConfig } : {}),
      });

      return {
        text: response.text || "",
        modelUsed: currentModel,
        fallbackUsed: currentModel !== firstModel,
        providerUsed: provider,
      };
    } catch (err: any) {
      lastError = err;
      const errorType = parseApiError(err);

      // Log an toàn, tuyệt đối không log full API Key
      console.warn(
        `[AI Client Fallback] Provider: "${provider}", Model: "${currentModel}" failed (${errorType}): ${err?.message?.substring(0, 100)}`
      );

      // Lỗi 401, 400, 429: Phải dừng ngay, không chuyển model (api.md Section II)
      if (
        errorType === "INVALID_API_KEY" ||
        errorType === "QUOTA_EXCEEDED" ||
        errorType === "INVALID_ARGUMENT"
      ) {
        break;
      }

      // Với Agent Platform: lỗi 403 PERMISSION_DENIED được phép thử model tiếp theo một lần
      if (errorType === "PERMISSION_DENIED") {
        if (provider === "agent-platform" && i < modelsToTry.length - 1) {
          const nextModel = modelsToTry[i + 1];
          if (params.onFallback) {
            params.onFallback(currentModel, nextModel, "Quyền truy cập bị từ chối trên model hiện tại");
          }
          continue;
        }
        break;
      }

      // Lỗi MODEL_OVERLOADED (500, 503, 504) hoặc NOT_FOUND (404): Thử model tiếp theo
      if (errorType === "MODEL_OVERLOADED" || errorType === "NOT_FOUND") {
        if (i < modelsToTry.length - 1) {
          const nextModel = modelsToTry[i + 1];
          if (params.onFallback) {
            params.onFallback(currentModel, nextModel, "Model đang quá tải hoặc tạm thời không khả dụng");
          }
          continue;
        }
      }

      // Lỗi không xác định khác: dừng để không lặp request ngoài ý muốn
      break;
    }
  }

  const friendly = getFriendlyErrorMessage(lastError, provider);
  throw new Error(friendly);
};

// ============================================================================
// HÀM KIỂM TRA KẾT NỐI (TEST KEY)
// ============================================================================

export const testApiConnection = async (
  apiKey: string,
  provider: AiProvider,
  model?: string
): Promise<{ success: boolean; message: string; modelUsed?: string }> => {
  if (!apiKey) {
    return { success: false, message: "Vui lòng nhập API Key để kiểm tra." };
  }
  if (!validateApiKey(apiKey)) {
    return {
      success: false,
      message: "Định dạng API Key không đúng chuẩn (phải bắt đầu bằng AIzaSy... hoặc AQ...).",
    };
  }

  const targetModel = model || (provider === "agent-platform" ? DEFAULT_AGENT_PLATFORM_MODEL : DEFAULT_GEMINI_MODEL);

  try {
    const ai = createGoogleAiClient(apiKey, provider);
    const response = await ai.models.generateContent({
      model: targetModel,
      contents: "Xin chào! Hãy phản hồi đúng 1 chữ: OK",
    });

    const reply = response.text?.trim() || "";
    return {
      success: true,
      message: `Kết nối thành công tới ${provider === "agent-platform" ? "Agent Platform API" : "Gemini API"} (Model: ${targetModel})!`,
      modelUsed: targetModel,
    };
  } catch (err: any) {
    console.error("[Test Connection Error]:", err);
    return {
      success: false,
      message: getFriendlyErrorMessage(err, provider),
    };
  }
};

// ============================================================================
// TÁC VỤ AI CỤ THỂ CỦA ỨNG DỤNG PHÒNG THÍ NGHIỆM VẬT LÍ 10
// ============================================================================

/** Chat với Trợ lý AI Sư phạm Socratic */
export const chatWithAITutor = async (params: {
  message: string;
  history?: Array<{ role: string; text: string }>;
  labId?: string;
  currentLabContext?: any;
  onFallback?: (fromModel: string, toModel: string, reason: string) => void;
}): Promise<{ reply: string; modelUsed: string; fallbackUsed: boolean }> => {
  const provider = getStoredProvider();
  const apiKey = getStoredApiKey(provider);

  const systemPrompt = `Bạn là Trợ lý AI Sư phạm Vật lí lớp 10 (Physics AI Tutor), đồng thời là Giảng viên Sư phạm Vật lí thực nghiệm.
Chương trình giảng dạy: Vật lí 10 - Chương trình GDPT 2018 (Bộ sách Kết nối tri thức với cuộc sống).
Thí nghiệm học sinh đang làm hiện tại (labId: ${params.labId || "chưa xác định"}):
${JSON.stringify(params.currentLabContext || {}, null, 2)}

Nhiệm vụ của bạn:
1. Giải đáp thắc mắc khoa học một cách ân cần, chuẩn mực, ngắn gọn và truyền cảm hứng.
2. Áp dụng phương pháp gợi mở Socratic: không vội cho đáp án ngay mà hướng dẫn học sinh quan sát đồ thị, dụng cụ đo (đồng hồ hiện số MC964, cổng quang, thước mm, lực kế).
3. Hướng dẫn tính toán sai số, quy tắc viết số có nghĩa (theo Bài 3 SGK).
4. Khuyến khích học sinh liên hệ hiện tượng thực tế (ví dụ: an toàn giao thông, dù lượn, cân bằng xe, giảm sóc lò xo).
5. Trình bày công thức bằng định dạng Markdown với ký hiệu LaTeX/MathJax: dùng \\( ... \\) cho inline hoặc \\[ ... \\] cho block. Không dùng $...$ đơn lẻ.
6. Khi viết công thức, hãy viết rõ ràng, chuẩn LaTeX. Ví dụ: \\( g = \\frac{2s}{t^2} \\) hoặc \\[ v = v_0 + at \\]`;

  // Ưu tiên 1: Chạy trực tiếp phía Client nếu đã có API Key
  if (apiKey && validateApiKey(apiKey)) {
    const contents: any[] = [];
    if (params.history && params.history.length > 0) {
      for (const h of params.history) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: params.message }],
    });

    const res = await generateContentWithFallback({
      provider,
      apiKey,
      contents,
      config: {
        systemInstruction: systemPrompt,
      },
      onFallback: params.onFallback,
    });

    return {
      reply: res.text || "AI đã ghi nhận câu hỏi.",
      modelUsed: res.modelUsed,
      fallbackUsed: res.fallbackUsed,
    };
  }

  // Ưu tiên 2: Thử gọi qua API backend proxy nếu chưa nhập client key
  try {
    const res = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: params.message,
        labId: params.labId,
        history: params.history || [],
        currentLabContext: params.currentLabContext,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        reply: data.reply || "",
        modelUsed: data.modelUsed || "server",
        fallbackUsed: !!data.fallbackUsed,
      };
    }
  } catch (_e) {
    // server unreachable
  }

  throw new Error("Vui lòng cấu hình API Key trong phần Cài đặt để sử dụng Trợ lý AI.");
};

/** Tạo thiết lập mô phỏng theo yêu cầu giáo viên hoặc giáo án */
export const generateSimulationSetup = async (params: {
  prompt: string;
  onFallback?: (fromModel: string, toModel: string, reason: string) => void;
}): Promise<any> => {
  const provider = getStoredProvider();
  const apiKey = getStoredApiKey(provider);

  const systemInstruction = `Bạn là Chuyên gia Thiết kế Thí nghiệm Vật lí ảo THPT theo chuẩn SGK Kết nối tri thức. Hãy phân tích yêu cầu của giáo viên và tạo ra một kịch bản thí nghiệm mô phỏng chi tiết dưới dạng JSON thuần túy (không markdown bao quanh).`;

  // Ưu tiên 1: Client direct
  if (apiKey && validateApiKey(apiKey)) {
    const res = await generateContentWithFallback({
      provider,
      apiKey,
      contents: params.prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
      onFallback: params.onFallback,
    });

    const text = res.text || "";
    try {
      return JSON.parse(text);
    } catch (_err) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      throw new Error("Không thể phân tích dữ liệu JSON phản hồi từ AI.");
    }
  }

  // Ưu tiên 2: Fallback server
  try {
    const res = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        labId: "free_sandbox",
        message: params.prompt,
        history: [],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.reply || data.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    }
  } catch (_e) {
    // ignore
  }

  throw new Error("Vui lòng cấu hình API Key trong mục Cài đặt trước khi tạo mô phỏng AI.");
};

/** Chấm điểm và phân tích Báo cáo thực hành số */
export const gradeLabReport = async (params: {
  reportData: any;
  onFallback?: (fromModel: string, toModel: string, reason: string) => void;
}): Promise<any> => {
  const provider = getStoredProvider();
  const apiKey = getStoredApiKey(provider);

  const prompt = `Bạn là Giảng viên Sư phạm Vật lí thực nghiệm chuyên môn cao, chấm và đánh giá Báo cáo thực hành số môn Vật lí 10 (Chương trình GDPT 2018 - SGK Kết nối tri thức).
Dưới đây là dữ liệu Báo cáo thực hành chi tiết của học sinh:
${JSON.stringify(params.reportData, null, 2)}

YÊU CẦU ĐÁNH GIÁ CHUYÊN SÂU:
1. Đánh giá kết quả đo, việc tính toán giá trị trung bình, sai số tuyệt đối, sai số tỉ đối và cách biểu diễn kết quả theo Bài 3 SGK (A = A_tb ± ΔA).
2. PHÂN TÍCH NGUYÊN NHÂN TIỀM ẨN GÂY RA SAI SỐ DỰA TRÊN BÀI THÍ NGHIỆM CỤ THỂ theo 3 nhóm cốt lõi:
   - Sai số hệ thống (Systematic error): Do giới hạn dụng cụ đo (độ chia nhỏ nhất thước cặp 0.02mm, thước mm 1mm, đồng hồ đo thời gian MC964 0.001s, độ trễ rơ-le điện từ cổng quang điện, ma sát ổ trục đĩa quay hoặc rãnh đệm khí, độ dãn dư của lò xo...).
   - Sai số ngẫu nhiên (Random error): Do thao tác của học sinh (nhìn nghiêng lệch vạch chia parallax, căn chỉnh cổng quang điện chưa chuẩn trực, bấm nhả chốt nam châm, đặt vật chưa đúng vạch xuất phát...).
   - Sai số do môi trường (Environmental error): Lực cản không khí, luồng gió quạt phòng thí nghiệm, rung lắc mặt bàn, nhiệt độ/độ ẩm môi trường ảnh hưởng đến độ nhớt hoặc độ đàn hồi...
3. ĐƯA RA BIỆN PHÁP KHẮC PHỤC / GIẢM THIỂU CỤ THỂ cho từng loại sai số trong các lần thực hành tiếp theo.
4. Đánh giá mức độ năng lực đạt được theo Chương trình GDPT 2018:
   - Mức 1 - Chưa đạt (Dưới 5.0): Số liệu sai lệch quá lớn, không tính sai số, trả lời tự luận sai bản chất vật lí.
   - Mức 2 - Đạt (5.0 - 6.5): Số liệu đo được nhưng còn nhầm lẫn số chữ số có nghĩa hoặc sai số.
   - Mức 3 - Khá (7.0 - 8.5): Đo đạc và tính đúng sai số, giải thích đúng cơ bản hiện tượng vật lí.
   - Mức 4 - Tốt / Xuất sắc (9.0 - 10.0): Thao tác chuẩn mực, tính sai số chính xác, nhận diện thấu đáo nguồn sai số và đề xuất giải pháp giảm thiểu mang tính khoa học cao.

QUAN TRỌNG: Khi viết công thức vật lí, hãy dùng ký hiệu LaTeX/MathJax trong dấu \\( ... \\) cho inline hoặc \\[ ... \\] cho block.
Ví dụ: \\( g = \\frac{2s}{t^2} \\), \\( \\Delta A = \\sqrt{(\\Delta A_{nn})^2 + (\\Delta A_{dc})^2} \\)

Hãy trả về phản hồi DUY NHẤT dưới dạng chuỗi JSON thuần với cấu trúc chính xác sau:
{
  "totalScore": 8.5,
  "level": "Mức 3 - Khá",
  "gdptCompetencyLevel": "Đạt chuẩn năng lực Tìm hiểu thế giới tự nhiên dưới góc độ vật lí (Mức Khá)",
  "dataAccuracyReview": "Nhận xét chi tiết về độ hội tụ và tính hợp lí của dãy số liệu đo đạc...",
  "errorCalculationReview": "Nhận xét về các bước tính sai số ngẫu nhiên, sai số dụng cụ, quy tắc làm tròn...",
  "theoryQuestionsReview": "Nhận xét về 2 câu trả lời tự luận và khả năng vận dụng kiến thức bài học...",
  "errorSources": {
    "systematicError": {
      "analysis": "Phân tích cụ thể nguyên nhân sai số hệ thống trong bài thí nghiệm này...",
      "mitigation": "Biện pháp kỹ thuật để giảm thiểu hoặc hiệu chuẩn sai số hệ thống..."
    },
    "randomError": {
      "analysis": "Phân tích nguyên nhân sai số ngẫu nhiên do thao tác người thực hiện...",
      "mitigation": "Quy tắc thao tác chuẩn giúp giảm thiểu sai số ngẫu nhiên trong lần đo tới..."
    },
    "environmentalError": {
      "analysis": "Phân tích các yếu tố môi trường (lực cản không khí, rung lắc...) ảnh hưởng kết quả...",
      "mitigation": "Cách thiết lập môi trường phòng thí nghiệm tối ưu hơn..."
    }
  },
  "strengths": ["Ưu điểm nổi bật 1", "Ưu điểm nổi bật 2"],
  "improvements": ["Điểm cần khắc phục 1", "Điểm cần khắc phục 2"],
  "teacherAdvice": "Lời dặn dò sư phạm ân cần định hướng phát triển năng lực nghiên cứu..."
}`;

  if (apiKey && validateApiKey(apiKey)) {
    const res = await generateContentWithFallback({
      provider,
      apiKey,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
      onFallback: params.onFallback,
    });

    const text = res.text || "";
    try {
      return JSON.parse(text);
    } catch (_err) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    }
  }

  // Fallback server
  try {
    const res = await fetch("/api/gemini/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportData: params.reportData }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.result || data.evaluation || data;
    }
  } catch (_e) {
    // ignore
  }

  throw new Error("Vui lòng cấu hình API Key trong mục Cài đặt trước khi chấm bài.");
};

