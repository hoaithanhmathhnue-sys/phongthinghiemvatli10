import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateContentWithFallback, getFriendlyErrorMessage, AiProvider } from "../_lib/geminiClient";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history = [], currentLabContext, labId, customKey, apiKey: bodyKey, provider: bodyProvider, model: bodyModel } = req.body;

    const provider: AiProvider = bodyProvider === "agent-platform" ? "agent-platform" : "gemini";
    const apiKey = customKey || bodyKey || (provider === "gemini" ? process.env.GEMINI_API_KEY : process.env.AGENT_PLATFORM_API_KEY);

    if (!apiKey) {
      return res.status(400).json({
        error: "Vui lòng cấu hình API Key trong mục Cài đặt trước khi sử dụng tính năng này.",
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

    const result = await generateContentWithFallback({
      apiKey,
      provider,
      selectedModel: bodyModel,
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
    return res.status(friendly.statusCode).json({
      error: friendly.message,
    });
  }
}
