
(()=>{const C=window.ChemGameReport,files=Array.from({length:12},(_,i)=>'levels/'+String(i+1).padStart(2,'0')+'.html');let level=1;
const $=id=>document.getElementById(id),menu=$('menu'),viewer=$('viewer');const selectLevel=n=>{level=Math.min(12,Math.max(1,Number(n)||1));menu.style.display='none';viewer.classList.add('active');viewer.classList.remove('report');viewer.dataset.level=String(level);$('frame').srcdoc='';$('frame').src=files[level-1];$('reportFrame').style.display='none';$('sectorTitle').textContent='ОТСЕК '+level+' · '+C.TITLES[level];$('prev').disabled=level===1;$('next').disabled=level===12;$('next').textContent=level===12?'К результатам ›':'Следующий отсек ›';$('caption').textContent='Ответы и подсказки сохраняются в журнале. Для перехода используй верхние кнопки.';window.location.hash='level-'+level};
function gotoReport(){menu.style.display='none';viewer.classList.add('active','report');$('frame').srcdoc='';$('frame').src='about:blank';$('reportFrame').style.display='block';$('reportFrame').srcdoc='';$('reportFrame').src='results.html';$('sectorTitle').textContent='ЛАБОРАТОРИЯ СПАСЕНА · ИТОГИ И РЕФЛЕКСИЯ';$('prev').disabled=false;$('next').disabled=true;$('next').textContent='Результаты';$('caption').textContent='Отчёт сформирован из записанных ответов.';window.location.hash='results'}
function backMenu(){viewer.classList.remove('active','report');menu.style.display='flex';$('frame').srcdoc='';$('frame').src='about:blank';$('reportFrame').srcdoc='';$('reportFrame').src='about:blank';window.location.hash='';refreshMenu()}
function refreshMenu(){const d=C.load(),stored=(()=>{try{let s=JSON.parse(localStorage.getItem('galogeny_progress_v1')||'null');return Number(s?.lastSector)||1}catch(_){return 1}})();$('continue').textContent='▶ Продолжить с '+Math.max(stored,d.lastSector||1)+'-го отсека';const completed=new Set(d.events.filter(e=>e.type==='complete').map(e=>e.sector));$('sectors').replaceChildren(...files.map((_,i)=>{let n=i+1,b=document.createElement('button');b.className='sector'+(completed.has(n)?' done':'');b.innerHTML='<b>'+n+'</b>'+C.TITLES[n];b.onclick=()=>selectLevel(n);return b}))}
$('start').onclick=()=>selectLevel(1);$('continue').onclick=()=>{const d=C.load();let x=1;try{x=+JSON.parse(localStorage.getItem('galogeny_progress_v1')||'null')?.lastSector||1}catch(_){}selectLevel(Math.max(x,d.lastSector||1))};$('results').onclick=gotoReport;$('back').onclick=backMenu;$('prev').onclick=()=>selectLevel(level-1);$('next').onclick=()=>{if(viewer.classList.contains('report'))return;if(level===12)gotoReport();else selectLevel(level+1)};$('showReport').onclick=gotoReport;
$('reportFrame').addEventListener('load',()=>{try{$('reportFrame').contentWindow.postMessage({source:'chem-parent',action:'snapshot',data:C.load(),progress:localStorage.getItem('galogeny_progress_v1')},'*')}catch(_){}});
window.addEventListener('message',e=>{
 if(e.data?.source==='chem-tracker-ui'&&e.data.action==='results'&&level===12){setTimeout(gotoReport,900)}
 else if(e.data?.source==='chem-tracker'&&e.data.event?.type==='complete'){refreshMenu()}
 else if(e.data?.source==='chem-tracker-ui'&&e.source===$('reportFrame').contentWindow){
  if(e.data.action==='updateReport'&&e.data.data){C.save(e.data.data)}
  else if(e.data.action==='retryLevel')selectLevel(e.data.level||1);
  else if(e.data.action==='goMenu')backMenu();
  else if(e.data.action==='resetReport'){C.reset();try{localStorage.removeItem('galogeny_progress_v1')}catch(_){}backMenu()}
 }
});
refreshMenu();const hash=location.hash;if(hash==='#results')gotoReport();else if(/^#level-\d+$/.test(hash))selectLevel(Number(hash.slice(7)));else {const param=new URLSearchParams(location.search).get('level');if(param)selectLevel(param)}
})();
