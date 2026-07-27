/*
 * 高考历史闯关题库（广东版）
 * 框架基于统编版高中历史教材目录
 * ans 使用 0、1、2、3 分别表示 A、B、C、D。
 */
const IMG_DATA = {
  // 中外历史纲要（上）
  "unit-0-0": "assets/古代史/中华文明起源.webp",
  "unit-0-1": "assets/古代史/隋唐.webp",
  "unit-0-2": "assets/古代史/宋元时期.webp",
  "unit-0-3": "assets/古代史/明清.webp",
  "unit-0-4": "assets/近代史/两次鸦片战争.webp",
  "unit-0-5": "assets/近代史/武昌起义清帝退位.webp",
  "unit-0-6": "assets/近代史/五四运动中共一大.webp",
  "unit-0-7": "assets/近代史/抗日战争.webp",
  "unit-0-8": "assets/近代史/开国大典抗美援朝.webp",
  "unit-0-9": "assets/近代史/十一届三中全会和香港回归.webp",
  "unit-0-10": "assets/近代史/南京国民政府的统治和中共开辟革命新道路.webp",
  // 中外历史纲要（下）
  "unit-1-0": "assets/世界史/古代文明.webp",
  "unit-1-1": "assets/世界史/中古时期的世界.webp",
  "unit-1-2": "assets/世界史/走向整体的世界.webp",
  "unit-1-3": "assets/世界史/资本主义制度的确立.webp",
  "unit-1-4": "assets/世界史/工业革命与马克思主义诞生.webp",
  "unit-1-5": "assets/世界史/世界殖民体系的形成与亚非拉民族独立运动.webp",
  "unit-1-6": "assets/世界史/两次世界大战、十月革命与国际秩序的演变.webp",
  "unit-1-7": "assets/世界史/20世纪下半叶世界的新变化.webp",
  "unit-1-8": "assets/世界史/现代.webp",
  // 选择性必修1：国家制度与社会治理
  "unit-2-0": "assets/历史现场/郡县制与分封制辩论.webp",
  "unit-2-1": "assets/历史现场/科举制演变.webp",
  "unit-2-2": "assets/历史现场/赋税改革因果链.webp",
  "unit-2-3": "assets/历史现场/边疆治理比较.webp",
  "unit-2-4": "assets/历史现场/赋税改革因果链.webp",
  "unit-2-5": "assets/历史现场/编户齐民户籍制度.webp",
  // 选择性必修2：经济与社会生活
  "unit-3-0": "assets/历史现场/哥伦布大交换.webp",
  "unit-3-1": "assets/历史现场/工厂制度革命.webp",
  "unit-3-2": "assets/历史现场/丝绸之路贸易网.webp",
  "unit-3-3": "assets/历史现场/城市化代价.webp",
  "unit-3-4": "assets/历史现场/铁路时代.webp",
  "unit-3-5": "assets/历史现场/公共卫生革命.webp",
  // 选择性必修3：文化交流与传播
  "unit-4-0": "assets/历史现场/儒家文化传播.webp",
  "unit-4-1": "assets/历史现场/希腊化时代.webp",
  "unit-4-2": "assets/历史现场/移民与文化认同.webp",
  "unit-4-3": "assets/历史现场/丝路文化交流.webp",
  "unit-4-4": "assets/历史现场/殖民文化扩张.webp",
  "unit-4-5": "assets/历史现场/文化遗产保护.webp"
};

const EXAM_OUTLINE = {
  "title": "统编版高中历史教材（广东高考适用）",
  "sourceFile": "documents/教材目录.md",
  "maps": [
  {
    "name": "中外历史纲要（上）",
    "units": [
      "从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "三国两晋南北朝的民族交融与隋唐统一多民族封建国家的发展",
      "辽宋夏金多民族政权的并立与元朝的统一",
      "明清中国版图的奠定与面临的挑战",
      "晚清时期的内忧外患与救亡图存",
      "辛亥革命与中华民国的建立",
      "中国共产党成立与新民主主义革命兴起",
      "中华民族的抗日战争和人民解放战争",
      "中华人民共和国成立和社会主义革命与建设",
      "改革开放与社会主义现代化建设新时期",
      "中国特色社会主义新时代"
    ]
  },
  {
    "name": "中外历史纲要（下）",
    "units": [
      "古代文明的产生与发展",
      "中古时期的世界",
      "走向整体的世界",
      "资本主义制度的确立",
      "工业革命与马克思主义的诞生",
      "世界殖民体系与亚非拉民族独立运动",
      "两次世界大战、十月革命与国际秩序的演变",
      "20世纪下半叶世界的新变化",
      "当代世界发展的特点与主要趋势"
    ]
  },
  {
    "name": "选择性必修1",
    "units": [
      "政治制度",
      "官员的选拔与管理",
      "法律与教化",
      "民族关系与国家关系",
      "货币与赋税制度",
      "基层治理与社会保障"
    ]
  },
  {
    "name": "选择性必修2",
    "units": [
      "食物生产与社会生活",
      "生产工具与劳作方式",
      "商业贸易与日常生活",
      "村落、城镇与居住环境",
      "交通与社会变迁",
      "医疗与公共卫生"
    ]
  },
  {
    "name": "选择性必修3",
    "units": [
      "源远流长的中华文化",
      "丰富多样的世界文化",
      "人口迁徙、文化交融与认同",
      "商路、贸易与文化交流",
      "战争与文化交锋",
      "文化的传承与保护"
    ]
  }
]
};

