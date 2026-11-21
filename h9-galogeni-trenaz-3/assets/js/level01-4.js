
(function(){
function removeDuplicateTransition(){
 const nodes=document.querySelectorAll('button,a');
 nodes.forEach(el=>{
   const label=(el.textContent||'').trim().replace(/\s+/g,' ').toLowerCase();
   if(!/(следующий отсек|следующий уровень|перейти в следующий отсек)/i.test(label))return;
   if(el.closest('.mir-brand'))return;
   const holder=el.closest('.bottom,.bottom-nav,.bottomBar,.footer,.controls,.actions');
   if(holder)el.style.display='none';
 });
}
new MutationObserver(removeDuplicateTransition).observe(document.body,{childList:true,subtree:true,characterData:true});
removeDuplicateTransition();
})();
