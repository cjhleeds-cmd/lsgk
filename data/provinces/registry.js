/* 省份注册表 — 历史长河 */
/* 所有可用省份的元数据，用于动态加载和UI展示 */

const PROVINCE_REGISTRY = {
  default: 'guangdong',
  provinces: {
    guangdong: { code: 'guangdong', name: '广东省', file: 'guangdong.js' },
    fujian: { code: 'fujian', name: '福建省', file: 'fujian.js' },
    hubei: { code: 'hubei', name: '湖北省', file: 'hubei.js' },
    shandong: { code: 'shandong', name: '山东省', file: 'shandong.js' },
    henan: { code: 'henan', name: '河南省', file: 'henan.js' },
    jiangxi: { code: 'jiangxi', name: '江西省', file: 'jiangxi.js' },
    hebei: { code: 'hebei', name: '河北省', file: 'hebei.js' },
    jiangsu: { code: 'jiangsu', name: '江苏省', file: 'jiangsu.js' },
    hunan: { code: 'hunan', name: '湖南省', file: 'hunan.js' },
    chongqing: { code: 'chongqing', name: '重庆市', file: 'chongqing.js' },
    anhui: { code: 'anhui', name: '安徽省', file: 'anhui.js' },
    guangxi: { code: 'guangxi', name: '广西', file: 'guangxi.js' },
    tianjin: { code: 'tianjin', name: '天津市', file: 'tianjin.js' },
    sichuan: { code: 'sichuan', name: '四川省', file: 'sichuan.js' },
    yunnan: { code: 'yunnan', name: '云南省', file: 'yunnan.js' }
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
