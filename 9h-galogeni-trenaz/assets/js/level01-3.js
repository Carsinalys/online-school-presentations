
/* Единая фирменная подпись: логотип поверх фона, ссылка на действующий домен. */
(function(){
function addBrand(){
  var host=document.querySelector('.game-stage')||document.querySelector('.stage')||document.querySelector('#game')||document.querySelector('main');
  if(!host||host.querySelector('.mir-brand'))return;
  var mark=document.createElement('div');mark.className='mir-brand';
  var emblem=document.createElement('img');emblem.alt='М.И.Р. — образовательный проект';
  emblem.src="../assets/media/element-24c7e08df47887.png";
  var portal=document.createElement('a');portal.href='https://portalmir.by/';portal.target='_blank';
  portal.rel='noopener noreferrer';portal.textContent='portalmir.by';portal.title='Открыть образовательный портал М.И.Р.';
  mark.append(emblem,portal);host.append(mark);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addBrand,{once:true});else addBrand();
})();
