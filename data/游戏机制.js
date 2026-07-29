// 高考历史闯关游戏化配置
// 五本教材共用"修复时代节点—开放历史现场—完成口述获得印章"的规则。
const HISTORY_GAME_CONFIG = {
  version: 6,
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
      { unitIndex: 1, landmark: "三国两晋", sceneIds: ["shangyang-reform"], quizQuestionCount: 3 },
      { unitIndex: 2, landmark: "辽宋夏金", sceneIds: ["qin-centralization","han-wudi-unification","wang-anshi-reform","qin-han-finance","water-conservancy-governance"], quizQuestionCount: 3 },
      { unitIndex: 3, landmark: "明清中国", sceneIds: ["ming-qing-thought"], quizQuestionCount: 2 },
      { unitIndex: 4, landmark: "晚清时期", sceneIds: ["sui-tang-institutions","opium-war","self-strengthening","sino-japanese-war","wuxu-reform"], quizQuestionCount: 4 },
      { unitIndex: 5, landmark: "辛亥革命", sceneIds: ["yuan-provinces-frontier","xinhai-revolution"], quizQuestionCount: 2 },
      { unitIndex: 6, landmark: "中国共产", sceneIds: ["may-fourth-cpc","revolutionary-road-long-march","soviet-base-construction"], quizQuestionCount: 3 },
      { unitIndex: 7, landmark: "中华民族", sceneIds: ["total-resistance"], quizQuestionCount: 2 },
      { unitIndex: 8, landmark: "中华人民", sceneIds: ["new-china-socialism"], quizQuestionCount: 1 },
      { unitIndex: 9, landmark: "改革开放", sceneIds: ["reform-opening"], quizQuestionCount: 4 },
      { unitIndex: 10, landmark: "中国特色", sceneIds: [], quizQuestionCount: 1 }
    ]
  },
  "gangyao-xia": {
    enabled: true,
    mapIndex: 1,
    filter: "gangyao-xia",
    title: "中外历史纲要（下）长河",
    restorationLabel: "长河修复进度",
    units: [
      { unitIndex: 0, landmark: "古代文明", sceneIds: [], quizQuestionCount: 1 },
      { unitIndex: 1, landmark: "中古时期", sceneIds: [] },
      { unitIndex: 2, landmark: "走向整体", sceneIds: ["age-of-discovery"], quizQuestionCount: 2 },
      { unitIndex: 3, landmark: "资本主义", sceneIds: ["napoleon-european-reform"], quizQuestionCount: 2 },
      { unitIndex: 4, landmark: "工业革命", sceneIds: ["industrial-revolution"], quizQuestionCount: 2 },
      { unitIndex: 5, landmark: "世界殖民", sceneIds: [], quizQuestionCount: 3 },
      { unitIndex: 6, landmark: "两次世界", sceneIds: ["wwi-postwar-order","october-revolution-nep","wwii-postwar-order"], quizQuestionCount: 4 },
      { unitIndex: 7, landmark: "20世纪", sceneIds: ["cold-war-bipolarity","postwar-welfare-state"], quizQuestionCount: 5 },
      { unitIndex: 8, landmark: "当代世界", sceneIds: [], quizQuestionCount: 1 }
    ]
  },
  xuanbi1: {
    enabled: true,
    mapIndex: 2,
    filter: "xuanbi1",
    title: "国家制度与社会治理",
    restorationLabel: "长河修复进度",
    units: [
      { unitIndex: 0, landmark: "政治制度", sceneIds: ["xuanbi1-county-vs-feudal"], quizQuestionCount: 2 },
      { unitIndex: 1, landmark: "官员的选", sceneIds: ["xuanbi1-keju-evolution"], quizQuestionCount: 1 },
      { unitIndex: 2, landmark: "法律与教", sceneIds: ["xuanbi1-ritual-law"] },
      { unitIndex: 3, landmark: "民族关系", sceneIds: ["xuanbi1-frontier-compare"], quizQuestionCount: 2 },
      { unitIndex: 4, landmark: "货币与赋", sceneIds: ["xuanbi1-tax-reform"], quizQuestionCount: 1 },
      { unitIndex: 5, landmark: "基层治理", sceneIds: ["xuanbi1-household"], quizQuestionCount: 1 }
    ]
  },
  xuanbi2: {
    enabled: true,
    mapIndex: 3,
    filter: "xuanbi2",
    title: "经济与社会生活",
    restorationLabel: "长河修复进度",
    units: [
      { unitIndex: 0, landmark: "食物生产", sceneIds: ["xuanbi2-columbian-exchange"], quizQuestionCount: 1 },
      { unitIndex: 1, landmark: "生产工具", sceneIds: ["xuanbi2-factory-system"], quizQuestionCount: 1 },
      { unitIndex: 2, landmark: "商业贸易", sceneIds: ["xuanbi2-silk-road"], quizQuestionCount: 2 },
      { unitIndex: 3, landmark: "村落、城", sceneIds: ["xuanbi2-urbanization"] },
      { unitIndex: 4, landmark: "交通与社", sceneIds: ["xuanbi2-railway"], quizQuestionCount: 1 },
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
      { unitIndex: 0, landmark: "源远流长", sceneIds: ["xuanbi3-confucian-east-asia"], quizQuestionCount: 1 },
      { unitIndex: 1, landmark: "丰富多样", sceneIds: ["xuanbi3-diverse-civilizations"], quizQuestionCount: 1 },
      { unitIndex: 2, landmark: "人口迁徙", sceneIds: ["xuanbi3-migration-identity"] },
      { unitIndex: 3, landmark: "商路、贸", sceneIds: ["xuanbi3-silk-road-culture"], quizQuestionCount: 1 },
      { unitIndex: 4, landmark: "战争与文", sceneIds: ["xuanbi3-colonial-culture","xuanbi3-gunpowder-global"], quizQuestionCount: 1 },
      { unitIndex: 5, landmark: "文化的传", sceneIds: ["xuanbi3-heritage","archaeology-civilization","inscription-memory"] }
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

// 省份历史现场覆盖配置
// key 为省份代码，value 为 { mapKey: { unitIndex: [sceneId...] } }
// 未列出的省份使用 HISTORY_GAME_CONFIG 中的默认 sceneIds
const PROVINCE_SCENE_OVERRIDES = {
  // 广东省：基于广东题库各单元知识点与非选择题高频考点配置
  guangdong: {
    "gangyao-shang": {
      0: ["shangyang-reform","qin-centralization","han-wudi-unification","qin-han-finance"],
      1: ["sui-tang-institutions"],
      2: ["wang-anshi-reform","yuan-provinces-frontier"],
      3: ["ming-qing-thought"],
      4: ["opium-war","self-strengthening","sino-japanese-war","wuxu-reform"],
      5: ["xinhai-revolution"],
      6: ["may-fourth-cpc","revolutionary-road-long-march","soviet-base-construction"],
      7: ["total-resistance"],
      8: ["new-china-socialism"],
      9: ["reform-opening"]
    },
    "gangyao-xia": {
      2: ["age-of-discovery"],
      3: ["napoleon-european-reform"],
      4: ["industrial-revolution"],
      6: ["wwi-postwar-order","october-revolution-nep","wwii-postwar-order"],
      7: ["cold-war-bipolarity","postwar-welfare-state"]
    },
    xuanbi1: {
      0: ["xuanbi1-county-vs-feudal"],
      1: ["xuanbi1-keju-evolution"],
      3: ["xuanbi1-frontier-compare"],
      4: ["xuanbi1-tax-reform"],
      5: ["xuanbi1-household"]
    },
    xuanbi2: {
      0: ["xuanbi2-columbian-exchange"],
      1: ["xuanbi2-factory-system"],
      2: ["xuanbi2-silk-road"],
      4: ["xuanbi2-railway"],
      5: ["xuanbi2-public-health"]
    },
    xuanbi3: {
      0: ["xuanbi3-confucian-east-asia"],
      1: ["xuanbi3-diverse-civilizations"],
      3: ["xuanbi3-silk-road-culture"],
      4: ["xuanbi3-colonial-culture"]
    }
  },

  // 江苏省：基于江苏题库各单元知识点与非选择题高频考点配置
  jiangsu: {
    "gangyao-shang": {
      0: ["shangyang-reform","qin-centralization","han-wudi-unification"],
      1: ["sui-tang-institutions"],
      2: ["wang-anshi-reform"],
      3: ["ming-qing-thought"],
      4: ["opium-war","self-strengthening","wuxu-reform"],
      5: ["xinhai-revolution"],
      6: ["may-fourth-cpc","revolutionary-road-long-march","soviet-base-construction"],
      7: ["total-resistance"],
      8: ["new-china-socialism"],
      9: ["reform-opening"]
    },
    "gangyao-xia": {
      2: ["age-of-discovery"],
      3: ["napoleon-european-reform"],
      4: ["industrial-revolution"],
      6: ["october-revolution-nep","wwii-postwar-order"],
      7: ["cold-war-bipolarity","postwar-welfare-state"]
    },
    xuanbi1: {
      0: ["xuanbi1-county-vs-feudal"],
      1: ["xuanbi1-keju-evolution"],
      2: ["xuanbi1-ritual-law"],
      3: ["xuanbi1-frontier-compare"],
      4: ["xuanbi1-tax-reform"],
      5: ["xuanbi1-household"]
    },
    xuanbi2: {
      0: ["xuanbi2-columbian-exchange"],
      2: ["xuanbi2-silk-road"],
      3: ["xuanbi2-urbanization"],
      5: ["xuanbi2-public-health"]
    },
    xuanbi3: {
      0: ["xuanbi3-confucian-east-asia"],
      1: ["xuanbi3-diverse-civilizations"],
      2: ["xuanbi3-migration-identity"],
      3: ["xuanbi3-silk-road-culture"],
      4: ["xuanbi3-colonial-culture","xuanbi3-gunpowder-global"],
      5: ["xuanbi3-heritage"]
    }
  },

  // 福建省：基于福建非选择题与选择题覆盖分析，排除空单元场景
  fujian: {
    "gangyao-shang": {
      1: ["shangyang-reform"],
      2: ["qin-centralization","han-wudi-unification","wang-anshi-reform","qin-han-finance"],
      3: ["ming-qing-thought"],
      4: ["sui-tang-institutions","opium-war","self-strengthening","sino-japanese-war","wuxu-reform"],
      5: ["yuan-provinces-frontier","xinhai-revolution"],
      6: ["may-fourth-cpc","revolutionary-road-long-march","soviet-base-construction"],
      7: ["total-resistance"],
      8: ["new-china-socialism"],
      9: ["reform-opening"]
    },
    "gangyao-xia": {
      2: ["age-of-discovery"],
      4: ["industrial-revolution"],
      6: ["wwii-postwar-order"],
      7: ["cold-war-bipolarity"]
    },
    xuanbi1: {
      0: ["xuanbi1-county-vs-feudal"],
      1: ["xuanbi1-keju-evolution"],
      2: ["xuanbi1-ritual-law"],
      3: ["xuanbi1-frontier-compare"],
      4: ["xuanbi1-tax-reform"]
    },
    xuanbi2: {
      2: ["xuanbi2-silk-road"],
      5: ["xuanbi2-public-health"]
    },
    xuanbi3: {
      3: ["xuanbi3-silk-road-culture"],
      5: ["xuanbi3-heritage","archaeology-civilization","inscription-memory"]
    }
  },

  // 湖北省：基于湖北非选择题与选择题覆盖分析，排除空单元及冗余场景
  hubei: {
    "gangyao-shang": {
      1: ["shangyang-reform"],
      2: ["qin-centralization","han-wudi-unification","wang-anshi-reform","qin-han-finance","water-conservancy-governance"],
      3: ["ming-qing-thought"],
      4: ["sui-tang-institutions","opium-war","self-strengthening","sino-japanese-war","wuxu-reform"],
      5: ["yuan-provinces-frontier","xinhai-revolution"],
      6: ["may-fourth-cpc","revolutionary-road-long-march","soviet-base-construction"],
      7: ["total-resistance"],
      8: ["new-china-socialism"],
      9: ["reform-opening"]
    },
    "gangyao-xia": {
      3: ["napoleon-european-reform"],
      4: ["industrial-revolution"],
      6: ["wwii-postwar-order"],
      7: ["cold-war-bipolarity","postwar-welfare-state"]
    },
    xuanbi1: {
      0: ["xuanbi1-county-vs-feudal"],
      1: ["xuanbi1-keju-evolution"],
      2: ["xuanbi1-ritual-law"],
      3: ["xuanbi1-frontier-compare"],
      4: ["xuanbi1-tax-reform"]
    },
    xuanbi2: {
      0: ["xuanbi2-columbian-exchange"],
      1: ["xuanbi2-factory-system"],
      2: ["xuanbi2-silk-road"],
      3: ["xuanbi2-urbanization"]
    },
    xuanbi3: {
      0: ["xuanbi3-confucian-east-asia"],
      1: ["xuanbi3-diverse-civilizations"],
      2: ["xuanbi3-migration-identity"],
      4: ["xuanbi3-colonial-culture"],
      5: ["xuanbi3-heritage"]
    }
  },

  // 山东省：基于山东非选择题高频考点配置，排除3个关联薄弱场景
  // 排除：ming-qing-secretariat（明清中枢，山东无相关题）、
  //       egypt-hittite-peace（古埃及赫梯，山东无相关题）、
  //       sui-tang-institutions（隋唐制度错位放在晚清单元）
  shandong: {
    "gangyao-shang": {
      1: ["shangyang-reform"],
      2: ["qin-centralization","han-wudi-unification","qin-han-finance","water-conservancy-governance"],
      3: ["ming-qing-thought"],
      4: ["opium-war","self-strengthening","sino-japanese-war","wuxu-reform"],
      5: ["yuan-provinces-frontier","xinhai-revolution"],
      6: ["may-fourth-cpc","revolutionary-road-long-march","soviet-base-construction"],
      7: ["total-resistance"],
      8: ["new-china-socialism"],
      9: ["reform-opening"]
    },
    "gangyao-xia": {
      2: ["age-of-discovery"],
      3: ["napoleon-european-reform"],
      4: ["industrial-revolution"],
      6: ["wwi-postwar-order","october-revolution-nep","wwii-postwar-order"],
      7: ["cold-war-bipolarity","postwar-welfare-state"]
    },
    xuanbi1: {
      0: ["xuanbi1-county-vs-feudal"],
      1: ["xuanbi1-keju-evolution"],
      2: ["xuanbi1-ritual-law"],
      3: ["xuanbi1-frontier-compare"],
      4: ["xuanbi1-tax-reform"],
      5: ["xuanbi1-household"]
    },
    xuanbi2: {
      0: ["xuanbi2-columbian-exchange"],
      2: ["xuanbi2-silk-road"],
      3: ["xuanbi2-urbanization"],
      5: ["xuanbi2-public-health"]
    },
    xuanbi3: {
      0: ["xuanbi3-confucian-east-asia"],
      1: ["xuanbi3-diverse-civilizations"],
      3: ["xuanbi3-silk-road-culture"],
      5: ["xuanbi3-heritage","archaeology-civilization","inscription-memory"]
    }
  },

  // 河南省：基于河南非选择题高频考点配置
  // 新增：ancient-agriculture-compare（古代农业中西对比，2024/2026真题）
  //       decolonization-third-world（第三世界非殖民化，2021/2022/2026真题+模拟）
  //       medieval-city-burgher（中古城市与市民阶层，2025模拟）
  // 排除：wang-anshi-reform（王安石变法）、water-conservancy-governance（水利治理）、
  //       napoleon-european-reform（拿破仑战争）、postwar-welfare-state（福利国家）、
  //       xuanbi1-frontier-compare（边疆治理）、xuanbi2-railway（铁路时代）、
  //       xuanbi3-heritage（文化遗产）、inscription-memory（碑刻）、
  //       xuanbi3-migration-identity（人口迁徙）、
  //       wwii-postwar-order（二战，河南非选择题直接涉及较少）、
  //       xuanbi2-public-health（公共卫生，河南选必2 unit 5 为空单元且无相关非选择题）
  henan: {
    "gangyao-shang": {
      1: ["shangyang-reform"],
      2: ["qin-centralization","han-wudi-unification","qin-han-finance"],
      3: ["ming-qing-thought"],
      4: ["opium-war","self-strengthening","sino-japanese-war","wuxu-reform"],
      5: ["xinhai-revolution"],
      6: ["may-fourth-cpc","revolutionary-road-long-march","soviet-base-construction"],
      7: ["total-resistance"],
      8: ["new-china-socialism"],
      9: ["reform-opening"]
    },
    "gangyao-xia": {
      2: ["age-of-discovery"],
      4: ["industrial-revolution"],
      5: ["decolonization-third-world"],
      6: ["wwi-postwar-order"],
      7: ["cold-war-bipolarity"]
    },
    xuanbi1: {
      0: ["xuanbi1-county-vs-feudal"],
      1: ["xuanbi1-keju-evolution"],
      2: ["xuanbi1-ritual-law"],
      4: ["xuanbi1-tax-reform"],
      5: ["xuanbi1-household"]
    },
    xuanbi2: {
      0: ["ancient-agriculture-compare"],
      1: ["xuanbi2-factory-system"],
      2: ["xuanbi2-silk-road"],
      3: ["medieval-city-burgher"]
    },
    xuanbi3: {
      0: ["xuanbi3-confucian-east-asia"],
      1: ["xuanbi3-diverse-civilizations"],
      3: ["xuanbi3-silk-road-culture"],
      4: ["xuanbi3-colonial-culture"]
    }
  },

  // 江西省：基于江西题库各单元知识点与非选择题高频考点配置
  jiangxi: {
    "gangyao-shang": {
      0: ["shangyang-reform","qin-centralization","han-wudi-unification"],
      1: ["sui-tang-institutions"],
      2: ["wang-anshi-reform","yuan-provinces-frontier"],
      3: ["ming-qing-thought"],
      4: ["opium-war","self-strengthening","sino-japanese-war","wuxu-reform"],
      5: ["xinhai-revolution"],
      6: ["may-fourth-cpc","revolutionary-road-long-march","soviet-base-construction"],
      7: ["total-resistance"],
      8: ["new-china-socialism"],
      9: ["reform-opening"]
    },
    "gangyao-xia": {
      2: ["age-of-discovery"],
      3: ["napoleon-european-reform"],
      4: ["industrial-revolution"],
      6: ["wwi-postwar-order","october-revolution-nep","wwii-postwar-order"],
      7: ["cold-war-bipolarity"]
    },
    xuanbi1: {
      0: ["xuanbi1-county-vs-feudal"],
      1: ["xuanbi1-keju-evolution"],
      2: ["xuanbi1-ritual-law"],
      4: ["xuanbi1-tax-reform"],
      5: ["xuanbi1-household"]
    },
    xuanbi2: {
      2: ["xuanbi2-silk-road"]
    },
    xuanbi3: {
      0: ["xuanbi3-confucian-east-asia"],
      3: ["xuanbi3-silk-road-culture"]
    }
  },

  // 河北省：基于河北题库各单元知识点与非选择题高频考点配置
  hebei: {
    "gangyao-shang": {
      0: ["shangyang-reform","qin-centralization","han-wudi-unification","qin-han-finance"],
      1: ["sui-tang-institutions"],
      2: ["wang-anshi-reform","yuan-provinces-frontier","water-conservancy-governance"],
      3: ["ming-qing-thought"],
      4: ["opium-war","self-strengthening","sino-japanese-war","wuxu-reform"],
      5: ["xinhai-revolution"],
      6: ["may-fourth-cpc","revolutionary-road-long-march","soviet-base-construction"],
      7: ["total-resistance"],
      8: ["new-china-socialism"],
      9: ["reform-opening"]
    },
    "gangyao-xia": {
      2: ["age-of-discovery"],
      3: ["napoleon-european-reform"],
      4: ["industrial-revolution"],
      5: ["decolonization-third-world"],
      6: ["wwi-postwar-order","october-revolution-nep","wwii-postwar-order"],
      7: ["cold-war-bipolarity","postwar-welfare-state"]
    },
    xuanbi1: {
      0: ["xuanbi1-county-vs-feudal"],
      1: ["xuanbi1-keju-evolution"],
      2: ["xuanbi1-ritual-law"],
      3: ["xuanbi1-frontier-compare"],
      4: ["xuanbi1-tax-reform"],
      5: ["xuanbi1-household"]
    },
    xuanbi2: {
      0: ["xuanbi2-columbian-exchange","ancient-agriculture-compare"],
      1: ["xuanbi2-factory-system"],
      2: ["xuanbi2-silk-road"],
      3: ["xuanbi2-urbanization"],
      4: ["xuanbi2-railway"],
      5: ["xuanbi2-public-health"]
    },
    xuanbi3: {
      0: ["xuanbi3-confucian-east-asia"],
      2: ["xuanbi3-migration-identity"],
      3: ["xuanbi3-silk-road-culture"],
      5: ["xuanbi3-heritage"]
    }
  }
};

// 省份通关题数覆盖配置
// key 为省份代码，value 为 { mapKey: { unitIndex: quizQuestionCount } }
// null 表示取消该单元的 quizQuestionCount（适用于题池为0的单元）
// 未列出的省份/单元使用 HISTORY_GAME_CONFIG 中的默认 quizQuestionCount
const PROVINCE_QUIZ_OVERRIDES = {
  hebei: {
    "gangyao-shang": {
      1: 2,
      3: null,
      5: 1,
      8: 3,
      9: 2,
      10: null
    },
    "gangyao-xia": {
      1: 1,
      2: 1,
      5: null
    },
    xuanbi1: {
      0: 3,
      1: 1,
      2: 1,
      3: 1,
      4: 1,
      5: 2
    },
    xuanbi2: {
      0: 1,
      1: 2,
      2: 4,
      3: null,
      4: 1,
      5: 1
    },
    xuanbi3: {
      0: 3,
      1: null,
      2: 1,
      3: 1,
      4: null,
      5: null
    }
  },

  // 广东省：根据重建后题库实际题量调整
  guangdong: {
    "gangyao-shang": {
      6: 2,
      9: 3
    },
    "gangyao-xia": {
      7: 4
    },
    xuanbi2: {
      0: null,
      4: null,
      5: null
    },
    xuanbi3: {
      4: null
    }
  }
};
