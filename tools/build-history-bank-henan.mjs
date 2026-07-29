import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bankFile = path.join(root, 'data', '河南省题库.js');
const configFile = path.join(root, 'tools', 'paper-config-henan.json');
const letters = 'ABCD';

function clean(text = '') {
  return String(text).replace(/\r/g, '').trim();
}

function normalize(text = '') {
  return String(text)
    .normalize('NFKC')
    .replace(/[\s`*_>""''"'，。！？；：、（）()《》〈〉·—…～~]/g, '')
    .toLowerCase();
}

// 按试卷标题切分整合文件
function splitPapers(raw) {
  const sections = {};
  const headingRe = /^##\s+(.+?)\s*$/gm;
  const matches = [...raw.matchAll(headingRe)];
  for (let i = 0; i < matches.length; i++) {
    const title = matches[i][1].trim();
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : raw.length;
    sections[title] = raw.slice(start, end);
  }
  return sections;
}

function findSection(sections, paperConfig) {
  // 优先使用 sectionTitle 精确匹配
  if (paperConfig.sectionTitle) {
    return sections[paperConfig.sectionTitle] || null;
  }
  // 根据 label 中的年份匹配 section 标题
  const yearMatch = paperConfig.label.match(/(\d{4})/);
  if (!yearMatch) return null;
  const year = yearMatch[1];
  for (const title of Object.keys(sections)) {
    if (title.includes(year) && !title.includes('模拟') && !title.includes('联考') && !title.includes('质量预测')) {
      return sections[title];
    }
  }
  return null;
}

function parsePaperSection(sectionText, paperConfig) {
  const raw = sectionText;
  const startNumber = paperConfig.startNumber || 1;
  const choiceCount = paperConfig.answers.length;
  // 选择题题号范围
  const minNum = startNumber;
  const maxNum = startNumber + choiceCount - 1;

  // 合并两种题号格式：**1.** 和 1. （行首）
  // 使用统一正则，同时匹配加粗和非加粗
  const headingRe = /^(?:\*\*)?(\d+)[.．、](?:\*\*)?\s+(.*)$/gm;
  const headings = [];
  for (const match of raw.matchAll(headingRe)) {
    const num = Number(match[1]);
    // 只保留选择题范围内的题号
    if (num >= minNum && num <= maxNum) {
      // 排除 "【1题答案】" 等答案部分中的匹配（检查前缀是否为【或*）
      const before = raw.slice(Math.max(0, match.index - 5), match.index);
      if (/【.*\d+题答案/.test(before) || /答案/.test(before)) continue;
      headings.push({
        index: match.index,
        text: match[0],
        number: num,
        inline: clean(match[2] || '')
      });
    }
  }

  // 去重并排序（按文件中出现位置）
  headings.sort((a, b) => a.index - b.index);
  const seen = new Set();
  const unique = [];
  for (const h of headings) {
    if (!seen.has(h.number)) {
      seen.add(h.number);
      unique.push(h);
    }
  }

  const questions = unique.map((heading, idx) => {
    const number = heading.number;
    const start = heading.index + heading.text.length;
    const nextHeadingAt = unique[idx + 1]?.index ?? raw.length;
    const bodyRaw = [heading.inline, raw.slice(start, nextHeadingAt)].filter(Boolean).join('\n');
    const body = clean(bodyRaw);

    // 匹配选项：A. xxx  A．xxx  A xxx 等
    // 选项可能用 tab、多空格或换行分隔
    // 先尝试按行首匹配
    let opts = [];
    const optRe = /(?:^|\n|\t|[ ]{2,})([A-D])[.．、]?\s*(.+?)(?=\t|\n|[ ]{2,}[A-D][.．、]?\s|$)/gs;
    const optMatches = [...body.matchAll(optRe)];
    if (optMatches.length === 4) {
      opts = optMatches.map(item => clean(item[2]));
    } else {
      // 备用：逐行匹配
      const lineRe = /^(?:\s*)([A-D])[.．、]?\s+(.+)$/gm;
      const lineMatches = [...body.matchAll(lineRe)];
      if (lineMatches.length >= 4) {
        opts = lineMatches.slice(0, 4).map(item => clean(item[2]));
      }
    }

    // 找到第一个选项位置来切分题干
    const firstOptMatch = body.match(/(?:^|\n|\t|[ ]{2,})([A-D])[.．、]?\s/);
    const firstOptionAt = firstOptMatch ? firstOptMatch.index + firstOptMatch[0].length - firstOptMatch[0].trimStart().length : -1;
    let q;
    if (firstOptionAt >= 0) {
      // 从第一个选项的字母位置往前找到行首或 tab
      const optLetterPos = body.indexOf(firstOptMatch[1], firstOptMatch.index);
      q = clean(body.slice(0, optLetterPos));
    } else {
      q = clean(body);
    }

    return {
      number,
      kind: opts.length === 4 ? 'choice' : 'subjective',
      q,
      opts,
      body
    };
  });

  return { raw, questions };
}

function questionType(question) {
  const text = `${question.q}\n${question.opts.join('\n')}`;
  if (/据|材料|记载|指出|认为|说[:：]|表明|反映|说明|可知|主要原因|主要目的是/.test(text)) {
    return 'material';
  }
  if (/影响|意义|本质|根本|共同|变化|作用/.test(text)) return 'thinking';
  return 'basic';
}

function visualExclusionReason(question) {
  const text = `${question.q}\n${question.body || ''}`;
  if (/^\s*\|.*\|\s*$/m.test(text)) return '题干包含表格';
  if (/下表|表\s*\d|表格/.test(text)) return '题干依赖表格';
  if (/下图|如图|图\s*\d|图\s*[A-D]|原卷[^\n]*(?:图|图片)|示意图|下列书法作品|T-O世界地图|瓦尔德泽米勒世界地图/.test(text)) {
    return '题干依赖图片或示意图';
  }
  return '';
}

function sourceRecord(label, number, file) {
  return {
    label: `${label}·第${number}题`,
    file
  };
}

function sourceLabel(records) {
  return records.map(record => record.label).join('；');
}

function sourceTrace(records) {
  return records.map(record => `${record.label}（${record.file}）`).join('；');
}

function makeExplanation(answerLetter, reason, records) {
  return `【答案 ${answerLetter}】${reason}\n【来源】${sourceTrace(records)}`;
}

// Initialize MAPS structure
function initMaps() {
  const mapNames = [
    '中外历史纲要（上）',
    '中外历史纲要（下）',
    '选择性必修1·国家制度与社会治理',
    '选择性必修2·经济与社会生活',
    '选择性必修3·文化交流与传播'
  ];
  const unitNames = [
    ['从中华文明起源到秦汉统一多民族封建国家的建立与巩固', '三国两晋南北朝的民族交融与隋唐统一多民族封建国家的发展', '辽宋夏金多民族政权的并立与元朝的统一', '明清中国版图的奠定与面临的挑战', '晚清时期的内忧外患与救亡图存', '辛亥革命与中华民国的建立', '中国共产党成立与新民主主义革命兴起', '中华民族的抗日战争和人民解放战争', '中华人民共和国成立和社会主义革命与建设', '改革开放与社会主义现代化建设新时期', '中国特色社会主义新时代'],
    ['古代文明的产生与发展', '中古时期的世界', '走向整体的世界', '资本主义制度的确立', '工业革命与马克思主义的诞生', '世界殖民体系与亚非拉民族独立运动', '两次世界大战、十月革命与国际秩序的演变', '20世纪下半叶世界的新变化', '当代世界发展的特点与主要趋势'],
    ['政治制度', '官员的选拔与管理', '法律与教化', '民族关系与国家关系', '货币与赋税制度', '基层治理与社会保障'],
    ['食物生产与社会生活', '生产工具与劳作方式', '商业贸易与日常生活', '村落、城镇与居住环境', '交通与社会变迁', '医疗与公共卫生'],
    ['源远流长的中华文化', '丰富多样的世界文化', '人口迁徙、文化交融与认同', '商路、贸易与文化交流', '战争与文化交锋', '文化的传承与保护']
  ];
  return mapNames.map((name, mi) => ({
    name,
    units: unitNames[mi].map(uname => ({ name: uname, questions: [] }))
  }));
}

const IMG_DATA = {
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
  "unit-1-0": "assets/世界史/古代文明.webp",
  "unit-1-1": "assets/世界史/中古时期的世界.webp",
  "unit-1-2": "assets/世界史/走向整体的世界.webp",
  "unit-1-3": "assets/世界史/资本主义制度的确立.webp",
  "unit-1-4": "assets/世界史/工业革命与马克思主义诞生.webp",
  "unit-1-5": "assets/世界史/世界殖民体系的形成与亚非拉民族独立运动.webp",
  "unit-1-6": "assets/世界史/两次世界大战、十月革命与国际秩序的演变.webp",
  "unit-1-7": "assets/世界史/20世纪下半叶世界的新变化.webp",
  "unit-1-8": "assets/世界史/现代.webp",
  "unit-2-0": "assets/历史现场/郡县制与分封制辩论.webp",
  "unit-2-1": "assets/历史现场/科举制演变.webp",
  "unit-2-2": "assets/历史现场/赋税改革因果链.webp",
  "unit-2-3": "assets/历史现场/边疆治理比较.webp",
  "unit-2-4": "assets/历史现场/赋税改革因果链.webp",
  "unit-2-5": "assets/历史现场/编户齐民户籍制度.webp",
  "unit-3-0": "assets/历史现场/哥伦布大交换.webp",
  "unit-3-1": "assets/历史现场/工厂制度革命.webp",
  "unit-3-2": "assets/历史现场/丝绸之路贸易网.webp",
  "unit-3-3": "assets/历史现场/城市化代价.webp",
  "unit-3-4": "assets/历史现场/铁路时代.webp",
  "unit-3-5": "assets/历史现场/公共卫生革命.webp",
  "unit-4-0": "assets/历史现场/儒家文化传播.webp",
  "unit-4-1": "assets/历史现场/希腊化时代.webp",
  "unit-4-2": "assets/历史现场/移民与文化认同.webp",
  "unit-4-3": "assets/历史现场/丝路文化交流.webp",
  "unit-4-4": "assets/历史现场/殖民文化扩张.webp",
  "unit-4-5": "assets/历史现场/文化遗产保护.webp"
};

const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
const maps = initMaps();
const papers = [];
const practice = new Map();
const exclusions = [];

// 读取整合文件并按试卷切分
const fullRaw = fs.readFileSync(path.join(root, 'documents/试卷/henan_full.md'), 'utf8').replace(/\r/g, '');
const sections = splitPapers(fullRaw);

function addPracticeQuestion({ question, answer, reason, location, source }) {
  const key = normalize(question.q);
  const [mapIndex, unitIndex] = location.split(':').map(Number);
  const target = maps[mapIndex]?.units[unitIndex];
  if (!target) throw new Error(`题目章节 ${location} 无效：${question.q.slice(0, 30)}`);
  const existing = practice.get(key);
  if (existing) {
    if (existing.answer !== answer) {
      throw new Error(`同一题答案不一致：${existing.answer} / ${answer}：${question.q}`);
    }
    if (normalize(existing.question.opts.join('|')) !== normalize(question.opts.join('|'))) {
      throw new Error(`同一题选项不一致：${question.q}`);
    }
    if (!existing.sources.some(item => item.label === source.label)) existing.sources.push(source);
    return existing;
  }

  const entry = {
    key,
    question: {
      type: questionType(question),
      q: question.q,
      opts: [...question.opts],
      ans: answer,
      explanation: '',
      optionExplanations: ['', '', '', ''],
      source: ''
    },
    answer,
    reason,
    mapIndex,
    unitIndex,
    sources: [source]
  };
  target.questions.push(entry.question);
  practice.set(key, entry);
  return entry;
}

for (const paperConfig of config.papers) {
  const sectionText = findSection(sections, paperConfig);
  if (!sectionText) {
    console.warn(`警告：找不到 ${paperConfig.label} 对应的试卷段落。`);
    continue;
  }
  const parsed = parsePaperSection(sectionText, paperConfig);
  const choiceQuestions = parsed.questions.filter(question => question.kind === 'choice');
  const startNumber = paperConfig.startNumber || 1;

  console.log(`${paperConfig.id}: 解析出 ${choiceQuestions.length} 道选择题（期望 ${paperConfig.answers.length} 道）`);

  const archivedQuestions = parsed.questions.map(rawQuestion => {
    if (rawQuestion.kind !== 'choice') {
      return { number: rawQuestion.number, kind: 'subjective', body: rawQuestion.body };
    }

    const index = rawQuestion.number - startNumber;
    const answerLetter = paperConfig.answers[index];
    const answer = answerLetter ? letters.indexOf(answerLetter) : -1;

    // 无效答案（图表题等）
    if (answer < 0) {
      const visualReason = visualExclusionReason(rawQuestion);
      if (visualReason || !answerLetter || answerLetter === '?') {
        exclusions.push({ source: `${paperConfig.label}·第${rawQuestion.number}题`, type: 'visual', reason: visualReason || '无答案或图表题' });
        return {
          number: rawQuestion.number,
          kind: 'choice',
          q: rawQuestion.q,
          opts: [...rawQuestion.opts],
          ans: -1,
          answer: '?',
          explanation: '图表题或无答案，已排除',
          optionExplanations: ['', '', '', ''],
          source: `${paperConfig.label}·第${rawQuestion.number}题`,
          map: '',
          unit: '',
          excludedFromPractice: visualReason || '无答案'
        };
      }
      throw new Error(`${paperConfig.id} 第 ${rawQuestion.number} 题答案无效。`);
    }

    const location = paperConfig.locations[index];
    const reason = paperConfig.reasons[index];
    if (!location || !reason) {
      throw new Error(`${paperConfig.id} 第 ${rawQuestion.number} 题缺少归类或解析。`);
    }

    const [mapIndex, unitIndex] = location.split(':').map(Number);
    const targetMap = maps[mapIndex];
    const targetUnit = targetMap?.units[unitIndex];
    if (!targetUnit) throw new Error(`${paperConfig.id} 第 ${rawQuestion.number} 题章节 ${location} 无效。`);

    const source = sourceRecord(paperConfig.label, rawQuestion.number, paperConfig.file);
    const archived = {
      number: rawQuestion.number,
      kind: 'choice',
      q: rawQuestion.q,
      opts: [...rawQuestion.opts],
      ans: answer,
      answer: answerLetter,
      explanation: makeExplanation(answerLetter, reason, [source]),
      optionExplanations: ['', '', '', ''],
      source: source.label,
      map: targetMap.name,
      unit: targetUnit.name
    };

    const visualReason = visualExclusionReason(rawQuestion);
    if (visualReason) {
      archived.excludedFromPractice = visualReason;
      exclusions.push({ source: source.label, type: 'visual', reason: visualReason });
      return archived;
    }

    addPracticeQuestion({ question: rawQuestion, answer, reason, location, source });
    return archived;
  });

  const choiceCount = archivedQuestions.filter(q => q.kind === 'choice').length;
  const subjectiveCount = archivedQuestions.filter(q => q.kind === 'subjective').length;

  papers.push({
    id: paperConfig.id,
    title: paperConfig.label,
    label: paperConfig.label,
    year: paperConfig.year,
    category: paperConfig.category,
    answerStatus: paperConfig.answerStatus || '原始 Markdown 附答案与解析',
    sourceFile: paperConfig.file,
    choiceCount,
    subjectiveCount,
    questions: archivedQuestions,
    raw: parsed.raw
  });
}

// Finalize practice questions
for (const entry of practice.values()) {
  const answerLetter = letters[entry.answer];
  entry.question.source = sourceLabel(entry.sources);
  entry.question.explanation = makeExplanation(answerLetter, entry.reason, entry.sources);
}

// Build EXAM_OUTLINE
const EXAM_OUTLINE = {
  title: "统编版高中历史教材（河南高考适用）",
  sourceFile: "documents/教材目录.md",
  maps: maps.map(map => ({
    name: map.name,
    units: map.units.map(unit => unit.name)
  }))
};

const output = `/*
 * 历史长河题库 — 河南省
 * 由 tools/build-history-bank-henan.mjs 维护。
 * 练习题取自 documents/试卷/henan_full.md 中 2021—2026 年真题及 2025、2026 两套模拟卷。
 * 图表题已转换为文字描述或标记 excludedFromPractice。
 * ans 使用 0、1、2、3 分别表示 A、B、C、D。
 */
const IMG_DATA = ${JSON.stringify(IMG_DATA, null, 2)};

const EXAM_OUTLINE = ${JSON.stringify(EXAM_OUTLINE, null, 2)};

const PAPERS = ${JSON.stringify(papers, null, 2)};

const MAPS = ${JSON.stringify(maps, null, 2)};
`;

const summary = {
  practiceQuestions: practice.size,
  papers: papers.length,
  excludedVisual: exclusions.filter(item => item.type === 'visual').length,
  excludedQuality: exclusions.filter(item => item.type === 'quality').length,
  emptyUnits: maps.flatMap((map, mapIndex) => map.units
    .map((unit, unitIndex) => ({ mapIndex, unitIndex, map: map.name, unit: unit.name, count: unit.questions.length }))
    .filter(unit => unit.count === 0))
};

if (process.argv.includes('--check')) {
  const current = fs.existsSync(bankFile) ? fs.readFileSync(bankFile, 'utf8') : '';
  if (current !== output) {
    console.error(JSON.stringify({ status: 'outdated', ...summary }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ status: 'current', ...summary }, null, 2));
  }
} else {
  fs.writeFileSync(bankFile, output, 'utf8');
  console.log(JSON.stringify({ status: 'written', ...summary }, null, 2));
}
