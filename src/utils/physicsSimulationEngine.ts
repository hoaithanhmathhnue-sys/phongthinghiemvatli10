/**
 * physicsSimulationEngine.ts
 * Bộ sinh mã HTML5 mô phỏng phòng thí nghiệm vật lý ảo tương tác độc lập
 * Tuân thủ theo tiêu chuẩn SKILL-MO-PHONG (Standalone, Zero-dependency, Offline-ready)
 */

export interface SimConfigInput {
  title: string;
  topic?: string;
  subject?: string;
  grade?: string;
  formula?: string;
  description?: string;
  parametersText?: string;
  equipment?: string[];
  steps?: string[];
  suggestedLabId?: string;
  customHtml?: string;
}

/** Xác định loại mô phỏng từ tiêu đề hoặc mô tả */
export function detectSimulationType(topic: string = "", title: string = "", suggestedLabId: string = ""): "projectile" | "free_fall" | "newton2" | "pendulum" | "friction" | "generic" {
  const combined = `${topic} ${title} ${suggestedLabId}`.toLowerCase();
  
  if (suggestedLabId === "projectile" || combined.includes("ném xiên") || combined.includes("nem xien") || combined.includes("ném ngang") || combined.includes("nem ngang") || combined.includes("projectile")) {
    return "projectile";
  }
  if (suggestedLabId === "free_fall" || combined.includes("rơi tự do") || combined.includes("roi tu do") || combined.includes("gia tốc trọng trường") || combined.includes("free fall")) {
    return "free_fall";
  }
  if (suggestedLabId === "pendulum_energy" || combined.includes("con lắc") || combined.includes("con lac") || combined.includes("pendulum") || combined.includes("dao động")) {
    return "pendulum";
  }
  if (suggestedLabId === "newton2" || combined.includes("định luật 2") || combined.includes("newton") || combined.includes("xe trượt")) {
    return "newton2";
  }
  if (suggestedLabId === "friction" || combined.includes("ma sát") || combined.includes("ma sat") || combined.includes("friction")) {
    return "friction";
  }
  return "generic";
}

/**
 * Sinh mã nguồn HTML5 độc lập hoàn chỉnh cho mô phỏng trực quan tương tác
 */
export function generateInteractiveSimulationHtml(config: SimConfigInput): string {
  // Nếu AI đã sinh ra mã HTML hợp lệ và đầy đủ có canvas hoặc script
  if (config.customHtml && config.customHtml.includes("<canvas") && config.customHtml.includes("<script")) {
    return config.customHtml;
  }

  const simType = detectSimulationType(config.topic, config.title, config.suggestedLabId);

  if (simType === "projectile") {
    return generateProjectileSimulationHtml(config);
  } else if (simType === "free_fall") {
    return generateFreeFallSimulationHtml(config);
  } else if (simType === "pendulum") {
    return generatePendulumSimulationHtml(config);
  } else {
    return generateGeneralPhysicsSimulationHtml(config, simType);
  }
}

/**
 * Template Mô phỏng Chuyển động ném xiên / ném ngang trực quan chất lượng cao
 */
