/* 省份注册表 — 历史长河 */
/* 所有可用省份的元数据，用于动态加载和UI展示 */

const PROVINCE_REGISTRY = {
  default: 'guangdong',
  provinces: {
    anhui: { code: 'anhui', name: '安徽省', file: 'anhui.js' },
    beijing: { code: 'beijing', name: '北京市', file: 'beijing.js' },
    chongqing: { code: 'chongqing', name: '重庆市', file: 'chongqing.js' },
    dongbei: { code: 'dongbei', name: '黑龙江省', file: 'dongbei.js' },
    fujian: { code: 'fujian', name: '福建省', file: 'fujian.js' },
    gansu: { code: 'gansu', name: '甘肃省', file: 'gansu.js' },
    gangaotai: { code: 'gangaotai', name: '港澳台', file: 'gangaotai.js' },
    guangdong: { code: 'guangdong', name: '广东省', file: 'guangdong.js' },
    guangxi: { code: 'guangxi', name: '广西', file: 'guangxi.js' },
    guizhou: { code: 'guizhou', name: '贵州省', file: 'guizhou.js' },
    hainan: { code: 'hainan', name: '海南省', file: 'hainan.js' },
    hebei: { code: 'hebei', name: '河北省', file: 'hebei.js' },
    henan: { code: 'henan', name: '河南省', file: 'henan.js' },
    hubei: { code: 'hubei', name: '湖北省', file: 'hubei.js' },
    hunan: { code: 'hunan', name: '湖南省', file: 'hunan.js' },
    jiangsu: { code: 'jiangsu', name: '江苏省', file: 'jiangsu.js' },
    jiangxi: { code: 'jiangxi', name: '江西省', file: 'jiangxi.js' },
    shaanxi: { code: 'shaanxi', name: '陕晋青宁', file: 'shaanxi.js' },
    shandong: { code: 'shandong', name: '山东省', file: 'shandong.js' },
    shanghai: { code: 'shanghai', name: '上海市', file: 'shanghai.js' },
    sichuan: { code: 'sichuan', name: '四川省', file: 'sichuan.js' },
    tianjin: { code: 'tianjin', name: '天津市', file: 'tianjin.js' },
    xinjiang: { code: 'xinjiang', name: '新疆西藏', file: 'xinjiang.js' },
    yunnan: { code: 'yunnan', name: '云南省', file: 'yunnan.js' },
    zhejiang: { code: 'zhejiang', name: '浙江省', file: 'zhejiang.js' }
  },

  // 获取省份信息
  get(code) {
    return this.provinces[code] || null;
  },

  // 获取省份名称
  getName(code) {
    return this.provinces[code]?.name || code;
  },

  // 获取省份数据文件路径
  getFilePath(code) {
    return 'data/provinces/' + (this.provinces[code]?.file || (code + '.js'));
  },

  // 列出所有省份
  list() {
    return Object.values(this.provinces);
  }
};
