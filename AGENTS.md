# 项目规则

## 定位

“历史长河”是面向华侨港澳台联考历史学习的纯静态网页游戏；唯一完整游戏页面是 `历史长河.html`，`index.html` 只作为根地址入口。

## 运行

- 无需安装依赖；直接打开 `index.html` 可体验答题和文字口述。
- 麦克风与语音转文字需使用 HTTPS 或在项目根目录运行 `python3 -m http.server 8000` 后访问 `http://localhost:8000/`。
- 通过 URL 参数 `?province=省份代码` 切换省份，例如 `?province=guangdong`。

## 技术与权威文件

- HTML、CSS、原生 JavaScript；没有打包或框架运行时。
- **省份数据目录** `data/provinces/`：各省独立题库文件，每省一个完整配置。
  - `registry.js`：省份注册表（名称映射、默认省份、文件路径）。
  - `{省份代码}.js`：该省完整配置，包含 IMG_DATA、EXAM_OUTLINE、PAPERS、MAPS、PROVINCE_SCENE_MAP、PROVINCE_QUIZ_CONFIG。
- `data/讲历史.js`：历史现场情境素材库（所有省份共用）。
- `data/游戏机制.js`：默认游戏配置（章节、单元、历史现场映射、印章奖励），各省可通过 PROVINCE_SCENE_MAP 和 PROVINCE_QUIZ_CONFIG 覆盖。
- `data/图片映射.js`：通用单元图片映射（可选，各省份文件中也自带 IMG_DATA）。
- `README.md` 的“当前状态”是实现、合并、部署与线上验证状态的权威说明。

## 架构说明（新）

采用"一套框架 + 多省独立数据"的分层架构：

```
框架层（通用，所有省份共用）：
  ├── 历史长河.html / js/app.js / css/styles.css   ← 游戏逻辑与UI
  ├── 题库编辑器.html                                ← 编辑工具
  ├── data/讲历史.js                                  ← 场景素材库
  └── assets/                                         ← 图片资源

省份数据层（各省完全独立）：
  └── data/provinces/
       ├── registry.js       ← 省份注册表
       ├── guangdong.js      ← 广东省完整配置
       ├── fujian.js         ← 福建省完整配置
       └── ...
```

每个省份数据文件包含：
- `PROVINCE_CODE` / `PROVINCE_NAME`：省份标识
- `IMG_DATA`：单元图片映射
- `EXAM_OUTLINE`：考试大纲
- `PAPERS`：整卷档案
- `MAPS`：选择题库（5本地图 → 单元 → 题目）
- `PROVINCE_SCENE_MAP`：单元场景映射（覆盖默认配置）
- `PROVINCE_QUIZ_CONFIG`：单元题量配置（覆盖默认配置）

**旧文件兼容**：`data/{省份}省题库.js` 格式的旧文件仍然保留作为过渡，游戏和工具会优先使用新格式，回退到旧格式。

## 编辑约定

- **普通题库修改**优先使用 `题库编辑器.html`：
  - 支持切换省份编辑，每个省份有独立草稿。
  - 导出后替换 `data/provinces/{省份代码}.js`。
- **整卷资料变更**同时维护 `documents/试卷/{省份}/` 与对应 `tools/paper-config-{省份}.json`，再运行对应的构建脚本写入题库。
- 保留现有 `localStorage` 键；改数据结构时提供兼容迁移。
- 不把本地检查通过表述为已合并、已部署或线上已验证；这些状态必须有 Git 或线上证据。

## 必跑检查

```bash
node --check js/app.js
node --check data/讲历史.js
node --check data/游戏机制.js
node tools/check-project.mjs --province=guangdong
node tools/smoke-game.mjs
```

当前现役题库由原始 Markdown 重建，图表依赖题不会进入 `MAPS`。每题必须带来源和总解析；只对相关或易混的错误项添加不重复的简短辨析，正确项不再重复总解析。辨析应以帮助理解为准，优先说明可核对的时间、人物、制度、事件及其关系，不只写"与题意不符"。当前八份试卷中，2025年两套模拟题附有参考答案，其中二模还附逐题解析；其余六份未附完整标准答案，内容层仍待取得命题方答案后复核，详见 `README.md`。
