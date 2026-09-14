import React from "react";
import { LabId } from "../types";
import { LAB_CATALOG } from "../data/labCatalog";
import { MathRenderer } from "./MathRenderer";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ClipboardList, 
  Info, 
  Sliders,
  Wind,
  Gauge
} from "lucide-react";

interface LabControlsProps {
  labId: LabId;
  params: Record<string, any>;
  onParamChange: (key: string, value: any) => void;
  isRunning: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  onRecordTrial: () => void;
}

export const LabControls: React.FC<LabControlsProps> = ({
  labId,
  params,
  onParamChange,
  isRunning,
  onToggleRun,
  onReset,
  onRecordTrial,
}) => {
  const lab = LAB_CATALOG[labId];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-5">
      {/* Experiment Header Info */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
            {lab.badge}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {lab.lessonSGK}
          </span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">
          {lab.title}
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
          {lab.description}
        </p>
      </div>

      {/* Main Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          id="btn-control-toggle-run"
          onClick={onToggleRun}
          className={`px-3 py-2.5 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 ${
            isRunning
              ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
          }`}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isRunning ? "Tạm Dừng" : "Bắt Đầu"}</span>
        </button>

        <button
          id="btn-control-reset"
          onClick={onReset}
          className="px-3 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Đặt Lại</span>
        </button>

        <button
          id="btn-control-record"
          onClick={onRecordTrial}
          className="col-span-2 px-3 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm shadow-teal-600/20 transition-all active:scale-95"
        >
          <ClipboardList className="w-4 h-4" />
          <span>Lưu Vào Bảng Số Liệu</span>
        </button>
      </div>

      {/* Parameter Sliders specific to active experiment */}
      <div className="space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Sliders className="w-3.5 h-3.5 text-cyan-500" />
          <span>BẢNG ĐIỀU KHIỂN THAM SỐ THỰC NGHIỆM</span>
        </div>

        {/* LAB SPECIFIC CONTROLS */}
        {labId === "free_fall" && (
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Khoảng cách s giữa 2 cổng quang E & F:</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                  {((params.distanceS ?? 0.50) * 100).toFixed(0)} cm
                </span>
              </div>
              <input
                id="input-param-distanceS"
                type="range"
                min="0.20"
                max="0.80"
                step="0.05"
                value={params.distanceS ?? 0.50}
                onChange={(e) => onParamChange("distanceS", parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Khối lượng viên bi thép m:</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                  {params.ballMassG ?? 50} g
                </span>
              </div>
              <input
                id="input-param-ballMassG"
                type="range"
                min="20"
                max="100"
                step="10"
                value={params.ballMassG ?? 50}
                onChange={(e) => onParamChange("ballMassG", parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-500" />
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Lực cản không khí (Fc = -k·v)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {params.airResistance ? "Đang bật (Thực tế ngoài trời)" : "Đang tắt (Chân không lý tưởng g = 9.8)"}
                  </div>
                </div>
              </div>
              <button
                id="btn-toggle-airResistance"
                onClick={() => onParamChange("airResistance", !params.airResistance)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  params.airResistance ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    params.airResistance ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {labId === "projectile" && (
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Độ cao ban đầu H:</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                  {(params.initialHeightH ?? 1.2).toFixed(2)} m
                </span>
              </div>
              <input
                id="input-param-initialHeightH"
                type="range"
                min="0.5"
                max="1.6"
                step="0.1"
                value={params.initialHeightH ?? 1.2}
                onChange={(e) => onParamChange("initialHeightH", parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Vận tốc đầu v0:</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                  {(params.initialVelocityV0 ?? 4.0).toFixed(1)} m/s
                </span>
              </div>
              <input
                id="input-param-initialVelocityV0"
                type="range"
                min="1.0"
                max="8.0"
                step="0.5"
                value={params.initialVelocityV0 ?? 4.0}
                onChange={(e) => onParamChange("initialVelocityV0", parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Góc ném α (0° là ném ngang):</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                  {params.launchAngleDeg ?? 0}°
                </span>
              </div>
              <input
                id="input-param-launchAngleDeg"
                type="range"
                min="0"
                max="75"
                step="5"
                value={params.launchAngleDeg ?? 0}
                onChange={(e) => onParamChange("launchAngleDeg", parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        )}

        {labId === "newton2" && (
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Khối lượng xe trượt M:</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                  {((params.gliderMassM ?? 0.200) * 1000).toFixed(0)} g
                </span>
              </div>
              <input
                id="input-param-gliderMassM"
                type="range"
                min="0.100"
                max="0.400"
                step="0.050"
                value={params.gliderMassM ?? 0.200}
                onChange={(e) => onParamChange("gliderMassM", parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Khối lượng chùm quả nặng m:</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                  {((params.hangingMassM ?? 0.020) * 1000).toFixed(0)} g
                </span>
              </div>
              <input
                id="input-param-hangingMassM"
                type="range"
                min="0.010"
                max="0.060"
                step="0.010"
                value={params.hangingMassM ?? 0.020}
                onChange={(e) => onParamChange("hangingMassM", parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Máy nén đệm khí (Air Blower)
                </div>
                <div className="text-[11px] text-slate-500">
                  {params.airBlowerOn ? "BẬT (Triệt tiêu ma sát trên máng)" : "TẮT (Xuất hiện ma sát trượt lớn)"}
                </div>
              </div>
              <button
                id="btn-toggle-airBlowerOn"
                onClick={() => onParamChange("airBlowerOn", !params.airBlowerOn)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  params.airBlowerOn ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    params.airBlowerOn ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {labId === "friction" && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Vật liệu bề mặt tiếp xúc:
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: "wood", name: "Gỗ Phẳng", mu: "0.28" },
                  { id: "sandpaper", name: "Giấy Nhám", mu: "0.55" },
                  { id: "steel", name: "Thép Nhẵn", mu: "0.15" },
                ].map((s) => (
                  <button
                    key={s.id}
                    id={`btn-surface-${s.id}`}
                    onClick={() => onParamChange("surfaceType", s.id)}
                    className={`py-2 px-2 rounded-lg border text-center transition-all ${
                      (params.surfaceType ?? "wood") === s.id
                        ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <div>{s.name}</div>
                    <div className="text-[10px] opacity-80 font-mono">μ ≈ {s.mu}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Quả nặng gắn thêm lên khối gỗ:</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                  {((params.addedMassKg ?? 0.10) * 1000).toFixed(0)} g
                </span>
              </div>
              <input
                id="input-param-addedMassKg"
                type="range"
                min="0"
                max="0.30"
                step="0.05"
                value={params.addedMassKg ?? 0.10}
                onChange={(e) => onParamChange("addedMassKg", parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Diện tích mặt tiếp xúc:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  id="btn-area-large"
                  onClick={() => onParamChange("contactAreaType", "large")}
                  className={`py-2 px-3 rounded-lg border text-center ${
                    (params.contactAreaType ?? "large") === "large"
                      ? "bg-blue-600 text-white border-blue-600 font-semibold"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  Mặt Lớn (60 cm²)
                </button>
                <button
                  id="btn-area-small"
                  onClick={() => onParamChange("contactAreaType", "small")}
                  className={`py-2 px-3 rounded-lg border text-center ${
                    params.contactAreaType === "small"
                      ? "bg-blue-600 text-white border-blue-600 font-semibold"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  Mặt Nhỏ (25 cm²)
                </button>
              </div>
            </div>
          </div>
        )}

        {labId === "concurrent_force" && (
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Lực F1 (Lực kế 1):</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                  {(params.forceF1 ?? 2.5).toFixed(1)} N
                </span>
              </div>
              <input
                id="input-param-forceF1"
                type="range"
                min="1.0"
                max="4.5"
                step="0.5"
                value={params.forceF1 ?? 2.5}
                onChange={(e) => onParamChange("forceF1", parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Lực F2 (Lực kế 2):</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                  {(params.forceF2 ?? 3.0).toFixed(1)} N
                </span>
              </div>
              <input
                id="input-param-forceF2"
                type="range"
                min="1.0"
                max="4.5"
                step="0.5"
                value={params.forceF2 ?? 3.0}
                onChange={(e) => onParamChange("forceF2", parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Góc hợp bởi α:</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                  {params.angleAlphaDeg ?? 60}°
                </span>
              </div>
              <input
                id="input-param-angleAlphaDeg"
                type="range"
                min="0"
                max="150"
                step="15"
                value={params.angleAlphaDeg ?? 60}
                onChange={(e) => onParamChange("angleAlphaDeg", parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        )}

        {labId === "moment_rule" && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Khối lượng F1 (Trái):
                </label>
                <input
                  id="input-param-leftMassG"
                  type="number"
                  min="50"
                  max="300"
                  step="50"
                  value={params.leftMassG ?? 100}
                  onChange={(e) => onParamChange("leftMassG", parseInt(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bán kính d1 (cm):
                </label>
                <input
                  id="input-param-leftArmCm"
                  type="number"
                  min="2"
                  max="10"
                  step="2"
                  value={params.leftArmCm ?? 6}
                  onChange={(e) => onParamChange("leftArmCm", parseInt(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Khối lượng F2 (Phải):
                </label>
                <input
                  id="input-param-rightMassG"
                  type="number"
                  min="50"
                  max="300"
                  step="50"
                  value={params.rightMassG ?? 150}
                  onChange={(e) => onParamChange("rightMassG", parseInt(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bán kính d2 (cm):
                </label>
                <input
                  id="input-param-rightArmCm"
                  type="number"
                  min="2"
                  max="10"
                  step="2"
                  value={params.rightArmCm ?? 4}
                  onChange={(e) => onParamChange("rightArmCm", parseInt(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {labId === "pendulum_energy" && (
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Chiều dài dây treo l:</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                  {(params.stringLengthL ?? 0.8).toFixed(2)} m
                </span>
              </div>
              <input
                id="input-param-stringLengthL"
                type="range"
                min="0.4"
                max="1.2"
                step="0.1"
                value={params.stringLengthL ?? 0.8}
                onChange={(e) => onParamChange("stringLengthL", parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Góc thả ban đầu θ0:</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                  {params.initialAngleDeg ?? 30}°
                </span>
              </div>
              <input
                id="input-param-initialAngleDeg"
                type="range"
                min="10"
                max="55"
                step="5"
                value={params.initialAngleDeg ?? 30}
                onChange={(e) => onParamChange("initialAngleDeg", parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        )}

        {labId === "hooke_law" && (
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Khối lượng quả nặng móc vào m:</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                  {params.appliedMassG ?? 50} g (0.49 N)
                </span>
              </div>
              <input
                id="input-param-appliedMassG"
                type="range"
                min="50"
                max="250"
                step="50"
                value={params.appliedMassG ?? 50}
                onChange={(e) => onParamChange("appliedMassG", parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Độ cứng lò xo k (chuẩn):</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                  {(params.springConstantKNm ?? 25.0).toFixed(1)} N/m
                </span>
              </div>
              <input
                id="input-param-springConstantKNm"
                type="range"
                min="15"
                max="50"
                step="5"
                value={params.springConstantKNm ?? 25.0}
                onChange={(e) => onParamChange("springConstantKNm", parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        )}

        {labId === "fluid_pressure" && (
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Độ sâu đầu dò áp kế h:</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                  {(params.depthHCm ?? 15).toFixed(1)} cm
                </span>
              </div>
              <input
                id="input-param-depthHCm"
                type="range"
                min="2"
                max="28"
                step="2"
                value={params.depthHCm ?? 15}
                onChange={(e) => onParamChange("depthHCm", parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Chất lỏng trong bình:
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: "water", name: "Nước Nguyên Chất", rho: "1000" },
                  { id: "oil", name: "Dầu Ăn", rho: "800" },
                  { id: "brine", name: "Nước Muối Đặc", rho: "1150" },
                ].map((l) => (
                  <button
                    key={l.id}
                    id={`btn-liquid-${l.id}`}
                    onClick={() => onParamChange("liquidType", l.id)}
                    className={`p-2 rounded-lg border text-center ${
                      (params.liquidType ?? "water") === l.id
                        ? "bg-blue-600 text-white border-blue-600 font-semibold"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div>{l.name}</div>
                    <div className="text-[10px] opacity-75 font-mono">{l.rho} kg/m³</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {labId === "safety_measure" && (
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Vị trí du xích thước kẹp (0.02 mm):</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                  {(params.caliperMeasuredMm ?? 24.36).toFixed(2)} mm
                </span>
              </div>
              <input
                id="input-param-caliperMeasuredMm"
                type="range"
                min="5.00"
                max="45.00"
                step="0.02"
                value={params.caliperMeasuredMm ?? 24.36}
                onChange={(e) => onParamChange("caliperMeasuredMm", parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        )}

        {labId === "free_sandbox" && (
          <div className="space-y-4">
            {/* 1. Chọn Mô hình Vật Lí Lập Trình Sẵn */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>1. LỰA CHỌN MÔ HÌNH VẬT LÍ:</span>
                <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-normal">Sandbox Tự Do</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "projectile", name: "Chuyển Động Ném", desc: "Ném xiên, ngang, rơi" },
                  { id: "newton", name: "Định Luật II Newton", desc: "Xe trượt, lực F, ma sát" },
                  { id: "pendulum", name: "Con Lắc Đơn", desc: "Cơ năng, dao động" },
                  { id: "spring", name: "Dao Động Lò Xo", desc: "Định luật Hooke, lực đàn hồi" },
                ].map((m) => {
                  const isCur = (params.sandboxModel ?? "projectile") === m.id;
                  return (
                    <button
                      key={m.id}
                      id={`btn-sandbox-model-${m.id}`}
                      onClick={() => onParamChange("sandboxModel", m.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isCur
                          ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 font-medium"
                          : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-400"
                      }`}
                    >
                      <div className="text-xs font-semibold">{m.name}</div>
                      <div className={`text-[10px] mt-0.5 ${isCur ? "text-blue-100" : "text-slate-400"}`}>
                        {m.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Chọn Môi trường Trọng trường (Thiên thể / Trọng lực g) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>2. MÔI TRƯỜNG TRỌNG TRƯỜNG:</span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-bold">
                  g = {(params.sandboxGravity ?? 9.8).toFixed(2)} m/s²
                </span>
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: "earth", name: "Trái Đất", g: 9.8 },
                  { id: "moon", name: "Mặt Trăng", g: 1.62 },
                  { id: "mars", name: "Sao Hỏa", g: 3.71 },
                  { id: "custom", name: "Tùy biến", g: params.sandboxGravity ?? 9.8 },
                ].map((pl) => {
                  const isCur = (params.sandboxPlanet ?? "earth") === pl.id;
                  return (
                    <button
                      key={pl.id}
                      id={`btn-planet-${pl.id}`}
                      onClick={() => {
                        onParamChange("sandboxPlanet", pl.id);
                        if (pl.id !== "custom") onParamChange("sandboxGravity", pl.g);
                      }}
                      className={`py-1.5 px-2 rounded-lg border text-center transition-colors text-xs ${
                        isCur
                          ? "bg-teal-600 text-white border-teal-600 font-semibold"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div>{pl.name}</div>
                      <div className="text-[9px] font-mono opacity-80">{pl.g} m/s²</div>
                    </button>
                  );
                })}
              </div>
              {params.sandboxPlanet === "custom" && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Gia tốc trọng trường g tự do:</span>
                    <span className="font-mono font-bold text-teal-600">{(params.sandboxGravity ?? 9.8).toFixed(2)} m/s²</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="0.1"
                    value={params.sandboxGravity ?? 9.8}
                    onChange={(e) => onParamChange("sandboxGravity", parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                </div>
              )}
            </div>

            {/* 3. Tham Số Động Lực Học Ban Đầu - Tùy Biến Theo Mô Hình */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                3. THIẾT LẬP THAM SỐ BAN ĐẦU:
              </div>

              {/* MODEL 1: PROJECTILE MOTION */}
              {(params.sandboxModel ?? "projectile") === "projectile" && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <span>Vận tốc đầu v₀:</span>
                      <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                        {(params.sandboxV0 ?? 12.0).toFixed(1)} m/s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="25.0"
                      step="0.5"
                      value={params.sandboxV0 ?? 12.0}
                      onChange={(e) => onParamChange("sandboxV0", parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <span>Góc ném α:</span>
                      <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                        {params.sandboxAngle ?? 45}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-30"
                      max="90"
                      step="5"
                      value={params.sandboxAngle ?? 45}
                      onChange={(e) => onParamChange("sandboxAngle", parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <span>Độ cao H:</span>
                        <span className="font-mono font-bold text-blue-600">{(params.sandboxHeight ?? 1.2).toFixed(1)} m</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="3.0"
                        step="0.2"
                        value={params.sandboxHeight ?? 1.2}
                        onChange={(e) => onParamChange("sandboxHeight", parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <span>Khối lượng m:</span>
                        <span className="font-mono font-bold text-blue-600">{(params.sandboxMass ?? 0.5).toFixed(2)} kg</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="2.0"
                        step="0.05"
                        value={params.sandboxMass ?? 0.5}
                        onChange={(e) => onParamChange("sandboxMass", parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                      <span>Lực cản không khí k (F_cản = -k·v):</span>
                      <span className="font-mono font-bold text-amber-600">{(params.sandboxAirResistance ?? 0.02).toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.10"
                      step="0.01"
                      value={params.sandboxAirResistance ?? 0.02}
                      onChange={(e) => onParamChange("sandboxAirResistance", parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                  </div>
                </div>
              )}

              {/* MODEL 2: NEWTON'S 2ND LAW */}
              {params.sandboxModel === "newton" && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <span>Lực kéo F:</span>
                      <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                        {(params.sandboxForce ?? 4.0).toFixed(1)} N
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="10.0"
                      step="0.5"
                      value={params.sandboxForce ?? 4.0}
                      onChange={(e) => onParamChange("sandboxForce", parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <span>Khối lượng xe m₁:</span>
                        <span className="font-mono font-bold text-blue-600">{(params.sandboxMass ?? 0.5).toFixed(2)} kg</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.5"
                        step="0.05"
                        value={params.sandboxMass ?? 0.5}
                        onChange={(e) => onParamChange("sandboxMass", parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <span>Hệ số ma sát μ:</span>
                        <span className="font-mono font-bold text-amber-600">{(params.sandboxFriction ?? 0.05).toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.30"
                        step="0.02"
                        value={params.sandboxFriction ?? 0.05}
                        onChange={(e) => onParamChange("sandboxFriction", parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MODEL 3: PENDULUM */}
              {params.sandboxModel === "pendulum" && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <span>Chiều dài dây L:</span>
                      <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                        {(params.sandboxLength ?? 1.0).toFixed(2)} m
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="2.0"
                      step="0.1"
                      value={params.sandboxLength ?? 1.0}
                      onChange={(e) => onParamChange("sandboxLength", parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <span>Góc thả ban đầu θ₀:</span>
                      <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                        {params.sandboxAngle ?? 45}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="75"
                      step="5"
                      value={params.sandboxAngle ?? 45}
                      onChange={(e) => onParamChange("sandboxAngle", parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                      <span>Hệ số cản không khí b:</span>
                      <span className="font-mono font-bold text-amber-600">{(params.sandboxAirResistance ?? 0.02).toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.15"
                      step="0.01"
                      value={params.sandboxAirResistance ?? 0.02}
                      onChange={(e) => onParamChange("sandboxAirResistance", parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                  </div>
                </div>
              )}

              {/* MODEL 4: SPRING OSCILLATOR */}
              {params.sandboxModel === "spring" && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <span>Độ cứng lò xo k:</span>
                      <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                        {params.sandboxSpringK ?? 50} N/m
                      </span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="120"
                      step="5"
                      value={params.sandboxSpringK ?? 50}
                      onChange={(e) => onParamChange("sandboxSpringK", parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <span>Khối lượng m:</span>
                        <span className="font-mono font-bold text-blue-600">{(params.sandboxMass ?? 0.5).toFixed(2)} kg</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.5"
                        step="0.05"
                        value={params.sandboxMass ?? 0.5}
                        onChange={(e) => onParamChange("sandboxMass", parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <span>Ma sát cản γ:</span>
                        <span className="font-mono font-bold text-amber-600">{(params.sandboxAirResistance ?? 0.02).toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.15"
                        step="0.01"
                        value={params.sandboxAirResistance ?? 0.02}
                        onChange={(e) => onParamChange("sandboxAirResistance", parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Theoretical Formula Reference Box */}
      <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-300 mb-1">
          <Info className="w-3.5 h-3.5" />
          <span>CƠ SỞ LÝ THUYẾT & CÔNG THỨC SGK</span>
        </div>
        <div className="font-mono text-blue-950 dark:text-white bg-white/70 dark:bg-slate-900/80 p-2 rounded border border-blue-200/60 dark:border-blue-800/40 text-center font-bold tracking-wide [&_mjx-container]:!text-inherit">
          <MathRenderer content={"\\(" + lab.formula + "\\)"} />
        </div>
        <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-300 text-[11px] list-disc list-inside [&_mjx-container]:!text-inherit">
          {lab.principles.slice(0, 2).map((p, idx) => (
            <li key={idx} className="leading-snug"><MathRenderer content={p} /></li>
          ))}
        </ul>
      </div>
    </div>
  );
};
