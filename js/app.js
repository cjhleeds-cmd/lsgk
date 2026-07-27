// ======== STATE ========
let state = { currentMap:0, currentUnit:0, currentQ:0, answers:[], answered:false, quizQuestions:[] };

function escapeHtml(value){
return String(value??'').replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
}

function getGameMapConfig(mapIndex){
if(typeof HISTORY_GAME_CONFIG==='undefined')return null;
const configs=Object.values(HISTORY_GAME_CONFIG).filter(value=>value&&typeof value==='object'&&Number.isInteger(value.mapIndex));
return configs.find(config=>config.enabled&&config.mapIndex===mapIndex)||null;
}

function getGameUnitConfig(mapIndex,unitIndex){
return getGameMapConfig(mapIndex)?.units?.find(unit=>unit.unitIndex===unitIndex)||null;
}

function getUnitQuizQuestionCount(mapIndex,unitIndex){
const configured=getGameUnitConfig(mapIndex,unitIndex)?.quizQuestionCount;
const fallback=HISTORY_GAME_CONFIG?.quiz?.defaultQuestionCount||3;
return Number.isInteger(configured)&&configured>0?configured:fallback;
}

function getUnitScenes(mapIndex,unitIndex){
const ids=getGameUnitConfig(mapIndex,unitIndex)?.sceneIds||[];
return ids.map(id=>typeof TEACH_SCENES!=='undefined'?TEACH_SCENES[id]:null).filter(Boolean);
}

function isTeachSceneUnlocked(scene){
return true;
}

function loadTeachStamps(){
try{
const value=JSON.parse(localStorage.getItem('gaokaoHistoryTeachStamps')||'{}');
return value&&typeof value==='object'&&!Array.isArray(value)?value:{};
}catch(e){return {};}
}

function saveTeachStamps(stamps){
try{localStorage.setItem('gaokaoHistoryTeachStamps',JSON.stringify(stamps));}catch(e){}
}

function isTeachSceneStamped(scene){
return Boolean(scene?.id&&loadTeachStamps()[scene.id]);
}

function getTeachStampThreshold(config){
const total=Math.max(1,config?.dimensions?.length||0);
return Math.floor(total/2)+1;
}

function getTeachStampLabel(config){
const configured=typeof HISTORY_GAME_CONFIG!=='undefined'?HISTORY_GAME_CONFIG.rewards?.stampLabels?.[config?.id]:'';
if(configured)return configured;
return Array.from(String(config?.title||'历史').replace(/\s/g,'')).slice(0,4).join('')||'历史';
}

function awardTeachStamp(config,analysis){
const stamps=loadTeachStamps();
const previous=stamps[config.id];
stamps[config.id]={
sceneId:config.id,
title:config.title,
earnedAt:previous?.earnedAt||Date.now(),
updatedAt:Date.now(),
covered:analysis.covered.map(item=>item.label),
coveredCount:analysis.covered.length,
totalCount:config.dimensions.length
};
saveTeachStamps(stamps);
return Boolean(previous);
}

function getUnitMistakeCount(mapIndex,unitIndex){
return mistakes.filter(item=>item.mapIndex===mapIndex&&item.unitIndex===unitIndex).length;
}

