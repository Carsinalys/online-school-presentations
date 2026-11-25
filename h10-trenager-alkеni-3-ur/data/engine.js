
'use strict';
const BANK=globalThis.__mirQuestionBank;
const BLOCKS=[{"id":1,"title":"Продукты реакций и структурные формулы"},{"id":2,"title":"Коэффициенты в уравнениях реакций"},{"id":3,"title":"Реагенты и условия превращений"},{"id":4,"title":"Небольшие цепочки превращений"}];
const STORAGE_KEY='mir.alkenes.finalquiz40.v1';
const $=id=>document.getElementById(id);
const letters=['А','Б','В','Г'];
const byId=new Map(BANK.map(q=>[q.id,q]));
let state=null;
let notificationTimeout=null;
let observer=null;
function randInt(n){if(window.crypto&&crypto.getRandomValues){let a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n;}return Math.floor(Math.random()*n);}
function shuffle(ar){let v=ar.slice();for(let i=v.length-1;i>0;i--){let j=randInt(i+1);[v[i],v[j]]=[v[j],v[i]];}return v;}
function buildAttempt(){
 let ids=[];for(const group of BLOCKS){const pool=shuffle(BANK.filter(q=>q.block===group.id));ids.push(...pool.slice(0,5).map(q=>q.id));}
 ids=shuffle(ids);
 return {version:3,screen:'quiz',ids,order:ids.map(()=>shuffle([0,1,2,3])),answers:ids.map(()=>null),pos:0,created:Date.now(),completed:false};
}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){}}
function restore(){try{let d=JSON.parse(localStorage.getItem(STORAGE_KEY));if(!d||d.version!==3||!Array.isArray(d.ids)||d.ids.length!==20||!Array.isArray(d.order)||!Array.isArray(d.answers)||d.answers.length!==20)return null;
 if(new Set(d.ids).size!==20||d.ids.some(id=>!byId.has(id)))return null;
 if(d.order.some(x=>!Array.isArray(x)||x.length!==4||new Set(x).size!==4||x.some(n=>n<0||n>3)))return null;
 if(d.answers.some((x,i)=>x!==null&&!d.order[i].includes(x)))return null;
 return d;}catch(e){return null;}}
function showScreen(name){['intro','quiz','results','review'].forEach(s=>$(s).classList.toggle('active',s===name));$('topProgress').textContent=name==='quiz'&&state?`Вопрос ${state.pos+1} из ${state.ids.length}`:'';
 if(state){state.screen=name;save();}}
