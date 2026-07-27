const PUNCTUATION=/[\s`*_>“”‘’"'，。！？；：、（）()《》〈〉·—…\-【】\[\]{}]/g;

export function normalizeQuestionText(text=''){
  return String(text).normalize('NFKC').replace(PUNCTUATION,'').toLowerCase();
}

function bigrams(text){
  const normalized=normalizeQuestionText(text);
  if(normalized.length<2)return normalized?[normalized]:[];
  const result=[];
  for(let index=0;index<normalized.length-1;index++)result.push(normalized.slice(index,index+2));
  return result;
}

function diceCoefficient(left,right){
  const a=bigrams(left);
  const b=bigrams(right);
  if(!a.length||!b.length)return normalizeQuestionText(left)===normalizeQuestionText(right)?1:0;
  const counts=new Map();
  for(const gram of a)counts.set(gram,(counts.get(gram)||0)+1);
  let matches=0;
  for(const gram of b){
    const count=counts.get(gram)||0;
    if(count){matches+=1;counts.set(gram,count-1);}
  }
  return (2*matches)/(a.length+b.length);
}

function optionSetSimilarity(left,right){
  const a=Array.isArray(left?.opts)?left.opts:[];
  const b=Array.isArray(right?.opts)?right.opts:[];
  if(!a.length||!b.length)return 0;
  const scores=a.map(option=>Math.max(...b.map(candidate=>diceCoefficient(option,candidate))));
  return scores.reduce((sum,score)=>sum+score,0)/scores.length;
}

export function questionSimilarity(left,right){
  const a=normalizeQuestionText(left?.q);
  const b=normalizeQuestionText(right?.q);
  if(!a||!b)return {duplicate:false,stem:0,options:0,reason:'empty'};
  if(a===b)return {duplicate:true,stem:1,options:optionSetSimilarity(left,right),reason:'exact'};

  const shorter=a.length<=b.length?a:b;
  const longer=a.length>b.length?a:b;
  const containment=longer.includes(shorter)?shorter.length/longer.length:0;
  const stem=diceCoefficient(a,b);
  const options=optionSetSimilarity(left,right);
  const answerSimilarity=diceCoefficient(left?.opts?.[left?.ans],right?.opts?.[right?.ans]);
  const sameAnswerText=answerSimilarity>=0.82;
  const duplicate=(
    (containment>=0.86&&options>=0.62&&sameAnswerText)
    ||(stem>=0.78&&options>=0.75&&sameAnswerText)
    ||(stem>=0.84&&options>=0.75)
    ||(stem>=0.95&&options>=0.60)
  );
  return {duplicate,stem,options,containment,answerSimilarity,sameAnswerText,reason:duplicate?'near':'different'};
}

export function findDuplicateQuestion(entries,question){
  for(let index=0;index<entries.length;index++){
    const similarity=questionSimilarity(entries[index].question,question);
    if(similarity.duplicate)return {index,entry:entries[index],similarity};
  }
  return null;
}

function mergeSources(left='',right=''){
  return [...new Set(`${left}；${right}`.split('；').map(item=>item.trim()).filter(Boolean))].join('；');
}

export function mergeQuestionData(target,source){
  target.source=mergeSources(target.source,source.source);
  if(!target.explanation&&source.explanation)target.explanation=source.explanation;
  if(!target.type&&source.type)target.type=source.type;
  return target;
}

export function dedupeMaps(maps){
  const entries=[];
  const removed=[];
  maps.forEach((map,mapIndex)=>map.units.forEach((unit,unitIndex)=>{
    const unique=[];
    for(const question of unit.questions||[]){
      const match=findDuplicateQuestion(entries,question);
      if(match){
        mergeQuestionData(match.entry.question,question);
        removed.push({
          kept:{mapIndex:match.entry.mapIndex,unitIndex:match.entry.unitIndex,q:match.entry.question.q},
          removed:{mapIndex,unitIndex,q:question.q},
          similarity:match.similarity
        });
        continue;
      }
      unique.push(question);
      entries.push({mapIndex,unitIndex,question});
    }
    unit.questions=unique;
  }));
  return {entries,removed};
}
