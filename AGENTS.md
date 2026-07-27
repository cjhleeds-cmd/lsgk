# 项目规则

## 定位

“历史长河”是面向华侨港澳台联考历史学习的纯静态网页游戏；唯一完整游戏页面是 `历史长河.html`，`index.html` 只作为根地址入口。

## 运行

- 无需安装依赖；直接打开 `index.html` 可体验答题和文字口述。
- 麦克风与语音转文字需使用 HTTPS 或在项目根目录运行 `python3 -m http.server 8000` 后访问 `http://localhost:8000/`。

## 技术与权威文件

- HTML、CSS、原生 JavaScript；没有打包或框架运行时。
- `data/题库.js`：游戏与编辑器共同读取的现役题库。
- `data/讲历史.js`：21个历史现场的内容配置。
- `data/游戏机制.js`：章节、历史现场与主题印章的映射。
- `README.md` 的“当前状态”是实现、合并、部署与线上验证状态的权威说明。

## 编辑约定

- 普通题库修改优先使用 `题库编辑器.html`，导出后替换 `data/题库.js`。
- 整卷资料变更同时维护 `documents/试卷/` 与 `tools/paper-config.json`，再运行 `node tools/build-history-bank.mjs` 写入题库。
- 保留现有 `localStorage` 键；改数据结构时提供兼容迁移。
- 不把本地检查通过表述为已合并、已部署或线上已验证；这些状态必须有 Git 或线上证据。

## 必跑检查

```bash
node --check js/app.js
node --check data/讲历史.js
node --check data/游戏机制.js
node tools/build-history-bank.mjs --check
node tools/check-project.mjs
node tools/smoke-game.mjs
```

当前现役题库由原始 Markdown 重建，图表依赖题不会进入 `MAPS`。每题必须带来源和总解析；只对相关或易混的错误项添加不重复的简短辨析，正确项不再重复总解析。辨析应以帮助理解为准，优先说明可核对的时间、人物、制度、事件及其关系，不只写“与题意不符”。当前八份试卷中，2025年两套模拟题附有参考答案，其中二模还附逐题解析；其余六份未附完整标准答案，内容层仍待取得命题方答案后复核，详见 `README.md`。
