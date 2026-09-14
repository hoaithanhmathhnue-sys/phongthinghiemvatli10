import React, { useEffect, useRef } from "react";
import { LabId } from "../types";
import { ScrollText, Clock } from "lucide-react";

export interface LogEntry {
  time: number; // seconds
  event: string;
  type: "start" | "gate" | "record" | "collision" | "info" | "reset";
  value?: string;
}

interface ExperimentLogProps {
  labId: LabId;
  entries: LogEntry[];
  isRunning: boolean;
}

const typeIcons: Record<LogEntry["type"], string> = {
  start: "▶️",
  gate: "🔔",
  record: "✅",
  collision: "💥",
  info: "📊",
  reset: "🔄",
};

const typeColors: Record<LogEntry["type"], string> = {
  start: "text-emerald-400",
  gate: "text-amber-400",
  record: "text-cyan-400",
  collision: "text-red-400",
  info: "text-slate-400",
  reset: "text-purple-400",
};

export const ExperimentLog: React.FC<ExperimentLogProps> = ({
  labId,
  entries,
  isRunning,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  if (entries.length === 0 && !isRunning) return null;

  return (
    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 border-b border-slate-700/40">
        <ScrollText className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
          Nhật Ký Thí Nghiệm
        </span>
        {isRunning && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Đang ghi
          </span>
        )}
        <span className="text-[10px] text-slate-500 font-mono ml-auto">
          {entries.length} sự kiện
        </span>
      </div>

      {/* Log Entries */}
      <div
        ref={scrollRef}
        className="max-h-[140px] overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700"
      >
        {entries.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-2">
            Bấm ▶ Bắt đầu để ghi nhật ký...
          </p>
        ) : (
          entries.map((entry, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs font-mono leading-relaxed"
            >
              <span className="text-slate-500 shrink-0 w-[72px] text-right">
                [{formatTime(entry.time)}]
              </span>
              <span className="shrink-0">{typeIcons[entry.type]}</span>
              <span className={typeColors[entry.type]}>
                {entry.event}
                {entry.value && (
                  <span className="ml-1 text-white font-semibold">
                    {entry.value}
                  </span>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toFixed(3).padStart(6, "0")}`;
}
