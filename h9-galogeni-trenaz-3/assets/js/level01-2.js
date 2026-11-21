/* Внедряется в каждый утверждённый HTML без изменения игровых заданий. */
(function(){
'use strict';
const sector=1, source='chem-tracker';
const topics={1:'Физические свойства галогенов',2:'Безопасность в лаборатории',3:'Электроотрицательность галогенов',4:'Химическая связь',5:'Соляная кислота и её растворы',6:'Металлы и кислоты',7:'Реакции кислот с оксидами, основаниями и солями',8:'Хлориды и качественные реакции',9:'Вытеснение галогенов',10:'Окислители и восстановители',11:'Электронный баланс',12:'Химические свойства: итоговые задания'};
const qtopics={
5:{1:'Формулы кислот',2:'Среда раствора кислоты',3:'Ионы соляной кислоты',4:'Свойства плавиковой кислоты',5:'Названия галогеноводородных кислот'},
6:{1:'Металлы и соляная кислота',2:'Водород как продукт реакции',3:'Коэффициенты в реакции металла с кислотой',4:'Ряд активности металлов',5:'Металлы, вытесняющие водород'},
7:{1:'Основные оксиды и кислоты',2:'Нейтрализация кислот основаниями',3:'Карбонаты и выделение CO₂',4:'Силикаты и кремниевая кислота',5:'Распознавание химических реакций'},
8:{1:'Названия и формулы хлоридов',2:'Реактив на хлорид-ионы',3:'Осадок хлорида серебра',4:'Уравнение реакции обмена',5:'Осадки галогенидов серебра'},
9:{1:'Вытеснение галогенов хлором',2:'Вытеснение иода бромом',3:'Невозможные реакции вытеснения',4:'Продукты и коэффициенты реакций',5:'Цепочка реакций галогенов'},
10:{1:'Окислитель',2:'Восстановитель',3:'Степени окисления',4:'Окислитель и восстановитель',5:'Распознавание ОВР'},
11:{1:'Степень окисления железа',2:'Число отданных электронов',3:'Число принятых электронов',4:'Наименьшее общее число электронов',5:'Коэффициенты методом электронного баланса'},
12:{1:'Основные оксиды и соляная кислота',2:'Гидроксиды и соляная кислота',3:'Карбонаты и соляная кислота',4:'Качественная реакция на хлорид-ион',5:'Вытеснение галогенов',6:'Металлы и соляная кислота: коэффициенты'}
};
const key='chem_lab_learning_log_v1';let seq=0,doneOnce=false,lastQ=0,previousTitle='',pending=null;const successSeen=new Set();
const read=id=>document.getElementById(id);
const counterIds=['questionIndex','questionNo','qCounter','counter','number','count','step'];
const textIds=['taskTitle','taskText','questionText','prompt','question','questionTitle','headline'];
const feedbackIds=['feedback','message','guide','reply','anStatus'];
const nextIds=['nextBtn','next','mainNext'];
function q(){for(const id of counterIds){const a=read(id);if(!a)continue;const s=(a.textContent||'').trim();const m=s.match(/(?:ЗАДАНИЕ|Задание)\s*(\d{1,2})\s*(?:из|ИЗ|\/)\s*(\d{1,2})/);if(m)return Number(m[1]);}return lastQ||1;}
function title(){for(const id of textIds){const a=read(id);if(a){const s=(a.textContent||'').trim().slice(0,180);if(s&&!/^(ЗАДАНИЕ|Задание)/.test(s))return s;}}return `${topics[sector]} — задание ${q()}`;}
function feedback(){for(const id of feedbackIds){const e=read(id);if(e&&((e.className||'').includes('feedback')||id==='message'||id==='guide'||id==='reply')){return {el:e,text:(e.textContent||'').replace(/\s+/g,' ').trim().slice(0,450),cls:String(e.className||'').toLowerCase()}}}return {text:'',cls:''}}
function outcome(data){const s=data.text.toLowerCase(),cls=data.cls;
 if(/\b(correct|success|good|ok)\b/.test(cls)||/(?:^|[.!\s])(?:верно|правильно|отлично|молодец|превосходно|да, верно)/i.test(s))return 'right';
 if(/\b(wrong|error|bad|mistake)\b/.test(cls)||/(?:неверно|ошибка|пока неверно|неправильно|попробуй ещё|попробуй снова|не тот)/.test(s))return 'wrong';
 return '';
}
function sourceAnswer(t,isCheck=false){if(!t)return '';
 const c=t.closest?.('button,[role="button"],.option,.chip,.choice,.reactionCard,.vessel,.card,.saltBottle,.molecule');
 if(!isCheck){let direct=String(c?.getAttribute('aria-label')||c?.getAttribute('title')||c?.textContent?.trim()||c?.id||t.id||'');return direct.slice(0,160)}
 const deck=['#choices','#answers','#answerDeck','#answerArea','#choiceDeck','#options','#optionsPanel','#reactionGrid'].map(s=>document.querySelector(s)).find(Boolean)||document;
 const selected=[...deck.querySelectorAll('.selected,.active,.chosen,.picked,.sel')].filter(e=>e.textContent.trim()&&e.textContent.length<70).map(e=>e.textContent.trim()).slice(0,6);
 return selected.length?selected.join(' + '):String(c?.getAttribute('aria-label')||c?.getAttribute('title')||c?.textContent?.trim()||c?.id||t.id||'').slice(0,160);
}
function emit(type,detail={}){const e={source,event:{id:`${sector}.${Date.now()}.${++seq}`,at:new Date().toISOString(),type,sector,question:detail.question||q(),topic:(qtopics[sector]||{})[detail.question||q()]||topics[sector],title:detail.title||title(),answer:detail.answer||'',feedback:detail.feedback||'',correct:detail.correct,step:detail.step||''}};
 if(window.parent!==window){try{window.parent.postMessage(e,'*')}catch(_){}}
 try{const x=JSON.parse(localStorage.getItem(key)||'null')||{version:1,startedAt:new Date().toISOString(),events:[],reflections:{},practice:[],lastSector:sector};if(!Array.isArray(x.events))x.events=[];if(!x.startedAt)x.startedAt=new Date().toISOString();x.lastSector=Math.max(x.lastSector||1,sector);x.events.push(e.event);if(type==='complete'&&sector===12)x.endedAt=new Date().toISOString();localStorage.setItem(key,JSON.stringify(x));}catch(_){}}
window.labTelemetry={attempt({correct,selected,feedback:fb,step}={}){emit('attempt',{correct,answer:Array.isArray(selected)?selected.join(' + '):String(selected||''),feedback:fb,step})},hint(){emit('hint')},complete(){if(!doneOnce){doneOnce=true;emit('complete');}}};
window.labReport=window.labTelemetry;
emit('start',{question:0});
function currentNextEnabled(){return nextIds.some(id=>{const a=read(id);return !!a&&!a.disabled&&getComputedStyle(a).display!=='none'});}
function sample(c){if(!c||c.recorded||c.cancelled)return;const oldq=c.question, nowq=q(),data=feedback();const r=outcome(data);
 const right=(r==='right'||((!c.nextWasEnabled&&currentNextEnabled())&&nowq===oldq));
 const wrong=r==='wrong'&&(data.text!==c.fb.text||data.cls!==c.fb.cls||c.isCheck);
 const changed=nowq!==oldq;
 if(right||wrong||changed){const sk=c.question+'|'+c.title+'|'+(read('counter')?.textContent||'');if((right||changed)&&successSeen.has(sk))return; c.recorded=true;if(right||changed)successSeen.add(sk);emit('attempt',{question:oldq,title:c.title,answer:c.answer,feedback:data.text,correct:!!(right||changed)});if(right||changed){lastQ=nowq;previousTitle=title()}}
}
const helpIds=/^(helpBtn|help|hint|hintBtn|btnHint|btnInfo)$/i;
const checkIds=/^(check|checkBtn|actionBtn|btnCheck)$/i;
const skipIds=/^(next|nextBtn|mainNext|start|startBtn|closeBtn|modalClose|full|fullBtn|fullscreen|soundBtn|sound|btnQuestion|reset|btnReset|toastOK|popupClose)$/i;
document.addEventListener('click',e=>{const t=e.target.closest?.('button,[role="button"],.option,.choice,.chip,.reactionCard,.vessel,.card,.saltBottle,.molecule')||e.target;
 const id=String(t.id||'');const txt=(t.textContent||'').trim().toLowerCase();
 if(helpIds.test(id)||(/подсказк/.test(txt)&&t.tagName==='BUTTON')){if(!window.__CHEM_NATIVE_TRACKING__)emit('hint');return}
 if(skipIds.test(id)||/^(дальше|далее|сброс|заново|начать|понятно)$/i.test(txt))return;
 // 12-й отсек содержит точные события в родной логике; не дублируем.
 if(window.__CHEM_NATIVE_TRACKING__)return;
 const isCheck=checkIds.test(id)||/проверить/i.test(txt);if(pending)pending.cancelled=true;
 const c={question:q(),title:title(),answer:sourceAnswer(t,isCheck),fb:feedback(),nextWasEnabled:currentNextEnabled(),isCheck,recorded:false,cancelled:false};pending=c;
 setTimeout(()=>sample(c),0);setTimeout(()=>sample(c),150);setTimeout(()=>sample(c),550);setTimeout(()=>sample(c),1100);
},true);
// Служебные отметки завершения: не подменяют реальные ответы ученика.
const watch=new MutationObserver(()=>{if(doneOnce)return;const counter=counterIds.map(x=>read(x)?.textContent||'').join(' ').toLowerCase();const s=counter+' '+(read('prompt')?.textContent||'').toLowerCase();if(/отсек.*(?:восстановлен|стабилизирован|пройден)|лаборатория спасена/.test(s)&&!/[0-9]+\s*из\s*[0-9]+/.test(s))window.labTelemetry.complete();});
const obs=[...counterIds,...textIds].map(read).filter(Boolean);
for(const o of obs)watch.observe(o,{childList:true,characterData:true,subtree:true});
})();
