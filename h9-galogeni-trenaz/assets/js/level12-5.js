
(function(){
window.addEventListener('DOMContentLoaded',function(){
  const next=document.getElementById('next');
  if(!next)return;
  const watch=new MutationObserver(()=>{
    const stage=document.getElementById('stage');
    if(!stage?.classList.contains('won'))return;
    const mod=document.querySelector('#modal .modalBox')||document.getElementById('modal');
    if(mod&&!document.getElementById('mirReportBtn')){
       const btn=document.createElement('a');btn.id='mirReportBtn';btn.href='#results';
       btn.textContent='📋 Посмотреть итоговый отчёт';btn.style.cssText='display:inline-block;margin:12px auto;padding:11px 15px;border-radius:9px;border:2px solid #74e9bb;color:#f4fffb;background:#145640;font:bold 17px Arial,sans-serif;text-decoration:none;';
       mod.append(btn);
    }
    watch.disconnect();
  });
  watch.observe(document.getElementById('stage'),{attributes:true,attributeFilter:['class']});
});
})();
