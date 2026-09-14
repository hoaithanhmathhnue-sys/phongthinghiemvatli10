import React, { useState } from "react";
import { LabId } from "../types";
import { LAB_CATALOG } from "../data/labCatalog";
import { 
  Atom, 
  Sparkles, 
  FileText, 
  Settings, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  ChevronDown,
  Layers,
  FlaskConical,
  GraduationCap
} from "lucide-react";

interface HeaderProps {
  currentLabId: LabId;
  onSelectLab: (id: LabId) => void;
  onOpenAITutor: () => void;
  onOpenReport: () => void;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLabId,
  onSelectLab,
  onOpenAITutor,
  onOpenReport,
  onOpenSettings,
  soundEnabled,
  onToggleSound,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const chapters = [
    {
      name: "Chương I. Mở Đầu",
      labs: ["safety_measure"] as LabId[],
    },
    {
      name: "Chương II. Động Học",
      labs: ["free_fall", "projectile"] as LabId[],
    },
    {
      name: "Chương III. Động Lực Học",
      labs: ["newton2", "friction", "concurrent_force", "moment_rule"] as LabId[],
    },
    {
      name: "Chương IV. Năng Lượng, Công, Công Suất",
      labs: ["pendulum_energy"] as LabId[],
    },
    {
      name: "Chương V. Động Lượng",
      labs: ["collision_momentum"] as LabId[],
    },
    {
      name: "Chương VII. Biến Dạng Vật Rắn & Áp Suất Chất Lỏng",
      labs: ["hooke_law", "fluid_pressure"] as LabId[],
    },
    {
      name: "Thí Nghiệm Tương Tác Tự Do",
      labs: ["free_sandbox"] as LabId[],
    },
    {
      name: "Đánh Giá Thực Hành",
      labs: ["digital_report"] as LabId[],
    },
  ];

  const currentLab = LAB_CATALOG[currentLabId];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl select-none">
      {/* Top Bar with School & Research Identity */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-4 h-4 text-cyan-400" />
          <span className="font-medium text-slate-300">TRƯỜNG ĐH SƯ PHẠM HÀ NỘI • KHOA VẬT LÍ</span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline text-slate-400">Đề tài NCKH: Phòng thí nghiệm ảo Vật lí 10</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 font-semibold border border-blue-700/50 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            GDPT 2018 • Sư Phạm AI
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-teal-900/60 text-teal-300 font-semibold border border-teal-700/50">
            Sách KNTT
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => onSelectLab("safety_measure")}
          className="flex items-center space-x-3 cursor-pointer group"
          id="btn-brand-logo"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-teal-500 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Atom className="w-6 h-6 text-cyan-400 animate-[spin_12s_linear_infinite]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                PHYSICS AI-LAB <span className="text-cyan-400 font-extrabold">10</span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Phòng Thí Nghiệm Ảo Vật Lí Thực Nghiệm Lớp 10
            </p>
          </div>
        </div>

        {/* Experiment Selector Dropdown */}
        <div className="relative">
          <button
            id="btn-select-experiment"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition-colors shadow-sm"
          >
            <FlaskConical className="w-4 h-4 text-teal-400" />
            <span className="max-w-[150px] sm:max-w-[260px] truncate">
              {currentLab?.title || "Chọn bài thí nghiệm"}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div 
              className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 sm:w-96 max-h-[75vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs"
              id="dropdown-experiment-list"
            >
              {chapters.map((m, mIdx) => (
                <div key={mIdx} className="mb-2 last:mb-0">
                  <div className="px-2 py-1 font-semibold text-slate-400 uppercase tracking-wider text-[10px] bg-slate-950/60 rounded flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-cyan-400" />
                    {m.name}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {m.labs.map((lid) => {
                      const lab = LAB_CATALOG[lid];
                      const isSelected = currentLabId === lid;
                      return (
                        <button
                          key={lid}
                          id={`select-lab-${lid}`}
                          onClick={() => {
                            onSelectLab(lid);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                            isSelected
                              ? "bg-blue-600 text-white font-medium shadow-sm"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <div className="truncate">
                            <div className="truncate">{lab.title}</div>
                            <div className="text-[10px] opacity-75 truncate">{lab.lessonSGK}</div>
                          </div>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shrink-0 ml-2"></span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons: AI Tutor, Report, Sound, Settings */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* AI Tutor Assistant Button */}
          <button
            id="btn-open-ai-tutor"
            onClick={onOpenAITutor}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95"
            title="Mở Trợ lý AI Sư phạm (Socratic + Gemini)"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span className="hidden sm:inline">Trợ Lý AI</span>
            <span className="sm:hidden">AI</span>
          </button>

          {/* Digital Report Button */}
          <button
            id="btn-open-report-sheet"
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-95"
            title="Mở Phiếu Báo Cáo Thực Hành Số"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden md:inline">Phiếu Báo Cáo</span>
          </button>

          {/* Sound Toggle */}
          <button
            id="btn-toggle-sound"
            onClick={onToggleSound}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title={soundEnabled ? "Tắt âm thanh thiết bị" : "Bật âm thanh thiết bị"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-green-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Settings Modal */}
          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="Cài đặt hệ thống & API Key"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Module Fast-Tabs Strip for Desktop */}
      <div className="hidden lg:block bg-slate-950/70 border-t border-slate-800/80 px-6 py-1.5 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 text-xs">
          <span className="text-slate-500 text-[11px] font-medium mr-2">CHUYÊN ĐỀ:</span>
          {modules.map((m, idx) => {
            const hasCurrentLab = m.labs.includes(currentLabId);
            return (
              <button
                key={idx}
                id={`tab-module-${idx}`}
                onClick={() => m.labs?.[0] && onSelectLab(m.labs[0])}
                className={`px-3 py-1 rounded-md transition-all whitespace-nowrap text-xs font-medium flex items-center gap-1.5 ${
                  hasCurrentLab
                    ? "bg-blue-900/60 text-cyan-300 border border-blue-700/60 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                {m.name.split(":")[0]}
                {hasCurrentLab && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
