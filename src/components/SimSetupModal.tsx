import React, { useState, useRef, useEffect } from "react";
import { MathRenderer } from "./MathRenderer";
import { LAB_CATALOG } from "../data/labCatalog";
import { LabDefinition } from "../types";
import { generateSimulationSetup, hasConfiguredKey } from "../services/aiService";
import { generateInteractiveSimulationHtml } from "../utils/physicsSimulationEngine";
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
  AlertCircle,
  Settings,
  Maximize2,
  Minimize2,
  Download,
  ExternalLink,
  RotateCcw,
  PlayCircle,
} from "lucide-react";

interface SimSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

interface GeneratedSim {
  title: string;
  description: string;
  equipment: string[];
  parameters: string[];
  steps: string[];
  formula: string;
  suggestedLabId?: string;
  htmlSimulation?: string;
}

export const SimSetupModal: React.FC<SimSetupModalProps> = ({ isOpen, onClose, onOpenSettings }) => {
  const [subject, setSubject] = useState("Vật lý");
  const [grade, setGrade] = useState("Lớp 10");
  const [inputMode, setInputMode] = useState<"topic" | "file">("topic");
  const [topic, setTopic] = useState("");
  const [chapterSGK, setChapterSGK] = useState("");
  const [parameters, setParameters] = useState("");
  const [devices, setDevices] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<GeneratedSim | null>(null);
  const [activeTab, setActiveTab] = useState<"sim" | "curriculum">("sim");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [searchResults, setSearchResults] = useState<LabDefinition[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const simContainerRef = useRef<HTMLDivElement>(null);

  // Lắng nghe sự kiện thay đổi fullscreen (ví dụ người dùng bấm Esc)
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

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
      const name = (lab.title || "").toLowerCase();
      const desc = (lab.description || "").toLowerCase();
      const princ = (lab.principles || []).join(" ").toLowerCase();
      return name.includes(keyword) || desc.includes(keyword) || princ.includes(keyword);
    });
    setSearchResults(results);
    setHasSearched(true);
  };

  // Phóng to toàn màn hình
  const handleToggleFullscreen = () => {
    if (!simContainerRef.current) return;
    if (!document.fullscreenElement) {
      simContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.warn("Fullscreen request error:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Tải về file HTML độc lập
  const handleDownloadHtml = () => {
    if (!generatedResult?.htmlSimulation) return;
    const blob = new Blob([generatedResult.htmlSimulation], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeTitle = (generatedResult.title || "vat-ly")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-");
    a.href = url;
    a.download = `mo-phong-${safeTitle}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Mở trong tab trình duyệt mới
  const handleOpenNewTab = () => {
    if (!generatedResult?.htmlSimulation) return;
    const blob = new Blob([generatedResult.htmlSimulation], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  // Chạy lại mô phỏng
  const handleReloadSim = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleGenerate = async () => {
    if (!topic.trim() && !uploadedFile) return;

    setIsGenerating(true);
    setGeneratedResult(null);

    const currentTopic = topic.trim() || (uploadedFile ? uploadedFile.name : "Mô phỏng Vật lý");

    try {
      let prompt = `Bạn là chuyên gia thiết kế thí nghiệm Vật lý cho ${grade}. `;

      if (uploadedFile) {
        prompt += `Giáo viên đã tải lên file giáo án/bài tập: "${uploadedFile.name}". `;
      }

      prompt += `Hãy tạo một mô phỏng thí nghiệm trực quan cho chủ đề: "${currentTopic}".
Môn: ${subject}, Đối tượng: ${grade}.
${chapterSGK ? `Thuộc ${chapterSGK === "chuong1" ? "Chương I. Mở Đầu" : chapterSGK === "chuong2" ? "Chương II. Động Học" : chapterSGK === "chuong3" ? "Chương III. Động Lực Học" : chapterSGK === "chuong4" ? "Chương IV. Năng Lượng, Công, Công Suất" : chapterSGK === "chuong5" ? "Chương V. Động Lượng" : chapterSGK === "chuong6" ? "Chương VI. Chuyển Động Tròn" : "Chương VII. Biến Dạng Vật Rắn & Áp Suất Chất Lỏng"} SGK Vật lí 10 (Kết nối tri thức).` : ''}
${parameters ? `Thông số điều chỉnh mong muốn: ${parameters}` : ''}
${devices.length > 0 ? `Thiết bị hiển thị: ${devices.join(', ')}` : ''}

Trả lời CHÍNH XÁC theo format JSON sau (không thêm markdown ngoài):
{
  "title": "Tên thí nghiệm",
  "description": "Mô tả chi tiết mục tiêu và phương pháp thí nghiệm (2-3 câu)",
  "equipment": ["Thiết bị 1", "Thiết bị 2", "..."],
  "parameters": ["Thông số có thể điều chỉnh 1", "Thông số 2", "..."],
  "steps": ["Bước 1: ...", "Bước 2: ...", "..."],
  "formula": "Công thức chính dạng LaTeX, ví dụ: y = h_0 + x \\\\tan\\\\alpha - \\\\frac{g x^2}{2 v_0^2 \\\\cos^2\\\\alpha}",
  "suggestedLabId": "Nếu trùng với thí nghiệm có sẵn thì ghi ID (free_fall, projectile, newton2, friction, concurrent_force, moment_rule, pendulum_energy, collision_momentum, hooke_law, fluid_pressure), nếu không thì để null"
}`;

      let parsed: any = null;
      try {
        parsed = await generateSimulationSetup({ prompt });
      } catch (_aiErr) {
        // Fallback sang tự động tạo kịch bản nếu API key không khả dụng
        parsed = {
          title: `Mô Phỏng ${currentTopic}`,
          description: `Mô phỏng trực quan tương tác môn ${subject} (${grade}) cho chủ đề "${currentTopic}". Giáo viên và học sinh có thể điều chỉnh trực tiếp các thông số để quan sát hiện tượng.`,
          equipment: ["Màn hình mô phỏng đồ họa Canvas 2D", "Bảng điều khiển tham số", "Đồng hồ đo thời gian thực nghiệm", "Thước đo khoảng cách ảo"],
          parameters: parameters ? parameters.split(",").map(p => p.trim()) : ["Góc ném", "Vận tốc đầu", "Độ cao ban đầu"],
          steps: ["Điều chỉnh các thanh trượt tham số theo yêu cầu bài học", "Bấm Bắt đầu để quan sát chuyển động và quỹ đạo vật thể", "Ghi nhận kết quả đo vào bảng số liệu thực nghiệm"],
          formula: "y = h_0 + x \\tan\\alpha - \\frac{g x^2}{2 v_0^2 \\cos^2\\alpha}",
        };
      }

      if (parsed && typeof parsed === "object") {
        // Tự động sinh mã HTML5 mô phỏng tương tác nếu chưa có
        if (!parsed.htmlSimulation) {
          parsed.htmlSimulation = generateInteractiveSimulationHtml({
            title: parsed.title || currentTopic,
            topic: currentTopic,
            subject,
            grade,
            formula: parsed.formula,
            description: parsed.description,
            parametersText: parameters,
            equipment: parsed.equipment,
            steps: parsed.steps,
            suggestedLabId: parsed.suggestedLabId,
          });
        }
        setGeneratedResult(parsed);
        setActiveTab("sim");
      }
    } catch (err: any) {
      // Fallback đảm bảo người dùng luôn có mô phỏng trực quan
      const fallbackHtml = generateInteractiveSimulationHtml({
        title: `Mô Phỏng ${currentTopic}`,
        topic: currentTopic,
        subject,
        grade,
        parametersText: parameters,
      });

      setGeneratedResult({
        title: `Mô Phỏng ${currentTopic}`,
        description: `Mô phỏng trực quan được tạo tự động cho "${currentTopic}". Bạn có thể điều chỉnh trực tiếp các thông số để quan sát.`,
        equipment: ["Màn hình mô phỏng Canvas 2D", "Thanh trượt tham số ảo", "Đồng hồ đo thời gian"],
        parameters: ["Góc ném", "Vận tốc đầu", "Độ cao ban đầu"],
        steps: ["Điều chỉnh thông số trên thanh trượt", "Bấm nút bắt đầu để quan sát", "Ghi nhận kết quả vào bảng thực nghiệm"],
        formula: "y = h_0 + x \\tan\\alpha - \\frac{g x^2}{2 v_0^2 \\cos^2\\alpha}",
        htmlSimulation: fallbackHtml,
      });
      setActiveTab("sim");
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

        {/* Warning banner if API Key is not configured */}
        {!hasConfiguredKey() && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Chưa cấu hình API Key cá nhân để tạo mô phỏng bằng AI.</span>
            </div>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Cài đặt ngay</span>
              </button>
            )}
          </div>
        )}

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
            <div className="mt-6 rounded-2xl border border-emerald-300/80 dark:border-emerald-500/40 bg-white dark:bg-slate-900 shadow-xl overflow-hidden space-y-0">
              {/* Header kết quả & Tabs */}
              <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-blue-950/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{generatedResult.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                        TRỰC QUAN LIVE
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                      {generatedResult.description}
                    </p>
                  </div>
                </div>

                {/* Các nút hành động chính */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleFullscreen}
                    title="Phóng toàn màn hình (Phù hợp máy chiếu & thuyết trình)"
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:scale-105"
                  >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    <span>{isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}</span>
                  </button>

                  <button
                    onClick={handleDownloadHtml}
                    title="Tải về file HTML độc lập để chạy offline không cần internet"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:scale-105"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải file HTML (.html)</span>
                  </button>

                  <button
                    onClick={handleOpenNewTab}
                    title="Mở mô phỏng trong tab trình duyệt mới"
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleReloadSim}
                    title="Khởi động lại mô phỏng"
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4">
                <button
                  onClick={() => setActiveTab("sim")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
                    activeTab === "sim"
                      ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800/80 rounded-t-lg"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>🎮 Mô phỏng trực quan tương tác</span>
                </button>
                <button
                  onClick={() => setActiveTab("curriculum")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
                    activeTab === "curriculum"
                      ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800/80 rounded-t-lg"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>📋 Kịch bản sư phạm & Thiết bị SGK</span>
                </button>
              </div>

              {/* Tab 1: Khung mô phỏng trực quan Canvas */}
              {activeTab === "sim" && (
                <div className="p-4 bg-slate-950/10 dark:bg-slate-950/40">
                  <div
                    ref={simContainerRef}
                    className="relative w-full rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-inner bg-slate-950"
                  >
                    {/* Live Simulation Iframe */}
                    {generatedResult.htmlSimulation ? (
                      <iframe
                        key={iframeKey}
                        srcDoc={generatedResult.htmlSimulation}
                        className="w-full h-[540px] border-0 block bg-slate-950"
                        title={generatedResult.title}
                        sandbox="allow-scripts allow-same-origin allow-fullscreen allow-modals"
                        allow="fullscreen"
                      />
                    ) : (
                      <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        <p className="text-sm">Đang nạp động cơ mô phỏng trực quan...</p>
                      </div>
                    )}
                  </div>

                  {/* Thanh thông tin dưới iframe */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Mô phỏng đang chạy trực tiếp trên Canvas 2D tốc độ 60fps.</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>💡 <strong>Mẹo giảng dạy:</strong> Bấm <em>Toàn màn hình</em> để trình chiếu máy chiếu; hoặc bấm <em>Tải file HTML</em> để học sinh thực hành offline tại nhà.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Kịch bản sư phạm, công thức & thiết bị SGK */}
              {activeTab === "curriculum" && (
                <div className="p-5 space-y-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {generatedResult.description}
                  </p>

                  {generatedResult.formula && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Công thức toán học & vật lý áp dụng:</span>
                      <div className="mt-1 text-center text-emerald-700 dark:text-cyan-300 font-bold">
                        <MathRenderer content={"\\(" + generatedResult.formula + "\\)"} className="text-emerald-700 dark:text-cyan-300 font-bold" inline />
                      </div>
                    </div>
                  )}

                  {generatedResult.equipment.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                        🔬 Thiết bị & Dụng cụ thí nghiệm:
                      </span>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {generatedResult.equipment.map((eq, i) => (
                          <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                            <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                            <span>{eq}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {generatedResult.steps.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                        📋 Các bước tiến hành thực nghiệm:
                      </span>
                      <ol className="space-y-1.5">
                        {generatedResult.steps.map((step, i) => (
                          <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                            <span className="text-emerald-600 dark:text-cyan-400 font-bold shrink-0">{i + 1}.</span>
                            <div className="flex-1">
                              <MathRenderer content={step} inline />
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {generatedResult.suggestedLabId && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/50">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        💡 <strong>Gợi ý bài thực hành:</strong> Thí nghiệm này trùng với bài thực hành có sẵn trong thư viện.
                        Bạn có thể chuyển sang thí nghiệm <strong>{generatedResult.suggestedLabId}</strong> để trải nghiệm phòng lab chuyên sâu.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
