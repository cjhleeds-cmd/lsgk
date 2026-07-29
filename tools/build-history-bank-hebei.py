#!/usr/bin/env python3
"""Build Hebei question bank from paper config."""
import json, re, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK_FILE = os.path.join(ROOT, 'data', '河北省题库.js')
CONFIG_FILE = os.path.join(ROOT, 'tools', 'paper-config-hebei.json')
LETTERS = 'ABCD'

def clean(text=''):
    return str(text).replace('\r', '').strip()

def normalize(text=''):
    return re.sub(r'[\s`*_>""\'\'"，。！？；：、（）()《》〈〉·—…～~]', '',
                  str(text).lower())

def parse_paper(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        raw = f.read().replace('\r', '')
    
    answer_section_at = -1
    m = re.search(r'^##\s+参考答案\s*$', raw, re.MULTILINE)
    if m:
        answer_section_at = m.start()
    
    # Find headings
    headings = []
    for m in re.finditer(r'^###\s+(\d+)(?:[.．、]\s*(.*))?\s*$', raw, re.MULTILINE):
        headings.append({'index': m.start(), 'text': m.group(0), 'number': int(m.group(1)), 'inline': clean(m.group(2) or '')})
    for m in re.finditer(r'^\*\*(\d+)[.．、]\*\*\s*(.*)$', raw, re.MULTILINE):
        headings.append({'index': m.start(), 'text': m.group(0), 'number': int(m.group(1)), 'inline': clean(m.group(2) or '')})
    for m in re.finditer(r'^(\d+)[.．、]\s*(.*?)(?:\s*（\s*）)?\s*$', raw, re.MULTILINE):
        headings.append({'index': m.start(), 'text': m.group(0), 'number': int(m.group(1)), 'inline': clean(m.group(2) or '')})
    
    headings = [h for h in headings if 1 <= h['number'] <= 25]
    headings.sort(key=lambda h: h['index'])
    
    # Deduplicate
    seen = set()
    unique = []
    for h in headings:
        if h['number'] not in seen:
            seen.add(h['number'])
            unique.append(h)
    
    title = '历史试题'
    m = re.search(r'^#\s+(.+)$', raw, re.MULTILINE)
    if m:
        title = m.group(1).strip()
    
    subtitle = '历史试题'
    m = re.search(r'^##\s+(历史[^\n]*)$', raw, re.MULTILINE)
    if m:
        subtitle = m.group(1).strip()
    
    questions = []
    for i, h in enumerate(unique):
        number = h['number']
        start = h['index'] + len(h['text'])
        next_at = unique[i+1]['index'] if i+1 < len(unique) else len(raw)
        end = min(next_at, answer_section_at) if answer_section_at > h['index'] else next_at
        body = clean('\n'.join(filter(None, [h['inline'], raw[start:end]])))
        
        # Find options
        opts = []
        for om in re.finditer(r'^(?:-\s*)?([A-D])[.．、]\s*(.+?)(?:\s{2})?$', body, re.MULTILINE):
            opts.append(clean(om.group(2)))
        
        first_opt_at = -1
        if opts:
            # Find first option position
            m = re.search(r'^(?:-\s*)?([A-D])[.．、]', body, re.MULTILINE)
            if m:
                first_opt_at = m.start()
        
        q = clean(body[:first_opt_at]) if first_opt_at >= 0 else body
        kind = 'choice' if len(opts) == 4 else 'subjective'
        
        questions.append({
            'number': number,
            'kind': kind,
            'q': q,
            'opts': opts,
            'body': body
        })
    
    return {'title': title, 'subtitle': subtitle, 'raw': raw, 'questions': questions}

def question_type(question):
    text = question['q'] + '\n' + '\n'.join(question['opts'])
    if re.search(r'据|材料|记载|指出|认为|说[:：]|表明|反映|说明|可知|主要原因|主要目的是', text):
        return 'material'
    if re.search(r'影响|意义|本质|根本|共同|变化|作用', text):
        return 'thinking'
    return 'basic'

def visual_exclusion_reason(question):
    text = question['q'] + '\n' + question.get('body', '')
    if re.search(r'^\s*\|.*\|\s*$', text, re.MULTILINE):
        return '题干包含表格'
    if re.search(r'下表|表\s*\d|表格', text):
        return '题干依赖表格'
    if re.search(r'下图|如图|图\s*\d|图\s*[A-D]|原卷[^\n]*(?:图|图片)|示意图|下列书法作品|T-O世界地图|瓦尔德泽米勒世界地图', text):
        return '题干依赖图片或示意图'
    return ''

def source_record(label, number, filepath):
    return {'label': f'{label}·第{number}题', 'file': filepath}

def source_label(records):
    return '；'.join(r['label'] for r in records)

def source_trace(records):
    return '；'.join(f"{r['label']}（{r['file']}）" for r in records)

def make_explanation(answer_letter, reason, records):
    return f"【答案 {answer_letter}】{reason}\n【来源】{source_trace(records)}"

def init_maps():
    map_names = [
        '中外历史纲要（上）',
        '中外历史纲要（下）',
        '选择性必修1·国家制度与社会治理',
        '选择性必修2·经济与社会生活',
        '选择性必修3·文化交流与传播'
    ]
    unit_names = [
        ['从中华文明起源到秦汉统一多民族封建国家的建立与巩固', '三国两晋南北朝的民族交融与隋唐统一多民族封建国家的发展', '辽宋夏金多民族政权的并立与元朝的统一', '明清中国版图的奠定与面临的挑战', '晚清时期的内忧外患与救亡图存', '辛亥革命与中华民国的建立', '中国共产党成立与新民主主义革命兴起', '中华民族的抗日战争和人民解放战争', '中华人民共和国成立和社会主义革命与建设', '改革开放与社会主义现代化建设新时期', '中国特色社会主义新时代'],
        ['古代文明的产生与发展', '中古时期的世界', '走向整体的世界', '资本主义制度的确立', '工业革命与马克思主义的诞生', '世界殖民体系与亚非拉民族独立运动', '两次世界大战、十月革命与国际秩序的演变', '20世纪下半叶世界的新变化', '当代世界发展的特点与主要趋势'],
        ['政治制度', '官员的选拔与管理', '法律与教化', '民族关系与国家关系', '货币与赋税制度', '基层治理与社会保障'],
        ['食物生产与社会生活', '生产工具与劳作方式', '商业贸易与日常生活', '村落、城镇与居住环境', '交通与社会变迁', '医疗与公共卫生'],
        ['源远流长的中华文化', '丰富多样的世界文化', '人口迁徙、文化交融与认同', '商路、贸易与文化交流', '战争与文化交锋', '文化的传承与保护']
    ]
    return [{'name': mn, 'units': [{'name': un, 'questions': []} for un in uns]} for mn, uns in zip(map_names, unit_names)]

IMG_DATA = {
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
}

def main():
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    maps = init_maps()
    papers = []
    practice = {}
    exclusions = []
    
    def add_practice_question(question, answer, reason, location, source):
        key = normalize(question['q'])
        mi, ui = map(int, location.split(':'))
        target = maps[mi]['units'][ui]
        
        if key in practice:
            existing = practice[key]
            if existing['answer'] != answer:
                raise ValueError(f"同一题答案不一致：{existing['answer']} / {answer}：{question['q']}")
            if not any(s['label'] == source['label'] for s in existing['sources']):
                existing['sources'].append(source)
            return existing
        
        entry = {
            'key': key,
            'question': {
                'type': question_type(question),
                'q': question['q'],
                'opts': list(question['opts']),
                'ans': answer,
                'explanation': '',
                'optionExplanations': ['', '', '', ''],
                'source': ''
            },
            'answer': answer,
            'reason': reason,
            'mapIndex': mi,
            'unitIndex': ui,
            'sources': [source]
        }
        target['questions'].append(entry['question'])
        practice[key] = entry
        return entry
    
    for paper_config in config['papers']:
        source_path = os.path.join(ROOT, paper_config['file'])
        parsed = parse_paper(source_path)
        choice_questions = [q for q in parsed['questions'] if q['kind'] == 'choice']
        expected_count = len(paper_config['answers'])
        
        # Build a mapping from question number to array index
        # Since chart questions are excluded from answers/locations/reasons,
        # we need to map which question numbers correspond to which array indices
        # The answers array only contains non-chart questions in order
        
        archived_questions = []
        for raw_q in parsed['questions']:
            if raw_q['kind'] != 'choice':
                archived_questions.append({
                    'number': raw_q['number'],
                    'kind': 'subjective',
                    'body': raw_q['body']
                })
                continue
            
            # Check if this question is in the answers array
            # Find the index in answers for this question number
            # Since chart questions are excluded, we need to match by
            # counting non-chart questions up to this number
            nc_idx = 0
            found = False
            for qq in choice_questions:
                if qq['number'] == raw_q['number']:
                    # Check if this is a chart question
                    vreason = visual_exclusion_reason(qq)
                    if vreason:
                        exclusions.append({
                            'source': f"{paper_config['label']}·第{raw_q['number']}题",
                            'type': 'visual',
                            'reason': vreason
                        })
                        archived_questions.append({
                            'number': raw_q['number'],
                            'kind': 'choice',
                            'q': raw_q['q'],
                            'opts': list(raw_q['opts']),
                            'ans': -1,
                            'answer': '?',
                            'explanation': '图表题，已排除',
                            'optionExplanations': ['', '', '', ''],
                            'source': f"{paper_config['label']}·第{raw_q['number']}题",
                            'map': '',
                            'unit': '',
                            'excludedFromPractice': vreason
                        })
                        found = True
                        break
                    else:
                        # This is a non-chart question, use nc_idx
                        if nc_idx >= len(paper_config['answers']):
                            raise ValueError(f"{paper_config['id']} 第{raw_q['number']}题超出答案数组范围")
                        answer_letter = paper_config['answers'][nc_idx]
                        answer = LETTERS.index(answer_letter)
                        location = paper_config['locations'][nc_idx]
                        reason = paper_config['reasons'][nc_idx]
                        
                        mi, ui = map(int, location.split(':'))
                        target_map = maps[mi]
                        target_unit = target_map['units'][ui]
                        
                        src = source_record(paper_config['label'], raw_q['number'], paper_config['file'])
                        
                        archived = {
                            'number': raw_q['number'],
                            'kind': 'choice',
                            'q': raw_q['q'],
                            'opts': list(raw_q['opts']),
                            'ans': answer,
                            'answer': answer_letter,
                            'explanation': make_explanation(answer_letter, reason, [src]),
                            'optionExplanations': ['', '', '', ''],
                            'source': src['label'],
                            'map': target_map['name'],
                            'unit': target_unit['name']
                        }
                        
                        archived_questions.append(archived)
                        add_practice_question(raw_q, answer, reason, location, src)
                        nc_idx += 1
                        found = True
                        break
                elif qq['kind'] == 'choice' and not visual_exclusion_reason(qq):
                    nc_idx += 1
            
            if not found:
                raise ValueError(f"{paper_config['id']} 第{raw_q['number']}题未能匹配")
        
        choice_count = sum(1 for q in archived_questions if q['kind'] == 'choice')
        subjective_count = sum(1 for q in archived_questions if q['kind'] == 'subjective')
        
        full_title = parsed['title']
        if parsed['subtitle'] != '历史试题' or not full_title.endswith('历史试题'):
            full_title = f"{parsed['title']}·{parsed['subtitle']}"
        
        papers.append({
            'id': paper_config['id'],
            'title': full_title,
            'label': paper_config['label'],
            'year': paper_config['year'],
            'category': paper_config['category'],
            'answerStatus': paper_config.get('answerStatus', '原始 Markdown 附答案与解析'),
            'sourceFile': paper_config['file'],
            'choiceCount': choice_count,
            'subjectiveCount': subjective_count,
            'questions': archived_questions,
            'raw': parsed['raw']
        })
    
    # Finalize practice questions
    for entry in practice.values():
        al = LETTERS[entry['answer']]
        entry['question']['source'] = source_label(entry['sources'])
        entry['question']['explanation'] = make_explanation(al, entry['reason'], entry['sources'])
    
    # Build EXAM_OUTLINE
    exam_outline = {
        'title': '统编版高中历史教材（河北高考适用）',
        'sourceFile': 'documents/教材目录.md',
        'maps': [{'name': m['name'], 'units': [u['name'] for u in m['units']]} for m in maps]
    }
    
    # Generate output
    output = f"""/*
 * 历史长河题库 — 河北省
 * 由 tools/build-history-bank-hebei.py 维护。
 * 练习题只取自 documents/试卷/hebei/ 中的试卷。
 * ans 使用 0、1、2、3 分别表示 A、B、C、D。
 */
const IMG_DATA = {json.dumps(IMG_DATA, ensure_ascii=False, indent=2)};

const EXAM_OUTLINE = {json.dumps(exam_outline, ensure_ascii=False, indent=2)};

const PAPERS = {json.dumps(papers, ensure_ascii=False, indent=2)};

const MAPS = {json.dumps(maps, ensure_ascii=False, indent=2)};
"""
    
    summary = {
        'practiceQuestions': len(practice),
        'papers': len(papers),
        'excludedVisual': sum(1 for e in exclusions if e['type'] == 'visual'),
        'excludedQuality': sum(1 for e in exclusions if e['type'] == 'quality'),
        'emptyUnits': []
    }
    
    for mi, m in enumerate(maps):
        for ui, u in enumerate(m['units']):
            if len(u['questions']) == 0:
                summary['emptyUnits'].append({
                    'mapIndex': mi, 'unitIndex': ui,
                    'map': m['name'], 'unit': u['name'], 'count': 0
                })
    
    if '--check' in sys.argv:
        with open(BANK_FILE, 'r', encoding='utf-8') as f:
            current = f.read()
        if current != output:
            print(json.dumps({'status': 'outdated', **summary}, ensure_ascii=False, indent=2))
            sys.exit(1)
        else:
            print(json.dumps({'status': 'current', **summary}, ensure_ascii=False, indent=2))
    else:
        with open(BANK_FILE, 'w', encoding='utf-8') as f:
            f.write(output)
        print(json.dumps({'status': 'written', **summary}, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()