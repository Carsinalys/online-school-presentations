
'use strict';
const BANK=globalThis.__mirQuestionBank;
const BLOCKS=['Выбор уравнения реакции','Расстановка коэффициентов','Реагенты и условия реакции','Названия химических процессов'];
const STORAGE_KEY='mir_diagnostic_alkenes_v1';
const app=document.getElementById('screen');
const status=document.getElementById('headerStatus');
const alphabet=['А','Б','В','Г'];
const shuffle=(arr)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const safe=(str)=>String(str??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state={mode:'intro',items:[],answers:[],current:0};
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){}}
function restore(){try{const raw=JSON.parse(localStorage.getItem(STORAGE_KEY));if(!raw||!['intro','quiz','results','review'].includes(raw.mode))return; if(raw.mode!=='intro'&&Array.isArray(raw.items)&&raw.items.length===20&&Array.isArray(raw.answers)&&raw.answers.length===20&&raw.items.every(z=>Number.isInteger(z.id)&&z.id>=1&&z.id<=80&&Array.isArray(z.order)&&z.order.length===4)){state=raw; if(state.mode==='quiz')state.current=Math.min(19,Math.max(0,state.current|0));}}catch(e){}}
function start(){let batch=[];for(let block=1;block<=4;block++){const choices=shuffle(BANK.filter(q=>q.block===block)).slice(0,5);batch.push(...choices.map(q=>({id:q.id,order:shuffle([0,1,2,3])})));}state={mode:'quiz',items:shuffle(batch),answers:Array(20).fill(null),current:0};persist();render();}
function itemAt(i){const selection=state.items[i];return {q:BANK[selection.id-1],sel:selection};}
function selectOption(origin){state.answers[state.current]=origin;persist();render();}
function move(to){state.current=Math.max(0,Math.min(19,to));persist();render();}
function next(){if(state.current<19){move(state.current+1);return;}const first=state.answers.findIndex(a=>a===null);if(first!==-1){move(first);return;}finish();}
function prev(){move(state.current-1);}
function finish(){if(state.answers.some(a=>a===null))return;state.mode='results';persist();render();window.scrollTo({top:0,behavior:'instant'});}
function showReview(){state.mode='review';persist();render();window.scrollTo({top:0,behavior:'instant'});}
function showResults(){state.mode='results';persist();render();window.scrollTo({top:0,behavior:'instant'});}
function score(){let good=0;const byBlock=[0,0,0,0];const wrong=[];state.items.forEach((it,i)=>{let q=BANK[it.id-1];if(state.answers[i]===q.answer){good++;byBlock[q.block-1]++;}else{wrong.push(i);}});return{good,byBlock,wrong};}
function btn(content,callback,classes=''){return `<button type="button" class="btn ${classes}" ${callback?'data-action="'+callback+'"':''}>${content}</button>`;}
function intro(){status.textContent='80 заданий';app.innerHTML=`<section class="hero"><p class="eyebrow">ДИАГНОСТИЧЕСКИЙ ТРЕНАЖЁР</p><h1 class="page-title">Химические свойства алкенов</h1><p class="hero-lead">Проверь, насколько уверенно ты умеешь записывать уравнения реакций, расставлять коэффициенты, выбирать реагенты и называть химические процессы.</p><div class="hero-counters"><div class="hero-chip"><strong>80</strong><span>заданий в банке</span></div><div class="hero-chip"><strong>20</strong><span>в одной попытке</span></div><div class="hero-chip"><strong>4 × 5</strong><span>из четырёх блоков</span></div></div><p class="hero-note">В каждом вопросе выбери один ответ. Вопросы и варианты перемешиваются. Изменить выбор можно до завершения. Правильные ответы и подробный разбор ошибок появятся только после окончания работы.</p>${btn('Начать диагностику','start','primary round')}</section>`;}
function schemeForQuiz(q){
  if(!q.scheme)return '';
  // Keep the chemical equation together; show a trailing verbal condition separately.
  const hasReaction=/[→=]/.test(q.scheme);
  if(!hasReaction)return `<div class="scheme is-description">${safe(q.scheme)}</div>`;
  let equation=q.scheme, conditions='';
  const m=equation.match(/^(.*?)\s+\(([^()]*)\)\s*$/);
  if(m){equation=m[1];conditions=m[2];}
  return `<div class="scheme" title="${safe(equation)}">${safe(equation)}</div>${conditions?`<div class="scheme-conditions">Условия: ${safe(conditions)}</div>`:''}`;
}
function quiz(){
  const {q,sel}=itemAt(state.current);
  const answered=state.answers.filter(x=>x!==null).length;
  status.textContent=`Ответов: ${answered} из 20`;
  const context=q.context?`<p class="context">${safe(q.context)}</p>`:'';
  const formula=schemeForQuiz(q);
  const opts=sel.order.map((orig,idx)=>{
    const op=q.options[orig];
    const isSelected=state.answers[state.current]===orig;
    const formulaOpt=q.block===1;
    return `<button type="button" class="choice ${isSelected?'selected':''}" aria-pressed="${isSelected?'true':'false'}" data-choice="${orig}"><span class="choice-indicator" aria-hidden="true">✓</span><span class="choice-letter">${alphabet[idx]}</span><span class="choice-text ${formulaOpt?'formula-option':''}" title="${safe(op)}">${safe(op)}</span></button>`;
  }).join('');
  const counter=state.current+1;
  app.innerHTML=`<section class="quiz-shell"><div class="quiz-top"><div class="pill">Блок ${q.block} · ${safe(BLOCKS[q.block-1])}</div><div class="pill muted">Задание ${counter} из 20</div></div><div class="track"><div class="track-fill" style="width:${answered*5}%"></div></div><div class="q-content"><h2 class="question-text">${safe(q.stem)}</h2>${context}${formula}<div class="options-grid">${opts}</div><p class="mobile-swipe-tip" aria-live="polite">↔ Длинное уравнение можно прокручивать по строке.</p><p class="note-under">Ответы проверяются только после завершения диагностической работы.</p></div><div class="quiz-foot"><div class="foot-group">${btn('← Назад','prev','ghost')}<span class="q-counter">${answered} / 20</span></div><div class="dots" aria-hidden="true">${state.answers.map((a,i)=>`<span class="dot ${a===null?'':'done'} ${state.current===i?'current':''}"></span>`).join('')}</div><div class="foot-group">${counter===20?(answered===20?btn('Завершить тест','finish','primary'):(state.answers[19]===null&&answered===19?btn('Выберите ответ','next','primary'):btn('К пропущенным →','next','primary'))):btn('Далее →','next','primary')}</div></div></section>`;
  const back=app.querySelector('[data-action="prev"]');
  if(back&&counter===1)back.disabled=true;
  const last=app.querySelector('[data-action="next"]');
  if(last&&counter===20&&answered===19&&state.answers[19]===null)last.disabled=true;
}
function results(){let {good,byBlock,wrong}=score();const pct=Math.round(good*5);status.textContent=`Результат: ${good} / 20`;
const panels=BLOCKS.map((b,i)=>`<div class="result-item"><div class="result-name">${safe(b)}</div><div class="result-num">${byBlock[i]} / 5</div><div class="result-meter"><span style="width:${byBlock[i]*20}%"></span></div></div>`).join('');
app.innerHTML=`<section class="result-wrap"><div class="eyebrow">ДИАГНОСТИКА ЗАВЕРШЕНА</div><h1 class="page-title small-title">Результаты по теме «Алкены»</h1><div class="score">${good} <small>из 20</small></div><p class="subtitle">Верных ответов: ${pct}% · Ошибок: ${wrong.length}</p><div class="result-blocks">${panels}</div><p class="hero-note">${wrong.length?`В разборе увидишь свой ответ, правильный вариант, уравнение реакции и объяснение по каждому заданию с ошибкой.`:'Все 20 ответов верные. Можно начать новую попытку — вопросы будут выбраны случайно.'}</p><div class="action-row">${wrong.length?btn('Разобрать ошибки','review','primary'):''}${btn('Новая попытка','start',wrong.length?'ghost':'primary')}</div></section>`;
}
function review(){const {wrong,good}=score();status.textContent=`Ошибок: ${wrong.length}`;
const cards=wrong.map(i=>{const {q}=itemAt(i);const theirs=q.options[state.answers[i]];const correct=q.options[q.answer];
return `<article class="review-card"><span class="review-no">Задание ${i+1} · Блок ${q.block}</span><h3 class="review-question">${safe(q.stem)}</h3>${q.context?`<p class="context">${safe(q.context)}</p>`:''}${q.scheme?`<p class="review-scheme">${safe(q.scheme)}</p>`:''}<div class="answer-pair"><div class="review-field"><div class="review-label">Ваш ответ</div><div class="review-answer">${safe(theirs)}</div></div><div class="review-field right"><div class="review-label">Правильный ответ</div><div class="review-answer">${safe(correct)}</div></div></div><p class="detail"><strong>Уравнение реакции:</strong> <span class="red">${safe(q.equation)}</span></p>${q.conditions?`<p class="detail"><strong>Реагенты и условия:</strong> ${safe(q.conditions)}</p>`:''}<p class="detail"><strong>Объяснение:</strong> ${safe(q.explanation)}</p></article>`;}).join('');
app.innerHTML=`<section class="review-wrap"><div class="review-head"><div><div class="eyebrow" style="text-align:left">АНАЛИЗ РЕЗУЛЬТАТОВ</div><h2 class="review-heading">Работа над ошибками · ${wrong.length}</h2></div>${btn('← К результатам','results','ghost')}</div><div class="reviews">${cards}</div><div class="action-row" style="margin:25px 0 30px">${btn('Вернуться к результатам','results','ghost')}${btn('Новая попытка','start','primary')}</div></section>`;
}
function fitSingleLine(el, startSize, minSize){
  if(!el)return;
  el.style.fontSize=startSize+'px';
  let size=startSize;
  while(size>minSize&&el.scrollWidth>el.clientWidth+1){
    size-=1;
    el.style.fontSize=size+'px';
  }
  // Extremely long formulas on narrow phones remain intact and can be swiped horizontally.
  if(el.scrollWidth>el.clientWidth+1){el.style.overflowX='auto';}
  else{el.style.overflowX='hidden';}
}
function syncQuizTypography(){
  if(state.mode!=='quiz')return;
  const w=window.innerWidth;
  const h=window.innerHeight;
  const compact=(h<=810&&w>750);
  const baseOption=w>1550?45:w>1250?42:w>1000?38:w>750?34:w>500?27:24;
  const baseEquation=w>1550?47:w>1250?44:w>1000?39:w>750?34:w>500?28:24;
  const minOption=w>750?23:20;
  const minEquation=w>750?21:20;
  const scheme=app.querySelector('.scheme:not(.is-description)');
  if(scheme)fitSingleLine(scheme,baseEquation,minEquation);
  let hasOverflow=Boolean(scheme && scheme.scrollWidth>scheme.clientWidth+1);
  for(const choice of app.querySelectorAll('.choice-text')){
    let target=choice.classList.contains('formula-option')?baseOption:baseOption+1;
    if(compact)target=Math.min(target,43);
    fitSingleLine(choice,target,minOption);
    if(choice.scrollWidth>choice.clientWidth+1)hasOverflow=true;
  }
  const tip=app.querySelector('.mobile-swipe-tip');
  if(tip)tip.classList.toggle('visible',hasOverflow && w<=750);
}
function syncReviewTypography(){
  if(state.mode!== 'review')return;
  const w=window.innerWidth;
  for(const el of app.querySelectorAll('.review-scheme,.review-answer,.detail .red')){
    const start=w>1200?34:w>750?29:24;
    fitSingleLine(el,start,w>750?20:19);
  }
}
function render(){
  if(state.mode==='quiz')quiz();
  else if(state.mode==='results')results();
  else if(state.mode==='review')review();
  else intro();
  if(state.mode==='quiz')requestAnimationFrame(syncQuizTypography);
  if(state.mode==='review')requestAnimationFrame(syncReviewTypography);
}
app.addEventListener('click',e=>{const c=e.target.closest('[data-choice]');if(c&&state.mode==='quiz'){selectOption(Number(c.dataset.choice));return;}const b=e.target.closest('[data-action]');if(!b||b.disabled)return;const fn={start,prev,next,finish,review:showReview,results:showResults}[b.dataset.action];if(fn)fn();});
window.addEventListener('keydown',e=>{if(state.mode!=='quiz'||e.ctrlKey||e.altKey||e.metaKey)return;if(['1','2','3','4'].includes(e.key)){const {sel}=itemAt(state.current);selectOption(sel.order[Number(e.key)-1]);}else if(e.key==='ArrowRight'){next();}else if(e.key==='ArrowLeft'){prev();}});
window.addEventListener("resize",()=>{if(state.mode==="quiz")requestAnimationFrame(syncQuizTypography);if(state.mode==="review")requestAnimationFrame(syncReviewTypography);});
restore();render();
