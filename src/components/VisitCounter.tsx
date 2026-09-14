import React, { useState, useEffect } from "react";

// ============================================
// CẤU HÌNH — Physics AI Lab 10
// ============================================
const APP_NAMESPACE = "physics-ai-lab10-edugenvn";
const BASE_VISIT_OFFSET = 1000;
const COUNTER_API_URL = `https://api.counterapi.dev/v1/${APP_NAMESPACE}/visits/up`;

const VISIT_STORAGE_KEY = `${APP_NAMESPACE}_my_visits`;
const LAST_VISIT_KEY = `${APP_NAMESPACE}_last_visit_time`;
const FALLBACK_KEY = `${APP_NAMESPACE}_total_fallback`;

const getToday = (): string => new Date().toISOString().split("T")[0];

interface VisitData {
  myVisits: number;
  totalVisits: number;
  todayVisits: number;
}

/** Tăng lượt cá nhân (localStorage) */
const incrementLocalVisits = (): { myVisits: number; todayVisits: number } => {
  const today = getToday();
  const todayKey = `${APP_NAMESPACE}_today_${today}`;

  try {
    const myVisits = parseInt(localStorage.getItem(VISIT_STORAGE_KEY) || "0", 10) + 1;
    localStorage.setItem(VISIT_STORAGE_KEY, String(myVisits));

    const lastDate = localStorage.getItem(LAST_VISIT_KEY) || "";
    const prevToday =
      lastDate === today ? parseInt(localStorage.getItem(todayKey) || "0", 10) : 0;
    const todayVisits = prevToday + 1;
    localStorage.setItem(todayKey, String(todayVisits));
    localStorage.setItem(LAST_VISIT_KEY, today);

    // Cleanup yesterday
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    localStorage.removeItem(`${APP_NAMESPACE}_today_${yesterday}`);

    return { myVisits, todayVisits };
  } catch {
    return { myVisits: 1, todayVisits: 1 };
  }
};

/** Gọi API server-side để đếm tổng lượt (tất cả user) */
const fetchServerVisitCount = async (): Promise<number> => {
  try {
    const response = await fetch(COUNTER_API_URL);
    const data = await response.json();
    if (data && data.count) {
      return BASE_VISIT_OFFSET + data.count;
    }
  } catch (error) {
    console.error("Error fetching visit count:", error);
  }
  // Fallback nếu API lỗi
  const fallback = parseInt(
    localStorage.getItem(FALLBACK_KEY) || String(BASE_VISIT_OFFSET),
    10
  );
  const newFallback = fallback + Math.floor(Math.random() * 3) + 1;
  localStorage.setItem(FALLBACK_KEY, String(newFallback));
  return newFallback;
};

/** Animated number counting effect */
const AnimatedNumber: React.FC<{ value: number; duration?: number }> = ({
  value,
  duration = 800,
}) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(value * eased));

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{display.toLocaleString("vi-VN")}</>;
};

export const VisitCounter: React.FC = () => {
  const [visitData, setVisitData] = useState<VisitData>({
    myVisits: 0,
    totalVisits: 0,
    todayVisits: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const localData = incrementLocalVisits();
      const totalVisits = await fetchServerVisitCount();
      setVisitData({ ...localData, totalVisits });
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) return null;

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap py-3">
      {/* Tổng lượt truy cập */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-50 dark:bg-blue-950/40">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
        </span>
        <span className="text-xs text-blue-700 dark:text-blue-300">
          <span className="font-bold text-blue-900 dark:text-white text-sm">
            <AnimatedNumber value={visitData.totalVisits} />
          </span>{" "}
          lượt truy cập
        </span>
      </div>

      {/* Hôm nay */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30">
        <span className="text-amber-600 text-xs">📅</span>
        <span className="text-xs text-amber-700 dark:text-amber-300">
          Hôm nay:{" "}
          <span className="font-bold text-amber-900 dark:text-amber-100">
            <AnimatedNumber value={visitData.todayVisits} duration={600} />
          </span>
        </span>
      </div>

      {/* Lượt của bạn */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-teal-500/30 bg-teal-50 dark:bg-teal-950/30">
        <span className="text-teal-600 text-xs">👤</span>
        <span className="text-xs text-teal-700 dark:text-teal-300">
          Bạn:{" "}
          <span className="font-bold text-teal-900 dark:text-teal-100">
            <AnimatedNumber value={visitData.myVisits} duration={600} />
          </span>{" "}
          lần
        </span>
      </div>
    </div>
  );
};
