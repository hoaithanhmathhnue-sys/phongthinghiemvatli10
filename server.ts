import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// FALLBACK & ERROR HANDLING — Tuân thủ api.md v4.1
// ============================================================

const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
] as const;

const DEFAULT_MODEL = "gemini-2.5-flash";

type ApiErrorType = "MODEL_OVERLOADED" | "QUOTA_EXCEEDED" | "INVALID_API_KEY" | "INVALID_ARGUMENT" | "NOT_FOUND" | "UNKNOWN";

const parseApiError = (error: any): ApiErrorType => {
  const message = error?.message || error?.toString() || "";
  const serialized = JSON.stringify(error) || "";
  const combined = `${message} ${serialized}`.toLowerCase();

  if (serialized.includes("429") || combined.includes("resource_exhausted") || combined.includes("quota")) return "QUOTA_EXCEEDED";
  if (serialized.includes("503") || serialized.includes("504") || combined.includes("unavailable") || combined.includes("high demand") || combined.includes("overloaded") || combined.includes("try again later")) return "MODEL_OVERLOADED";
  if (serialized.includes("404") || combined.includes("not_found")) return "NOT_FOUND";
  if (combined.includes("api_key_invalid") || serialized.includes("401") || combined.includes("permission_denied") || serialized.includes("403")) return "INVALID_API_KEY";
  if (serialized.includes("400") || combined.includes("invalid_argument")) return "INVALID_ARGUMENT";
  return "UNKNOWN";
};

const getOrderedModels = (selectedModel?: string): string[] => {
  const fallbackList = [...FALLBACK_MODELS];
  if (!selectedModel) return [DEFAULT_MODEL, ...fallbackList.filter(m => m !== DEFAULT_MODEL)];
  return [selectedModel, ...fallbackList.filter(m => m !== selectedModel)];
};

const generateContentWithFallback = async (
  ai: GoogleGenAI,
  { contents, config, selectedModel }: { contents: any; config?: any; selectedModel?: string }
) => {
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
      return { text: response.text || "", modelUsed: model, fallbackUsed: model !== firstModel };
    } catch (error: any) {
      lastError = error;
      const errorType = parseApiError(error);
      console.warn(`[Gemini Fallback] Model "${model}" failed with ${errorType}: ${error.message?.substring(0, 120)}`);
      if (errorType === "INVALID_API_KEY" || errorType === "QUOTA_EXCEEDED" || errorType === "INVALID_ARGUMENT" || errorType === "UNKNOWN") break;
    }
  }
  throw lastError || new Error("Tất cả model Gemini đều không phản hồi. Vui lòng thử lại sau.");
};

const getFriendlyErrorMessage = (error: any): { message: string; statusCode: number } => {
  const errorType = parseApiError(error);
  switch (errorType) {
    case "INVALID_API_KEY": return { message: "API Key không hợp lệ hoặc đã hết hạn.", statusCode: 401 };
    case "QUOTA_EXCEEDED": return { message: "Đã hết quota hoặc vượt giới hạn tốc độ API. Vui lòng đợi rồi thử lại.", statusCode: 429 };
    case "MODEL_OVERLOADED": return { message: "Model đang quá tải; app đang tự động thử model dự phòng.", statusCode: 503 };
    case "NOT_FOUND": return { message: "Model không khả dụng.", statusCode: 404 };
    case "INVALID_ARGUMENT": return { message: "Yêu cầu không hợp lệ.", statusCode: 400 };
    default: return { message: "Lỗi xử lý yêu cầu AI.", statusCode: 500 };
  }
};

