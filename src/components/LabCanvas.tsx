import React, { useEffect, useRef, useState } from "react";
import { LabId } from "../types";
import { labAudio } from "../utils/physicsEngine";

interface LabCanvasProps {
  labId: LabId;
  params: Record<string, any>;
  isRunning: boolean;
  onAutoRecordTrial?: (data: { param1: number; param2: number; calculated1?: number; calculated2?: number }) => void;
  soundEnabled: boolean;
  resetKey?: number;
  onLogEvent?: (entry: { time: number; event: string; type: "start" | "gate" | "record" | "collision" | "info" | "reset"; value?: string }) => void;
}

export const LabCanvas: React.FC<LabCanvasProps> = ({
  labId,
  params,
  isRunning,
  onAutoRecordTrial,
  soundEnabled,
  resetKey = 0,
  onLogEvent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Digital MC964 LED Display readout state
  const [mc964Time, setMc964Time] = useState<number>(0.0);
  const [mc964Active, setMc964Active] = useState<boolean>(false);
  const [gateETriggered, setGateETriggered] = useState<boolean>(false);
  const [gateFTriggered, setGateFTriggered] = useState<boolean>(false);

  // Particle system for visual effects
  const particles = useRef<Array<{
    x: number; y: number; vx: number; vy: number;
    life: number; maxLife: number; color: string; size: number;
  }>>([]);

  // Container ref for ResizeObserver
  const containerRef = useRef<HTMLDivElement>(null);

  // Local physics simulation states
  const simState = useRef({
    time: 0,
    // Free fall
    y: 0,
    vy: 0,
    freeFallRecorded: false,
    // Projectile
    projX: 0,
    projY: 0,
    projVx: 0,
    projVy: 0,
    dropY: 0,
    dropVy: 0,
    projTrail: [] as { x: number; y: number }[],
    dropTrail: [] as { x: number; y: number }[],
    projFinished: false,
    // Newton 2
    cartX: 0,
    cartVx: 0,
    tGate1: 0,
    tGate2: 0,
    cartRecorded: false,
    // Friction
    blockX: 0,
    blockVx: 0,
    currentPullForce: 0,
    // Pendulum
    theta: 0,
    omega: 0,
    // Collision
    c1X: 100,
    c1Vx: 0,
    c2X: 340,
    c2Vx: 0,
    collisionRecorded: false,
    // Hooke
    springY: 0,
    springVy: 0,
    // Free Sandbox
    sandboxX: 0,
    sandboxY: 0,
    sandboxVx: 0,
    sandboxVy: 0,
    sandboxTrail: [] as { x: number; y: number }[],
    sandboxTheta: 0,
    sandboxOmega: 0,
    sandboxSpringY: 0,
    sandboxSpringVy: 0,
    sandboxCartX: 60,
    sandboxCartVx: 0,
    sandboxRecorded: false,
  });

  // Reset simulation state when lab changes or parameters reset
  useEffect(() => {
    const s = simState.current;
    s.time = 0;
    s.y = 0;
    s.vy = 0;
    s.freeFallRecorded = false;
    (s as any).timeAtGateE = undefined;

    // Projectile
    s.projX = 0;
    s.projY = 0;
    s.dropY = 0;
    s.dropVy = 0;
    const v0 = params.initialVelocityV0 ?? 4.0;
    const angleRad = ((params.launchAngleDeg ?? 0) * Math.PI) / 180;
    s.projVx = v0 * Math.cos(angleRad);
    s.projVy = v0 * Math.sin(angleRad);
    s.projTrail = [];
    s.dropTrail = [];
    s.projFinished = false;

    // Newton 2 — use -1 sentinel so renderer places cart at gate E
    s.cartX = -1;
    s.cartVx = 0;
    s.tGate1 = 0;
    s.tGate2 = 0;
    s.cartRecorded = false;
    (s as any).timeAtGateE = undefined;

    // Friction
    s.blockX = 80;
    s.blockVx = 0;
    s.currentPullForce = 0;

    // Pendulum
    const theta0Deg = params.initialAngleDeg ?? 30;
    s.theta = (theta0Deg * Math.PI) / 180;
    s.omega = 0;

    // Collision
    s.c1X = 100;
    s.c1Vx = params.cart1InitialV ?? 0.6;
    s.c2X = 350;
    s.c2Vx = params.cart2InitialV ?? 0;
    s.collisionRecorded = false;

    // Hooke
    s.springY = 0;
    s.springVy = 0;

    // Free Sandbox
    const sbV0 = params.sandboxV0 ?? 12.0;
    const sbAngleRad = ((params.sandboxAngle ?? 45) * Math.PI) / 180;
    s.sandboxX = 0;
    s.sandboxY = params.sandboxHeight ?? 1.2;
    s.sandboxVx = sbV0 * Math.cos(sbAngleRad);
    s.sandboxVy = sbV0 * Math.sin(sbAngleRad);
    s.sandboxTrail = [];
    s.sandboxRecorded = false;
    s.sandboxCartX = 60;
    s.sandboxCartVx = 0;
    s.sandboxTheta = sbAngleRad;
    s.sandboxOmega = 0;
    s.sandboxSpringY = 0;
    s.sandboxSpringVy = 0;

    setMc964Time(0);
    setMc964Active(false);
    setGateETriggered(false);
    setGateFTriggered(false);
  }, [labId, params, resetKey]);

  // Main 60 FPS Canvas Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTimestamp = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.033); // Clamp dt to max 33ms (30fps min)
      lastTimestamp = now;

      // Handle high-DPI scaling
      const width = canvas.width;
      const height = canvas.height;

      // Clear Canvas Background (Slate-950 high-tech lab background)
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, width, height);

      // Draw subtle laboratory coordinate grid
      ctx.strokeStyle = "#162032";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Route to dedicated lab renderer
      switch (labId) {
        case "safety_measure":
          renderSafetyMeasure(ctx, width, height, params);
          break;
        case "free_fall":
          renderFreeFall(ctx, width, height, dt, isRunning, params);
          break;
        case "projectile":
          renderProjectile(ctx, width, height, dt, isRunning, params);
          break;
        case "newton2":
          renderNewton2(ctx, width, height, dt, isRunning, params);
          break;
        case "friction":
          renderFriction(ctx, width, height, dt, isRunning, params);
          break;
        case "concurrent_force":
          renderConcurrentForce(ctx, width, height, params);
          break;
        case "moment_rule":
          renderMomentRule(ctx, width, height, params);
          break;
        case "pendulum_energy":
          renderPendulum(ctx, width, height, dt, isRunning, params);
          break;
        case "collision_momentum":
          renderCollision(ctx, width, height, dt, isRunning, params);
          break;
        case "hooke_law":
          renderHooke(ctx, width, height, dt, isRunning, params);
          break;
        case "fluid_pressure":
          renderFluidPressure(ctx, width, height, params);
          break;
        case "free_sandbox":
          renderFreeSandbox(ctx, width, height, dt, isRunning, params);
          break;
        case "digital_report":
          renderDigitalReport(ctx, width, height);
          break;
        default:
          renderGenericLab(ctx, width, height);
      }

      // Update and render particles
      const ps = particles.current;
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          ps.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 120 * dt; // gravity on particles
        const alpha = 1 - p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [labId, isRunning, params, soundEnabled]);

  // ==========================================
  // RENDERER 1: FREE FALL (BÀI 10 & 11)
  // ==========================================
  const renderFreeFall = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    dt: number,
    running: boolean,
    p: Record<string, any>
  ) => {
    const s = simState.current;
    const distanceS = p.distanceS ?? 0.50; // m - khoảng cách E→F
    const airRes = p.airResistance ?? false;
    const dragK = p.dragCoeff ?? 0.04;
    const massKg = (p.ballMassG ?? 50) / 1000;
    const g = 9.80;

    // Physical positions mapping
    const colX = w * 0.40;
    const topY = 70;
    const bottomY = h - 60;
    const totalScaleM = 0.9; // 90cm scale
    const pixelsPerMeter = (bottomY - topY) / totalScaleM;

    // MAG position (electromagnet at the very top)
    const magY = topY - 4; // center of MAG block
    const magBottomY = magY + 11; // bottom edge of MAG = ball start position

    // Distance from MAG bottom to Gate E (fixed gap ~3cm)
    const distMagToE = 0.03; // 3cm gap between MAG and Gate E
    const gateEY = magBottomY + distMagToE * pixelsPerMeter;
    const gateFY = gateEY + distanceS * pixelsPerMeter;

    // Ball starts at MAG position: s.y = 0 means ball is at MAG bottom
    // s.y is physical distance (meters) fallen from MAG

    // Physics update if running
    if (running && !s.freeFallRecorded) {
      s.time += dt;
      let accel = g;
      if (airRes) {
        const dragForce = dragK * s.vy;
        accel = Math.max(0, g - dragForce / massKg);
      }
      s.vy += accel * dt;
      s.y += s.vy * dt;

      // Ball pixel position (relative to MAG bottom)
      const currentBallY = magBottomY + s.y * pixelsPerMeter;

      // Trigger Gate E: ball passes through gate E
      if (currentBallY >= gateEY && !gateETriggered) {
        setGateETriggered(true);
        setMc964Active(true);
        // Record the time when ball passes gate E
        (s as any).timeAtGateE = s.time;
        if (soundEnabled) labAudio.playGateBeep(920, 0.06);
        onLogEvent?.({ time: s.time, event: "Cổng quang E kích hoạt", type: "gate" });
      }

      // Update timer: show elapsed time since gate E (E→F only)
      if (currentBallY >= gateEY && currentBallY < gateFY && (s as any).timeAtGateE !== undefined) {
        setMc964Time(s.time - (s as any).timeAtGateE);
      }

      // Trigger Gate F (ball reaches target distance s from E)
      if (currentBallY >= gateFY) {
        s.y = (gateFY - magBottomY) / pixelsPerMeter; // Clamp at gate F
        s.freeFallRecorded = true;
        setGateFTriggered(true);
        setMc964Active(false);

        // Exact analytical time E→F:
        // At gate E, ball has velocity v_E = sqrt(2g·d_ME) from falling MAG→E
        // Time from E to F: solve s = v_E·t + 0.5·g·t²
        // t = (-v_E + sqrt(v_E² + 2·g·s)) / g
        const vAtE = Math.sqrt(2 * g * distMagToE);
        let exactTime = (-vAtE + Math.sqrt(vAtE * vAtE + 2 * g * distanceS)) / g;
        if (airRes) {
          // Analytical drag adjustment for small k*v
          exactTime *= 1.058;
        }

        setMc964Time(exactTime);
        if (soundEnabled) labAudio.playGateBeep(650, 0.1);
        onLogEvent?.({ time: s.time, event: "Cổng quang F kích hoạt", type: "gate", value: `t = ${exactTime.toFixed(4)}s` });

        // Spawn impact particles at gate F
        for (let i = 0; i < 12; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 30 + Math.random() * 60;
          particles.current.push({
            x: colX, y: gateFY,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 20,
            life: 0, maxLife: 0.5 + Math.random() * 0.3,
            color: `hsl(${45 + Math.random() * 20}, 100%, ${60 + Math.random() * 30}%)`,
            size: 1.5 + Math.random() * 2,
          });
        }

        if (onAutoRecordTrial) {
          const tSq = exactTime * exactTime;
          const gCalc = (2 * distanceS) / tSq;
          onAutoRecordTrial({
            param1: distanceS,
            param2: exactTime,
            calculated1: tSq,
            calculated2: gCalc,
          });
        }
      }
    }

    // DRAW APPARATUS
    // 1. Heavy Base Stand
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(colX - 80, bottomY + 15, 160, 25);
    ctx.fillStyle = "#334155";
    ctx.fillRect(colX - 70, bottomY + 10, 140, 6);

    // 2. Stainless Steel Column with mm graduation
    ctx.fillStyle = "#475569";
    ctx.fillRect(colX - 8, topY - 20, 16, bottomY - topY + 40);

    // Graduation marks on column (starting from gate E position)
    ctx.strokeStyle = "#94a3b8";
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "9px 'JetBrains Mono', monospace";
    for (let cm = 0; cm <= 80; cm += 2) {
      const markY = gateEY + (cm / 100) * pixelsPerMeter;
      if (markY > bottomY) break;
      const isTen = cm % 10 === 0;
      ctx.beginPath();
      ctx.moveTo(colX - 8, markY);
      ctx.lineTo(colX - 8 - (isTen ? 10 : 5), markY);
      ctx.stroke();
      if (isTen) {
        ctx.fillText(`${cm}`, colX - 28, markY + 3);
      }
    }

    // 3. Electromagnet at top (MAG)
    ctx.fillStyle = running ? "#64748b" : "#dc2626";
    ctx.fillRect(colX - 16, topY - 15, 32, 22);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "10px sans-serif";
    ctx.fillText(running ? "OFF" : "MAG", colX - 11, topY - 1);

    // 4. Photogates E and F
    const drawPhotogate = (py: number, label: string, active: boolean) => {
      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      // C-shape photogate housing
      ctx.beginPath();
      ctx.rect(colX - 35, py - 12, 70, 24);
      ctx.stroke();
      ctx.fill();

      // Infrared beam
      ctx.strokeStyle = active ? "#ef4444" : "rgba(239, 68, 68, 0.4)";
      ctx.lineWidth = active ? 2.5 : 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(colX - 25, py);
      ctx.lineTo(colX + 25, py);
      ctx.stroke();
      ctx.setLineDash([]);

      // Photodiode emitter & detector indicators
      ctx.fillStyle = active ? "#22c55e" : "#eab308";
      ctx.beginPath();
      ctx.arc(colX - 25, py, 3.5, 0, Math.PI * 2);
      ctx.arc(colX + 25, py, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Label badge
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(`Cổng ${label}`, colX + 42, py + 4);
    };

    drawPhotogate(gateEY, "E", gateETriggered);
    drawPhotogate(gateFY, "F", gateFTriggered);

    // Distance indicator dimension line s (E→F)
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(colX + 110, gateEY);
    ctx.lineTo(colX + 110, gateFY);
    ctx.stroke();
    // Arrows
    ctx.beginPath();
    ctx.moveTo(colX + 106, gateEY + 8);
    ctx.lineTo(colX + 110, gateEY);
    ctx.lineTo(colX + 114, gateEY + 8);
    ctx.moveTo(colX + 106, gateFY - 8);
    ctx.lineTo(colX + 110, gateFY);
    ctx.lineTo(colX + 114, gateFY - 8);
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 12px 'JetBrains Mono', monospace";
    ctx.fillText(`s = ${(distanceS * 100).toFixed(0)} cm`, colX + 120, (gateEY + gateFY) / 2);

    // 5. Steel Ball — starts at MAG, falls through E then F
    const currentBallY = magBottomY + s.y * pixelsPerMeter;
    const ballRadius = 9;

    // Ball gradient (metallic chrome sphere)
    const ballGrad = ctx.createRadialGradient(
      colX - 2,
      currentBallY - 2,
      1,
      colX,
      currentBallY,
      ballRadius
    );
    ballGrad.addColorStop(0, "#f8fafc");
    ballGrad.addColorStop(0.4, "#94a3b8");
    ballGrad.addColorStop(1, "#334155");

    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(colX, currentBallY, ballRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Velocity & Gravity Vectors (only show when ball is moving)
    if (s.vy > 0) {
      const vLen = Math.min(60, s.vy * 14);
      drawVector(ctx, colX, currentBallY, colX, currentBallY + vLen, "#22c55e", "v");
      drawVector(ctx, colX + 15, currentBallY, colX + 15, currentBallY + 35, "#3b82f6", "P=mg");
      if (airRes) {
        drawVector(ctx, colX - 15, currentBallY, colX - 15, currentBallY - Math.min(25, s.vy * 6), "#ef4444", "Fc");
      }
    }

    // 6. Cushion Box at bottom
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(colX - 30, bottomY - 5, 60, 20);
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(colX - 26, bottomY - 3, 52, 6); // Sponge foam

    // 7. On-Screen Realistic MC964 Digital Timer Console
    drawMC964Timer(ctx, w * 0.72, 85, mc964Time, "A <-> B", mc964Active);
  };

  // ==========================================
  // RENDERER 2: PROJECTILE MOTION (BÀI 12)
  // ==========================================
  const renderProjectile = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    dt: number,
    running: boolean,
    p: Record<string, any>
  ) => {
    const s = simState.current;
    const initialH = p.initialHeightH ?? 1.2; // m
    const v0 = p.initialVelocityV0 ?? 4.0; // m/s
    const angleDeg = p.launchAngleDeg ?? 0;
    const showVec = p.showVectors ?? true;
    const compareSim = p.compareDropSimultaneous ?? true;
    const g = 9.80;

    const startX = 100;
    const groundY = h - 60;
    const scalePxPerM = (groundY - 100) / 1.8; // 1.8m vertical scale
    const startY = groundY - initialH * scalePxPerM;

    // Physics step
    if (running && !s.projFinished) {
      s.time += dt;

      // Projectile ball (Ball B)
      s.projVy += g * dt;
      s.projX += s.projVx * dt;
      s.projY += s.projVy * dt;

      // Simultaneous free-fall ball (Ball A - dropped at startX - 25)
      s.dropVy += g * dt;
      s.dropY += s.dropVy * dt;

      const curProjPxY = startY + s.projY * scalePxPerM;
      const curProjPxX = startX + s.projX * scalePxPerM;
      s.projTrail.push({ x: curProjPxX, y: curProjPxY });

      const curDropPxY = startY + s.dropY * scalePxPerM;
      s.dropTrail.push({ x: startX - 30, y: curDropPxY });

      // Ground strike condition
      if (curProjPxY >= groundY) {
        s.projFinished = true;
        if (soundEnabled) labAudio.playCollision();

        const exactFlightTime = (s.projVy + Math.sqrt(s.projVy * s.projVy + 2 * g * initialH)) / g;
        const exactRangeL = s.projVx * (angleDeg === 0 ? Math.sqrt((2 * initialH) / g) : exactFlightTime);

        if (onAutoRecordTrial) {
          onAutoRecordTrial({
            param1: angleDeg,
            param2: v0,
            calculated1: exactRangeL,
            calculated2: exactFlightTime,
          });
        }
      }
    }

    // DRAW APPARATUS
    // Ground
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, groundY, w, h - groundY);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();

    // Ground metric marks
    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px 'JetBrains Mono', monospace";
    for (let xm = 0; xm <= 4.0; xm += 0.5) {
      const pxX = startX + xm * scalePxPerM;
      if (pxX > w - 20) break;
      ctx.beginPath();
      ctx.moveTo(pxX, groundY);
      ctx.lineTo(pxX, groundY + 6);
      ctx.stroke();
      ctx.fillText(`${xm.toFixed(1)}m`, pxX - 10, groundY + 18);
    }

    // Launch Stand Column
    ctx.fillStyle = "#475569";
    ctx.fillRect(startX - 15, startY, 20, groundY - startY);

    // Spring release mechanism / Hammer striking unit (SGK Hình 12.1)
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(startX - 50, startY - 14, 70, 20);
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(startX - 40, startY - 4, 8, 0, Math.PI * 2); // Strike hammer
    ctx.fill();

    // Launch nozzle or tube
    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate(-((angleDeg * Math.PI) / 180));
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, -6, 35, 12);
    ctx.restore();

    // Height indicator H
    ctx.strokeStyle = "#cbd5e1";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(startX - 65, startY);
    ctx.lineTo(startX - 65, groundY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "11px sans-serif";
    ctx.fillText(`H = ${initialH.toFixed(2)}m`, startX - 120, (startY + groundY) / 2);

    // Draw Parabolic Trail for Ball B
    if (s.projTrail && s.projTrail.length > 1 && s.projTrail[0]) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(s.projTrail[0].x, s.projTrail[0].y);
      for (let i = 1; i < s.projTrail.length; i++) {
        ctx.lineTo(s.projTrail[i].x, Math.min(groundY, s.projTrail[i].y));
      }
      ctx.stroke();
    }

    // Current Ball B (Projected)
    const curProjPxX = startX + s.projX * scalePxPerM;
    const curProjPxY = Math.min(groundY, startY + s.projY * scalePxPerM);

    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(curProjPxX, curProjPxY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("B", curProjPxX - 3, curProjPxY + 3);

    // Ball A (Simultaneous Free Drop - SGK H12.1)
    if (compareSim) {
      const curDropPxY = Math.min(groundY, startY + s.dropY * scalePxPerM);
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.arc(startX - 30, curDropPxY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText("A", startX - 33, curDropPxY + 3);

      // Horizontal dashed synchronization line proving identical y(t)
      if (running && !s.projFinished) {
        ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(startX - 30, curDropPxY);
        ctx.lineTo(curProjPxX, curProjPxY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Velocity vectors for Ball B
    if (showVec && running && !s.projFinished) {
      const vxPx = s.projVx * 8;
      const vyPx = s.projVy * 8;
      drawVector(ctx, curProjPxX, curProjPxY, curProjPxX + vxPx, curProjPxY, "#22c55e", "vx");
      drawVector(ctx, curProjPxX, curProjPxY, curProjPxX, curProjPxY + vyPx, "#ef4444", "vy");
      drawVector(ctx, curProjPxX, curProjPxY, curProjPxX + vxPx, curProjPxY + vyPx, "#eab308", "v");
    }

    // Telemetry Box at top right
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(w - 220, 20, 200, 110, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("THÔNG SỐ NÉM THỜI GIAN THỰC", w - 210, 38);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "11px 'JetBrains Mono', monospace";
    const curT = s.time.toFixed(2);
    const curX = (s.projX).toFixed(2);
    const curH = Math.max(0, initialH - s.projY).toFixed(2);
    ctx.fillText(`Thời gian t: ${curT} s`, w - 210, 60);
    ctx.fillText(`Tọa độ x:    ${curX} m`, w - 210, 78);
    ctx.fillText(`Độ cao y:    ${curH} m`, w - 210, 96);
    ctx.fillText(`Vận tốc v0:  ${v0.toFixed(1)} m/s (${angleDeg}°)`, w - 210, 114);
  };

  // ==========================================
  // RENDERER 3: NEWTON'S SECOND LAW AIR TRACK (BÀI 15)
  // ==========================================
  const renderNewton2 = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    dt: number,
    running: boolean,
    p: Record<string, any>
  ) => {
    const s = simState.current;
    const M = p.gliderMassM ?? 0.200; // kg
    const m = p.hangingMassM ?? 0.020; // kg
    const flagD = p.flagWidthD ?? 0.020; // m
    const blowerOn = p.airBlowerOn ?? true;
    const gateDistS = p.gateDistanceS ?? 0.40; // m
    const g = 9.80;

    const trackY = h * 0.45;
    const trackStartX = 50;
    const trackEndX = w - 120;
    const trackLengthPx = trackEndX - trackStartX;
    const pxPerMeter = trackLengthPx / 1.2; // 1.2m track

    const gate1X = trackStartX + 200;
    const gate2X = gate1X + gateDistS * pxPerMeter;

    // Cart starts at gate E position: initialize from sentinel
    if (s.cartX < 0) {
      s.cartX = gate1X;
    }

    // Physics step
    if (running && !s.cartRecorded) {
      s.time += dt;

      // Friction condition: if blower is OFF, friction coefficient mu ~ 0.18
      const frictionForce = blowerOn ? 0 : 0.18 * M * g;
      const netForce = Math.max(0, m * g - frictionForce);
      const accel = netForce / (M + m);

      s.cartVx += accel * dt;
      s.cartX += s.cartVx * dt * pxPerMeter;

      // Photogate E check (flag passes through gate E)
      if (s.cartX >= gate1X && s.cartX <= gate1X + flagD * pxPerMeter) {
        if (!gateETriggered) {
          setGateETriggered(true);
          setMc964Active(true);
          s.tGate1 = flagD / Math.max(0.01, s.cartVx);
          // Record time when cart passes gate E
          (s as any).timeAtGateE = s.time;
          if (soundEnabled) labAudio.playGateBeep(880, 0.04);
        }
      }

      // Update MC964 timer: show elapsed time since gate E
      if (gateETriggered && !gateFTriggered && (s as any).timeAtGateE !== undefined) {
        setMc964Time(s.time - (s as any).timeAtGateE);
      }

      // Photogate F check (flag passes through gate F)
      if (s.cartX >= gate2X) {
        if (!gateFTriggered) {
          setGateFTriggered(true);
          setMc964Active(false);
          s.tGate2 = flagD / Math.max(0.01, s.cartVx);
          s.cartRecorded = true;
          if (soundEnabled) labAudio.playGateBeep(700, 0.08);

          // Record exact E→F time
          const exactEFTime = (s as any).timeAtGateE !== undefined ? s.time - (s as any).timeAtGateE : s.time;
          setMc964Time(exactEFTime);

          const v1 = flagD / s.tGate1;
          const v2 = flagD / s.tGate2;
          const aExp = (v2 * v2 - v1 * v1) / (2 * gateDistS);
          const aTheo = (m * g) / (M + m);

          if (onAutoRecordTrial) {
            onAutoRecordTrial({
              param1: m * g, // Lực kéo F (N)
              param2: aExp,  // Gia tốc thực nghiệm (m/s²)
              calculated1: aTheo,
              calculated2: Math.abs((aExp - aTheo) / aTheo) * 100,
            });
          }
        }
      }

      // Limit at bumper
      if (s.cartX > trackEndX - 40) {
        s.cartX = trackEndX - 40;
        s.cartVx = 0;
      }
    }

    // DRAW APPARATUS
    // 1. Triangular Aluminum Air Track with airflow holes
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.moveTo(trackStartX, trackY + 25);
    ctx.lineTo(trackEndX, trackY + 25);
    ctx.lineTo(trackEndX, trackY - 10);
    ctx.lineTo(trackStartX, trackY - 10);
    ctx.closePath();
    ctx.fill();

    // Precision air hole dots along track
    ctx.fillStyle = blowerOn ? "#38bdf8" : "#64748b";
    for (let x = trackStartX + 10; x < trackEndX; x += 15) {
      ctx.beginPath();
      ctx.arc(x, trackY - 5, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Air blower status banner
    ctx.fillStyle = blowerOn ? "#0284c7" : "#475569";
    ctx.fillRect(trackStartX, trackY + 35, 130, 22);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText(blowerOn ? "💨 ĐỆM KHÍ: BẬT (μ ≈ 0)" : "❌ ĐỆM KHÍ: TẮT (Ma sát)", trackStartX + 6, trackY + 50);

    // 2. Pulley at track end
    const pulleyX = trackEndX + 15;
    const pulleyY = trackY - 5;
    ctx.fillStyle = "#94a3b8";
    ctx.beginPath();
    ctx.arc(pulleyX, pulleyY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.stroke();

    // 3. Glider (Xe trượt)
    const cartW = 80;
    const cartH = 30;
    const curCartX = Math.min(trackEndX - cartW - 10, s.cartX);

    // Glider body
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(curCartX, trackY - cartH - 5, cartW, cartH);
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 2;
    ctx.strokeRect(curCartX, trackY - cartH - 5, cartW, cartH);

    // Light barrier flag (tấm cờ chắn sáng rộng d = 20mm)
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(curCartX + cartW / 2 - 8, trackY - cartH - 30, 16, 25);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "8px sans-serif";
    ctx.fillText("20mm", curCartX + cartW / 2 - 12, trackY - cartH - 33);

    // Glider Mass label
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText(`M = ${(M * 1000).toFixed(0)}g`, curCartX + 16, trackY - cartH + 14);

    // 4. Photogates E & F on track
    const drawAirTrackGate = (gx: number, name: string, active: boolean) => {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(gx - 12, trackY - 60, 24, 60);
      ctx.strokeStyle = active ? "#22c55e" : "#eab308";
      ctx.lineWidth = 2;
      ctx.strokeRect(gx - 12, trackY - 60, 24, 60);

      // Red laser beam
      ctx.strokeStyle = active ? "#22c55e" : "#ef4444";
      ctx.beginPath();
      ctx.moveTo(gx, trackY - 50);
      ctx.lineTo(gx, trackY - 10);
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(name, gx - 5, trackY - 65);
    };

    drawAirTrackGate(gate1X, "Cổng E", gateETriggered);
    drawAirTrackGate(gate2X, "Cổng F", gateFTriggered);

    // Distance label between gates
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 10px 'JetBrains Mono', monospace";
    ctx.fillText(`${(gateDistS * 100).toFixed(0)}cm`, (gate1X + gate2X) / 2 - 10, trackY - 68);

    // 5. Pulling String & Hanging Mass m
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(curCartX + cartW, trackY - 10);
    ctx.lineTo(pulleyX, pulleyY - 14);
    ctx.lineTo(pulleyX + 14, Math.min(h - 30, pulleyY + (s.cartX - gate1X) * 0.5 + 40));
    ctx.stroke();

    // Hanging weight — clamp to stay within canvas
    const hangY = Math.min(h - 30, pulleyY + (s.cartX - gate1X) * 0.5 + 40);
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(pulleyX + 5, hangY, 18, 26);
    ctx.fillStyle = "#ffffff";
    ctx.font = "9px sans-serif";
    ctx.fillText(`m=${(m * 1000).toFixed(0)}g`, pulleyX - 5, hangY + 38);

    // Real-time calculated readings — show E→F time
    drawMC964Timer(ctx, w * 0.72, 85, mc964Time, "MODE A<->B", mc964Active);
  };

  // ==========================================
  // RENDERER 4: FRICTION EXPERIMENT (BÀI 18)
  // ==========================================
  const renderFriction = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    dt: number,
    running: boolean,
    p: Record<string, any>
  ) => {
    const s = simState.current;
    const surface = p.surfaceType ?? "wood"; // wood (0.28), sandpaper (0.55), steel (0.15)
    const blockM = p.woodBlockMassKg ?? 0.15; // 150g
    const addedM = p.addedMassKg ?? 0.10; // 100g
    const contactArea = p.contactAreaType ?? "large"; // large vs small
    const g = 9.80;

    const totalMass = blockM + addedM;
    const normalForceN = totalMass * g;

    // Friction coefficients
    let mu = 0.28;
    if (surface === "sandpaper") mu = 0.55;
    if (surface === "steel") mu = 0.15;

    const maxStaticFrictionF0 = mu * normalForceN * 1.15; // F0 slightly higher than Fms
    const kineticFrictionFms = mu * normalForceN;

    const tableY = h * 0.55;
    const blockW = contactArea === "large" ? 110 : 60;
    const blockH = contactArea === "large" ? 40 : 70;

    if (running) {
      s.time += dt;
      // Ramp pull force up to kinetic friction
      s.currentPullForce = Math.min(kineticFrictionFms, s.time * 1.2);

      if (s.currentPullForce >= kineticFrictionFms * 0.98) {
        s.blockX += 35 * dt; // Moving uniformly
      }

      if (s.blockX > w * 0.45 && !s.cartRecorded) {
        s.cartRecorded = true;
        if (onAutoRecordTrial) {
          onAutoRecordTrial({
            param1: normalForceN,      // Áp lực N (Newton)
            param2: kineticFrictionFms,// Lực ma sát trượt F_ms (Newton)
            calculated1: maxStaticFrictionF0,
            calculated2: mu,
          });
        }
      }
    }

    // DRAW TABLE SURFACE
    let surfacePatternColor = "#b45309"; // wood
    if (surface === "sandpaper") surfacePatternColor = "#44403c";
    if (surface === "steel") surfacePatternColor = "#64748b";

    ctx.fillStyle = surfacePatternColor;
    ctx.fillRect(40, tableY, w - 80, 25);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, tableY, w - 80, 25);

    // Surface label
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px sans-serif";
    const surfaceName =
      surface === "wood" ? "Gỗ Bào Phẳng (μ ≈ 0.28)" : surface === "sandpaper" ? "Giấy Nhám Thô (μ ≈ 0.55)" : "Mặt Thép Mạ Crôm (μ ≈ 0.15)";
    ctx.fillText(`Bề mặt tiếp xúc: ${surfaceName}`, 50, tableY + 17);

    // WOODEN BLOCK
    const curX = s.blockX;
    ctx.fillStyle = "#d97706";
    ctx.fillRect(curX, tableY - blockH, blockW, blockH);
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 2;
    ctx.strokeRect(curX, tableY - blockH, blockW, blockH);

    // Added Weights on top
    if (addedM > 0) {
      ctx.fillStyle = "#334155";
      ctx.fillRect(curX + blockW / 2 - 18, tableY - blockH - 22, 36, 22);
      ctx.fillStyle = "#ffffff";
      ctx.font = "9px sans-serif";
      ctx.fillText(`+${(addedM * 1000).toFixed(0)}g`, curX + blockW / 2 - 14, tableY - blockH - 8);
    }

    // Spring Balance Dynamometer pulling horizontally
    const dynaStartX = curX + blockW;
    const dynaEndX = dynaStartX + 160;
    const dynaY = tableY - blockH / 2;

    // Pull string
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(curX + blockW, dynaY);
    ctx.lineTo(dynaStartX + 20, dynaY);
    ctx.stroke();

    // Spring balance body
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 2;
    ctx.fillRect(dynaStartX + 20, dynaY - 14, 130, 28);
    ctx.strokeRect(dynaStartX + 20, dynaY - 14, 130, 28);

    // Scale markings on dynamometer (0 - 5 N)
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.fillText(`LỰC KẾ: ${s.currentPullForce.toFixed(2)} N`, dynaStartX + 30, dynaY + 4);

    // Force Vectors overlay
    drawVector(ctx, curX + blockW / 2, tableY - blockH / 2, curX + blockW / 2 + s.currentPullForce * 40, tableY - blockH / 2, "#22c55e", "Fkéo");
    drawVector(ctx, curX + blockW / 2, tableY - blockH / 2, curX + blockW / 2 - kineticFrictionFms * 40, tableY - blockH / 2, "#ef4444", "Fms");
    drawVector(ctx, curX + blockW / 2, tableY - blockH / 2, curX + blockW / 2, tableY - blockH / 2 + normalForceN * 20, "#3b82f6", "P");
    drawVector(ctx, curX + blockW / 2, tableY - blockH / 2, curX + blockW / 2, tableY - blockH / 2 - normalForceN * 20, "#eab308", "N");

    // Scientific friction comparison panel
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = "#334155";
    ctx.beginPath();
    ctx.roundRect(w - 240, 25, 220, 115, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("KẾT QUẢ KHẢO SÁT MA SÁT", w - 230, 45);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText(`Áp lực N = P:     ${normalForceN.toFixed(2)} N`, w - 230, 68);
    ctx.fillText(`Fms trượt đo:     ${kineticFrictionFms.toFixed(2)} N`, w - 230, 88);
    ctx.fillText(`Hệ số ma sát μ:   ${mu.toFixed(2)}`, w - 230, 108);
    ctx.fillText(`F_nghỉ cực đại F0: ${maxStaticFrictionF0.toFixed(2)} N`, w - 230, 128);
  };

  // ==========================================
  // RENDERER 5: CONCURRENT FORCE (BÀI 22)
  // ==========================================
  const renderConcurrentForce = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    p: Record<string, any>
  ) => {
    const f1 = p.forceF1 ?? 2.5; // N
    const f2 = p.forceF2 ?? 3.0; // N
    const alphaDeg = p.angleAlphaDeg ?? 60; // độ
    const alphaRad = (alphaDeg * Math.PI) / 180;

    const ox = w * 0.45;
    const oy = h * 0.55;
    const scalePxPerN = 45; // 45px per 1N

    // Vector 1 (angle -alpha/2)
    const a1 = -alphaRad / 2;
    const v1x = f1 * Math.cos(a1) * scalePxPerN;
    const v1y = f1 * Math.sin(a1) * scalePxPerN;

    // Vector 2 (angle +alpha/2)
    const a2 = alphaRad / 2;
    const v2x = f2 * Math.cos(a2) * scalePxPerN;
    const v2y = f2 * Math.sin(a2) * scalePxPerN;

    // Theoretical resultant vector F = F1 + F2
    const vrx = v1x + v2x;
    const vry = v1y + v2y;
    const fResultant = Math.sqrt(f1 * f1 + f2 * f2 + 2 * f1 * f2 * Math.cos(alphaRad));

    // Draw Magnetic Whiteboard
    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.fillRect(40, 30, w - 80, h - 60);
    ctx.strokeRect(40, 30, w - 80, h - 60);

    // Center point O (rubber ring)
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.arc(ox, oy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("O", ox - 20, oy + 5);

    // Parallelogram dashed lines
    ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(ox + v1x, oy + v1y);
    ctx.lineTo(ox + vrx, oy + vry);
    ctx.lineTo(ox + v2x, oy + v2y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Vector F1, Vector F2 and Resultant Vector F
    drawVector(ctx, ox, oy, ox + v1x, oy + v1y, "#38bdf8", `F1 = ${f1.toFixed(1)}N`);
    drawVector(ctx, ox, oy, ox + v2x, oy + v2y, "#22c55e", `F2 = ${f2.toFixed(1)}N`);
    drawVector(ctx, ox, oy, ox + vrx, oy + vry, "#f43f5e", `F_hl = ${fResultant.toFixed(2)}N`);

    // Arc showing angle alpha
    ctx.strokeStyle = "#eab308";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ox, oy, 40, a1, a2);
    ctx.stroke();
    ctx.fillStyle = "#eab308";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText(`α = ${alphaDeg}°`, ox + 48, oy + 4);

    // Telemetry Info Box
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "#334155";
    ctx.beginPath();
    ctx.roundRect(w - 260, 45, 240, 110, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("QUY TẮC HÌNH BÌNH HÀNH LỰC", w - 245, 65);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText(`Lực kế 1:      ${f1.toFixed(1)} N`, w - 245, 88);
    ctx.fillText(`Lực kế 2:      ${f2.toFixed(1)} N`, w - 245, 108);
    ctx.fillText(`Góc hợp bởi:   ${alphaDeg}°`, w - 245, 128);
    ctx.fillText(`Hợp lực F_lt:  ${fResultant.toFixed(2)} N`, w - 245, 148);
  };

  // ==========================================
  // RENDERER 6: MOMENT RULE TORQUE DISK (BÀI 21)
  // ==========================================
  const renderMomentRule = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    p: Record<string, any>
  ) => {
    const leftM = p.leftMassG ?? 100; // g
    const leftD = p.leftArmCm ?? 6.0; // cm
    const rightM = p.rightMassG ?? 150; // g
    const rightD = p.rightArmCm ?? 4.0; // cm
    const g = 9.80;

    const f1 = (leftM / 1000) * g;
    const f2 = (rightM / 1000) * g;
    const torqueLeft = f1 * (leftD / 100);
    const torqueRight = f2 * (rightD / 100);

    const isBalanced = Math.abs(torqueLeft - torqueRight) < 0.005;

    const cx = w * 0.45;
    const cy = h * 0.50;
    const maxRadiusPx = 130;

    // Draw Circular Disk
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = isBalanced ? "#22c55e" : "#e2e8f0";
    ctx.lineWidth = isBalanced ? 3 : 2;
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadiusPx, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Concentric circles (d = 2, 4, 6, 8, 10 cm)
    ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
    ctx.lineWidth = 1;
    for (let rCm = 2; rCm <= 10; rCm += 2) {
      const rPx = (rCm / 10) * maxRadiusPx;
      ctx.beginPath();
      ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.fillText(`${rCm}cm`, cx + rPx - 10, cy - 4);
    }

    // Center Pivot Axis (Trục quay O)
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("O", cx - 4, cy + 18);

    // Left Hanging point
    const leftPx = (leftD / 10) * maxRadiusPx;
    const leftHangX = cx - leftPx;
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(leftHangX, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Left cord & weights
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftHangX, cy);
    ctx.lineTo(leftHangX, cy + 80);
    ctx.stroke();

    ctx.fillStyle = "#0284c7";
    ctx.fillRect(leftHangX - 12, cy + 80, 24, 30);
    ctx.fillStyle = "#ffffff";
    ctx.font = "10px sans-serif";
    ctx.fillText(`${leftM}g`, leftHangX - 10, cy + 98);

    // Right Hanging point
    const rightPx = (rightD / 10) * maxRadiusPx;
    const rightHangX = cx + rightPx;
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(rightHangX, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Right cord & weights
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rightHangX, cy);
    ctx.lineTo(rightHangX, cy + 80);
    ctx.stroke();

    ctx.fillStyle = "#15803d";
    ctx.fillRect(rightHangX - 12, cy + 80, 24, 30);
    ctx.fillStyle = "#ffffff";
    ctx.font = "10px sans-serif";
    ctx.fillText(`${rightM}g`, rightHangX - 10, cy + 98);

    // Status Banner
    ctx.fillStyle = isBalanced ? "#15803d" : "#dc2626";
    ctx.fillRect(cx - 100, 35, 200, 28);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText(
      isBalanced ? "✓ ĐĨA CÂN BẰNG (M1 = M2)" : "⚠ ĐĨA MẤT CÂN BẰNG (M1 ≠ M2)",
      cx - 85,
      53
    );

    // Telemetry Box
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "#334155";
    ctx.beginPath();
    ctx.roundRect(w - 240, cy - 60, 220, 120, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("KIỂM CHỨNG QUY TẮC MOMENT", w - 225, cy - 40);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText(`M_trái  = F1·d1 = ${torqueLeft.toFixed(3)} N·m`, w - 225, cy - 18);
    ctx.fillText(`M_phải  = F2·d2 = ${torqueRight.toFixed(3)} N·m`, w - 225, cy + 4);
    ctx.fillText(`Chênh lệch:    ${Math.abs(torqueLeft - torqueRight).toFixed(3)} N·m`, w - 225, cy + 26);
    ctx.fillText(`Trạng thái:    ${isBalanced ? "CÂN BẰNG" : "QUAY"}`, w - 225, cy + 48);
  };

  // ==========================================
  // RENDERER 7: PENDULUM MECHANICAL ENERGY (BÀI 26)
  // ==========================================
  const renderPendulum = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    dt: number,
    running: boolean,
    p: Record<string, any>
  ) => {
    const s = simState.current;
    const lengthL = p.stringLengthL ?? 0.8; // m
    const bobMass = p.bobMassKg ?? 0.1; // kg
    const dampingOn = p.airDamping ?? false;
    const g = 9.80;

    const pivotX = w * 0.38;
    const pivotY = 70;
    const cordLengthPx = 200;

    if (running) {
      s.time += dt;
      // Pendulum ODE: theta'' = -(g/L)*sin(theta) - beta*theta'
      const beta = dampingOn ? 0.25 : 0.0;
      const alpha = -(g / lengthL) * Math.sin(s.theta) - beta * s.omega;
      s.omega += alpha * dt;
      s.theta += s.omega * dt;
    }

    const bobX = pivotX + cordLengthPx * Math.sin(s.theta);
    const bobY = pivotY + cordLengthPx * Math.cos(s.theta);

    // Energies calculation
    const v = s.omega * lengthL; // m/s
    const currentH = lengthL * (1 - Math.cos(s.theta)); // m
    const kineticEnergy = 0.5 * bobMass * v * v;
    const potentialEnergy = bobMass * g * currentH;
    const totalMechanicalEnergy = kineticEnergy + potentialEnergy;

    // Draw Suspension Pivot
    ctx.fillStyle = "#475569";
    ctx.fillRect(pivotX - 35, pivotY - 10, 70, 10);
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Cord
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();

    // Pendulum Bob
    const bobGrad = ctx.createRadialGradient(bobX - 3, bobY - 3, 2, bobX, bobY, 14);
    bobGrad.addColorStop(0, "#f8fafc");
    bobGrad.addColorStop(0.5, "#0284c7");
    bobGrad.addColorStop(1, "#0f172a");
    ctx.fillStyle = bobGrad;
    ctx.beginPath();
    ctx.arc(bobX, bobY, 14, 0, Math.PI * 2);
    ctx.fill();

    // Photogate at Equilibrium (VTCB)
    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pivotX - 20, pivotY + cordLengthPx - 10, 40, 20);

    // Dynamic Live Energy Bar Charts on Canvas
    const barX = w * 0.70;
    const barBaseY = h - 70;
    const maxBarH = 150;
    const maxE = 0.5; // 0.5 Joules scale

    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "#334155";
    ctx.beginPath();
    ctx.roundRect(barX - 20, barBaseY - maxBarH - 45, 180, maxBarH + 75, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("BIỂU ĐỒ BẢO TOÀN NĂNG LƯỢNG", barX - 10, barBaseY - maxBarH - 25);

    // Draw 3 Bars: W_d (Kinetic), W_t (Potential), W (Total)
    const drawEnergyBar = (bx: number, val: number, color: string, name: string) => {
      const bh = Math.min(maxBarH, (val / maxE) * maxBarH);
      ctx.fillStyle = color;
      ctx.fillRect(bx, barBaseY - bh, 35, bh);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, barBaseY - bh, 35, bh);

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(name, bx + 5, barBaseY + 16);
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillText(`${val.toFixed(3)}J`, bx - 2, barBaseY - bh - 5);
    };

    drawEnergyBar(barX, kineticEnergy, "#3b82f6", "W_đ");
    drawEnergyBar(barX + 50, potentialEnergy, "#ef4444", "W_t");
    drawEnergyBar(barX + 100, totalMechanicalEnergy, "#22c55e", "W_cơ");
  };

  // ==========================================
  // RENDERER 8: COLLISION & MOMENTUM (BÀI 30)
  // ==========================================
  const renderCollision = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    dt: number,
    running: boolean,
    p: Record<string, any>
  ) => {
    const s = simState.current;
    const m1 = p.cart1MassKg ?? 0.200; // kg
    const m2 = p.cart2MassKg ?? 0.200; // kg
    const type = p.collisionType ?? "elastic"; // elastic vs inelastic

    const trackY = h * 0.50;
    const cartW = 75;
    const cartH = 30;

    if (running) {
      s.time += dt;

      if (!s.collisionRecorded) {
        // Before collision: update positions independently
        s.c1X += s.c1Vx * dt * 250;
        s.c2X += s.c2Vx * dt * 250;

        // Detect collision
        if (s.c1X + cartW >= s.c2X) {
          s.collisionRecorded = true;
          if (soundEnabled) labAudio.playCollision();
          onLogEvent?.({ time: s.time, event: "Va chạm xảy ra!", type: "collision", value: `${type === "elastic" ? "Đàn hồi" : "Mềm (dính liền)"}` });

          // Spawn collision particles
          const collisionX = (s.c1X + cartW + s.c2X) / 2;
          for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 80;
            particles.current.push({
              x: collisionX, y: trackY - cartH / 2,
              vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
              life: 0, maxLife: 0.4 + Math.random() * 0.4,
              color: `hsl(${200 + Math.random() * 60}, 100%, ${70 + Math.random() * 20}%)`,
              size: 2 + Math.random() * 2.5,
            });
          }

          const u1 = s.c1Vx;
          const u2 = s.c2Vx;

          if (type === "elastic") {
            // 1D Elastic Collision formulas
            s.c1Vx = ((m1 - m2) * u1 + 2 * m2 * u2) / (m1 + m2);
            s.c2Vx = ((m2 - m1) * u2 + 2 * m1 * u1) / (m1 + m2);
          } else {
            // Inelastic (va chạm mềm dính liền) — cả 2 cùng vận tốc
            const commonV = (m1 * u1 + m2 * u2) / (m1 + m2);
            s.c1Vx = commonV;
            s.c2Vx = commonV;
            // Snap cart 2 right next to cart 1
            s.c2X = s.c1X + cartW;
          }

          if (onAutoRecordTrial) {
            const pBefore = m1 * u1 + m2 * u2;
            const pAfter = m1 * s.c1Vx + m2 * s.c2Vx;
            onAutoRecordTrial({
              param1: pBefore,
              param2: pAfter,
              calculated1: Math.abs(pAfter - pBefore),
              calculated2: Math.abs((pAfter - pBefore) / (pBefore || 1)) * 100,
            });
          }
        }
      } else {
        // After collision: update positions
        s.c1X += s.c1Vx * dt * 250;
        s.c2X += s.c2Vx * dt * 250;

        // In inelastic collision: keep carts stuck together
        if (type !== "elastic") {
          s.c2X = s.c1X + cartW;
        }
      }
    }

    // Draw Air Track
    ctx.fillStyle = "#334155";
    ctx.fillRect(40, trackY, w - 80, 20);

    // Air track surface dots
    ctx.fillStyle = "#38bdf8";
    for (let x = 50; x < w - 80; x += 15) {
      ctx.beginPath();
      ctx.arc(x, trackY + 5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cart 1 (Blue)
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(s.c1X, trackY - cartH, cartW, cartH);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(s.c1X, trackY - cartH, cartW, cartH);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText(`Xe 1 (${(m1 * 1000).toFixed(0)}g)`, s.c1X + 10, trackY - 12);

    // Cart 2 (Green)
    ctx.fillStyle = "#15803d";
    ctx.fillRect(s.c2X, trackY - cartH, cartW, cartH);
    ctx.strokeStyle = "#4ade80";
    ctx.strokeRect(s.c2X, trackY - cartH, cartW, cartH);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText(`Xe 2 (${(m2 * 1000).toFixed(0)}g)`, s.c2X + 10, trackY - 12);

    // Collision bumper type visual on cart 1 right side
    if (type === "elastic") {
      // Lá thép đàn hồi (spring bumper)
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(s.c1X + cartW + 4, trackY - cartH / 2, 6, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    } else {
      // Kim cắm sáp (needle/wax pin for inelastic)
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(s.c1X + cartW, trackY - cartH / 2 - 4, 8, 8);
      // Sáp on cart 2 left side
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(s.c2X - 6, trackY - cartH / 2 - 3, 6, 6);
    }

    // After inelastic collision: draw coupling bracket showing carts are stuck
    if (type !== "elastic" && s.collisionRecorded) {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 2]);
      // Bracket connecting the two carts
      const bracketY1 = trackY - cartH - 5;
      const bracketY2 = trackY - cartH - 12;
      ctx.beginPath();
      ctx.moveTo(s.c1X + cartW / 2, bracketY1);
      ctx.lineTo(s.c1X + cartW / 2, bracketY2);
      ctx.lineTo(s.c2X + cartW / 2, bracketY2);
      ctx.lineTo(s.c2X + cartW / 2, bracketY1);
      ctx.stroke();
      ctx.setLineDash([]);

      // "DÍNH" label
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText("DÍNH", (s.c1X + s.c2X + cartW) / 2 - 10, bracketY2 - 3);
    }

    // Velocity Vectors
    const v1Display = s.c1Vx.toFixed(2);
    const v2Display = s.c2Vx.toFixed(2);
    drawVector(ctx, s.c1X + cartW / 2, trackY - cartH - 18, s.c1X + cartW / 2 + s.c1Vx * 60, trackY - cartH - 18, "#38bdf8", `v1=${v1Display}`);
    if (!(type !== "elastic" && s.collisionRecorded)) {
      // Show v2 vector only if not stuck (when stuck, they share v1)
      drawVector(ctx, s.c2X + cartW / 2, trackY - cartH - 18, s.c2X + cartW / 2 + s.c2Vx * 60, trackY - cartH - 18, "#4ade80", `v2=${v2Display}`);
    }

    // Momentum conservation display
    const pBefore = m1 * (p.cart1InitialV ?? 0.60) + m2 * (p.cart2InitialV ?? 0);
    const pAfter = m1 * s.c1Vx + m2 * s.c2Vx;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText(`p trước = ${pBefore.toFixed(4)} kg·m/s`, 60, trackY + 50);
    ctx.fillText(`p sau   = ${pAfter.toFixed(4)} kg·m/s`, 60, trackY + 66);
    const pErr = pBefore !== 0 ? Math.abs((pAfter - pBefore) / pBefore) * 100 : 0;
    ctx.fillStyle = pErr < 1 ? "#22c55e" : "#eab308";
    ctx.fillText(`Δp/p = ${pErr.toFixed(2)}%`, 60, trackY + 82);
  };

  // ==========================================
  // RENDERER 9: HOOKE'S LAW SPRING (BÀI 33)
  // ==========================================
  const renderHooke = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    dt: number,
    running: boolean,
    p: Record<string, any>
  ) => {
    const s = simState.current;
    const l0Mm = p.initialLengthL0Mm ?? 100; // mm
    const k = p.springConstantKNm ?? 25.0; // N/m
    const appliedMassG = p.appliedMassG ?? 50; // g
    const g = 9.80;

    const targetDeflectionMm = ((appliedMassG / 1000) * g * 1000) / k; // mm
    const pxPerMm = 1.6;

    // Dampened oscillation towards equilibrium
    if (running) {
      const currentDeflectionMm = s.springY;
      const forceSpring = -k * (currentDeflectionMm / 1000);
      const forceGravity = (appliedMassG / 1000) * g;
      const netForce = forceGravity + forceSpring;
      const accel = netForce / (appliedMassG / 1000);

      s.springVy += accel * dt;
      s.springVy *= 0.94; // Heavy damping in air
      s.springY += (s.springVy * dt * 1000);

      if (Math.abs(s.springVy) < 0.001 && !s.cartRecorded) {
        s.cartRecorded = true;
        if (onAutoRecordTrial) {
          onAutoRecordTrial({
            param1: (appliedMassG / 1000) * g, // Lực đàn hồi F = P (N)
            param2: targetDeflectionMm / 1000, // Độ dãn Delta l (m)
            calculated1: k,
            calculated2: targetDeflectionMm,
          });
        }
      }
    } else {
      // Khi chưa chạy: lò xo ở trạng thái tự nhiên (chưa treo quả nặng)
      s.springY = 0;
      s.springVy = 0;
      s.cartRecorded = false;
    }

    const standX = w * 0.35;
    const topY = 60;
    const springRestLengthPx = l0Mm * pxPerMm;
    const currentExtPx = (s.springY) * pxPerMm;
    const springTotalLengthPx = springRestLengthPx + currentExtPx;

    // 1. Vertical Metric Ruler alongside spring
    const rulerX = standX + 70;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(rulerX, topY, 40, h - 100);
    ctx.strokeStyle = "#cbd5e1";
    ctx.strokeRect(rulerX, topY, 40, h - 100);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "8px 'JetBrains Mono', monospace";
    for (let mm = 0; mm <= 250; mm += 10) {
      const markY = topY + mm * pxPerMm;
      if (markY > h - 40) break;
      const is50 = mm % 50 === 0;
      ctx.beginPath();
      ctx.moveTo(rulerX, markY);
      ctx.lineTo(rulerX + (is50 ? 16 : 8), markY);
      ctx.stroke();
      if (is50) {
        ctx.fillText(`${mm}`, rulerX + 20, markY + 3);
      }
    }

    // 2. Stand support
    ctx.fillStyle = "#475569";
    ctx.fillRect(standX - 60, topY - 12, 120, 12);
    ctx.fillRect(standX - 10, topY - 12, 16, h - 80);

    // 3. Realistic Zig-zag Coil Spring
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(standX, topY);

    const coils = 16;
    const coilStep = springTotalLengthPx / coils;
    for (let i = 0; i < coils; i++) {
      const cy = topY + (i + 0.5) * coilStep;
      const cx = standX + (i % 2 === 0 ? 12 : -12);
      ctx.lineTo(cx, cy);
    }
    ctx.lineTo(standX, topY + springTotalLengthPx);
    ctx.stroke();

    // 4. Pointer needle horizontal
    const hookY = topY + springTotalLengthPx;
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(standX, hookY);
    ctx.lineTo(rulerX + 15, hookY);
    ctx.stroke();

    // 5. Slotted Weights (Quả nặng móc)
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(standX - 16, hookY, 32, 28);
    ctx.strokeStyle = "#78350f";
    ctx.strokeRect(standX - 16, hookY, 32, 28);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText(`${appliedMassG}g`, standX - 12, hookY + 18);

    // Telemetry Box
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "#334155";
    ctx.beginPath();
    ctx.roundRect(w - 240, 50, 220, 115, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("KẾT QUẢ ĐỊNH LUẬT HOOKE", w - 225, 70);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText(`Chiều dài l0:     ${l0Mm} mm`, w - 225, 92);
    ctx.fillText(`Độ dãn Δl:        ${targetDeflectionMm.toFixed(1)} mm`, w - 225, 112);
    ctx.fillText(`Lực đàn hồi F:    ${((appliedMassG / 1000) * g).toFixed(2)} N`, w - 225, 132);
    ctx.fillText(`Độ cứng k đo:     ${k.toFixed(1)} N/m`, w - 225, 152);
  };

  // ==========================================
  // RENDERER 10: FLUID PRESSURE & HYDRAULIC PRESS (BÀI 34)
  // ==========================================
  const renderFluidPressure = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    p: Record<string, any>
  ) => {
    const depthH = p.depthHCm ?? 15.0; // cm
    const liquid = p.liquidType ?? "water"; // water: 1000, oil: 800, brine: 1150
    const g = 9.80;

    let rho = 1000;
    let liquidColor = "rgba(14, 165, 233, 0.35)";
    if (liquid === "oil") {
      rho = 800;
      liquidColor = "rgba(234, 179, 8, 0.35)";
    } else if (liquid === "brine") {
      rho = 1150;
      liquidColor = "rgba(99, 102, 241, 0.4)";
    }

    const deltaPressurePa = rho * g * (depthH / 100);

    const tankX = 60;
    const tankY = 80;
    const tankW = 200;
    const tankH = 260;

    // Draw Liquid Tank
    ctx.fillStyle = liquidColor;
    ctx.fillRect(tankX, tankY + 20, tankW, tankH - 20);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.strokeRect(tankX, tankY, tankW, tankH);

    // Depth Ruler on tank
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "8px 'JetBrains Mono', monospace";
    for (let cm = 0; cm <= 30; cm += 5) {
      const my = tankY + 20 + (cm / 30) * (tankH - 20);
      ctx.beginPath();
      ctx.moveTo(tankX, my);
      ctx.lineTo(tankX + 10, my);
      ctx.stroke();
      ctx.fillText(`${cm}cm`, tankX + 14, my + 3);
    }

    // Membrane pressure probe
    const probeY = tankY + 20 + (depthH / 30) * (tankH - 20);
    const probeX = tankX + tankW / 2;

    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(probeX, tankY - 30);
    ctx.lineTo(probeX, probeY);
    ctx.stroke();

    // Probe capsule
    ctx.fillStyle = "#0284c7";
    ctx.beginPath();
    ctx.arc(probeX, probeY, 12, 0, Math.PI * 2);
    ctx.fill();

    // Connected U-Tube Manometer with colored indicator liquid
    const utubeX = tankX + tankW + 50;
    const utubeY = tankY + 40;

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(utubeX, utubeY);
    ctx.lineTo(utubeX, utubeY + 160);
    ctx.arc(utubeX + 30, utubeY + 160, 30, Math.PI, 0, true);
    ctx.lineTo(utubeX + 60, utubeY);
    ctx.stroke();

    // Colored liquid in U-Tube showing Delta h
    const diffPx = (depthH / 30) * 50;
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(utubeX, utubeY + 160 - 20 + diffPx / 2);
    ctx.arc(utubeX + 30, utubeY + 160, 30, Math.PI, 0, true);
    ctx.lineTo(utubeX + 60, utubeY + 160 - 20 - diffPx / 2);
    ctx.stroke();

    // Telemetry Box
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "#334155";
    ctx.beginPath();
    ctx.roundRect(w - 240, 50, 220, 120, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("ÁP SUẤT THỦY TĨNH THEO ĐỘ SÂU", w - 225, 70);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText(`Độ sâu h:      ${depthH.toFixed(1)} cm`, w - 225, 92);
    ctx.fillText(`Khối lượng ρ:  ${rho} kg/m³`, w - 225, 112);
    ctx.fillText(`Δp = ρgh:      ${deltaPressurePa.toFixed(1)} Pa`, w - 225, 132);
    ctx.fillText(`Độ lệch ống U: ${(depthH * 0.8).toFixed(1)} mm`, w - 225, 152);
  };

  // ==========================================
  // RENDERER 11: MODULE 0 SAFETY & CALIPER
  // ==========================================
  const renderSafetyMeasure = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    p: Record<string, any>
  ) => {
    // Interactive Vernier Caliper (Thước kẹp du xích 0.02mm)
    const measuredValMm = p.caliperMeasuredMm ?? 24.36;
    const startX = 60;
    const startY = 90;
    const scalePxPerMm = 8;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(30, 30, w - 60, h - 60);

    // Title banner
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("MÔ PHỎNG THƯỚC KẸP CƠ KHÍ VERNIER 0.02 mm (BÀI 3 SGK)", startX, 60);

    // Main Beam (Thân thước chính)
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(startX, startY, 450, 45);
    ctx.strokeStyle = "#334155";
    ctx.strokeRect(startX, startY, 450, 45);

    // Main Beam mm graduations
    ctx.strokeStyle = "#0f172a";
    ctx.fillStyle = "#0f172a";
    ctx.font = "8px 'JetBrains Mono', monospace";
    for (let mm = 0; mm <= 50; mm++) {
      const mx = startX + mm * scalePxPerMm;
      const isCm = mm % 10 === 0;
      const is5 = mm % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(mx, startY + 45);
      ctx.lineTo(mx, startY + 45 - (isCm ? 18 : is5 ? 12 : 7));
      ctx.stroke();
      if (isCm) {
        ctx.fillText(`${mm / 10}`, mx - 3, startY + 22);
      }
    }

    // Sliding Vernier (Du xích trượt)
    const vernierShiftX = measuredValMm * scalePxPerMm;
    const vX = startX + vernierShiftX;

    ctx.fillStyle = "rgba(226, 232, 240, 0.95)";
    ctx.fillRect(vX, startY + 20, 160, 55);
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(vX, startY + 20, 160, 55);

    // Vernier 50 divisions (0.02mm)
    ctx.fillStyle = "#0284c7";
    ctx.font = "7px 'JetBrains Mono', monospace";
    for (let vDiv = 0; vDiv <= 10; vDiv++) {
      const vx = vX + vDiv * (49 * scalePxPerMm / 10);
      ctx.beginPath();
      ctx.moveTo(vx, startY + 20);
      ctx.lineTo(vx, startY + 32);
      ctx.stroke();
      ctx.fillText(`${vDiv}`, vx - 2, startY + 44);
    }

    // Measurement display readout
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(w - 280, 70, 240, 110, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("KẾT QUẢ ĐỌC DU XÍCH", w - 265, 95);

    const intMm = Math.floor(measuredValMm);
    const fracMm = (measuredValMm - intMm).toFixed(2);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText(`Phần nguyên:    ${intMm} mm`, w - 265, 120);
    ctx.fillText(`Phần thập phân: +${fracMm} mm`, w - 265, 140);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 13px 'JetBrains Mono', monospace";
    ctx.fillText(`KẾT QUẢ: ${measuredValMm.toFixed(2)} mm`, w - 265, 165);
  };

  // ==========================================
  // RENDERER: FREE SANDBOX (THÍ NGHIỆM TƯƠNG TÁC TỰ DO)
  // ==========================================
  const renderFreeSandbox = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    dt: number,
    running: boolean,
    p: Record<string, any>
  ) => {
    const s = simState.current;
    const model = p.sandboxModel ?? "projectile";
    const g = p.sandboxGravity ?? 9.8;
    const mass = p.sandboxMass ?? 0.5;
    const planetName =
      p.sandboxPlanet === "moon"
        ? "🌕 Mặt Trăng"
        : p.sandboxPlanet === "mars"
        ? "🪐 Sao Hỏa"
        : p.sandboxPlanet === "custom"
        ? "🛠️ Trọng Lực Tùy Biến"
        : "🌍 Trái Đất";

    // Draw Scientific Laboratory Dark Canvas Grid
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, w, h);

    // Subtle coordinate grid
    ctx.strokeStyle = "rgba(51, 65, 85, 0.25)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Top Header HUD Bar
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(0, 0, w, 52);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 52);
    ctx.lineTo(w, 52);
    ctx.stroke();

    // Model title & planet tag
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 13px sans-serif";
    const modelTitles: Record<string, string> = {
      projectile: "MÔ HÌNH: CHUYỂN ĐỘNG NÉM TỰ DO",
      newton: "MÔ HÌNH: ĐỊNH LUẬT II NEWTON & MA SÁT",
      pendulum: "MÔ HÌNH: CON LẮC ĐƠN & BẢO TOÀN NĂNG LƯỢNG",
      spring: "MÔ HÌNH: DAO ĐỘNG LÒ XO & LỰC ĐÀN HỒI",
    };
    ctx.fillText(modelTitles[model] || "MÔ HÌNH SANDBOX TỰ DO", 20, 24);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    ctx.fillText(`Môi trường: ${planetName} (g = ${g.toFixed(2)} m/s²) • m = ${mass.toFixed(2)} kg`, 20, 42);

    // Energy Gauge Helper
    const drawEnergyGauge = (Wd: number, Wt: number) => {
      const Wtotal = Math.max(0.001, Wd + Wt);
      const ex = w - 260;
      const ey = 12;
      const ew = 240;
      const eh = 14;

      ctx.fillStyle = "rgba(30, 41, 59, 0.9)";
      ctx.fillRect(ex, ey, ew, eh);
      ctx.strokeStyle = "#475569";
      ctx.strokeRect(ex, ey, ew, eh);

      // Kinetic fraction (cyan)
      const kdRatio = Math.min(1, Math.max(0, Wd / Wtotal));
      ctx.fillStyle = "#06b6d4";
      ctx.fillRect(ex, ey, ew * kdRatio, eh);

      // Potential fraction (amber)
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(ex + ew * kdRatio, ey, ew * (1 - kdRatio), eh);

      // Energy text
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillText(
        `Wđ: ${Wd.toFixed(2)}J | Wt: ${Wt.toFixed(2)}J | W: ${(Wd + Wt).toFixed(2)}J`,
        ex,
        ey + eh + 14
      );
    };

    // ----------------------------------------------------
    // SUB-MODEL 1: PROJECTILE MOTION
    // ----------------------------------------------------
    if (model === "projectile") {
      const v0 = p.sandboxV0 ?? 12.0;
      const angleDeg = p.sandboxAngle ?? 45;
      const angleRad = (angleDeg * Math.PI) / 180;
      const h0 = p.sandboxHeight ?? 1.2;
      const dragK = p.sandboxAirResistance ?? 0.02;

      // Coordinate scaling
      const groundY = h - 70;
      const originX = 90;
      const ppm = 24; // pixels per meter (approx 1m = 24px)

      // Physics Integration (Euler-Cromer)
      if (running && !s.sandboxRecorded) {
        s.time += dt;
        const currentV = Math.sqrt(s.sandboxVx * s.sandboxVx + s.sandboxVy * s.sandboxVy);
        const dragFx = -dragK * currentV * s.sandboxVx;
        const dragFy = -dragK * currentV * s.sandboxVy;

        const ax = dragFx / mass;
        const ay = -g + dragFy / mass;

        s.sandboxVx += ax * dt;
        s.sandboxVy += ay * dt;

        s.sandboxX += s.sandboxVx * dt;
        s.sandboxY += s.sandboxVy * dt;

        // Record flight trail
        s.sandboxTrail.push({
          x: originX + s.sandboxX * ppm,
          y: groundY - s.sandboxY * ppm,
        });
        if (s.sandboxTrail.length > 250) s.sandboxTrail.shift();

        // Hit ground condition
        if (s.sandboxY <= 0) {
          s.sandboxY = 0;
          s.sandboxRecorded = true;
          if (soundEnabled) labAudio.playCollision();

          // Theoretical range without drag
          const theoRange =
            (v0 * Math.cos(angleRad) / g) *
            (v0 * Math.sin(angleRad) + Math.sqrt(Math.pow(v0 * Math.sin(angleRad), 2) + 2 * g * h0));

          if (onAutoRecordTrial) {
            onAutoRecordTrial({
              param1: angleDeg,
              param2: parseFloat(s.sandboxX.toFixed(2)),
              calculated1: parseFloat(s.time.toFixed(3)),
              calculated2: parseFloat(theoRange.toFixed(2)),
            });
          }
        }
      }

      const ballCanvasX = originX + s.sandboxX * ppm;
      const ballCanvasY = groundY - s.sandboxY * ppm;

      // Energy calculation
      const curV = Math.sqrt(s.sandboxVx * s.sandboxVx + s.sandboxVy * s.sandboxVy);
      const Wd = 0.5 * mass * curV * curV;
      const Wt = mass * g * Math.max(0, s.sandboxY);
      drawEnergyGauge(Wd, Wt);

      // 1. Draw Ground & Scale Ticks
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(w, groundY);
      ctx.stroke();

      // Distance markers every 5 meters
      ctx.fillStyle = "#64748b";
      ctx.font = "10px monospace";
      for (let m = 0; m <= 35; m += 5) {
        const tx = originX + m * ppm;
        if (tx < w) {
          ctx.beginPath();
          ctx.moveTo(tx, groundY);
          ctx.lineTo(tx, groundY + 8);
          ctx.stroke();
          ctx.fillText(`${m}m`, tx - 8, groundY + 22);
        }
      }

      // 2. Draw Launch Stand at Origin
      const standTopY = groundY - h0 * ppm;
      ctx.fillStyle = "#334155";
      ctx.fillRect(originX - 18, standTopY, 20, groundY - standTopY);
      ctx.strokeStyle = "#64748b";
      ctx.strokeRect(originX - 18, standTopY, 20, groundY - standTopY);

      // Cannon barrel
      ctx.save();
      ctx.translate(originX, standTopY);
      ctx.rotate(-angleRad);
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(0, -6, 28, 12);
      ctx.strokeStyle = "#38bdf8";
      ctx.strokeRect(0, -6, 28, 12);
      ctx.restore();

      // Height dimension label
      if (h0 > 0) {
        ctx.strokeStyle = "#38bdf8";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(originX - 24, standTopY);
        ctx.lineTo(originX - 24, groundY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "10px sans-serif";
        ctx.fillText(`H = ${h0.toFixed(1)}m`, originX - 68, (standTopY + groundY) / 2);
      }

      // 3. Draw Flight Trail
      if (s.sandboxTrail.length > 1) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(s.sandboxTrail[0].x, s.sandboxTrail[0].y);
        for (let i = 1; i < s.sandboxTrail.length; i++) {
          ctx.lineTo(s.sandboxTrail[i].x, s.sandboxTrail[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 4. Draw Projectile Object
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(ballCanvasX, ballCanvasY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glow effect
      ctx.fillStyle = "rgba(245, 158, 11, 0.3)";
      ctx.beginPath();
      ctx.arc(ballCanvasX, ballCanvasY, 15, 0, Math.PI * 2);
      ctx.fill();

      // 5. Draw Vectors (Velocity & Gravity)
      if (curV > 0.2) {
        drawVector(
          ctx,
          ballCanvasX,
          ballCanvasY,
          ballCanvasX + s.sandboxVx * 2.5,
          ballCanvasY - s.sandboxVy * 2.5,
          "#22c55e",
          "v"
        );
      }
      drawVector(ctx, ballCanvasX, ballCanvasY, ballCanvasX, ballCanvasY + g * 2.5, "#ef4444", "P=mg");

      // 6. Real-time Telemetry Card at Top Right (below HUD bar)
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(w - 290, 55, 270, 95, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("THÔNG SỐ ĐỘNG HỌC THỜI GIAN THỰC", w - 278, 75);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillText(`Tọa độ:  x = ${s.sandboxX.toFixed(2)} m | y = ${s.sandboxY.toFixed(2)} m`, w - 278, 95);
      ctx.fillText(`Vận tốc: v = ${curV.toFixed(2)} m/s (vx: ${s.sandboxVx.toFixed(1)}, vy: ${s.sandboxVy.toFixed(1)})`, w - 278, 115);
      ctx.fillText(`Thời gian bay: t = ${s.time.toFixed(3)} s`, w - 278, 135);
    }

    // ----------------------------------------------------
    // SUB-MODEL 2: NEWTON'S 2ND LAW & FRICTION
    // ----------------------------------------------------
    else if (model === "newton") {
      const forceF = p.sandboxForce ?? 4.0;
      const mu = p.sandboxFriction ?? 0.05;
      const trackY = h * 0.58;
      const trackX0 = 50;
      const trackX1 = w - 120;

      // Physics integration
      const fFriction = mu * mass * g;
      const netForce = Math.max(0, forceF - fFriction);
      const accel = netForce / mass;

      if (running && !s.sandboxRecorded) {
        s.time += dt;
        s.sandboxCartVx += accel * dt;
        s.sandboxCartX += s.sandboxCartVx * dt * 45;

        if (s.sandboxCartX >= trackX1 - 100) {
          s.sandboxCartX = trackX1 - 100;
          s.sandboxRecorded = true;
          if (soundEnabled) labAudio.playGateBeep(750, 0.1);

          if (onAutoRecordTrial) {
            onAutoRecordTrial({
              param1: forceF,
              param2: parseFloat(accel.toFixed(3)),
              calculated1: mass,
              calculated2: parseFloat(fFriction.toFixed(3)),
            });
          }
        }
      }

      const Wd = 0.5 * mass * (s.sandboxCartVx * s.sandboxCartVx);
      drawEnergyGauge(Wd, fFriction * ((s.sandboxCartX - trackX0) / 45));

      // Draw Air Track Rail
      ctx.fillStyle = "#334155";
      ctx.fillRect(trackX0, trackY, trackX1 - trackX0, 16);
      ctx.strokeStyle = "#64748b";
      ctx.strokeRect(trackX0, trackY, trackX1 - trackX0, 16);

      // Pulley at end
      ctx.fillStyle = "#0284c7";
      ctx.beginPath();
      ctx.arc(trackX1, trackY + 8, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.stroke();

      // Glider Cart
      const cartX = trackX0 + s.sandboxCartX;
      const cartY = trackY - 32;
      const cartW = 75;
      const cartH = 32;

      ctx.fillStyle = "#2563eb";
      ctx.fillRect(cartX, cartY, cartW, cartH);
      ctx.strokeStyle = "#60a5fa";
      ctx.strokeRect(cartX, cartY, cartW, cartH);

      // Wheels
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(cartX + 16, trackY, 5, 0, Math.PI * 2);
      ctx.arc(cartX + cartW - 16, trackY, 5, 0, Math.PI * 2);
      ctx.fill();

      // String to pulley & hanging mass
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cartX + cartW, cartY + 12);
      ctx.lineTo(trackX1, trackY + 8);
      ctx.lineTo(trackX1, trackY + 80 + (s.sandboxCartX * 0.4));
      ctx.stroke();

      // Hanging mass
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(trackX1 - 10, trackY + 80 + (s.sandboxCartX * 0.4), 20, 24);
      ctx.strokeStyle = "#fbbf24";
      ctx.strokeRect(trackX1 - 10, trackY + 80 + (s.sandboxCartX * 0.4), 20, 24);

      // Vectors on cart
      drawVector(ctx, cartX + cartW, cartY + 16, cartX + cartW + forceF * 10, cartY + 16, "#22c55e", `F = ${forceF}N`);
      if (fFriction > 0) {
        drawVector(ctx, cartX, cartY + 16, cartX - fFriction * 10, cartY + 16, "#ef4444", `F_ms = ${fFriction.toFixed(2)}N`);
      }

      // Telemetry Card
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(20, h - 160, 280, 95, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("ĐỘNG LỰC HỌC NEWTON THỜI GIAN THỰC", 32, h - 140);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillText(`Lực tác dụng: F = ${forceF.toFixed(1)} N | F_ms = ${fFriction.toFixed(2)} N`, 32, h - 120);
      ctx.fillText(`Gia tốc đo:   a = ${accel.toFixed(3)} m/s² (F_hl / m)`, 32, h - 100);
      ctx.fillText(`Vận tốc xe:   v = ${(s.sandboxCartVx).toFixed(2)} m/s | t = ${s.time.toFixed(3)} s`, 32, h - 80);
    }

    // ----------------------------------------------------
    // SUB-MODEL 3: SIMPLE PENDULUM
    // ----------------------------------------------------
    else if (model === "pendulum") {
      const lengthM = p.sandboxLength ?? 1.0;
      const dampingB = p.sandboxAirResistance ?? 0.02;
      const pivotX = w / 2;
      const pivotY = 110;
      const pixelLength = lengthM * 140;

      // Physics update: d²θ/dt² = -(g/L)*sin(θ) - b*dθ/dt
      if (running) {
        s.time += dt;
        const alpha = -(g / lengthM) * Math.sin(s.sandboxTheta) - dampingB * s.sandboxOmega;
        s.sandboxOmega += alpha * dt;
        s.sandboxTheta += s.sandboxOmega * dt;
      }

      const bobX = pivotX + pixelLength * Math.sin(s.sandboxTheta);
      const bobY = pivotY + pixelLength * Math.cos(s.sandboxTheta);

      // Energy calculation
      const bobV = s.sandboxOmega * lengthM;
      const Wd = 0.5 * mass * bobV * bobV;
      const deltaH = lengthM * (1 - Math.cos(s.sandboxTheta));
      const Wt = mass * g * deltaH;
      drawEnergyGauge(Wd, Wt);

      // Stand & Pivot
      ctx.fillStyle = "#475569";
      ctx.fillRect(pivotX - 60, pivotY - 14, 120, 14);
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#cbd5e1";
      ctx.fill();

      // String
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Bob
      ctx.fillStyle = "#06b6d4";
      ctx.beginPath();
      ctx.arc(bobX, bobY, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tension and Weight vectors
      drawVector(ctx, bobX, bobY, bobX - Math.sin(s.sandboxTheta) * 35, bobY - Math.cos(s.sandboxTheta) * 35, "#38bdf8", "T");
      drawVector(ctx, bobX, bobY, bobX, bobY + g * 3.5, "#ef4444", "P");

      // Theoretical Period
      const T0 = 2 * Math.PI * Math.sqrt(lengthM / g);

      // Telemetry Card
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(20, h - 160, 280, 95, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("DAO ĐỘNG CON LẮC THỜI GIAN THỰC", 32, h - 140);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillText(`Chu kỳ lý thuyết: T = ${T0.toFixed(3)} s`, 32, h - 120);
      ctx.fillText(`Góc lệch tức thời: θ = ${((s.sandboxTheta * 180) / Math.PI).toFixed(1)}°`, 32, h - 100);
      ctx.fillText(`Vận tốc con lắc:   v = ${Math.abs(bobV).toFixed(2)} m/s`, 32, h - 80);
    }

    // ----------------------------------------------------
    // SUB-MODEL 4: SPRING OSCILLATOR
    // ----------------------------------------------------
    else if (model === "spring") {
      const springK = p.sandboxSpringK ?? 50;
      const dampingGamma = p.sandboxAirResistance ?? 0.02;
      const mountX = w / 2;
      const mountY = 80;

      // Physics: my'' = -ky - gamma*v
      if (running) {
        s.time += dt;
        const springAccel = (-springK * s.sandboxSpringY - dampingGamma * s.sandboxSpringVy * 20) / mass;
        s.sandboxSpringVy += springAccel * dt;
        s.sandboxSpringY += s.sandboxSpringVy * dt;
      } else if (s.sandboxSpringY === 0) {
        // Initial displacement preview
        s.sandboxSpringY = 0.08;
      }

      const restLengthPx = 130;
      const stretchPx = s.sandboxSpringY * 350;
      const currentLengthPx = restLengthPx + stretchPx;
      const blockY = mountY + currentLengthPx;

      // Energy calculation
      const Wd = 0.5 * mass * (s.sandboxSpringVy * s.sandboxSpringVy);
      const Wt = 0.5 * springK * (s.sandboxSpringY * s.sandboxSpringY);
      drawEnergyGauge(Wd, Wt);

      // Mount base
      ctx.fillStyle = "#475569";
      ctx.fillRect(mountX - 50, mountY - 10, 100, 10);

      // Draw Coiled Spring
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(mountX, mountY);

      const coils = 12;
      const coilH = currentLengthPx / coils;
      for (let i = 0; i < coils; i++) {
        const yStart = mountY + i * coilH;
        const xOffset = (i % 2 === 0 ? 1 : -1) * 16;
        ctx.lineTo(mountX + xOffset, yStart + coilH * 0.5);
        ctx.lineTo(mountX, yStart + coilH);
      }
      ctx.stroke();

      // Hanging Mass Block
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(mountX - 25, blockY, 50, 40);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.strokeRect(mountX - 25, blockY, 50, 40);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(`${mass.toFixed(2)}kg`, mountX - 18, blockY + 24);

      // Rest position equilibrium line
      ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(mountX - 70, mountY + restLengthPx + 20);
      ctx.lineTo(mountX + 70, mountY + restLengthPx + 20);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#ef4444";
      ctx.font = "10px sans-serif";
      ctx.fillText("Vị trí cân bằng (x = 0)", mountX + 80, mountY + restLengthPx + 24);

      // Theoretical Period T = 2π√(m/k)
      const T0 = 2 * Math.PI * Math.sqrt(mass / springK);

      // Telemetry Card
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(20, h - 160, 280, 95, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("DAO ĐỘNG LÒ XO THỜI GIAN THỰC", 32, h - 140);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillText(`Chu kỳ riêng:     T = ${T0.toFixed(3)} s | f = ${(1 / T0).toFixed(2)} Hz`, 32, h - 120);
      ctx.fillText(`Li độ biến dạng:  x = ${(s.sandboxSpringY * 100).toFixed(1)} cm`, 32, h - 100);
      ctx.fillText(`Lực hồi phục:     F = ${(-springK * s.sandboxSpringY).toFixed(2)} N`, 32, h - 80);
    }
  };

  // ===================== DIGITAL REPORT (Phiếu thực hành số) =====================
  const renderDigitalReport = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;

    // --- Background gradient overlay ---
    const bgGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, w * 0.6);
    bgGrad.addColorStop(0, "rgba(6, 78, 59, 0.25)");
    bgGrad.addColorStop(1, "rgba(9, 13, 22, 0)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // --- Central icon: Clipboard / Report ---
    const iconX = cx;
    const iconY = cy - 80;

    // Clipboard body
    ctx.fillStyle = "#134e4a";
    ctx.strokeStyle = "#2dd4bf";
    ctx.lineWidth = 2;
    const cbW = 70, cbH = 90;
    const cbX = iconX - cbW / 2, cbY = iconY - cbH / 2;

    // Rounded rect
    const r = 8;
    ctx.beginPath();
    ctx.moveTo(cbX + r, cbY);
    ctx.lineTo(cbX + cbW - r, cbY);
    ctx.arcTo(cbX + cbW, cbY, cbX + cbW, cbY + r, r);
    ctx.lineTo(cbX + cbW, cbY + cbH - r);
    ctx.arcTo(cbX + cbW, cbY + cbH, cbX + cbW - r, cbY + cbH, r);
    ctx.lineTo(cbX + r, cbY + cbH);
    ctx.arcTo(cbX, cbY + cbH, cbX, cbY + cbH - r, r);
    ctx.lineTo(cbX, cbY + r);
    ctx.arcTo(cbX, cbY, cbX + r, cbY, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Clipboard clip tab
    ctx.fillStyle = "#0d9488";
    ctx.fillRect(iconX - 18, cbY - 8, 36, 16);
    ctx.strokeRect(iconX - 18, cbY - 8, 36, 16);

    // Lines on clipboard (simulating text lines)
    ctx.strokeStyle = "#5eead4";
    ctx.lineWidth = 1.5;
    const lineStartX = cbX + 12;
    const lineEndX = cbX + cbW - 12;
    for (let i = 0; i < 5; i++) {
      const ly = cbY + 28 + i * 12;
      ctx.beginPath();
      ctx.moveTo(lineStartX, ly);
      ctx.lineTo(lineEndX - (i === 4 ? 20 : 0), ly);
      ctx.stroke();
    }

    // Checkmark icon on bottom right
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cbX + cbW - 22, cbY + cbH - 20);
    ctx.lineTo(cbX + cbW - 14, cbY + cbH - 12);
    ctx.lineTo(cbX + cbW - 4, cbY + cbH - 28);
    ctx.stroke();
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";

    // --- Title text ---
    ctx.fillStyle = "#5eead4";
    ctx.font = "bold 18px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Phiếu thực hành số & AI chấm điểm", cx, cy + 30);

    // Subtitle
    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px 'Inter', sans-serif";
    ctx.fillText("Tính sai số • Lập báo cáo • AI đánh giá Rubric GDPT 2018", cx, cy + 55);

    // --- Instructions ---
    ctx.font = "12px 'Inter', sans-serif";
    const instructions = [
      "① Chọn một bài thí nghiệm bất kỳ → Đo số liệu → Lưu vào bảng",
      "② Nhấn nút  「 Phiếu báo cáo 」  trên thanh công cụ để mở biểu mẫu",
      "③ Điền thông tin → AI tự động tính sai số & chấm điểm GDPT 2018",
    ];

    ctx.fillStyle = "#64748b";
    instructions.forEach((text, i) => {
      ctx.fillText(text, cx, cy + 90 + i * 22);
    });

    // --- Animated pulse ring around icon ---
    const t = performance.now() / 1000;
    const pulseAlpha = 0.2 + 0.15 * Math.sin(t * 2.5);
    ctx.strokeStyle = `rgba(45, 212, 191, ${pulseAlpha})`;
    ctx.lineWidth = 2;
    const pulseR = 65 + 8 * Math.sin(t * 2);
    ctx.beginPath();
    ctx.arc(iconX, iconY, pulseR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.textAlign = "start";
  };

  const renderGenericLab = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = "#38bdf8";
    ctx.font = "14px sans-serif";
    ctx.fillText("Mô phỏng đang nạp tài nguyên...", w / 2 - 100, h / 2);
  };

  // Helper to draw vector with arrowhead
  const drawVector = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    label: string
  ) => {
    const headLen = 8;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    ctx.font = "bold 10px sans-serif";
    ctx.fillText(label, toX + 5, toY - 3);
  };

  // Helper to draw the standard MC964 digital timer apparatus on canvas
  const drawMC964Timer = (
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    timeSec: number,
    modeStr: string,
    active: boolean
  ) => {
    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx - 10, by - 10, 200, 105, 8);
    ctx.fill();
    ctx.stroke();

    // Device Header
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText("ĐỒNG HỒ ĐO THỜI GIAN HIỆN SỐ MC964", bx, by + 6);

    // Neon Green 7-Segment style LED Screen
    ctx.fillStyle = "#022c22";
    ctx.fillRect(bx, by + 16, 180, 42);
    ctx.strokeStyle = "#059669";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by + 16, 180, 42);

    ctx.fillStyle = active ? "#4ade80" : "#22c55e";
    ctx.font = "bold 24px 'Chakra Petch', 'JetBrains Mono', monospace";
    ctx.fillText(`${timeSec.toFixed(3)}`, bx + 16, by + 46);
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("s", bx + 145, by + 45);

    // Mode & Status LED
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "9px sans-serif";
    ctx.fillText(`CHẾ ĐỘ: ${modeStr}`, bx, by + 76);

    ctx.fillStyle = active ? "#22c55e" : "#64748b";
    ctx.beginPath();
    ctx.arc(bx + 165, by + 73, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  return (
    <div ref={containerRef} className="relative w-full h-[480px] sm:h-[540px] lg:h-[600px] rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950">
      <canvas
        ref={canvasRef}
        width={900}
        height={540}
        className="w-full h-full object-contain cursor-crosshair select-none"
      />

      {/* Floating 60 FPS & Apparatus Quick Indicator */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
        <span className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-sm text-[11px] font-mono text-cyan-400 border border-slate-700/60 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          60 FPS • Real-time Physics
        </span>
      </div>
    </div>
  );
};
