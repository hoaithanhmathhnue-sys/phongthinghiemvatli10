import React, { useState, useEffect } from "react";
import { 
  X, 
  Volume2, 
  ShieldCheck, 
  Sliders, 
  Sparkles, 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Loader2, 
  Trash2, 
  Save, 
  Server,
  Zap
} from "lucide-react";
import {
  AiProvider,
  GEMINI_MODELS,
  AGENT_PLATFORM_MODELS,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_AGENT_PLATFORM_MODEL,
  getStoredProvider,
  setStoredProvider,
  getStoredApiKey,
  setStoredApiKey,
  getStoredModel,
  setStoredModel,
  clearStoredApiKey,
  validateApiKey,
  testApiConnection,
} from "../services/aiService";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  instrumentError: number;
  onChangeInstrumentError: (val: number) => void;
  onApiKeySaved?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
  instrumentError,
  onChangeInstrumentError,
  onApiKeySaved,
}) => {
  const [activeTab, setActiveTab] = useState<"ai" | "lab" | "about">("ai");

  // State cấu hình AI
  const [provider, setProviderState] = useState<AiProvider>("gemini");
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [selectedModel, setSelectedModelState] = useState<string>(DEFAULT_GEMINI_MODEL);
  const [showKey, setShowKey] = useState<boolean>(false);

  // State kiểm tra kết nối & thông báo
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    status: "idle" | "success" | "error";
    message: string;
    modelUsed?: string;
  }>({ status: "idle", message: "" });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>("");

  // Khởi tạo và nạp dữ liệu mỗi khi mở Modal
  useEffect(() => {
    if (isOpen) {
      const storedProv = getStoredProvider();
      setProviderState(storedProv);
      setApiKeyInput(getStoredApiKey(storedProv));
      setSelectedModelState(getStoredModel(storedProv));
      setTestResult({ status: "idle", message: "" });
      setSaveSuccessMsg("");
    }
  }, [isOpen]);

  // Xử lý khi người dùng đổi Nhà cung cấp (Gemini vs Agent Platform)
  const handleSelectProvider = (newProvider: AiProvider) => {
    setProviderState(newProvider);
    // Tải key riêng của provider đó mà không sao chép giữa 2 vùng lưu trữ (api.md Section III)
    const storedKey = getStoredApiKey(newProvider);
    setApiKeyInput(storedKey);

    // Lọc lại danh sách model theo provider đang chọn
    const storedModel = getStoredModel(newProvider);
    if (newProvider === "agent-platform") {
      const isValid = AGENT_PLATFORM_MODELS.some((m) => m.id === storedModel);
      setSelectedModelState(isValid ? storedModel : DEFAULT_AGENT_PLATFORM_MODEL);
    } else {
      const isValid = GEMINI_MODELS.some((m) => m.id === storedModel);
      setSelectedModelState(isValid ? storedModel : DEFAULT_GEMINI_MODEL);
    }

    setTestResult({ status: "idle", message: "" });
    setSaveSuccessMsg("");
  };

  // Kiểm tra kết nối API Key thực tế
  const handleTestConnection = async () => {
    if (!apiKeyInput.trim()) {
      setTestResult({
        status: "error",
        message: "Vui lòng nhập API Key trước khi kiểm tra kết nối.",
      });
      return;
    }

    setIsTesting(true);
    setTestResult({ status: "idle", message: "" });

    try {
      const res = await testApiConnection(apiKeyInput.trim(), provider, selectedModel);
      if (res.success) {
        setTestResult({
          status: "success",
          message: res.message,
          modelUsed: res.modelUsed,
        });
      } else {
        setTestResult({
          status: "error",
          message: res.message,
        });
      }
    } catch (err: any) {
      setTestResult({
        status: "error",
        message: err?.message || "Lỗi không xác định khi kiểm tra kết nối.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Lưu cấu hình
  const handleSaveConfig = () => {
    setStoredProvider(provider);
    setStoredApiKey(provider, apiKeyInput.trim());
    setStoredModel(provider, selectedModel);

    setSaveSuccessMsg("Đã lưu cấu hình thành công!");
    if (onApiKeySaved) onApiKeySaved();

    setTimeout(() => {
      setSaveSuccessMsg("");
    }, 3000);
  };

  // Xóa Key hiện tại
  const handleClearKey = () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa API Key của ${provider === "gemini" ? "Gemini API" : "Agent Platform API"}?`)) {
      clearStoredApiKey(provider);
      setApiKeyInput("");
      setTestResult({ status: "idle", message: "" });
      setSaveSuccessMsg("Đã xóa API Key thành công.");
      if (onApiKeySaved) onApiKeySaved();
      setTimeout(() => setSaveSuccessMsg(""), 3000);
    }
  };

  if (!isOpen) return null;

  const isKeyFormatValid = apiKeyInput.trim() ? validateApiKey(apiKeyInput.trim()) : null;
  const currentModelList = provider === "agent-platform" ? AGENT_PLATFORM_MODELS : GEMINI_MODELS;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-800 dark:text-slate-100">
        
        {/* Header Modal */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-cyan-500/20 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                CÀI ĐẶT HỆ THỐNG & API KEY
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tuân thủ quy chuẩn kỹ thuật Google AI & SGK Vật lí 10
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 pt-2 bg-slate-50/40 dark:bg-slate-900 gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === "ai"
                ? "border-blue-600 dark:border-cyan-400 text-blue-600 dark:text-cyan-400 bg-white dark:bg-slate-800/80 shadow-sm"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Cấu Hình AI & API Key</span>
            {apiKeyInput.trim() && isKeyFormatValid ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500 ml-1 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("lab")}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === "lab"
                ? "border-blue-600 dark:border-cyan-400 text-blue-600 dark:text-cyan-400 bg-white dark:bg-slate-800/80 shadow-sm"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Thiết Bị & Sai Số</span>
          </button>

          <button
            onClick={() => setActiveTab("about")}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === "about"
                ? "border-blue-600 dark:border-cyan-400 text-blue-600 dark:text-cyan-400 bg-white dark:bg-slate-800/80 shadow-sm"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Đề Tài & Chuẩn SGK</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {/* TAB 1: CẤU HÌNH AI & API KEY (api.md) */}
          {activeTab === "ai" && (
            <div className="space-y-4">
              {/* Nhắc nhở người dùng chọn nhà cung cấp */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  1. Chọn Nhà Cung Cấp Dịch Vụ AI (Bắt buộc chọn thủ công)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Gemini API */}
                  <button
                    type="button"
                    onClick={() => handleSelectProvider("gemini")}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      provider === "gemini"
                        ? "border-blue-600 dark:border-cyan-400 bg-blue-50/70 dark:bg-cyan-950/30 ring-2 ring-blue-600/20"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span>Gemini API</span>
                      </div>
                      {provider === "gemini" && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Google AI Studio. Mặc định: <strong>Gemini 3.6 Flash</strong> & chuỗi fallback GA.
                    </p>
                  </button>

                  {/* Option 2: Agent Platform API */}
                  <button
                    type="button"
                    onClick={() => handleSelectProvider("agent-platform")}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      provider === "agent-platform"
                        ? "border-blue-600 dark:border-cyan-400 bg-blue-50/70 dark:bg-cyan-950/30 ring-2 ring-blue-600/20"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Server className="w-4 h-4 text-indigo-500" />
                        <span>Agent Platform API</span>
                      </div>
                      {provider === "agent-platform" && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Google Enterprise Agent Platform. Mặc định: <strong>Gemini 2.5 Flash</strong>.
                    </p>
                  </button>
                </div>
              </div>

              {/* Nhập API Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    2. Nhập API Key cho {provider === "gemini" ? "Gemini API" : "Agent Platform API"}
                  </label>
                  {isKeyFormatValid === true && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Định dạng hợp lệ
                    </span>
                  )}
                  {isKeyFormatValid === false && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Cần bắt đầu bằng AIzaSy... hoặc AQ...
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKeyInput}
                    onChange={(e) => {
                      setApiKeyInput(e.target.value);
                      setTestResult({ status: "idle", message: "" });
                    }}
                    placeholder={provider === "gemini" ? "AIzaSy... hoặc AQ..." : "AQ... hoặc AIzaSy..."}
                    className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Key được lưu trữ an toàn riêng biệt trong localStorage của trình duyệt, không chia sẻ hay tải lên máy chủ trung gian.
                </div>
              </div>

              {/* Chọn Model */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  3. Chọn Model Chính (Sẽ tự động fallback nếu model quá tải)
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModelState(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {currentModelList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {provider === "gemini" ? (
                    <span>Chuỗi fallback: <strong>gemini-3.6-flash</strong> → 3.5-flash → 3.5-flash-lite → 3.1-flash-lite → 2.5-flash</span>
                  ) : (
                    <span>Chuỗi fallback: <strong>gemini-2.5-flash</strong> → gemini-2.5-flash-lite</span>
                  )}
                </div>
              </div>

              {/* Hộp phản hồi Kiểm tra kết nối */}
              {testResult.status !== "idle" && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-in fade-in duration-200 ${
                    testResult.status === "success"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                  }`}
                >
                  {testResult.status === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 leading-relaxed">
                    <strong>{testResult.status === "success" ? "Thành công: " : "Lỗi kết nối: "}</strong>
                    {testResult.message}
                  </div>
                </div>
              )}

              {/* Thông báo lưu thành công */}
              {saveSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Các nút hành động Cấu hình */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !apiKeyInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{isTesting ? "Đang kiểm tra..." : "Kiểm Tra Kết Nối (Test Key)"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Cấu Hình</span>
                </button>

                {apiKeyInput.trim() && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center gap-1.5 transition-colors ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa Key</span>
                  </button>
                )}
              </div>

              {/* Hướng dẫn lấy API Key */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  Chưa có API Key? Đăng ký miễn phí tại trang chính thức của Google:
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-cyan-400 hover:underline"
                  >
                    <span>Lấy Gemini API Key (Google AI Studio)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                  <a
                    href="https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-cyan-400 hover:underline"
                  >
                    <span>Tài liệu Agent Platform API Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CÀI ĐẶT PHÒNG THÍ NGHIỆM */}
          {activeTab === "lab" && (
            <div className="space-y-4">
              {/* Audio Beep Settings */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-5 h-5 text-teal-500" />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      Âm thanh thiết bị đo thực tế (Web Audio Synth)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Phát tiếng bíp cổng quang, va chạm, rơ-le điện từ MC964
                    </div>
                  </div>
                </div>
                <button
                  onClick={onToggleSound}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    soundEnabled ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      soundEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Instrument Error Config */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Độ chia nhỏ nhất / Sai số dụng cụ mặc định (Δxdc):</span>
                  <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                    ± {instrumentError.toFixed(4)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Quy ước SGK Bài 3: Lấy bằng 1/2 hoặc 1 độ chia nhỏ nhất của dụng cụ đo (thước kẻ, đồng hồ MC964, lực kế).
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.05"
                  step="0.001"
                  value={instrumentError}
                  onChange={(e) => onChangeInstrumentError(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          )}

          {/* TAB 3: THÔNG TIN ĐỀ TÀI & SƯ PHẠM */}
          {activeTab === "about" && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300">
                  <ShieldCheck className="w-4 h-4 text-cyan-500" />
                  <span>ĐỀ TÀI NGHIÊN CỨU SƯ PHẠM VẬT LÍ</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Ứng dụng được xây dựng theo chuẩn <strong>Chương trình Giáo dục phổ thông 2018 (SGK Kết nối tri thức với cuộc sống)</strong>. Kết hợp mô phỏng động cơ vật lí chính xác cao với Trợ lý AI sư phạm theo phương pháp Socratic định hướng phát triển phẩm chất và năng lực giải quyết vấn đề thực tiễn cho học sinh.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Tuân thủ tài liệu chuẩn kỹ thuật:
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  <li>api.md v4.1 (Gemini API & Agent Platform API)</li>
                  <li>giaodien.md (Giao diện chuẩn sư phạm)</li>
                  <li>SGK Vật lí 10 Kết nối tri thức với cuộc sống (7 chương)</li>
                  <li>Google Gen AI SDK v2.4+</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Trạng thái Key:{" "}
            {apiKeyInput.trim() && isKeyFormatValid ? (
              <strong className="text-emerald-600 dark:text-emerald-400">Đã cấu hình ({provider === "gemini" ? "Gemini" : "Agent Platform"})</strong>
            ) : (
              <strong className="text-amber-600 dark:text-amber-400">Chưa cấu hình</strong>
            )}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
