import { LabDefinition, LabId } from "../types";

export const DEFAULT_COLUMN_HEADERS: Record<LabId, string[]> = {
  safety_measure: ["Lần đo", "Thước chính (mm)", "Du xích (mm)", "Tổng kết quả (mm)"],
  free_fall: ["Quãng đường s (m)", "Thời gian t (s)", "t² (s²)", "g đo (m/s²)"],
  projectile: ["Góc ném α (°)", "Vận tốc đầu v0 (m/s)", "Tầm xa L (m)", "Thời gian bay t (s)"],
  newton2: ["Lực kéo F = mg (N)", "Gia tốc a đo (m/s²)", "a lý thuyết (m/s²)", "Sai lệch (%)"],
  friction: ["Áp lực N = P (N)", "Lực ma sát Fms (N)", "F ma sát nghỉ max (N)", "Hệ số ma sát μ"],
  concurrent_force: ["Lực F1 (N)", "Lực F2 (N)", "Góc hợp α (°)", "Hợp lực Fhl (N)"],
  moment_rule: ["Lực F1 (N)", "Cánh tay đòn d1 (cm)", "Lực F2 (N)", "Cánh tay đòn d2 (cm)"],
  pendulum_energy: ["Chiều dài l (m)", "Góc lệch θ0 (°)", "Động năng Wđ (J)", "Thế năng Wt (J)"],
  collision_momentum: ["Động lượng trước (kg·m/s)", "Động lượng sau (kg·m/s)", "Độ lệch Δp", "Sai lệch (%)"],
  hooke_law: ["Trọng lượng P = F (N)", "Độ dãn Δl (m)", "Độ cứng k (N/m)", "Độ dãn mm"],
  fluid_pressure: ["Độ sâu h (cm)", "Khối lượng riêng ρ (kg/m³)", "Áp suất Δp (Pa)", "Độ lệch ống U (mm)"],
  free_sandbox: ["Biến số đầu vào X", "Đại lượng đo Y", "Vận tốc / Tọa độ", "Năng lượng / Lực"],
  digital_report: ["Lần đo", "Giá trị x", "Sai số Δx", "Kết quả chuẩn"],
};

export function getLabColumnHeaders(labId?: LabId | string): string[] {
  if (labId && (labId as LabId) in DEFAULT_COLUMN_HEADERS) {
    return DEFAULT_COLUMN_HEADERS[labId as LabId];
  }
  return ["Thông số 1", "Thông số 2", "Đại lượng tính 1", "Đại lượng tính 2"];
}

