# 历史长河 · 高考历史闯关

一个面向各省高考历史学习的闯关答题网页，支持广东、福建、湖北、山东、河南、江西、河北、北京、天津、海南、浙江、安徽、重庆、甘肃、广西、贵州、湖南、江苏、上海、四川、云南、陕西（陕晋青宁合卷）、新疆（新疆西藏合卷）、东北（黑吉辽蒙合卷）、港澳台等25个省区题库。项目采用纯 HTML、CSS、JavaScript 编写，运行无需安装依赖或执行构建命令。

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
├── index.html                  # 入口页（省份选择）
├── 历史长河.html               # 游戏主页面
├── 题库编辑器.html              # 可视化题库管理工具
├── README.md                   # 项目说明
├── AGENTS.md                   # AI 协作规则
├── css/
│   └── styles.css              # 全部样式
├── js/
│   └── app.js                  # 游戏核心逻辑
├── data/
│   ├── provinces/              # 各省独立题库（每省一个完整配置）
│   │   ├── registry.js         # 省份注册表（名称映射、默认省份、文件路径）
│   │   ├── guangdong.js        # 广东省完整配置
│   │   ├── fujian.js           # 福建省完整配置
│   │   └── ...                 # 其余省份
│   ├── 讲历史.js               # 历史现场情境配置（所有省份共用）
│   └── 游戏机制.js              # 游戏关卡与奖励配置（默认配置）
├── documents/
│   ├── 教材目录.md              # 统编版高中历史教材目录
│   ├── 考试大纲.md              # 港澳台联考考试大纲
│   └── 试卷/                   # 整卷档案（按省份拼音分目录）
│       ├── guangdong/           # 广东试卷（9份）
│       └── ...
├── tools/
│   ├── build-history-bank.mjs   # 从试卷重建题库（广东）
│   ├── build-history-bank-*.mjs # 各省专用构建脚本
│   ├── check-project.mjs        # 项目完整性检查
│   ├── smoke-game.mjs           # 核心流程冒烟测试
│   ├── question-dedupe.mjs      # 题目去重库
│   ├── paper-config.json        # 试卷答案与归类配置
│   └── distractor-notes.json    # 错误项辨析库
└── assets/
    ├── 首页/                    # 教材封面图
    ├── 古代史/                  # 中国古代史单元配图
    ├── 近代史/                  # 中国近现代史单元配图
    ├── 世界史/                  # 世界史单元配图
    └── 历史现场/                # 历史情境配图
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

1. 在 `data/provinces/` 下创建 `{省份代码}.js`，包含 PROVINCE_CODE、PROVINCE_NAME、IMG_DATA、EXAM_OUTLINE、PAPERS、MAPS、PROVINCE_SCENE_MAP、PROVINCE_QUIZ_CONFIG 七个常量
2. 在 `data/provinces/registry.js` 中注册该省份（添加名称映射和文件路径）
3. 在 `index.html` 中添加该省份的卡片（标签、链接）
4. 在 `data/讲历史.js` 中补充该省份的历史现场场景（如需）
5. 切换省份时，下拉菜单会自动带上 `?province=xxx` 参数刷新页面

## 内容维护

1. **题目**：通过 `题库编辑器.html` 逐单元编辑，导出后替换 `data/provinces/{省份代码}.js`
2. **历史现场**：在 `data/讲历史.js` 中按教材单元补充 `TEACH_SCENES` 情境
3. **图片**：替换 `assets/` 下同名图片即可（所有图片不超过 300KB）
4. **整卷档案**：整卷资料变更需同时维护 `documents/试卷/{省份}/` 与对应 `tools/paper-config-{省份}.json`，再运行对应的构建脚本写入题库

## 修改后检查

```bash
node --check js/app.js
node --check data/讲历史.js
node --check data/游戏机制.js
node tools/check-project.mjs --province=guangdong
node tools/smoke-game.mjs
```