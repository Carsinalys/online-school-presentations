
(()=>{'use strict';
const $=id=>document.getElementById(id);
const stage=$('stage');
const hazards=[42,40,39,38,36];
const chemicalEquations=[
 'CuO + 2HCl = CuCl₂ + H₂O',
 'NaOH + HCl = NaCl + H₂O',
 'CaCO₃ + 2HCl = CaCl₂ + CO₂↑ + H₂O',
 'Na₂SiO₃ + 2HCl = 2NaCl + H₂SiO₃↓'
];
const questions=[
 'Заклинило загрузочный механизм! Выбери оксид, который взаимодействует с соляной кислотой с образованием соли и воды, чтобы разблокировать заслонку.',
 'Аварийный вентиль закрыт! В реакторе розовый раствор NaOH с фенолфталеином. Как изменится его окраска при добавлении достаточного количества соляной кислоты?',
 'Газовый канал заблокирован! Соляная кислота взаимодействует с известняком. Какой газ надо направить по герметичной трубке в газосборник?',
 'В реакционной камере обнаружена густая студенистая масса. Она образовалась после добавления соляной кислоты к раствору одной из солей. Найди исходную соль среди бутылочек.',
 'Защитный шлюз заперт четырьмя замками! Сопоставь каждый процесс с реактором или сосудом — тогда замки последовательно откроются.'
];
const feedbackCorrect=[
 'Верно! Робот загрузил CuO, заслонка открывается.',
 'Верно! Розовая окраска исчезла, вентиль разблокирован.',
 'Верно! CO₂ направляется в закрытый газосборник.',
 'Верно! Это раствор силиката натрия. Маркировка восстановлена.',
 'Все четыре замка открыты! Проход в следующий отсек свободен.'
];
let step=0, nominal=44, answered=false, started=false, muted=true, audio=null, selectedProcess=null, pairs=new Set(), errorTimer=null, animationTokens=[];
function schedule(fn,ms){const t=setTimeout(fn,ms);animationTokens.push(t)}
function clearScheduled(){animationTokens.forEach(clearTimeout);animationTokens=[]}
function sound(ok=true){if(muted)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();const t=audio.currentTime;const osc=audio.createOscillator(),gain=audio.createGain();osc.type=ok?'sine':'triangle';osc.frequency.setValueAtTime(ok?620:290,t);osc.frequency.exponentialRampToValueAtTime(ok?920:180,t+.22);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.08,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+.24);osc.connect(gain).connect(audio.destination);osc.start(t);osc.stop(t+.25)}catch(e){}}
function startDanger(){let params=new URLSearchParams(location.search);const v=Number(params.get('danger'));if(params.has('danger')&&Number.isFinite(v))return Math.max(36,Math.min(44,v));try{let p=JSON.parse(localStorage.getItem('galogeny_progress_v1')||'null');if(p&&p.lastSector===6&&Number.isFinite(+p.danger))return Math.max(36,Math.min(44,+p.danger));}catch(e){}return 44}
function save(){try{localStorage.setItem('galogeny_progress_v1',JSON.stringify({lastSector:7,danger:nominal,updatedAt:new Date().toISOString()}))}catch(e){}}
function meter(){const n=nominal;$('dangerText').textContent=n+'%';$('repairText').textContent=(100-n)+'%';$('dangerFill').style.width=n+'%';$('repairFill').style.width=(100-n)+'%'}
function nav(){for(let i=1;i<=12;i++){const s=document.createElement('span');s.className='sector '+(i<7?'done':i===7?'current':'');s.textContent=i;s.title='Отсек '+i;$('sectors').appendChild(s)}}
function feedback(text,kind=''){const f=$('feedback');f.textContent=text;f.className='feedback '+kind}
function error(msg,button){if(answered)return;sound(false);feedback(msg||'Проверь свой выбор и попробуй ещё раз.','error');if(button){button.classList.add('wrong');setTimeout(()=>button.classList.remove('wrong'),420)}}
function allHitsOff(){document.querySelectorAll('.reactorHit,.saltHit').forEach(b=>{b.classList.remove('active','wrong','pairGlow');b.disabled=false})}
function fadeAll(){['robotMotion','dissolve','neutralLayer','valve'].forEach(id=>{const n=$(id);n.classList.remove('active','show','stable');void n.offsetWidth});$('gasTrail').classList.remove('flowing');$('repairedConsole').classList.remove('visible');$('gelJar').classList.remove('visible','result');$('airlock').classList.remove('visible','open');$('lockRail').classList.remove('visible','opened');$('doorLabel').hidden=true}
function clearDecks(){['oxideDeck','choiceDeck','processDeck'].forEach(id=>$(id).replaceChildren());$('oxideDeck').hidden=true;$('choiceDeck').hidden=true;$('processDeck').hidden=true;$('matchGuide').hidden=true;$('equation').hidden=true}
function mkOption(text, fn, secondary=''){const b=document.createElement('button');b.type='button';b.className='pick';b.innerHTML='<span>'+text+'</span>'+(secondary?'<span class="chemicalSmall">'+secondary+'</span>':'');b.addEventListener('click',()=>fn(b));return b}
function showEq(txt){$('equation').textContent=txt;$('equation').hidden=false}
function success(msg){if(answered)return;answered=true;sound();feedback(msg,'correct');nominal=hazards[step];save();meter();$('nextBtn').disabled=false;$('nextBtn').textContent=step===4?'К ОТСЕКУ 8 ››':'ДАЛЕЕ ››';}
function gasBubbles(){const pane=$('bubbles');const placements=[[68.2,56],[70,58],[72.3,55],[74,57.5],[76,56],[69.7,52],[71.8,54.5],[75.6,54],[73.5,51],[77,53],[67.4,50],[72,59]];placements.forEach(([x,y],i)=>{const b=document.createElement('span');b.className='bubble';b.style.left=x+'%';b.style.top=y+'%';b.style.setProperty('--size',(0.5+(i%4)*.26)+'cqw');b.style.setProperty('--dur',(2.7+(i%5)*.45)+'s');b.style.setProperty('--delay',(-i*.5)+'s');pane.appendChild(b)})}
function oxideTask(){const d=$('oxideDeck');d.hidden=false;[['SiO₂',false],['CuO',true],['CO₂',false]].forEach(([v,ok])=>d.appendChild(mkOption(v,b=>{if(!ok){error('Этот оксид не взаимодействует с HCl в заданных условиях.',b);return}b.classList.add('good');d.querySelectorAll('button').forEach(e=>e.disabled=true);$('robotMotion').classList.add('active');$('dissolve').classList.add('active');showEq(chemicalEquations[0]);success(feedbackCorrect[0])}))) }
function baseTask(){const d=$('choiceDeck');d.hidden=false;[['Станет синим',false],['Останется розовым',false],['Обесцветится',true]].forEach(([text,ok])=>d.appendChild(mkOption(text,b=>{if(!ok){error('Фенолфталеин в кислой и нейтральной среде бесцветен.',b);return}b.classList.add('good');d.querySelectorAll('button').forEach(e=>e.disabled=true);$('neutralLayer').classList.add('show');$('valve').classList.add('active');showEq(chemicalEquations[1]);success(feedbackCorrect[1])}))) }
function carbonateTask(){const d=$('choiceDeck');d.hidden=false;[['H₂',false],['O₂',false],['CO₂',true],['Cl₂',false]].forEach(([text,ok])=>d.appendChild(mkOption(text,b=>{if(!ok){error('Вспомни, что выделяется при действии кислоты на карбонат.',b);return}b.classList.add('good');d.querySelectorAll('button').forEach(e=>e.disabled=true);$('gasTrail').classList.add('flowing');showEq(chemicalEquations[2]);success(feedbackCorrect[2])}))) }
function saltTask(){$('gelJar').classList.add('visible');['saltNaCl','saltNa2SiO3','saltNaNO3'].forEach(id=>$(id).classList.add('active'));}
function pickSalt(id){if(step===3&&!answered){if(id!=='saltNa2SiO3'){error('Этот раствор не объясняет появление студенистой массы.',$(id));return}document.querySelectorAll('.saltHit').forEach(b=>b.classList.remove('active'));$(id).classList.add('pairGlow');$('gelJar').classList.add('result');$('gelTag').textContent='H₂SiO₃ ↓';showEq(chemicalEquations[3]);success(feedbackCorrect[3])}else if(step===4)pairTarget(id==='saltNa2SiO3'?'salt':'incorrect',$(id));}
const processes=[{id:'carbonate',name:'Выделение углекислого газа',target:'reactorCarbonate',equation:chemicalEquations[2]},{id:'oxide',name:'Растворение основного оксида',target:'reactorOxide',equation:chemicalEquations[0]},{id:'salt',name:'Образование студенистого осадка',target:'saltNa2SiO3',equation:chemicalEquations[3]},{id:'base',name:'Нейтрализация',target:'reactorBase',equation:chemicalEquations[1]}];
function matchTask(){selectedProcess=null;pairs.clear();$('airlock').classList.add('visible');$('lockRail').classList.add('visible');$('doorLabel').hidden=false;$('doorLabel').textContent='ШЛЮЗ ЗАБЛОКИРОВАН';$('matchGuide').hidden=false;$('processDeck').hidden=false;$('gelJar').classList.add('visible');$('gelTag').textContent='КАМЕРА 4';
 ['reactorOxide','reactorBase','reactorCarbonate','saltNa2SiO3'].forEach(id=>$(id).classList.add('active'));renderProcesses();}