function renderQuestionContent(text){
const lines=String(text||'').split(/\r?\n/);
const isTableDivider=line=>line.includes('-')&&/^\s*\|?[\s:|-]+\|?\s*$/.test(line);
const isTableStart=index=>/^\s*\|/.test(lines[index]||'')&&isTableDivider(lines[index+1]||'');
const cells=line=>line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(cell=>cell.trim());
const parts=[];
let index=0;
while(index<lines.length){
if(!lines[index].trim()){index++;continue;}
if(isTableStart(index)){
const headers=cells(lines[index]);
index+=2;
const rows=[];
while(index<lines.length&&/^\s*\|/.test(lines[index])&&lines[index].trim()){
rows.push(cells(lines[index]));
index++;
}
parts.push(`<div class="question-table-wrap" data-columns="${headers.length}" role="region" aria-label="题目表格" tabindex="0"><table class="question-table"><thead><tr>${headers.map(cell=>`<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table><span class="question-table-hint">左右滑动查看完整表格</span></div>`);
continue;
}
const paragraph=[];
while(index<lines.length&&lines[index].trim()&&!isTableStart(index)){
paragraph.push(lines[index].trim());
index++;
}
parts.push(`<p>${escapeHtml(paragraph.join(' '))}</p>`);
}
return parts.join('');
}

function shuffled(list){
const a=[...list];
for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
return a;
}

function prepareQuestion(q){
const choices=q.opts.map((text,index)=>({text,correct:index===q.ans,explanation:q.optionExplanations?.[index]||''}));
const mixed=shuffled(choices);
return {...q,opts:mixed.map(x=>x.text),optionExplanations:mixed.map(x=>x.explanation),ans:mixed.findIndex(x=>x.correct)};
}

function pickQuizQuestions(unit,questionCount=HISTORY_GAME_CONFIG?.quiz?.defaultQuestionCount||3){
const weights={basic:.30,material:.40,visual:.15,thinking:.15};
const pool=unit.questions.map(q=>({...q,type:q.type||'basic'}));
const picked=[];
while(picked.length<questionCount&&pool.length){
const availableTypes=[...new Set(pool.map(q=>q.type))];
const total=availableTypes.reduce((s,t)=>s+(weights[t]||.1),0);
let r=Math.random()*total,chosenType=availableTypes[0];
for(const t of availableTypes){r-=weights[t]||.1;if(r<=0){chosenType=t;break;}}
const candidates=pool.filter(q=>q.type===chosenType);
const chosen=candidates[Math.floor(Math.random()*candidates.length)];
picked.push(prepareQuestion(chosen));
pool.splice(pool.indexOf(chosen),1);
}
return shuffled(picked);
}

function cleanQuestionExplanation(text=''){
return String(text)
.replace(/^【答案\s*[A-D]】\s*/,'')
.replace(/^解析[：:]\s*/,'')
.replace(/\n?【来源】[\s\S]*$/,'')
.trim();
}

function getOptionRationale(q,index){
return String(q.optionExplanations?.[index]||'').trim();
}

function renderAnswerExplanation(q,selectedIndex){
const letters=['A','B','C','D'];
const summary=cleanQuestionExplanation(q.explanation);
const items=q.opts.map((option,index)=>{
const rationale=getOptionRationale(q,index);
if(index===q.ans||!rationale)return '';
const classes=['option-rationale'];
if(index===selectedIndex&&index!==q.ans)classes.push('chosen-wrong');
return `<li class="${classes.join(' ')}"><b>${letters[index]}</b><p>${escapeHtml(rationale)}</p></li>`;
}).filter(Boolean).join('');
return `<strong>答案：${letters[q.ans]}．${escapeHtml(q.opts[q.ans])}</strong>
${summary?`<p class="answer-principle">${escapeHtml(summary)}</p>`:''}
${items?`<p class="answer-principle">相关史实与易混项：</p><ul class="option-rationale-list">${items}</ul>`:''}
${q.source?`<small class="answer-source">来源：${escapeHtml(q.source)}</small>`:''}`;
}

function loadProgress(){
try{ const d=localStorage.getItem('gaokaoHistoryQuizProgress'); if(d) return JSON.parse(d); }catch(e){}
return { maps: MAPS.map(m=>({ units: m.units.map(()=>({ stars:0, completed:false })) })) };
}
function saveProgress(p){ try{ localStorage.setItem('gaokaoHistoryQuizProgress', JSON.stringify(p)); }catch(e){} }
let progress = loadProgress();

function loadMistakes(){
try{
const d=localStorage.getItem('gaokaoHistoryQuizMistakes');
if(d){
const records=JSON.parse(d);
if(!Array.isArray(records))return [];
let migrated=false;
const normalized=records.map(record=>{
if(Number.isInteger(record.mapIndex)&&Number.isInteger(record.unitIndex))return record;
const key=record.key||String(record.q||'').replace(/\s+/g,'').slice(0,180);
for(let mapIndex=0;mapIndex<MAPS.length;mapIndex++){
for(let unitIndex=0;unitIndex<MAPS[mapIndex].units.length;unitIndex++){
if(MAPS[mapIndex].units[unitIndex].questions.some(question=>mistakeKey(question)===key)){
migrated=true;
return {...record,key,mapIndex,unitIndex,unitName:MAPS[mapIndex].units[unitIndex].name};
}
}
}
return record;
});
if(migrated)try{localStorage.setItem('gaokaoHistoryQuizMistakes',JSON.stringify(normalized));}catch(e){}
return normalized;
}
}catch(e){}
return [];
}
function saveMistakes(){try{localStorage.setItem('gaokaoHistoryQuizMistakes',JSON.stringify(mistakes));}catch(e){}}
let mistakes=loadMistakes();
function loadRepairedMistakes(){
try{const d=localStorage.getItem('gaokaoHistoryQuizRepairedMistakes');if(d){const records=JSON.parse(d);return Array.isArray(records)?records:[];}}catch(e){}
return [];
}
function saveRepairedMistakes(){try{localStorage.setItem('gaokaoHistoryQuizRepairedMistakes',JSON.stringify(repairedMistakes.slice(0,60)));}catch(e){}}
let repairedMistakes=loadRepairedMistakes();
let repairFeedback={};
function mistakeKey(q){return q.q.replace(/\s+/g,'').slice(0,180);}
function addMistake(q){
const key=mistakeKey(q);
const item={key,q:q.q,opts:q.opts,ans:q.ans,explanation:q.explanation||'该选项符合题干所限定的历史事实。',source:q.source||'',mapIndex:state.currentMap,unitIndex:state.currentUnit,unitName:MAPS[state.currentMap]?.units[state.currentUnit]?.name||'',repairAttempts:0,updatedAt:Date.now()};
const index=mistakes.findIndex(x=>x.key===key);
if(index>=0)mistakes[index]=item;else mistakes.unshift(item);
saveMistakes();
}
function archiveRepairedMistake(item,method='错题订正'){
repairedMistakes=repairedMistakes.filter(record=>record.key!==item.key);
repairedMistakes.unshift({...item,repairedAt:Date.now(),repairMethod:method});
saveRepairedMistakes();
}
function removeMistakeByQuestion(q){
const key=mistakeKey(q),existing=mistakes.find(x=>x.key===key);
if(existing){archiveRepairedMistake(existing,'闯关时重新答对');mistakes=mistakes.filter(x=>x.key!==key);saveMistakes();}
}
function removeMistake(key){mistakes=mistakes.filter(x=>x.key!==key);delete repairFeedback[key];saveMistakes();renderMistakes();}
function clearMistakes(){if((!mistakes.length&&!repairedMistakes.length)||confirm('确定清空待订正错题和已订正记录吗？')){mistakes=[];repairedMistakes=[];repairFeedback={};saveMistakes();saveRepairedMistakes();renderMistakes();renderMenu();}}
function toggleRepairHint(key){repairFeedback[key]={...(repairFeedback[key]||{}),hint:!repairFeedback[key]?.hint};renderMistakes();}
function answerRepair(key,selected){
const item=mistakes.find(record=>record.key===key);
if(!item)return;
if(selected===item.ans){
archiveRepairedMistake(item);
mistakes=mistakes.filter(record=>record.key!==key);
delete repairFeedback[key];
saveMistakes();
renderMistakes();
renderMenu();
return;
}
item.repairAttempts=Number(item.repairAttempts||0)+1;
item.updatedAt=Date.now();
repairFeedback[key]={selected,hint:true};
saveMistakes();
renderMistakes();
}
function renderMistakes(){
const list=document.getElementById('mistakes-list');
const summary=document.getElementById('repair-summary');
const repairConfig=HISTORY_GAME_CONFIG?.repair||{};
const activeLabel=repairConfig.activeLabel||'待订正错题';
const archiveLabel=repairConfig.archiveLabel||'已订正记录';
if(summary)summary.innerHTML=`<div><strong>${mistakes.length}</strong><span>${escapeHtml(activeLabel)}</span></div><i></i><div><strong>${repairedMistakes.length}</strong><span>${escapeHtml(archiveLabel)}</span></div>`;
if(!mistakes.length&&!repairedMistakes.length){list.innerHTML='<div class="mistakes-empty"><span>正</span><h3>暂无错题</h3><p>答错的题目会自动保存在这里，重新作答后转入已订正记录。</p></div>';return;}
const active=mistakes.length?`<section class="repair-section"><div class="repair-section-title"><span>错</span><div><h3>${escapeHtml(activeLabel)}</h3><p>先独立判断，必要时再查看线索。</p></div></div>${mistakes.map((item,index)=>{
const feedback=repairFeedback[item.key]||{};
const safeKey=encodeURIComponent(item.key);
return `<article class="mistake-card repair-active-card"><div class="repair-card-meta"><span>${escapeHtml(item.unitName||'历史关卡')}</span><b>错题 ${index+1}</b></div><div class="mistake-question">${escapeHtml(item.q)}</div><div class="repair-options">${item.opts.map((option,optionIndex)=>`<button type="button" class="repair-option${feedback.selected===optionIndex?' selected-wrong':''}" onclick="answerRepair(decodeURIComponent('${safeKey}'),${optionIndex})"><span>${['A','B','C','D'][optionIndex]}</span>${escapeHtml(option)}</button>`).join('')}</div>${feedback.selected!==undefined?'<div class="repair-feedback wrong">答案还不正确。看看提示，再判断一次。</div>':''}<div class="repair-actions"><button type="button" class="btn-repair-hint" onclick="toggleRepairHint(decodeURIComponent('${safeKey}'))">${feedback.hint?'收起提示':'查看一条线索'}</button><button type="button" class="btn-remove-mistake" onclick="removeMistake(decodeURIComponent('${safeKey}'))">移出队列</button></div>${feedback.hint?`<div class="repair-hint"><b>史官提示</b><p>${escapeHtml(item.source?`这道题来自：${item.source}。先结合题干所处时期判断。`:(repairConfig.defaultHint||'先确认题目限定的时代，再排除不符合的选项。'))}</p></div>`:''}</article>`;
}).join('')}</section>`:'';
const repaired=repairedMistakes.length?`<section class="repair-section repaired-section"><div class="repair-section-title"><span>正</span><div><h3>${escapeHtml(archiveLabel)}</h3><p>保留订正结果，方便随时回看。</p></div></div>${repairedMistakes.map(item=>`<article class="mistake-card repaired-card"><div class="repair-card-meta"><span>${escapeHtml(item.unitName||'历史关卡')}</span><b>已订正</b></div><div class="mistake-question">${escapeHtml(item.q)}</div><div class="mistake-answer">正确答案：${['A','B','C','D'][item.ans]}．${escapeHtml(item.opts[item.ans])}</div><div class="mistake-explanation">${escapeHtml(cleanQuestionExplanation(item.explanation))}</div>${item.source?`<div class="mistake-source">来源：${escapeHtml(item.source)}</div>`:''}<time>${formatTeachRecordDate(item.repairedAt)}</time></article>`).join('')}</section>`:'';
list.innerHTML=active+repaired;
}

// ======== SCREEN MANAGEMENT ========
function showScreen(name){
document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
setTimeout(()=>{
const el = document.getElementById('screen-'+name);
if(el){el.classList.add('active');const f=document.querySelector('.global-footer');if(f)el.appendChild(f);}
if(name==='menu') renderMenu();
if(name==='map') renderMap();
if(name==='mistakes') renderMistakes();
if(name==='teach-records') renderTeachRecords();
if(name==='teach-catalog') renderTeachCatalog();
},50);
}

// ======== MAIN MENU ========
function renderMenu(){
const cards = document.getElementById('map-cards');
cards.innerHTML='';
MAPS.forEach((map,i)=>{
const p = progress.maps[i];
const playableIndexes=map.units.map((unit,index)=>unit.questions?.length?index:-1).filter(index=>index>=0);
const completed = playableIndexes.filter(index=>p.units[index]?.completed).length;
const total = playableIndexes.length;
const pct = total>0?Math.round(completed/total*100):0;
const totalStars = p.units.reduce((s,u)=>s+u.stars,0);
const card = document.createElement('button');
card.type='button';
const gameMap=getGameMapConfig(i);
card.className=`map-card${gameMap?' restoration-card':''}`;
const coverSrc=`assets/首页/${map.name}.webp`;
card.innerHTML=`
${gameMap?`<div class="card-cover-restoration" style="--restore:${pct}%"><img class="card-cover cover-base" src="${coverSrc}" alt="${map.name}"><span class="cover-color-layer"><img class="card-cover" src="${coverSrc}" alt=""></span><b>${pct===100?'长河已经完整复原':`长河已恢复 ${pct}%`}</b></div>`:`<img class="card-cover" src="${coverSrc}" alt="${map.name}">`}
<h2>${map.name}</h2>
<div class="card-sub">${map.units.length}个章节${totalStars>0?' · '+totalStars+'⭐':''}</div>
<div class="card-progress"><div class="card-progress-fill" style="width:${pct}%"></div></div>
`;
card.onclick=()=>{ state.currentMap=i; showScreen('map'); };
cards.appendChild(card);
});
// Overall
let totalC=0, totalU=0;
progress.maps.forEach((m,mapIndex)=>{
MAPS[mapIndex].units.forEach((unit,unitIndex)=>{
if(!unit.questions?.length)return;
totalU+=1;
if(m.units[unitIndex]?.completed)totalC+=1;
});
});
document.getElementById('overall-fill').style.width=(totalU>0?Math.round(totalC/totalU*100):0)+'%';
document.getElementById('overall-text').textContent=`已完成 ${totalC} / ${totalU} 个关卡`;
document.getElementById('mistake-count').textContent=mistakes.length;
const teachRecordCount=loadTeachRecords().length;
document.getElementById('teach-record-count').textContent=teachRecordCount?`已保存 ${teachRecordCount} 个情境`:'还没有保存讲述';
const sceneCount=typeof TEACH_SCENES!=='undefined'?Object.keys(TEACH_SCENES).length:0;
const sceneCountNode=document.getElementById('teach-scene-count');
if(sceneCountNode)sceneCountNode.textContent=sceneCount;
}

function resetProgress(){
if(!confirm('确定要重置所有进度吗？此操作不可撤销。')) return;
progress = { maps: MAPS.map(m=>({ units: m.units.map(()=>({ stars:0, completed:false })) })) };
saveProgress(progress);
renderMenu();
}

// ======== MAP VIEW ========
function getUnitStatus(mapIdx, unitIdx){
const units=MAPS[mapIdx].units;
if(!units[unitIdx]?.questions?.length)return 'empty';
const p = progress.maps[mapIdx].units[unitIdx];
return p.completed?'completed':'unlocked';
}

function renderMap(){
const map = MAPS[state.currentMap];
const p = progress.maps[state.currentMap];
const container = document.getElementById('map-container');
document.getElementById('map-title').textContent = map.name;
const playableIndexes=map.units.map((unit,index)=>unit.questions?.length?index:-1).filter(index=>index>=0);
const completed = playableIndexes.filter(index=>p.units[index]?.completed).length;
document.getElementById('map-progress-text').textContent = `${completed} / ${playableIndexes.length}`;
const teachEntry=document.getElementById('btn-teach-pilot');
const gameMap=getGameMapConfig(state.currentMap);
const mapFilter=gameMap?.filter||MAPS[state.currentMap]?.id||['ancient','modern','world'][state.currentMap]||'all';
const teachStamps=loadTeachStamps();
const mapSceneCount=typeof TEACH_SCENES!=='undefined'?Object.values(TEACH_SCENES).filter(scene=>scene.category===mapFilter).length:0;
const mapSceneStampCount=typeof TEACH_SCENES!=='undefined'?Object.values(TEACH_SCENES).filter(scene=>scene.category===mapFilter&&teachStamps[scene.id]).length:0;
teachEntry.hidden=!mapSceneCount;
teachEntry.textContent=`历史现场 · ${mapSceneCount}幕${mapSceneStampCount?` · ${mapSceneStampCount}印章`:''}`;
teachEntry.onclick=()=>openTeachCatalog(mapFilter,'map');

container.className = 'map-container ' + map.bgClass + ' ' + map.nodeClass;

const restorationPct=Math.round(completed/Math.max(1,playableIndexes.length)*100)||0;
let html = gameMap?`<section class="river-restoration-panel" style="--restore:${restorationPct}%"><div class="river-restoration-symbol"><span>河</span><i></i></div><div class="river-restoration-copy"><small>${escapeHtml(gameMap.restorationLabel||'长河修复进度')}</small><strong>${escapeHtml(gameMap.title)}</strong><p>${completed?`已有 ${completed} 个时代节点恢复颜色${mistakes.some(item=>item.mapIndex===state.currentMap)?'，仍有错题等待订正。':'，当前没有待订正错题。'}`:`完成第一关，让${escapeHtml(gameMap.title)}重新显现。`}</p></div><div class="river-restoration-meter"><b>${restorationPct}%</b><span><i></i></span></div></section>`:'';
html += `<div class="map-path-container map-level-grid">`;

// Nodes
map.units.forEach((unit, i) => {
const status = getUnitStatus(state.currentMap, i);
const stars = p.units[i].stars;
const quizQuestionCount=getUnitQuizQuestionCount(state.currentMap,i);
const focusQuestionCount=HISTORY_GAME_CONFIG?.quiz?.focusQuestionCount||5;
const focusSuffix=status!=='empty'&&quizQuestionCount>=focusQuestionCount?` · 重点${quizQuestionCount}题`:'';
const statusText = (status==='empty'?'暂无可追溯无图题':status==='completed'?(gameMap?'长河已修复':'已完成'):'当前可学')+focusSuffix;
const statusClass=status==='empty'?'locked empty':status;
const unitScenes=getUnitScenes(state.currentMap,i);
const stampedUnitScenes=unitScenes.filter(scene=>teachStamps[scene.id]);
const latestStampedScene=stampedUnitScenes.reduce((latest,scene)=>!latest||Number(teachStamps[scene.id]?.updatedAt||0)>Number(teachStamps[latest.id]?.updatedAt||0)?scene:latest,null);
const latestStampLabel=latestStampedScene?getTeachStampLabel(latestStampedScene):'';
const fractureCount=getUnitMistakeCount(state.currentMap,i);
let starsHtml = '';
for(let s=1;s<=3;s++){
starsHtml += `<span class="node-star${s<=stars?'':' empty'}">${s<=stars?'⭐':'☆'}</span>`;
}
html += `<button type="button" class="level-node ${statusClass}${fractureCount?' has-fracture':''}" onclick="enterQuiz(${i})" data-status="${status}" aria-label="第 ${i+1} 关 ${escapeHtml(unit.name)}，${statusText}" ${status==='empty'?'disabled':''}>`;
html += `<div class="node-bg"><img src="${escapeHtml(IMG_DATA['unit-'+state.currentMap+'-'+i])}" alt="${escapeHtml(unit.name)}"><span class="node-number">${i+1}</span>${fractureCount?`<span class="node-fracture" aria-label="本关有 ${fractureCount} 道错题">错题 ${fractureCount}</span>`:''}</div>`;
html += `<div class="node-copy"><div class="node-card-meta"><span class="node-status">${statusText}</span><div class="node-stars" aria-label="${stars} 星">${starsHtml}</div></div><h3 class="node-label">${escapeHtml(unit.name)}</h3>${unitScenes.length?`<div class="node-reward"><span class="${status==='completed'?'unlocked':'locked'}">${unitScenes.length}个历史情境</span>${latestStampedScene?`<b class="node-achievement-badge" aria-label="${escapeHtml(latestStampLabel)}历史印章" title="最近获得：${escapeHtml(latestStampLabel)}历史印章"><span>${escapeHtml(latestStampLabel)}</span><i aria-hidden="true">印</i></b>`:`<em>${status==='completed'?'已开放':'未通关'}</em>`}</div>`:''}</div>`;
html += `</button>`;
});

html += `</div>`;
container.innerHTML = html;
}

// ======== 历史现场目录 ========
let teachCatalogState={filter:'all',returnScreen:'menu'};

function openTeachCatalog(filter='all',returnScreen='menu'){
teachCatalogState={filter,returnScreen};
showScreen('teach-catalog');
setTimeout(()=>{const screen=document.getElementById('screen-teach-catalog');if(screen)screen.scrollTop=0;},80);
}

function closeTeachCatalog(){showScreen(teachCatalogState.returnScreen||'menu');}

function setTeachCatalogFilter(filter){
teachCatalogState.filter=filter;
renderTeachCatalog();
}

function renderTeachCatalog(){
const scenes=typeof TEACH_SCENES!=='undefined'?Object.values(TEACH_SCENES):[];
const filter=teachCatalogState.filter||'all';
const visible=filter==='all'?scenes:scenes.filter(scene=>scene.category===filter);
const unlockedCount=visible.filter(isTeachSceneUnlocked).length;
document.querySelectorAll('[data-teach-filter]').forEach(button=>button.classList.toggle('active',button.dataset.teachFilter===filter));
const total=document.getElementById('teach-catalog-total');
if(total)total.textContent=`${unlockedCount} / ${visible.length} 段已开放`;
const grid=document.getElementById('teach-catalog-grid');
if(!grid)return;
grid.innerHTML=visible.map(scene=>{
const unlocked=isTeachSceneUnlocked(scene);
const stamped=isTeachSceneStamped(scene);
const stampLabel=getTeachStampLabel(scene);
const unitName=MAPS[scene.mapIndex]?.units[scene.unitIndex]?.name||scene.unitTitle;
return `<button class="teach-scene-card unlocked${stamped?' stamped':' incomplete'}" type="button" onclick="enterTeach('${escapeHtml(scene.id)}','teach-catalog')">
<span class="teach-scene-image"><img src="${escapeHtml(scene.image)}" alt="${escapeHtml(scene.title)}"><i>${escapeHtml(scene.categoryLabel||'历史现场')}</i>${stamped?`<b class="scene-seal" aria-label="已获得${escapeHtml(stampLabel)}历史印章" title="${escapeHtml(stampLabel)}历史印章"><span>${escapeHtml(stampLabel)}</span><em aria-hidden="true">印</em></b>`:''}</span>
<span class="teach-scene-card-copy"><small>${escapeHtml(scene.periodLabel||'')}</small><strong>${escapeHtml(scene.title)}</strong><em>你是：${escapeHtml(scene.briefing?.role||'历史现场记录员')}</em><p>${escapeHtml(scene.catalogQuestion||scene.briefing?.headline||scene.prompt)}</p><b>进入现场 <span>›</span></b></span>
</button>`;
}).join('');
}

// ======== 讲历史 · 情境口述 ========
let teachState={config:null,recognition:null,listening:false,dictationBase:'',timerId:null,seconds:0,micPermissionChecked:false,inputId:'teach-transcript',recordId:null,originalTranscript:'',supplements:[],currentOutcome:null,selectedArchiveIds:[],returnScreen:'map'};

function getTeachConfig(sceneId){
return typeof sceneId==='string'&&typeof TEACH_SCENES!=='undefined' ? TEACH_SCENES[sceneId]||null : null;
}

function enterTeach(sceneId,returnScreen='map'){
const config=getTeachConfig(sceneId);
if(!config){alert('这个单元的“讲历史”内容还在准备中。');return;}
// 历史现场默认全部开放，无需解锁检查
state.currentMap=Number.isInteger(config.mapIndex)?config.mapIndex:state.currentMap;
state.currentUnit=Number.isInteger(config.unitIndex)?config.unitIndex:Number(sceneRef)||0;
stopTeachMic();
teachState={config,recognition:null,listening:false,dictationBase:'',timerId:null,seconds:0,micPermissionChecked:false,inputId:'teach-transcript',recordId:null,originalTranscript:'',supplements:[],currentOutcome:null,selectedArchiveIds:[],returnScreen};
document.getElementById('teach-title').textContent=config.title;
document.getElementById('teach-scene').textContent=config.scene;
document.getElementById('teach-period').textContent=config.periodLabel||'讲历史 · 进入现场';
document.getElementById('teach-sound-text').textContent=config.soundCue||'';
document.getElementById('teach-prompt').textContent=config.prompt;
document.getElementById('teach-prompt-hint').textContent=config.promptHint||'';
document.getElementById('teach-briefing-kicker').textContent=config.briefing?.kicker||'一封急信';
document.getElementById('teach-briefing-headline').textContent=config.briefing?.headline||'有人需要你的帮助';
document.getElementById('teach-role-title').textContent=config.briefing?.role||'历史记录员';
document.getElementById('teach-role-text').textContent=config.briefing?.roleText||'';
document.getElementById('teach-mission-text').textContent=config.briefing?.mission||config.prompt;
document.getElementById('teach-next-text').textContent=config.briefing?.next||'';
document.getElementById('teach-accept-button').textContent=config.flow?.acceptLabel||'进入角色，探索现场';
document.getElementById('teach-report-kicker').textContent=config.flow?.reportKicker||'现在轮到你';
document.getElementById('teach-report-headline').textContent=config.flow?.reportHeadline||'请作出你的判断';
document.getElementById('teach-archive-instruction').textContent=config.archiveInstruction||'查看全部线索，标记至少一份“我的依据”';
document.getElementById('teach-archive-grid').innerHTML=(config.archives||[]).map(archive=>`<button class="teach-archive-card" type="button" data-archive-id="${escapeHtml(archive.id)}" aria-pressed="false" onclick="toggleTeachArchive('${escapeHtml(archive.id)}')"><span class="archive-meta"><b>${escapeHtml(archive.type)}</b><time>${escapeHtml(archive.date)}</time></span><strong>${escapeHtml(archive.title)}</strong><p>${escapeHtml(archive.summary)}</p><em>标记为“我的依据”</em></button>`).join('');
renderTeachArchiveSelection();
document.getElementById('teach-guidance').innerHTML=(config.guidance||[]).map((item,index)=>`<span><b>${index+1}</b>${escapeHtml(item)}</span>`).join('');
document.getElementById('teach-sound-label').textContent='听现场线索';
const image=document.getElementById('teach-image');
image.src=config.image;
image.alt=config.unitTitle;
document.getElementById('teach-transcript').value='';
document.getElementById('teach-feedback').hidden=true;
document.getElementById('teach-feedback').innerHTML='';
document.getElementById('teach-step').textContent=`历史现场 · ${config.title}`;
document.querySelector('.teach-workspace').classList.remove('reviewed');
document.getElementById('btn-teach-analyze').disabled=false;
document.getElementById('btn-teach-analyze').textContent=config.flow?.submitLabel||'说完了，看看历史回响';
document.getElementById('teach-status').textContent=location.protocol==='file:'
?'当前是本地文件预览。麦克风若被浏览器拦截，请改用 GitHub Pages（HTTPS）或本地网页预览；也可以直接输入。'
:'请用自己的话说明，不需要一次讲得完美。';
updateTeachTimer(0);
document.getElementById('screen-teach').scrollTop=0;
showTeachStage('briefing');
showScreen('teach');
setupTeachSpeech();
}

const TEACH_STAGE_ORDER=['briefing','archives','report','feedback'];

function showTeachStage(stage){
if(stage!=='report'&&teachState.listening)stopTeachMic();
document.querySelectorAll('[data-teach-stage]').forEach(section=>{section.hidden=section.dataset.teachStage!==stage;});
const activeIndex=TEACH_STAGE_ORDER.indexOf(stage);
document.querySelectorAll('[data-journey]').forEach(item=>{
const index=TEACH_STAGE_ORDER.indexOf(item.dataset.journey);
item.classList.toggle('active',index===activeIndex);
item.classList.toggle('completed',index<activeIndex);
});
const shell=document.querySelector('.teach-shell');
if(shell)shell.dataset.stage=stage;
if(stage==='report')renderTeachSelectedArchives();
const screen=document.getElementById('screen-teach');
if(screen)screen.scrollTop=0;
}

function acceptTeachMission(){showTeachStage('archives');}

function openTeachReport(){
if((teachState.selectedArchiveIds||[]).length<1){
document.getElementById('teach-archive-status').textContent='请先标记至少一份“我的依据”，再开始讲述。';
return;
}
showTeachStage('report');
}

function renderTeachSelectedArchives(){
const container=document.getElementById('teach-selected-archives');
if(!container)return;
container.innerHTML=getSelectedTeachArchives().map(archive=>`<span>${escapeHtml(archive.title)}</span>`).join('');
}

function getSelectedTeachArchives(){
const selected=new Set(teachState.selectedArchiveIds||[]);
return (teachState.config?.archives||[]).filter(archive=>selected.has(archive.id));
}

function toggleTeachArchive(id){
const selected=teachState.selectedArchiveIds;
const index=selected.indexOf(id);
if(index>=0)selected.splice(index,1);
else selected.push(id);
renderTeachArchiveSelection();
if(teachState.recordId){
const supplementStatus=document.getElementById('teach-supplement-status');
if(supplementStatus)supplementStatus.textContent='档案选择已调整。请在下方补充它与判断的关系，再更新结果。';
}
}

function renderTeachArchiveSelection(){
const selected=new Set(teachState.selectedArchiveIds||[]);
document.querySelectorAll('.teach-archive-card').forEach(card=>{
const active=selected.has(card.dataset.archiveId);
card.classList.toggle('selected',active);
card.setAttribute('aria-pressed',String(active));
const action=card.querySelector('em');
if(action)action.textContent=active?'✓ 我的依据':'标记为“我的依据”';
});
const count=document.getElementById('teach-archive-count');
const status=document.getElementById('teach-archive-status');
const proceed=document.getElementById('btn-teach-to-report');
if(count)count.textContent=`已标记 ${selected.size} 份`;
if(status){
if(selected.size===0)status.textContent='所有线索都可以查看。把至少一份重要线索标记为“我的依据”。';
else status.textContent='依据已经标记。你仍可继续查看或标记其他线索，也可以开始讲述。';
}
if(proceed){
proceed.disabled=selected.size<1;
proceed.textContent=selected.size<1?'至少标记 1 份依据':`带着 ${selected.size} 份依据开始讲述`;
}
}

function exitTeach(){
stopTeachMic();
if('speechSynthesis' in window)window.speechSynthesis.cancel();
showScreen(teachState.returnScreen||'map');
}

function playTeachSoundCue(){
const button=document.getElementById('btn-teach-sound');
const label=document.getElementById('teach-sound-label');
if(!('speechSynthesis' in window)||!teachState.config?.soundCue){
label.textContent='当前浏览器无法播放';
return;
}
window.speechSynthesis.cancel();
const utterance=new SpeechSynthesisUtterance(teachState.config.soundCue);
utterance.lang='zh-CN';
utterance.rate=.88;
utterance.pitch=.82;
button.classList.add('playing');
label.textContent='正在播放现场线索';
utterance.onend=utterance.onerror=()=>{button.classList.remove('playing');label.textContent='再听一次';};
window.speechSynthesis.speak(utterance);
}

function setupTeachSpeech(){
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
const button=document.getElementById('btn-teach-mic');
if(!SpeechRecognition){
button.disabled=true;
document.getElementById('teach-mic-label').textContent='语音暂不可用';
document.getElementById('teach-status').textContent='当前浏览器不支持语音转文字，请改用近期版本的 Chrome 或 Edge，也可以直接输入讲述。';
return;
}
button.disabled=false;
const recognition=new SpeechRecognition();
recognition.lang='zh-CN';
recognition.continuous=true;
recognition.interimResults=true;
recognition.onresult=(event)=>{
let finalText='',interimText='';
for(let i=event.resultIndex;i<event.results.length;i++){
const text=event.results[i][0].transcript;
if(event.results[i].isFinal)finalText+=text;else interimText+=text;
}
if(finalText)teachState.dictationBase+=finalText;
const activeInput=document.getElementById(teachState.inputId)||document.getElementById('teach-transcript');
if(activeInput)activeInput.value=teachState.dictationBase+interimText;
};
recognition.onerror=(event)=>{
const messages={"not-allowed":"没有获得麦克风权限，可直接输入讲述。","audio-capture":"没有检测到可用的麦克风。","no-speech":"没有听到声音，请再试一次。"};
let message=messages[event.error]||'语音识别暂时中断，可继续输入或重新开始。';
if(event.error==='not-allowed'&&location.protocol==='file:')message='本地文件模式没有获得麦克风权限。请通过 GitHub Pages（HTTPS）或 localhost 打开网页，也可以直接输入讲述。';
document.getElementById('teach-status').textContent=message;
};
recognition.onend=()=>{
if(teachState.listening&&teachState.seconds<90){
try{recognition.start();return;}catch(e){}
}
setTeachListening(false);
};
teachState.recognition=recognition;
}

async function requestTeachMicrophoneAccess(){
if(teachState.micPermissionChecked)return true;
if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
document.getElementById('teach-status').textContent=location.protocol==='file:'
?'本地文件模式无法申请麦克风。请通过 GitHub Pages（HTTPS）或 localhost 打开网页，也可以直接输入讲述。'
:'当前浏览器无法申请麦克风权限，请直接输入讲述。';
return false;
}
try{
const stream=await navigator.mediaDevices.getUserMedia({audio:true});
stream.getTracks().forEach(track=>track.stop());
teachState.micPermissionChecked=true;
return true;
}catch(error){
const denied=error&&['NotAllowedError','PermissionDeniedError','SecurityError'].includes(error.name);
document.getElementById('teach-status').textContent=denied
?(location.protocol==='file:'?'本地文件模式的麦克风权限被拦截。请通过 GitHub Pages（HTTPS）或 localhost 打开网页，也可以直接输入讲述。':'麦克风权限未开启。请在浏览器地址栏的网站权限中允许麦克风后重试。')
:'没有检测到可用的麦克风，可以直接输入讲述。';
return false;
}
}

async function toggleTeachMic(){
return toggleTeachMicFor('teach-transcript');
}

async function toggleTeachSupplementMic(){
return toggleTeachMicFor('teach-supplement');
}

async function toggleTeachMicFor(inputId){
if(teachState.listening){stopTeachMic();return;}
const hasPermission=await requestTeachMicrophoneAccess();
if(!hasPermission)return;
if(!teachState.recognition){setupTeachSpeech();}
if(!teachState.recognition)return;
teachState.inputId=inputId;
const activeInput=document.getElementById(inputId);
if(!activeInput)return;
teachState.dictationBase=activeInput.value.trim();
if(teachState.dictationBase)teachState.dictationBase+=' ';
teachState.seconds=0;
try{
teachState.recognition.start();
setTeachListening(true);
document.getElementById('teach-status').textContent=inputId==='teach-supplement'?'正在听你补充说明。说完后再次点击“停止补充”。':'正在听你讲述。可以自然停顿，最长 90 秒。';
}catch(e){document.getElementById('teach-status').textContent='麦克风正在启动，请稍后再试。';}
}

function setTeachListening(listening){
teachState.listening=listening;
const mainButton=document.getElementById('btn-teach-mic');
const supplementButton=document.getElementById('btn-teach-supplement-mic');
if(mainButton)mainButton.classList.toggle('listening',listening&&teachState.inputId==='teach-transcript');
if(supplementButton)supplementButton.classList.toggle('listening',listening&&teachState.inputId==='teach-supplement');
const mainLabel=document.getElementById('teach-mic-label');
const supplementLabel=document.getElementById('teach-supplement-mic-label');
if(mainLabel)mainLabel.textContent=listening&&teachState.inputId==='teach-transcript'?'停止讲述':'开始讲述';
if(supplementLabel)supplementLabel.textContent=listening&&teachState.inputId==='teach-supplement'?'停止补充':'语音补充';
clearInterval(teachState.timerId);
teachState.timerId=null;
if(listening){
teachState.timerId=setInterval(()=>{
teachState.seconds++;
updateTeachTimer(teachState.seconds);
if(teachState.seconds>=90)stopTeachMic();
},1000);
}
}

function stopTeachMic(){
if(teachState.timerId)clearInterval(teachState.timerId);
teachState.timerId=null;
if(teachState.recognition&&teachState.listening){
teachState.listening=false;
try{teachState.recognition.stop();}catch(e){}
}
if(document.getElementById('btn-teach-mic'))setTeachListening(false);
}

function updateTeachTimer(seconds){
const timer=document.getElementById('teach-timer');
if(!timer)return;
const safe=Math.min(seconds,90);
timer.textContent=`${String(Math.floor(safe/60)).padStart(2,'0')}:${String(safe%60).padStart(2,'0')} / 01:30`;
}

function analyzeTeachText(text,config){
const normalized=text.replace(/[\s，。！？、；：“”‘’（）()]/g,'').toLowerCase();
const covered=config.dimensions.filter(d=>d.keywords.some(k=>normalized.includes(k.toLowerCase())));
const missing=config.dimensions.filter(d=>!covered.includes(d));
const timelineIssues=(config.timelineMistakes||[]).filter(item=>normalized.includes(item.replace(/\s/g,'').toLowerCase()));
const selectedArchives=getSelectedTeachArchives();
const usedArchives=selectedArchives.filter(archive=>(archive.keywords||[]).some(keyword=>normalized.includes(keyword.replace(/\s/g,'').toLowerCase())));
return {covered,missing,length:normalized.length,timelineIssues,selectedArchives,usedArchives};
}

function determineTeachOutcome(analysis){
if(analysis.timelineIssues.length)return 'fracture';
if(analysis.length<34||analysis.covered.length<2||analysis.selectedArchives.length<1||analysis.usedArchives.length<1)return 'locked';
const coveredIds=new Set(analysis.covered.map(item=>item.id));
if(analysis.usedArchives.length>=1&&analysis.covered.length>=5&&coveredIds.has('background')&&coveredIds.has('process')&&coveredIds.has('ending')&&(coveredIds.has('limits')||coveredIds.has('people')))return 'connected';
return 'conflict';
}

function pickSocraticQuestions(analysis,config,limit,outcome){
if(outcome==='fracture'){
const nextQuestion=analysis.missing.flatMap(d=>d.questions)[0];
return [config.timelineQuestion,nextQuestion].filter(Boolean).slice(0,limit);
}
if(!analysis.selectedArchives.length)return ['哪一条现场线索最能帮助你作出判断？请先标记至少一份“我的依据”。'];
if(!analysis.usedArchives.length){
const titles=analysis.selectedArchives.map(item=>`“${item.title}”`).join('和');
return [`你已经选择了${titles}。其中哪一条信息最能支持你的判断？请把证据和结论连起来。`,config.shortQuestions[1]].filter(Boolean).slice(0,limit);
}
if(outcome==='locked'||analysis.length<24||analysis.covered.length<2)return config.shortQuestions.slice(0,limit);
if(outcome==='connected')return [config.transferQuestion].slice(0,limit);
const priority=['limits','ending','background','legacy','process','people'];
const ordered=analysis.missing.slice().sort((a,b)=>priority.indexOf(a.id)-priority.indexOf(b.id));
const unusedArchive=analysis.selectedArchives.find(item=>!analysis.usedArchives.includes(item));
const evidenceQuestion=unusedArchive?`你还选择了“${unusedArchive.title}”。它能怎样支持、修正或挑战你现在的判断？`:'';
const questions=[evidenceQuestion,...ordered.flatMap(d=>d.questions)].filter(Boolean).slice(0,limit);
return questions.length?questions:[config.transferQuestion];
}

function teachChips(items,emptyText){
if(!items.length)return `<span class="teach-empty-chip">${emptyText}</span>`;
return items.map(item=>`<span class="teach-chip">${item.label}</span>`).join('');
}

function teachEvidenceResult(analysis){
if(!analysis.selectedArchives.length)return '<span class="teach-empty-chip">尚未标记判断依据</span>';
return analysis.selectedArchives.map(archive=>{
const used=analysis.usedArchives.includes(archive);
return `<span class="teach-evidence-chip ${used?'used':'unused'}"><b>${used?'已引用':'待说明'}</b>${escapeHtml(archive.title)}</span>`;
}).join('');
}

function analyzeTeachAttempt(){
stopTeachMic();
const textarea=document.getElementById('teach-transcript');
const text=textarea.value.trim();
if(text.length<8){
document.getElementById('teach-status').textContent='再多讲一点点吧，至少试着说清一件发生的事。';
textarea.focus();
return;
}
const analysis=analyzeTeachText(text,teachState.config);
teachState.originalTranscript=text;
teachState.supplements=[];
teachState.recordId=null;
renderTeachFeedback(analysis,text,'create');
}

function teachOutcomeRoute(outcome){
const labels=['处境','行动','力量','结果'];
return `<div class="teach-outcome-route route-${outcome}" aria-label="认知路径：${labels.join('、')}">${labels.map((label,index)=>`${index?'<i></i>':''}<span>${label}</span>`).join('')}</div>`;
}

function renderTeachFeedback(analysis,combinedTranscript,mode){
const outcome=determineTeachOutcome(analysis);
const outcomeInfo={key:outcome,...teachState.config.outcomes[outcome]};
const questions=pickSocraticQuestions(analysis,teachState.config,2,outcome);
const stampThreshold=getTeachStampThreshold(teachState.config);
const stampReady=analysis.covered.length>=stampThreshold;
teachState.currentOutcome=outcomeInfo;
if(mode==='create')teachState.recordId=saveTeachRecord(analysis.covered,analysis.missing,teachState.originalTranscript,teachState.supplements,questions,outcomeInfo);
else updateTeachRecord(teachState.recordId,analysis.covered,analysis.missing,teachState.originalTranscript,teachState.supplements,questions,outcomeInfo);
const feedback=document.getElementById('teach-feedback');
feedback.hidden=false;
feedback.innerHTML=`
<div class="teach-stamp-progress ${stampReady?'ready':'pending'}" role="status">
<span>${analysis.covered.length}<small>/${teachState.config.dimensions.length}</small></span>
<div><small>历史印章进度</small><strong>${stampReady?'已达到盖章条件':`再讲清 ${stampThreshold-analysis.covered.length} 个关键要点`}</strong><p>${stampReady?'点击“完成本次讲述”，确认结果并领取历史印章。':`讲清超过一半的关键要点（至少 ${stampThreshold} 个），完成时即可获得印章。`}</p></div>
</div>
<div class="teach-outcome outcome-${outcome}">
<span class="teach-outcome-symbol">${escapeHtml(outcomeInfo.symbol)}</span>
<div class="teach-outcome-copy"><small>${escapeHtml(teachState.config.flow?.feedbackLabel||'历史回响')}</small><h3>${escapeHtml(outcomeInfo.label)}</h3><p>${escapeHtml(outcomeInfo.message)}</p></div>
${teachOutcomeRoute(outcome)}
</div>
${analysis.timelineIssues.length?`<div class="teach-timeline-warning"><b>需要核对的时代线索</b><span>${analysis.timelineIssues.map(item=>escapeHtml(item)).join('、')}</span></div>`:''}
<div class="teach-evidence-result"><div><strong>讲述中的现场依据</strong><span>${analysis.usedArchives.length?'已经识别到具体线索':'还需要把线索和判断连接起来'}</span></div><div class="teach-evidence-chips">${teachEvidenceResult(analysis)}</div></div>
<div class="teach-feedback-kicker">顺着问题再想一步</div>
<h3>你已经讲清这些内容</h3>
<div class="teach-chips">${teachChips(analysis.covered,'暂时还没有识别到明确线索')}</div>
<div class="socratic-list">${questions.map((q,i)=>`<div class="socratic-question"><span>${i+1}</span><p>${q}</p></div>`).join('')}</div>
<div class="teach-record-grid">
<div><span>已经讲到</span><div class="teach-chips">${teachChips(analysis.covered,'尚未识别')}</div></div>
<div><span>还可以补充</span><div class="teach-chips muted">${teachChips(analysis.missing,'这次讲述已经比较完整')}</div></div>
</div>
<div class="teach-supplement">
<div class="teach-supplement-head"><div><strong>根据问题补充一句</strong><span>不用重讲全文，只补充你刚想到的依据</span></div><small>${teachState.supplements.length?`已补充 ${teachState.supplements.length} 次`:'可选'}</small></div>
<textarea id="teach-supplement" rows="4" placeholder="例如：改革者主要依靠没有实权的光绪帝，却没有掌握军队……"></textarea>
<div class="teach-supplement-actions">
<button class="btn-teach-supplement-mic" id="btn-teach-supplement-mic" onclick="toggleTeachSupplementMic()"><span class="mic-dot"></span><span id="teach-supplement-mic-label">语音补充</span></button>
<button class="btn-submit-supplement" onclick="submitTeachSupplement()">提交补充并更新结果</button>
</div>
<div class="teach-supplement-status" id="teach-supplement-status">补充内容会合并进同一条口述记录。</div>
</div>
<div class="teach-dossier ${outcome==='connected'?'unlocked':'pending'}"><span>卷</span><div><small>${outcome==='connected'?'历史卷宗已解锁':'历史卷宗整理中'}</small><strong>${escapeHtml(teachState.config.dossierReward?.title||'本次历史调查卷')}</strong><p>${escapeHtml(outcome==='connected'?(teachState.config.dossierReward?.unlocked||'已经形成一份完整调查卷。'):(teachState.config.dossierReward?.pending||'继续补充证据即可完善卷宗。'))}</p></div></div>
<p class="teach-feedback-note">已在当前浏览器保存本次讲述、认知结果和思考问题；不会保存录音。</p>
<div class="teach-feedback-actions">
<button class="btn-teach-records" onclick="showScreen('teach-records')">查看口述记录</button>
<button class="btn-teach-finish" onclick="finishTeach()">完成本次讲述</button>
</div>`;
showTeachStage('feedback');
document.getElementById('btn-teach-analyze').disabled=true;
document.getElementById('btn-teach-analyze').textContent='思考问题已生成';
document.getElementById('btn-teach-mic').disabled=true;
document.querySelector('.teach-workspace').classList.add('reviewed');
document.getElementById('teach-step').textContent=mode==='create'?'历史现场 · 判断回应':'历史现场 · 回应已更新';
document.getElementById('teach-status').textContent='你的判断已经记录。可以顺着问题再补充一条依据。';
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!SpeechRecognition){
const supplementMic=document.getElementById('btn-teach-supplement-mic');
if(supplementMic){supplementMic.disabled=true;document.getElementById('teach-supplement-mic-label').textContent='请文字补充';}
}
}

function submitTeachSupplement(){
stopTeachMic();
const input=document.getElementById('teach-supplement');
const supplement=input.value.trim();
if(supplement.length<5){
document.getElementById('teach-supplement-status').textContent='请至少补充一条具体依据，再更新判断结果。';
input.focus();
return;
}
teachState.supplements.push(supplement);
const combinedTranscript=[teachState.originalTranscript,...teachState.supplements.map((item,index)=>`补充${index+1}：${item}`)].join('\n');
const analysis=analyzeTeachText(combinedTranscript,teachState.config);
renderTeachFeedback(analysis,combinedTranscript,'update');
document.getElementById('teach-supplement-status').textContent='补充已合并，认知结果和口述记录已经更新。';
}

function loadTeachRecords(){
try{
const records=JSON.parse(localStorage.getItem('gaokaoHistoryTeachRecords')||'[]');
if(!Array.isArray(records))return [];
const normalized=normalizeTeachRecords(records);
if(normalized.length!==records.length){
try{localStorage.setItem('gaokaoHistoryTeachRecords',JSON.stringify(normalized));}catch(e){}
}
return normalized;
}catch(e){return [];}
}

function teachRecordSceneKey(record,index=0){
return record.topicId||record.topic||record.id||`legacy-${record.createdAt||index}`;
}

function normalizeTeachRecords(records){
const latestByScene=new Map();
records.forEach((record,index)=>{
if(!record||typeof record!=='object')return;
const key=teachRecordSceneKey(record,index);
const moment=Number(record.updatedAt||record.createdAt||0);
const current=latestByScene.get(key);
const currentMoment=current?Number(current.updatedAt||current.createdAt||0):-1;
if(!current||moment>currentMoment)latestByScene.set(key,record);
});
return [...latestByScene.values()].sort((a,b)=>Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0)).slice(0,30);
}

function saveTeachRecords(records){
try{localStorage.setItem('gaokaoHistoryTeachRecords',JSON.stringify(normalizeTeachRecords(records)));}catch(e){}
}

function saveTeachRecord(covered,missing,transcript,supplements,questions,outcome){
const sceneKey=teachRecordSceneKey({topicId:teachState.config.id,topic:teachState.config.title});
const previous=loadTeachRecords().find(record=>teachRecordSceneKey(record)===sceneKey);
const records=loadTeachRecords().filter(record=>teachRecordSceneKey(record)!==sceneKey);
const id=`${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
records.unshift({
id,
topicId:teachState.config.id,
topic:teachState.config.title,
createdAt:Date.now(),
attempts:Number(previous?.attempts||0)+1,
task:teachState.config.prompt,
transcript,
supplements:[...supplements],
questions,
outcome,
archives:getSelectedTeachArchives().map(archive=>({id:archive.id,title:archive.title,date:archive.date,type:archive.type})),
usedArchiveIds:analyzeTeachText([transcript,...supplements].join('\n'),teachState.config).usedArchives.map(archive=>archive.id),
covered:covered.map(d=>d.label),
toExplore:missing.map(d=>d.label)
});
saveTeachRecords(records);
return id;
}

function updateTeachRecord(id,covered,missing,transcript,supplements,questions,outcome){
const records=loadTeachRecords();
const index=records.findIndex(record=>record.id===id);
if(index<0)return;
const evidenceAnalysis=analyzeTeachText([transcript,...supplements].join('\n'),teachState.config);
records[index]={...records[index],updatedAt:Date.now(),task:teachState.config.prompt,transcript,supplements:[...supplements],questions,outcome,archives:getSelectedTeachArchives().map(archive=>({id:archive.id,title:archive.title,date:archive.date,type:archive.type})),usedArchiveIds:evidenceAnalysis.usedArchives.map(archive=>archive.id),covered:covered.map(d=>d.label),toExplore:missing.map(d=>d.label)};
saveTeachRecords(records);
}

function formatTeachRecordDate(timestamp){
if(!timestamp)return '较早的记录';
return new Date(timestamp).toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
}

function renderRecordChips(items,emptyText){
if(!Array.isArray(items)||!items.length)return `<span class="record-empty-text">${escapeHtml(emptyText)}</span>`;
return items.map(item=>`<span>${escapeHtml(item)}</span>`).join('');
}

function renderTeachRecords(){
const list=document.getElementById('teach-records-list');
const records=loadTeachRecords();
if(!records.length){
list.innerHTML='<div class="teach-records-empty"><span>讲</span><h3>还没有口述记录</h3><p>完成一次“讲历史”，讲述文字和思考问题就会保存在这里。</p></div>';
return;
}
list.innerHTML=records.map((record,index)=>{
const questions=Array.isArray(record.questions)?record.questions:[];
const supplements=Array.isArray(record.supplements)?record.supplements:[];
const outcome=record.outcome&&record.outcome.label?record.outcome:null;
const archives=Array.isArray(record.archives)?record.archives:[];
const usedArchiveIds=new Set(Array.isArray(record.usedArchiveIds)?record.usedArchiveIds:[]);
const outcomeKey=outcome&&['connected','conflict','fracture','locked'].includes(outcome.key)?outcome.key:'conflict';
const id=record.id||`legacy-${record.createdAt||index}`;
return `<article class="teach-record-card">
<div class="record-card-head"><div><span class="record-topic-label">讲历史</span><h3>${escapeHtml(record.topic||'历史口述')}</h3></div><time>${escapeHtml(formatTeachRecordDate(record.createdAt))}</time></div>
${record.task?`<section class="record-section"><h4>我当时面对的情境</h4><div class="record-task">${escapeHtml(record.task)}</div></section>`:''}
${archives.length?`<section class="record-section"><h4>我标记的判断依据</h4><div class="record-archives">${archives.map(archive=>`<span class="${usedArchiveIds.has(archive.id)?'used':'unused'}"><b>${usedArchiveIds.has(archive.id)?'已引用':'待说明'}</b>${escapeHtml(archive.title)}<small>${escapeHtml(archive.date||'')}</small></span>`).join('')}</div></section>`:''}
${outcome?`<div class="record-outcome outcome-${outcomeKey}"><span>${escapeHtml(outcome.symbol||'问')}</span><div><small>认知结果</small><strong>${escapeHtml(outcome.label)}</strong><p>${escapeHtml(outcome.message||'')}</p></div></div>`:''}
<section class="record-section"><h4>${supplements.length?'第一次讲述':'我的讲述'}</h4><div class="record-transcript">${record.transcript?escapeHtml(record.transcript):'<span class="record-empty-text">这是一条早期记录，当时尚未保存讲述全文。</span>'}</div></section>
${supplements.length?`<section class="record-section"><h4>后续补充</h4><div class="record-supplements">${supplements.map((item,supplementIndex)=>`<div><span>${supplementIndex+1}</span><p>${escapeHtml(item)}</p></div>`).join('')}</div></section>`:''}
<div class="record-topic-grid"><section><h4>已经涉及</h4><div class="record-chips covered">${renderRecordChips(record.covered,'尚未识别')}</div></section><section><h4>以后可补充</h4><div class="record-chips explore">${renderRecordChips(record.toExplore,'这次已经比较完整')}</div></section></div>
<section class="record-section"><h4>留给我的思考问题</h4>${questions.length?`<ol class="record-questions">${questions.map(question=>`<li>${escapeHtml(question)}</li>`).join('')}</ol>`:'<p class="record-empty-text">这是一条早期记录，当时尚未保存思考问题。</p>'}</section>
<button class="btn-remove-record" onclick="removeTeachRecord('${escapeHtml(id)}')">删除这条记录</button>
</article>`;
}).join('');
}

function removeTeachRecord(id){
const records=loadTeachRecords().filter((record,index)=>(record.id||`legacy-${record.createdAt||index}`)!==id);
saveTeachRecords(records);
renderTeachRecords();
}

function clearTeachRecords(){
const records=loadTeachRecords();
if(!records.length||confirm('确定清空全部口述记录吗？')){
try{localStorage.removeItem('gaokaoHistoryTeachRecords');}catch(e){}
renderTeachRecords();
}
}

function finishTeach(){
stopTeachMic();
const combinedTranscript=[teachState.originalTranscript,...teachState.supplements.map((item,index)=>`补充${index+1}：${item}`)].join('\n');
const analysis=analyzeTeachText(combinedTranscript,teachState.config);
const threshold=getTeachStampThreshold(teachState.config);
const ready=analysis.covered.length>=threshold;
const stampLabel=getTeachStampLabel(teachState.config);
const overlay=document.getElementById('teach-stamp-overlay');
if(!overlay){showScreen(teachState.returnScreen||'map');return;}
overlay.className=`teach-stamp-overlay ${ready?'earned':'pending'}`;
if(ready){
const repeated=awardTeachStamp(teachState.config,analysis);
overlay.innerHTML=`<section class="teach-stamp-dialog" role="dialog" aria-modal="true" aria-labelledby="teach-stamp-title">
<div class="teach-stamp-rays" aria-hidden="true"></div><div class="teach-stamp-medallion" aria-hidden="true"><span>${escapeHtml(stampLabel)}</span><b>印</b></div>
<small>${repeated?'历史印章再次盖印':'完成奖励'}</small><h2 id="teach-stamp-title">获得“${escapeHtml(teachState.config.title)}”历史印章</h2>
<p>你讲清了 ${analysis.covered.length} / ${teachState.config.dimensions.length} 个关键要点，已经超过一半。印章正式收入历史现场。</p>
<div class="teach-stamp-actions"><button class="teach-stamp-primary" onclick="closeTeachStampOverlay('leave')">收下印章，返回历史现场</button></div></section>`;
overlay.hidden=false;
spawnConfetti();
}else{
const remaining=Math.max(1,threshold-analysis.covered.length);
overlay.innerHTML=`<section class="teach-stamp-dialog" role="dialog" aria-modal="true" aria-labelledby="teach-stamp-title">
<div class="teach-stamp-pending-icon" aria-hidden="true">待</div><small>印章暂未盖下</small><h2 id="teach-stamp-title">还差 ${remaining} 个关键要点</h2>
<p>目前讲清了 ${analysis.covered.length} / ${teachState.config.dimensions.length} 个要点。补充到至少 ${threshold} 个，再点击完成即可领取印章。</p>
<div class="teach-stamp-actions"><button class="teach-stamp-secondary" onclick="closeTeachStampOverlay('leave')">暂时离开</button><button class="teach-stamp-primary" onclick="closeTeachStampOverlay('continue')">继续补充</button></div></section>`;
overlay.hidden=false;
}
setTimeout(()=>overlay.querySelector('button')?.focus(),80);
}

function closeTeachStampOverlay(action){
const overlay=document.getElementById('teach-stamp-overlay');
if(overlay){overlay.hidden=true;overlay.innerHTML='';}
if(action==='continue'){
showTeachStage('feedback');
setTimeout(()=>{const input=document.getElementById('teach-supplement');if(input){input.scrollIntoView({behavior:'smooth',block:'center'});input.focus();}},80);
return;
}
showScreen(teachState.returnScreen||'map');
}

function enterQuiz(unitIdx){
const status = getUnitStatus(state.currentMap, unitIdx);
if(status==='locked'||status==='empty') return;
state.currentUnit = unitIdx;
state.currentQ = 0;
state.answers = [];
state.answered = false;
const questionCount=getUnitQuizQuestionCount(state.currentMap,unitIdx);
state.quizQuestions = pickQuizQuestions(MAPS[state.currentMap].units[unitIdx],questionCount);
if(!state.quizQuestions.length){
alert('这一关暂时没有可用题目。');
return;
}
showScreen('quiz');
renderQuiz();
}

// ======== QUIZ ========
function renderQuiz(){
const map = MAPS[state.currentMap];
const unit = map.units[state.currentUnit];
const q = state.quizQuestions[state.currentQ];
const totalQuestions=state.quizQuestions.length;
const letters = ['A','B','C','D'];
const hasTable=/^\s*\|.+\|\s*$/m.test(q.q||'');
const isLongQuestion=String(q.q||'').replace(/\s/g,'').length>72;
const quizScreen=document.getElementById('screen-quiz');
const quizCard=document.getElementById('quiz-card');
if(quizScreen){quizScreen.classList.toggle('table-question',hasTable);quizScreen.scrollTop=0;}
if(quizCard){
quizCard.classList.toggle('has-table',hasTable);
quizCard.classList.toggle('long-question',isLongQuestion&&!hasTable);
}

document.getElementById('quiz-title').textContent = unit.name;
document.getElementById('quiz-counter').textContent = `第 ${state.currentQ+1} / ${totalQuestions} 题`;

// Dots
let dotsHtml='';
for(let i=0;i<totalQuestions;i++){
let cls='quiz-dot';
if(i===state.currentQ) cls+=' active';
if(i<state.answers.length){
cls += state.answers[i].correct ? ' correct' : ' wrong';
}
dotsHtml+=`<div class="${cls}"></div>`;
}
document.getElementById('quiz-dots').innerHTML=dotsHtml;

document.getElementById('question-text').innerHTML = renderQuestionContent(q.q);

let optsHtml='';
q.opts.forEach((opt,i)=>{
optsHtml+=`<button class="option-btn" id="opt-${i}" onclick="selectAnswer(${i})"><span class="option-letter">${letters[i]}</span><span>${escapeHtml(opt)}</span></button>`;
});
document.getElementById('options-container').innerHTML=optsHtml;
const explanation=document.getElementById('answer-explanation');
explanation.classList.remove('show');
explanation.innerHTML='';

document.getElementById('btn-next').disabled=true;
document.getElementById('btn-next').textContent = state.currentQ<totalQuestions-1 ? '下一题' : '查看结果';
state.answered=false;
}

function selectAnswer(idx){
if(state.answered) return;
state.answered=true;
const q = state.quizQuestions[state.currentQ];
const correct = q.ans;
const isCorrect = idx===correct;

if(isCorrect) removeMistakeByQuestion(q); else addMistake(q);

state.answers.push({selected:idx, correct:isCorrect});

// Highlight
const btns = document.querySelectorAll('.option-btn');
btns.forEach((b,i)=>{
b.classList.add('disabled');
if(i===idx && isCorrect) b.classList.add('selected-correct');
if(i===idx && !isCorrect) b.classList.add('selected-wrong');
if(i===correct && !isCorrect) b.classList.add('show-correct');
});

// Update dots
const dots = document.querySelectorAll('.quiz-dot');
dots[state.currentQ].classList.remove('active');
dots[state.currentQ].classList.add(isCorrect?'correct':'wrong');

const explanation=document.getElementById('answer-explanation');
explanation.innerHTML=renderAnswerExplanation(q,idx);
explanation.classList.add('show');

document.getElementById('btn-next').disabled=false;
}

function nextQuestion(){
if(state.currentQ<state.quizQuestions.length-1){
state.currentQ++;
state.answered=false;
renderQuiz();
}else{
showResults();
}
}

function exitQuiz(){
state.quizQuestions=[];
state.answers=[];
state.currentQ=0;
state.answered=false;
showScreen('map');
}

// ======== RESULTS ========
function showResults(){
const correctCount = state.answers.filter(a=>a.correct).length;
const totalQuestions=Math.max(1,state.quizQuestions.length);
const stars=Math.round((correctCount/totalQuestions)*3);
const wasCompleted=Boolean(progress.maps[state.currentMap].units[state.currentUnit].completed);

// Save
progress.maps[state.currentMap].units[state.currentUnit].stars = Math.max(progress.maps[state.currentMap].units[state.currentUnit].stars, stars);
progress.maps[state.currentMap].units[state.currentUnit].completed = true;
saveProgress(progress);

showScreen('results');

const titles = ['再接再厉！','继续加油！','表现不错！','完美通关！'];
const messages = [
'先回看每个选项为什么成立或不成立，再试一次吧！',
'已经抓住一部分线索，订正后会更稳。',
'大部分判断正确，再核对一次容易混淆的选项。',
'太厉害了！本关全部答对。'
];
const resultLevel=correctCount===totalQuestions?3:stars;
document.getElementById('results-title').textContent = titles[resultLevel];
document.getElementById('results-score').textContent = `${correctCount} / ${totalQuestions} 正确`;
document.getElementById('results-message').textContent = messages[resultLevel];
const reward=document.getElementById('results-reward');
const gameMap=getGameMapConfig(state.currentMap);
if(gameMap){
const unitGame=getGameUnitConfig(state.currentMap,state.currentUnit);
const scenes=getUnitScenes(state.currentMap,state.currentUnit);
const fractures=getUnitMistakeCount(state.currentMap,state.currentUnit);
const catalogFilter=gameMap.filter||MAPS[state.currentMap]?.id||'all';
const riverTitle=gameMap.title||`${MAPS[state.currentMap].name}长河`;
reward.hidden=false;
reward.innerHTML=scenes.length
?`<span class="results-reward-icon">境</span><div><small>${wasCompleted?'历史现场保持开放':'新的历史现场已经解锁'}</small><strong>${scenes.map(scene=>escapeHtml(scene.title)).join(' · ')}</strong><p>${fractures?`本关仍有 ${fractures} 道错题，可稍后前往“错题记录”订正。`:'本关没有待订正错题，可以进入现场换个身份继续探索。'}</p><button type="button" class="btn-enter-reward" onclick="openTeachCatalog('${escapeHtml(catalogFilter)}','map')">进入历史现场</button></div>`
:`<span class="results-reward-icon">河</span><div><small>${wasCompleted?'时代节点保持点亮':'时代节点已经修复'}</small><strong>${escapeHtml(unitGame?.landmark||MAPS[state.currentMap].units[state.currentUnit].name)}</strong><p>${fractures?`仍有 ${fractures} 道错题等待订正。`:`这一段${escapeHtml(riverTitle)}已经恢复颜色。`}</p></div>`;
}else{
reward.hidden=true;
reward.innerHTML='';
}

// Stars
let starsHtml='';
for(let i=0;i<3;i++){
starsHtml+=`<span class="star-icon" id="star-${i}">${i<stars?'⭐':'☆'}</span>`;
}
document.getElementById('stars-display').innerHTML=starsHtml;

// Animate stars
if(correctCount>0){
correctCount===totalQuestions && spawnConfetti();
for(let i=0;i<stars;i++){
setTimeout(()=>{
const el=document.getElementById('star-'+i);
el.classList.add('earned','animate');
}, 300+i*400);
}
}
}

function backToMap(){
showScreen('map');
}

// ======== CONFETTI ========
function spawnConfetti(){
const container = document.getElementById('confetti-container');
const colors=['#DAA520','#8B4513','#A0522D','#558B2F','#C4A882','#D4A574','#E8C36A'];
for(let i=0;i<40;i++){
const el = document.createElement('div');
el.className='confetti';
el.style.left=Math.random()*100+'%';
el.style.width=(Math.random()*8+4)+'px';
el.style.height=(Math.random()*8+4)+'px';
el.style.background=colors[Math.floor(Math.random()*colors.length)];
el.style.borderRadius=Math.random()>.5?'50%':'2px';
el.style.animationDelay=Math.random()*1.5+'s';
el.style.animationDuration=(Math.random()*1.5+2)+'s';
container.appendChild(el);
}
setTimeout(()=>{ container.innerHTML=''; },4000);
}

// ======== PROVINCE SWITCH ========
function switchProvince(province){
  if(!province||province==='guangdong') return;
  alert('当前仅支持广东版，其他省份版本敬请期待。');
  document.getElementById('province-select').value='guangdong';
}

// ======== INIT ========
renderMenu();
