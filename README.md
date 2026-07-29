# 历史长河 · 高考历史闯关

一个面向各省高考历史学习的闯关答题网页，支持广东、江苏、福建、湖北、山东、河南、江西等多省题库。项目采用纯 HTML、CSS、JavaScript 编写，运行无需安装依赖或执行构建命令。

## 当前状态

| 省份 | 题目数 | 历史现场 | 访问方式 |
|---|---|---|---|
| 广东 | 67 题 | 20 幕 | `?province=guangdong`（默认） |
| 江苏 | 92 题 | 24 幕 | `?province=jiangsu` |
| 福建 | 70 题 | 34 幕 | `?province=fujian` |
| 湖北 | 70 题 | 30 幕 | `?province=hubei` |
| 山东 | 60 题 | 45 幕 | `?province=shandong` |
| 河南 | 103 题 | 30 幕 | `?province=henan` |
| 江西 | 83 题 | 33 幕 | `?province=jiangxi` |

| 项目 | 说明 |
|---|---|
| 教材框架 | 5 本教材 / 38 个单元 |
| 历史现场 | 53 幕情境体验（各省独立配置） |

## 项目结构

```
gaokao-history/
├── index.html                  # 入口页
├── 历史长河.html               # 游戏主页面
├── 题库编辑器.html              # 可视化题库管理工具
├── README.md                   # 项目说明
├── AGENTS.md                   # AI 协作规则
├── css/
│   └── styles.css              # 全部样式
├── js/
│   └── app.js                  # 游戏核心逻辑
├── data/
│   ├── 广东省题库.js             # 当前省份完整题库（含题目、试卷档案、考试大纲）
│   ├── 讲历史.js               # 历史现场情境配置
│   ├── 游戏机制.js              # 游戏关卡与奖励配置
│   └── provinces/              # 各省份题库备份（各自独立，不混叠）
│       └── guangdong.js        # 广东新高考题库（备用，当前未加载）
├── documents/
│   ├── 考试大纲.md              # 联考考试大纲
│   └── 试卷/                   # 整卷档案
│       └── guangdong/           # 广东试卷（9份）
├── tools/
│   ├── build-history-bank.mjs   # 从试卷重建题库
│   ├── check-project.mjs        # 项目完整性检查
│   ├── smoke-game.mjs           # 核心流程冒烟测试
│   ├── question-dedupe.mjs      # 题目去重库
│   ├── audit-question-duplicates.mjs  # 重复题审计
│   ├── paper-config.json        # 试卷答案与归类配置
│   ├── distractor-notes.json    # 错误项辨析库
│   └── convert-province-bank.html  # 省份题库转换工具
└── assets/
    ├── 首页/                    # 5 本教材封面图
    ├── 古代史/                  # 中国古代史单元配图
    ├── 近代史/                  # 中国近现代史单元配图
    ├── 世界史/                  # 世界史单元配图
    └── 历史现场/                # 39 幕历史情境配图
```

## 运行方式

```bash
# 直接打开
双击 index.html 或 历史长河.html

# 本地服务器（需要麦克风时）
python3 -m http.server 8000
# 访问 http://localhost:8000/
```

## 扩展其他省份

各省题库互相独立，不共享题目。切换省份时，通过 URL 参数 `?province=xxx` 加载对应省份题库即可。

1. 在 `documents/试卷/{省份}/` 下放入该省份的整卷 Markdown
2. 在 `tools/paper-config.json` 中配置该省份的试卷与答案
3. 运行 `node tools/build-history-bank.mjs` 生成该省份完整题库（输出为 `data/{省份}省题库.js`）
4. 在 `历史长河.html` 的 `nameMap` 中注册该省份名称映射
5. 切换省份时，下拉菜单会自动带上 `?province=xxx` 参数刷新页面

## 内容维护

1. **题目**：通过 `题库编辑器.html` 逐单元编辑，或批量导入 Markdown 试卷后导出替换 `data/广东省题库.js`
2. **历史现场**：在 `data/讲历史.js` 中按教材单元补充 `TEACH_SCENES` 情境
3. **图片**：替换 `assets/` 下同名图片即可
4. **整卷档案**：整卷资料变更需同时维护 `documents/试卷/{省份}/` 与 `tools/paper-config.json`

## 修改后检查

```bash
node tools/build-history-bank.mjs --check
node tools/check-project.mjs
node tools/smoke-game.mjs
```