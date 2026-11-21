/* Unified adaptive mobile HUD; no changes to approved question logic. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id), frame=$('frame'), viewer=$('viewer');
 const phone=()=>matchMedia('(max-width:700px) and (orientation:portrait)').matches;
 const landscape=()=>matchMedia('(max-width:1024px) and (orientation:landscape) and (max-height:650px)').matches;
 const ids=[
   {dan:['#dangerText','#dangerValue','#danger','#dangerNumber','.danger .num','.danger strong'],rec:['#restoreText','#recoveryValue','#repairText','#recoveryText','#repair','#restore','.restore strong','.recovery .num','.repair strong']},
 ];
 function getN(){return +(location.hash.match(/level-(\d+)/)||[])[1]||0}
 function textFor(doc,selectors){for(const q of selectors){const el=doc.querySelector(q);if(el){const raw=(el.textContent||'').trim();const m=raw.match(/\d{1,3}\s*%/);if(m)return m[0].replace(/\s+/g,'')}}return '—'}
 function renderHud(){
  const n=getN();if(!phone()||!n||viewer.classList.contains('report'))return;
  let d;try{d=frame.contentDocument}catch(e){}
  if(!d?.body)return;
  const danger=textFor(d,['#dangerText','#dangerValue','#danger','#dangerNum','.danger .num','.danger strong','.danger .meter-value','.counter.danger .num']);
  const recovery=textFor(d,['#restoreText','#recoveryValue','#recoveryText','#repairText','#repair','#restore','#repairValue','#restoreValue','#recovery','.restore strong','.recovery .num','.repair strong','.counter.recovery .num']);
  $('phoneDanger').textContent=danger;
  $('phoneRecovery').textContent=recovery;
 }
 function setIframeMode(){
  const n=getN(),isPhone=phone();
  try{const d=frame.contentDocument;if(d?.documentElement){d.documentElement.classList.toggle('mir-embedded-mobile',isPhone);
   if(isPhone){
    d.addEventListener('click',function(e){const hit=e.target.closest('#fullBtn,#fullscreen');if(hit){e.preventDefault();e.stopImmediatePropagation();window.parent.postMessage({source:'mir-mobile',action:'fullscreen'},'*')}} ,true);
   }
  }}catch(_){}
  if(!isPhone||![1,11,12].includes(n)){frame.style.removeProperty('height');frame.style.removeProperty('aspect-ratio');}
  updateLandscape();refreshHeight();renderHud();
 }
 function updateLandscape(){
  const area=document.querySelector('.playarea');
  if(!area)return;
  if(!landscape()){
   frame.style.removeProperty('--mir-landscape-scale');frame.style.removeProperty('left');return;
  }
  const w=1280;
  let h=720;
  try{const d=frame.contentDocument;if(d?.body){h=Math.max(h,d.documentElement.scrollHeight,d.body.scrollHeight);h=Math.min(h,1500)}}catch(_){}
  const ar=area.getBoundingClientRect();
  if(ar.width<20||ar.height<20)return;
  const scale=Math.min((ar.width-12)/w,(ar.height-7)/h);
  if(!(scale>0))return;
  frame.style.setProperty('--mir-landscape-scale',String(scale));
  frame.style.setProperty('height',h+'px','important');
  frame.style.setProperty('left',Math.max(0,Math.round((ar.width-w*scale)/2))+'px','important');
 }
 function refreshHeight(){const n=getN();if(!phone()||![1,11,12].includes(n))return;
  try{const d=frame.contentDocument;if(!d?.body)return;
   const stage=d.querySelector('.game-stage,.stage');
   if(!stage)return;
   const r=stage.getBoundingClientRect();
   const h=Math.max(stage.scrollHeight,r.height,stage.offsetHeight,d.body.scrollHeight,180);
   const target=Math.min(2600,Math.ceil(h+5));
   const old=parseInt(frame.style.height||0);
   if(Math.abs(old-target)>3){frame.style.setProperty('height',target+'px','important');frame.style.setProperty('aspect-ratio','auto','important')}
  }catch(_){}
 }
 const notice=$('fullNotice');
 function fullscreen(){
  if(document.fullscreenElement){document.exitFullscreen?.();notice.hidden=true;return}
  const target=viewer;
  if(!target.requestFullscreen){notice.hidden=false;return}
  try{const p=target.requestFullscreen();
   if(p&&typeof p.catch==='function')p.catch(()=>{notice.hidden=false});
   else notice.hidden=true;
  }catch(e){notice.hidden=false}
 }
 function doInner(selectors){try{const d=frame.contentDocument;for(const s of selectors){const b=d?.querySelector(s);if(b){b.click();return true}}}catch(_){}return false}
 $('phoneHelp').onclick=()=>{if(!doInner(['#helpBtn','#hintBtn','#help','#hint','#helpButton'])){
  const a=$('mobileHint');a?.click();}}
 $('phoneSound').onclick=()=>{if(!doInner(['#soundBtn','#sound','#audioBtn','#soundButton']))$('phoneSound').title='Звук в этом отсеке не предусмотрен'};
 $('phoneFull').onclick=fullscreen;
 $('noticeClose').onclick=()=>{notice.hidden=true};
 const f=$('fullGame');if(f)f.onclick=fullscreen;
 frame.addEventListener('load',()=>{setIframeMode();setTimeout(setIframeMode,150);setTimeout(setIframeMode,550)});
 window.addEventListener('message',e=>{if(e.data?.source==='mir-mobile'&&e.data.action==='fullscreen')fullscreen()});
 window.addEventListener('resize',setIframeMode);
 window.addEventListener('orientationchange',setIframeMode);
 let prevN=0;setInterval(()=>{const n=getN();if(n!==prevN){prevN=n;setIframeMode()}renderHud();refreshHeight();updateLandscape()},550);
})();