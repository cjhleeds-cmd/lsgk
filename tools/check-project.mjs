import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { questionSimilarity } from './question-dedupe.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const failures=[];
const warnings=[];
const fail=message=>failures.push(message);
const warn=message=>warnings.push(message);
const relative=file=>path.relative(root,file).split(path.sep).join('/');
const normalizeText=text=>String(text||'')
  .normalize('NFKC')
  .replace(/[\s`*_>“”‘’"'，。！？；：、（）()《》〈〉·—…～~]/g,'')
  .toLowerCase();
const cleanExplanation=text=>String(text||'')
  .replace(/^【答案\s*[A-D]】\s*/,'')
  .replace(/^解析[：:]\s*/,'')
  .replace(/\n?【来源】[\s\S]*$/,'')
  .trim();

function walk(directory){
  return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
    const file=path.join(directory,entry.name);
    return entry.isDirectory()?walk(file):[file];
  });
}

function loadData(){
  const context={};
  vm.createContext(context);
  for(const file of ['data/题库.js','data/讲历史.js','data/游戏机制.js']){
    const source=fs.readFileSync(path.join(root,file),'utf8');
    vm.runInContext(`${source}\nthis.__MAPS=typeof MAPS==='undefined'?this.__MAPS:MAPS;this.__IMG_DATA=typeof IMG_DATA==='undefined'?this.__IMG_DATA:IMG_DATA;this.__PAPERS=typeof PAPERS==='undefined'?this.__PAPERS:PAPERS;this.__OUTLINE=typeof EXAM_OUTLINE==='undefined'?this.__OUTLINE:EXAM_OUTLINE;this.__TEACH_SCENES=typeof TEACH_SCENES==='undefined'?this.__TEACH_SCENES:TEACH_SCENES;this.__GAME_CONFIG=typeof HISTORY_GAME_CONFIG==='undefined'?this.__GAME_CONFIG:HISTORY_GAME_CONFIG;`,context,{filename:file});
  }
  return JSON.parse(JSON.stringify({maps:context.__MAPS,img:context.__IMG_DATA,papers:context.__PAPERS,outline:context.__OUTLINE,scenes:context.__TEACH_SCENES,game:context.__GAME_CONFIG}));
}

function checkHtml(file){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  const ids=[...source.matchAll(/\bid=["']([^"']+)["']/g)].map(match=>match[1]);
  const duplicates=[...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))];
  if(duplicates.length)fail(`${file} 存在重复 id：${duplicates.join('、')}`);
  for(const match of source.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)){
    const target=match[1];
    if(!target||/^(?:https?:|data:|#|javascript:|mailto:)/.test(target))continue;
    const clean=decodeURIComponent(target.split(/[?#]/)[0]);
    if(!fs.existsSync(path.join(root,clean)))fail(`${file} 引用了不存在的文件：${clean}`);
  }
}

function checkMarkdown(file){
  const source=fs.readFileSync(file,'utf8');
  for(const match of source.matchAll(/!?(?:\[[^\]]*\])\(([^)]+)\)/g)){
    const rawTarget=match[1].trim().replace(/^<|>$/g,'');
    if(!rawTarget||/^(?:https?:|data:|#|mailto:)/.test(rawTarget))continue;
    const clean=decodeURIComponent(rawTarget.split(/[?#]/)[0]);
    if(!fs.existsSync(path.resolve(path.dirname(file),clean)))fail(`${relative(file)} 引用了不存在的文件：${clean}`);
  }
}

const {maps,img,papers,outline,scenes,game}=loadData();
if(!Array.isArray(maps)||maps.length!==3)fail('MAPS 应包含三个历史模块');

const allQuestions=[];
let missingExplanations=0;
for(const [mapIndex,map] of maps.entries()){
  if(!Array.isArray(map.units)||!map.units.length)fail(`${map.name||mapIndex} 没有章节`);
  for(const [unitIndex,unit] of map.units.entries()){
    if(!Array.isArray(unit.questions))fail(`${map.name} / ${unit.name} 的题目字段不是数组`);
    else if(unit.questions.length<1)warn(`${map.name} / ${unit.name} 没有符合“原始 Markdown 且不依赖图表”条件的题目`);
    for(const [questionIndex,question] of (unit.questions||[]).entries()){
      const location=`${map.name} / ${unit.name} / 第 ${questionIndex+1} 题`;
      if(!question.q?.trim())fail(`${location} 缺少题干`);
      if(!Array.isArray(question.opts)||question.opts.length!==4)fail(`${location} 选项不是四项`);
      if(!Number.isInteger(question.ans)||question.ans<0||question.ans>3)fail(`${location} 正确答案索引无效`);
      if(!question.explanation?.trim())missingExplanations+=1;
      if(!question.source?.trim())fail(`${location} 缺少来源`);
      if(!question.explanation?.includes('【来源】'))fail(`${location} 的作答解析没有标出来源`);
      if(!Array.isArray(question.optionExplanations)||question.optionExplanations.length!==4){
        fail(`${location} 的易混项解析不是四项对应数组`);
      }else{
        const notes=question.optionExplanations.map(item=>String(item||'').trim());
        const nonemptyNotes=notes.filter(Boolean);
        if(notes[question.ans])fail(`${location} 在正确项中重复了总解析`);
        if(new Set(nonemptyNotes.map(normalizeText)).size!==nonemptyNotes.length)fail(`${location} 存在重复的易混项解析`);
        const overall=normalizeText(cleanExplanation(question.explanation));
        if(overall&&nonemptyNotes.some(note=>normalizeText(note)===overall))fail(`${location} 的易混项解析重复了总解析`);
        if(!nonemptyNotes.length)warn(`${location} 没有需要单独辨析的易混项`);
      }
      if(/^\s*\|.*\|\s*$/m.test(question.q)||/下图|图\s*\d|图\s*[A-D]|下表|表\s*\d|表格|示意图|下列书法作品/.test(question.q)){
        fail(`${location} 仍然依赖图表或图片`);
      }
      allQuestions.push({...question,mapIndex,unitIndex});
    }
  }
}
if(missingExplanations)warn(`${missingExplanations} 道题没有专属总解析`);

const duplicateQuestions=[];
for(let left=0;left<allQuestions.length;left++){
  for(let right=left+1;right<allQuestions.length;right++){
    const similarity=questionSimilarity(allQuestions[left],allQuestions[right]);
    if(similarity.duplicate)duplicateQuestions.push({left:allQuestions[left],right:allQuestions[right],similarity});
  }
}
if(duplicateQuestions.length)fail(`题库存在 ${duplicateQuestions.length} 组相同或高度相似题目`);

if(!Array.isArray(papers)||papers.length!==8)fail('PAPERS 应包含八份整卷档案');
for(const paper of papers||[]){
  if(paper.choiceCount!==20||paper.subjectiveCount!==5)fail(`${paper.id} 不是20道选择题加5道主观题`);
  if(!paper.sourceFile||!fs.existsSync(path.join(root,paper.sourceFile)))fail(`${paper.id} 的原始试卷文件不存在`);
  if(!paper.answerStatus)fail(`${paper.id} 未声明答案状态`);
  if(paper.sourceFile&&fs.existsSync(path.join(root,paper.sourceFile))&&paper.raw?.replace(/\r/g,'')!==fs.readFileSync(path.join(root,paper.sourceFile),'utf8').replace(/\r/g,''))fail(`${paper.id} 的整卷档案与原始 Markdown 不一致`);
}
if(!outline?.sourceFile||!fs.existsSync(path.join(root,outline.sourceFile)))fail('考试大纲原始文件不存在');
else if(outline.raw?.replace(/\r/g,'')!==fs.readFileSync(path.join(root,outline.sourceFile),'utf8').replace(/\r/g,''))fail('题库中的考试大纲档案与原始 Markdown 不一致');

const sceneValues=Object.values(scenes||{});
if(sceneValues.length!==21)fail(`历史现场应为21个，实际为${sceneValues.length}个`);
const configuredSceneIds=[];
const defaultQuestionCount=game?.quiz?.defaultQuestionCount;
const focusQuestionCount=game?.quiz?.focusQuestionCount;
if(!Number.isInteger(defaultQuestionCount)||defaultQuestionCount<1)fail('普通单元的默认通关题数无效');
if(!Number.isInteger(focusQuestionCount)||focusQuestionCount<=defaultQuestionCount)fail('重点单元的通关题数应大于普通单元');
for(const mapConfig of Object.values(game||{}).filter(value=>Number.isInteger(value?.mapIndex))){
  const map=maps[mapConfig.mapIndex];
  if(!map)fail(`游戏配置引用不存在的地图 ${mapConfig.mapIndex}`);
  if(mapConfig.units?.length!==map?.units?.length)fail(`${map?.name||mapConfig.mapIndex} 的游戏配置章节数不一致`);
  for(const unit of mapConfig.units||[]){
    const questionCount=unit.quizQuestionCount??defaultQuestionCount;
    const questionPool=map?.units?.[unit.unitIndex]?.questions||[];
    if(!Number.isInteger(questionCount)||questionCount<1)fail(`${map?.name||mapConfig.mapIndex} / ${unit.unitIndex} 的通关题数无效`);
    if(unit.quizQuestionCount!==undefined&&questionCount>questionPool.length)fail(`${map?.name||mapConfig.mapIndex} / ${map.units[unit.unitIndex]?.name||unit.unitIndex} 的重点题池不足 ${questionCount} 题`);
    for(const id of unit.sceneIds||[]){
      configuredSceneIds.push(id);
      const scene=scenes[id];
      if(!scene)fail(`游戏配置引用不存在的历史现场 ${id}`);
      if(scene&&(scene.mapIndex!==mapConfig.mapIndex||scene.unitIndex!==unit.unitIndex))fail(`${id} 的地图或章节对应错误`);
    }
  }
}
for(const scene of sceneValues){
  if(configuredSceneIds.filter(id=>id===scene.id).length!==1)fail(`${scene.id} 没有且仅有一个章节入口`);
  const label=game?.rewards?.stampLabels?.[scene.id];
  if(!label||Array.from(label).length>4)fail(`${scene.id} 的主题印章应为1至4个字`);
}

const referencedImages=new Set(Object.values(img||{}));
for(const map of maps)referencedImages.add(`assets/首页/${map.name}.webp`);
for(const scene of sceneValues)referencedImages.add(scene.image);
for(const file of referencedImages)if(!fs.existsSync(path.join(root,file)))fail(`图片不存在：${file}`);
const assetFiles=walk(path.join(root,'assets')).filter(file=>path.basename(file)!=='.DS_Store').map(relative);
for(const file of assetFiles)if(!referencedImages.has(file))warn(`未被数据或首页引用的素材：${file}`);

checkHtml('历史长河.html');
checkHtml('题库编辑器.html');
checkHtml('index.html');
for(const file of walk(root).filter(file=>path.extname(file).toLowerCase()==='.md'))checkMarkdown(file);

const residue=walk(root).filter(file=>path.basename(file)==='.DS_Store').map(relative);
if(residue.length)warn(`发现 ${residue.length} 个 .DS_Store：${residue.join('、')}`);

const mapSummary=maps.map(map=>({name:map.name,units:map.units.length,questions:map.units.reduce((sum,unit)=>sum+unit.questions.length,0)}));
const sceneSummary=sceneValues.reduce((summary,scene)=>{summary[scene.category]=(summary[scene.category]||0)+1;return summary;},{});
console.log(JSON.stringify({
  status:failures.length?'failed':'passed',
  maps:mapSummary,
  totalQuestions:allQuestions.length,
  papers:papers.length,
  scenes:sceneSummary,
  referencedImages:referencedImages.size,
  assetFiles:assetFiles.length,
  warnings,
  failures
},null,2));
if(failures.length)process.exitCode=1;
