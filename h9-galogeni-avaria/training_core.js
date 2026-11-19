/* Единый журнал обучения, без внешних серверов. */
(function(){
  'use strict';
  const K='chem_lab_learning_log_v1';
  const TOPICS={1:'Физические свойства галогенов',2:'Безопасность в лаборатории',3:'Электроотрицательность галогенов',4:'Химическая связь',5:'Соляная кислота и её растворы',6:'Металлы и кислоты',7:'Реакции кислот с оксидами, основаниями и солями',8:'Хлориды и качественные реакции',9:'Вытеснение галогенов',10:'Окислители и восстановители',11:'Электронный баланс',12:'Химические свойства: итоговые задания'};
  const TITLES={1:'Физические свойства галогенов',2:'Токсичная зона',3:'Электроотрицательность',4:'Химическая связь',5:'Кислотная утечка',6:'Металлический реактор',7:'Реакционный блок',8:'Солевой шлюз',9:'Галогенный распределитель',10:'Разрушенная диспетчерская',11:'Электронный баланс',12:'Центральный реактор'};
  function empty(){return {version:1,startedAt:null,endedAt:null,events:[],reflections:{},practice:[],lastSector:1}};
  function load(){try{const a=JSON.parse(localStorage.getItem(K));return a&&Array.isArray(a.events)?a:empty()}catch(_){return empty()}}
  function save(x){try{localStorage.setItem(K,JSON.stringify(x));return true}catch(_){return false}}
  function event(ev){if(!ev||!Number.isFinite(+ev.sector)||!['attempt','hint','start','complete','practice'].includes(ev.type))return;
    const data=load(), eid=String(ev.id||'');if(eid&&data.events.some(x=>x.id===eid))return;
    const now=new Date().toISOString();if(!data.startedAt)data.startedAt=now;data.lastSector=Math.max(data.lastSector,Math.min(12,Number(ev.sector)));
    data.events.push({id:eid||`${Date.now()}-${Math.random()}`,at:ev.at||now,type:ev.type,sector:Number(ev.sector),question:Number(ev.question)||0,topic:String(ev.topic||TOPICS[ev.sector]||''),title:String(ev.title||''),answer:String(ev.answer||'').slice(0,250),feedback:String(ev.feedback||'').slice(0,450),correct:ev.correct===true,step:String(ev.step||'').slice(0,50)});
    if(data.events.length>6000)data.events=data.events.slice(-6000);
    if(ev.type==='complete'&&Number(ev.sector)===12)data.endedAt=now;
    save(data);
  }
  window.ChemGameReport={KEY:K,TOPICS,TITLES,load,save,event,reset(){save(empty())},applyMessage(data){if(data?.source==='chem-tracker'&&data.event)event(data.event)}};
  window.addEventListener('message',e=>{if(e.data?.source==='chem-tracker'&&e.data.event)event(e.data.event)});
})();
