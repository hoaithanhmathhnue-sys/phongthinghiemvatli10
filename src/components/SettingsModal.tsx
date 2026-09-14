import React from "react";
import { X, Volume2, ShieldCheck, Cpu, Info, Sliders } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  instrumentError: number;
  onChangeInstrumentError: (val: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
  instrumentError,
  onChangeInstrumentError,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              CÀI ĐẶT HỆ THỐNG PHÒNG LAB
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs sm:text-sm">
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

          {/* Academic Attribution & Credits */}
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300">
              <ShieldCheck className="w-4 h-4 text-cyan-500" />
              <span>ĐỀ TÀI NGHIÊN CỨU SƯ PHẠM VẬT LÍ</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Ứng dụng được xây dựng theo chuẩn <strong>Chương trình Giáo dục phổ thông 2018 (SGK Kết nối tri thức với cuộc sống)</strong>. Kết hợp mô phỏng động cơ vật lí chính xác cao với Trợ lý AI sư phạm theo phương pháp Socratic định hướng phát triển phẩm chất và năng lực giải quyết vấn đề thực tiễn cho học sinh.
            </p>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
          >
            Hoàn Tất
          </button>
        </div>
      </div>
    </div>
  );
};
