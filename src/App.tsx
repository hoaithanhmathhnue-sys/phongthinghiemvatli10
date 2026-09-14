import React, { useState, useEffect } from "react";
import { LabId, MeasurementRecord } from "./types";
import { LAB_CATALOG } from "./data/labCatalog";
import { Header } from "./components/Header";
import { LabCanvas } from "./components/LabCanvas";
import { LabControls } from "./components/LabControls";
import { DataTable } from "./components/DataTable";
import { AIChatDrawer } from "./components/AIChatDrawer";
import { ReportModal } from "./components/ReportModal";
import { SettingsModal } from "./components/SettingsModal";
import { labAudio } from "./utils/physicsEngine";
import { 
  Sparkles, 
  BookOpen, 
  FlaskConical, 
  HelpCircle,
  FileCheck,
  CheckCircle2,
  Atom
} from "lucide-react";

export default function App() {
  const [currentLabId, setCurrentLabId] = useState<LabId>("free_fall");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modal / Drawer visibility
  const [isAIOpen, setIsAIOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Instrument error (Δxdc)
  const [instrumentError, setInstrumentError] = useState<number>(0.001);

  // Dynamic parameters state for each lab
  const [params, setParams] = useState<Record<string, any>>({
    // Free fall defaults
    distanceS: 0.50,
    ballMassG: 50,
    airResistance: false,
    dragCoeff: 0.04,
    // Projectile defaults
    initialHeightH: 1.2,
    initialVelocityV0: 4.0,
    launchAngleDeg: 0,
    showVectors: true,
    compareDropSimultaneous: true,
    // Newton 2 defaults
    gliderMassM: 0.200,
    hangingMassM: 0.020,
    flagWidthD: 0.020,
    airBlowerOn: true,
    gateDistanceS: 0.40,
    // Friction defaults
    surfaceType: "wood",
    woodBlockMassKg: 0.15,
    addedMassKg: 0.10,
    contactAreaType: "large",
    // Concurrent force defaults
    forceF1: 2.5,
    forceF2: 3.0,
    angleAlphaDeg: 60,
    // Moment rule defaults
    leftMassG: 100,
    leftArmCm: 6.0,
    rightMassG: 150,
    rightArmCm: 4.0,
    // Pendulum defaults
    stringLengthL: 0.8,
    bobMassKg: 0.1,
    initialAngleDeg: 30,
    airDamping: false,
    // Collision defaults
    cart1MassKg: 0.200,
    cart2MassKg: 0.200,
    collisionType: "elastic",
    // Hooke defaults
    initialLengthL0Mm: 100,
    appliedMassG: 50,
    springConstantKNm: 25.0,
    // Fluid pressure defaults
    depthHCm: 15.0,
    liquidType: "water",
    // Caliper defaults
    caliperMeasuredMm: 24.36,
    // Free Sandbox defaults
    sandboxModel: "projectile",
    sandboxV0: 12.0,
    sandboxAngle: 45,
    sandboxHeight: 1.2,
    sandboxMass: 0.5,
    sandboxForce: 4.0,
    sandboxGravity: 9.8,
    sandboxFriction: 0.05,
    sandboxAirResistance: 0.02,
    sandboxLength: 1.0,
    sandboxSpringK: 50,
    sandboxPlanet: "earth",
  });

  // Multi-lab Measurement Records store
  const [recordsByLab, setRecordsByLab] = useState<Record<LabId, MeasurementRecord[]>>({
    free_fall: [
      { id: "ff-1", trialNumber: 1, param1: 0.50, param2: 0.319, calculated1: 0.1018, calculated2: 9.82, timestamp: "08:15:20" },
      { id: "ff-2", trialNumber: 2, param1: 0.50, param2: 0.320, calculated1: 0.1024, calculated2: 9.77, timestamp: "08:16:05" },
      { id: "ff-3", trialNumber: 3, param1: 0.50, param2: 0.318, calculated1: 0.1011, calculated2: 9.89, timestamp: "08:17:10" },
      { id: "ff-4", trialNumber: 4, param1: 0.50, param2: 0.319, calculated1: 0.1018, calculated2: 9.82, timestamp: "08:18:00" },
      { id: "ff-5", trialNumber: 5, param1: 0.50, param2: 0.321, calculated1: 0.1030, calculated2: 9.71, timestamp: "08:19:15" },
    ],
    projectile: [],
    newton2: [
      { id: "n2-1", trialNumber: 1, param1: 0.196, param2: 0.89, calculated1: 0.891, calculated2: 0.1, timestamp: "09:10:00" },
      { id: "n2-2", trialNumber: 2, param1: 0.294, param2: 1.33, calculated1: 1.336, calculated2: 0.4, timestamp: "09:12:30" },
      { id: "n2-3", trialNumber: 3, param1: 0.392, param2: 1.78, calculated1: 1.782, calculated2: 0.1, timestamp: "09:15:10" },
    ],
    friction: [
      { id: "fr-1", trialNumber: 1, param1: 2.45, param2: 0.69, calculated1: 0.79, calculated2: 0.28, timestamp: "10:05:00" },
      { id: "fr-2", trialNumber: 2, param1: 3.43, param2: 0.96, calculated1: 1.10, calculated2: 0.28, timestamp: "10:08:12" },
      { id: "fr-3", trialNumber: 3, param1: 4.41, param2: 1.23, calculated1: 1.42, calculated2: 0.28, timestamp: "10:11:45" },
    ],
    concurrent_force: [],
    moment_rule: [],
    pendulum_energy: [],
    collision_momentum: [],
    hooke_law: [
      { id: "hk-1", trialNumber: 1, param1: 0.49, param2: 0.0196, calculated1: 25.0, calculated2: 19.6, timestamp: "11:20:00" },
      { id: "hk-2", trialNumber: 2, param1: 0.98, param2: 0.0392, calculated1: 25.0, calculated2: 39.2, timestamp: "11:23:15" },
      { id: "hk-3", trialNumber: 3, param1: 1.47, param2: 0.0588, calculated1: 25.0, calculated2: 58.8, timestamp: "11:26:40" },
    ],
    fluid_pressure: [],
    safety_measure: [],
    free_sandbox: [],
    digital_report: [],
  });

  const currentRecords = recordsByLab[currentLabId] || [];

  // Update parameter handler
  const handleParamChange = (key: string, value: any) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // Toggle run state
  const handleToggleRun = () => {
    setIsRunning((prev) => {
      const next = !prev;
      if (next && soundEnabled) {
        labAudio.playClick();
      }
      return next;
    });
  };

  // Reset simulation state
  const handleReset = () => {
    setIsRunning(false);
    if (soundEnabled) {
      labAudio.playClick();
    }
  };

  // Auto record trial handler from canvas
  const handleAutoRecordTrial = (data: {
    param1: number;
    param2: number;
    calculated1?: number;
    calculated2?: number;
  }) => {
    setRecordsByLab((prev) => {
      const labList = prev[currentLabId] || [];
      const newTrialNumber = labList.length + 1;
      const newRec: MeasurementRecord = {
        id: `${currentLabId}-${Date.now()}`,
        trialNumber: newTrialNumber,
        param1: data.param1,
        param2: data.param2,
        calculated1: data.calculated1,
        calculated2: data.calculated2,
        timestamp: new Date().toLocaleTimeString("vi-VN"),
      };
      return {
        ...prev,
        [currentLabId]: [...labList, newRec],
      };
    });
  };

  // Manual record trial button handler
  const handleRecordCurrentTrial = () => {
    if (soundEnabled) labAudio.playClick();

    // Generate accurate data point based on current active lab
    let p1 = 0;
    let p2 = 0;
    let c1 = 0;
    let c2 = 0;

    switch (currentLabId) {
      case "free_fall":
        p1 = params.distanceS ?? 0.50;
        p2 = Math.sqrt((2 * p1) / 9.8) * (1 + (Math.random() - 0.5) * 0.006);
        c1 = p2 * p2;
        c2 = (2 * p1) / c1;
        break;
      case "projectile":
        p1 = params.launchAngleDeg ?? 0;
        p2 = params.initialVelocityV0 ?? 4.0;
        c1 = p2 * Math.sqrt((2 * (params.initialHeightH ?? 1.2)) / 9.8);
        c2 = Math.sqrt((2 * (params.initialHeightH ?? 1.2)) / 9.8);
        break;
      case "newton2":
        p1 = (params.hangingMassM ?? 0.020) * 9.8;
        p2 = p1 / ((params.gliderMassM ?? 0.200) + (params.hangingMassM ?? 0.020));
        c1 = p2;
        c2 = 0;
        break;
      case "friction":
        p1 = ((params.woodBlockMassKg ?? 0.15) + (params.addedMassKg ?? 0.10)) * 9.8;
        p2 = 0.28 * p1;
        c1 = p2 * 1.15;
        c2 = 0.28;
        break;
      case "hooke_law":
        p1 = ((params.appliedMassG ?? 50) / 1000) * 9.8;
        p2 = p1 / (params.springConstantKNm ?? 25.0);
        c1 = params.springConstantKNm ?? 25.0;
        c2 = p2 * 1000;
        break;
      case "free_sandbox": {
        const sbM = params.sandboxModel ?? "projectile";
        const sbG = params.sandboxGravity ?? 9.8;
        if (sbM === "projectile") {
          const v0 = params.sandboxV0 ?? 12.0;
          const aDeg = params.sandboxAngle ?? 45;
          const aRad = (aDeg * Math.PI) / 180;
          const h0 = params.sandboxHeight ?? 1.2;
          p1 = aDeg;
          p2 = parseFloat(((v0 * Math.cos(aRad) / sbG) * (v0 * Math.sin(aRad) + Math.sqrt(Math.pow(v0 * Math.sin(aRad), 2) + 2 * sbG * h0))).toFixed(2));
          c1 = v0;
          c2 = parseFloat((0.5 * (params.sandboxMass ?? 0.5) * v0 * v0).toFixed(2));
        } else if (sbM === "newton") {
          const m1 = params.sandboxMass ?? 0.5;
          const F = params.sandboxForce ?? 4.0;
          const mu = params.sandboxFriction ?? 0.05;
          p1 = F;
          p2 = parseFloat(Math.max(0, (F - mu * m1 * sbG) / m1).toFixed(3));
          c1 = m1;
          c2 = parseFloat((mu * m1 * sbG).toFixed(3));
        } else if (sbM === "pendulum") {
          const L = params.sandboxLength ?? 1.0;
          const m = params.sandboxMass ?? 0.5;
          p1 = L;
          p2 = parseFloat((2 * Math.PI * Math.sqrt(L / sbG)).toFixed(3));
          c1 = params.sandboxAngle ?? 45;
          c2 = parseFloat((m * sbG * L * (1 - Math.cos(((params.sandboxAngle ?? 45) * Math.PI) / 180))).toFixed(3));
        } else {
          // spring
          const k = params.sandboxSpringK ?? 50;
          const m = params.sandboxMass ?? 0.5;
          p1 = k;
          p2 = parseFloat((2 * Math.PI * Math.sqrt(m / k)).toFixed(3));
          c1 = m;
          c2 = parseFloat((0.5 * k * Math.pow(0.08, 2)).toFixed(3));
        }
        break;
      }
      default:
        p1 = 1.0;
        p2 = 1.0;
    }

    handleAutoRecordTrial({
      param1: p1,
      param2: p2,
      calculated1: c1,
      calculated2: c2,
    });
  };

  const handleDeleteRecord = (id: string) => {
    setRecordsByLab((prev) => ({
      ...prev,
      [currentLabId]: (prev[currentLabId] || []).filter((r) => r.id !== id),
    }));
  };

  const handleClearRecords = () => {
    setRecordsByLab((prev) => ({
      ...prev,
      [currentLabId]: [],
    }));
  };

  const currentLab = LAB_CATALOG[currentLabId];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Header */}
      <Header
        currentLabId={currentLabId}
        onSelectLab={(id) => {
          setCurrentLabId(id);
          setIsRunning(false);
        }}
        onOpenAITutor={() => setIsAIOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 space-y-6">
        {/* Lab Title Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-cyan-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-cyan-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                  {currentLab.badge}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {currentLab.lessonSGK}
                </span>
              </div>
              <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {currentLab.title}
              </h1>
            </div>
          </div>

          {/* Quick AI Trigger Chip */}
          <button
            onClick={() => setIsAIOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600/10 to-teal-600/10 hover:from-blue-600/20 hover:to-teal-600/20 border border-blue-500/30 text-blue-700 dark:text-cyan-300 text-xs font-semibold transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Thầy AI Sư Phạm: "Em cần trợ giúp gì trong bài này?"</span>
          </button>
        </div>

        {/* 2-Column Responsive Workspace: Canvas + Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Simulation Canvas (7 cols on lg) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <LabCanvas
              labId={currentLabId}
              params={params}
              isRunning={isRunning}
              onAutoRecordTrial={handleAutoRecordTrial}
              soundEnabled={soundEnabled}
            />

            {/* Scientific Data & Statistical Analysis Table below Canvas */}
            <DataTable
              labId={currentLabId}
              records={currentRecords}
              onAddRecord={handleRecordCurrentTrial}
              onDeleteRecord={handleDeleteRecord}
              onClearRecords={handleClearRecords}
              instrumentError={instrumentError}
            />
          </div>

          {/* Right Column: Lab Hardware Controls & Socratic Prompts (5 cols on lg) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <LabControls
              labId={currentLabId}
              params={params}
              onParamChange={handleParamChange}
              isRunning={isRunning}
              onToggleRun={handleToggleRun}
              onReset={handleReset}
              onRecordTrial={handleRecordCurrentTrial}
            />

            {/* Quick Socratic Learning Card */}
            <div className="bg-gradient-to-br from-indigo-900/90 to-slate-900 border border-indigo-700/50 rounded-2xl p-4 sm:p-5 text-white shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Atom className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-sm text-white">
                    Gợi Ý Tư Duy Khoa Học
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-300 font-mono">
                  Socratic AI
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {typeof currentLab?.socraticQuestions?.[0] === "object"
                  ? currentLab.socraticQuestions[0].question
                  : currentLab?.socraticQuestions?.[0] ||
                    "Em hãy quan sát chuyển động và suy nghĩ về mối liên hệ giữa các đại lượng đo được."}
              </p>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Hỏi thầy AI để cùng tìm câu trả lời 💡
                </span>
                <button
                  onClick={() => setIsAIOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-cyan-500/20"
                >
                  Thảo Luận
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Drawers & Modals */}
      <AIChatDrawer
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        currentLabId={currentLabId}
        soundEnabled={soundEnabled}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        currentLabId={currentLabId}
        records={currentRecords}
        instrumentError={instrumentError}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        instrumentError={instrumentError}
        onChangeInstrumentError={setInstrumentError}
      />
    </div>
  );
}
