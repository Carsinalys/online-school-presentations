
const BANK=globalThis.__mirQuestionBank;


"use strict";
const GROUP_KEYS=['equations','coefficients','conditions','types'];
const GROUP_NAMES={equations:'Уравнения превращений',coefficients:'Коэффициенты',conditions:'Условия реакций',types:'Названия химических процессов'};
const main=document.getElementById('main'),slide=document.getElementById('slide');
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=list=>{const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;};
const state={phase:'welcome',mode:'diagnostic',items:[],index:0,answers:{},mistakes:[],diagnosticSnapshot:null,correctionSnapshot:null,correctionRound:0,reviewItems:[],reviewIndex:0,reviewSource:'diagnostic',reviewComplete:false,correctionReviewComplete:false,reviewGate:false};
function fit(){if(window.innerWidth<=900||window.innerHeight>window.innerWidth){slide.style.transform='none';return;}const scale=Math.min(window.innerWidth/1600,window.innerHeight/900);slide.style.transform=`scale(${scale})`;}
window.addEventListener('resize',fit);window.addEventListener('orientationchange',fit);
function scrollTop(){window.scrollTo({top:0,behavior:'instant'});const sc=document.getElementById('review-scroll');if(sc)sc.scrollTop=0;}
function btn(text,action,cls=''){return `<button type="button" class="btn ${cls}" data-action="${action}">${escapeHtml(text)}</button>`;}
// plus always moves WITH the next term, and never stays alone at the end of a line
function chem(text){const s=String(text);const chunks=s.split(/\s+(\+|→)\s+/);let out=`<span class="chem-part">${escapeHtml(chunks[0]||'')}</span>`;for(let i=1;i<chunks.length;i+=2){const op=chunks[i],term=chunks[i+1]||'';out+=`<span class="chem-part">&nbsp;${escapeHtml(op)}&nbsp;${escapeHtml(term)}</span>`;}return `<span class="chem-eqn">${out}</span>`;}
function isEquation(s){return s.includes('→')&&/[A-ZА-Я][₀-₉]|CH|C₂|C₃|C₄|H₂|CO|NaOH/.test(s)}
function rich(s){const v=String(s);return isEquation(v)?chem(v):escapeHtml(v)}
function promptMarkup(q,isReview=false){let lines=q.stem.split('\n');return lines.map((line,i)=>{if(/^Условия:/.test(line))return `<div class="prompt-conditions">${escapeHtml(line)}</div>`;if(isEquation(line))return `<div class="prompt-equation ${line.length>56?'long':''}">${chem(line)}</div>`;if(line.includes('→'))return `<div class="prompt-scheme">${escapeHtml(line)}</div>`;return `<div class="prompt-text">${escapeHtml(line)}</div>`}).join('')}
function answerMarkup(t){let x=String(t);return `<span class="answer-value ${x.length>58?'long':''}">${rich(x)}</span>`}
function wrongReason(q,chosen){
 if(chosen==null)return 'Ответ не был выбран. Внимательно сопоставь условие и правильное решение.';
 if(q.group==='coefficients')return 'Этот коэффициент не соответствует уравнению с наименьшими целыми коэффициентами. Сначала уравняй число атомов каждого элемента в обеих частях уравнения, затем проверь общий множитель коэффициентов.';
 if(q.group==='types'){
  const dict={'Горение':'Горение — взаимодействие вещества с кислородом с выделением энергии.','Галогенирование':'Галогенирование — введение атомов галогена в молекулу.','Дегидрирование':'При дегидрировании отщепляется молекулярный водород H₂.','Гидрирование':'При гидрировании к веществу присоединяется водород H₂.','Крекинг':'Крекинг — расщепление углеродного скелета на более короткие молекулы.','Пиролиз':'Пиролиз — термическое разложение вещества.','Изомеризация':'Изомеризация — перестройка строения молекулы без изменения её состава.','Высокотемпературный пиролиз':'Высокотемпературный пиролиз — превращение при очень высокой температуре.','Паровая конверсия метана':'Паровая конверсия — реакция метана с водяным паром.','Дегидроциклизация (ароматизация)':'При дегидроциклизации линейная углеродная цепь образует цикл с потерей водорода.'};
  return (dict[chosen]||'Название выбранного процесса не соответствует происходящему превращению.')+' Проследи по схеме, что изменилось в строении вещества или составе продуктов.';
 }
 if(q.group==='conditions'){
  if(['q47','q48'].includes(q.id))return 'Продукты горения зависят от количества доступного кислорода. Сравни, какой именно оксид углерода указан в вопросе.';
  const s=String(chosen).toLowerCase();if(s.includes('br₂')||s.includes('бром'))return 'Бром используют при бромировании, тогда как для этого превращения требуются другие реагенты или условия.';
  if(s.includes('cl₂')||s.includes('хлор'))return 'Хлор используют при хлорировании, однако здесь нужна другая реакция или другой набор условий.';
  if(s.includes('никел')||s.includes('ni')||s.includes('h₂'))return 'Водород и никелевый катализатор применяют при гидрировании; сопоставь эти условия с исходными веществами.';
  if(s.includes('o₂')||s.includes('кислород'))return 'Кислород необходим для горения, но при указанном получении вещества происходит другое превращение.';
  if(s.includes('пар')||s.includes('водяной'))return 'Водяной пар используют при конверсии метана. Проверь, соответствует ли это продукту в задании.';
  return 'Это условие характерно для другого превращения. Сравни реагент, температуру, катализатор и необходимость освещения.';
 }
 if(q.group==='equations'){
  let s=String(chosen);if(s.includes('O₂')&&q.correct.includes('O₂'))return 'Это тоже реакция с кислородом, но образуются другие продукты. Обрати внимание на CO₂, CO и C: они не взаимозаменяемы.';
  if(s.includes('O₂'))return 'Выбранное уравнение относится к горению, а не к получению вещества, указанного в схеме превращения.';
  if(s.includes('Br₂')&&!q.correct.includes('Br₂'))return 'В этом уравнении используется бром и получается другое производное углеводорода.';
  if(s.includes('Cl₂')&&!q.correct.includes('Cl₂'))return 'В выбранном уравнении используется хлор, но нужен другой реагент или продукт.';
  if(s.includes('H₂O')&&!q.correct.includes('H₂O'))return 'В выбранном уравнении присутствует вода; сравни получаемые продукты с заданной схемой.';
  return 'В этом уравнении отличаются продукты, исходные вещества или строение углеродного скелета. Сверь число атомов углерода и вид превращения.';
 }
 return 'Сравни выбранный ответ с уравнением и пояснением.';
}
function begin(){const chosen=[];for(const g of GROUP_KEYS){chosen.push(...shuffle(BANK.filter(q=>q.group===g)).slice(0,5));}startQuiz(shuffle(chosen),'diagnostic');state.diagnosticSnapshot=null;state.correctionSnapshot=null;state.correctionRound=0;state.reviewComplete=false;state.correctionReviewComplete=false;}
function startQuiz(items,mode){state.mode=mode;state.items=items.map(q=>({...q,options:shuffle(q.options)}));state.answers={};state.mistakes=[];state.index=0;state.phase='quiz';render();scrollTop()}
function startCorrection(){const remaining=state.phase==='results'&&state.diagnosticSnapshot?state.diagnosticSnapshot.mistakes:state.mistakes; if(!remaining||!remaining.length)return;state.correctionRound++;startQuiz(shuffle(remaining),'correction');}
function choose(option){const q=state.items[state.index];state.answers[q.id]=option;render();}
function navigate(delta){state.index=Math.max(0,Math.min(state.items.length-1,state.index+delta));render();scrollTop()}
function finish(){const answers={...state.answers};const items=[...state.items];const mistakes=items.filter(q=>answers[q.id]!==q.correct);const total=items.length;const correct=total-mistakes.length;let snapshot={items,answers,mistakes,total,correct,percent:Math.round(100*correct/total)};state.mistakes=mistakes; if(state.mode==='diagnostic'){state.diagnosticSnapshot=snapshot;state.phase='results';}else{state.correctionSnapshot=snapshot;state.phase='correctionResults';}render();scrollTop();}
function renderWelcome(){main.innerHTML=`<section class="center"><div class="eyebrow">ОРГАНИЧЕСКАЯ ХИМИЯ · М.И.Р.</div><h1>Диагностический тест<br>«Химические свойства алканов»</h1><p>Проверь знания уравнений реакций, коэффициентов, условий и названий химических процессов.</p><div class="pills"><span>80 вопросов в банке</span><span>20 за попытку</span><span>4 раздела</span></div><div class="actions">${btn('Начать проверку знаний','start','primary')}${btn('Инструкция','instruction','muted')}</div></section>`}
function renderInstruction(){main.innerHTML=`<section class="center"><h1>Как работать с тестом</h1><p>В каждой попытке выбираются 20 случайных заданий — по пять из каждого из четырёх разделов.</p><p>В каждом вопросе один правильный ответ. Можно возвращаться назад и менять ответ. Правильные ответы и пояснения появятся только после завершения.</p><p>В заданиях на коэффициенты используй наименьшие целые числа. После завершения появятся результаты и разбор только неверных ответов. Затем можно выполнить работу над ошибками.</p><div class="actions">${btn('На главную','home')}${btn('Начать проверку знаний','start','primary')}</div></section>`}
function renderQuiz(){let q=state.items[state.index];const n=state.index+1;let selected=state.answers[q.id];let answered=state.items.filter(x=>state.answers[x.id]!==undefined).length;
 const label=state.mode==='correction'?'Работа над ошибками':'Проверка знаний';
 main.innerHTML=`<div class="progress-row"><span class="category">${escapeHtml(GROUP_NAMES[q.group])}</span><span class="round-note">${label}</span><span>${n} / ${state.items.length}</span><span class="progress-track"><b style="width:${n/state.items.length*100}%"></b></span><span>Отвечено: ${answered}</span></div><div class="prompt">${promptMarkup(q)}</div><div class="options">${q.options.map((v,i)=>`<button class="answer ${selected===v?'chosen':''}" type="button" data-choice="${i}" aria-pressed="${selected===v}"><span class="answer-mark">${'АБВГ'[i]}</span>${answerMarkup(v)}</button>`).join('')}</div><div class="footerbar"><span class="footer-msg">Выбери один ответ</span><div class="footer-actions">${btn('← Назад','previous')}${btn(n===state.items.length?'Завершить и проверить':'Далее →','next',n===state.items.length?'primary':'')}</div></div>`;
 main.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>choose(q.options[Number(b.dataset.choice)])));
 const previous=main.querySelector('[data-action=previous]');if(previous)previous.disabled=state.index===0;
}
function statsHtml(s){return `<div class="stats">${GROUP_KEYS.map(g=>{const qs=s.items.filter(q=>q.group===g);if(!qs.length)return '';let good=qs.filter(q=>s.answers[q.id]===q.correct).length;return `<div class="stat"><div class="stat-title">${escapeHtml(GROUP_NAMES[g])}</div><div class="stat-score">${good} / ${qs.length}</div><div class="stat-note">Ошибок: ${qs.length-good}</div></div>`}).join('')}</div>`}
function briefExplanation(explanation){
 const sentences=String(explanation).split(/(?<=[.!?])\s+(?=[А-ЯЁ])/u);
 return sentences.slice(0,2).join(' ');
}
function reviewItem(q,answer,index,total,originalIndex){
 const showEquation=q.correct!==q.solution;
 return `<article class="review-sheet" aria-label="Ошибка ${index+1}">
  <div class="review-sheet-head"><span class="review-position">Ошибка ${index+1} из ${total} · задание ${originalIndex+1}</span><span class="review-topic">${escapeHtml(GROUP_NAMES[q.group])}</span></div>
  <div class="review-stem">${promptMarkup(q,true)}</div>
  <div class="review-answer-rows">
    <div class="review-row wrong"><span class="review-row-label">Твой ответ</span><span class="review-row-value">${answer===undefined?'Не выбран':rich(answer)}</span></div>
    <div class="review-row correct"><span class="review-row-label">Верный ответ</span><span class="review-row-value">${rich(q.correct)}</span></div>
  </div>
  ${showEquation?`<div class="review-reaction"><span class="review-reaction-label">Уравнение</span><span class="review-chem">${chem(q.solution)}</span></div>`:''}
  ${q.conditions?`<div class="review-conditions">Условия: ${escapeHtml(q.conditions)}</div>`:''}
  <div class="review-explanation">${escapeHtml(briefExplanation(q.explanation))}</div>
 </article>`;
}
function getCurrentSnapshot(){return state.phase==='correctionResults'||state.mode==='correction'&&state.phase==='review'||state.reviewSource==='correction'&&state.phase==='reviewDone'?state.correctionSnapshot:state.diagnosticSnapshot;}
function openReview(source){
 const s=source==='correction'?state.correctionSnapshot:state.diagnosticSnapshot;
 if(!s)return;
 state.reviewSource=source;state.reviewItems=s.mistakes;state.reviewIndex=0;state.reviewGate=false;state.phase=s.mistakes.length?'review':'reviewDone';if(!s.mistakes.length){if(source==='correction')state.correctionReviewComplete=true;else state.reviewComplete=true;}render();scrollTop();
}
function nextReview(){
 if(!state.reviewGate)return;
 if(state.reviewSource==='correction')state.correctionReviewComplete=true;
 else state.reviewComplete=true;
 state.phase='reviewDone';render();scrollTop();
}
function revealReviewNext(){
 if(state.phase!=='review'||state.reviewGate)return;
 state.reviewGate=true;
 const next=document.getElementById('review-next');
 const info=document.getElementById('review-scroll-hint');
 if(next){next.hidden=false;next.removeAttribute('aria-hidden');}
 if(info)info.hidden=true;
}
function checkReviewScroll(){
 if(state.phase!=='review'||state.reviewGate)return;
 const scroll=document.getElementById('review-scroll');if(!scroll)return;
 const isMobile=window.innerWidth<=900||window.innerHeight>window.innerWidth;
 if(isMobile){
   const end=document.getElementById('review-end-marker');
   if(end&&end.getBoundingClientRect().bottom<=window.innerHeight-8)revealReviewNext();
 }else if(scroll.scrollTop+scroll.clientHeight>=scroll.scrollHeight-28)revealReviewNext();
}
function initReviewScroll(){
 const scroll=document.getElementById('review-scroll');if(!scroll)return;
 scroll.addEventListener('scroll',checkReviewScroll,{passive:true});
 requestAnimationFrame(checkReviewScroll);
}
function renderReview(){
 const snap=state.reviewSource==='correction'?state.correctionSnapshot:state.diagnosticSnapshot;
 if(!snap)return;
 const mistakes=state.reviewItems;
 if(!mistakes.length){state.phase='reviewDone';render();return;}
 state.reviewGate=false;
 main.innerHTML=`<section class="review-screen">
  <div class="review-screen-header"><h2>Разбор заданий</h2><span class="review-progress">Ошибок: ${mistakes.length}</span></div>
  <div class="review-scroll-body" id="review-scroll">
   ${mistakes.map((q,i)=>reviewItem(q,snap.answers[q.id],i,mistakes.length,snap.items.findIndex(o=>o.id===q.id))).join('')}
   <div id="review-end-marker" class="review-end-marker"></div>
  </div>
  <div class="review-controls"><span class="read-through" id="review-scroll-hint">Просмотри разбор до конца</span><button class="btn primary" type="button" id="review-next" data-action="review-next" hidden aria-hidden="true">Дальше →</button></div>
 </section>`;
 initReviewScroll();
}
function renderReviewDone(){
 const s=state.reviewSource==='correction'?state.correctionSnapshot:state.diagnosticSnapshot;
 if(!s)return;
 const missed=s.mistakes.length;
 main.innerHTML=`<section class="review-done">
  <div class="eyebrow">ПРОВЕРКА ЗАВЕРШЕНА</div>
  <h2>${missed?'Разбор ошибок завершён':'Все ответы верны!'}</h2>
  <div class="review-done-stat">${s.correct} из ${s.total} · ${s.percent}%</div>
  <div class="actions">${missed?btn('Работа над ошибками','correction','soft'):''}${state.reviewSource==='correction'?btn('Исходный результат','original'):btn('Результаты диагностики','original')}${btn('Новая диагностика','start','primary')}</div>
 </section>`;
}
function renderResults(){
 const diagnostic=state.phase==='results';const s=diagnostic?state.diagnosticSnapshot:state.correctionSnapshot;
 if(!s)return;
 const missed=s.mistakes.length;
 main.innerHTML=`<section class="results-screen">
 <div class="result-heading"><h2>${diagnostic?'Результаты диагностики':'Результат работы над ошибками'}</h2><div class="score">${s.correct} из ${s.total} · ${s.percent}%</div></div>
 ${statsHtml(s)}
 <div class="result-summary"><h3>${missed?`Ошибок: ${missed}`:'Все ответы верны!'}</h3></div>
 <div class="result-buttons">${missed?btn('Разбор заданий','review-start','primary'):''}${(diagnostic?state.reviewComplete:state.correctionReviewComplete)&&missed?btn('Работа над ошибками','correction','soft'):''}${!diagnostic?btn('Исходный результат','original'):''}${btn('Новая диагностика','start')}</div>
 </section>`;
}
function fitAnswerEquations(){
 const mobile=window.innerWidth<=900||window.innerHeight>window.innerWidth;
 for(const card of document.querySelectorAll('.answer')){
   const value=card.querySelector('.answer-value');
   const eq=value&&value.querySelector('.chem-eqn');
   if(!eq)continue;
   eq.style.whiteSpace='nowrap';
   eq.style.display='inline-block';
   let size=mobile?26:38;
   eq.style.fontSize=size+'px';
   // clientWidth reflects the actual available box after the option letter.
   const available=Math.max(1,value.clientWidth-1);
   let natural=eq.getBoundingClientRect().width;
   let availablePixels=value.getBoundingClientRect().width;
   if(natural>availablePixels){
     size=Math.max(6,Math.min(size,size*(availablePixels-2)/natural));
     eq.style.fontSize=size+'px';
     // Protect against sub-pixel rounding and browser font substitutions.
     for(let i=0;i<20&&eq.getBoundingClientRect().width>availablePixels-.5;i++){
       size=Math.max(5,size-.3);eq.style.fontSize=size+'px';
     }
   }
 }
}
window.addEventListener('resize',()=>requestAnimationFrame(fitAnswerEquations));
window.addEventListener('orientationchange',()=>requestAnimationFrame(fitAnswerEquations));
if(document.fonts)document.fonts.ready.then(()=>{fitAnswerEquations();fitOtherEquations()});

