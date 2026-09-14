var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_meta = {};
import_dotenv.default.config();
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash"
];
var AGENT_PLATFORM_FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite"
];
var DEFAULT_MODEL = "gemini-3.6-flash";
var DEFAULT_AGENT_PLATFORM_MODEL = "gemini-2.5-flash";
var parseApiError = (error) => {
  const message = error?.message || error?.toString() || "";
  const serialized = JSON.stringify(error) || "";
  const combined = `${message} ${serialized}`.toLowerCase();
  if (serialized.includes("429") || combined.includes("resource_exhausted") || combined.includes("quota")) return "QUOTA_EXCEEDED";
  if (serialized.includes("503") || serialized.includes("504") || serialized.includes("500") || combined.includes("unavailable") || combined.includes("high demand") || combined.includes("overloaded") || combined.includes("try again later")) return "MODEL_OVERLOADED";
  if (serialized.includes("404") || combined.includes("not_found")) return "NOT_FOUND";
  if (serialized.includes("403") || combined.includes("permission_denied")) return "PERMISSION_DENIED";
  if (combined.includes("api_key_invalid") || serialized.includes("401") || combined.includes("api key not valid")) return "INVALID_API_KEY";
  if (serialized.includes("400") || combined.includes("invalid_argument")) return "INVALID_ARGUMENT";
  return "UNKNOWN";
};
var getOrderedModels = (selectedModel, provider = "gemini") => {
  if (provider === "agent-platform") {
    const fallbackList2 = [...AGENT_PLATFORM_FALLBACK_MODELS];
    const defaultMod = DEFAULT_AGENT_PLATFORM_MODEL;
    if (!selectedModel) return [defaultMod, ...fallbackList2.filter((m) => m !== defaultMod)];
    return [selectedModel, ...fallbackList2.filter((m) => m !== selectedModel)];
  }
  const fallbackList = [...FALLBACK_MODELS];
  if (!selectedModel) return [DEFAULT_MODEL, ...fallbackList.filter((m) => m !== DEFAULT_MODEL)];
  return [selectedModel, ...fallbackList.filter((m) => m !== selectedModel)];
};
var generateContentWithFallback = async (ai, { contents, config, selectedModel, provider = "gemini" }) => {
  const models = getOrderedModels(selectedModel, provider);
  let lastError = null;
  const firstModel = models[0];
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const cleanedConfig = { ...config || {} };
      if (model.includes("3.6") || model.includes("3.5-flash-lite") || model.startsWith("gemini-3")) {
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
        ...Object.keys(cleanedConfig).length > 0 ? { config: cleanedConfig } : {}
      });
      return { text: response.text || "", modelUsed: model, fallbackUsed: model !== firstModel };
    } catch (error) {
      lastError = error;
      const errorType = parseApiError(error);
      console.warn(`[AI Server Fallback] Provider: "${provider}", Model "${model}" failed with ${errorType}: ${error.message?.substring(0, 120)}`);
      if (errorType === "INVALID_API_KEY" || errorType === "QUOTA_EXCEEDED" || errorType === "INVALID_ARGUMENT") break;
      if (errorType === "PERMISSION_DENIED") {
        if (provider === "agent-platform" && i < models.length - 1) continue;
        break;
      }
      if (errorType === "MODEL_OVERLOADED" || errorType === "NOT_FOUND") continue;
      break;
    }
  }
  throw lastError || new Error("T\u1EA5t c\u1EA3 model AI \u0111\u1EC1u kh\xF4ng ph\u1EA3n h\u1ED3i. Vui l\xF2ng th\u1EED l\u1EA1i sau.");
};
var getFriendlyErrorMessage = (error, provider = "gemini") => {
  const errorType = parseApiError(error);
  switch (errorType) {
    case "INVALID_API_KEY":
      return { message: "API Key kh\xF4ng h\u1EE3p l\u1EC7 ho\u1EB7c \u0111\xE3 h\u1EBFt h\u1EA1n. Vui l\xF2ng ki\u1EC3m tra l\u1EA1i trong C\xE0i \u0111\u1EB7t.", statusCode: 401 };
    case "PERMISSION_DENIED":
      return {
        message: provider === "agent-platform" ? "Google \u0111\xE3 nh\u1EADn key nh\u01B0ng d\u1EF1 \xE1n/key ch\u01B0a \u0111\u01B0\u1EE3c c\u1EA5p quy\u1EC1n g\u1ECDi Agent Platform API ho\u1EB7c model n\xE0y." : "API key kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp Gemini API.",
        statusCode: 403
      };
    case "QUOTA_EXCEEDED":
      return { message: "\u0110\xE3 h\u1EBFt quota ho\u1EB7c v\u01B0\u1EE3t gi\u1EDBi h\u1EA1n t\u1ED1c \u0111\u1ED9 API. Vui l\xF2ng \u0111\u1EE3i r\u1ED3i th\u1EED l\u1EA1i.", statusCode: 429 };
    case "MODEL_OVERLOADED":
      return { message: "Model \u0111ang qu\xE1 t\u1EA3i; app \u0111ang t\u1EF1 \u0111\u1ED9ng th\u1EED model d\u1EF1 ph\xF2ng.", statusCode: 503 };
    case "NOT_FOUND":
      return { message: "Model kh\xF4ng kh\u1EA3 d\u1EE5ng.", statusCode: 404 };
    case "INVALID_ARGUMENT":
      return { message: "Y\xEAu c\u1EA7u kh\xF4ng h\u1EE3p l\u1EC7.", statusCode: 400 };
    default:
      return { message: error?.message || "L\u1ED7i x\u1EED l\xFD y\xEAu c\u1EA7u AI.", statusCode: 500 };
  }
};
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "5mb" }));
  const getAiClient = (customKey, provider = "gemini") => {
    const key = customKey || (provider === "agent-platform" ? process.env.AGENT_PLATFORM_API_KEY : process.env.GEMINI_API_KEY);
    if (!key) return null;
    if (provider === "agent-platform") {
      return new import_genai.GoogleGenAI({ vertexai: true, apiKey: key });
    }
    return new import_genai.GoogleGenAI({ apiKey: key });
  };
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasServerKey: !!process.env.GEMINI_API_KEY,
      appName: "Physics AI-Lab 10",
      version: "2.0.0",
      defaultModel: DEFAULT_MODEL
    });
  });
  app.post("/api/gemini/chat", async (req, res) => {
    let provider = "gemini";
    try {
      const { message, history = [], currentLabContext, labId, customKey, apiKey: bodyKey, provider: bodyProvider, model: bodyModel } = req.body;
      provider = bodyProvider === "agent-platform" ? "agent-platform" : "gemini";
      const ai = getAiClient(customKey || bodyKey, provider);
      if (!ai) {
        return res.status(400).json({
          error: "Vui l\xF2ng c\u1EA5u h\xECnh API Key trong m\u1EE5c C\xE0i \u0111\u1EB7t tr\u01B0\u1EDBc khi s\u1EED d\u1EE5ng t\xEDnh n\u0103ng n\xE0y.",
          isKeyMissing: true
        });
      }
      const systemPrompt = `B\u1EA1n l\xE0 Tr\u1EE3 l\xFD AI S\u01B0 ph\u1EA1m V\u1EADt l\xED l\u1EDBp 10 (Physics AI Tutor), \u0111\u1ED3ng th\u1EDDi l\xE0 Gi\u1EA3ng vi\xEAn S\u01B0 ph\u1EA1m V\u1EADt l\xED th\u1EF1c nghi\u1EC7m.
Ch\u01B0\u01A1ng tr\xECnh gi\u1EA3ng d\u1EA1y: V\u1EADt l\xED 10 - Ch\u01B0\u01A1ng tr\xECnh GDPT 2018 (B\u1ED9 s\xE1ch K\u1EBFt n\u1ED1i tri th\u1EE9c v\u1EDBi cu\u1ED9c s\u1ED1ng).
Th\xED nghi\u1EC7m h\u1ECDc sinh \u0111ang l\xE0m hi\u1EC7n t\u1EA1i (labId: ${labId || "ch\u01B0a x\xE1c \u0111\u1ECBnh"}):
${JSON.stringify(currentLabContext || {}, null, 2)}

Nhi\u1EC7m v\u1EE5 c\u1EE7a b\u1EA1n:
1. Gi\u1EA3i \u0111\xE1p th\u1EAFc m\u1EAFc khoa h\u1ECDc m\u1ED9t c\xE1ch \xE2n c\u1EA7n, chu\u1EA9n m\u1EF1c, ng\u1EAFn g\u1ECDn v\xE0 truy\u1EC1n c\u1EA3m h\u1EE9ng.
2. \xC1p d\u1EE5ng ph\u01B0\u01A1ng ph\xE1p g\u1EE3i m\u1EDF Socratic: kh\xF4ng v\u1ED9i cho \u0111\xE1p \xE1n ngay m\xE0 h\u01B0\u1EDBng d\u1EABn h\u1ECDc sinh quan s\xE1t \u0111\u1ED3 th\u1ECB, d\u1EE5ng c\u1EE5 \u0111o (\u0111\u1ED3ng h\u1ED3 hi\u1EC7n s\u1ED1 MC964, c\u1ED5ng quang, th\u01B0\u1EDBc mm, l\u1EF1c k\u1EBF).
3. H\u01B0\u1EDBng d\u1EABn t\xEDnh to\xE1n sai s\u1ED1, quy t\u1EAFc vi\u1EBFt s\u1ED1 c\xF3 ngh\u0129a (theo B\xE0i 3 SGK).
4. Khuy\u1EBFn kh\xEDch h\u1ECDc sinh li\xEAn h\u1EC7 hi\u1EC7n t\u01B0\u1EE3ng th\u1EF1c t\u1EBF (v\xED d\u1EE5: an to\xE0n giao th\xF4ng, d\xF9 l\u01B0\u1EE3n, c\xE2n b\u1EB1ng xe, gi\u1EA3m s\xF3c l\xF2 xo).
5. Tr\xECnh b\xE0y c\xF4ng th\u1EE9c b\u1EB1ng \u0111\u1ECBnh d\u1EA1ng Markdown v\u1EDBi k\xFD hi\u1EC7u LaTeX/MathJax: d\xF9ng \\( ... \\) cho inline ho\u1EB7c \\[ ... \\] cho block. Kh\xF4ng d\xF9ng $...$ v\xEC kh\xF3 ph\xE2n bi\u1EC7t v\u1EDBi k\xFD hi\u1EC7u ti\u1EC1n t\u1EC7.
6. Khi vi\u1EBFt c\xF4ng th\u1EE9c, h\xE3y vi\u1EBFt r\xF5 r\xE0ng, chu\u1EA9n LaTeX. V\xED d\u1EE5: \\( g = \\frac{2s}{t^2} \\) ho\u1EB7c \\[ v = v_0 + at \\]`;
      const contents = [];
      for (const h of history) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      }
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });
      const result = await generateContentWithFallback(ai, {
        contents,
        selectedModel: bodyModel,
        provider,
        config: {
          systemInstruction: systemPrompt
        }
      });
      return res.json({
        reply: result.text || "AI \u0111\xE3 ghi nh\u1EADn c\xE2u h\u1ECFi nh\u01B0ng ch\u01B0a c\xF3 ph\u1EA3n h\u1ED3i th\xEDch h\u1EE3p.",
        modelUsed: result.modelUsed,
        fallbackUsed: result.fallbackUsed
      });
    } catch (err) {
      console.error("Gemini Chat Error:", err);
      const friendly = getFriendlyErrorMessage(err, provider);
      return res.status(friendly.statusCode).json({ error: friendly.message });
    }
  });
  app.post("/api/gemini/grade", async (req, res) => {
    let provider = "gemini";
    try {
      const { reportData, customKey, apiKey: bodyKey, provider: bodyProvider, model: bodyModel } = req.body;
      provider = bodyProvider === "agent-platform" ? "agent-platform" : "gemini";
      const ai = getAiClient(customKey || bodyKey, provider);
      if (!ai) {
        return res.status(400).json({
          error: "Vui l\xF2ng c\u1EA5u h\xECnh API Key trong m\u1EE5c C\xE0i \u0111\u1EB7t tr\u01B0\u1EDBc khi s\u1EED d\u1EE5ng t\xEDnh n\u0103ng n\xE0y.",
          isKeyMissing: true
        });
      }
      const prompt = `B\u1EA1n l\xE0 Gi\u1EA3ng vi\xEAn S\u01B0 ph\u1EA1m V\u1EADt l\xED th\u1EF1c nghi\u1EC7m chuy\xEAn m\xF4n cao, ch\u1EA5m v\xE0 \u0111\xE1nh gi\xE1 B\xE1o c\xE1o th\u1EF1c h\xE0nh s\u1ED1 m\xF4n V\u1EADt l\xED 10 (Ch\u01B0\u01A1ng tr\xECnh GDPT 2018 - SGK K\u1EBFt n\u1ED1i tri th\u1EE9c).
D\u01B0\u1EDBi \u0111\xE2y l\xE0 d\u1EEF li\u1EC7u B\xE1o c\xE1o th\u1EF1c h\xE0nh chi ti\u1EBFt c\u1EE7a h\u1ECDc sinh:
${JSON.stringify(reportData, null, 2)}

Y\xCAU C\u1EA6U \u0110\xC1NH GI\xC1 CHUY\xCAN S\xC2U:
1. \u0110\xE1nh gi\xE1 k\u1EBFt qu\u1EA3 \u0111o, vi\u1EC7c t\xEDnh to\xE1n gi\xE1 tr\u1ECB trung b\xECnh, sai s\u1ED1 tuy\u1EC7t \u0111\u1ED1i, sai s\u1ED1 t\u1EC9 \u0111\u1ED1i v\xE0 c\xE1ch bi\u1EC3u di\u1EC5n k\u1EBFt qu\u1EA3 theo B\xE0i 3 SGK (A = A_tb \xB1 \u0394A).
2. PH\xC2N T\xCDCH NGUY\xCAN NH\xC2N TI\u1EC0M \u1EA8N G\xC2Y RA SAI S\u1ED0 D\u1EF0A TR\xCAN B\xC0I TH\xCD NGHI\u1EC6M C\u1EE4 TH\u1EC2 theo 3 nh\xF3m c\u1ED1t l\xF5i:
   - Sai s\u1ED1 h\u1EC7 th\u1ED1ng (Systematic error)
   - Sai s\u1ED1 ng\u1EABu nhi\xEAn (Random error)
   - Sai s\u1ED1 do m\xF4i tr\u01B0\u1EDDng (Environmental error)
3. \u0110\u01AFA RA BI\u1EC6N PH\xC1P KH\u1EAEC PH\u1EE4C / GI\u1EA2M THI\u1EC2U C\u1EE4 TH\u1EC2 cho t\u1EEBng lo\u1EA1i sai s\u1ED1.
4. \u0110\xE1nh gi\xE1 m\u1EE9c \u0111\u1ED9 n\u0103ng l\u1EF1c \u0111\u1EA1t \u0111\u01B0\u1EE3c theo GDPT 2018.

QUAN TR\u1ECCNG: Khi vi\u1EBFt c\xF4ng th\u1EE9c v\u1EADt l\xED, h\xE3y d\xF9ng k\xFD hi\u1EC7u LaTeX/MathJax: \\( ... \\) cho inline ho\u1EB7c \\[ ... \\] cho block.

H\xE3y tr\u1EA3 v\u1EC1 ph\u1EA3n h\u1ED3i DUY NH\u1EA4T d\u01B0\u1EDBi d\u1EA1ng chu\u1ED7i JSON thu\u1EA7n v\u1EDBi c\u1EA5u tr\xFAc ch\xEDnh x\xE1c sau:
{
  "totalScore": 8.5,
  "level": "M\u1EE9c 3 - Kh\xE1",
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
        selectedModel: bodyModel,
        provider,
        config: {
          responseMimeType: "application/json"
        }
      });
      let parsedResult;
      try {
        parsedResult = JSON.parse(result.text || "{}");
      } catch (_pErr) {
        parsedResult = {
          totalScore: 8,
          level: "M\u1EE9c 3 - Kh\xE1",
          gdptCompetencyLevel: "\u0110\u1EA1t chu\u1EA9n n\u0103ng l\u1EF1c T\xECm hi\u1EC3u th\u1EBF gi\u1EDBi t\u1EF1 nhi\xEAn d\u01B0\u1EDBi g\xF3c \u0111\u1ED9 v\u1EADt l\xED (M\u1EE9c Kh\xE1)",
          dataAccuracyReview: "D\xE3y s\u1ED1 li\u1EC7u th\u1EF1c nghi\u1EC7m \u0111o \u0111\u1EA1c c\xF3 \u0111\u1ED9 tin c\u1EADy t\u1ED1t.",
          errorCalculationReview: "H\u1ECDc sinh \u0111\xE3 \xE1p d\u1EE5ng \u0111\xFAng c\xF4ng th\u1EE9c t\xEDnh gi\xE1 tr\u1ECB trung b\xECnh v\xE0 x\xE1c \u0111\u1ECBnh sai s\u1ED1 theo B\xE0i 3 SGK.",
          theoryQuestionsReview: "Tr\u1EA3 l\u1EDDi t\u1ED1t c\xE1c c\xE2u h\u1ECFi b\u1EA3n ch\u1EA5t v\u1EADt l\xED.",
          errorSources: {
            systematicError: { analysis: "\u0110\u1ED9 tr\u1EC5 \u0111i\u1EC7n t\u1EEB c\u1EE7a r\u01A1-le ng\u1EAFt nam ch\xE2m v\xE0 \u0111\u1ED9 ph\xE2n gi\u1EA3i c\u1EE7a c\u1ED5ng quang \u0111i\u1EC7n MC964.", mitigation: "C\u1EA7n hi\u1EC7u ch\u1EC9nh zero cho thi\u1EBFt b\u1ECB tr\u01B0\u1EDBc khi \u0111o." },
            randomError: { analysis: "Sai s\u1ED1 g\xF3c nh\xECn parallax khi \u0111\u1ECDc th\u01B0\u1EDBc \u0111o.", mitigation: "\u0110\u1EB7t t\u1EA7m m\u1EAFt ngang b\u1EB1ng vu\xF4ng g\xF3c v\u1EDBi v\u1EA1ch chia." },
            environmentalError: { analysis: "L\u1EF1c c\u1EA3n kh\xF4ng kh\xED v\xE0 rung ch\u1EA5n m\u1EB7t b\xE0n.", mitigation: "Th\u1EF1c hi\u1EC7n th\xED nghi\u1EC7m trong ph\xF2ng k\xEDn gi\xF3." }
          },
          strengths: ["Thu th\u1EADp \u0111\u1EA7y \u0111\u1EE7 s\u1ED1 li\u1EC7u", "Bi\u1EC3u di\u1EC5n k\u1EBFt qu\u1EA3 \u0111\xFAng quy t\u1EAFc"],
          improvements: ["Ki\u1EC3m so\xE1t sai s\u1ED1 parallax", "Ph\xE2n t\xEDch s\xE2u h\u01A1n"],
          teacherAdvice: "Em \u0111\xE3 c\xF3 tinh th\u1EA7n th\u1EF1c nghi\u1EC7m t\u1ED1t! H\xE3y ti\u1EBFp t\u1EE5c ph\xE1t tri\u1EC3n."
        };
      }
      return res.json({ result: parsedResult, evaluation: parsedResult, modelUsed: result.modelUsed });
    } catch (err) {
      console.error("Gemini Grading Error:", err);
      const friendly = getFriendlyErrorMessage(err, provider);
      return res.status(friendly.statusCode).json({ error: friendly.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
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
//# sourceMappingURL=server.cjs.map
