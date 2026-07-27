import fs from 'node:fs';
import vm from 'node:vm';

class FakeElement {
  constructor(){this._innerHTML='';this.textContent='';this.hidden=false;this.style={};this.dataset={};this.children=[];this.classList={add(){},remove(){},toggle(){}};}
  set innerHTML(value){this._innerHTML=String(value);this.children=[];}
  get innerHTML(){return this._innerHTML;}
  appendChild(child){this.children.push(child);return child;}
  querySelector(){return new FakeElement();}
  scrollIntoView(){}
  focus(){}
  remove(){}
}

const elements=new Map();
const getElement=id=>{if(!elements.has(id))elements.set(id,new FakeElement());return elements.get(id);};
const storage=new Map();
const context={
  console,
  document:{getElementById:getElement,createElement:()=>new FakeElement(),querySelectorAll:()=>[],querySelector:()=>new FakeElement()},
  localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)},
  location:{protocol:'http:'},navigator:{},window:{},alert(){},confirm:()=>true,
  setTimeout:fn=>{fn();return 1;},clearTimeout(){},setInterval:()=>1,clearInterval(){},Math,Date,JSON,Map,Set
};
vm.createContext(context);
for(const file of ['data/题库.js','data/讲历史.js','data/游戏机制.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const app=fs.readFileSync('js/app.js','utf8')+`\n;globalThis.__gameTest={
  progress,maps:MAPS,teachScenes:TEACH_SCENES,
  setState(value){Object.assign(state,value)},
  setAnswers(value){state.answers=value},
  setCatalog(filter){teachCatalogState.filter=filter},
  setTeachScene(id){teachState.config=TEACH_SCENES[id];teachState.selectedArchiveIds=[];teachState.originalTranscript='';teachState.supplements=[];teachState.recordId=null},
  setTeachText(value){teachState.originalTranscript=value},
  getGameMapConfig,getGameUnitConfig,getUnitQuizQuestionCount,getUnitScenes,
  renderQuestionContent,renderAnswerExplanation,pickQuizQuestions,enterQuiz,renderQuiz,renderMenu,renderMap,renderMistakes,renderTeachCatalog,addMistake,answerRepair,showResults,
  quizQuestions(){return state.quizQuestions},
  toggleTeachArchive,getSelectedTeachArchives,renderTeachArchiveSelection,analyzeTeachText,renderTeachFeedback,
  finishTeach,closeTeachStampOverlay,loadTeachStamps,isTeachSceneStamped,getTeachStampThreshold,getTeachStampLabel,
  activeMistakes(){return mistakes},repaired(){return repairedMistakes}
};`;
vm.runInContext(app,context,{filename:'js/app.js'});

const api=context.__gameTest;
for(let mapIndex=0;mapIndex<api.maps.length;mapIndex++){
  const config=api.getGameMapConfig(mapIndex);
  if(!config)throw new Error(`${api.maps[mapIndex].name}没有启用统一游戏化配置`);
  if(config.units.length!==api.maps[mapIndex].units.length)throw new Error(`${api.maps[mapIndex].name}的时代节点配置不完整`);
  const configuredSceneIds=config.units.flatMap(unit=>unit.sceneIds);
  const expectedScenes=Object.values(api.teachScenes).filter(scene=>scene.mapIndex===mapIndex);
  if(configuredSceneIds.length!==expectedScenes.length||expectedScenes.some(scene=>!configuredSceneIds.includes(scene.id)))throw new Error(`${api.maps[mapIndex].name}的历史现场对应关系不完整`);
  config.units.forEach(unit=>unit.sceneIds.forEach(id=>{
    const scene=api.teachScenes[id];
    if(!scene||scene.mapIndex!==mapIndex||scene.unitIndex!==unit.unitIndex)throw new Error(`历史现场 ${id} 的章节对应关系错误`);
  }));
}
Object.values(api.teachScenes).forEach(scene=>{
  const label=api.getTeachStampLabel(scene);
  if(!label||Array.from(label).length>4)throw new Error(`历史现场 ${scene.id} 的印章文字不符合1至4字要求`);
});
api.renderMenu();
if(getElement('map-cards').children.length!==3||getElement('map-cards').children.some(card=>!String(card.className).includes('restoration-card')||!card.innerHTML.includes('card-cover-restoration')))throw new Error('三张首页封面没有统一显示长河修复进度');

api.setCatalog('ancient');
api.renderTeachCatalog();
if((getElement('teach-catalog-grid').innerHTML.match(/teach-scene-card locked/g)||[]).length!==5)throw new Error('初始古代史现场锁定数量不正确');

api.progress.maps[0].units[0].completed=true;
api.progress.maps[0].units[1].completed=true;
api.renderTeachCatalog();
const catalog=getElement('teach-catalog-grid').innerHTML;
if(!catalog.includes('商鞅变法')||!catalog.includes('teach-scene-card unlocked'))throw new Error('完成关卡后未解锁商鞅变法现场');

api.setCatalog('modern');
api.renderTeachCatalog();
if((getElement('teach-catalog-grid').innerHTML.match(/teach-scene-card locked/g)||[]).length!==10)throw new Error('近代史现场没有按章节进度锁定');
api.progress.maps[1].units[0].completed=true;
api.renderTeachCatalog();
if(!getElement('teach-catalog-grid').innerHTML.includes('鸦片战争')||!getElement('teach-catalog-grid').innerHTML.includes('teach-scene-card unlocked'))throw new Error('近代史关卡完成后没有解锁对应现场');

api.setCatalog('world');
api.renderTeachCatalog();
if((getElement('teach-catalog-grid').innerHTML.match(/teach-scene-card locked/g)||[]).length!==6)throw new Error('世界史现场没有按章节进度锁定');
api.progress.maps[2].units[6].completed=true;
api.renderTeachCatalog();
const worldCatalog=getElement('teach-catalog-grid').innerHTML;
if((worldCatalog.match(/teach-scene-card unlocked/g)||[]).length!==3||!worldCatalog.includes('第一次世界大战与战后国际秩序')||!worldCatalog.includes('十月革命与新经济政策')||!worldCatalog.includes('第二次世界大战与战后国际秩序'))throw new Error('世界史综合章节没有同时解锁三个对应现场');

api.setState({currentMap:1,currentUnit:0});
api.renderMap();
if(!getElement('map-container').innerHTML.includes('中国近现代史长河')||!getElement('map-container').innerHTML.includes('1个历史情境'))throw new Error('近代史地图没有显示长河修复和历史情境奖励');
api.setState({currentMap:0,currentUnit:0});
api.enterQuiz(0);
if(api.quizQuestions().length!==3)throw new Error('普通单元没有按默认规则抽取3题');
api.progress.maps[0].units[1].completed=true;
api.enterQuiz(2);
if(api.getUnitQuizQuestionCount(0,2)!==5||api.quizQuestions().length!==5)throw new Error('秦汉重点单元没有抽取5题');
api.setState({currentMap:2,currentUnit:0});
api.renderMap();
if(!getElement('map-container').innerHTML.includes('重点5题'))throw new Error('地图没有标明重点单元需完成5题');
const focusUnits=[[0,2],[0,6],[1,12],[2,3],[2,6],[2,7]];
if(focusUnits.some(([mapIndex,unitIndex])=>api.getUnitQuizQuestionCount(mapIndex,unitIndex)!==5))throw new Error('六个重点单元的5题配置不完整');
api.setState({currentMap:1,currentUnit:0});
api.setAnswers([{correct:true},{correct:true},{correct:true}]);
api.showResults();
if(!getElement('results-reward').innerHTML.includes("openTeachCatalog('modern','map')"))throw new Error('近代史结算页仍跳转到错误的历史现场分类');
api.setState({currentMap:2,currentUnit:6});
api.setAnswers([{correct:true},{correct:true},{correct:true}]);
api.showResults();
if(!getElement('results-reward').innerHTML.includes("openTeachCatalog('world','map')")||!getElement('results-reward').innerHTML.includes('第一次世界大战与战后国际秩序'))throw new Error('世界史结算页没有显示正确的现场奖励入口');

api.setState({currentMap:0,currentUnit:1});
const sample={q:'测试：商鞅变法的主要作用是什么？',opts:['增强秦国国力','建立行省制','创立科举制','完成工业革命'],ans:0,explanation:'商鞅变法推动秦国富国强兵。'};
api.addMistake(sample);
api.renderMap();
if(!getElement('map-container').innerHTML.includes('node-fracture')||!getElement('map-container').innerHTML.includes('错题 1')||getElement('map-container').innerHTML.includes('裂 1'))throw new Error('关卡没有用清楚的文字显示错题数量');
api.renderMistakes();
if(!getElement('mistakes-list').innerHTML.includes('待订正错题')||!getElement('mistakes-list').innerHTML.includes('错题 1')||getElement('mistakes-list').innerHTML.includes('裂缝 1'))throw new Error('错题记录仍使用含糊的裂缝表述');

api.answerRepair(api.activeMistakes()[0].key,0);
if(api.activeMistakes().length!==0||api.repaired().length!==1)throw new Error('修复记录没有正确归档');
if(!getElement('mistakes-list').innerHTML.includes('已订正记录')||!getElement('mistakes-list').innerHTML.includes('已订正'))throw new Error('答对错题后没有进入已订正记录');

api.setAnswers([{correct:true}]);
api.showResults();
if(!getElement('results-reward').innerHTML.includes('商鞅变法'))throw new Error('结算页没有显示历史现场奖励');

api.setTeachScene('shangyang-reform');
const sceneArchives=vm.runInContext("TEACH_SCENES['shangyang-reform']",context);
sceneArchives.archives.forEach(item=>api.toggleTeachArchive(item.id));
if(api.getSelectedTeachArchives().length!==sceneArchives.archives.length)throw new Error('现场线索仍然存在最多三份的限制');
api.setTeachScene('shangyang-reform');
api.toggleTeachArchive(sceneArchives.archives[0].id);
api.renderTeachArchiveSelection();
if(getElement('btn-teach-to-report').disabled||!getElement('btn-teach-to-report').textContent.includes('1 份依据'))throw new Error('选择一份依据后没有开放讲述');
const teachText='战国时期诸侯争夺土地和人口，秦国通过奖励耕战提高农业和军队能力，这条国情线索支持变法是为了富国强兵。';
api.setTeachText(teachText);
api.renderTeachFeedback(api.analyzeTeachText(teachText,sceneArchives),teachText,'create');
if(!getElement('teach-feedback').innerHTML.includes('历史印章进度'))throw new Error('反馈页没有显示历史印章进度');
if(api.isTeachSceneStamped(sceneArchives))throw new Error('仅保存口述记录就错误地获得了历史印章');
api.finishTeach();
if(!getElement('teach-stamp-overlay').innerHTML.includes('还差')||api.isTeachSceneStamped(sceneArchives))throw new Error('未覆盖多数要点时仍然盖下了历史印章');
api.closeTeachStampOverlay('continue');

const completeTeachText='战国诸侯兼并，秦国要富国强兵。秦孝公任用商鞅，奖励耕织、军功授爵，推行县制和户籍什伍。新法让秦国国力增强，为统一六国奠定基础，却触动旧贵族，他们反对；严刑峻法也留下矛盾。新法推动社会转型并加强中央集权，对后世产生影响。';
const completeAnalysis=api.analyzeTeachText(completeTeachText,sceneArchives);
if(completeAnalysis.covered.length<api.getTeachStampThreshold(sceneArchives))throw new Error('完整口述没有达到预期的盖章门槛');
api.setTeachText(completeTeachText);
api.renderTeachFeedback(completeAnalysis,completeTeachText,'update');
if(api.isTeachSceneStamped(sceneArchives))throw new Error('达标后尚未点击完成就错误地获得了历史印章');
api.finishTeach();
if(!getElement('teach-stamp-overlay').innerHTML.includes('获得“商鞅变法”历史印章')||!getElement('teach-stamp-overlay').innerHTML.includes('<span>商鞅变法</span>')||!api.isTeachSceneStamped(sceneArchives))throw new Error('达标并完成后没有触发对应主题的盖章奖励');
api.setState({currentMap:0,currentUnit:1});
api.renderMap();
if(!getElement('map-container').innerHTML.includes('node-achievement-badge')||!getElement('map-container').innerHTML.includes('<span>商鞅变法</span><i aria-hidden="true">印</i>')||getElement('map-container').innerHTML.includes('>徽章</b>'))throw new Error('关卡卡片没有直接显示最近获得的主题印章');
api.setCatalog('ancient');
api.renderTeachCatalog();
const stampedCatalog=getElement('teach-catalog-grid').innerHTML;
if(stampedCatalog.includes('已获得历史印章')||!stampedCatalog.includes('class="scene-seal"')||!stampedCatalog.includes('<span>商鞅变法</span><em aria-hidden="true">印</em>'))throw new Error('现场目录没有显示对应主题的奖励印章');

const tableMarkup=api.renderQuestionContent('据表可知，汉政府\n\n| 机构 | 管理范围 | 职能 |\n|---|---|---|\n| 郡县 | 北疆 | 管理民政 |');
if(!tableMarkup.startsWith('<p>据表可知，汉政府</p>')||!tableMarkup.includes('data-columns="3"')||!tableMarkup.includes('question-table-hint'))throw new Error('表格题没有正确分离题干、表格和移动端阅读提示');

const shortUnit={questions:[
  {type:'basic',q:'第一题',opts:['甲','乙','丙','丁'],ans:0},
  {type:'material',q:'第二题',opts:['一','二','三','四'],ans:1}
]};
if(api.pickQuizQuestions(shortUnit).length!==2)throw new Error('题池不足默认题数时没有保留实际题目数量');
const rationaleMarkup=api.renderAnswerExplanation({
  type:'material',
  q:'测试',
  opts:['甲','乙','丙','丁'],
  ans:1,
  explanation:'【答案 B】乙符合材料。\n【来源】测试试卷·第1题（documents/测试.md）',
  optionExplanations:['甲只涉及另一时期。','','丙与题干所问制度不同。',''],
  source:'测试试卷·第1题'
},0);
if((rationaleMarkup.match(/class="option-rationale(?: |")/g)||[]).length!==2||!rationaleMarkup.includes('乙符合材料')||!rationaleMarkup.includes('相关史实与易混项')||!rationaleMarkup.includes('chosen-wrong')||rationaleMarkup.includes('option-rationale correct')||rationaleMarkup.includes('判断顺序'))throw new Error('答题后没有按“总解析一次、补充相关史实并辨析易混错误项”显示');

const styles=fs.readFileSync('css/styles.css','utf8');
if(!/\.quiz-card\{[^}]*flex-shrink:0[^}]*overflow:visible/.test(styles))throw new Error('长题卡片仍可能在移动端被压缩裁切');
if(!/\.btn-back\{[^}]*min-width:76px[^}]*height:42px/.test(styles)||!/\.quiz-back\{[^}]*top:14px[^}]*1040px/.test(styles))throw new Error('地图页与答题页返回按钮没有统一尺寸和位置基线');

console.log('界面冒烟检查通过：长题完整显示、实际题数答题、易混项辨析、统一返回按钮、三大长河修复、错题订正、现场解锁和主题印章均正常。');