function generateProjectileSimulationHtml(config: SimConfigInput): string {
  const title = config.title || "Mô Phỏng Chuyển Động Ném Xiên";
  const desc = config.description || "Khảo sát quỹ đạo ném xiên của vật trong trường trọng lực, xác định tầm bay xa L và độ cao cực đại Hmax.";

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>⚡ ${title} - Phòng Thí Nghiệm Vật Lý Ảo</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --bg: #0b1329;
    --card: #131f3f;
    --card-hover: #1b2a54;
    --border: #223768;
    --primary: #38bdf8;
    --primary-hover: #0ea5e9;
    --accent: #a855f7;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
    --text: #f1f5f9;
    --text-muted: #94a3b8;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
  }
  /* Top Bar */
  .header {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    border-bottom: 1px solid var(--border);
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .badge-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #0284c7, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
  }
  .header h1 {
    font-size: 1.05rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.01em;
  }
  .header p {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  .header-actions {
    display: flex;
    gap: 8px;
  }
  .btn-action {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid var(--border);
    color: #e2e8f0;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
  }
  .btn-action:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: var(--primary);
    color: #fff;
  }

  /* Main Workspace */
  .workspace {
    display: grid;
    grid-template-columns: 310px 1fr;
    gap: 14px;
    padding: 14px;
    flex: 1;
    height: calc(100vh - 65px);
  }
  @media (max-width: 900px) {
    .workspace {
      grid-template-columns: 1fr;
      height: auto;
    }
  }

  /* Control Panel */
  .control-panel {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow-y: auto;
  }
  .panel-section-title {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--primary);
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }
  .formula-card {
    background: rgba(14, 165, 233, 0.08);
    border: 1px solid rgba(14, 165, 233, 0.25);
    border-radius: 10px;
    padding: 10px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 0.82rem;
    color: #7dd3fc;
    line-height: 1.5;
    text-align: center;
  }
  .slider-item {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    padding: 10px 12px;
  }
  .slider-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.78rem;
    margin-bottom: 6px;
  }
  .slider-header span:first-child {
    color: var(--text-muted);
  }
  .slider-header span:last-child {
    font-weight: 700;
    color: var(--primary);
    font-family: monospace;
  }
  input[type=range] {
    width: 100%;
    height: 6px;
    border-radius: 4px;
    background: #1e293b;
    accent-color: var(--primary);
    cursor: pointer;
    outline: none;
  }
  .btn-group {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 8px;
    margin-top: 4px;
  }
  .btn-main {
    padding: 10px;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .btn-play {
    background: linear-gradient(135deg, #0284c7, #2563eb);
    color: #fff;
    box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
  }
  .btn-play:hover {
    filter: brightness(1.1);
  }
  .btn-play.running {
    background: linear-gradient(135deg, #d97706, #b45309);
  }
  .btn-reset {
    background: #334155;
    color: #e2e8f0;
    border: 1px solid var(--border);
  }
  .btn-reset:hover {
    background: #475569;
    color: #fff;
  }

  /* Canvas Area */
  .canvas-container {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .canvas-hud {
    position: absolute;
    top: 12px;
    left: 14px;
    z-index: 10;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 8px 14px;
    display: flex;
    gap: 16px;
    font-size: 0.78rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }
  .hud-item {
    display: flex;
    flex-direction: column;
  }
  .hud-label {
    font-size: 0.68rem;
    color: var(--text-muted);
  }
  .hud-val {
    font-weight: 700;
    font-family: monospace;
    font-size: 0.92rem;
    color: #38bdf8;
  }
  .canvas-hud-right {
    position: absolute;
    top: 12px;
    right: 14px;
    z-index: 10;
    display: flex;
    gap: 8px;
  }
  .hud-tag {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.35);
    color: #34d399;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
  }
  canvas {
    width: 100%;
    height: 100%;
    display: block;
    cursor: crosshair;
  }

  /* Bottom Table */
  .table-section {
    max-height: 140px;
    overflow-y: auto;
    border-top: 1px solid var(--border);
    background: #0f172a;
    padding: 8px 12px;
    font-size: 0.75rem;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    text-align: center;
  }
  th, td {
    padding: 5px 8px;
    border: 1px solid #1e293b;
  }
  th {
    background: #1e293b;
    color: #94a3b8;
    position: sticky;
    top: 0;
  }
  tr:nth-child(even) {
    background: rgba(255, 255, 255, 0.02);
  }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <div class="badge-icon">🚀</div>
    <div>
      <h1>${title}</h1>
      <p>${desc}</p>
    </div>
  </div>
  <div class="header-actions">
    <button class="btn-action" onclick="toggleTrace()">✨ Bật/Tắt vết quỹ đạo</button>
    <button class="btn-action" onclick="toggleVectors()">📐 Vector vận tốc</button>
    <button class="btn-action" onclick="toggleFullscreen()">⛶ Toàn màn hình</button>
  </div>
</div>

<div class="workspace">
  <!-- Cột điều khiển -->
  <div class="control-panel">
    <div>
      <div class="panel-section-title">📘 Công thức quỹ đạo</div>
      <div class="formula-card">
        y = h₀ + x·tan(α) - [g·x²] / [2·v₀²·cos²(α)]<br>
        L = [v₀·cos(α) / g] · [v₀·sin(α) + √(v₀²·sin²(α) + 2gh₀)]
      </div>
    </div>

    <div>
      <div class="panel-section-title">⚙️ Thông số ném</div>
      
      <div class="slider-item" style="margin-bottom: 8px;">
        <div class="slider-header">
          <span>Góc ném (α):</span>
          <span id="txt-angle">45°</span>
        </div>
        <input type="range" id="param-angle" min="0" max="90" step="1" value="45" oninput="onParamChange()">
      </div>

      <div class="slider-item" style="margin-bottom: 8px;">
        <div class="slider-header">
          <span>Vận tốc ban đầu (v₀):</span>
          <span id="txt-v0">15.0 m/s</span>
        </div>
        <input type="range" id="param-v0" min="5" max="35" step="0.5" value="15" oninput="onParamChange()">
      </div>

      <div class="slider-item" style="margin-bottom: 8px;">
        <div class="slider-header">
          <span>Độ cao bắt đầu ném (h₀):</span>
          <span id="txt-h0">5.0 m</span>
        </div>
        <input type="range" id="param-h0" min="0" max="25" step="0.5" value="5" oninput="onParamChange()">
      </div>

      <div class="slider-item">
        <div class="slider-header">
          <span>Gia tốc trọng trường (g):</span>
          <span id="txt-g">9.8 m/s²</span>
        </div>
        <input type="range" id="param-g" min="1.6" max="15" step="0.1" value="9.8" oninput="onParamChange()">
      </div>
    </div>

    <div>
      <div class="btn-group">
        <button id="btn-play" class="btn-main btn-play" onclick="togglePlay()">
          <span>▶ Bắt đầu ném</span>
        </button>
        <button class="btn-main btn-reset" onclick="resetSim()">
          <span>↺ Đặt lại</span>
        </button>
      </div>
    </div>

    <div>
      <div class="panel-section-title">🎯 Giá trị lý thuyết tính trước</div>
      <div style="font-size: 0.78rem; line-height: 1.7; color: var(--text-muted); background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border);">
        <div>Tầm bay xa cực đại L: <b id="calc-L" style="color:#38bdf8">--</b> m</div>
        <div>Độ cao cực đại Hmax: <b id="calc-Hmax" style="color:#a855f7">--</b> m</div>
        <div>Thời gian bay lý thuyết: <b id="calc-tfly" style="color:#34d399">--</b> s</div>
      </div>
    </div>
  </div>

  <!-- Vùng Canvas hiển thị -->
  <div class="canvas-container">
    <div class="canvas-hud">
      <div class="hud-item">
        <span class="hud-label">Thời gian bay (t)</span>
        <span class="hud-val" id="hud-time">0.00 s</span>
      </div>
      <div class="hud-item">
        <span class="hud-label">Tọa độ x (m)</span>
        <span class="hud-val" id="hud-x">0.00 m</span>
      </div>
      <div class="hud-item">
        <span class="hud-label">Tọa độ y (m)</span>
        <span class="hud-val" id="hud-y">5.00 m</span>
      </div>
      <div class="hud-item">
        <span class="hud-label">Vận tốc v (m/s)</span>
        <span class="hud-val" id="hud-v">15.0 m/s</span>
      </div>
    </div>

    <div class="canvas-hud-right">
      <div class="hud-tag" id="status-tag">Sẵn sàng</div>
    </div>

    <canvas id="simCanvas"></canvas>

    <!-- Bảng số liệu thực nghiệm -->
    <div class="table-section">
      <div style="font-weight: 700; color: #94a3b8; margin-bottom: 4px; display: flex; justify-content: space-between;">
        <span>📊 BẢNG SỐ LIỆU THỰC NGHIỆM ĐÃ ĐO</span>
        <span style="font-size: 0.7rem; color: #64748b;">(Tự động ghi khi bi chạm đất)</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Lần</th>
            <th>Góc α (°)</th>
            <th>v₀ (m/s)</th>
            <th>h₀ (m)</th>
            <th>g (m/s²)</th>
            <th>Thời gian bay t (s)</th>
            <th>Tầm xa L (m)</th>
            <th>Hmax (m)</th>
          </tr>
        </thead>
        <tbody id="table-records">
          <!-- Ghi tự động -->
        </tbody>
      </table>
    </div>
  </div>
</div>

<script>
  const canvas = document.getElementById('simCanvas');
  const ctx = canvas.getContext('2d');

  // Parameters
  let alpha = 45; // độ
  let v0 = 15;    // m/s
  let h0 = 5;     // m
  let g = 9.8;    // m/s^2

  // Simulation State
  let isRunning = false;
  let t = 0; // seconds
  let showTrace = true;
  let showVectors = true;
  let trajectoryPoints = [];
  let recordCount = 0;

  // Scale & Viewport (meters to pixels)
  let scale = 14; // pixels per meter
  let originX = 60; // offset from left
  let originY = 0;  // ground level offset from bottom

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    originY = canvas.height - 40;
    // Tự động căn chỉnh tỉ lệ theo kích thước màn hình
    const maxPredictedL = 50;
    scale = Math.min((canvas.width - 120) / maxPredictedL, (canvas.height - 120) / 30);
    scale = Math.max(scale, 8);
    drawScene();
  }
  window.addEventListener('resize', resize);

  function calculateTheoretical() {
    const rad = (alpha * Math.PI) / 180;
    const vx = v0 * Math.cos(rad);
    const vy = v0 * Math.sin(rad);

    // Hmax = h0 + vy^2 / (2g)
    const Hmax = h0 + (vy * vy) / (2 * g);

    // Thời gian chạm đất: -0.5*g*t^2 + vy*t + h0 = 0
    // 0.5*g*t^2 - vy*t - h0 = 0
    const delta = vy * vy + 2 * g * h0;
    const tFly = (vy + Math.sqrt(delta)) / g;
    const L = vx * tFly;

    document.getElementById('calc-L').textContent = L.toFixed(2);
    document.getElementById('calc-Hmax').textContent = Hmax.toFixed(2);
    document.getElementById('calc-tfly').textContent = tFly.toFixed(2);

    return { L, Hmax, tFly, vx, vy };
  }

  function onParamChange() {
    alpha = parseFloat(document.getElementById('param-angle').value);
    v0 = parseFloat(document.getElementById('param-v0').value);
    h0 = parseFloat(document.getElementById('param-h0').value);
    g = parseFloat(document.getElementById('param-g').value);

    document.getElementById('txt-angle').textContent = alpha + '°';
    document.getElementById('txt-v0').textContent = v0.toFixed(1) + ' m/s';
    document.getElementById('txt-h0').textContent = h0.toFixed(1) + ' m';
    document.getElementById('txt-g').textContent = g.toFixed(1) + ' m/s²';

    calculateTheoretical();
    if (!isRunning) {
      t = 0;
      trajectoryPoints = [];
      document.getElementById('hud-time').textContent = '0.00 s';
      document.getElementById('hud-x').textContent = '0.00 m';
      document.getElementById('hud-y').textContent = h0.toFixed(2) + ' m';
      document.getElementById('hud-v').textContent = v0.toFixed(1) + ' m/s';
      drawScene();
    }
  }

  function togglePlay() {
    isRunning = !isRunning;
    const btn = document.getElementById('btn-play');
    const tag = document.getElementById('status-tag');
    if (isRunning) {
      btn.innerHTML = '<span>⏸ Tạm dừng</span>';
      btn.classList.add('running');
      tag.textContent = 'Đang chuyển động...';
      tag.style.color = '#38bdf8';
      tag.style.borderColor = '#0284c7';
      lastTimestamp = performance.now();
      requestAnimationFrame(loop);
    } else {
      btn.innerHTML = '<span>▶ Tiếp tục</span>';
      btn.classList.remove('running');
      tag.textContent = 'Đã tạm dừng';
      tag.style.color = '#f59e0b';
      tag.style.borderColor = '#d97706';
    }
  }

  function resetSim() {
    isRunning = false;
    t = 0;
    trajectoryPoints = [];
    const btn = document.getElementById('btn-play');
    btn.innerHTML = '<span>▶ Bắt đầu ném</span>';
    btn.classList.remove('running');
    const tag = document.getElementById('status-tag');
    tag.textContent = 'Sẵn sàng';
    tag.style.color = '#34d399';
    tag.style.borderColor = 'rgba(16, 185, 129, 0.35)';

    document.getElementById('hud-time').textContent = '0.00 s';
    document.getElementById('hud-x').textContent = '0.00 m';
    document.getElementById('hud-y').textContent = h0.toFixed(2) + ' m';
    document.getElementById('hud-v').textContent = v0.toFixed(1) + ' m/s';

    drawScene();
  }

  let lastTimestamp = 0;
  function loop(timestamp) {
    if (!isRunning) return;
    const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05); // max 50ms
    lastTimestamp = timestamp;

    t += dt;

    const rad = (alpha * Math.PI) / 180;
    const vx = v0 * Math.cos(rad);
    const vy = v0 * Math.sin(rad) - g * t;

    const x = vx * t;
    const y = h0 + (v0 * Math.sin(rad) * t) - (0.5 * g * t * t);
    const currentV = Math.sqrt(vx * vx + vy * vy);

    if (y <= 0) {
      // Chạm đất
      const { tFly, L, Hmax } = calculateTheoretical();
      t = tFly;
      const finalX = L;
      const finalY = 0;
      trajectoryPoints.push({ x: finalX, y: finalY });

      document.getElementById('hud-time').textContent = tFly.toFixed(2) + ' s';
      document.getElementById('hud-x').textContent = L.toFixed(2) + ' m';
      document.getElementById('hud-y').textContent = '0.00 m';
      document.getElementById('hud-v').textContent = Math.sqrt(vx * vx + (v0 * Math.sin(rad) - g * tFly) ** 2).toFixed(1) + ' m/s';

      isRunning = false;
      const btn = document.getElementById('btn-play');
      btn.innerHTML = '<span>↺ Ném lại</span>';
      btn.classList.remove('running');

      const tag = document.getElementById('status-tag');
      tag.textContent = 'Đã chạm đất (L = ' + L.toFixed(2) + 'm)';
      tag.style.color = '#10b981';

      // Lưu kết quả vào bảng
      recordResult(alpha, v0, h0, g, tFly, L, Hmax);
      drawScene(finalX, finalY, vx, -Math.abs(vy));
      return;
    }

    trajectoryPoints.push({ x, y });

    document.getElementById('hud-time').textContent = t.toFixed(2) + ' s';
    document.getElementById('hud-x').textContent = x.toFixed(2) + ' m';
    document.getElementById('hud-y').textContent = y.toFixed(2) + ' m';
    document.getElementById('hud-v').textContent = currentV.toFixed(1) + ' m/s';

    drawScene(x, y, vx, vy);
    requestAnimationFrame(loop);
  }

  function recordResult(a, v, h, grav, timeFly, range, maxH) {
    recordCount++;
    const tbody = document.getElementById('table-records');
    tr.innerHTML = '<td>#' + recordCount + '</td>' +
      '<td>' + a + '°</td>' +
      '<td>' + v.toFixed(1) + '</td>' +
      '<td>' + h.toFixed(1) + '</td>' +
      '<td>' + grav.toFixed(1) + '</td>' +
      '<td style="color:#38bdf8;font-weight:700">' + timeFly.toFixed(2) + '</td>' +
      '<td style="color:#34d399;font-weight:700">' + range.toFixed(2) + '</td>' +
      '<td style="color:#a855f7">' + maxH.toFixed(2) + '</td>';
    tbody.prepend(tr);
  }

  function drawScene(currentX = 0, currentY = h0, vx = 0, vy = 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Vẽ nền lưới tọa độ (Grid)
    ctx.strokeStyle = '#1a274c';
    ctx.lineWidth = 1;
    const gridStepM = 5; // 5m một vạch
    for (let m = 0; m * scale < canvas.width; m += gridStepM) {
      const px = originX + m * scale;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, originY);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = '10px monospace';
      ctx.fillText(m + 'm', px - 8, originY + 16);
    }
    for (let m = 0; m * scale < canvas.height; m += gridStepM) {
      const py = originY - m * scale;
      if (py < 20) break;
      ctx.beginPath();
      ctx.moveTo(originX, py);
      ctx.lineTo(canvas.width, py);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = '10px monospace';
      ctx.fillText(m + 'm', originX - 30, py + 4);
    }

    // 2. Trục tọa độ Ox, Oy
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    // Oy
    ctx.beginPath();
    ctx.moveTo(originX, 10);
    ctx.lineTo(originX, originY);
    ctx.stroke();
    // Mũi tên Oy
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(originX, 8);
    ctx.lineTo(originX - 4, 16);
    ctx.lineTo(originX + 4, 16);
    ctx.fill();
    ctx.fillText('y (m)', originX - 36, 18);

    // Ox (Mặt đất)
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(canvas.width - 20, originY);
    ctx.stroke();
    // Mũi tên Ox
    ctx.beginPath();
    ctx.moveTo(canvas.width - 15, originY);
    ctx.lineTo(canvas.width - 25, originY - 4);
    ctx.lineTo(canvas.width - 25, originY + 4);
    ctx.fill();
    ctx.fillText('x (m)', canvas.width - 25, originY + 20);

    // 3. Đài phóng / Bệ đỡ độ cao ban đầu h0
    if (h0 > 0) {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      const poleW = 16;
      ctx.fillRect(originX - poleW/2, originY - h0 * scale, poleW, h0 * scale);
      ctx.strokeRect(originX - poleW/2, originY - h0 * scale, poleW, h0 * scale);

      // Vạch chéo trang trí trên tháp
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.4)';
      ctx.beginPath();
      ctx.moveTo(originX - poleW/2, originY);
      ctx.lineTo(originX + poleW/2, originY - h0 * scale);
      ctx.stroke();
    }

    // 4. Quỹ đạo ném (Trajectory Trace)
    if (showTrace && trajectoryPoints.length > 1) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      trajectoryPoints.forEach((pt, i) => {
        const px = originX + pt.x * scale;
        const py = originY - pt.y * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. Nòng súng ném / Bệ xoay góc alpha (khi t == 0)
    const startPx = originX;
    const startPy = originY - h0 * scale;
    const rad = (alpha * Math.PI) / 180;
    const cannonLen = 28;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startPx, startPy);
    ctx.lineTo(startPx + Math.cos(rad) * cannonLen, startPy - Math.sin(rad) * cannonLen);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // 6. Vật thể ném (Viên bi phát sáng)
    const ballPx = originX + currentX * scale;
    const ballPy = originY - currentY * scale;

    // Hiệu ứng glow
    const grad = ctx.createRadialGradient(ballPx, ballPy, 2, ballPx, ballPy, 14);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#38bdf8');
    grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ballPx, ballPy, 14, 0, Math.PI * 2);
    ctx.fill();

    // Thân viên bi
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ballPx, ballPy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 7. Vector vận tốc (Velocity Vectors)
    if (showVectors && isRunning) {
      const vecScale = 2.0;
      // Vector v
      drawArrow(ballPx, ballPy, ballPx + vx * vecScale, ballPy - vy * vecScale, '#f59e0b', 'v');
      // Vector vx
      drawArrow(ballPx, ballPy, ballPx + vx * vecScale, ballPy, 'rgba(56, 189, 248, 0.7)', 'vx');
      // Vector vy
      drawArrow(ballPx, ballPy, ballPx, ballPy - vy * vecScale, 'rgba(168, 85, 247, 0.7)', 'vy');
    }
  }

  function drawArrow(fromX, fromY, toX, toY, color, label) {
    const headlen = 7;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.fill();

    if (label) {
      ctx.font = '10px sans-serif';
      ctx.fillText(label, toX + 5, toY - 5);
    }
  }

  function toggleTrace() {
    showTrace = !showTrace;
    drawScene();
  }

  function toggleVectors() {
    showVectors = !showVectors;
    drawScene();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => alert('Không thể bật toàn màn hình: ' + err.message));
    } else {
      document.exitFullscreen();
    }
  }

  // Khởi chạy ban đầu
  resize();
  onParamChange();
