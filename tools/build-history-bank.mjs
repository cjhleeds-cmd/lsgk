import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bankFile = path.join(root, 'data', '题库.js');
const configFile = path.join(root, 'tools', 'paper-config.json');
const distractorFile = path.join(root, 'tools', 'distractor-notes.json');
const letters = 'ABCD';

function clean(text = '') {
  return String(text).replace(/\r/g, '').trim();
}

function normalize(text = '') {
  return String(text)
    .normalize('NFKC')
    .replace(/[\s`*_>“”‘’"'，。！？；：、（）()《》〈〉·—…～~]/g, '')
    .toLowerCase();
}

function parsePaper(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/\r/g, '');
  const answerSectionAt = raw.search(/^##\s+参考答案\s*$/m);
  const headings = [
    ...raw.matchAll(/^###\s+(\d+)(?:[.．、]\s*(.*))?\s*$/gm),
    ...raw.matchAll(/^\*\*(\d+)[.．、]\*\*\s*(.*)$/gm)
  ]
    .map(match => ({
      index: match.index,
      text: match[0],
      number: Number(match[1]),
      inline: clean(match[2] || '')
    }))
    .filter(heading => heading.number >= 1 && heading.number <= 25)
    .sort((left, right) => left.index - right.index);
  const title = raw.match(/^#\s+(.+)$/m)?.[1]?.trim() || path.basename(file);
  const subtitle = raw.match(/^##\s+(历史[^\n]*)$/m)?.[1]?.trim() || '历史试题';
  const questions = headings.map((heading, index) => {
    const number = heading.number;
    const start = heading.index + heading.text.length;
    const nextHeadingAt = headings[index + 1]?.index ?? raw.length;
    const end = answerSectionAt > heading.index ? Math.min(nextHeadingAt, answerSectionAt) : nextHeadingAt;
    const body = clean([heading.inline, raw.slice(start, end)].filter(Boolean).join('\n'));
    const options = [...body.matchAll(/^(?:-\s*)?([A-D])[.．、]\s*(.+?)(?:\s{2})?$/gm)];
    const firstOptionAt = options[0]?.index ?? -1;
    const q = clean(firstOptionAt >= 0 ? body.slice(0, firstOptionAt) : body);
    return {
      number,
      kind: options.length === 4 ? 'choice' : 'subjective',
      q,
      opts: options.map(item => clean(item[2])),
      body
    };
  });
  return { title, subtitle, raw, questions };
}

function parseOutline(file, maps) {
  const raw = fs.readFileSync(file, 'utf8').replace(/\r/g, '');
  const title = raw.match(/^#\s+(.+)$/m)?.[1]?.trim() || '华侨港澳台联考历史考试大纲';
  const choiceStart = raw.search(/^####\s+一、选择题\s*$/m);
  const choiceEnd = raw.search(/^####\s+二、材料解析题\s*$/m);
  const choiceSection = choiceStart >= 0 && choiceEnd > choiceStart
    ? raw.slice(choiceStart, choiceEnd)
    : '';
  const headings = [...choiceSection.matchAll(/^\*\*(\d+)\.\*\*\s*(.*)$/gm)];
  const questions = headings.map((heading, index) => {
    const number = Number(heading[1]);
    const start = heading.index + heading[0].length;
    const end = headings[index + 1]?.index ?? choiceSection.length;
    const tail = clean(choiceSection.slice(start, end));
    const body = clean([heading[2], tail].filter(Boolean).join('\n'));
    const options = [...body.matchAll(/^-\s*([A-D])[.．、]\s*(.+)$/gm)];
    const firstOptionAt = options[0]?.index ?? -1;
    return {
      number,
      q: clean(firstOptionAt >= 0 ? body.slice(0, firstOptionAt) : body),
      opts: options.map(item => clean(item[2])),
      body
    };
  });

  const answerSection = raw.match(/###\s+参考答案([\s\S]*)$/)?.[1] || '';
  const answers = {};
  for (const line of answerSection.split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    for (const match of line.matchAll(/(?:^|\|)\s*(\d+)\s*\|\s*([A-D])\s*(?=\|)/g)) {
      answers[Number(match[1])] = match[2];
    }
  }

  return {
    archive: {
      title,
      sourceFile: 'documents/考试大纲.md',
      maps: maps.map(map => ({
        name: map.name,
        units: map.units.map(unit => unit.name)
      })),
      raw
    },
    questions,
    answers
  };
}

function loadScaffold() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(bankFile, 'utf8') + '\nthis.__img = IMG_DATA; this.__maps = MAPS;',
    context
  );
  const img = JSON.parse(JSON.stringify(context.__img));
  const maps = JSON.parse(JSON.stringify(context.__maps));
  for (const map of maps) {
    for (const unit of map.units) unit.questions = [];
  }
  return { img, maps };
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

function makeOptionExplanations(answer, notes = {}) {
  if (clean(notes[letters[answer]] || '')) {
    throw new Error(`正确项 ${letters[answer]} 不应重复总解析：${JSON.stringify(notes)}`);
  }
  const result = [...letters].map((letter, index) => index === answer ? '' : clean(notes[letter] || ''));
  const nonempty = result.filter(Boolean).map(normalize);
  if (new Set(nonempty).size !== nonempty.length) {
    throw new Error(`易混项解析存在重复：${JSON.stringify(notes)}`);
  }
  return result;
}

function makeExplanation(answerLetter, reason, records) {
  return `【答案 ${answerLetter}】${reason}\n【来源】${sourceTrace(records)}`;
}

const qualityExclusions = new Map([
  [
    'history-2026-mock-2:17',
    '答案表述存在史实争议：巴黎公社并非由第一国际直接发动，把它概括为“以马克思主义为指导思想”也不够严谨'
  ]
]);

const outlineLocations = {
  13: '2:0'
};

const outlineReasons = {
  13: '法典形成于古巴比伦王国时期；石柱铭文以国王口吻要求后世遵守其裁定，宣示了国王的最高权威。'
};

const outlineTo2023Paper = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  11: 11,
  12: 12,
  14: 13,
  15: 15,
  16: 16,
  17: 17,
  18: 18,
  19: 19,
  20: 20
};

const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
const distractorNotes = JSON.parse(fs.readFileSync(distractorFile, 'utf8'));
const { img, maps } = loadScaffold();
const papers = [];
const practice = new Map();
const paperEntryLookup = new Map();
const archivedChoiceRefs = [];
const exclusions = [];

function addPracticeQuestion({ question, answer, reason, location, source, notes = {} }) {
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
      optionExplanations: [],
      source: ''
    },
    answer,
    reason,
    notes,
    mapIndex,
    unitIndex,
    sources: [source]
  };
  target.questions.push(entry.question);
  practice.set(key, entry);
  return entry;
}

for (const paperConfig of config.papers) {
  const sourcePath = path.join(root, paperConfig.file);
  const parsed = parsePaper(sourcePath);
  const choiceQuestions = parsed.questions.filter(question => question.kind === 'choice');
  if (choiceQuestions.length !== 20) {
    throw new Error(`${paperConfig.file} 应有 20 道选择题，实际解析出 ${choiceQuestions.length} 道。`);
  }
  if (paperConfig.answers.length !== 20 || paperConfig.locations.length !== 20 || paperConfig.reasons.length !== 20) {
    throw new Error(`${paperConfig.id} 的答案、归类和解析必须各有 20 项。`);
  }

  const archivedQuestions = parsed.questions.map(rawQuestion => {
    if (rawQuestion.kind !== 'choice') {
      return { number: rawQuestion.number, kind: 'subjective', body: rawQuestion.body };
    }

    const index = rawQuestion.number - 1;
    const answerLetter = paperConfig.answers[index];
    const answer = letters.indexOf(answerLetter);
    if (answer < 0) throw new Error(`${paperConfig.id} 第 ${rawQuestion.number} 题答案无效。`);
    const location = paperConfig.locations[index];
    const [mapIndex, unitIndex] = location.split(':').map(Number);
    const targetMap = maps[mapIndex];
    const targetUnit = targetMap?.units[unitIndex];
    if (!targetUnit) throw new Error(`${paperConfig.id} 第 ${rawQuestion.number} 题章节 ${location} 无效。`);

    const source = sourceRecord(paperConfig.label, rawQuestion.number, paperConfig.file);
    const reason = paperConfig.reasons[index];
    const archived = {
      number: rawQuestion.number,
      kind: 'choice',
      q: rawQuestion.q,
      opts: [...rawQuestion.opts],
      ans: answer,
      answer: answerLetter,
      explanation: makeExplanation(answerLetter, reason, [source]),
      optionExplanations: makeOptionExplanations(answer, distractorNotes[`${paperConfig.id}:${rawQuestion.number}`]),
      source: source.label,
      map: targetMap.name,
      unit: targetUnit.name,
      link: null
    };

    const visualReason = visualExclusionReason(rawQuestion);
    const qualityReason = qualityExclusions.get(`${paperConfig.id}:${rawQuestion.number}`) || '';
    if (visualReason || qualityReason) {
      const excludedReason = visualReason || qualityReason;
      archived.excludedFromPractice = excludedReason;
      exclusions.push({
        source: source.label,
        type: visualReason ? 'visual' : 'quality',
        reason: excludedReason
      });
      return archived;
    }

    const entry = addPracticeQuestion({
      question: rawQuestion,
      answer,
      reason,
      location,
      source,
      notes: distractorNotes[`${paperConfig.id}:${rawQuestion.number}`]
    });
    paperEntryLookup.set(`${paperConfig.id}:${rawQuestion.number}`, entry);
    archivedChoiceRefs.push({ archived, entry });
    return archived;
  });

  papers.push({
    id: paperConfig.id,
    title: parsed.subtitle === '历史试题' && /历史试题$/.test(parsed.title)
      ? parsed.title
      : `${parsed.title}·${parsed.subtitle}`,
    label: paperConfig.label,
    year: paperConfig.year,
    category: paperConfig.category,
    answerStatus: paperConfig.answerStatus || '原始 Markdown 未附答案，现答案与解析为人工整理',
    sourceFile: paperConfig.file,
    choiceCount: archivedQuestions.filter(question => question.kind === 'choice').length,
    subjectiveCount: archivedQuestions.filter(question => question.kind === 'subjective').length,
    questions: archivedQuestions,
    raw: parsed.raw
  });
}

const outlineParsed = parseOutline(path.join(root, config.outlineFile), maps);
const outlineLabel = '《历史考试大纲（第4版）》题型示例';
for (const question of outlineParsed.questions) {
  if (question.opts.length !== 4) throw new Error(`考试大纲例题第 ${question.number} 题选项不完整。`);
  const answerLetter = outlineParsed.answers[question.number];
  const answer = letters.indexOf(answerLetter);
  if (answer < 0) throw new Error(`考试大纲例题第 ${question.number} 题缺少有效答案。`);
  if (visualExclusionReason(question)) continue;

  const key = normalize(question.q);
  const mappedPaperNumber = outlineTo2023Paper[question.number];
  const existing = mappedPaperNumber
    ? paperEntryLookup.get(`history-2023:${mappedPaperNumber}`)
    : practice.get(key);
  const source = sourceRecord(outlineLabel, question.number, 'documents/考试大纲.md');
  if (existing) {
    if (existing.answer !== answer) {
      throw new Error(`考试大纲例题第 ${question.number} 题与试卷答案不一致。`);
    }
    existing.sources.push(source);
    continue;
  }

  const location = outlineLocations[question.number];
  const reason = outlineReasons[question.number];
  if (!location || !reason) {
    throw new Error(`考试大纲例题第 ${question.number} 题没有可靠的人工归类或解析，拒绝自动生成。`);
  }
  addPracticeQuestion({
    question,
    answer,
    reason,
    location,
    source,
    notes: distractorNotes[`outline:${question.number}`]
  });
}

for (const entry of practice.values()) {
  const answerLetter = letters[entry.answer];
  entry.question.source = sourceLabel(entry.sources);
  entry.question.explanation = makeExplanation(answerLetter, entry.reason, entry.sources);
  entry.question.optionExplanations = makeOptionExplanations(entry.answer, entry.notes);
}

for (const { archived, entry } of archivedChoiceRefs) {
  const questionIndex = maps[entry.mapIndex].units[entry.unitIndex].questions.indexOf(entry.question);
  archived.link = {
    mapIndex: entry.mapIndex,
    unitIndex: entry.unitIndex,
    questionIndex,
    reused: entry.sources.length > 1
  };
  archived.source = entry.question.source;
  archived.explanation = entry.question.explanation;
  archived.optionExplanations = [...entry.question.optionExplanations];
}

const output = `/*
 * 历史长河题库
 * 由可视化编辑器或 tools/build-history-bank.mjs 维护。
 * 练习题只取自 documents 中的试卷与考试大纲题型示例。
 * ans 使用 0、1、2、3 分别表示 A、B、C、D。
 */
const IMG_DATA = ${JSON.stringify(img, null, 2)};

const EXAM_OUTLINE = ${JSON.stringify(outlineParsed.archive, null, 2)};

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

if (process.argv.includes('--report-exclusions')) {
  console.log(JSON.stringify({ summary, exclusions }, null, 2));
} else if (process.argv.includes('--check')) {
  const current = fs.readFileSync(bankFile, 'utf8');
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
