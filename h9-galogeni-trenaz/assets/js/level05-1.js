
(()=>{'use strict';
const stage=document.getElementById('stage'); const el=id=>document.getElementById(id);
const tanks=[...document.querySelectorAll('.tank')];
const mediumBtns=[...document.querySelectorAll('#mediumPanel .chip')];
const ionBtns=[...document.querySelectorAll('#ionsPanel .chip')];
const nameBtns=[...document.querySelectorAll('#namesPanel .chip')];
const tasks=[
  {type:'reservoir', text:'В аварийной системе перепутаны резервуары с растворами кислот. Компьютер требует немедленно найти соляную кислоту. Определи нужный резервуар!', answer:'HCl', note:'Верно! Соляная кислота — это водный раствор хлороводорода HCl.'},
  {type:'medium', text:'Анализатор исследует раствор галогеноводородной кислоты, но не может определить среду раствора. Восстанови его показания!', answer:'acid', note:'Верно! Для растворов галогеноводородных кислот характерна кислая среда.'},
  {type:'ions', text:'В исследовательскую камеру поступил водный раствор хлороводорода. Анализатор потерял сведения об ионном составе раствора. Определи, какие ионы должны отображаться на экране!', answers:['H+','Cl-'], note:'Верно! Раствор HCl содержит ионы H⁺ и Cl⁻.'},
  {type:'reservoir', text:'Компьютер ошибочно отнёс все четыре галогеноводородные кислоты к сильным. Найди резервуар с кислотой, которая относится к слабым.', answer:'HF', note:'Верно! HF — слабая кислота, но при этом она очень опасна.'},
  {type:'match', text:'Кислотный отсек почти восстановлен! Но система перепутала названия галогеноводородных кислот. Восстанови правильную маркировку всех резервуаров!', note:'Маркировка восстановлена: HF — фтороводородная, HCl — соляная, HBr — бромоводородная, HI — иодоводородная кислоты.'}
];
const dangerLevels=[58,56,54,53,52];
let step=0, nominal=60, started=false, answered=false, finished=false, muted=true, audioContext=null, wrongAt=0, selectedTank='', selectedName='', selectedIons=new Set(), matchedNames=new Set();
function progressStart(){const qs=new URLSearchParams(location.search); const url=Number(qs.get('danger')); if(qs.has('danger') && Number.isFinite(url)) return Math.min(60,Math.max(52,url)); try{const saved=JSON.parse(localStorage.getItem('galogeny_progress_v1')||'null'); if(saved && Number.isFinite(saved.danger) && Number(saved.lastSector) === 4) return Math.min(60,Math.max(52,saved.danger));}catch{} return 60;}
let entry=progressStart(); nominal=entry;
function save(){try{localStorage.setItem('galogeny_progress_v1',JSON.stringify({lastSector:5,danger:nominal,updatedAt:new Date().toISOString()}))}catch{}}
function meter(){const jitter=started&&!finished&&Math.floor(Date.now()/1200)%6===4?1:0; const spike=Date.now()-wrongAt<700?1:0; const value=Math.min(100, nominal+jitter+spike); el('dangerText').textContent=value+'%'; el('repairText').textContent=Math.max(0,100-value)+'%'; el('dangerFill').style.width=value+'%'; el('repairFill').style.width=(100-value)+'%'; el('indicator').style.setProperty('--needle', (step===1 ? (answered?18:22) : step===3 ? (answered?24:18) : 52)+'%'); }
function nav(){el('sectors').replaceChildren(); for(let n=1;n<=12;n++){const t=document.createElement('span'); t.className='sector'+(n<5?' done':n===5?' current':''); t.textContent=n; t.title='Отсек '+n; el('sectors').appendChild(t);}}
function snd(good){if(muted)return; try{audioContext=audioContext||new(window.AudioContext||window.webkitAudioContext)(); const now=audioContext.currentTime; const o=audioContext.createOscillator(), g=audioContext.createGain(); o.type=good?'sine':'square'; o.frequency.setValueAtTime(good?760:210,now); o.frequency.exponentialRampToValueAtTime(good?420:140,now+.18); g.gain.setValueAtTime(.0001,now); g.gain.exponentialRampToValueAtTime(.06,now+.01); g.gain.exponentialRampToValueAtTime(.0001,now+.22); o.connect(g).connect(audioContext.destination); o.start(now); o.stop(now+.23); }catch{} }
function feedback(text='', type=''){el('feedback').textContent=text; el('feedback').className='feedback '+type;}
function clearMarks(){tanks.forEach(t=>{t.disabled=false; t.classList.remove('good','bad','picked'); t.classList.remove('matched','named'); t.setAttribute('aria-pressed','false');}); [...mediumBtns,...ionBtns,...nameBtns].forEach(b=>{b.disabled=false; b.classList.remove('good','bad','used');}); el('matchPrompt').hidden=true; selectedTank=''; selectedName=''; selectedIons.clear(); matchedNames.clear(); el('analyzer').classList.remove('showIons','showWeak'); ['nameHF','nameHCl','nameHBr','nameHI'].forEach(id=>el(id).parentElement.classList.remove('named','matched')); }
function showPanels(which=''){el('mediumPanel').hidden=which!=='medium'; el('ionsPanel').hidden=which!=='ions'; el('namesPanel').hidden=which!=='names'; el('matchPrompt').hidden=which!=='names';}
function render(){answered=false; clearMarks(); const task=tasks[step]; el('qCounter').textContent='ЗАДАНИЕ '+(step+1)+' ИЗ 5'; el('prompt').textContent=task.text; el('nextBtn').disabled=true; el('nextBtn').textContent='ДАЛЕЕ ››'; feedback(''); showPanels(task.type==='medium'?'medium':task.type==='ions'?'ions':task.type==='match'?'names':''); el('anStatus').innerHTML=step===0?'Сбой идентификации резервуаров.<br>Найди нужную кислоту.': step===1?'Датчик среды раствора отключён.<br>Выбери тип среды.': step===2?'Восстанови ионный состав<br>раствора HCl.': step===3?'Проверь, какая кислота<br>относится к слабым.':'Перенеси названия<br>на нужные резервуары.'; if(step!==2){el('analyzer').classList.remove('showIons')} if(step!==3){el('analyzer').classList.remove('showWeak')} meter();}
function wrong(target){wrongAt=Date.now(); if(target){target.classList.add('bad'); setTimeout(()=>target.classList.remove('bad'),650);} feedback('Это неверно. Проверь свойства кислот и попробуй ещё раз.','error'); snd(false);}
function complete(){answered=true; nominal=Math.min(entry,dangerLevels[step]); feedback('✓ '+tasks[step].note, step===3 ? 'note' : 'correct'); el('nextBtn').disabled=false; if(step===3) el('analyzer').classList.add('showWeak'); snd(true); save(); meter();}
function finish(){finished=true; save(); nav(); el('qCounter').textContent='ОТСЕК № 5 ВОССТАНОВЛЕН'; el('prompt').textContent='Кислотный отсек стабилизирован. Можно переходить к следующему аварийному помещению.'; feedback('Опасность снижена до 52%. Восстановление достигло 48%.','correct'); el('nextBtn').disabled=false; el('nextBtn').textContent='ПРОЙДЕНО ↻'; showPanels(''); tanks.forEach(t=>t.disabled=true);}
function chooseTank(ev){if(!started||finished||!el('modal').hidden)return; const btn=ev.currentTarget; const value=btn.dataset.value; const task=tasks[step]; if(answered && task.type!=='match') return;
  if(task.type==='match'){ if(btn.classList.contains('matched')) return; if(selectedName){matchNameToTank(selectedName,value);return;} selectedTank=value; tanks.forEach(t=>{if(!t.classList.contains('matched')) t.classList.remove('picked');}); btn.classList.add('picked'); feedback('Резервуар выбран. Нажми на название кислоты внизу или перетащи его на сосуд.'); return; }
  if(task.type!=='reservoir') return;
  if(value!==task.answer){wrong(btn);return;}
  btn.classList.add('good'); if(step===0) el('anStatus').innerHTML='Резервуар HCl найден.<br>Линия перекрыта.'; if(step===3) el('anStatus').innerHTML='HF обнаружена.<br>Классификация исправлена.'; complete(); }
function chooseMedium(ev){if(tasks[step].type!=='medium' || answered || finished)return; const b=ev.currentTarget; if(b.dataset.medium!==tasks[step].answer){wrong(b);return;} b.classList.add('good'); el('anStatus').innerHTML='Среда раствора определена:<br>КИСЛАЯ'; complete();}
function chooseIon(ev){if(tasks[step].type!=='ions' || answered || finished)return; const b=ev.currentTarget; const ion=b.dataset.ion; if(!tasks[step].answers.includes(ion)){wrong(b);return;} if(selectedIons.has(ion)) return; selectedIons.add(ion); b.classList.add('good','used'); el('analyzer').classList.add('showIons'); if(ion==='H+') el('vHplus').style.display='inline-flex'; if(ion==='Cl-') el('vClminus').style.display='inline-flex'; feedback('Выбран правильный ион: '+ion+'.'); if(selectedIons.size===2) complete();}
function matchNameToTank(name, tankValue){
 if(tasks[step].type!=='match'||finished||answered||matchedNames.has(tankValue))return;
 const b=nameBtns.find(x=>x.dataset.name===name),tank=el('t'+tankValue);
 if(!b||b.classList.contains('used')||!tank)return;
 if(name!==tankValue){wrong(tank);return;}
 b.classList.add('good','used');b.classList.remove('activeChip');
 tank.classList.remove('picked','dropTarget');tank.classList.add('matched','named');
 matchedNames.add(tankValue);tank.disabled=true;
 selectedTank='';selectedName='';nameBtns.forEach(x=>x.classList.remove('activeChip'));
 feedback('Верно! Название «'+b.textContent.trim()+'» установлено на резервуар '+tankValue+'.','correct');
 if(matchedNames.size===4){complete();}
}
function chooseName(ev){
 if(tasks[step].type!=='match'||finished||answered)return;
 const b=ev.currentTarget;if(b.classList.contains('used'))return;
 const need=b.dataset.name;
 if(selectedTank){matchNameToTank(need,selectedTank);return;}
 selectedName=need;
 nameBtns.forEach(x=>x.classList.toggle('activeChip',x===b));
 feedback('Название выбрано. Нажми на нужный резервуар или перетащи карточку прямо на него.');
}
let drag=null;
function dragDown(e){
 if(tasks[step].type!=='match'||!started||finished||answered||e.currentTarget.classList.contains('used'))return;
 if(e.button!==undefined&&e.button!==0)return;
 const b=e.currentTarget;
 drag={pointerId:e.pointerId,source:b,startX:e.clientX,startY:e.clientY,moved:false,ghost:null};
 try{b.setPointerCapture(e.pointerId)}catch(_){}
}
function dragMove(e){
 if(!drag||e.pointerId!==drag.pointerId)return;
 const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
 if(!drag.moved&&Math.hypot(dx,dy)>10){
  drag.moved=true;drag.source.classList.add('dragging');
  const ghost=document.createElement('div');ghost.className='dragGhost';ghost.textContent=drag.source.textContent.trim();document.body.appendChild(ghost);drag.ghost=ghost;
 }
 if(!drag.moved)return;
 if(drag.ghost){drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';}
 tanks.forEach(t=>{const r=t.getBoundingClientRect();t.classList.toggle('dropTarget',!t.classList.contains('matched')&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom);});
}
function dragEnd(e){
 if(!drag||e.pointerId!==drag.pointerId)return;
 const current=drag;drag=null;
 current.source.classList.remove('dragging');current.ghost?.remove();
 tanks.forEach(t=>t.classList.remove('dropTarget'));
 if(!current.moved)return;
 // A normal click fires after pointerup; suppress it when a real drag took place.
 current.source.dataset.suppressClick='1';
 const target=tanks.find(t=>{const r=t.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;});
 if(target){matchNameToTank(current.source.dataset.name,target.dataset.value);}
 else{feedback('Перетащи карточку непосредственно на один из четырёх резервуаров.','error');}
}
function reset(){started=true; finished=false; step=0; entry=progressStart(); nominal=entry; el('intro').hidden=true; el('vHplus').style.display='none'; el('vClminus').style.display='none'; render();}
function next(){if(finished){reset();return} if(!answered)return; if(step===4){finish();return} step++; if(step===3){el('analyzer').classList.remove('showIons'); el('vHplus').style.display='none'; el('vClminus').style.display='none';} render();}
function show(title,body){el('modalTitle').textContent=title; el('modalBody').textContent=body; el('modal').hidden=false; el('closeBtn').focus();}

tanks.forEach(t=>t.addEventListener('click',chooseTank)); mediumBtns.forEach(b=>b.addEventListener('click',chooseMedium)); ionBtns.forEach(b=>b.addEventListener('click',chooseIon)); nameBtns.forEach(b=>{b.addEventListener('pointerdown',dragDown);b.addEventListener('pointermove',dragMove);b.addEventListener('pointerup',dragEnd);b.addEventListener('pointercancel',dragEnd);b.addEventListener('click',ev=>{if(b.dataset.suppressClick==='1'){delete b.dataset.suppressClick;return;}chooseName(ev);});});
el('nextBtn').onclick=next; el('startBtn').onclick=reset; el('closeBtn').onclick=()=>el('modal').hidden=true; el('modal').addEventListener('click',e=>{if(e.target===el('modal')) el('modal').hidden=true;});
el('helpBtn').onclick=()=>show('Как играть','Нажимай прямо на резервуары HF, HCl, HBr и HI. Во 2-м задании выбери среду раствора, в 3-м — ионы H⁺ и Cl⁻, а в 5-м — перетаскивай названия на резервуары или нажимай сначала на название, затем на резервуар.');
el('soundBtn').onclick=()=>{muted=!muted; el('soundBtn').title=muted?'Включить звук':'Выключить звук'; el('soundBtn').setAttribute('aria-label',el('soundBtn').title); snd(true);};
el('fullBtn').onclick=async()=>{try{if(document.fullscreenElement) await document.exitFullscreen(); else if(stage.requestFullscreen) await stage.requestFullscreen();}catch{show('Полный экран','Браузер может ограничивать полноэкранный режим при локальном запуске файла.');}};
document.addEventListener('keydown',e=>{if(!el('modal').hidden){if(e.key==='Escape') el('modal').hidden=true; return;} if(!el('intro').hidden){if(e.key==='Enter') reset(); return;} if(['1','2','3','4'].includes(e.key) && ['reservoir','match'].includes(tasks[step].type)){tanks[Number(e.key)-1]?.click();} if(e.key==='Enter' && !el('nextBtn').disabled) next();});
nav(); render(); nominal=entry; meter(); setInterval(meter,470);
})();