</script>
</body>
</html>`;
}

/**
 * Template Mô phỏng Rơi tự do & Gia tốc g
 */
function generateFreeFallSimulationHtml(config: SimConfigInput): string {
  const title = config.title || "Mô Phỏng Thí Nghiệm Rơi Tự Do";
  const desc = config.description || "Khảo sát chuyển động rơi tự do của viên bi dưới tác dụng của trọng lực và đo thời gian qua cổng quang điện.";

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>⚡ ${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --bg: #0b1329; --card: #131f3f; --border: #223768;
    --primary: #38bdf8; --success: #10b981; --text: #f1f5f9;
  }
  body {
    font-family: system-ui, sans-serif; background: var(--bg); color: var(--text);
    display: flex; flex-direction: column; min-height: 100vh;
  }
  .header {
    background: #0f172a; padding: 12px 20px; border-bottom: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
  }
  .workspace {
    display: grid; grid-template-columns: 300px 1fr; gap: 14px; padding: 14px; flex: 1;
  }
  .panel {
    background: var(--card); border: 1px solid var(--border); border-radius: 12px;
    padding: 16px; display: flex; flex-direction: column; gap: 14px;
  }
  .canvas-box {
    background: var(--card); border: 1px solid var(--border); border-radius: 12px;
    position: relative; overflow: hidden;
  }
  canvas { width: 100%; height: 100%; display: block; }
  .btn {
    padding: 10px; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;
    background: linear-gradient(135deg, #0284c7, #2563eb); color: #fff;
  }
  .slider-item { background: rgba(255,255,255,0.04); padding: 10px; border-radius: 8px; margin-bottom: 8px; }
  input[type=range] { width: 100%; accent-color: var(--primary); }
</style>
</head>
<body>
<div class="header">
  <div>
    <h2>⚡ ${title}</h2>
    <p style="font-size:0.75rem;color:#94a3b8">${desc}</p>
  </div>
  <button class="btn" style="padding:6px 14px" onclick="document.documentElement.requestFullscreen()">⛶ Toàn màn hình</button>
</div>
<div class="workspace">
  <div class="panel">
    <div style="background:rgba(2,132,199,0.1);padding:10px;border-radius:8px;font-family:monospace;font-size:0.8rem;color:#7dd3fc">
      s = ½·g·t² &hArr; g = 2s / t²<br>v = g·t = √(2gs)
    </div>
    <div class="slider-item">
      <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:6px">
        <span>Quãng đường rơi s:</span>
        <b id="val-s" style="color:var(--primary)">0.50 m</b>
      </div>
      <input type="range" id="param-s" min="0.2" max="1.2" step="0.05" value="0.5" oninput="updateS()">
    </div>
    <div class="slider-item">
      <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:6px">
        <span>Gia tốc g:</span>
        <b id="val-g" style="color:var(--primary)">9.80 m/s²</b>
      </div>
      <input type="range" id="param-g" min="8.5" max="11.0" step="0.05" value="9.8" oninput="updateS()">
    </div>
    <button class="btn" id="btn-drop" onclick="dropBall()">▶ Thả viên bi (Nút bấm)</button>
    <button class="btn" style="background:#334155" onclick="resetBall()">↺ Đặt lại vị trí</button>
    <div style="background:#0f172a;padding:10px;border-radius:8px;font-size:0.8rem;line-height:1.6">
      <div>Thời gian đo MC964: <b id="timer-val" style="color:#38bdf8">0.000 s</b></div>
      <div>Vận tốc chạm cổng F: <b id="v-val" style="color:#34d399">0.00 m/s</b></div>
      <div>g tính từ thực nghiệm: <b id="g-calc" style="color:#a855f7">--</b></div>
    </div>
  </div>
  <div class="canvas-box">
    <canvas id="simCanvas"></canvas>
  </div>
</div>
<script>
  const canvas = document.getElementById('simCanvas');
  const ctx = canvas.getContext('2d');
  let s = 0.5;
  let g = 9.8;
  let y = 0;
  let isDropping = false;
  let t = 0;
  let tTotal = 0;

  function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    draw();
  }
  window.addEventListener('resize', resize);

  function updateS() {
    s = parseFloat(document.getElementById('param-s').value);
    g = parseFloat(document.getElementById('param-g').value);
    document.getElementById('val-s').textContent = s.toFixed(2) + ' m';
    document.getElementById('val-g').textContent = g.toFixed(2) + ' m/s²';
    resetBall();
  }

  function dropBall() {
    if (isDropping) return;
    isDropping = true;
    t = 0;
    tTotal = Math.sqrt((2 * s) / g);
    lastT = performance.now();
    requestAnimationFrame(loop);
  }

  function resetBall() {
    isDropping = false;
    y = 0;
    t = 0;
    document.getElementById('timer-val').textContent = '0.000 s';
    document.getElementById('v-val').textContent = '0.00 m/s';
    draw();
  }

  let lastT = 0;
  function loop(now) {
    if (!isDropping) return;
    const dt = (now - lastT) / 1000;
    lastT = now;
    t += dt;
    if (t >= tTotal) {
      t = tTotal;
      y = s;
      isDropping = false;
      const v = g * t;
      const gMeasured = (2 * s) / (t * t);
      document.getElementById('timer-val').textContent = t.toFixed(3) + ' s';
      document.getElementById('v-val').textContent = v.toFixed(2) + ' m/s';
      document.getElementById('g-calc').textContent = gMeasured.toFixed(2) + ' m/s²';
      draw();
      return;
    }
    y = 0.5 * g * t * t;
    document.getElementById('timer-val').textContent = t.toFixed(3) + ' s';
    draw();
    requestAnimationFrame(loop);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const startY = 80;
    const scalePx = (canvas.height - 160) / 1.2;
    const colX = canvas.width / 2;

    // Trụ kim loại
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(colX - 8, startY - 20, 16, canvas.height - 100);

    // Cổng E (trên)
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(colX - 30, startY, 60, 8);
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.fillText('Cổng E (s = 0)', colX + 38, startY + 6);

    // Cổng F (dưới)
    const gateFy = startY + s * scalePx;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(colX - 30, gateFy, 60, 8);
    ctx.fillStyle = '#fff';
    ctx.fillText('Cổng F (s = ' + s.toFixed(2) + 'm)', colX + 38, gateFy + 6);

    // Viên bi
    const ballY = startY + y * scalePx;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(colX, ballY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  }

  resize();
</script>
</body>
</html>`;
}

