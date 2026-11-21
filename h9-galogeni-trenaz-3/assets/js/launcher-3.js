
/* Мобильный интерфейс. Нажатия выполняются на оригинальных элементах, поэтому журнал работает как прежде. */
(function(){
 const $=id=>document.getElementById(id),frame=$('frame'),viewer=$('viewer'),assist=$('mobileAssist');
 const title=$('mobileTask'),grid=$('mobileChoices'),status=$('mobileStatus');
 const labelById={F:'Фтор F₂',Cl:'Хлор Cl₂',Br:'Бром Br₂',I:'Йод I₂',tankF:'Фтор F₂',tankCl:'Хлор Cl₂',tankBr:'Бром Br₂',tankI:'Йод I₂',pickF:'Фтор F₂',pickCl:'Хлор Cl₂',pickBr:'Бром Br₂',pickI:'Йод I₂',vessel0:'Резервуар 1 (KCl)',vessel1:'Резервуар 2 (KBr)',vessel2:'Резервуар 3 (KI)',reactorOxide:'Реактор с оксидом',reactorBase:'Реактор с основанием',reactorCarbonate:'Реактор с карбонатом',saltNaCl:'NaCl',saltNa2SiO3:'Na₂SiO₃',saltNaNO3:'NaNO₃'};
 const special={
 1:'.tank-choice, .answers button, .question-panel button, .next',
 2:'.target, .dialog-strip button, .row button, .next',
 3:'.canister, .scheme button, .schemetoken, .nextbtn',
 4:'.module, .labelHit, .question button, .nextbtn',
 5:'.tank, .optionPanel button, .chip, .nextbtn',
 6:'.plate, .selectionDeck button, .actionCheck, .nextbtn, .sensor',
 7:'.reactorHit, .saltHit, .oxideDeck button, .choiceDeck button, .processDeck button, .actionBtn, .nextbtn',
 8:'.bottleDeck button, .answerDeck button, .actionBtn, .matchBoard button, .nextbtn',
 9:'.choices button, .checkBtn, .circuitCard button, .doorSystem button, .nextbtn',
 10:'.pick, .action, #answers button',
 11:'.mission button, .choice, .dial button',
 12:'.mission button, .choice, .dial button'
 };
 let lastSig='',lastDoc=null;
 function active(n){const mobile=matchMedia('(max-width:700px) and (orientation:portrait)').matches;return mobile&&viewer.classList.contains('active')&&!viewer.classList.contains('report')&&n>=2&&n<=10}
 function visible(el,win){if(!el||!el.isConnected)return false;const style=win.getComputedStyle(el);if(style.display==='none'||style.visibility==='hidden'||parseFloat(style.opacity)==0)return false;for(let p=el.parentElement;p&&p!==el.ownerDocument.body;p=p.parentElement){let s=win.getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden')return false}let r=el.getBoundingClientRect();return r.width>2&&r.height>2}
 function clean(s){return String(s||'').replace(/\s+/g,' ').trim().slice(0,280)}
 function question(doc,n){const sels={2:'#question',3:'.question .prompt, #prompt',4:'.question .prompt',5:'.question .prompt',6:'.question .prompt',7:'.question .prompt',8:'.question .prompt',9:'.questionText, .question .prompt',10:'.question, #equation'};
  let nodes=doc.querySelectorAll(sels[n]||'.question');
  for(let el of nodes){let s=clean(el.innerText||el.textContent);if(s&&s.length>7)return s}
  return 'Выбери правильный ответ на схеме лаборатории.';
 }
 function actualButtons(doc,n){let win=doc.defaultView;let els=[...doc.querySelectorAll(special[n]||'button')];const out=[];const seen=new Set();
  for(let el of els){if(!visible(el,win)||el.disabled)continue;
   if(el.closest('.mir-brand,.modal,.intro,.bottom-nav,.sector-strip,.sectors,.navigation,.topmeter,.toolbar,.tools'))continue;
   const id=el.id||'';let txt=clean(el.innerText||el.textContent)||clean(el.getAttribute('aria-label'))||labelById[id]||clean(el.getAttribute('title'));
   if(!txt&&el.classList.contains('canister'))txt=clean(el.innerText||el.dataset.symbol)||labelById[id];
   if(!txt&&el.classList.contains('target'))txt=clean(el.dataset.name||el.dataset.label)||'Нажать на оборудование';
   if(!txt||['?','♫','♬','♪','⛶','🔈','🔊'].includes(txt))continue;
   if(txt.length>96)txt=txt.slice(0,93)+'…';
   if(el.closest('.mission')&&/назад|сброс|перезапуск/i.test(txt))continue;
   const k=id||txt;if(seen.has(k))continue;seen.add(k);out.push({el,label:txt,id});
   if(out.length>=24)break;
  }
  return out;
 }
 function introButton(doc){let candidates=[...doc.querySelectorAll('.intro button,#intro button,.modal button,#modal button,#toast button')];let win=doc.defaultView;
  return candidates.find(el=>visible(el,win)&&!el.disabled)||null;
 }
 function update(){let n=+(location.hash.match(/level-(\d+)/)||[])[1]||0;viewer.dataset.level=String(n);if(!active(n)){assist.style.display='none';lastSig='';return;}assist.style.display='block';
  const doc=frame.contentDocument;if(!doc||!doc.body)return;
  const intro=introButton(doc);let buttons=[];let q=question(doc,n);let introText='';
  if(intro){introText=clean(intro.closest('.intro,.modal')?.innerText).slice(0,400);buttons=[{el:intro,label:clean(intro.innerText)||'Начать выполнение',start:true}];q=introText||q}
  else buttons=actualButtons(doc,n);
  let msg='';const m=doc.querySelector('.question .feedback, .feedback, #message, .message, #smallHint, .smallHint');if(m)msg=clean(m.innerText||m.textContent);
  const signature=[n,q,msg,...buttons.map(a=>a.label+'|'+a.id+'|'+(a.el.classList.contains('selected')||a.el.classList.contains('active')?'1':'0'))].join('✦');
  if(signature===lastSig&&doc===lastDoc)return;lastSig=signature;lastDoc=doc;
  title.textContent=q;status.textContent=msg;
  grid.replaceChildren();
  for(const b of buttons){let el=document.createElement('button');el.type='button';el.textContent=b.label;const act=/проверить|далее|готово|сохранить|подтверд|пуск|активир|завершить/i.test(b.label);if(act)el.classList.add('isAction');if(b.start)el.classList.add('isStart');
    if(b.el.classList.contains('selected')||b.el.classList.contains('active'))el.classList.add('isChosen');
    el.onclick=()=>{try{b.el.click();setTimeout(update,50);setTimeout(update,500)}catch(e){status.textContent='Для этого действия нажми на изображение выше.'}};grid.append(el)
  }
  if(!buttons.length){let p=document.createElement('p');p.className='mobileStatus';p.textContent='Ответь, нажимая на активные объекты на изображении выше.';grid.append(p)}
 }
 function adjustHeight(){ /* Height is managed by mobile-shell-v3 with actual content measurement. */ }
 // Команды выполняются по событиям и краткой периодической синхронизации.
 frame.addEventListener('load',()=>{lastSig='';lastDoc=null;setTimeout(update,100);setTimeout(adjustHeight,400)});
 let lastN=0;
 setInterval(()=>{let n=+(location.hash.match(/level-(\d+)/)||[])[1]||0;if(n!==lastN){lastN=n;lastSig='';}update();adjustHeight()},500);
 let fullscreen=document.createElement('button');fullscreen.id='fullGame';fullscreen.textContent='⛶ На весь экран';fullscreen.title='Развернуть игру в полноэкранный режим';fullscreen.onclick=()=>{if(document.fullscreenElement){document.exitFullscreen?.()}else{document.documentElement.requestFullscreen?.().catch(()=>{})}};
 let open=document.createElement('button');open.id='openTab';open.textContent='↗ Отдельное окно';open.title='Открыть игру без рамки сайта';open.onclick=()=>{const url=new URL(location.href);window.open(url.toString(),'_blank','noopener')};
 $('mobileHint').onclick=()=>{try{const d=frame.contentDocument;const b=d?.querySelector('#helpBtn,#hintBtn,#help');if(b){b.click();setTimeout(update,100)}else{status.textContent='Подсказка открывается кнопкой «?» на изображении выше.'}}catch(e){}};
 const tools=$('bar').querySelector('.tools');tools.append(fullscreen,open);
})();