const PAPERS = [];

const MAPS = [
  {
    "id": "gangyao-shang",
    "name": "中外历史纲要（上）",
    "icon": "📜",
    "bgClass": "map-bg-ancient",
    "nodeClass": "map-ancient",
    "pathColor": "#C4956A",
    "pathColorLight": "rgba(196,149,106,.25)",
    "units": [
      { "name": "从中华文明起源到秦汉统一多民族封建国家的建立与巩固", "questions": [] },
      { "name": "三国两晋南北朝的民族交融与隋唐统一多民族封建国家的发展", "questions": [] },
      { "name": "辽宋夏金多民族政权的并立与元朝的统一", "questions": [] },
      { "name": "明清中国版图的奠定与面临的挑战", "questions": [] },
      { "name": "晚清时期的内忧外患与救亡图存", "questions": [] },
      { "name": "辛亥革命与中华民国的建立", "questions": [] },
      { "name": "中国共产党成立与新民主主义革命兴起", "questions": [] },
      { "name": "中华民族的抗日战争和人民解放战争", "questions": [] },
      { "name": "中华人民共和国成立和社会主义革命与建设", "questions": [] },
      { "name": "改革开放与社会主义现代化建设新时期", "questions": [] },
      { "name": "中国特色社会主义新时代", "questions": [] }
    ]
  },
  {
    "id": "gangyao-xia",
    "name": "中外历史纲要（下）",
    "icon": "🌍",
    "bgClass": "map-bg-world",
    "nodeClass": "map-world",
    "pathColor": "#6B8E9F",
    "pathColorLight": "rgba(107,142,159,.25)",
    "units": [
      { "name": "古代文明的产生与发展", "questions": [] },
      { "name": "中古时期的世界", "questions": [] },
      { "name": "走向整体的世界", "questions": [] },
      { "name": "资本主义制度的确立", "questions": [] },
      { "name": "工业革命与马克思主义的诞生", "questions": [] },
      { "name": "世界殖民体系与亚非拉民族独立运动", "questions": [] },
      { "name": "两次世界大战、十月革命与国际秩序的演变", "questions": [] },
      { "name": "20世纪下半叶世界的新变化", "questions": [] },
      { "name": "当代世界发展的特点与主要趋势", "questions": [] }
    ]
  },
  {
    "id": "xuanbi1",
    "name": "选择性必修1",
    "icon": "⚖️",
    "bgClass": "map-bg-modern",
    "nodeClass": "map-modern",
    "pathColor": "#8B9A6B",
    "pathColorLight": "rgba(139,154,107,.25)",
    "units": [
      { "name": "政治制度", "questions": [] },
      { "name": "官员的选拔与管理", "questions": [] },
      { "name": "法律与教化", "questions": [] },
      { "name": "民族关系与国家关系", "questions": [] },
      { "name": "货币与赋税制度", "questions": [] },
      { "name": "基层治理与社会保障", "questions": [] }
    ]
  },
  {
    "id": "xuanbi2",
    "name": "选择性必修2",
    "icon": "🏭",
    "bgClass": "map-bg-ancient",
    "nodeClass": "map-ancient",
    "pathColor": "#A080A0",
    "pathColorLight": "rgba(160,128,160,.25)",
    "units": [
      { "name": "食物生产与社会生活", "questions": [] },
      { "name": "生产工具与劳作方式", "questions": [] },
      { "name": "商业贸易与日常生活", "questions": [] },
      { "name": "村落、城镇与居住环境", "questions": [] },
      { "name": "交通与社会变迁", "questions": [] },
      { "name": "医疗与公共卫生", "questions": [] }
    ]
  },
  {
    "id": "xuanbi3",
    "name": "选择性必修3",
    "icon": "🎭",
    "bgClass": "map-bg-world",
    "nodeClass": "map-world",
    "pathColor": "#D4A060",
    "pathColorLight": "rgba(212,160,96,.25)",
    "units": [
      { "name": "源远流长的中华文化", "questions": [] },
      { "name": "丰富多样的世界文化", "questions": [] },
      { "name": "人口迁徙、文化交融与认同", "questions": [] },
      { "name": "商路、贸易与文化交流", "questions": [] },
      { "name": "战争与文化交锋", "questions": [] },
      { "name": "文化的传承与保护", "questions": [] }
    ]
  }
];