/**
 * Template Mô phỏng Con lắc đơn / Con lắc vật lý
 */
function generatePendulumSimulationHtml(config: SimConfigInput): string {
  const title = config.title || "Mô Phỏng Dao Động Con Lắc Đơn";
  const desc = config.description || "Khảo sát dao động điều hòa của con lắc đơn, định luật bảo toàn cơ năng và chu kỳ T.";

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>⚡ ${title}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: system-ui, sans-serif; background: #0b1329; color: #f1f5f9; min-height: 100vh; display: flex; flex-direction: column; }
  .header { background:#0f172a; padding:12px 20px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #223768; }
  .workspace { display:grid; grid-template-columns:280px 1fr; gap:14px; padding:14px; flex:1; }
  .panel { background:#131f3f; border:1px solid #223768; border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:12px; }
  .canvas-box { background:#131f3f; border:1px solid #223768; border-radius:12px; overflow:hidden; }
  canvas { width:100%; height:100%; display:block; }
  .btn { padding:10px; border:none; border-radius:8px; font-weight:700; cursor:pointer; background:#0284c7; color:#fff; }
</style>
</head>
<body>
<div class="header">
  <div><h3>⚡ ${title}</h3><p style="font-size:0.75rem;color:#94a3b8">${desc}</p></div>
  <button class="btn" onclick="document.documentElement.requestFullscreen()">⛶ Toàn màn hình</button>
</div>
<div class="workspace">
  <div class="panel">
    <div style="background:rgba(2,132,199,0.1);padding:8px;border-radius:8px;font-size:0.8rem;color:#7dd3fc">
      T = 2π√(l/g)<br>W = Wđ + Wt = const
    </div>
    <div>
      <label style="font-size:0.8rem">Chiều dài l: <b id="val-l" style="color:#38bdf8">1.0 m</b></label>
      <input type="range" id="param-l" min="0.5" max="2.0" step="0.1" value="1.0" style="width:100%" oninput="updateParams()">
    </div>
    <div>
      <label style="font-size:0.8rem">Góc lệch ban đầu α₀: <b id="val-a" style="color:#38bdf8">30°</b></label>
      <input type="range" id="param-a" min="5" max="60" step="1" value="30" style="width:100%" oninput="updateParams()">
    </div>
    <button class="btn" onclick="toggle()">▶ Bắt đầu / Dừng</button>
    <button class="btn" style="background:#334155" onclick="reset()">↺ Đặt lại</button>
    <div style="font-size:0.8rem;line-height:1.6;background:#0f172a;padding:8px;border-radius:8px">
      <div>Chu kỳ T: <b id="txt-T" style="color:#34d399">--</b> s</div>
      <div>Góc lệch hiện tại α: <b id="txt-cur-a" style="color:#38bdf8">--</b></div>
    </div>
  </div>
  <div class="canvas-box">
    <canvas id="simCanvas"></canvas>
  </div>
</div>
<script>
  const canvas = document.getElementById('simCanvas');
  const ctx = canvas.getContext('2d');
  let l = 1.0, alpha0 = 30, g = 9.8;
  let angle = (30 * Math.PI) / 180;
  let angleV = 0;
  let running = false;

  function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    draw();
  }
  window.addEventListener('resize', resize);

  function updateParams() {
    l = parseFloat(document.getElementById('param-l').value);
    alpha0 = parseFloat(document.getElementById('param-a').value);
    document.getElementById('val-l').textContent = l.toFixed(1) + ' m';
    document.getElementById('val-a').textContent = alpha0 + '°';
    const T = 2 * Math.PI * Math.sqrt(l / g);
    document.getElementById('txt-T').textContent = T.toFixed(2);
    reset();
  }

  function toggle() {
    running = !running;
    if (running) { lastTime = performance.now(); requestAnimationFrame(loop); }
  }

  function reset() {
    running = false;
    angle = (alpha0 * Math.PI) / 180;
    angleV = 0;
    draw();
  }

  let lastTime = 0;
  function loop(now) {
    if (!running) return;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    // Con lắc phi tuyến: alpha'' = -(g/l) * sin(alpha)
    const angleA = -(g / l) * Math.sin(angle);
    angleV += angleA * dt;
    angle += angleV * dt;

    document.getElementById('txt-cur-a').textContent = ((angle * 180) / Math.PI).toFixed(1) + '°';
    draw();
    requestAnimationFrame(loop);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const pivotX = canvas.width / 2;
    const pivotY = 70;
    const scalePx = 180;
    const bobX = pivotX + Math.sin(angle) * (l * scalePx);
    const bobY = pivotY + Math.cos(angle) * (l * scalePx);

    // Giá treo
    ctx.fillStyle = '#475569';
    ctx.fillRect(pivotX - 40, pivotY - 8, 80, 8);

    // Dây treo
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();

    // Quả nặng
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(bobX, bobY, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  }

  resize();
  updateParams();
</script>
</body>
</html>`;
}

/**
 * Template Mô phỏng Vật lý Tổng quát linh hoạt cho các chủ đề khác
 */
function generateGeneralPhysicsSimulationHtml(config: SimConfigInput, _type: string): string {
  const title = config.title || "Phòng Thí Nghiệm Vật Lý Ảo Tương Tác";
  const desc = config.description || "Mô phỏng quy trình thí nghiệm thực hành vật lý trực quan, hỗ trợ điều chỉnh thông số và quan sát đồ thị chuyển động.";
  const formula = config.formula || "F = m \\cdot a; \\quad v = v_0 + a \\cdot t";

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>⚡ ${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; background: #0b1329; color: #f1f5f9; min-height: 100vh; display: flex; flex-direction: column; }
  .header { background: #0f172a; padding: 12px 20px; border-bottom: 1px solid #223768; display: flex; justify-content: space-between; align-items: center; }
  .workspace { display: grid; grid-template-columns: 290px 1fr; gap: 14px; padding: 14px; flex: 1; }
  .panel { background: #131f3f; border: 1px solid #223768; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
  .canvas-box { background: #131f3f; border: 1px solid #223768; border-radius: 12px; overflow: hidden; position: relative; }
  canvas { width: 100%; height: 100%; display: block; }
  .btn { padding: 10px; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; background: #0284c7; color: #fff; }
  .btn-reset { background: #334155; }
</style>
</head>
<body>
<div class="header">
  <div>
    <h2>⚡ ${title}</h2>
    <p style="font-size:0.75rem;color:#94a3b8">${desc}</p>
  </div>
  <button class="btn" onclick="document.documentElement.requestFullscreen()">⛶ Toàn màn hình</button>
</div>
<div class="workspace">
  <div class="panel">
    <div style="background:rgba(2,132,199,0.1);padding:10px;border-radius:8px;font-family:monospace;font-size:0.8rem;color:#7dd3fc">
      ${formula}
    </div>
    <div>
      <label style="font-size:0.8rem">Vận tốc ban đầu v₀: <b id="val-v0" style="color:#38bdf8">5 m/s</b></label>
      <input type="range" id="param-v0" min="1" max="20" step="1" value="5" style="width:100%" oninput="update()">
    </div>
    <div>
      <label style="font-size:0.8rem">Gia tốc a: <b id="val-a" style="color:#38bdf8">2 m/s²</b></label>
      <input type="range" id="param-a" min="-5" max="5" step="0.5" value="2" style="width:100%" oninput="update()">
    </div>
    <button class="btn" onclick="toggle()">▶ Bắt đầu / Tạm dừng</button>
    <button class="btn btn-reset" onclick="reset()">↺ Đặt lại</button>
    <div style="background:#0f172a;padding:10px;border-radius:8px;font-size:0.8rem;line-height:1.6">
      <div>Thời gian t: <b id="txt-t" style="color:#38bdf8">0.00 s</b></div>
      <div>Quãng đường s: <b id="txt-s" style="color:#34d399">0.00 m</b></div>
      <div>Vận tốc tức thời v: <b id="txt-v" style="color:#a855f7">5.00 m/s</b></div>
    </div>
  </div>
  <div class="canvas-box">
    <canvas id="simCanvas"></canvas>
  </div>
</div>
<script>
  const canvas = document.getElementById('simCanvas');
  const ctx = canvas.getContext('2d');
  let v0 = 5, a = 2, t = 0, running = false;
  let posX = 40;

  function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    draw();
  }
  window.addEventListener('resize', resize);

  function update() {
    v0 = parseFloat(document.getElementById('param-v0').value);
    a = parseFloat(document.getElementById('param-a').value);
    document.getElementById('val-v0').textContent = v0 + ' m/s';
    document.getElementById('val-a').textContent = a + ' m/s²';
    reset();
  }

  function toggle() {
    running = !running;
    if (running) { lastTime = performance.now(); requestAnimationFrame(loop); }
  }

  function reset() {
    running = false;
    t = 0;
    posX = 40;
    document.getElementById('txt-t').textContent = '0.00 s';
    document.getElementById('txt-s').textContent = '0.00 m';
    document.getElementById('txt-v').textContent = v0.toFixed(2) + ' m/s';
    draw();
  }

  let lastTime = 0;
  function loop(now) {
    if (!running) return;
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    t += dt;
    const s = v0 * t + 0.5 * a * t * t;
    const v = v0 + a * t;
    posX = 40 + s * 15;
    if (posX > canvas.width - 60 || posX < 20) {
      running = false;
      return;
    }
    document.getElementById('txt-t').textContent = t.toFixed(2) + ' s';
    document.getElementById('txt-s').textContent = Math.max(0, s).toFixed(2) + ' m';
    document.getElementById('txt-v').textContent = v.toFixed(2) + ' m/s';
    draw();
    requestAnimationFrame(loop);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const trackY = canvas.height / 2 + 50;

    // Đường ray
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(20, trackY);
    ctx.lineTo(canvas.width - 20, trackY);
    ctx.stroke();

    // Vật chuyển động (xe thí nghiệm)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(posX, trackY - 24, 48, 24);
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(posX, trackY - 24, 48, 24);

    // Bánh xe
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(posX + 10, trackY, 6, 0, Math.PI * 2);
    ctx.arc(posX + 38, trackY, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  resize();
</script>
</body>
</html>`;
}
