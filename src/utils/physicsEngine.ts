/**
 * Physics AI-Lab 10 Numerical Physics & Statistical Analysis Engine
 * Compliant with Vietnamese Physics Curriculum GDPT 2018 (Bài 3 SGK KNTT)
 */

export interface LinearRegressionResult {
  slope: number;       // a in y = ax + b
  intercept: number;   // b
  rSquared: number;    // R^2 goodness of fit
  r2: number;          // alias for rSquared
  pointsCount: number;
}

export function calculateLinearRegression(points: { x: number; y: number }[]): LinearRegressionResult {
  const n = points.length;
  if (n < 2) {
    return { slope: 0, intercept: 0, rSquared: 0, r2: 0, pointsCount: n };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
    sumY2 += p.y * p.y;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (Math.abs(denominator) < 1e-12) {
    return { slope: 0, intercept: sumY / n, rSquared: 0, r2: 0, pointsCount: n };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R^2
  const meanY = sumY / n;
  let ssTotal = 0;
  let ssRes = 0;

  for (const p of points) {
    const yPred = slope * p.x + intercept;
    ssTotal += Math.pow(p.y - meanY, 2);
    ssRes += Math.pow(p.y - yPred, 2);
  }

  const rSquared = ssTotal === 0 ? 1 : Math.max(0, 1 - ssRes / ssTotal);

  return {
    slope,
    intercept,
    rSquared,
    r2: rSquared,
    pointsCount: n,
  };
}

/**
 * Statistical Error Calculation according to Bài 3 SGK Vật lí 10
 */
export interface ErrorAnalysisResult {
  mean: number;                 // A_tb: Giá trị trung bình
  meanRandomError: number;     // delta_A_tb: Sai số ngẫu nhiên trung bình
  instrumentError: number;     // delta_A_dc: Sai số dụng cụ
  totalAbsoluteError: number;  // delta_A: Sai số tuyệt đối toàn phần
  relativeErrorPercent: number;// delta_A (%): Sai số tỉ đối
  formattedResult: string;     // A = A_tb ± delta_A
  validValuesCount: number;
}

export function analyzeMeasurementErrors(
  values: number[],
  instrumentError = 0.001
): ErrorAnalysisResult {
  const validVals = values.filter((v) => !isNaN(v) && v > 0);
  if (validVals.length === 0) {
    return {
      mean: 0,
      meanRandomError: 0,
      instrumentError,
      totalAbsoluteError: instrumentError,
      relativeErrorPercent: 0,
      formattedResult: "0.000 ± 0.001",
      validValuesCount: 0,
    };
  }

  // 1. Giá trị trung bình
  const sum = validVals.reduce((acc, curr) => acc + curr, 0);
  const mean = sum / validVals.length;

  // 2. Sai số ngẫu nhiên từng lần đo và trung bình
  const randomErrors = validVals.map((v) => Math.abs(mean - v));
  const meanRandomError =
    randomErrors.reduce((acc, curr) => acc + curr, 0) / validVals.length;

  // 3. Sai số tuyệt đối = Sai số ngẫu nhiên + Sai số dụng cụ
  const totalAbsoluteError = meanRandomError + instrumentError;

  // 4. Sai số tỉ đối = (delta_A / A_tb) * 100%
  const relativeErrorPercent = mean !== 0 ? (totalAbsoluteError / mean) * 100 : 0;

  // 5. Làm tròn và biểu diễn kết quả chuẩn SGK (thường 3-4 chữ số có nghĩa)
  let decimals = 3;
  if (mean >= 100) decimals = 1;
  else if (mean >= 10) decimals = 2;
  else if (mean >= 1) decimals = 3;
  else decimals = 4;

  const formattedResult = `${mean.toFixed(decimals)} ± ${totalAbsoluteError.toFixed(decimals)}`;

  return {
    mean,
    meanRandomError,
    instrumentError,
    totalAbsoluteError,
    relativeErrorPercent,
    formattedResult,
    validValuesCount: validVals.length,
  };
}

export function calculateStatisticalError(values: number[], instrumentError = 0.001) {
  const res = analyzeMeasurementErrors(values, instrumentError);
  return {
    mean: res.mean,
    randomError: res.meanRandomError,
    instrumentError: res.instrumentError,
    totalError: res.totalAbsoluteError,
    relativeErrorPercent: res.relativeErrorPercent,
    formattedResult: res.formattedResult,
  };
}

/**
 * Web Audio Beeper for Realistic Lab Hardware Sounds
 */
class LabAudioSynth {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public playGateBeep(frequency = 880, duration = 0.08) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio is non-blocking
    }
  }

  public playClick() {
    this.playGateBeep(1200, 0.03);
  }

  public playRelease() {
    this.playGateBeep(440, 0.12);
  }

  public playCollision() {
    this.playGateBeep(220, 0.15);
  }
}

export const labAudio = new LabAudioSynth();