function render(){
 if(state.phase==='welcome')renderWelcome();
 else if(state.phase==='instruction')renderInstruction();
 else if(state.phase==='quiz')renderQuiz();
 else if(state.phase==='results'||state.phase==='correctionResults')renderResults();
 else if(state.phase==='review')renderReview();
 else if(state.phase==='reviewDone')renderReviewDone();
 main.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',()=>dispatch(el.dataset.action)));
 fit();fitAnswerEquations();fitOtherEquations();
}
function dispatch(action){switch(action){
 case 'start':begin();break;
 case 'instruction':state.phase='instruction';render();scrollTop();break;
 case 'home':state.phase='welcome';render();scrollTop();break;
 case 'next':state.index===state.items.length-1?finish():navigate(1);break;
 case 'previous':navigate(-1);break;
 case 'correction':startCorrection();break;
 case 'original':state.phase='results';state.reviewSource='diagnostic';render();scrollTop();break;
 case 'review-start':openReview(state.phase==='correctionResults'?'correction':'diagnostic');break;
 case 'review-next':nextReview();break;
 
 }}
function fitOtherEquations(){
 for(const eq of document.querySelectorAll('.review-row-value .chem-eqn,.review-chem .chem-eqn,.review-stem .chem-eqn,.prompt-equation .chem-eqn')){
  eq.style.fontSize='';
  const container=eq.closest('.review-row-value,.review-chem,.prompt-equation,.review-stem');
  if(!container)continue;
  const available=container.getBoundingClientRect().width-5;
  if(available<=0)continue;
  const spans=[...eq.querySelectorAll('.chem-part')];
  const maxPart=Math.max(0,...spans.map(e=>e.getBoundingClientRect().width));
  if(maxPart>available){
   const base=parseFloat(getComputedStyle(eq).fontSize)||26;
   eq.style.fontSize=Math.max(10,base*(available-3)/maxPart)+'px';
  }
 }
}
window.addEventListener('resize',()=>{requestAnimationFrame(()=>{fitOtherEquations();checkReviewScroll()})});
window.addEventListener('scroll',checkReviewScroll,{passive:true});

document.getElementById('top-home').addEventListener('click',()=>dispatch('home'));render();

