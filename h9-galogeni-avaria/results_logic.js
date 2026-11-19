(() => {
'use strict';
const C=window.ChemGameReport, $=id=>document.getElementById(id);
let parentSnapshot=null,parentProgress=null;
const _load=C.load,_save=C.save;
C.load=()=>parentSnapshot||_load();
C.save=data=>{if(parentSnapshot)parentSnapshot=data;const ok=_save(data);try{if(window.parent!==window)window.parent.postMessage({source:'chem-tracker-ui',action:'updateReport',data},'*')}catch(_){}return ok};
window.addEventListener('message',e=>{if(e.data?.source==='chem-parent'&&e.data.action==='snapshot'){
 parentSnapshot=e.data.data||null;parentProgress=e.data.progress||null;render();readRef();
}});
function parentAction(action,props={}){try{if(window.parent!==window){window.parent.postMessage({source:'chem-tracker-ui',action,...props},'*');return true}}catch(_){}return false}

const bank={
1:[['Какое из простых веществ — жидкость при обычных условиях?',['Фтор','Хлор','Бром','Иод'],2,'При комнатной температуре бром — красно-бурая жидкость.']],
2:[['При обнаружении утечки хлора в лаборатории какое действие правильное?',['Продолжить работу','Включить безопасное оповещение и эвакуироваться','Подойти к источнику газа','Снять защитные средства'],1,'При утечке токсичного газа нужно известить ответственных и покинуть опасную зону.']],
3:[['У какого галогена электроотрицательность наибольшая?',['Иод','Бром','Хлор','Фтор'],3,'Фтор — самый электроотрицательный элемент.']],
4:[['Какая связь в молекуле HCl?',['Ковалентная неполярная','Ковалентная полярная','Ионная','Металлическая'],1,'В молекуле HCl связь ковалентная полярная.']],
5:[['Какие ионы образуются при диссоциации HCl в воде в школьной модели?',['Na⁺ и Cl⁻','H⁺ и Cl⁻','H⁺ и OH⁻','K⁺ и Cl⁻'],1,'В школьной записи диссоциации соляная кислота образует H⁺ и Cl⁻.']],
6:[['Какие из перечисленных металлов вытесняют водород из разбавленной HCl? Выбери верную пару.',['Cu и Ag','Zn и Fe','Au и Cu','Ag и Au'],1,'Железо и цинк находятся в ряду активности до водорода.']],
7:[['Какой продукт образуется при взаимодействии Na₂SiO₃ с HCl?',['Водород','Осадок кремниевой кислоты','Хлор','Сульфат бария'],1,'В школьной записи образуется малорастворимая кремниевая кислота.']],
8:[['Какой реактив помогает обнаружить хлорид-ионы в подготовленной пробе?',['NaOH','KNO₃','AgNO₃','H₂O'],2,'Ионы серебра дают с хлорид-ионами белый осадок AgCl.']],
9:[['Какой галоген вытеснит йод из раствора KI?',['I₂','Br₂','Ни один из перечисленных','Все галогены одинаково активны'],1,'Бром активнее йода и вытесняет его из иодидов.']],
10:[['В реакции Zn + 2HCl = ZnCl₂ + H₂ какое вещество — восстановитель?',['Zn','HCl','ZnCl₂','H₂'],0,'Цинк отдаёт электроны и окисляется.']],
11:[['Железо отдаёт 3 электрона, Cl₂ принимает 2. Какое наименьшее общее число электронов?',['2','3','5','6'],3,'НОК чисел 3 и 2 равно 6.']],
12:[['Какие коэффициенты верны для Al + HCl = AlCl₃ + H₂?',['1, 3, 1, 1','2, 6, 2, 3','2, 3, 2, 1','1, 6, 1, 3'],1,'Правильная запись: 2Al + 6HCl = 2AlCl₃ + 3H₂.']]
};
const when=d=>{if(!d)return '';try{return new Date(d).toLocaleString('ru-RU',{dateStyle:'medium',timeStyle:'short'})}catch(_){return ''}};
const safe=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const result={groups:[],topics:[],observed:0,first:0,errors:0,hints:0,hard:0,completed:0,progress:0};
function derive(){const data=C.load(),groups=new Map();for(let i=1;i<=12;i++){groups.set(i,{sector:i,topic:C.TOPICS[i],title:C.TITLES[i],qs:new Map(),hintTotal:0,completed:false,started:false})}
 for(const e of data.events){if(!groups.has(e.sector))continue;const g=groups.get(e.sector);if(e.type==='start')g.started=true;if(e.type==='complete'){g.completed=true;continue}if(e.type==='practice')continue;if(!e.question)continue;
 let q=g.qs.get(e.question);if(!q){q={question:e.question,title:e.title||'',topic:e.topic||g.topic,errors:0,hints:0,correct:false,answers:[],feedback:[],tries:0};g.qs.set(e.question,q)}
 if(e.type==='hint'){q.hints++;g.hintTotal++}
 if(e.type==='attempt'){q.tries++;if(e.correct){q.correct=true}else{q.errors++;if(e.answer)q.answers.push(String(e.answer));if(e.feedback)q.feedback.push(String(e.feedback))}}}
 const rows=[...groups.values()];let observed=0,first=0,errors=0,hints=0,hard=0,completed=0;
 for(const g of rows){const questions=[...g.qs.values()];g.correct=questions.filter(x=>x.correct).length;g.errors=questions.reduce((s,x)=>s+x.errors,0);g.hints=g.hintTotal;g.difficult=questions.filter(x=>(x.errors||x.hints)).length;g.first=questions.filter(x=>x.correct&&!x.errors&&!x.hints).length;g.questions=questions.sort((a,b)=>a.question-b.question);
 observed+=g.correct;first+=g.first;errors+=g.errors;hints+=g.hints;hard+=g.difficult;completed+=Number(g.completed)}
 const progress=(()=>{try{const p=JSON.parse(parentProgress||localStorage.getItem('galogeny_progress_v1')||'null');if(p?.lastSector===12&&Number(p.danger)===0)return 12;return 0}catch(_){return 0}})();
 const topicMap=new Map();
 for(const g of rows)for(const q of g.questions){if(!(q.errors||q.hints))continue;const topic=q.topic||g.topic;
 let item=topicMap.get(topic);if(!item){item={topic,sector:g.sector,errors:0,hints:0,questions:[],sectors:new Set()};topicMap.set(topic,item)}
 item.errors+=q.errors;item.hints+=q.hints;item.questions.push(q);item.sectors.add(g.sector)}
 const topics=[...topicMap.values()].sort((a,b)=>b.errors-a.errors||b.hints-a.hints);
 Object.assign(result,{groups:rows,topics,observed,first,errors,hints,hard,completed,progress,data});return result;}
function makeDiv(className,content){const el=document.createElement('div');el.className=className;el.innerHTML=content;return el}
function render(){const s=derive();const haveEvents=s.data.events.some(x=>x.type==='attempt');
 const restored=s.progress===12||s.data.events.some(x=>x.type==='complete'&&x.sector===12);
 $('heroTitle').innerHTML=restored?'ЛАБОРАТОРИЯ <span>СПАСЕНА!</span>':'РЕЗУЛЬТАТЫ <span>ОБУЧЕНИЯ</span>';
 $('heroDescription').textContent=restored?'Центральный реактор в безопасном режиме. Посмотрим, что получилось хорошо и что стоит повторить.':'Это промежуточный отчёт. Лаборатория ещё не полностью восстановлена.';
 const pd=(()=>{try{const p=JSON.parse(parentProgress||localStorage.getItem('galogeny_progress_v1')||'null');return p&&Number.isFinite(+p.danger)?Math.max(0,+p.danger):null}catch(_){return null}})();
 $('heroDanger').textContent=restored?'0%':pd===null?'—':pd+'%';$('heroRepair').textContent=restored?'100%':pd===null?'—':(100-pd)+'%';
 $('sections').textContent=(s.progress===12?'12':s.completed||'—')+' / 12';$('correct').textContent=haveEvents?String(s.observed):'—';$('first').textContent=haveEvents?String(s.first):'—';$('errors').textContent=haveEvents?String(s.errors):'—';$('hints').textContent=haveEvents?String(s.hints):'—';$('difficult').textContent=haveEvents?String(s.hard):'—';
 $('liveStatus').textContent=haveEvents?'Это реальные данные о действиях, записанных в данном браузере.':'Статистика ошибок и подсказок появится после прохождения отсеков с включённым журналом.';
 $('coverage').className='note'+(s.observed<61?' warn':'');$('coverage').textContent=haveEvents?`Журнал подтвердил ${s.observed} правильных заданий из 61 во всей игре. ${s.observed<61?'Часть заданий ещё не записана: для них результаты не предполагаются.':'Данные за все задания записаны.'}`:'В журнале пока нет подтверждённых ответов. Ранее пройденные задания не позволяют достоверно посчитать ошибки задним числом.';
 const out=$('recommendations');out.replaceChildren();if(s.topics.length){for(const g of s.topics.slice(0,7)){const q=g.questions;out.append(makeDiv('topic-row',`<div class="topic-meta"><strong>${safe(g.topic)}</strong><span class="badge hard">${g.errors} ошибок · ${g.hints} подсказок</span></div><p>Отсек ${[...g.sectors].join(', ')}. ${q.length?`Затруднения в заданиях: ${q.map(x=>x.question).join(', ')}.`:''}</p>`))}}else{out.append(makeDiv('note',haveEvents?'Затруднений не зафиксировано. Можно повторить тему по своему выбору, но программа не назначает слабые темы без оснований.':'Пока недостаточно данных, чтобы определить трудные темы.'))}
 const table=$('breakdown');table.replaceChildren();for(const g of s.groups){let desc='Нет данных';if(g.questions.length){const details=g.questions.filter(x=>x.errors||x.hints).map(q=>{const observedWrong=q.answers.slice(0,3).map(x=>safe(x)).join('; ');const msg=q.feedback.slice(0,1).map(x=>safe(x)).join('; ');return `<div class="wrong-detail"><strong>Задание ${q.question} (${safe(q.topic)}):</strong> ${q.errors} ошиб. попыток, ${q.hints} подсказок${observedWrong?` · Выбирал(а): ${observedWrong}`:''}${msg?`<br>Комментарий: ${msg}`:''}</div>`}).join('');desc=details||'Ошибок и подсказок не зафиксировано'}
 const tr=document.createElement('tr');tr.innerHTML=`<td><b>${g.sector}. ${safe(g.title)}</b><small>${safe(g.topic)}</small></td><td>${g.correct||'—'}</td><td>${g.questions.length?g.errors:'—'}</td><td>${g.questions.length?g.hints:'—'}</td><td>${desc}</td>`;table.append(tr)}
 $('missingNote').textContent='Сведения о первых попытках и ошибках доступны только по тем заданиям, которые были выполнены с включённым журналом. Пройденные ранее версии без журнала не дают полной статистики. Ничего не домысливается.';
 $('practiceBtn').disabled=!s.topics.length;$('retryBtn').disabled=!s.topics.length;
 return s;}
const refKeys=['easy','hard','plan','confident','usedHints'];let saving;function readRef(){const d=C.load();for(const id of refKeys){const el=$(id);el.type==='checkbox'?el.checked=!!d.reflections?.[id]:el.value=d.reflections?.[id]||''}}
function saveRef(){const d=C.load();d.reflections=d.reflections||{};for(const id of refKeys){const el=$(id);d.reflections[id]=el.type==='checkbox'?el.checked:el.value.trim()};C.save(d);$('saved').textContent='Сохранено в браузере.';clearTimeout(saving);saving=setTimeout(()=>$('saved').textContent='Ответы сохраняются в этом браузере автоматически.',2000)}
for(const id of refKeys)$(id).addEventListener(['confident','usedHints'].includes(id)?'change':'input',saveRef);
let practiceQuestions=[],pi=0,practiceResolved=false;function renderPractice(){if(pi>=practiceQuestions.length){$('practiceNumber').textContent='Тренировка завершена';$('practiceQuestion').textContent='Ты проверил(а) трудные темы ещё раз.';$('practiceOptions').replaceChildren();$('practiceFeedback').textContent=`Выполнено вопросов: ${practiceQuestions.length}. Эту тренировку можно пройти повторно.`;$('practiceNext').disabled=true;return}
 const item=practiceQuestions[pi],box=$('practiceOptions');$('practiceNumber').textContent=`Тема: ${item.topic||C.TOPICS[item.sector]} · вопрос ${pi+1} из ${practiceQuestions.length}`;$('practiceQuestion').textContent=item.q;box.replaceChildren();$('practiceFeedback').textContent='Выбери один вариант.';practiceResolved=false;$('practiceNext').disabled=true;
 item.options.forEach((option,i)=>{const b=document.createElement('button');b.textContent=option;b.onclick=()=>{if(practiceResolved)return;practiceResolved=true;box.querySelectorAll('button').forEach((x,j)=>{x.disabled=true;x.className=j===item.correct?'correct':j===i?'wrong':''});$('practiceFeedback').textContent=(i===item.correct?'Верно! ':'Пока неверно. ')+item.explanation;$('practiceNext').disabled=false;
 const d=C.load();d.practice=d.practice||[];d.practice.push({sector:item.sector,question:item.q,correct:i===item.correct,at:new Date().toISOString()});C.save(d)};box.append(b)});
}
$('practiceBtn').onclick=()=>{const s=derive();practiceQuestions=s.topics.slice(0,7).map(g=>{
 let target=g.sector;
 if(/оксид/i.test(g.topic))target=7;
 else if(/гидроксид|основан|нейтрализац/i.test(g.topic))target=7;
 else if(/карбонат/i.test(g.topic))target=7;
 else if(/хлорид.*ион|качественн.*реакц/i.test(g.topic))target=8;
 else if(/вытесн.*галоген/i.test(g.topic))target=9;
 else if(/металл/i.test(g.topic))target=6;
 else if(/коэффициент|электрон/i.test(g.topic))target=11;
 let x=bank[target]?.[0];
 if(/оксид/i.test(g.topic))x=['Какой оксид взаимодействует с соляной кислотой с образованием соли и воды?',['CO₂','MgO','SiO₂','SO₃'],1,'MgO — основной оксид, он реагирует с HCl с образованием MgCl₂ и H₂O.'];
 if(/карбонат/i.test(g.topic))x=['Какие продукты образуются при реакции Na₂CO₃ с HCl?',['NaCl, H₂O, CO₂','NaOH, Cl₂','NaCl, H₂','Na₂O, CO₂'],0,'Образуются соль, вода и углекислый газ.'];
 if(/гидроксид|основан|нейтрализац/i.test(g.topic))x=['Что происходит с осадком Cu(OH)₂ при добавлении достаточного количества HCl?',['Выделяется H₂','Осадок растворяется','Появляется Cl₂','Образуется CuO'],1,'Кислота нейтрализует гидроксид меди(II), образуя раствор соли и воду.'];
 return x?{topic:g.topic,sector:g.sector,q:x[0],options:x[1],correct:x[2],explanation:x[3]}:null}).filter(Boolean);pi=0;$('practice').classList.add('open');$('practiceEmpty').hidden=true;renderPractice();$('practice').scrollIntoView({behavior:'smooth',block:'center'})};$('practiceNext').onclick=()=>{pi++;renderPractice()};$('practiceClose').onclick=()=>{$('practice').classList.remove('open');$('practiceEmpty').hidden=false};
$('retryBtn').onclick=()=>{const s=derive(),sector=s.topics[0]?.sector||1;if(!parentAction('retryLevel',{level:sector}))window.location.href='index.html?level='+sector};
function exportHtml(){saveRef();const s=derive(),r=C.load();const printable=document.querySelector('main').cloneNode(true);
 for(const a of printable.querySelectorAll('textarea')){const live=document.getElementById(a.id);if(live)a.textContent=live.value}
 for(const a of printable.querySelectorAll('input[type=checkbox]')){const live=document.getElementById(a.id);if(live){if(live.checked)a.setAttribute('checked','');else a.removeAttribute('checked')}}
 printable.querySelectorAll('button,.quiz').forEach(n=>n.remove());const extra=`<h2>Сведения о прохождении</h2><p>Создан: ${safe(when(new Date()))}</p><p>Начало: ${safe(when(r.startedAt))}; конец: ${safe(when(r.endedAt))}</p>`;
 const css='body{font:15px/1.5 Arial,sans-serif;color:#142e3e;padding:24px;max-width:1100px;margin:auto}h1{font-size:32px;color:#10754d}h2{border-bottom:2px solid #a8bfc8;padding-top:15px}section{padding:12px 0}table{width:100%;border-collapse:collapse}td,th{border:1px solid #aaa;padding:8px;vertical-align:top}.card,.metric,.topic-row,.note{margin:9px 0;border:1px solid #c2d5d8;padding:10px}.metrics{display:grid;grid-template-columns:1fr 1fr;gap:8px}.metric b{font-size:26px;display:block}textarea{display:block;width:100%;min-height:40px;border:1px solid #ddd}button,.button,.full .quiz{display:none}';
 const html='<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Личный отчёт по химии</title><style>'+css+'</style></head><body><h1>Лаборатория спасена — учебный отчёт</h1>'+extra+printable.innerHTML+'<p>Данные представлены только по реально записанным ответам.</p></body></html>';const blob=new Blob([html],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Отчет_по_химии_лаборатория.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
document.querySelector('a[href="index.html"]')?.addEventListener('click',e=>{if(window.parent!==window){e.preventDefault();parentAction('goMenu')}});
$('download').onclick=exportHtml;$('print').onclick=()=>window.print();$('resetLog').onclick=()=>{if(confirm('Удалить сохранённый журнал этой игры и ответы рефлексии в данном браузере?')){if(!parentAction('resetReport')){C.reset();try{localStorage.removeItem('galogeny_progress_v1')}catch(_){}window.location.href='index.html'}}};
render();readRef();
})();
