// 高考历史闯关游戏化配置（广东版）
// 五本教材共用“修复时代节点—开放历史现场—完成口述获得印章”的规则。
const HISTORY_GAME_CONFIG = {
  version: 5,
  province: "广东",
  quiz: {
    defaultQuestionCount: 3,
    focusQuestionCount: 5
  },
  "gangyao-shang": {
    enabled: true,
    mapIndex: 0,
    filter: "gangyao-shang",
    title: "中外历史纲要（上）长河",
    restorationLabel: "长河修复进度",
    units: [
      { unitIndex: 0, landmark: "从中华文", sceneIds: [], quizQuestionCount: 5 },
      { unitIndex: 1, landmark: "三国两晋", sceneIds: ["shangyang-reform"], quizQuestionCount: 5 },
      { unitIndex: 2, landmark: "辽宋夏金", sceneIds: ["qin-centralization","han-wudi-unification"], quizQuestionCount: 5 },
      { unitIndex: 3, landmark: "明清中国", sceneIds: [], quizQuestionCount: 5 },
      { unitIndex: 4, landmark: "晚清时期", sceneIds: ["sui-tang-institutions","opium-war","self-strengthening","sino-japanese-war","wuxu-reform"], quizQuestionCount: 5 },
      { unitIndex: 5, landmark: "辛亥革命", sceneIds: ["yuan-provinces-frontier","xinhai-revolution"] },
      { unitIndex: 6, landmark: "中国共产", sceneIds: ["may-fourth-cpc","revolutionary-road-long-march"] },
      { unitIndex: 7, landmark: "中华民族", sceneIds: ["total-resistance"], quizQuestionCount: 4 },
      { unitIndex: 8, landmark: "中华人民", sceneIds: ["new-china-socialism"] },
      { unitIndex: 9, landmark: "改革开放", sceneIds: ["reform-opening"] },
      { unitIndex: 10, landmark: "中国特色", sceneIds: [] }
    ]
  },
  "gangyao-xia": {
    enabled: true,
    mapIndex: 1,
    filter: "gangyao-xia",
    title: "中外历史纲要（下）长河",
    restorationLabel: "长河修复进度",
    units: [
      { unitIndex: 0, landmark: "古代文明", sceneIds: [] },
      { unitIndex: 1, landmark: "中古时期", sceneIds: [] },
      { unitIndex: 2, landmark: "走向整体", sceneIds: ["age-of-discovery"] },
      { unitIndex: 3, landmark: "资本主义", sceneIds: [], quizQuestionCount: 5 },
      { unitIndex: 4, landmark: "工业革命", sceneIds: ["industrial-revolution"], quizQuestionCount: 5 },
      { unitIndex: 5, landmark: "世界殖民", sceneIds: [], quizQuestionCount: 4 },
      { unitIndex: 6, landmark: "两次世界", sceneIds: ["wwi-postwar-order","october-revolution-nep","wwii-postwar-order"] },
      { unitIndex: 7, landmark: "20世纪", sceneIds: ["cold-war-bipolarity"] },
      { unitIndex: 8, landmark: "当代世界", sceneIds: [] }
    ]
  },
  xuanbi1: {
    enabled: true,
    mapIndex: 2,
    filter: "xuanbi1",
    title: "国家制度与社会治理",
    restorationLabel: "长河修复进度",
    units: [
      { unitIndex: 0, landmark: "政治制度", sceneIds: ["xuanbi1-county-vs-feudal"], quizQuestionCount: 5 },
      { unitIndex: 1, landmark: "官员的选", sceneIds: ["xuanbi1-keju-evolution"], quizQuestionCount: 5 },
      { unitIndex: 2, landmark: "法律与教", sceneIds: ["xuanbi1-ritual-law"], quizQuestionCount: 2 },
      { unitIndex: 3, landmark: "民族关系", sceneIds: ["xuanbi1-frontier-compare"], quizQuestionCount: 1 },
      { unitIndex: 4, landmark: "货币与赋", sceneIds: ["xuanbi1-tax-reform"], quizQuestionCount: 2 },
      { unitIndex: 5, landmark: "基层治理", sceneIds: ["xuanbi1-household"] },
    ]
  },
  xuanbi2: {
    enabled: true,
    mapIndex: 3,
    filter: "xuanbi2",
    title: "经济与社会生活",
    restorationLabel: "长河修复进度",
    units: [
      { unitIndex: 0, landmark: "食物生产", sceneIds: ["xuanbi2-columbian-exchange"], quizQuestionCount: 4 },
      { unitIndex: 1, landmark: "生产工具", sceneIds: ["xuanbi2-factory-system"], quizQuestionCount: 5 },
      { unitIndex: 2, landmark: "商业贸易", sceneIds: ["xuanbi2-silk-road"], quizQuestionCount: 5 },
      { unitIndex: 3, landmark: "村落、城", sceneIds: ["xuanbi2-urbanization"] },
      { unitIndex: 4, landmark: "交通与社", sceneIds: ["xuanbi2-railway"] },
      { unitIndex: 5, landmark: "医疗与公", sceneIds: ["xuanbi2-public-health"], quizQuestionCount: 1 }
    ]
  },
  xuanbi3: {
    enabled: true,
    mapIndex: 4,
    filter: "xuanbi3",
    title: "文化交流与传播",
    restorationLabel: "长河修复进度",
    units: [
      { unitIndex: 0, landmark: "源远流长", sceneIds: ["xuanbi3-confucian-east-asia"], quizQuestionCount: 5 },
      { unitIndex: 1, landmark: "丰富多样", sceneIds: ["xuanbi3-hellenistic"], quizQuestionCount: 5 },
      { unitIndex: 2, landmark: "人口迁徙", sceneIds: ["xuanbi3-migration-identity"], quizQuestionCount: 2 },
      { unitIndex: 3, landmark: "商路、贸", sceneIds: ["xuanbi3-silk-road-culture"] },
      { unitIndex: 4, landmark: "战争与文", sceneIds: ["xuanbi3-colonial-culture"], quizQuestionCount: 1 },
      { unitIndex: 5, landmark: "文化的传", sceneIds: ["xuanbi3-heritage"], quizQuestionCount: 1 }
    ]
  },
  rewards: {
    sceneUnlockMode: "unit-completed",
    stampLabels: {}
  },
  repair: {
    activeLabel: "待订正错题",
    archiveLabel: "已订正记录",
    defaultHint: "先确认题目限定的时间、人物和制度，再排除不属于这一时期的选项。"
  }
};
