import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { questionSimilarity } from './question-dedupe.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const context={};
vm.createContext(context);
vm.runInContext(`${fs.readFileSync(path.join(root,'data','题库.js'),'utf8')}\nthis.__maps=MAPS;`,context);
const maps=JSON.parse(JSON.stringify(context.__maps));
const questions=[];
maps.forEach((map,mapIndex)=>map.units.forEach((unit,unitIndex)=>
  unit.questions.forEach((question,questionIndex)=>questions.push({
    mapIndex,unitIndex,questionIndex,map:map.name,unit:unit.name,question
  }))
));

const candidates=[];
for(let left=0;left<questions.length;left++){
  for(let right=left+1;right<questions.length;right++){
    const similarity=questionSimilarity(questions[left].question,questions[right].question);
    if(similarity.duplicate||similarity.stem>=0.78||similarity.containment>=0.78){
      candidates.push({
        left:{map:questions[left].map,unit:questions[left].unit,index:questions[left].questionIndex+1,q:questions[left].question.q,opts:questions[left].question.opts,ans:questions[left].question.ans},
        right:{map:questions[right].map,unit:questions[right].unit,index:questions[right].questionIndex+1,q:questions[right].question.q,opts:questions[right].question.opts,ans:questions[right].question.ans},
        similarity
      });
    }
  }
}
candidates.sort((a,b)=>(Number(b.similarity.duplicate)-Number(a.similarity.duplicate))||(b.similarity.stem-a.similarity.stem)||(b.similarity.options-a.similarity.options));
console.log(JSON.stringify({totalQuestions:questions.length,candidateCount:candidates.length,candidates},null,2));
