
(() => {
 'use strict';
 const questions = [
  {text:'На полу рассыпались тёмные кристаллы, над ними — фиолетовые пары. Какой сосуд нужно изолировать?', answer:'I2', explanation:'Правильно! Это иод I₂: тёмно-серые кристаллы, которые при нагревании дают фиолетовые пары.'},
  {text:'Из установки вытекает красно-бурая жидкость. Найди её сосуд и перекрой утечку!', answer:'Br2', explanation:'Верно! Бром Br₂ — красно-бурая летучая жидкость.'},
  {text:'Датчик обнаружил жёлто-зелёный газ. Нажми на сосуд, который нужно герметизировать!', answer:'Cl2', explanation:'Верно! Хлор Cl₂ — токсичный газ жёлто-зелёного цвета.'},
  {text:'Сработала тревога: утечка бледно-жёлтого газа. Найди и изолируй опасный резервуар!', answer:'F2', explanation:'Верно! Фтор F₂ — бледно-жёлтый, чрезвычайно реакционноспособный газ.'},
  {text:'Над тёмными кристаллами появился фиолетовый пар. Выбери нужный сосуд для блокировки!', answer:'I2', explanation:'Отлично! Это иод I₂. Пятый аварийный датчик восстановлен, хранилище локализовано.'}
 ];
 const stage=document.querySelector('#stage');
 const intro=document.querySelector('#intro');
 const startBtn=document.querySelector('#startBtn');
 const qtext=document.querySelector('#questionText');
 const qindex=document.querySelector('#questionIndex');
 const scientist=document.querySelector('#scientistText');
 const next=document.querySelector('#nextBtn');
 const answerBtns=[...document.querySelectorAll('.tank-choice')];
 const dots=document.querySelector('#sectors');
 const dangerText=document.querySelector('#dangerText');
 const restoreText=document.querySelector('#restoreText');
 const dangerFill=document.querySelector('#dangerFill');
 const restoreFill=document.querySelector('#restoreFill');
 const modal=document.querySelector('#modal');
 const modalTitle=document.querySelector('#modalTitle');
 const modalBody=document.querySelector('#modalBody');
 const flash=document.querySelector('#flash');
 const tankIds={F2:'tankF',Cl2:'tankCl',Br2:'tankBr',I2:'tankI'};
 const rooms=['Хранилище галогенов','Токсичная зона','Электроотрицательность','Химическая связь','Галогеноводородные кислоты','Металлический реактор','Реакционный блок','Аналитическая лаборатория','Битва галогенов','Окислитель и восстановитель','Электронный баланс','Центральный реактор'];
 let q=0,answered=false,finished=false,started=false,muted=true,nominalDanger=96,displayDanger=96,wrongFlashAt=0,audioCtx=null;
 function sound(type) {
   if(muted)return;
   try {
     const ctx=audioCtx||(audioCtx=new (window.AudioContext||window.webkitAudioContext)());
     if(ctx.state==='suspended')ctx.resume();
     const now=ctx.currentTime;
     const o=ctx.createOscillator(),g=ctx.createGain();
     o.type=type==='wrong'?'sawtooth':'sine';
     o.frequency.setValueAtTime(type==='wrong'?180:450,now);
     o.frequency.exponentialRampToValueAtTime(type==='wrong'?100:760,now+.15);
     g.gain.setValueAtTime(.00001,now);g.gain.exponentialRampToValueAtTime(.08,now+.02);g.gain.exponentialRampToValueAtTime(.00001,now+.22);
     o.connect(g);g.connect(ctx.destination);o.start(now);o.stop(now+.23);
   }catch(_){}
 }
 function showModal(title,body){modalTitle.textContent=title;modalBody.innerHTML=body;modal.hidden=false;document.querySelector('#modalClose').focus()}
 document.querySelector('#modalClose').addEventListener('click',()=>{modal.hidden=true;(finished?startBtn:next).focus()});
 modal.addEventListener('click',event=>{if(event.target===modal)modal.hidden=true});
 function updateMeters(){
   // Display jitters by a single point to convey unstable controls, with no time pressure on the player.
   const now=Date.now();
   const spike=now-wrongFlashAt<1350?1:0;
   displayDanger=Math.min(100,nominalDanger+spike+((Math.floor(now/850)%4===1)?1:0));
   const recovery=100-displayDanger;
   dangerText.textContent=displayDanger+'%';restoreText.textContent=recovery+'%';
   dangerFill.style.width=displayDanger+'%';restoreFill.style.width=recovery+'%';
 }
 function glowTank(k){document.querySelectorAll('.glass-pulse').forEach(e=>e.classList.toggle('visible',e.id===tankIds[k]));}
 function buildDots(){
   dots.replaceChildren();
   rooms.forEach((room,i)=>{
     const btn=document.createElement('button');btn.type='button';btn.className='sector-dot'+(i===0?' on':'');
     btn.dataset.number=String(i+1);btn.title='Отсек '+(i+1)+': '+room;
     btn.setAttribute('aria-label','Отсек '+(i+1)+'. '+room+(i?' — пока заблокирован':' — текущий'));
     btn.addEventListener('click',()=>{
       if(i===0){showModal('Отсек 1. Хранилище галогенов','<p>Ты находишься в первом из двенадцати отсеков.</p><p>Не путай эти двенадцать отметок с ответами: <strong>это карта помещений лаборатории</strong>.</p>')}
       else showModal('Отсек '+(i+1)+': '+room,'<p>Это помещение обозначено на карте лаборатории, но в данной пробной версии открыт только первый отсек.</p><p>Продолжим собирать остальные отсеки по утверждённому сценарию.</p>');
     });dots.append(btn);
   });
 }
 function renderQuestion(){
   qtext.textContent=questions[q].text;
   qindex.textContent='Задание '+(q+1)+' из '+questions.length;
   answerBtns.forEach(b=>{b.disabled=false;b.classList.remove('correct','wrong');b.setAttribute('aria-pressed','false')});
   answered=false;next.disabled=true;next.textContent='ДАЛЕЕ ➜';
   glowTank(null);
   scientist.textContent='Система повреждена! Нажимай прямо на сосуд с нужным веществом. У тебя есть время, чтобы подумать.';
   updateMeters();
 }
 function reset(){q=0;answered=false;finished=false;started=true;nominalDanger=96;wrongFlashAt=0;stage.classList.remove('completed');intro.classList.add('hidden');buildDots();renderQuestion();}
 function finish(){
   finished=true;
   scientist.textContent='Отлично! Диагностика хранилища завершена. Защитные механизмы начали восстанавливаться.';
   qindex.textContent='ОТСЕК 1 СТАБИЛИЗИРОВАН';
   qtext.textContent='Первое помещение спасено! Опасность снизилась. Остальные 11 отсеков пока ждут подключения.';
   answerBtns.forEach(b=>{b.disabled=true;b.classList.remove('correct','wrong')});
   next.disabled=false;next.textContent='СНОВА ↻';
   dots.firstElementChild?.classList.add('done');
   glowTank(null);
   showModal('ОТСЕК 1 ВОССТАНОВЛЕН!','<p><strong>5 из 5</strong> диагностических заданий выполнены.</p><p>Опасность уменьшилась примерно с 96% до '+nominalDanger+'%. Лаборатория пока остаётся в аварийном режиме: впереди ещё 11 помещений.</p><p>Кнопка «СНОВА» позволит ещё раз пройти первый отсек.</p>');
 }
 function choose(key){
   if(!started || answered || finished || !modal.hidden)return;
   const button=answerBtns.find(b=>b.dataset.key===key);
   if(!button)return;
   if(key===questions[q].answer){
     answered=true;
     nominalDanger=[94,92,90,88,86][q];
     scientist.textContent=questions[q].explanation;
     answerBtns.forEach(b=>b.disabled=true);
     button.classList.add('correct');button.setAttribute('aria-pressed','true');
     next.disabled=false;
     next.textContent=q===questions.length-1?'ЗАВЕРШИТЬ ✓':'ДАЛЕЕ ➜';
     glowTank(key);
     flash.classList.remove('active');void flash.offsetWidth;flash.classList.add('active');
     updateMeters();sound('correct');
   }else{
     button.classList.remove('wrong');void button.offsetWidth;button.classList.add('wrong');
     scientist.textContent='Это не тот сосуд! Сравни цвет и агрегатное состояние вещества в ёмкостях. Попробуй ещё раз.';
     wrongFlashAt=Date.now();updateMeters();sound('wrong');
   }
 }
 answerBtns.forEach(btn=>btn.addEventListener('click',()=>choose(btn.dataset.key)));
 next.addEventListener('click',()=>{
   if(finished){reset();return}
   if(!answered) return;
   if(q===questions.length-1){finish();return}
   q++;renderQuestion();sound('correct');
 });
 startBtn.addEventListener('click',()=>{reset();sound('correct')});
 document.querySelector('#helpBtn').addEventListener('click',()=>showModal('Как играть','<p><strong>Цель:</strong> устранить неисправности в хранилище галогенов.</p><p>Ответь на пять вопросов, выбирая одну из четырёх формул: F₂, Cl₂, Br₂ или I₂. Нажми «Далее» после верного ответа.</p><p>У каждого вещества на рисунке показано характерное физическое состояние. Ошибки не заканчивают игру, таймера нет.</p><p>Нижние 12 кружков — <strong>отсеки лаборатории</strong>, а не варианты ответов. Сейчас доступен первый.</p><p>На компьютере можно пользоваться мышью или клавишами 1–4, Enter. На телефоне — касанием.</p>'));
 const soundBtn=document.querySelector('#soundBtn');
 soundBtn.addEventListener('click',()=>{muted=!muted;soundBtn.title=muted?'Включить звук':'Выключить звук';soundBtn.setAttribute('aria-label',soundBtn.title);soundBtn.style.boxShadow=muted?'':'0 0 16px #27e6ff';sound('correct')});
 document.querySelector('#fullBtn').addEventListener('click',async()=>{
   try{if(document.fullscreenElement){await document.exitFullscreen()}else if(stage.requestFullscreen){await stage.requestFullscreen()}}catch(e){showModal('Полноэкранный режим','<p>Браузер или встроенная страница запретили полноэкранный режим. Играть можно и в обычном окне.</p>')}
 });
 document.addEventListener('keydown',e=>{
   if(!modal.hidden){if(e.key==='Escape')modal.hidden=true;return}
   if(!intro.classList.contains('hidden')){if(e.key==='Enter')startBtn.click();return}
   if(['1','2','3','4'].includes(e.key)){choose(answerBtns[Number(e.key)-1].dataset.key);return}
   if(e.key==='Enter'&&!next.disabled){next.click()}
 });
 buildDots();updateMeters();setInterval(updateMeters,460);
})();