function renderProcesses(){const deck=$('processDeck');deck.replaceChildren();processes.forEach(p=>{const b=mkOption(p.name,btn=>{if(answered||pairs.has(p.id))return;selectedProcess=p.id;deck.querySelectorAll('.pick').forEach(a=>a.classList.remove('chosen'));btn.classList.add('chosen');feedback('Теперь нажми на соответствующий реактор или сосуд.','');});b.dataset.id=p.id;if(pairs.has(p.id)){b.disabled=true;b.classList.add('used')};if(selectedProcess===p.id)b.classList.add('chosen');deck.appendChild(b)})}
function pairTarget(id,btn){if(step!==4||answered)return;if(!selectedProcess){error('Сначала выбери один из четырёх процессов.',btn);return}const proc=processes.find(p=>p.id===selectedProcess);if(id!==proc.id){error('Этот процесс происходит в другой реакционной камере.',btn);return}
pairs.add(proc.id);btn.classList.remove('active');btn.classList.add('pairGlow');selectedProcess=null;sound();renderProcesses();const locks=$('lockRail').querySelectorAll('.lock');locks[pairs.size-1].textContent='🔓 '+pairs.size;locks[pairs.size-1].classList.add('done');$('doorLabel').textContent='ЗАМКИ СНЯТЫ: '+pairs.size+'/4';showEq(proc.equation);feedback('Правильно! Разблокирован замок '+pairs.size+' из 4.','correct');
if(pairs.size===4){$('lockRail').classList.add('opened');$('airlock').classList.add('open');$('processDeck').hidden=true;$('matchGuide').hidden=true;$('doorLabel').textContent='ШЛЮЗ ОТКРЫТ';$('doorLabel').classList.add('done');stage.classList.add('cleared');$('repairedConsole').classList.add('visible');$('matchGuide').textContent='Все механизмы восстановлены. Проход открыт!';schedule(()=>{showEq('РЕАКЦИОННЫЙ БЛОК ВОССТАНОВЛЕН');success(feedbackCorrect[4])},1400)} }
function render(){clearScheduled();answered=false;selectedProcess=null;allHitsOff();fadeAll();clearDecks();stage.classList.remove('cleared');$('doorLabel').classList.remove('done');$('qCounter').textContent='ЗАДАНИЕ '+(step+1)+' ИЗ 5';$('prompt').textContent=questions[step];feedback('');$('nextBtn').disabled=true;$('nextBtn').textContent='ДАЛЕЕ ››';$('bubbles').classList.toggle('inactive',step!==2);if(step>1)$('neutralLayer').classList.add('stable');meter();switch(step){case 0:oxideTask();break;case 1:baseTask();break;case 2:carbonateTask();break;case 3:saltTask();break;case 4:matchTask();break;}}
function show(title,txt){$('modalTitle').textContent=title;$('modalBody').textContent=txt;$('modal').hidden=false}
function begin(){$('intro').hidden=true;started=true;step=0;nominal=startDanger();render()}
['reactorOxide','reactorBase','reactorCarbonate'].forEach(id=>$(id).addEventListener('click',()=>{const map={reactorOxide:'oxide',reactorBase:'base',reactorCarbonate:'carbonate'};pairTarget(map[id],$(id))}));
['saltNaCl','saltNa2SiO3','saltNaNO3'].forEach(id=>$(id).addEventListener('click',()=>pickSalt(id)));
$('nextBtn').addEventListener('click',()=>{if(!answered)return;if(step===4){show('ОТСЕК № 7 ПРОЙДЕН','Опасность снижена до 36%, восстановление достигло 64%. Аварийный шлюз открыт. Восьмой отсек пока разрабатывается.');return}step++;render()});
$('startBtn').addEventListener('click',begin);
$('helpBtn').addEventListener('click',()=>show('КАК УПРАВЛЯТЬ ОТСЕКОМ','1. Выбирай реактивы и химические ответы на изображении лаборатории. 2. В четвёртом задании нажми на одну из трёх бутылочек слева. 3. В финале выбери название процесса, затем соответствующий реактор или сосуд. Четыре правильных соответствия откроют шлюз. Таймера нет.'));
$('closeBtn').addEventListener('click',()=>{$('modal').hidden=true});
$('soundBtn').addEventListener('click',()=>{muted=!muted;$('soundBtn').textContent=muted?'♫':'♪';$('soundBtn').title=muted?'Включить звук':'Выключить звук';$('soundBtn').setAttribute('aria-label',$('soundBtn').title);sound(true)});
$('fullBtn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(stage.requestFullscreen)await stage.requestFullscreen()}catch(e){show('Полный экран','Браузер ограничивает полноэкранный режим при встраивании страницы.')}});
document.addEventListener('keydown',e=>{if(!$('modal').hidden){if(e.key==='Escape')$('modal').hidden=true;return}if(!$('intro').hidden){if(e.key==='Enter')begin();return}if(e.key==='Enter'&&!$('nextBtn').disabled)$('nextBtn').click()});
nav();gasBubbles();render();
})();
