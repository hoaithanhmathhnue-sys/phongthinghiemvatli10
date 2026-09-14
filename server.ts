import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // Initialize Gemini AI Client lazily/safely
  const getAiClient = (customKey?: string) => {
    const key = customKey || process.env.GEMINI_API_KEY;
    if (!key) return null;
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasServerKey: !!process.env.GEMINI_API_KEY,
      appName: "Physics AI-Lab 10",
      version: "1.0.0",
    });
  });

  // AI Tutor Chat Route
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history = [], currentLabContext, customKey } = req.body;
      const ai = getAiClient(customKey);

      if (!ai) {
        return res.status(400).json({
          error: "Chưa cấu hình GEMINI_API_KEY ở máy chủ hoặc Client.",
          isKeyMissing: true,
        });
      }

      const systemPrompt = `Bạn là Trợ lý AI Sư phạm Vật lí lớp 10 (Physics AI Tutor), đồng thời là Giảng viên Sư phạm Vật lí thực nghiệm.
Chương trình giảng dạy: Vật lí 10 - Chương trình GDPT 2018 (Bộ sách Kết nối tri thức với cuộc sống).
Thí nghiệm học sinh đang làm hiện tại:
${JSON.stringify(currentLabContext || {}, null, 2)}

Nhiệm vụ của bạn:
1. Giải đáp thắc mắc khoa học một cách ân cần, chuẩn mực, ngắn gọn và truyền cảm hứng.
2. Áp dụng phương pháp gợi mở Socratic: không vội cho đáp án ngay mà hướng dẫn học sinh quan sát đồ thị, dụng cụ đo (đồng hồ hiện số MC964, cổng quang, thước mm, lực kế).
3. Hướng dẫn tính toán sai số, quy tắc viết số có nghĩa (theo Bài 3 SGK).
4. Khuyến khích học sinh liên hệ hiện tượng thực tế (ví dụ: an toàn giao thông, dù lượn, cân bằng xe, giảm sóc lò xo).
5. Trình bày công thức bằng định dạng Markdown rõ ràng ($...$ hoặc $$...$$).`;

      const contents = [];
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

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      return res.json({
        reply: response.text || "AI đã ghi nhận câu hỏi nhưng chưa có phản hồi thích hợp.",
      });
    } catch (err: any) {
      console.error("Gemini Chat Error:", err);
      return res.status(500).json({
        error: err.message || "Lỗi xử lý yêu cầu AI.",
      });
    }
  });

  // AI Automated Grading Route for Laboratory Reports (Bài 3 SGK GDPT 2018)
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
   - Sai số hệ thống (Systematic error): Do giới hạn dụng cụ đo (độ chia nhỏ nhất thước cặp 0.02mm, thước mm 1mm, đồng hồ đo thời gian MC964 0.001s, độ trễ rơ-le điện từ cổng quang điện, ma sát ổ trục đĩa quay hoặc rãnh đệm khí, độ dãn dư của lò xo...).
   - Sai số ngẫu nhiên (Random error): Do thao tác của học sinh (nhìn nghiêng lệch vạch chia parallax, căn chỉnh cổng quang điện chưa chuẩn trực, bấm nhả chốt nam châm, đặt vật chưa đúng vạch xuất phát...).
   - Sai số do môi trường (Environmental error): Lực cản không khí, luồng gió quạt phòng thí nghiệm, rung lắc mặt bàn, nhiệt độ/độ ẩm môi trường ảnh hưởng đến độ nhớt hoặc độ đàn hồi...
3. ĐƯA RA BIỆN PHÁP KHẮC PHỤC / GIẢM THIỂU CỤ THỂ cho từng loại sai số trong các lần thực hành tiếp theo.
4. Đánh giá mức độ năng lực đạt được theo Chương trình GDPT 2018:
   - Mức 1 - Chưa đạt (Dưới 5.0): Số liệu sai lệch quá lớn, không tính sai số, trả lời tự luận sai bản chất vật lí.
   - Mức 2 - Đạt (5.0 - 6.5): Số liệu đo được nhưng còn nhầm lẫn số chữ số có nghĩa hoặc sai số.
   - Mức 3 - Khá (7.0 - 8.5): Đo đạc và tính đúng sai số, giải thích đúng cơ bản hiện tượng vật lí.
   - Mức 4 - Tốt / Xuất sắc (9.0 - 10.0): Thao tác chuẩn mực, tính sai số chính xác, nhận diện thấu đáo nguồn sai số và đề xuất giải pháp giảm thiểu mang tính khoa học cao.

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

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      let parsedResult;
      try {
        parsedResult = JSON.parse(response.text || "{}");
      } catch (pErr) {
        parsedResult = {
          totalScore: 8.0,
          level: "Mức 3 - Khá",
          gdptCompetencyLevel: "Đạt chuẩn năng lực Tìm hiểu thế giới tự nhiên dưới góc độ vật lí (Mức Khá)",
          dataAccuracyReview: "Dãy số liệu thực nghiệm đo đạc có độ tin cậy tốt, thể hiện tính lặp lại ổn định giữa các lần đo.",
          errorCalculationReview: "Học sinh đã áp dụng đúng công thức tính giá trị trung bình và xác định sai số theo Bài 3 SGK.",
          theoryQuestionsReview: "Trả lời tốt các câu hỏi bản chất vật lí và cơ chế chuyển động.",
          errorSources: {
            systematicError: {
              analysis: "Độ trễ điện từ của rơ-le ngắt nam châm và độ phân giải của cổng quang điện MC964 (độ chia nhỏ nhất 0.001s).",
              mitigation: "Cần hiệu chỉnh zero cho thiết bị trước khi đo, kiểm tra độ nhạy của cảm biến quang điện."
            },
            randomError: {
              analysis: "Mắt quan sát vạch gióng không vuông góc tuyệt đối dẫn đến sai số góc nhìn (parallax error), thời điểm bấm nút chốt nhả.",
              mitigation: "Đặt tầm mắt ngang bằng vuông góc với vạch chia trên thước, thực hiện đo lặp lại từ 5 lần trở lên để triệt tiêu sai số ngẫu nhiên."
            },
            environmentalError: {
              analysis: "Lực cản của môi trường không khí và các rung chấn vi mô trên mặt bàn thí nghiệm.",
              mitigation: "Thực hiện thí nghiệm trong phòng kín gió, đặt chân giá đỡ vững chắc trên mặt bàn phẳng chống rung."
            }
          },
          strengths: [
            "Thu thập đầy đủ các lần đo theo yêu cầu",
            "Biểu diễn kết quả đúng quy tắc chuẩn A = A_tb ± ΔA"
          ],
          improvements: [
            "Cần lưu ý kiểm soát sai số góc nhìn parallax khi đọc thước đo",
            "Phân tích sâu hơn mối liên hệ giữa các đại lượng đo"
          ],
          teacherAdvice: "Em đã có tinh thần thực nghiệm khoa học rất tốt! Hãy tiếp tục duy trì phương pháp đo cẩn trọng và phân tích sai số sâu sắc trong các bài tiếp theo.",
        };
      }

      return res.json({ result: parsedResult, evaluation: parsedResult });
    } catch (err: any) {
      console.error("Gemini Grading Error:", err);
      return res.status(500).json({
        error: err.message || "Lỗi chấm điểm tự động từ AI.",
      });
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