function start(){state=buildAttempt();showScreen('quiz');renderQuestion();}
function resume(){if(!state){start();return}if(state.screen==='results'||state.screen==='review'){renderResults(); if(state.screen==='review')openReview();else showScreen('results');}else{showScreen('quiz');renderQuestion();}}
function isChemFormula(t){return !/[А-Яа-яЁё]/.test(t)&&/[=→₀-₉ₙ]|\[[–\-]|[A-Z][a-z]?\d/.test(t);}
function fitOneLine(el,desired=51,min=22){if(!el||!el.textContent.trim())return;const compact=innerWidth<=1100&&innerHeight<=700&&innerWidth/innerHeight>=1.5;if(compact){desired=26;min=12;}el.style.fontSize=desired+'px';if(window.innerWidth<=860&&!compact)return;
 const limit=el.clientWidth+1;let size=desired;while(el.scrollWidth>limit&&size>min){size-=1;el.style.fontSize=size+'px';}}
function fitOptionFormula(el){if(!el)return;el.style.fontSize='';if(window.innerWidth<=860)return;
 const available=el.clientWidth;let sz=parseFloat(getComputedStyle(el).fontSize);while(el.scrollWidth>available&&sz>19){sz--;el.style.fontSize=sz+'px';}}
function renderQuestion(){
 if(!state)return;const q=byId.get(state.ids[state.pos]),idx=state.pos;
 $('quizCount').textContent=`Задание ${idx+1} из ${state.ids.length}`;$('answeredCount').textContent=`Отвечено: ${state.answers.filter(a=>a!==null).length} из ${state.answers.length}`;
 $('topProgress').textContent=`Вопрос ${idx+1} из ${state.ids.length}`;
 $('questionTitle').textContent=q.question;
 $('questionScheme').textContent=q.scheme||'';$('questionScheme').classList.toggle('shown',Boolean(q.scheme));
 const nav=$('questionNav');nav.replaceChildren();for(let i=0;i<state.ids.length;i++){
  let b=document.createElement('button');b.type='button';b.className='progress-dot'+(state.answers[i]!==null?' done':'')+(i===idx?' current':'');b.setAttribute('aria-label',`Задание ${i+1}${state.answers[i]===null?' — не отвечено':' — ответ выбран'}`);b.title=b.getAttribute('aria-label');b.setAttribute('aria-current',i===idx?'step':'false');b.addEventListener('click',()=>{state.pos=i;save();renderQuestion()});nav.append(b);
 }
 const choices=$('choices');choices.replaceChildren();state.order[idx].forEach((originalIndex,optionPos)=>{
  const btn=document.createElement('button');btn.type='button';btn.className='choice'+(state.answers[idx]===originalIndex?' chosen':'');btn.setAttribute('aria-pressed',state.answers[idx]===originalIndex?'true':'false');
  const text=q.options[originalIndex];if(isChemFormula(text)&&text.length>24)btn.classList.add('formula-option');
  const code=document.createElement('span');code.className='choice-code';code.textContent=letters[optionPos];
  const content=document.createElement('span');content.className='choice-text';content.textContent=text;
  const mark=document.createElement('span');mark.className='radio';mark.setAttribute('aria-hidden','true');mark.textContent=state.answers[idx]===originalIndex?'✓':'';
  btn.append(code,content,mark);btn.addEventListener('click',()=>{state.answers[idx]=originalIndex;save();renderQuestion()});choices.append(btn);
 });
 $('prevBtn').disabled=idx===0;$('nextBtn').textContent=idx===state.ids.length-1?'Завершить контроль':'Далее →';
 $('notice').hidden=true;
 if(q.scheme)requestAnimationFrame(()=>fitOneLine($('questionScheme'),Math.min(55,Math.max(36,window.innerWidth*.039)),23));
 requestAnimationFrame(()=>document.querySelectorAll('.choice.formula-option .choice-text').forEach(fitOptionFormula));
 // Reset scroll on phones when changing a question
 if(window.innerWidth<=860)$('quiz').scrollTop=0;
}
function flash(msg){const n=$('notice');n.textContent=msg;n.hidden=false;clearTimeout(notificationTimeout);notificationTimeout=setTimeout(()=>n.hidden=true,3500);}
function goNext(){if(state.pos<state.ids.length-1){state.pos++;save();renderQuestion();return}finishAttempt();}
function finishAttempt(){const missed=state.answers.findIndex(v=>v===null);if(missed!==-1){state.pos=missed;save();renderQuestion();flash(`Сначала выбери ответ в задании № ${missed+1}.`);return;}
 state.completed=true;state.completedAt=Date.now();state.screen='results';save();renderResults();}
function resultData(){return state.ids.map((id,i)=>{const q=byId.get(id);return {q,serial:i+1,selected:state.answers[i],correct:state.answers[i]===q.correct,optionOrder:state.order[i]};});}
function renderResults(){const data=resultData(),good=data.filter(x=>x.correct),bad=data.filter(x=>!x.correct),score=good.length;
 $('scoreValue').textContent=score;$('scoreCaption').textContent=`${Math.round(100*score/data.length)}% правильных ответов`;
 $('correctTotal').textContent=good.length;$('wrongTotal').textContent=bad.length;
 $('correctNumbers').textContent=good.length?good.map(x=>x.serial).join(', '):'Нет';
 $('wrongNumbers').textContent=bad.length?bad.map(x=>x.serial).join(', '):'Нет';
 $('reviewBtn').textContent=bad.length?`Работа над ошибками (${bad.length}) →`:'Просмотреть итог работы →';
 showScreen('results');
}
function makeElem(tag,cls,text){let x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;}
function addAnswer(parent,type,caption,body){let x=makeElem('div','review-answer'+(type==='correct'?' correct':''));x.append(makeElem('small','',caption),makeElem('span','',body));parent.append(x);}
function openReview(){
 const root=$('review'),list=$('reviewList');list.replaceChildren();
 const wrong=resultData().filter(x=>!x.correct);
 $('reviewLead').textContent=wrong.length
  ?`Ошибок: ${wrong.length}. Ниже приведены полные условия, все варианты ответа в порядке этой попытки и объяснение каждого задания. Прочитай разбор до конца.`
  :'Ошибок нет. Все ответы верны!';
 for(const a of wrong){
  const q=a.q,c=makeElem('article','review-card');
  const head=makeElem('div','review-card-top');
  head.append(makeElem('span','review-number',`Задание № ${a.serial}`),makeElem('span','review-block',BLOCKS.find(b=>b.id===q.block).title));
  c.append(head);
  c.append(makeElem('h2','review-q',q.question));
  if(q.scheme)c.append(makeElem('div','review-scheme',q.scheme));
  const options=makeElem('div','review-options');
  options.append(makeElem('h3','review-options-heading','Варианты ответа (как в твоей работе):'));
  for(let optionPos=0;optionPos<a.optionOrder.length;optionPos++){
   const originalIndex=a.optionOrder[optionPos];
   const selected=originalIndex===a.selected;
   const isCorrect=originalIndex===q.correct;
   const line=makeElem('div','review-option'+(selected?' review-option-wrong':'')+(isCorrect?' review-option-right':''));
   line.append(makeElem('span','review-option-letter',letters[optionPos]));
   const optionText=makeElem('span','review-option-text',q.options[originalIndex]);
   if(isChemFormula(q.options[originalIndex]))optionText.classList.add('review-option-formula');
   line.append(optionText);
   if(selected)line.append(makeElem('span','review-option-label','Твой ответ'));
   if(isCorrect)line.append(makeElem('span','review-option-label','Правильно'));
   options.append(line);
  }
  c.append(options);
  const answerLetter=(originalIndex)=>letters[a.optionOrder.indexOf(originalIndex)];
  addAnswer(c,'wrong','Твой ответ',`${answerLetter(a.selected)}. ${q.options[a.selected]}`);
  addAnswer(c,'correct','Правильный ответ',`${answerLetter(q.correct)}. ${q.options[q.correct]}`);
  const exp=makeElem('div','review-explanation');
  exp.append(makeElem('b','','Объяснение: '),document.createTextNode(q.explanation));
  c.append(exp);
  list.append(c);
 }
 if(!wrong.length){list.append(makeElem('div','review-card','Все задания выполнены правильно. Отличная работа!'));}
 $('repeatBtn').classList.remove('unlocked');
 showScreen('review');root.scrollTop=0;root.focus({preventScroll:true});
 if(observer)observer.disconnect();
 observer=new IntersectionObserver((entries)=>{
  if(entries.some(entry=>entry.isIntersecting)){
   $('repeatBtn').classList.add('unlocked');observer.disconnect();
  }
 },{root:root,threshold:0.1});
 observer.observe($('reviewSentinel'));
 if(root.scrollHeight<=root.clientHeight+3)$('repeatBtn').classList.add('unlocked');
}
$('startBtn').addEventListener('click',()=>{if(state&&state.completed){renderResults();}else if(state){resume();}else{start();}});
$('prevBtn').addEventListener('click',()=>{if(state.pos>0){state.pos--;save();renderQuestion();}});
$('nextBtn').addEventListener('click',goNext);
$('reviewBtn').addEventListener('click',openReview);
$('repeatBtn').addEventListener('click',()=>{if(observer)observer.disconnect();start();});
window.addEventListener('resize',()=>{if(state&&state.screen==='quiz'&&$('quiz').classList.contains('active')){let q=byId.get(state.ids[state.pos]);if(q.scheme)fitOneLine($('questionScheme'),Math.min(55,Math.max(36,innerWidth*.039)),23);document.querySelectorAll('.choice.formula-option .choice-text').forEach(fitOptionFormula);}});
state=restore();if(state){if(state.completed){$('startBtn').textContent='Посмотреть результат';}else{$('startBtn').textContent='Продолжить работу';}};