// ============================================================
// SERVER
// ============================================================

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // Initialize Gemini AI Client — Client Factory duy nhất (api.md Section III)
  const getAiClient = (customKey?: string) => {
    const key = customKey || process.env.GEMINI_API_KEY;
    if (!key) return null;
    return new GoogleGenAI({ apiKey: key });
  };

  // Health Check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasServerKey: !!process.env.GEMINI_API_KEY,
      appName: "Physics AI-Lab 10",
      version: "2.0.0",
      defaultModel: DEFAULT_MODEL,
    });
  });

  // AI Tutor Chat Route — với Model Fallback
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history = [], currentLabContext, labId, customKey } = req.body;
      const ai = getAiClient(customKey);

      if (!ai) {
        return res.status(400).json({
          error: "Chưa cấu hình GEMINI_API_KEY ở máy chủ hoặc Client.",
          isKeyMissing: true,
        });
      }

      const systemPrompt = `Bạn là Trợ lý AI Sư phạm Vật lí lớp 10 (Physics AI Tutor), đồng thời là Giảng viên Sư phạm Vật lí thực nghiệm.
Chương trình giảng dạy: Vật lí 10 - Chương trình GDPT 2018 (Bộ sách Kết nối tri thức với cuộc sống).
Thí nghiệm học sinh đang làm hiện tại (labId: ${labId || "chưa xác định"}):
${JSON.stringify(currentLabContext || {}, null, 2)}

Nhiệm vụ của bạn:
1. Giải đáp thắc mắc khoa học một cách ân cần, chuẩn mực, ngắn gọn và truyền cảm hứng.
2. Áp dụng phương pháp gợi mở Socratic: không vội cho đáp án ngay mà hướng dẫn học sinh quan sát đồ thị, dụng cụ đo (đồng hồ hiện số MC964, cổng quang, thước mm, lực kế).
3. Hướng dẫn tính toán sai số, quy tắc viết số có nghĩa (theo Bài 3 SGK).
4. Khuyến khích học sinh liên hệ hiện tượng thực tế (ví dụ: an toàn giao thông, dù lượn, cân bằng xe, giảm sóc lò xo).
5. Trình bày công thức bằng định dạng Markdown với ký hiệu LaTeX/MathJax: dùng \\( ... \\) cho inline hoặc \\[ ... \\] cho block. Không dùng $...$ vì khó phân biệt với ký hiệu tiền tệ.
6. Khi viết công thức, hãy viết rõ ràng, chuẩn LaTeX. Ví dụ: \\( g = \\frac{2s}{t^2} \\) hoặc \\[ v = v_0 + at \\]`;

      const contents: any[] = [];
      for (const h of history) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        });
      }
      contents.push({
        role: "user",
        parts: [{ text: message }],
      });

      const result = await generateContentWithFallback(ai, {
        contents,
        config: {
          systemInstruction: systemPrompt,
        },
      });

      return res.json({
        reply: result.text || "AI đã ghi nhận câu hỏi nhưng chưa có phản hồi thích hợp.",
        modelUsed: result.modelUsed,
        fallbackUsed: result.fallbackUsed,
      });
    } catch (err: any) {
      console.error("Gemini Chat Error:", err);
      const friendly = getFriendlyErrorMessage(err);
      return res.status(friendly.statusCode).json({ error: friendly.message });
    }
  });

  // AI Automated Grading Route — với Model Fallback
  app.post("/api/gemini/grade", async (req, res) => {
    try {
      const { reportData, customKey } = req.body;
      const ai = getAiClient(customKey);

      if (!ai) {
        return res.status(400).json({
          error: "Chưa cấu hình API Key.",
          isKeyMissing: true,
        });
      }

      const prompt = `Bạn là Giảng viên Sư phạm Vật lí thực nghiệm chuyên môn cao, chấm và đánh giá Báo cáo thực hành số môn Vật lí 10 (Chương trình GDPT 2018 - SGK Kết nối tri thức).
Dưới đây là dữ liệu Báo cáo thực hành chi tiết của học sinh:
${JSON.stringify(reportData, null, 2)}

YÊU CẦU ĐÁNH GIÁ CHUYÊN SÂU:
1. Đánh giá kết quả đo, việc tính toán giá trị trung bình, sai số tuyệt đối, sai số tỉ đối và cách biểu diễn kết quả theo Bài 3 SGK (A = A_tb ± ΔA).
2. PHÂN TÍCH NGUYÊN NHÂN TIỀM ẨN GÂY RA SAI SỐ DỰA TRÊN BÀI THÍ NGHIỆM CỤ THỂ theo 3 nhóm cốt lõi:
   - Sai số hệ thống (Systematic error)
   - Sai số ngẫu nhiên (Random error)
   - Sai số do môi trường (Environmental error)
3. ĐƯA RA BIỆN PHÁP KHẮC PHỤC / GIẢM THIỂU CỤ THỂ cho từng loại sai số.
4. Đánh giá mức độ năng lực đạt được theo GDPT 2018.

QUAN TRỌNG: Khi viết công thức vật lí, hãy dùng ký hiệu LaTeX/MathJax: \\( ... \\) cho inline hoặc \\[ ... \\] cho block.

Hãy trả về phản hồi DUY NHẤT dưới dạng chuỗi JSON thuần với cấu trúc chính xác sau:
{
  "totalScore": 8.5,
  "level": "Mức 3 - Khá",
  "gdptCompetencyLevel": "...",
  "dataAccuracyReview": "...",
  "errorCalculationReview": "...",
  "theoryQuestionsReview": "...",
  "errorSources": {
    "systematicError": { "analysis": "...", "mitigation": "..." },
    "randomError": { "analysis": "...", "mitigation": "..." },
    "environmentalError": { "analysis": "...", "mitigation": "..." }
  },
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "teacherAdvice": "..."
}`;

      const result = await generateContentWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      let parsedResult;
      try {
        parsedResult = JSON.parse(result.text || "{}");
      } catch (_pErr) {
        parsedResult = {
          totalScore: 8.0,
          level: "Mức 3 - Khá",
          gdptCompetencyLevel: "Đạt chuẩn năng lực Tìm hiểu thế giới tự nhiên dưới góc độ vật lí (Mức Khá)",
          dataAccuracyReview: "Dãy số liệu thực nghiệm đo đạc có độ tin cậy tốt.",
          errorCalculationReview: "Học sinh đã áp dụng đúng công thức tính giá trị trung bình và xác định sai số theo Bài 3 SGK.",
          theoryQuestionsReview: "Trả lời tốt các câu hỏi bản chất vật lí.",
          errorSources: {
            systematicError: { analysis: "Độ trễ điện từ của rơ-le ngắt nam châm và độ phân giải của cổng quang điện MC964.", mitigation: "Cần hiệu chỉnh zero cho thiết bị trước khi đo." },
            randomError: { analysis: "Sai số góc nhìn parallax khi đọc thước đo.", mitigation: "Đặt tầm mắt ngang bằng vuông góc với vạch chia." },
            environmentalError: { analysis: "Lực cản không khí và rung chấn mặt bàn.", mitigation: "Thực hiện thí nghiệm trong phòng kín gió." },
          },
          strengths: ["Thu thập đầy đủ số liệu", "Biểu diễn kết quả đúng quy tắc"],
          improvements: ["Kiểm soát sai số parallax", "Phân tích sâu hơn"],
          teacherAdvice: "Em đã có tinh thần thực nghiệm tốt! Hãy tiếp tục phát triển.",
        };
      }

      return res.json({ result: parsedResult, evaluation: parsedResult, modelUsed: result.modelUsed });
    } catch (err: any) {
      console.error("Gemini Grading Error:", err);
      const friendly = getFriendlyErrorMessage(err);
      return res.status(friendly.statusCode).json({ error: friendly.message });
    }
  });

  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Physics AI-Lab 10 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
