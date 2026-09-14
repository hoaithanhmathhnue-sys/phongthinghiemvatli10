import React from "react";
import { LabId, MeasurementRecord } from "../types";
import { LAB_CATALOG, getLabColumnHeaders } from "../data/labCatalog";
import { 
  calculateStatisticalError, 
  calculateLinearRegression 
} from "../utils/physicsEngine";
import { 
  Table, 
  Download, 
  Trash2, 
  TrendingUp, 
  CheckCircle2,
  Plus
} from "lucide-react";

interface DataTableProps {
  labId: LabId;
  records: MeasurementRecord[];
  onAddRecord: () => void;
  onDeleteRecord: (id: string) => void;
  onClearRecords: () => void;
  instrumentError: number;
}

export const DataTable: React.FC<DataTableProps> = ({
  labId,
  records,
  onAddRecord,
  onDeleteRecord,
  onClearRecords,
  instrumentError,
}) => {
  const lab = LAB_CATALOG[labId];
  const colHeaders = lab?.columnHeaders || getLabColumnHeaders(labId);

  // Extract numeric data series for statistical error analysis
  const primaryValues = records.map((r) => r.param2);
  const stats = primaryValues.length > 0
    ? calculateStatisticalError(primaryValues, instrumentError)
    : null;

  // Extract (X, Y) pairs for regression
  const points = records.map((r) => ({
    x: r.calculated1 ?? r.param1,
    y: r.calculated2 ?? r.param2,
  }));
  const regression = points.length >= 2 ? calculateLinearRegression(points) : null;

  // CSV Export handler
  const handleExportCSV = () => {
    if (records.length === 0) return;
    const header = ["Lần đo", colHeaders[0], colHeaders[1], colHeaders[2] || "Cột 3", colHeaders[3] || "Cột 4", "Thời gian ghi"].join(",");
    const rows = records.map((r) =>
      [
        r.trialNumber,
        r.param1.toFixed(3),
        r.param2.toFixed(3),
        (r.calculated1 ?? 0).toFixed(3),
        (r.calculated2 ?? 0).toFixed(3),
        r.timestamp,
      ].join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `So_lieu_thi_nghiem_${labId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header with quick stats & actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-cyan-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            BẢNG THU THẬP & XỬ LÝ SỐ LIỆU THỰC NGHIỆM (BÀI 3 SGK)
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-add-manual-record"
            onClick={onAddRecord}
            className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm dòng</span>
          </button>

          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 disabled:opacity-40 text-xs font-medium flex items-center gap-1 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>

          <button
            id="btn-clear-table"
            onClick={onClearRecords}
            disabled={records.length === 0}
            className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa bảng</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-2.5 px-3 w-16 text-center">Lần đo</th>
              <th className="py-2.5 px-3">{colHeaders[0]}</th>
              <th className="py-2.5 px-3">{colHeaders[1]}</th>
              {colHeaders[2] && <th className="py-2.5 px-3">{colHeaders[2]}</th>}
              {colHeaders[3] && <th className="py-2.5 px-3">{colHeaders[3]}</th>}
              <th className="py-2.5 px-3 w-12 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                  Chưa có số liệu đo nào. Nhấn <strong>"Bắt Đầu"</strong> rồi <strong>"Lưu Vào Bảng Số Liệu"</strong> để ghi dữ liệu đo.
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-2 px-3 text-center font-bold text-slate-500">#{r.trialNumber}</td>
                  <td className="py-2 px-3 text-blue-600 dark:text-cyan-400 font-semibold">{r.param1.toFixed(3)}</td>
                  <td className="py-2 px-3 text-slate-800 dark:text-slate-200">{r.param2.toFixed(3)}</td>
                  {lab.columnHeaders[2] && (
                    <td className="py-2 px-3 text-teal-600 dark:text-teal-400">
                      {(r.calculated1 ?? 0).toFixed(3)}
                    </td>
                  )}
                  {lab.columnHeaders[3] && (
                    <td className="py-2 px-3 text-indigo-600 dark:text-indigo-400">
                      {(r.calculated2 ?? 0).toFixed(3)}
                    </td>
                  )}
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => onDeleteRecord(r.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                      title="Xóa dòng này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Statistical Error Synthesis (Theo quy tắc SGK Bài 3: mean, random err, instrument err, relative err) */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>KẾT QUẢ TỔNG HỢP SAI SỐ (BÀI 3 SGK KNTT)</span>
            </div>
            <div className="space-y-1.5 text-xs font-mono text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Giá trị trung bình x̄:</span>
                <span className="font-bold text-blue-600 dark:text-cyan-400">{stats.mean.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sai số ngẫu nhiên Δx̄:</span>
                <span>± {stats.randomError.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sai số dụng cụ Δxdc:</span>
                <span>± {stats.instrumentError.toFixed(4)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1">
                <span>Sai số tuyệt đối Δx:</span>
                <span className="font-bold text-rose-500">± {stats.totalError.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sai số tương đối δ (%):</span>
                <span className="font-bold text-teal-500">{stats.relativeErrorPercent.toFixed(2)} %</span>
              </div>
            </div>
          </div>

          {/* Standard Formatted Physics Expression: x = x̄ ± Δx */}
          <div className="flex flex-col justify-center items-center bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80">
            <div className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold mb-1">
              Biểu diễn kết quả đo chuẩn SGK:
            </div>
            <div className="text-sm sm:text-base font-extrabold text-blue-700 dark:text-cyan-400 font-mono text-center">
              x = {stats.formattedResult}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              (Độ chính xác tương đối: δ = {stats.relativeErrorPercent.toFixed(2)}%)
            </div>
          </div>
        </div>
      )}

      {/* Embedded Dynamic SVG Linear Regression Chart */}
      {regression && points.length >= 2 && (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <TrendingUp className="w-4 h-4 text-cyan-500" />
              <span>HỒI QUY TUYẾN TÍNH & ĐỒ THỊ THỰC NGHIỆM</span>
            </div>
            <div className="text-xs font-mono font-bold text-blue-600 dark:text-cyan-400">
              y = {regression.slope.toFixed(3)}x {regression.intercept >= 0 ? "+" : ""}{regression.intercept.toFixed(3)} (R² = {regression.r2.toFixed(4)})
            </div>
          </div>

          {/* Lightweight SVG Graph */}
          <div className="w-full h-40 bg-white dark:bg-slate-950 rounded-lg p-2 border border-slate-200 dark:border-slate-800 relative">
            <svg className="w-full h-full" viewBox="0 0 400 120">
              {/* Axes */}
              <line x1="40" y1="10" x2="40" y2="100" stroke="#64748b" strokeWidth="1.5" />
              <line x1="40" y1="100" x2="380" y2="100" stroke="#64748b" strokeWidth="1.5" />

              {/* Data points */}
              {points.map((pt, i) => {
                const minX = Math.min(...points.map((p) => p.x));
                const maxX = Math.max(...points.map((p) => p.x)) || 1;
                const minY = Math.min(...points.map((p) => p.y));
                const maxY = Math.max(...points.map((p) => p.y)) || 1;

                const cx = 50 + ((pt.x - minX) / (maxX - minX || 1)) * 310;
                const cy = 90 - ((pt.y - minY) / (maxY - minY || 1)) * 70;

                return (
                  <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r="4"
                    className="fill-cyan-400 stroke-slate-900"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Regression line */}
              <line
                x1="50"
                y1={90 - (0 / 1) * 70}
                x2="360"
                y2="25"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
