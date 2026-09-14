export type LabCategory = 
  | "chuong1" // Chương I. Mở Đầu (Bài 1–3)
  | "chuong2" // Chương II. Động Học (Bài 4–12)
  | "chuong3" // Chương III. Động Lực Học (Bài 13–19, 20–22)
  | "chuong4" // Chương IV. Năng Lượng, Công, Công Suất (Bài 23–27)
  | "chuong5" // Chương V. Động Lượng (Bài 28–30)
  | "chuong7" // Chương VII. Biến Dạng Vật Rắn & Áp Suất Chất Lỏng (Bài 33–34)
  | "sandbox" // Thí nghiệm Tương tác Tự do
  | "assessment"; // Phiếu thực hành số

export type LabId =
  | "safety_measure" // Module 0: An toàn & Dụng cụ MC964, Thước kẹp
  | "free_fall"      // Module 1: Đo gia tốc rơi tự do (Bài 10, 11)
  | "projectile"     // Module 1: Chuyển động ném ngang & xiên (Bài 12)
  | "newton2"        // Module 2: Định luật II Newton máng đệm khí (Bài 15)
  | "friction"       // Module 2: Khảo sát lực ma sát trượt (Bài 18)
  | "concurrent_force" // Module 3: Tổng hợp lực đồng quy (Bài 22)
  | "moment_rule"    // Module 3: Cân bằng đĩa quay Moment lực (Bài 21)
  | "pendulum_energy" // Module 4: Bảo toàn cơ năng con lắc (Bài 26)
  | "collision_momentum" // Module 4: Va chạm & Động lượng (Bài 30)
  | "hooke_law"      // Module 5: Định luật Hooke lò xo (Bài 33)
  | "fluid_pressure" // Module 5: Áp suất chất lỏng & Máy thủy lực (Bài 34)
  | "free_sandbox"   // Module Mới: Thí nghiệm Tương tác Tự do
  | "digital_report"; // Phiếu thực hành số (Bài 3)

export interface MeasurementRecord {
  id: string;
  trialNumber: number;
  trial?: number;
  param1: number; // e.g. s (m), or F (N), or m (kg)
  param2: number; // e.g. t (s), or delta_l (m), or a (m/s^2)
  calculated1?: number; // e.g. t^2 (s^2), or g (m/s^2), or k (N/m)
  calculated2?: number; // e.g. % error
  timestamp: string;
}

export interface SocraticPrompt {
  level: "Nhận biết" | "Thông hiểu" | "Vận dụng";
  question: string;
  hint: string;
  answer: string;
  contextCondition?: string;
}

export interface LabDefinition {
  id: LabId;
  category: LabCategory;
  title: string;
  subtitle: string;
  lessonSGK: string;
  badge: string;
  description: string;
  equipmentList: string[];
  principles: string[];
  formula: string;
  columnHeaders: string[];
  defaultParams: Record<string, any>;
  paramUnits: Record<string, string>;
  socraticQuestions: SocraticPrompt[];
  defaultQuestions: [string, string]; // 2 câu hỏi tự luận cho phiếu báo cáo
}

export interface StudentInfo {
  name: string;
  className: string;
  school: string;
  group: string;
  date: string;
}

export interface ErrorCategoryDetail {
  analysis: string; // Phân tích nguyên nhân tiềm ẩn
  mitigation: string; // Biện pháp sư phạm giảm thiểu sai số
}

export interface ErrorSourceAnalysis {
  systematicError: ErrorCategoryDetail; // Sai số hệ thống (thiết bị, dụng cụ, zero-offset, ma sát...)
  randomError: ErrorCategoryDetail;     // Sai số ngẫu nhiên (thao tác, góc nhìn parallax, phản xạ...)
  environmentalError: ErrorCategoryDetail; // Sai số môi trường (lực cản gió, rung lắc, nhiệt độ...)
}

export interface EvaluationReport {
  totalScore: number;
  level: string; // "Mức 1 - Chưa đạt" | "Mức 2 - Đạt" | "Mức 3 - Khá" | "Mức 4 - Tốt / Xuất sắc"
  gdptCompetencyLevel?: string; // Đánh giá chuẩn năng lực GDPT 2018
  dataAccuracyReview: string;
  errorCalculationReview: string;
  theoryQuestionsReview: string;
  errorSources?: ErrorSourceAnalysis; // Phân tích 3 nhóm nguyên nhân sai số & giải pháp
  strengths: string[];
  improvements: string[];
  teacherAdvice: string;
  feedback?: string;
  criteriaBreakdown?: {
    name: string;
    score: number;
    maxScore: number;
  }[];
  suggestions?: string[];
}

export type ReportEvaluation = EvaluationReport;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
  isSocraticHint?: boolean;
}
