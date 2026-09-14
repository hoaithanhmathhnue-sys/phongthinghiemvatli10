import React, { useRef, useEffect } from "react";
import { LabId, MeasurementRecord } from "../types";
import { TrendingUp } from "lucide-react";

interface MiniChartProps {
  labId: LabId;
  records: MeasurementRecord[];
}

// Lab-specific axis labels
const AXIS_LABELS: Record<string, { x: string; y: string; xKey: keyof MeasurementRecord; yKey: keyof MeasurementRecord }> = {
  free_fall: { x: "t² (s²)", y: "s (m)", xKey: "calculated1", yKey: "param1" },
  newton2: { x: "F = mg (N)", y: "a (m/s²)", xKey: "param1", yKey: "param2" },
  friction: { x: "N (N)", y: "Fms (N)", xKey: "param1", yKey: "param2" },
  hooke_law: { x: "F (N)", y: "Δl (m)", xKey: "param1", yKey: "param2" },
  pendulum_energy: { x: "θ₀ (°)", y: "Wt (J)", xKey: "param1", yKey: "calculated2" },
  collision_momentum: { x: "p trước", y: "p sau", xKey: "param1", yKey: "param2" },
  fluid_pressure: { x: "h (cm)", y: "Δp (Pa)", xKey: "param1", yKey: "calculated1" },
  projectile: { x: "v₀ (m/s)", y: "L (m)", xKey: "param2", yKey: "calculated1" },
};

export const MiniChart: React.FC<MiniChartProps> = ({ labId, records }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 360;
    const h = 200;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);

    const config = AXIS_LABELS[labId];
    if (!config || records.length < 1) {
      ctx.fillStyle = "#475569";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Ghi nhận ≥ 1 lần đo để xem đồ thị", w / 2, h / 2);
      return;
    }

    // Extract data points
    const points: { x: number; y: number }[] = [];
    for (const r of records) {
      const xVal = Number(r[config.xKey]) || 0;
      const yVal = Number(r[config.yKey]) || 0;
      if (isFinite(xVal) && isFinite(yVal)) {
        points.push({ x: xVal, y: yVal });
      }
    }

    if (points.length === 0) {
      ctx.fillStyle = "#475569";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Chưa có dữ liệu hợp lệ", w / 2, h / 2);
      return;
    }

    // Chart margins
    const ml = 55, mr = 20, mt = 25, mb = 35;
    const cw = w - ml - mr;
    const ch = h - mt - mb;

    // Data ranges (with padding)
    let xMin = Math.min(...points.map((p) => p.x));
    let xMax = Math.max(...points.map((p) => p.x));
    let yMin = Math.min(...points.map((p) => p.y));
    let yMax = Math.max(...points.map((p) => p.y));

    // Ensure non-zero range
    if (xMax === xMin) { xMin -= 1; xMax += 1; }
    if (yMax === yMin) { yMin -= 0.5; yMax += 0.5; }
    const xPad = (xMax - xMin) * 0.1;
    const yPad = (yMax - yMin) * 0.1;
    xMin -= xPad; xMax += xPad;
    yMin -= yPad; yMax += yPad;
    if (yMin > 0) yMin = 0; // Always show origin on Y

    const toCanvasX = (v: number) => ml + ((v - xMin) / (xMax - xMin)) * cw;
    const toCanvasY = (v: number) => mt + ch - ((v - yMin) / (yMax - yMin)) * ch;

    // Grid lines
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    const xTicks = 5, yTicks = 4;
    for (let i = 0; i <= xTicks; i++) {
      const x = ml + (cw / xTicks) * i;
      ctx.beginPath(); ctx.moveTo(x, mt); ctx.lineTo(x, mt + ch); ctx.stroke();
    }
    for (let i = 0; i <= yTicks; i++) {
      const y = mt + (ch / yTicks) * i;
      ctx.beginPath(); ctx.moveTo(ml, y); ctx.lineTo(ml + cw, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ml, mt); ctx.lineTo(ml, mt + ch); ctx.lineTo(ml + cw, mt + ch);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(config.x, ml + cw / 2, h - 5);
    ctx.save();
    ctx.translate(12, mt + ch / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(config.y, 0, 0);
    ctx.restore();

    // Tick labels
    ctx.fillStyle = "#64748b";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    for (let i = 0; i <= xTicks; i++) {
      const val = xMin + ((xMax - xMin) / xTicks) * i;
      ctx.fillText(val.toFixed(2), ml + (cw / xTicks) * i, mt + ch + 14);
    }
    ctx.textAlign = "right";
    for (let i = 0; i <= yTicks; i++) {
      const val = yMax - ((yMax - yMin) / yTicks) * i;
      ctx.fillText(val.toFixed(2), ml - 5, mt + (ch / yTicks) * i + 4);
    }

    // Linear regression line (if 2+ points)
    if (points.length >= 2) {
      const n = points.length;
      const sumX = points.reduce((s, p) => s + p.x, 0);
      const sumY = points.reduce((s, p) => s + p.y, 0);
      const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
      const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
      const denom = n * sumXX - sumX * sumX;
      if (Math.abs(denom) > 1e-10) {
        const slope = (n * sumXY - sumX * sumY) / denom;
        const intercept = (sumY - slope * sumX) / n;

        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(toCanvasX(xMin), toCanvasY(slope * xMin + intercept));
        ctx.lineTo(toCanvasX(xMax), toCanvasY(slope * xMax + intercept));
        ctx.stroke();
        ctx.setLineDash([]);

        // R² calculation
        const yMean = sumY / n;
        const ssTot = points.reduce((s, p) => s + (p.y - yMean) ** 2, 0);
        const ssRes = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
        const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

        // Legend
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`k = ${slope.toFixed(4)}`, ml + 8, mt + 14);
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(`R² = ${r2.toFixed(4)}`, ml + 8 + 100, mt + 14);
      }
    }

    // Data points
    for (const p of points) {
      const cx = toCanvasX(p.x);
      const cy = toCanvasY(p.y);

      // Glow
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
      ctx.fill();

      // Point
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#38bdf8";
      ctx.fill();
      ctx.strokeStyle = "#0ea5e9";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Connect points with line
    if (points.length >= 2) {
      const sorted = [...points].sort((a, b) => a.x - b.x);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(toCanvasX(sorted[0].x), toCanvasY(sorted[0].y));
      for (let i = 1; i < sorted.length; i++) {
        ctx.lineTo(toCanvasX(sorted[i].x), toCanvasY(sorted[i].y));
      }
      ctx.stroke();
    }

  }, [labId, records]);

  if (records.length < 1) return null;

  return (
    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 border-b border-slate-700/40">
        <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
          Đồ Thị Dữ Liệu
        </span>
        <span className="ml-auto text-[10px] text-slate-500 font-mono">
          {records.length} điểm • Hồi quy tuyến tính
        </span>
      </div>
      <div className="flex justify-center p-2">
        <canvas ref={canvasRef} className="rounded-lg" />
      </div>
    </div>
  );
};
