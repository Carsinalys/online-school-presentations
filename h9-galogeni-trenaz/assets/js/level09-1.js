
(()=>{'use strict';
const $=id=>document.getElementById(id),stage=$('stage');
const dangerAfter=[26,25,23,22,20];
const questions=[
'Хлор направлен не туда! Выбери ВСЕ резервуары, где хлор может вытеснить другой галоген из его соли.',
'Ошибка подачи брома! Один клапан ведёт к раствору KCl, другой — к KI. Куда направить бром, чтобы произошла реакция?',
'Ложный сигнал установки! Найди химическую пару, в которой реакция вытеснения НЕ произойдёт.',
'Повреждена запись реакции хлора с бромидом калия. Восстанови продукты, а затем недостающие коэффициенты.',
'Последний запуск: сначала получи бром, затем йод. Для каждого этапа выбери реагенты и восстанови работу установки.'
];
let step=0,nominal=28,answered=false,selected=new Set(),muted=true,audio=null,phase=0,timers=[],locksOpened=0;
const delay=(fn,ms)=>{timers.push(setTimeout(fn,ms))}, cancel=()=>{timers.forEach(clearTimeout);timers=[]};
function tone(good=true){if(muted)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();let o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.type=good?'sine':'triangle';o.frequency.setValueAtTime(good?480:210,t);o.frequency.linearRampToValueAtTime(good?750:145,t+.18);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.065,t+.022);g.gain.exponentialRampToValueAtTime(.0001,t+.28);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.29)}catch(e){}}
function updateMeter(){$('dangerText').textContent=nominal+'%';$('repairText').textContent=(100-nominal)+'%';$('dangerFill').style.width=nominal+'%';$('repairFill').style.width=(100-nominal)+'%'}
function startDanger(){let s=new URLSearchParams(location.search);if(s.has('danger')){let n=+s.get('danger');if(Number.isFinite(n))return Math.max(20,Math.min(28,n))}try{let p=JSON.parse(localStorage.getItem('galogeny_progress_v1')||'null');if(p&&p.lastSector===8&&Number.isFinite(+p.danger))return Math.max(20,Math.min(28,+p.danger))}catch(e){}return 28}
function save(){try{localStorage.setItem('galogeny_progress_v1',JSON.stringify({lastSector:9,danger:nominal,updatedAt:new Date().toISOString()}))}catch(e){}}
function announce(text,type=''){$('feedback').textContent=text;$('feedback').className='feedback '+(type||'')}
function wrong(text,b){if(answered)return;announce(text,'bad');tone(false);if(b){b.classList.add('bad');delay(()=>b.classList.remove('bad'),530)}}
function showEquation(eq){$('equation').textContent=eq;$('equation').hidden=false}
function activate(i,color){$('vessel'+i).className='vesselTint active '+(color==='iodine'?'iodine':'');stage.classList.add(color==='iodine'?'flowI':'flowBr')}
function spin(i){let e=$('valve'+i);e.className='valve visible';void e.offsetHeight;e.classList.add('spin')}
function pipeHighlight(i){$('pipe'+i).classList.add('active')}
function succeed(msg){if(answered)return;answered=true;nominal=dangerAfter[step];updateMeter();save();announce(msg,'good');tone(true);$('nextBtn').disabled=false;$('nextBtn').textContent=step===4?'К ОТСЕКУ 10 ››':'ДАЛЕЕ ››';if(step===4){try{window.parent.postMessage({type:'galogeny:sectorComplete',sector:9,danger:20,recovery:80},'*')}catch(e){}}}
function btn(t,cb){let b=document.createElement('button');b.type='button';b.textContent=t;b.addEventListener('click',()=>cb(t,b));return b}
function choices(opts,callback,grid=false){let c=$('choices');c.hidden=false;c.className='choices'+(grid?' grid':'')+(step===4?' circuitChoices':'');c.replaceChildren();opts.forEach(s=>c.appendChild(btn(s,callback)))}
function disableChoices(){[...$('choices').children].forEach(b=>b.disabled=true)}
function reset(){cancel();selected.clear();answered=false;phase=0;locksOpened=0;stage.classList.remove('flowBr','flowI','leverRight','showLever','solved','questionMode4');stage.classList.toggle('reservoirMode',step===0);$('choices').hidden=true;$('choices').replaceChildren();$('checkBtn').hidden=true;$('smallHint').hidden=true;$('equation').hidden=true;$('circuitCard').hidden=true;$('doorSystem').classList.remove('engaged','open');$('doorNotice').hidden=true;$('doorNotice').classList.remove('open');$('nextBtn').disabled=true;$('nextBtn').textContent='ДАЛЕЕ ››';for(let i=0;i<3;i++){$('vessel'+i).className='vesselTint';$('pipe'+(i+1)).className='';}for(let k of ['A','B','C'])$('valve'+k).className='valve';[...$('locks').children].forEach((x,i)=>{x.className='lock';x.textContent=i+1});$('questionNo').textContent='ЗАДАНИЕ '+(step+1)+' ИЗ 5';$('questionText').textContent=questions[step];announce('');updateMeter()}
function q1(){choices(['KCl','KBr','KI'],(s,b)=>{if(answered)return;if(selected.has(s)){selected.delete(s);b.classList.remove('selected')}else{selected.add(s);b.classList.add('selected')}$('checkBtn').disabled=selected.size===0;$('smallHint').textContent='Выбрано: '+selected.size+' из 3';});$('smallHint').hidden=false;$('smallHint').textContent='Нужно выбрать все подходящие резервуары.';$('checkBtn').hidden=false;$('checkBtn').disabled=true;$('checkBtn').textContent='ПРОВЕРИТЬ ВЫБОР';$('checkBtn').onclick=()=>{let ok=selected.size===2&&selected.has('KBr')&&selected.has('KI');if(!ok){wrong('Вспомни ряд активности: хлор активнее брома и йода, но не самого себя.');return}disableChoices();$('checkBtn').hidden=true;$('smallHint').hidden=true;[...$('choices').children].forEach(b=>{if(selected.has(b.textContent))b.classList.add('good')});pipeHighlight(2);pipeHighlight(3);spin('B');spin('C');activate(0,'bromine');activate(1,'iodine');showEquation('Cl₂ + 2KBr = 2KCl + Br₂');succeed('Верно! Хлор направлен к KBr и KI. Два аварийных вентиля открылись.')}}
function q2(){stage.classList.add('showLever');choices(['KCl','KI'],(s,b)=>{if(answered)return;if(s!=='KI'){wrong('Бром не может вытеснить более активный хлор из KCl.',b);return}stage.classList.add('leverRight');b.classList.add('good');disableChoices();activate(1,'iodine');spin('C');pipeHighlight(3);showEquation('Br₂ + 2KI = 2KBr + I₂');succeed('Правильно! Переключатель направил бром в раствор KI, образуется йод.')});}
function q3(){choices(['Cl₂ + KBr','Br₂ + KI','I₂ + KCl'],(s,b)=>{if(answered)return;if(s!=='I₂ + KCl'){wrong('Эта реакция возможна. Ищи пару, где менее активный галоген пытается вытеснить более активный.',b);return}b.classList.add('good');disableChoices();spin('A');showEquation('Активность галогенов: Cl₂ > Br₂ > I₂');succeed('Верно! Йод не вытесняет хлор из KCl. Неправильный канал отключён.')})}
function q4(){
  // Два обязательных этапа без подсказки готовыми продуктами в условии.
  phase=0;
  selected.clear();
  stage.classList.add('questionMode4');
  $('questionText').textContent='ШАГ 1 ИЗ 2. Выбери ДВА продукта реакции хлора с бромидом калия.';
  showEquation('Cl₂ + KBr = ? + ?');
  choices(['KCl','Br₂','KI','I₂'],(s,b)=>{
    if(answered || phase!==0)return;
    if(selected.has(s)) {selected.delete(s);b.classList.remove('selected')}
    else {selected.add(s);b.classList.add('selected')}
    $('checkBtn').disabled=selected.size!==2;
    $('smallHint').textContent='Выбрано продуктов: '+selected.size+' из 2';
    announce('');
  });
  $('smallHint').hidden=false;
  $('smallHint').textContent='Отметь два вещества, затем проверь выбор.';
  $('checkBtn').hidden=false;
  $('checkBtn').disabled=true;
  $('checkBtn').textContent='ПРОВЕРИТЬ ПРОДУКТЫ';
  $('checkBtn').onclick=()=>{
    if(phase!==0 || answered)return;
    if(!(selected.size===2 && selected.has('KCl') && selected.has('Br₂'))){
      wrong('Проверь ряд активности галогенов и состав исходной соли.');
      return;
    }
    // Продукты показываем лишь после успешного первого этапа.
    phase=1;
    $('checkBtn').hidden=true;
    $('smallHint').hidden=true;
    $('questionText').textContent='ШАГ 2 ИЗ 2. Расставь коэффициенты перед KBr и KCl.';
    showEquation('Cl₂ + □KBr = □KCl + Br₂');
    announce('Продукты выбраны верно! Теперь расставь коэффициенты.','good');
    choices(['1 и 1','2 и 2','2 и 1','1 и 2'],(coeff,b2)=>{
      if(answered || phase!==1)return;
      if(coeff!=='2 и 2'){
        wrong('Сосчитай атомы хлора и брома в левой и правой частях уравнения.',b2);
        return;
      }
      b2.classList.add('good');
      disableChoices();
      spin('B');
      activate(0,'bromine');
      showEquation('Cl₂ + 2KBr = 2KCl + Br₂');
      succeed('Уравнение восстановлено! Сначала найдены продукты, затем коэффициенты.');
    });
  };
}
function unlockPair(n){for(let j=0;j<n;j++){let x=$('locks').children[locksOpened];if(!x)break;x.classList.add('open');x.textContent='✓';locksOpened++;}tone(true)}
function q5(){$('doorSystem').classList.add('engaged');$('doorNotice').hidden=false;$('doorNotice').textContent='4 ЗАМКА ЗАКРЫТЫ';$('circuitCard').hidden=false;phase=0;nextChain()}
function nextChain(){let n=phase, label=n===0?'КАМЕРА 1 · ПОЛУЧИ БРОМ':'КАМЕРА 2 · ПОЛУЧИ ЙОД';$('circuitLabel').textContent=label;$('circuitPair').textContent=n===0?'КАКИЕ РЕАГЕНТЫ ПОДАТЬ?':'КАКИЕ РЕАГЕНТЫ ПОДАТЬ?';let opts=n===0?['Cl₂ + KBr','Br₂ + KCl','I₂ + KI']:['Br₂ + KI','I₂ + KBr','Cl₂ + KCl'];choices(opts,(s,b)=>{let good=n===0?'Cl₂ + KBr':'Br₂ + KI';if(s!==good){wrong('Проверь активность галогенов: Cl₂ > Br₂ > I₂.',b);return}b.classList.add('good');disableChoices();if(n===0){unlockPair(2);spin('B');activate(0,'bromine');pipeHighlight(2);showEquation('Cl₂ + 2KBr = 2KCl + Br₂');announce('Бром получен! Два замка открылись, готовим вторую камеру.','good');$('doorNotice').textContent='ОТКРЫТО 2 ИЗ 4';phase=1;delay(()=>{if(step!==4)return;$('equation').hidden=true;nextChain()},1150)}else{unlockPair(2);spin('C');activate(1,'iodine');pipeHighlight(3);showEquation('Br₂ + 2KI = 2KBr + I₂');$('doorNotice').textContent='ШЛЮЗ ОТКРЫВАЕТСЯ';$('doorNotice').classList.add('open');stage.classList.add('solved');$('doorSystem').classList.add('open');$('choices').hidden=true;$('circuitCard').hidden=true;delay(()=>{$('doorNotice').textContent='ШЛЮЗ ОТКРЫТ';succeed('Бром и йод получены последовательно. Все четыре замка открыты!')},700)}})}
function render(){reset();[q1,q2,q3,q4,q5][step]()}
function modal(title,body){$('modalTitle').textContent=title;$('modalBody').textContent=body;$('modal').hidden=false}
function nav(){for(let i=1;i<=12;i++){let d=document.createElement('span');d.className='sector '+(i<9?'done':i===9?'current':'future');d.textContent=i;d.title='Отсек '+i;$('sectors').appendChild(d)}}
$('startBtn').addEventListener('click',()=>{$('intro').hidden=true;nominal=startDanger();step=0;render()});
$('nextBtn').addEventListener('click',()=>{if(!answered)return;if(step===4){try{if(window.parent!==window){window.parent.postMessage({type:'galogeny:next',sector:10,fromSector:9,danger:20},'*');return}}catch(e){}modal('ДЕВЯТЫЙ ОТСЕК ПРОЙДЕН','Опасность снизилась до 20%, восстановлено 80%. Шлюз открыт. Десятый отсек пока не подключён.');return}step++;render()});
$('helpBtn').addEventListener('click',()=>modal('КАК ИГРАТЬ','1. Выбери обе соли, из которых хлор вытесняет другие галогены.\n2. Переключи бром в правильный трубопровод.\n3. Найди невозможную реакцию.\n4. Восстанови уравнение: сначала продукты, затем коэффициенты.\n5. Последовательно получи бром и йод, чтобы открыть шлюз.\n\nНеправильный выбор можно исправлять. Времени на ответ сколько угодно.'));
$('closeBtn').addEventListener('click',()=>{$('modal').hidden=true});
$('soundBtn').addEventListener('click',()=>{muted=!muted;$('soundBtn').textContent=muted?'♫':'♪';$('soundBtn').title=muted?'Включить звук':'Выключить звук';tone(true)});
$('fullBtn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await stage.requestFullscreen()}catch(e){modal('ПОЛНЫЙ ЭКРАН','Ваш браузер может ограничивать полноэкранный режим во встроенной странице.')}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('modal').hidden){$('modal').hidden=true;return}if(e.key==='Enter'){if(!$('intro').hidden)$('startBtn').click();else if($('modal').hidden&&!$('nextBtn').disabled)$('nextBtn').click()}});
nav();nominal=startDanger();updateMeter();render();
})();
