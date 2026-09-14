import React, { useState } from "react";
import { LabId, MeasurementRecord, EvaluationReport } from "../types";
import { MathRenderer } from "./MathRenderer";
import { LAB_CATALOG, getLabColumnHeaders } from "../data/labCatalog";
import { calculateStatisticalError } from "../utils/physicsEngine";
import { 
  X, 
  Printer, 
  Sparkles, 
  Award, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Loader2,
  Cpu,
  User,
  Wind,
  ShieldCheck,
  Lightbulb,
  CheckCircle2
} from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLabId: LabId;
  records: MeasurementRecord[];
  instrumentError: number;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  currentLabId,
  records,
  instrumentError,
}) => {
  const lab = LAB_CATALOG[currentLabId];
  const colHeaders = lab?.columnHeaders || getLabColumnHeaders(currentLabId);

  // Student info form state
  const [studentName, setStudentName] = useState("Nguyễn Văn A");
  const [studentClass, setStudentClass] = useState("10A1");
  const [studentSchool, setStudentSchool] = useState("Trường THPT Chuyên Sư Phạm");
  const [theoryAnswer1, setTheoryAnswer1] = useState(
    "Đồ thị thực nghiệm và các lần đo cho thấy mối quan hệ toán học phù hợp với lý thuyết trong sách giáo khoa."
  );
  const [theoryAnswer2, setTheoryAnswer2] = useState(
    "Khi triệt tiêu ma sát và lực cản, sai số giảm đi rõ rệt, kết quả tiến gần đến giá trị chuẩn quốc tế."
  );
  const [studentComments, setStudentComments] = useState(
    "Qua bài thực hành, em nhận thấy các lần đo có độ lặp lại cao. Sai số có thể xuất phát từ độ trễ đóng ngắt của thiết bị điện tử, sai số góc nhìn parallax khi đọc thước đo chia vạch mm và ảnh hưởng của lực cản không khí trong phòng học."
  );

  // AI Evaluation state
  const [isGrading, setIsGrading] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationReport | null>(null);

  if (!isOpen) return null;

  // Statistical calculations for report
  const primaryValues = records.map((r) => r.param2);
  const stats = primaryValues.length > 0
    ? calculateStatisticalError(primaryValues, instrumentError)
    : null;

  // AI Grading Trigger
  const handleAIGrade = async () => {
    setIsGrading(true);
    try {
      const res = await fetch("/api/gemini/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportData: {
            labId: currentLabId,
            labTitle: lab?.title || "Thí nghiệm Vật lí 10",
            lessonSGK: lab?.lessonSGK || "Chương trình GDPT 2018",
            formula: lab?.formula || "",
            studentInfo: {
              name: studentName,
              className: studentClass,
              school: studentSchool,
            },
            dataRecordsCount: records.length,
            records: records.map((r) => ({
              trial: r.trialNumber,
              param1: r.param1,
              param2: r.param2,
              calculated1: r.calculated1,
              calculated2: r.calculated2,
            })),
            statsResult: stats,
            defaultQuestions: lab?.defaultQuestions || [],
            theoryAnswers: [theoryAnswer1, theoryAnswer2],
            studentErrorAssessment: studentComments,
          },
        }),
      });

      const data = await res.json();
      if (data.result) {
        setEvaluation(data.result);
      } else if (data.evaluation) {
        setEvaluation(data.evaluation);
      }
    } catch (err) {
      console.error("AI Grading failed:", err);
    } finally {
      setIsGrading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              BÁO CÁO KẾT QUẢ THỰC HÀNH VẬT LÍ 10 (SỐ HÓA)
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Phiếu</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content (Official Scientific Report Layout) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-xs sm:text-sm">
          {/* Institution & Title */}
          <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              BỘ GIÁO DỤC VÀ ĐÀO TẠO • CHƯƠNG TRÌNH GDPT 2018
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-blue-700 dark:text-cyan-400 mt-1 uppercase">
              BÁO CÁO THỰC HÀNH: {lab?.title || "THÍ NGHIỆM VẬT LÍ"}
            </h2>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              {lab?.lessonSGK} — SÁCH GIÁO KHOA KẾT NỐI TRI THỨC VỚI CUỘC SỐNG
            </div>
          </div>

          {/* Student Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Họ và tên học sinh:
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Lớp:
              </label>
              <input
                type="text"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Trường THPT:
              </label>
              <input
                type="text"
                value={studentSchool}
                onChange={(e) => setStudentSchool(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
              />
            </div>
          </div>

          {/* Section 1: Mục đích & Cơ sở lý thuyết */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider text-blue-600 dark:text-cyan-400">
              I. MỤC ĐÍCH THÍ NGHIỆM VÀ CƠ SỞ LÝ THUYẾT
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {lab?.description}
            </p>
            <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-xs">
              <span className="text-slate-500 font-sans font-semibold">Công thức toán học áp dụng: </span>
              <MathRenderer content={lab?.formula || ""} className="inline text-blue-600 font-bold" />
            </div>
          </div>

          {/* Section 2: Bảng số liệu thực nghiệm */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider text-blue-600 dark:text-cyan-400">
              II. BẢNG SỐ LIỆU THỰC NGHIỆM ({records.length} LẦN ĐO)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="py-2 px-3">Lần đo</th>
                    <th className="py-2 px-3">{colHeaders[0]}</th>
                    <th className="py-2 px-3">{colHeaders[1]}</th>
                    {colHeaders[2] && <th className="py-2 px-3">{colHeaders[2]}</th>}
                    {colHeaders[3] && <th className="py-2 px-3">{colHeaders[3]}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  {records.length > 0 ? (
                    records.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                        <td className="py-1.5 px-3">#{r.trialNumber}</td>
                        <td className="py-1.5 px-3">{r.param1.toFixed(3)}</td>
                        <td className="py-1.5 px-3">{r.param2.toFixed(3)}</td>
                        {colHeaders[2] && (
                          <td className="py-1.5 px-3">{(r.calculated1 ?? 0).toFixed(3)}</td>
                        )}
                        {colHeaders[3] && (
                          <td className="py-1.5 px-3">{(r.calculated2 ?? 0).toFixed(3)}</td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                        Chưa có số liệu thực nghiệm. Hãy thực hiện ít nhất 3 lần đo trên Canvas trước khi lập báo cáo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Xử lý số liệu và tính sai số (Bài 3 SGK) */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider text-blue-600 dark:text-cyan-400">
              III. XỬ LÝ SỐ LIỆU VÀ TÍNH TOÁN SAI SỐ (THEO BÀI 3 SGK KẾT NỐI TRI THỨC)
            </h4>
            {stats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs">
                <div className="space-y-1">
                  <div>Giá trị trung bình Ā: <strong className="text-slate-900 dark:text-white">{stats.mean.toFixed(4)}</strong></div>
                  <div>Sai số ngẫu nhiên trung bình ΔĀ: <strong className="text-slate-900 dark:text-white">± {stats.randomError.toFixed(4)}</strong></div>
                  <div>Sai số dụng cụ ΔAdc: <strong className="text-slate-900 dark:text-white">± {stats.instrumentError.toFixed(4)}</strong></div>
                </div>
                <div className="space-y-1">
                  <div>Sai số tuyệt đối toàn phần ΔA: <strong className="text-slate-900 dark:text-white">± {stats.totalError.toFixed(4)}</strong></div>
                  <div>Sai số tương đối δA: <strong className="text-amber-600 dark:text-amber-400">{stats.relativeErrorPercent.toFixed(2)} %</strong></div>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-700 text-blue-600 dark:text-cyan-400 font-bold text-sm">
                    Biểu diễn kết quả: A = {stats.formattedResult}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                Cần tối thiểu 1 lần đo để hệ thống tự động tổng hợp số liệu sai số.
              </div>
            )}
          </div>

          {/* Section 4: Câu hỏi tự luận lý thuyết & Nhận xét của học sinh */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider text-blue-600 dark:text-cyan-400">
              IV. CÂU HỎI THẢO LUẬN & PHÂN TÍCH HIỆN TƯỢNG
            </h4>

            {lab?.defaultQuestions && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block text-xs">
                    1. {lab.defaultQuestions[0]}
                  </label>
                  <textarea
                    rows={2}
                    value={theoryAnswer1}
                    onChange={(e) => setTheoryAnswer1(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs leading-relaxed focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block text-xs">
                    2. {lab.defaultQuestions[1]}
                  </label>
                  <textarea
                    rows={2}
                    value={theoryAnswer2}
                    onChange={(e) => setTheoryAnswer2(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs leading-relaxed focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block text-xs">
                3. Nhận xét của học sinh về kết quả đo và dự đoán nguyên nhân gây ra sai số:
              </label>
              <textarea
                rows={3}
                value={studentComments}
                onChange={(e) => setStudentComments(e.target.value)}
                placeholder="Nhập nhận xét về kết quả đo, các nguyên nhân tiềm ẩn gây sai số và phương án khắc phục..."
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs leading-relaxed focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Section 5: Đánh giá & Chấm điểm tự động bởi AI Sư Phạm (GDPT 2018) */}
          <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>V. AI CHẤM ĐIỂM & PHÂN TÍCH NGUYÊN NHÂN SAI SỐ (GDPT 2018)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Phân tích 3 nguồn sai số (Hệ thống, Ngẫu nhiên, Môi trường) & giải pháp theo chuẩn năng lực vật lí
                </p>
              </div>
              <button
                onClick={handleAIGrade}
                disabled={isGrading || records.length === 0}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all hover:scale-105"
              >
                {isGrading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI Đang Phân Tích & Chấm Điểm...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>Chấm Điểm & Phân Tích Sai Số Bằng AI</span>
                  </>
                )}
              </button>
            </div>

            {evaluation && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/70 dark:from-slate-850 dark:to-slate-900 border border-blue-200 dark:border-blue-900/60 space-y-5 shadow-inner">
                {/* Score & Rubric Level Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-200 dark:border-slate-800 pb-3.5">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                      <span>{evaluation.gdptCompetencyLevel || "ĐÁNH GIÁ CHUẨN NĂNG LỰC GDPT 2018"}</span>
                    </div>
                    <div className="text-2xl font-black text-blue-700 dark:text-cyan-400 mt-0.5">
                      Tổng Điểm: {evaluation.totalScore.toFixed(1)} / 10.0
                    </div>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm">
                    {evaluation.level}
                  </div>
                </div>

                {/* Section: Reviews for Data Accuracy and Error Calculation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                      <span>Độ chính xác số liệu & Dãy đo:</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                      <MathRenderer content={evaluation.dataAccuracyReview} />
                    </p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Tính toán & Quy tắc làm tròn sai số:</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                      <MathRenderer content={evaluation.errorCalculationReview} />
                    </p>
                  </div>
                </div>

                {/* CRITICAL UPGRADE: Tri-panel Detailed Error Analysis & Mitigations */}
                {evaluation.errorSources && (
                  <div className="space-y-2.5">
                    <div className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>PHÂN TÍCH NGUYÊN NHÂN TIỀM ẨN GÂY RA SAI SỐ & BIỆN PHÁP KHẮC PHỤC:</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {/* 1. Systematic Error Card */}
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                          <Cpu className="w-4 h-4" />
                          <span>1. Sai số hệ thống (Thiết bị)</span>
                        </div>
                        <div className="text-[11px] leading-relaxed">
                          <strong>Nguyên nhân:</strong> <MathRenderer content={evaluation.errorSources.systematicError.analysis} />
                        </div>
                        <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-300">
                          <strong>Giải pháp:</strong> <MathRenderer content={evaluation.errorSources.systematicError.mitigation} />
                        </div>
                      </div>

                      {/* 2. Random Error Card */}
                      <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-950 dark:text-blue-200 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400">
                          <User className="w-4 h-4" />
                          <span>2. Sai số ngẫu nhiên (Thao tác)</span>
                        </div>
                        <div className="text-[11px] leading-relaxed">
                          <strong>Nguyên nhân:</strong> <MathRenderer content={evaluation.errorSources.randomError.analysis} />
                        </div>
                        <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-blue-500/20 text-[11px] text-blue-900 dark:text-blue-300">
                          <strong>Giải pháp:</strong> <MathRenderer content={evaluation.errorSources.randomError.mitigation} />
                        </div>
                      </div>

                      {/* 3. Environmental Error Card */}
                      <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-950 dark:text-teal-200 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-teal-700 dark:text-teal-400">
                          <Wind className="w-4 h-4" />
                          <span>3. Sai số môi trường (Bên ngoài)</span>
                        </div>
                        <div className="text-[11px] leading-relaxed">
                          <strong>Nguyên nhân:</strong> <MathRenderer content={evaluation.errorSources.environmentalError.analysis} />
                        </div>
                        <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-teal-500/20 text-[11px] text-teal-900 dark:text-teal-300">
                          <strong>Giải pháp:</strong> <MathRenderer content={evaluation.errorSources.environmentalError.mitigation} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Theory questions review */}
                {evaluation.theoryQuestionsReview && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      Nhận xét phần trả lời câu hỏi lý thuyết:
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                      <MathRenderer content={evaluation.theoryQuestionsReview} />
                    </p>
                  </div>
                )}

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {evaluation.strengths && evaluation.strengths.length > 0 && (
                    <div className="p-3 bg-teal-500/10 rounded-xl border border-teal-500/20 space-y-1">
                      <div className="font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Ưu điểm nổi bật:</span>
                      </div>
                      <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-0.5 text-[11px]">
                        {evaluation.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {evaluation.improvements && evaluation.improvements.length > 0 && (
                    <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 space-y-1">
                      <div className="font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Điểm cần hoàn thiện:</span>
                      </div>
                      <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-0.5 text-[11px]">
                        {evaluation.improvements.map((imp, i) => (
                          <li key={i}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Teacher's Pedagogical Advice */}
                {evaluation.teacherAdvice && (
                  <div className="p-3.5 bg-blue-600/10 rounded-xl border border-blue-600/30 text-xs space-y-1">
                    <div className="font-bold text-blue-700 dark:text-cyan-400">
                      Lời dặn dò của Giảng viên Sư phạm:
                    </div>
                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed italic text-[11px]">
                      "{evaluation.teacherAdvice}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
