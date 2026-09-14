import React, { useState, useRef } from "react";
import { MathRenderer } from "./MathRenderer";
import { LAB_CATALOG } from "../data/labCatalog";
import { LabDefinition } from "../types";
import {
  X,
  Monitor,
  BookOpen,
  Upload,
  Search,
  Sparkles,
  Smartphone,
  Laptop,
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle2,
  FileText,
  Atom,
} from "lucide-react";

interface SimSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GeneratedSim {
  title: string;
  description: string;
  equipment: string[];
  parameters: string[];
  steps: string[];
  formula: string;
  suggestedLabId?: string;
}

export const SimSetupModal: React.FC<SimSetupModalProps> = ({ isOpen, onClose }) => {
  const [subject, setSubject] = useState("Vật lý");
  const [grade, setGrade] = useState("Lớp 10");
  const [inputMode, setInputMode] = useState<"topic" | "file">("topic");
  const [topic, setTopic] = useState("");
  const [chapterSGK, setChapterSGK] = useState("");
  const [parameters, setParameters] = useState("");
  const [devices, setDevices] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<GeneratedSim | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [searchResults, setSearchResults] = useState<LabDefinition[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const toggleDevice = (d: string) => {
    setDevices((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSearchLibrary = () => {
    const keyword = topic.trim().toLowerCase();
    if (!keyword) return;
    const results = Object.values(LAB_CATALOG).filter((lab) => {
      const name = (lab.name || lab.title || "").toLowerCase();
      const desc = (lab.description || "").toLowerCase();
      const princ = (lab.principles || []).join(" ").toLowerCase();
      return name.includes(keyword) || desc.includes(keyword) || princ.includes(keyword);
    });
    setSearchResults(results);
    setHasSearched(true);
  };

  const handleGenerate = async () => {
    if (!topic.trim() && !uploadedFile) return;

    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      let prompt = `Bạn là chuyên gia thiết kế thí nghiệm Vật lý cho ${grade}. `;

      if (uploadedFile) {
        prompt += `Giáo viên đã tải lên file giáo án/bài tập: "${uploadedFile.name}". `;
      }

      prompt += `Hãy tạo một mô phỏng thí nghiệm cho chủ đề: "${topic || 'từ file giáo án'}".
Môn: ${subject}, Đối tượng: ${grade}.
${chapterSGK ? `Thuộc ${chapterSGK === "chuong1" ? "Chương I. Mở Đầu" : chapterSGK === "chuong2" ? "Chương II. Động Học" : chapterSGK === "chuong3" ? "Chương III. Động Lực Học" : chapterSGK === "chuong4" ? "Chương IV. Năng Lượng, Công, Công Suất" : chapterSGK === "chuong5" ? "Chương V. Động Lượng" : chapterSGK === "chuong6" ? "Chương VI. Chuyển Động Tròn" : "Chương VII. Biến Dạng Vật Rắn & Áp Suất Chất Lỏng"} SGK Vật lí 10 (Kết nối tri thức).` : ''}
${parameters ? `Thông số điều chỉnh mong muốn: ${parameters}` : ''}
${devices.length > 0 ? `Thiết bị hiển thị: ${devices.join(', ')}` : ''}

Trả lời CHÍNH XÁC theo format JSON sau (không thêm markdown):
{
  "title": "Tên thí nghiệm",
  "description": "Mô tả chi tiết mục tiêu và phương pháp thí nghiệm (2-3 câu)",
  "equipment": ["Thiết bị 1", "Thiết bị 2", "..."],
  "parameters": ["Thông số có thể điều chỉnh 1", "Thông số 2", "..."],
  "steps": ["Bước 1: ...", "Bước 2: ...", "..."],
  "formula": "Công thức chính dạng LaTeX, ví dụ: F = m \\\\cdot a",
  "suggestedLabId": "Nếu trùng với thí nghiệm có sẵn thì ghi ID (free_fall, projectile, newton2, friction, concurrent_force, moment_rule, pendulum_energy, collision_momentum, hooke_law, fluid_pressure), nếu không thì để null"
}`;

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labId: "free_sandbox",
          message: prompt,
          history: [],
        }),
      });

      if (!response.ok) throw new Error("API Error");

      const data = await response.json();
      const text = data.reply || data.text || "";

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setGeneratedResult(parsed);
      } else {
        // Fallback: show as description
        setGeneratedResult({
          title: topic || "Mô phỏng AI",
          description: text,
          equipment: [],
          parameters: [],
          steps: [],
          formula: "",
        });
      }
    } catch (err) {
      setGeneratedResult({
        title: "Lỗi tạo mô phỏng",
        description: "Không thể kết nối AI. Vui lòng kiểm tra API key và thử lại.",
        equipment: [],
        parameters: [],
        steps: [],
        formula: "",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Thiết lập mô phỏng</h2>
              <p className="text-xs text-slate-500">✨ Tìm kiếm thư viện hoặc Tạo mới bằng AI</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Thông tin cơ bản */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">1</span>
                <span className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Thông tin cơ bản</span>
              </div>

              {/* Môn học + Đối tượng */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block flex items-center gap-1">
                    <Atom className="w-3.5 h-3.5" /> MÔN HỌC
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option>Vật lý</option>
                    <option>Hóa học</option>
                    <option>Sinh học</option>
                    <option>Toán học</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> ĐỐI TƯỢNG
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option>Lớp 8</option>
                    <option>Lớp 9</option>
                    <option>Lớp 10</option>
                    <option>Lớp 11</option>
                    <option>Lớp 12</option>
                  </select>
                </div>
              </div>

              {/* Tab: Nhập chủ đề / Tải file */}
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setInputMode("topic")}
                  className={`flex-1 px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    inputMode === "topic"
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Nhập chủ đề
                </button>
                <button
                  onClick={() => setInputMode("file")}
                  className={`flex-1 px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    inputMode === "file"
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Tải file bài tập
                </button>
              </div>

              {/* Chương SGK */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block flex items-center gap-1">
                  📖 CHƯƠNG SGK VẬT LÍ 10
                </label>
                <select
                  value={chapterSGK}
                  onChange={(e) => setChapterSGK(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                >
                  <option value="">-- Chọn chương (tuỳ chọn) --</option>
                  <option value="chuong1">Chương I. Mở Đầu (Bài 1–3)</option>
                  <option value="chuong2">Chương II. Động Học (Bài 4–12)</option>
                  <option value="chuong3">Chương III. Động Lực Học (Bài 13–22)</option>
                  <option value="chuong4">Chương IV. Năng Lượng, Công, Công Suất (Bài 23–27)</option>
                  <option value="chuong5">Chương V. Động Lượng (Bài 28–30)</option>
                  <option value="chuong6">Chương VI. Chuyển Động Tròn (Bài 31–32)</option>
                  <option value="chuong7">Chương VII. Biến Dạng Vật Rắn & Áp Suất Chất Lỏng (Bài 33–34)</option>
                </select>
              </div>

              {/* Chủ đề chi tiết */}
              {inputMode === "topic" ? (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    CHỦ ĐỀ CHI TIẾT <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ví dụ: Cấu trúc nguyên tử, Định luật Ohm, Quang hợp..."
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    TẢI FILE GIÁO ÁN / BÀI TẬP
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-6 rounded-lg border-2 border-dashed border-slate-300 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all"
                  >
                    <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    {uploadedFile ? (
                      <p className="text-sm text-emerald-600 font-medium">{uploadedFile.name}</p>
                    ) : (
                      <p className="text-xs text-slate-500">Kéo thả hoặc click để tải file (.doc, .pdf, .txt)</p>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".doc,.docx,.pdf,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Column 2: Chi tiết nâng cao */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">2</span>
                <span className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Chi tiết nâng cao</span>
              </div>

              {/* Thông số điều chỉnh */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  ⚙️ THÔNG SỐ ĐIỀU CHỈNH
                </label>
                <input
                  type="text"
                  value={parameters}
                  onChange={(e) => setParameters(e.target.value)}
                  placeholder="Góc tới, điện trở, khối lượng, nhiệt độ..."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* Thiết bị hiển thị */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">
                  THIẾT BỊ HIỂN THỊ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "projector", label: "Máy chiếu + Laptop", icon: <Laptop className="w-3.5 h-3.5" /> },
                    { key: "phone", label: "Chỉ có điện thoại", icon: <Smartphone className="w-3.5 h-3.5" /> },
                    { key: "noInternet", label: "Không có internet", icon: <WifiOff className="w-3.5 h-3.5" /> },
                    { key: "internet", label: "Có internet ổn định", icon: <Wifi className="w-3.5 h-3.5" /> },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => toggleDevice(item.key)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                        devices.includes(item.key)
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {devices.includes(item.key) ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        item.icon
                      )}
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSearchLibrary}
              disabled={!topic.trim()}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-emerald-500 text-emerald-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4" />
              Tìm kiếm thư viện
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || (!topic.trim() && !uploadedFile)}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Tạo mô phỏng AI
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/20">BETA</span>
                </>
              )}
            </button>
          </div>

          {/* Search Results from Library */}
          {hasSearched && (
            <div className="mt-4 p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-800">
                  Kết quả tìm kiếm ({searchResults.length})
                </span>
              </div>
              {searchResults.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Không tìm thấy thí nghiệm phù hợp. Hãy thử &quot;Tạo mô phỏng AI&quot; để tạo mới.
                </p>
              ) : (
                <div className="space-y-2 max-h-[160px] overflow-y-auto">
                  {searchResults.map((lab) => (
                    <div
                      key={lab.id}
                      className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-blue-100 hover:border-blue-400 transition-colors cursor-pointer group"
                      onClick={() => onClose()}
                    >
                      <span className="text-lg">🔬</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{lab.title}</p>
                        <p className="text-[10px] text-slate-500 truncate">{lab.description}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium shrink-0">
                        Có sẵn ✓
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Generated Result */}
          {generatedResult && (
            <div className="mt-6 p-5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">{generatedResult.title}</h3>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">{generatedResult.description}</p>

              {generatedResult.formula && (
                <div className="p-3 bg-white rounded-lg border border-emerald-200">
                  <span className="text-xs font-semibold text-slate-500">Công thức chính:</span>
                  <div className="mt-1 text-center">
                    <MathRenderer content={"\\(" + generatedResult.formula + "\\)"} className="text-emerald-700 font-bold" />
                  </div>
                </div>
              )}

              {generatedResult.equipment.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">🔬 Thiết bị cần thiết:</span>
                  <ul className="mt-1 space-y-1">
                    {generatedResult.equipment.map((eq, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                        <span className="text-emerald-500 mt-0.5">•</span> {eq}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {generatedResult.steps.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">📋 Các bước thực hiện:</span>
                  <ol className="mt-1 space-y-1">
                    {generatedResult.steps.map((step, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold shrink-0">{i + 1}.</span>
                        <MathRenderer content={step} />
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {generatedResult.suggestedLabId && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700">
                    💡 <strong>Gợi ý:</strong> Thí nghiệm này trùng với bài thực hành có sẵn trong thư viện.
                    Bạn có thể chuyển sang thí nghiệm <strong>{generatedResult.suggestedLabId}</strong> để trải nghiệm mô phỏng tương tác đầy đủ.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