export const LAB_CATALOG: Record<LabId, LabDefinition> = {
  safety_measure: {
    id: "safety_measure",
    category: "module0",
    title: "An Toàn & Kỹ Thuật Đo Lường Phòng Lab",
    subtitle: "Bài 2 & 3: Quy tắc an toàn, đồng hồ MC964 & thước kẹp du xích Vernier",
    lessonSGK: "Bài 2, 3 SGK Vật lí 10 (KNTT)",
    badge: "Module 0 • Nền tảng thực nghiệm",
    description: "Khảo sát nguyên tắc an toàn điện, quang, cơ học trong phòng thí nghiệm. Rèn luyện kỹ năng đọc dụng cụ đo chuẩn xác: đồng hồ hiện số MC964 với các chế độ cổng quang điện và thước cặp cơ khí Vernier 0.02 mm.",
    equipmentList: [
      "Bộ nguồn xoay chiều/một chiều 0-12V an toàn",
      "Đồng hồ đo thời gian hiện số MC964 (độ phân giải 0.001 s)",
      "Cổng quang điện hồng ngoại E & F",
      "Thước kẹp cơ khí Vernier (ĐCNN 0.02 mm)",
      "Hệ thống biển cảnh báo an toàn điện & cơ khí",
    ],
    principles: [
      "Quy tắc an toàn khi thao tác với nguồn điện và thiết bị rơi nhanh",
      "Cách thiết lập đồng hồ MC964: Chế độ MODE A (thời gian chắn cổng A), MODE A<->B (thời gian chuyển động giữa cổng A và B)",
      "Nguyên tắc đọc du xích thước cặp: Giá trị đo = Vạch milimet trên thước chính + (Số thứ tự vạch trùng × 0.02 mm)",
    ],
    formula: "A = \\bar{A} \\pm \\Delta A; \\quad \\delta A = \\frac{\\Delta A}{\\bar{A}} \\times 100\\%",
    columnHeaders: DEFAULT_COLUMN_HEADERS.safety_measure,
    defaultParams: {
      mc964Mode: "A_B",
      caliperMeasuredMm: 24.36,
      safetyQuizDone: false,
    },
    paramUnits: {
      caliperMeasuredMm: "mm",
    },
    socraticQuestions: [
      {
        level: "Nhận biết",
        question: "Đồng hồ MC964 khi đặt ở chế độ A<->B sẽ bắt đầu tính giờ khi nào và dừng tính giờ khi nào?",
        hint: "Quan sát tín hiệu ngắt tia hồng ngoại ở cổng quang điện E và F.",
        answer: "Đồng hồ bắt đầu đếm khi mép trước của vật chắn tia hồng ngoại ở cổng E và ngắt dừng đếm khi mép trước của vật chắn tia hồng ngoại ở cổng F.",
      },
      {
        level: "Thông hiểu",
        question: "Tại sao sai số dụng cụ thông thường được lấy bằng một nửa hoặc một độ chia nhỏ nhất của dụng cụ đo?",
        hint: "Xét độ phân giải của mắt người khi đọc vạch chia trên thước mm.",
        answer: "Bởi vì vị trí kim chỉ hoặc mép vật có thể nằm giữa 2 vạch chia liên tiếp, mắt người chỉ phân biệt được trong phạm vi nửa hoặc cả khoảng cách vạch.",
      },
      {
        level: "Vận dụng",
        question: "Khi đo đường kính trong của một ống nghiệm thủy tinh hình trụ, ta dùng phần nào của thước kẹp?",
        hint: "Thước kẹp có 3 bộ phận đo: mỏ đo ngoài, mỏ đo trong và đuôi đo sâu.",
        answer: "Ta sử dụng hai mỏ kẹp phía trên (mỏ đo trong) áp sát vào thành trong của ống nghiệm để đọc số đo đường kính trong.",
      },
    ],
    defaultQuestions: [
      "Nêu các nguyên nhân chính gây ra sai số ngẫu nhiên trong thí nghiệm cơ học và biện pháp khắc phục?",
      "Trình bày cách ghi kết quả đo theo đúng quy tắc chữ số có nghĩa khi đo thời gian bằng đồng hồ MC964?",
    ],
  },

  free_fall: {
    id: "free_fall",
    category: "module1",
    title: "Thực Hành Đo Gia Tốc Rơi Tự Do",
    subtitle: "Bài 10 & 11: Cột trụ thẳng đứng, nam châm điện & 2 cổng quang E - F",
    lessonSGK: "Bài 10, 11 SGK Vật lí 10 (KNTT)",
    badge: "Module 1 • Động học",
    description: "Khảo sát chuyển động rơi tự do của viên bi thép dưới tác dụng của trọng lực. Đo thời gian rơi giữa hai cổng quang E và F ở các khoảng cách s khác nhau. Vẽ đồ thị s - t² và xác định gia tốc rơi tự do g từ hệ số góc đường hồi quy.",
    equipmentList: [
      "Trụ thẳng đứng có giá đỡ và thước milimet 1000 mm",
      "Nam châm điện giữ và thả vật bằng nút bấm công tắc",
      "Viên bi thép mạ crôm đường kính 20 mm",
      "Cổng quang điện E (cố định ở vị trí trên) và cổng F (di chuyển được)",
      "Đồng hồ hiện số MC964 chế độ A<->B",
      "Hộp đón bi có mút xốp đệm",
    ],
    principles: [
      "Rơi tự do là chuyển động thẳng nhanh dần đều không vận tốc đầu: s = 0.5 * g * t²",
      "Từ s = 0.5 * g * t² suy ra g = 2s / t²",
      "Đồ thị s theo t² là đường thẳng qua gốc tọa độ có hệ số góc k = g / 2",
      "So sánh chuyển động trong chân không (g = 9.80 m/s²) và trong không khí có lực cản Fc = -k * v",
    ],
    formula: "s = \\frac{1}{2}gt^2 \\implies g = \\frac{2s}{t^2}; \\quad a_{\\text{đồ thị}} = 2 \\times \\text{slope}",
    columnHeaders: DEFAULT_COLUMN_HEADERS.free_fall,
    defaultParams: {
      distanceS: 0.50, // m
      airResistance: false, // true = có cản
      dragCoeff: 0.04,
      ballMassG: 50, // g
    },
    paramUnits: {
      distanceS: "m",
      dragCoeff: "N·s/m",
      ballMassG: "g",
    },
    socraticQuestions: [
      {
        level: "Nhận biết",
        question: "Khi tăng quãng đường s giữa 2 cổng quang, thời gian rơi t thay đổi như thế nào?",
        hint: "Xem công thức t = sqrt(2s/g).",
        answer: "Thời gian rơi t tăng tỉ lệ với căn bậc hai của quãng đường s.",
      },
      {
        level: "Thông hiểu",
        question: "Tại sao ta lại vẽ đồ thị s theo t² chứ không phải s theo t?",
        hint: "Mối liên hệ giữa dạng đồ thị và phương pháp khớp đường thẳng bình phương tối thiểu.",
        answer: "Đồ thị s theo t là nhánh parabol khó xác định chính xác gia tốc, trong khi đồ thị s theo t² là đường thẳng y = (g/2)x giúp dễ dàng tính g từ độ dốc của đường thẳng.",
      },
      {
        level: "Vận dụng",
        question: "Khi bật chế độ 'Có lực cản không khí', giá trị g tính được từ 2s/t² thay đổi như thế nào so với 9.8 m/s²? Giải thích?",
        hint: "Lực cản ngược chiều chuyển động làm giảm gia tốc tổng hợp a = g - F_c/m.",
        answer: "Thời gian rơi sẽ lâu hơn, dẫn đến g_tn = 2s/t² nhỏ hơn 9.8 m/s². Lực cản không khí triệt tiêu một phần trọng lực, làm gia tốc rơi thực tế nhỏ hơn g chân không.",
      },
    ],
    defaultQuestions: [
      "Từ đồ thị s - t² thu được, hãy giải thích cách tính gia tốc g và tính sai số tỉ đối so với g chuẩn = 9.8 m/s²?",
      "Để giảm thiểu sai số trong thí nghiệm này, cần chú ý điều gì khi căn chỉnh dây dọi và cổng quang điện?",
    ],
  },

  projectile: {
    id: "projectile",
    category: "module1",
    title: "Chuyển Động Ném Ngang & Ném Xiên",
    subtitle: "Bài 12: Thả rơi bi A đồng thời ném ngang bi B (Hình 12.1 SGK)",
    lessonSGK: "Bài 12 SGK Vật lí 10 (KNTT)",
    badge: "Module 1 • Động học",
    description: "Tái hiện nguyên bản thí nghiệm Hình 12.1 SGK: Dùng búa gõ bật chốt đẩy bi B chuyển động ném ngang đồng thời thả rơi tự do bi A từ cùng độ cao H. Khảo sát quỹ đạo ném xiên các góc từ 0° đến 75°, phân tích vector vận tốc v_x, v_y, tầm bay xa L và tầm bay cao H_max.",
    equipmentList: [
      "Khung thí nghiệm ném ngang có thanh thép đàn hồi và búa gõ",
      "Hai viên bi thép A và B cùng kích thước và khối lượng",
      "Khẩu súng bắn bi có thước đo góc chia độ 0 - 90°",
      "Bảng kẻ ô tọa độ milimet phía sau để ghi nhận quỹ đạo",
      "Tấm hứng bi có giấy than đánh dấu vị trí chạm đất",
    ],
    principles: [
      "Chuyển động ném ngang được phân tích thành: Trục Ox thẳng đều x = v0 * t; Trục Oy rơi tự do y = 0.5 * g * t²",
      "Thời gian rơi chạm đất: t = sqrt(2H / g), chỉ phụ thuộc vào độ cao H, không phụ thuộc vận tốc đầu v0",
      "Chuyển động ném xiên góc alpha: x = (v0 cos alpha) * t; y = H + (v0 sin alpha) * t - 0.5 * g * t²",
      "Tầm xa cực đại đạt được khi góc ném alpha = 45° (bỏ qua cản không khí)",
    ],
    formula: "y = \\frac{g}{2v_0^2}x^2; \\quad L = v_0 \\sqrt{\\frac{2H}{g}}; \\quad L_{\\text{xiên}} = \\frac{v_0^2 \\sin(2\\alpha)}{g}",
    columnHeaders: DEFAULT_COLUMN_HEADERS.projectile,
    defaultParams: {
      initialHeightH: 1.2, // m
      initialVelocityV0: 4.0, // m/s
      launchAngleDeg: 0, // 0 = ném ngang, >0 = ném xiên
      showVectors: true,
      compareDropSimultaneous: true,
    },
    paramUnits: {
      initialHeightH: "m",
      initialVelocityV0: "m/s",
      launchAngleDeg: "độ (°)",
    },
    socraticQuestions: [
      {
        level: "Nhận biết",
        question: "Trong thí nghiệm búa gõ (Hình 12.1 SGK), bi A rơi tự do và bi B ném ngang viên bi nào chạm đất trước?",
        hint: "Xem phương trình chuyển động theo phương thẳng đứng Oy của cả hai viên bi.",
        answer: "Cả hai viên bi A và B chạm đất cùng một lúc vì chuyển động theo phương thẳng đứng của cả hai đều là rơi tự do với cùng gia tốc g từ cùng độ cao H.",
      },
      {
        level: "Thông hiểu",
        question: "Dạng quỹ đạo của vật ném ngang trong hệ tọa độ Oxy là đường gì? Giải thích?",
        hint: "Khử thời gian t giữa phương trình x = v0*t và y = 0.5*g*t².",
        answer: "Quỹ đạo là một nhánh của đường parabol đỉnh O có phương trình y = (g / (2*v0²)) * x².",
      },
      {
        level: "Vận dụng",
        question: "Trong các môn thể thao như nhảy xa hay đẩy tạ, các vận động viên thường đẩy với góc khoảng bao nhiêu độ để đạt thành tích xa nhất? Vì sao?",
        hint: "Phân tích công thức tầm xa L = (v0² * sin 2alpha)/g.",
        answer: "Góc tối ưu lý thuyết là 45° vì hàm sin(2alpha) đạt cực đại bằng 1 khi 2alpha = 90° => alpha = 45° (trong thực tế do điểm xuất phát cao hơn mặt đất nên góc tối ưu khoảng 40° - 42°).",
      },
    ],
    defaultQuestions: [
      "Tại sao chuyển động của bi B ném ngang lại chứng minh được tính độc lập của hai chuyển động thành phần theo phương ngang và phương thẳng đứng?",
      "Nếu tăng vận tốc đầu v0 lên gấp đôi trong chuyển động ném ngang từ độ cao H, tầm xa L và thời gian rơi chạm đất t thay đổi như thế nào?",
    ],
  },

  newton2: {
    id: "newton2",
    category: "module2",
    title: "Kiểm Chứng Định Luật II Newton",
    subtitle: "Bài 15: Máng trượt đệm khí không ma sát & 2 cổng quang điện",
    lessonSGK: "Bài 15 SGK Vật lí 10 (KNTT)",
    badge: "Module 2 • Động lực học",
    description: "Khảo sát mối quan hệ giữa gia tốc a, lực kéo F và khối lượng hệ (M + m). Sử dụng máy nén khí bơm đệm khí vào máng nhôm để triệt tiêu ma sát. Xe trượt khối lượng M gắn tấm chắn sáng rộng d = 20 mm đi qua 2 cổng quang E và F để đo vận tốc tức thời v1, v2 và tính gia tốc thực nghiệm a_tn.",
    equipmentList: [
      "Máng trượt đệm khí bằng nhôm hợp kim dài 1.5 m có vạch chia mm",
      "Bơm nén khí công suất điều chỉnh được để tạo đệm khí nâng xe",
      "Xe trượt khối lượng M có gắn cờ chắn sáng d = 20 mm",
      "Bộ gia trọng m móc vào dây nối vắt qua ròng rọc không ma sát",
      "Hai cổng quang E và F kết nối đồng hồ hiện số MC964",
      "Nam châm điện giữ và nhả xe tự động",
    ],
    principles: [
      "Định luật II Newton: Gia tốc tỉ lệ thuận với lực tác dụng và tỉ lệ nghịch với khối lượng: a = F / (M + m)",
      "Lực kéo của quả nặng: F = m * g (trong điều kiện m << M)",
      "Vận tốc tức thời qua cổng quang: v1 = d / delta_t1; v2 = d / delta_t2",
      "Gia tốc thực nghiệm: a_tn = (v2² - v1²) / (2s)",
      "Khi tắt đệm khí, ma sát trượt cản trở chuyển động làm a_tn giảm rõ rệt",
    ],
    formula: "a_{\\text{lt}} = \\frac{m \\cdot g}{M + m}; \\quad a_{\\text{tn}} = \\frac{v_2^2 - v_1^2}{2s}; \\quad v = \\frac{d}{\\Delta t}",
    columnHeaders: DEFAULT_COLUMN_HEADERS.newton2,
    defaultParams: {
      gliderMassM: 0.200, // kg (200g)
      hangingMassM: 0.020, // kg (20g)
      flagWidthD: 0.020, // m (20mm)
      gateDistanceS: 0.40, // m (40cm)
      airBlowerOn: true, // công tắc đệm khí
    },
    paramUnits: {
      gliderMassM: "kg",
      hangingMassM: "kg",
      flagWidthD: "m",
      gateDistanceS: "m",
    },
    socraticQuestions: [
      {
        level: "Nhận biết",
        question: "Cờ chắn sáng d đi qua cổng quang giúp đồng hồ MC964 xác định đại lượng nào của xe trượt?",
        hint: "Vận tốc tức thời bằng bề rộng cờ chia cho thời gian cờ chắn tia sáng v = d/delta_t.",
        answer: "Giúp xác định vận tốc tức thời của xe trượt tại vị trí cổng quang đó.",
      },
      {
        level: "Thông hiểu",
        question: "Khi giữ nguyên khối lượng xe M và tăng khối lượng quả nặng kéo m, gia tốc a của xe thay đổi như thế nào?",
        hint: "Phân tích biểu thức a = (m*g)/(M+m).",
        answer: "Lực kéo F = m*g tăng làm gia tốc a tăng tỉ lệ thuận với lực kéo (khi m nhỏ hơn nhiều so với M).",
      },
      {
        level: "Vận dụng",
        question: "Hiện tượng gì xảy ra khi học sinh quên bật máy bơm đệm khí? Kết quả gia tốc đo được sẽ như thế nào?",
        hint: "Không có lớp đệm khí, xe sẽ tiếp xúc trực tiếp với bề mặt máng nhôm.",
        answer: "Ma sát trượt giữa xe và máng xuất hiện làm lực cản lớn, gia tốc thực nghiệm a_tn sẽ nhỏ hơn rất nhiều so với lý thuyết a_lt = mg/(M+m).",
      },
    ],
    defaultQuestions: [
      "Tại sao khối lượng trong công thức Định luật II Newton ở bài này lại là (M + m) chứ không phải chỉ là M?",
      "So sánh gia tốc thực nghiệm a_tn và gia tốc lý thuyết a_lt, phân tích các nguyên nhân gây ra sai số trong thí nghiệm này?",
    ],
  },

  friction: {
    id: "friction",
    category: "module2",
    title: "Khảo Sát Lực Ma Sát Trượt",
    subtitle: "Bài 18: Khối gỗ, lực kế kéo đều & các bề mặt tiếp xúc",
    lessonSGK: "Bài 18 SGK Vật lí 10 (KNTT)",
    badge: "Module 2 • Động lực học",
    description: "Khảo sát các yếu tố ảnh hưởng đến lực ma sát trượt: áp lực N lên mặt tiếp xúc, diện tích tiếp xúc và tính chất bề mặt (gỗ khô, giấy nhám, kim loại nhẵn). Kéo đều khối gỗ bằng lực kế: quan sát lực ma sát nghỉ cực đại F0 ngay trước khi chuyển động và lực ma sát trượt F_ms không đổi khi trượt đều. Vẽ đồ thị F_ms(N) suy ra hệ số ma sát mu.",
    equipmentList: [
      "Mặt bàn kéo phẳng nằm ngang dài 80 cm",
      "Khối gỗ hình hộp chữ nhật có các mặt diện tích khác nhau (mặt lớn, mặt nhỏ)",
      "Bộ tấm lót bề mặt: Gỗ bào phẳng (mu ~ 0.28), Giấy nhám (mu ~ 0.55), Tấm thép nhẵn (mu ~ 0.15)",
      "Lực kế lò xo độ nhạy cao 0 - 5 N có kim chỉ thị tối đa",
      "Bộ quả cân 50g, 100g, 200g để thay đổi áp lực N",
      "Cơ cấu kéo cơ học tạo vận tốc đều",
    ],
    principles: [
      "Lực ma sát trượt tỉ lệ thuận với áp lực: F_ms = mu * N",
      "Lực ma sát trượt không phụ thuộc vào diện tích tiếp xúc và tốc độ trượt (ở tốc độ vừa phải)",
      "Hệ số ma sát trượt mu phụ thuộc vào vật liệu và tình trạng của hai bề mặt tiếp xúc",
      "Lực ma sát nghỉ cực đại F0 luôn lớn hơn một chút so với lực ma sát trượt F_ms",
    ],
    formula: "F_{\\text{ms}} = \\mu \\cdot N; \\quad N = P = (M_{\\text{gỗ}} + m_{\\text{tải}}) \\cdot g; \\quad \\mu = \\text{slope của } F_{\\text{ms}}(N)",
    columnHeaders: DEFAULT_COLUMN_HEADERS.friction,
    defaultParams: {
      surfaceType: "wood", // wood, sandpaper, steel
      woodBlockMassKg: 0.15, // 150g
      addedMassKg: 0.10, // 100g
      contactAreaType: "large", // large vs small
      pullSpeed: 0.05, // m/s
    },
    paramUnits: {
      woodBlockMassKg: "kg",
      addedMassKg: "kg",
      pullSpeed: "m/s",
    },
    socraticQuestions: [
      {
        level: "Nhận biết",
        question: "Khi ta bắt đầu kéo lực kế nhưng khối gỗ chưa chuyển động, số chỉ của lực kế cho biết độ lớn của lực nào?",
        hint: "Lực giữ cho vật đứng yên khi có xu hướng chuyển động.",
        answer: "Đó là lực ma sát nghỉ. Lực ma sát nghỉ tự điều chỉnh bằng với lực kéo cho đến khi đạt giá trị cực đại F0.",
      },
      {
        level: "Thông hiểu",
        question: "Khi lật khối gỗ từ mặt tiếp xúc lớn sang mặt tiếp xúc nhỏ nhưng giữ nguyên số quả cân, lực ma sát trượt đo được có thay đổi không?",
        hint: "Nhớ lại đặc điểm của lực ma sát trượt trong SGK Bài 18.",
        answer: "Không thay đổi. Lực ma sát trượt không phụ thuộc vào diện tích tiếp xúc giữa hai bề mặt.",
      },
      {
        level: "Vận dụng",
        question: "Tại sao lốp ô tô, xe máy lại có các rãnh và hoa lốp gồ ghề, và khi lốp mòn quá mức thì nguy cơ trượt ngã khi phanh gấp tăng cao?",
        hint: "Liên hệ tính chất bề mặt và thoát nước, bùn với hệ số ma sát mu.",
        answer: "Hoa lốp làm tăng độ bám và tăng ma sát trên đường, đồng thời rãnh thoát nước tránh hiện tượng trượt nước. Khi lốp mòn, hệ số ma sát mu giảm mạnh khiến quãng đường phanh dài hơn và dễ mất lái.",
      },
    ],
    defaultQuestions: [
      "Tại sao trong thí nghiệm khảo sát lực ma sát trượt, ta bắt buộc phải kéo khối gỗ chuyển động thẳng đều?",
      "Trình bày cách xác định hệ số ma sát trượt mu từ đồ thị biểu diễn mối quan hệ giữa lực ma sát trượt F_ms và áp lực N?",
    ],
  },

  concurrent_force: {
    id: "concurrent_force",
    category: "module3",
    title: "Tổng Hợp Lực Đồng Quy",
    subtitle: "Bài 22: Bảng thép, 2 lực kế kéo dây cao su & Quy tắc hình bình hành",
    lessonSGK: "Bài 22 SGK Vật lí 10 (KNTT)",
    badge: "Module 3 • Cân bằng lực",
    description: "Kiểm chứng quy tắc hình bình hành lực. Sử dụng bảng thép gắn giấy trắng, kéo dây cao su bằng hai lực kế F1 và F2 hợp với nhau một góc alpha sao cho nút buộc dịch chuyển đến vị trí cân bằng O. Thay thế hai lực kế bằng một lực kế duy nhất kéo nút buộc đến đúng điểm O để xác định hợp lực thực nghiệm F_tn, so sánh với công thức lý thuyết F_lt.",
    equipmentList: [
      "Bảng thép từ tính kích thước 40 x 50 cm đặt thẳng đứng",
      "Hai lực kế lò xo 0 - 5 N có nam châm giữ trên bảng",
      "Dây cao su tròn đàn hồi và chỉ nối nhẹ có vòng khuyên O",
      "Thước đo góc hình bán nguyệt 0 - 180° và thước kẻ mm",
      "Bút chì định vị điểm cân bằng O và các hướng lực",
    ],
    principles: [
      "Quy tắc hình bình hành: Hợp lực của 2 lực đồng quy là đường chéo của hình bình hành có 2 cạnh là 2 lực thành phần",
      "Độ lớn hợp lực: F² = F1² + F2² + 2*F1*F2*cos(alpha)",
      "Khi alpha = 0° (cùng hướng): F_max = F1 + F2",
      "Khi alpha = 180° (ngược hướng): F_min = |F1 - F2|",
      "Khi alpha = 90° (vuông góc): F = sqrt(F1² + F2²)",
    ],
    formula: "F_{\\text{lt}} = \\sqrt{F_1^2 + F_2^2 + 2F_1F_2\\cos\\alpha}; \\quad \\vec{F} = \\vec{F}_1 + \\vec{F}_2",
    columnHeaders: DEFAULT_COLUMN_HEADERS.concurrent_force,
    defaultParams: {
      forceF1: 2.5, // N
      forceF2: 3.0, // N
      angleAlphaDeg: 60, // độ
    },
    paramUnits: {
      forceF1: "N",
      forceF2: "N",
      angleAlphaDeg: "độ (°)",
    },
    socraticQuestions: [
      {
        level: "Nhận biết",
        question: "Thế nào là hai lực đồng quy?",
        hint: "Xem vị trí giao nhau của giá của hai lực.",
        answer: "Hai lực đồng quy là hai lực có giá cắt nhau tại một điểm.",
      },
      {
        level: "Thông hiểu",
        question: "Nếu giữ nguyên độ lớn của F1 và F2 nhưng tăng góc alpha từ 30° lên 120°, độ lớn hợp lực F sẽ tăng hay giảm?",
        hint: "Xem hàm cos(alpha) khi alpha tăng từ 0° đến 180°.",
        answer: "Độ lớn hợp lực F sẽ giảm vì khi góc alpha tăng thì cos(alpha) giảm, làm giảm giá trị của biểu thức F² = F1² + F2² + 2F1F2cos(alpha).",
      },
      {
        level: "Vận dụng",
        question: "Tại sao dây kéo cẩu hàng hai nhánh lại không nên mở góc quá rộng (thường dưới 90°)?",
        hint: "Tính lực căng trên mỗi nhánh dây khi góc mở lớn tiệm cận 180°.",
        answer: "Khi góc giữa hai nhánh dây mở quá rộng, để nâng cùng một tải trọng thì lực căng trên mỗi nhánh dây phải tăng vọt lên rất lớn, dễ dẫn tới đứt cáp gây tai nạn.",
      },
    ],
    defaultQuestions: [
      "Tại sao vị trí nút buộc O phải được giữ cố định khi thay thế hai lực kế F1, F2 bằng một lực kế F duy nhất?",
      "Trình bày cách dựng hình bình hành lực và so sánh hợp lực đo được bằng lực kế F_tn với kết quả tính bằng công thức lý thuyết?",
    ],
  },

  moment_rule: {
    id: "moment_rule",
    category: "module3",
    title: "Cân Bằng Đĩa Quay & Quy Tắc Moment Lực",
    subtitle: "Bài 21: Đĩa tròn có trục quay O & các quả nặng ở bán kính khác nhau",
    lessonSGK: "Bài 21 SGK Vật lí 10 (KNTT)",
    badge: "Module 3 • Cân bằng lực",
    description: "Khảo sát điều kiện cân bằng của một vật có trục quay cố định (quy tắc moment lực). Sử dụng đĩa tròn quay quanh trục tâm O không ma sát, trên đĩa có các lỗ tròn đồng tâm để móc các chùm quả nặng F1, F2 ở các cánh tay đòn d1, d2 khác nhau. Kiểm chứng tổng moment lực làm vật quay theo chiều kim đồng hồ bằng tổng moment làm vật quay ngược chiều kim đồng hồ.",
    equipmentList: [
      "Đĩa tròn kim loại nhẹ có trục quay tâm O nằm ngang không ma sát",
      "Các vòng tròn đồng tâm bán kính r = 2, 4, 6, 8, 10 cm có lỗ móc",
      "Bộ quả nặng 50g mạ niken có móc treo",
      "Dây treo mảnh, nhẹ không giãn",
      "Thước dây và kim chỉ thị góc cân bằng",
    ],
    principles: [
      "Moment lực đối với trục quay: M = F * d (N·m), với d là cánh tay đòn (khoảng cách từ trục quay đến giá của lực)",
      "Quy tắc moment: Muốn cho một vật có trục quay cố định ở trạng thái cân bằng, tổng moment lực có xu hướng làm vật quay theo chiều kim đồng hồ phải bằng tổng moment lực có xu hướng làm vật quay ngược chiều kim đồng hồ: M_thuận = M_ngược",
    ],
    formula: "M = F \\cdot d; \\quad \\sum M_{\\text{thuận}} = \\sum M_{\\text{nghịch}} \\iff F_1 \\cdot d_1 = F_2 \\cdot d_2",
    columnHeaders: DEFAULT_COLUMN_HEADERS.moment_rule,
    defaultParams: {
      leftMassG: 100, // g -> F1 = 0.98 N
      leftArmCm: 6.0, // cm
      rightMassG: 150, // g -> F2 = 1.47 N
      rightArmCm: 4.0, // cm
    },
    paramUnits: {
      leftMassG: "g",
      leftArmCm: "cm",
      rightMassG: "g",
      rightArmCm: "cm",
    },
    socraticQuestions: [
      {
        level: "Nhận biết",
        question: "Cánh tay đòn d của lực được định nghĩa như thế nào?",
        hint: "Là khoảng cách hình học ngắn nhất từ đâu đến đâu?",
        answer: "Cánh tay đòn d là khoảng cách vuông góc từ trục quay đến giá của lực.",
      },
      {
        level: "Thông hiểu",
        question: "Nếu treo một quả nặng F1 = 2 N ở khoảng cách d1 = 6 cm bên trái trục quay, thì bên phải cần treo lực F2 bằng bao nhiêu ở vị trí d2 = 4 cm để đĩa đứng yên cân bằng?",
        hint: "Áp dụng F1*d1 = F2*d2.",
        answer: "Ta có: F2 = (F1 * d1) / d2 = (2 * 6) / 4 = 3 N.",
      },
      {
        level: "Vận dụng",
        question: "Tại sao khi mở cánh cửa phòng học, tay nắm cửa luôn được bố trí ở mép ngoài xa bản lề nhất chứ không đặt sát bản lề?",
        hint: "Xem xét cánh tay đòn d và lực cần thiết để tạo ra cùng một moment quay M.",
        answer: "Đặt tay nắm xa bản lề làm tăng cánh tay đòn d tối đa, do đó chỉ cần một lực F nhỏ là đã tạo đủ moment M = F*d để mở cửa dễ dàng.",
      },
    ],
    defaultQuestions: [
      "Thực hiện đo 3 trường hợp cân bằng với các cánh tay đòn khác nhau, tính tích F.d và rút ra kết luận về điều kiện cân bằng?",
      "Nếu giá của lực đi qua trục quay O thì moment của lực đó bằng bao nhiêu? Giải thích ý nghĩa thực tế?",
    ],
  },

  pendulum_energy: {
    id: "pendulum_energy",
    category: "module4",
    title: "Bảo Toàn Cơ Năng Con Lắc Đơn",
    subtitle: "Bài 26: Thả con lắc từ góc theta0, biểu đồ Wđ - Wt - W & tiêu hao ma sát",
    lessonSGK: "Bài 26 SGK Vật lí 10 (KNTT)",
    badge: "Module 4 • Năng lượng",
    description: "Khảo sát sự chuyển hóa qua lại giữa động năng và thế năng trong dao động của con lắc đơn. Đo vận tốc cực đại tại vị trí cân bằng qua cổng quang điện E. Biểu đồ cột động năng Wđ, thế năng Wt và cơ năng tổng W theo thời gian. Khảo sát trường hợp bảo toàn lý tưởng và trường hợp có lực cản không khí làm cơ năng suy hao thành nhiệt năng.",
    equipmentList: [
      "Giá thí nghiệm con lắc đơn có dây treo chiều dài l = 0.5 - 1.0 m",
      "Vật nặng hình cầu có khối lượng m = 50 - 200 g gắn cờ chắn sáng",
      "Bảng chia độ góc dao động 0 - 60°",
      "Cổng quang điện E đặt tại vị trí cân bằng nối đồng hồ MC964",
      "Cảm biến góc hoặc cảm biến lực căng dây",
    ],
    principles: [
      "Thế năng trọng trường: Wt = m * g * h = m * g * l * (1 - cos theta)",
      "Động năng: Wd = 0.5 * m * v²",
      "Khi không có ma sát: Cơ năng bảo toàn W = Wd + Wt = const",
      "Tại vị trí biên: v = 0 => Wd = 0, Wt = W_max = m * g * l * (1 - cos theta0)",
      "Tại vị trí cân bằng: h = 0 => Wt = 0, Wd = W_max => v_max = sqrt(2 * g * l * (1 - cos theta0))",
    ],
    formula: "W = W_đ + W_t = \\frac{1}{2}mv^2 + mgl(1-\\cos\\theta) = \\text{hằng số}; \\quad v_{\\max} = \\sqrt{2gl(1-\\cos\\theta_0)}",
    columnHeaders: DEFAULT_COLUMN_HEADERS.pendulum_energy,
    defaultParams: {
      stringLengthL: 0.8, // m (80cm)
      bobMassKg: 0.1, // kg (100g)
      initialAngleDeg: 30, // độ
      airDamping: false, // bật/tắt ma sát cản
    },
    paramUnits: {
      stringLengthL: "m",
      bobMassKg: "kg",
      initialAngleDeg: "độ (°)",
    },
    socraticQuestions: [
      {
        level: "Nhận biết",
        question: "Tại vị trí con lắc đi qua vị trí cân bằng (thấp nhất), động năng và thế năng của con lắc đạt giá trị như thế nào?",
        hint: "Vận tốc đạt cực đại và độ cao h = 0.",
        answer: "Động năng đạt giá trị cực đại và thế năng bằng không (nếu chọn gốc thế năng tại VTCB).",
      },
      {
        level: "Thông hiểu",
        question: "Nếu tăng góc lệch ban đầu theta0 từ 20° lên 40°, vận tốc con lắc khi qua vị trí cân bằng sẽ tăng hay giảm? Giải thích?",
        hint: "Độ cao ban đầu h0 = l*(1 - cos theta0) tăng theo góc.",
        answer: "Vận tốc qua VTCB sẽ tăng vì độ cao h0 lớn hơn, thế năng ban đầu chuyển hóa thành động năng cực đại lớn hơn theo công thức v_max = sqrt(2gl(1 - cos theta0)).",
      },
      {
        level: "Vận dụng",
        question: "Khi bật chế độ 'Có ma sát không khí', biên độ dao động và cơ năng tổng của con lắc giảm dần theo thời gian. Phần cơ năng bị mất đi đã biến thành dạng năng lượng nào?",
        hint: "Định luật bảo toàn và chuyển hóa năng lượng.",
        answer: "Cơ năng không tự mất đi mà chuyển hóa thành nhiệt năng làm nóng vật nặng và không khí xung quanh do công của lực cản ma sát.",
      },
    ],
    defaultQuestions: [
      "Tính cơ năng ban đầu tại vị trí biên và so sánh với động năng đo được khi con lắc đi qua cổng quang tại vị trí cân bằng?",
      "Nêu các biện pháp giảm thiểu thất thoát năng lượng khi thực hiện thí nghiệm đo chu kỳ và năng lượng con lắc đơn?",
    ],
  },

  collision_momentum: {
    id: "collision_momentum",
    category: "module4",
    title: "Thực Hành Va Chạm & Bảo Toàn Động Lượng",
    subtitle: "Bài 30: Va chạm đàn hồi & va chạm mềm trên máng đệm khí",
    lessonSGK: "Bài 30 SGK Vật lí 10 (KNTT)",
    badge: "Module 4 • Năng lượng & Động lượng",
    description: "Khảo sát định luật bảo toàn động lượng trong hệ kín. Sử dụng máng đệm khí và hai xe trượt m1, m2 chuyển động va chạm trực diện. Khảo sát 2 trường hợp: Va chạm đàn hồi (gắn lò xo lá đàn hồi, động năng và động lượng cùng bảo toàn) và Va chạm mềm (gắn mũi kim cắm sáp, dính liền sau va chạm). Đo vận tốc trước và sau qua cổng quang.",
    equipmentList: [
      "Máng trượt đệm khí nằm ngang chuẩn xác",
      "Hai xe trượt m1 và m2 có gắn cờ chắn sáng d = 20 mm",
      "Bộ phụ kiện va chạm đàn hồi (lá thép đàn hồi) và va chạm mềm (kim cắm sáp)",
      "Hai cổng quang điện E và F kết nối đồng hồ MC964 đo thời gian",
    ],
    principles: [
      "Định luật bảo toàn động lượng trong hệ kín: Vectơ p_trước = Vectơ p_sau <=> m1*v1 + m2*v2 = m1*v1' + m2*v2'",
      "Va chạm mềm: Sau va chạm hai vật dính liền cùng vận tốc V = (m1*v1 + m2*v2) / (m1 + m2)",
      "Va chạm đàn hồi: Cả động lượng và động năng đều bảo toàn",
    ],
    formula: "m_1 \\vec{v}_1 + m_2 \\vec{v}_2 = m_1 \\vec{v}_1' + m_2 \\vec{v}_2'; \\quad V_{\\text{mềm}} = \\frac{m_1 v_1 + m_2 v_2}{m_1 + m_2}",
    columnHeaders: DEFAULT_COLUMN_HEADERS.collision_momentum,
    defaultParams: {
      collisionType: "elastic", // elastic vs inelastic
      cart1MassKg: 0.200, // 200g
      cart2MassKg: 0.200, // 200g
      cart1InitialV: 0.60, // m/s
      cart2InitialV: 0.0, // xe 2 đứng yên
    },
    paramUnits: {
      cart1MassKg: "kg",
      cart2MassKg: "kg",
      cart1InitialV: "m/s",
      cart2InitialV: "m/s",
    },
    socraticQuestions: [
      {
        level: "Nhận biết",
        question: "Động lượng của một vật khối lượng m chuyển động với vận tốc v được tính bằng công thức nào và có đơn vị là gì?",
        hint: "Vector p = m * v.",
        answer: "Động lượng p = m * v, có đơn vị là kg·m/s (hoặc N·s).",
      },
      {
        level: "Thông hiểu",
        question: "Trong va chạm mềm giữa 2 xe trượt, tổng động năng sau va chạm có bằng tổng động năng trước va chạm không? Vì sao?",
        hint: "Hiện tượng biến dạng dính kim cắm sáp.",
        answer: "Không bằng. Tổng động năng sau va chạm luôn nhỏ hơn tổng động năng trước va chạm vì một phần năng lượng đã biến thành nhiệt năng và công làm biến dạng vật.",
      },
      {
        level: "Vận dụng",
        question: "Tại sao ở đầu mũi xe ô tô hiện đại lại được thiết kế vùng dễ biến dạng (crumple zone) thay vì làm bằng thép siêu cứng không thể bẹp?",
        hint: "Định lý biến thiên động lượng Delta p = F * Delta t.",
        answer: "Vùng biến dạng kéo dài thời gian va chạm Delta t, làm giảm lực va đập cực đại F = Delta p / Delta t tác dụng lên hành khách ngồi trong xe, giảm nguy cơ chấn thương nặng.",
      },
    ],
    defaultQuestions: [
      "So sánh tổng động lượng trước và sau va chạm trong thí nghiệm va chạm đàn hồi, tính % sai số tương đối?",
      "Trình bày sự khác biệt cơ bản giữa va chạm đàn hồi và va chạm mềm về phương diện năng lượng?",
    ],
  },

  hooke_law: {
    id: "hooke_law",
    category: "module5",
    title: "Khảo Sát Định Luật Hooke Của Lò Xo",
    subtitle: "Bài 33: Giá treo lò xo, thước mm & đo độ dãn delta_l theo lực đàn hồi",
    lessonSGK: "Bài 33 SGK Vật lí 10 (KNTT)",
    badge: "Module 5 • Biến dạng cơ",
    description: "Khảo sát mối quan hệ giữa độ lớn của lực đàn hồi F_đh và độ biến dạng (độ dãn) delta_l của lò xo xoắn ốc trong giới hạn đàn hồi. Treo lần lượt các quả nặng 50g, 100g, 150g, 200g, 250g vào lò xo, đọc chiều dài l trên thước milimet, tính delta_l = l - l0. Vẽ đồ thị F(delta_l), xác định độ cứng k từ hệ số góc đường thẳng.",
    equipmentList: [
      "Giá thí nghiệm thẳng đứng có chân đế vững chắc",
      "Lò xo xoắn ốc bằng thép đàn hồi chiều dài tự nhiên l0 = 100 mm",
      "Thước milimet 500 mm gắn song song với lò xo, có kim chỉ vạch đối chiếu",
      "Bộ quả nặng 50g mạ đồng có móc treo",
      "Kim chỉ thị ngang chống thị sai khi đọc vạch",
    ],
    principles: [
      "Định luật Hooke: Trong giới hạn đàn hồi, độ lớn lực đàn hồi của lò xo tỉ lệ thuận với độ biến dạng: F_đh = k * |delta_l|",
      "Khi quả nặng nằm cân bằng: F_đh = P = m * g",
      "Độ dãn lò xo: delta_l = l - l0",
      "Đồ thị F theo delta_l là đường thẳng đi qua gốc tọa độ có độ dốc chính là độ cứng k của lò xo",
      "Khi vượt quá giới hạn đàn hồi, đồ thị bị uốn cong và lò xo không thể co về l0 ban đầu",
    ],
    formula: "F_{\\text{đh}} = k \\cdot |\\Delta l| = k \\cdot |l - l_0|; \\quad k = \\frac{\\Delta F}{\\Delta(\\Delta l)} = \\text{độ dốc đồ thị}",
    columnHeaders: DEFAULT_COLUMN_HEADERS.hooke_law,
    defaultParams: {
      initialLengthL0Mm: 100, // mm
      springConstantKNm: 25.0, // N/m
      appliedMassG: 50, // g (50 -> 250)
    },
    paramUnits: {
      initialLengthL0Mm: "mm",
      springConstantKNm: "N/m",
      appliedMassG: "g",
    },
    socraticQuestions: [
      {
        level: "Nhận biết",
        question: "Đơn vị đo chuẩn của độ cứng lò xo k trong hệ SI là gì?",
        hint: "Từ công thức k = F / delta_l.",
        answer: "Đơn vị là Newton trên mét (N/m).",
      },
      {
        level: "Thông hiểu",
        question: "Tại sao đồ thị biểu diễn F theo delta_l trong giới hạn đàn hồi lại là một đường thẳng đi qua gốc tọa độ?",
        hint: "Phương trình y = k*x thể hiện quan hệ tỉ lệ thuận.",
        answer: "Vì lực đàn hồi tỉ lệ thuận bậc nhất với độ dãn delta_l theo Định luật Hooke F = k*delta_l, tương đương hàm số y = ax đi qua gốc tọa độ O(0,0).",
      },
      {
        level: "Vận dụng",
        question: "Nếu treo một vật quá nặng làm lò xo bị dãn vĩnh viễn không co lại được như ban đầu, thì ta nói lò xo đã bị vượt quá giới hạn nào?",
        hint: "Khái niệm biến dạng đàn hồi so với biến dạng dư (dẻo).",
        answer: "Lò xo đã bị vượt quá giới hạn đàn hồi. Khi đó định luật Hooke không còn đúng và lò xo xuất hiện biến dạng dư vĩnh viễn.",
      },
    ],
    defaultQuestions: [
      "Từ bảng số liệu đo độ dãn của lò xo khi treo các quả nặng khác nhau, vẽ đồ thị F - delta_l và tính độ cứng k của lò xo?",
      "Tại sao khi đọc chiều dài l của lò xo trên thước kẻ, mắt của người quan sát phải đặt ngang bằng với kim chỉ thị?",
    ],
  },

  fluid_pressure: {
    id: "fluid_pressure",
    category: "module5",
    title: "Áp Suất Chất Lưu & Máy Thủy Lực",
    subtitle: "Bài 34: Áp kế màng theo độ sâu h & Định luật Pascal máy ép thủy lực",
    lessonSGK: "Bài 34 SGK Vật lí 10 (KNTT)",
    badge: "Module 5 • Chất lưu",
    description: "Khảo sát định luật áp suất thủy tĩnh theo độ sâu: p = p0 + rho * g * h bằng áp kế màng cao su kết nối ống chữ U chứa chất lỏng màu. Khảo sát nguyên lý máy ép thủy lực (Định luật Pascal): lực tác dụng tỉ lệ với diện tích pít-tông F1/S1 = F2/S2 cho phép nâng vật nặng bằng một lực nhỏ.",
    equipmentList: [
      "Bình trụ trong suốt chứa nước cao 50 cm có thước đo độ sâu mm",
      "Đầu dò áp kế màng cao su mỏng có thể xoay đổi hướng và di chuyển độ sâu",
      "Áp kế chữ U chứa chất lỏng chỉ thị để đo độ chênh lệch áp suất delta_h",
      "Mô hình máy ép thủy lực hai nhánh có pít-tông diện tích S1 và S2 (S2/S1 = 4)",
      "Bộ quả cân đặt lên hai pít-tông",
    ],
    principles: [
      "Áp suất thủy tĩnh tại độ sâu h: p = p0 + rho * g * h",
      "Độ tăng áp suất delta_p = rho * g * h tỉ lệ thuận với độ sâu h và khối lượng riêng chất lỏng rho",
      "Áp suất tác dụng lên chất lỏng kín được truyền nguyên vẹn theo mọi hướng (Định luật Pascal)",
      "Máy ép thủy lực: F2 = F1 * (S2 / S1)",
    ],
    formula: "p = p_0 + \\rho g h; \\quad \\Delta p = \\rho g h; \\quad \\frac{F_1}{S_1} = \\frac{F_2}{S_2}",
    columnHeaders: DEFAULT_COLUMN_HEADERS.fluid_pressure,
    defaultParams: {
      depthHCm: 15.0, // cm
      liquidType: "water", // water (1000 kg/m3), oil (800 kg/m3), brine (1150 kg/m3)
      piston1AreaCm2: 5.0,
      piston2AreaCm2: 20.0,
      piston1ForceN: 10.0,
    },
    paramUnits: {
      depthHCm: "cm",
      piston1ForceN: "N",
    },
    socraticQuestions: [
      {
        level: "Nhận biết",
        question: "Khi đưa đầu dò áp kế màng xuống sâu hơn trong lòng chất lỏng, độ chênh lệch mực chất lỏng ở hai nhánh ống chữ U thay đổi thế nào?",
        hint: "Độ chênh lệch tỉ lệ với delta_p = rho*g*h.",
        answer: "Độ chênh lệch mực chất lỏng tăng lên, chứng tỏ áp suất chất lỏng tăng theo độ sâu.",
      },
      {
        level: "Thông hiểu",
        question: "Ở cùng một độ sâu h, khi quay màng áp kế sang trái, sang phải, lên trên hay xuống dưới thì số đo áp suất có thay đổi không? Rút ra kết luận gì?",
        hint: "Đặc điểm truyền áp suất chất lỏng đứng yên.",
        answer: "Không thay đổi. Kết luận: Tại một điểm ở cùng độ sâu trong chất lỏng, áp suất theo mọi phương là như nhau.",
      },
      {
        level: "Vận dụng",
        question: "Trong hệ thống phanh thủy lực (phanh đĩa ô tô, xe máy), pít-tông ở chân đạp phanh có diện tích nhỏ hơn nhiều so với pít-tông ở má phanh ép vào bánh xe. Hãy giải thích lợi ích của cấu tạo này?",
        hint: "Ứng dụng nguyên lý máy nén thủy lực Định luật Pascal F2 = F1 * (S2 / S1).",
        answer: "Nhờ S2 lớn hơn nhiều so với S1, một lực đạp vừa phải của người lái xe F1 sẽ được khuếch đại thành lực ép rất lớn F2 ở má phanh, giúp kẹp chặt đĩa phanh và dừng xe an toàn tức thì.",
      },
    ],
    defaultQuestions: [
      "Vẽ đồ thị biểu diễn áp suất thủy tĩnh p theo độ sâu h và xác định khối lượng riêng rho của chất lỏng?",
      "Giải thích nguyên lý hoạt động của máy kích thủy lực dùng để nâng ô tô trong các xưởng sửa chữa?",
    ],
  },

  digital_report: {
    id: "digital_report",
    category: "assessment",
    title: "Phiếu Thực Hành Số & AI Chấm Điểm",
    subtitle: "Bài 3: Thực hành tính sai số, lập báo cáo và AI đánh giá Rubric GDPT 2018",
    lessonSGK: "Bài 3 SGK Vật lí 10 (KNTT)",
    badge: "Đánh giá • Chuẩn GDPT 2018",
    description: "Biểu mẫu Báo cáo thực hành số chuyên nghiệp. Cho phép học sinh nhập hoặc đồng bộ tự động số liệu đo 5 lần từ bất kỳ phòng thí nghiệm nào. Tự động tính giá trị trung bình, sai số ngẫu nhiên, sai số tuyệt đối, sai số tỉ đối, viết kết quả đúng quy tắc số có nghĩa. Tích hợp AI chấm điểm sư phạm theo Rubric 4 mức độ và xuất file in A4/PDF.",
    equipmentList: [
      "Máy vi tính / máy tính bảng thu thập số liệu thực nghiệm",
      "Thuật toán thống kê sai số chuẩn GDPT 2018",
      "Trợ lý AI Sư phạm chấm điểm tự động và phản hồi định dạng",
      "Bộ máy in / xuất PDF chuẩn tài liệu khoa học A4",
    ],
    principles: [
      "Giá trị trung bình của n lần đo: A_tb = (A1 + A2 + ... + An) / n",
      "Sai số tuyệt đối của từng lần: delta_Ai = |A_tb - Ai|",
      "Sai số ngẫu nhiên trung bình: delta_A_tb = (delta_A1 + ... + delta_An) / n",
      "Sai số tuyệt đối toàn phần: delta_A = delta_A_tb + delta_A_dc",
      "Sai số tỉ đối: delta_A(%) = (delta_A / A_tb) * 100%",
      "Quy tắc viết kết quả đo: A = A_tb ± delta_A",
    ],
    formula: "\\bar{A} = \\frac{1}{n}\\sum_{i=1}^n A_i; \\quad \\Delta A = \\overline{\\Delta A} + \\Delta A_{\\text{dc}}; \\quad \\delta A = \\frac{\\Delta A}{\\bar{A}} \\times 100\\%",
    columnHeaders: DEFAULT_COLUMN_HEADERS.digital_report,
    defaultParams: {},
    paramUnits: {},
    socraticQuestions: [
      {
        level: "Nhận biết",
        question: "Sai số dụng cụ Delta A_dc thường được quy ước bằng bao nhiêu nếu trên dụng cụ không ghi chú đặc biệt?",
        hint: "Thường lấy bằng 1 độ chia nhỏ nhất (ĐCNN) hoặc nửa độ chia nhỏ nhất.",
        answer: "Thông thường sai số dụng cụ được lấy bằng nửa độ chia nhỏ nhất hoặc một độ chia nhỏ nhất của dụng cụ đo.",
      },
      {
        level: "Thông hiểu",
        question: "Khi nào một phép đo được coi là có độ chính xác cao?",
        hint: "Xem chỉ số sai số tỉ đối delta A (%).",
        answer: "Phép đo có độ chính xác cao khi sai số tỉ đối delta A (%) càng nhỏ (thông thường dưới 1% đến 2%).",
      },
      {
        level: "Vận dụng",
        question: "Giả sử đo gia tốc rơi tự do được g_tb = 9.7842 m/s² và sai số Delta g = 0.0431 m/s². Viết kết quả phép đo chuẩn quy tắc làm tròn?",
        hint: "Sai số tuyệt đối thường làm tròn đến 1 hoặc 2 chữ số có nghĩa, giá trị trung bình làm tròn đến cùng hàng thập phân.",
        answer: "Viết: g = (9.78 ± 0.04) m/s² hoặc g = (9.784 ± 0.043) m/s².",
      },
    ],
    defaultQuestions: [
      "Tại sao khi thực hiện phép đo các đại lượng vật lí, ta lại cần phải đo lặp lại nhiều lần (thường từ 3 đến 5 lần)?",
      "Nêu ý nghĩa của việc tính sai số tỉ đối trong việc so sánh độ chính xác của hai phép đo khác nhau?",
    ],
  },

  free_sandbox: {
    id: "free_sandbox",
    category: "sandbox",
    title: "Thí Nghiệm Tương Tác Tự Do",
    subtitle: "Phòng thí nghiệm Sandbox: Tự do thiết lập tham số ban đầu & chạy mô phỏng vật lí đa mô hình",
    lessonSGK: "Khám phá & Nghiên cứu Khoa học Tự do (GDPT 2018)",
    badge: "Sandbox Mở • Đa mô hình",
    description: "Không gian thí nghiệm mở (Interactive Sandbox) cho phép người dùng tự do lựa chọn các mô hình vật lí cơ bản (Chuyển động ném ngang & xiên, Xe trượt định luật II Newton, Con lắc đơn bảo toàn cơ năng, Dao động lò xo đàn hồi). Tự do tùy chỉnh toàn bộ thông số: vận tốc đầu, góc bắn, độ cao, khối lượng, lực kéo, gia tốc trọng trường g (Trái Đất, Mặt Trăng, Sao Hỏa), hệ số ma sát và sức cản không khí.",
    equipmentList: [
      "Bộ phóng vật ném đa năng (tùy biến v0 từ 0-30 m/s, góc từ -90° đến +90°)",
      "Máng trượt xe thí nghiệm cảm biến lực không dây & quả kéo",
      "Giá treo con lắc đơn & con lắc lò xo cảm biến vị trí siêu âm",
      "Bộ điều khiển môi trường trọng lực vũ trụ (Trái Đất, Mặt Trăng, Sao Hỏa)",
      "Cảm biến đo vận tốc, gia tốc, động năng và thế năng thời gian thực",
    ],
    principles: [
      "Chuyển động ném: Tọa độ x(t) = v0·cos(α)·t, y(t) = H + v0·sin(α)·t - 0.5·g·t²; chịu lực cản khí động học F_c = -k·v",
      "Định luật II Newton: a = (F - F_ms) / (m1 + m2) với F_ms = μ·m1·g",
      "Con lắc đơn: Thế năng Wt = m·g·L·(1 - cosθ), Động năng Wđ = 0.5·m·v²; Cơ năng bảo toàn khi bỏ qua ma sát",
      "Lò xo biến dạng: Lực hồi phục F = -k·x; Dao động điều hòa với chu kỳ T = 2π·√(m/k)",
    ],
    formula: "\\vec{F}_{\\text{hl}} = m\\vec{a}; \\quad W = W_đ + W_t = \\text{const}; \\quad \\vec{F}_{\\text{cản}} = -k\\vec{v}",
    columnHeaders: DEFAULT_COLUMN_HEADERS.free_sandbox,
    defaultParams: {
      modelType: "projectile", // 'projectile' | 'newton' | 'pendulum' | 'spring'
      v0: 12.0,
      angle: 45,
      height: 1.2,
      mass: 0.5,
      force: 4.0,
      frictionCoeff: 0.05,
      airResistance: 0.02,
      gravity: 9.8, // 9.8 (Earth), 1.62 (Moon), 3.71 (Mars)
      length: 1.0,
      springK: 50,
      planet: "earth",
    },
    paramUnits: {
      v0: "m/s",
      angle: "°",
      height: "m",
      mass: "kg",
      force: "N",
      frictionCoeff: "",
      airResistance: "",
      gravity: "m/s²",
      length: "m",
      springK: "N/m",
    },
    socraticQuestions: [
      {
        level: "Nhận biết",
        question: "Trong chuyển động ném xiên không có lực cản, quỹ đạo của vật có dạng đường gì và tầm xa cực đại đạt được ở góc ném bao nhiêu độ?",
        hint: "Nhớ dạng phương trình quỹ đạo y = -(g / 2v0²cos²α)x² + tanα·x.",
        answer: "Quỹ đạo là một nhánh parabol có bề lõm quay xuống. Tầm xa đạt cực đại khi góc ném α = 45° vì sin(2α) = sin(90°) = 1.",
      },
      {
        level: "Thông hiểu",
        question: "Nếu đưa thí nghiệm con lắc đơn hoặc chuyển động ném lên Mặt Trăng (g = 1.62 m/s²), chu kỳ con lắc và tầm xa của vật sẽ thay đổi như thế nào so với ở Trái Đất?",
        hint: "g ở Mặt Trăng xấp xỉ 1/6 so với Trái Đất.",
        answer: "Chu kỳ con lắc đơn T = 2π√(L/g) sẽ tăng lên khoảng 2.45 lần (con lắc dao động chậm hơn nhiều). Trong khi đó, tầm xa ném L = v0²·sin(2α)/g sẽ tăng lên gấp 6 lần.",
      },
      {
        level: "Vận dụng",
        question: "Khi tăng lực cản của môi trường không khí, quỹ đạo ném và cơ năng của hệ dao động (con lắc, lò xo) sẽ biến đổi như thế nào?",
        hint: "Lực cản sinh công âm làm tiêu tán cơ năng thành nội năng (nhiệt năng).",
        answer: "Quỹ đạo ném không còn là parabol đối xứng mà dốc đứng hơn ở đoạn cuối, tầm xa giảm rõ rệt. Đối với con lắc và lò xo, biên độ dao động giảm dần theo thời gian (dao động tắt dần) do cơ năng chuyển hóa thành nhiệt.",
      },
    ],
    defaultQuestions: [
      "Khảo sát mối quan hệ giữa tầm xa L và góc ném α trong mô hình chuyển động ném tự do?",
      "Nhận xét sự biến thiên của động năng, thế năng và sự bảo toàn cơ năng trong mô hình con lắc / lò xo khi thay đổi hệ số cản?",
    ],
  },
};
