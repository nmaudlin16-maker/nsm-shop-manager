/* Reordering uses the existing materials array, JSON backups, and sync path. */
'use strict';
const materialOrderList=$('materialsList');
const materialOrderHelp=document.createElement('p');materialOrderHelp.className='hint';
materialOrderHelp.textContent='Press and hold a material card, then drag to rearrange it. Swipe normally to scroll. You can also use Move up / Move down, or focus Reorder and press the arrow keys, Home, or End.';
const materialOrderStatus=document.createElement('p');materialOrderStatus.id='materialOrderStatus';materialOrderStatus.className='hint';materialOrderStatus.setAttribute('role','status');materialOrderStatus.setAttribute('aria-live','polite');
materialOrderList.before(materialOrderHelp,materialOrderStatus);
const materialOrderStyle=document.createElement('style');materialOrderStyle.textContent=`
.material-order-controls{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;align-items:center}
.material-order-controls button{min-height:44px}.material-drag-handle{cursor:grab;user-select:none;-webkit-user-select:none}
.material-drag-handle:active{cursor:grabbing}.material-order-dragging{opacity:.65;outline:2px solid #52dfff;box-shadow:0 0 16px #00bfff66;user-select:none;-webkit-user-select:none;cursor:grabbing}
#materialsList>.item{-webkit-touch-callout:none}
#materialsList a,#materialsList button{-webkit-touch-callout:default}
.material-order-controls button:focus-visible{outline:2px solid #ff9845;outline-offset:3px}
`;document.head.append(materialOrderStyle);
let materialOrderDrag=null,materialOrderHold=null;
function materialOrderCards(){return [...materialOrderList.children].filter(el=>el.dataset.materialId)}
function materialOrderFocus(id,reveal=false){const handle=materialOrderCards().find(el=>el.dataset.materialId===id)?.querySelector('.material-drag-handle');if(handle){handle.focus({preventScroll:true});if(reveal)handle.scrollIntoView({block:'center'})}}
function moveMaterial(id,to,reveal=false){
 const previous=state.materials,from=previous.findIndex(m=>m.id===id);
 if(!opened||from<0||!Number.isInteger(to)||to<0||to>=previous.length||from===to)return false;
 const next=previous.slice(),[m]=next.splice(from,1);next.splice(to,0,m);
 try{backupBeforeChange();state.materials=next;save();materialOrderStatus.textContent=`${m.name} moved to position ${to+1} of ${next.length}. Order saved.`;materialOrderFocus(id,reveal);return true}
 catch(err){state.materials=previous;render();materialOrderStatus.textContent='Material order was not saved. '+err.message;return false}
}
function endMaterialOrderDrag(commit){
 const drag=materialOrderDrag;if(!drag)return;materialOrderDrag=null;cancelAnimationFrame(drag.frame);
 if(drag.pointerId!==null&&materialOrderList.hasPointerCapture(drag.pointerId))materialOrderList.releasePointerCapture(drag.pointerId);
 drag.card.classList.remove('material-order-dragging');
 const to=materialOrderCards().findIndex(el=>el.dataset.materialId===drag.id);
 if(commit&&drag.moved&&to!==drag.from){moveMaterial(drag.id,to)}
 else{const cards=materialOrderCards(),original=state.materials.map(m=>cards.find(el=>el.dataset.materialId===m.id)).filter(Boolean);materialOrderList.append(...original);if(!commit)materialOrderStatus.textContent='Reordering cancelled.';materialOrderFocus(drag.id)}
}
function placeDraggedMaterial(){
 const drag=materialOrderDrag;if(!drag||!drag.moved)return;
 const other=materialOrderCards().filter(el=>el!==drag.card);
 const before=other.find(el=>{const rect=el.getBoundingClientRect();return drag.y<rect.top+rect.height/2});
 materialOrderList.insertBefore(drag.card,before||null);
}
function scrollMaterialOrderDrag(){
 const drag=materialOrderDrag;if(!drag)return;
 if(drag.moved){const edge=72,step=drag.y<edge?-Math.min(18,(edge-drag.y)/3):drag.y>innerHeight-edge?Math.min(18,(drag.y-innerHeight+edge)/3):0;
 if(step){window.scrollBy(0,step);placeDraggedMaterial()}}
 drag.frame=requestAnimationFrame(scrollMaterialOrderDrag);
}
function cancelMaterialHold(){if(materialOrderHold){clearTimeout(materialOrderHold.timer);materialOrderHold=null}}
function materialHoldCard(target){const card=target.closest('[data-material-id]');if(!card||!materialOrderList.contains(card))return null;if(target.closest('button,a,input,select,textarea,label')&&!target.closest('.material-drag-handle'))return null;return card}
function beginMaterialHold(card,x,y,pointerId,touchId=null){
 if(!card||!opened||materialOrderDrag)return;cancelMaterialHold();
 const hold={card,x,y,pointerId,touchId,timer:0};materialOrderHold=hold;
 hold.timer=setTimeout(()=>{
 if(materialOrderHold!==hold||!card.isConnected)return;materialOrderHold=null;
 const id=card.dataset.materialId,from=state.materials.findIndex(m=>m.id===id);if(from<0)return;
 materialOrderDrag={id,from,card,pointerId,touchId,startY:y,y,moved:false,frame:0};
 if(pointerId!==null)materialOrderList.setPointerCapture(pointerId);
 window.getSelection()?.removeAllRanges();card.classList.add('material-order-dragging');
 materialOrderStatus.textContent='Moving '+state.materials[from].name+'. Drag to a new position, then release to save.';
 materialOrderDrag.frame=requestAnimationFrame(scrollMaterialOrderDrag);
 },350);
}
materialOrderList.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'&&e.isPrimary&&e.button===0)beginMaterialHold(materialHoldCard(e.target),e.clientX,e.clientY,e.pointerId)});
materialOrderList.addEventListener('pointermove',e=>{
 if(e.pointerType==='touch')return;
 if(materialOrderHold&&Math.hypot(e.clientX-materialOrderHold.x,e.clientY-materialOrderHold.y)>8)cancelMaterialHold();
 const drag=materialOrderDrag;if(!drag||drag.pointerId!==e.pointerId)return;e.preventDefault();drag.y=e.clientY;
 if(!drag.moved&&Math.abs(drag.y-drag.startY)>6){drag.moved=true;drag.card.classList.add('material-order-dragging')}
 placeDraggedMaterial();
});
materialOrderList.addEventListener('pointerup',e=>{if(e.pointerType==='touch')return;cancelMaterialHold();if(materialOrderDrag?.pointerId===e.pointerId)endMaterialOrderDrag(true)});
materialOrderList.addEventListener('pointercancel',e=>{if(e.pointerType==='touch')return;cancelMaterialHold();if(materialOrderDrag?.pointerId===e.pointerId)endMaterialOrderDrag(false)});
materialOrderList.addEventListener('lostpointercapture',e=>{if(materialOrderDrag?.pointerId===e.pointerId)endMaterialOrderDrag(false)});
materialOrderList.addEventListener('touchstart',e=>{if(e.touches.length!==1){cancelMaterialHold();endMaterialOrderDrag(false);return}const t=e.touches[0];beginMaterialHold(materialHoldCard(e.target),t.clientX,t.clientY,null,t.identifier)},{passive:true});
materialOrderList.addEventListener('touchmove',e=>{
 const drag=materialOrderDrag,t=[...e.touches].find(t=>t.identifier===(drag?.touchId??materialOrderHold?.touchId));if(!t)return;
 if(!drag){if(materialOrderHold&&Math.hypot(t.clientX-materialOrderHold.x,t.clientY-materialOrderHold.y)>8)cancelMaterialHold();return}
 if(drag.pointerId!==null)return;if(e.cancelable)e.preventDefault();drag.y=t.clientY;
 if(Math.abs(t.clientY-drag.startY)>6)drag.moved=true;placeDraggedMaterial();
},{passive:false});
materialOrderList.addEventListener('touchend',e=>{cancelMaterialHold();if(materialOrderDrag?.pointerId===null&&![...e.touches].some(t=>t.identifier===materialOrderDrag.touchId))endMaterialOrderDrag(true)});
materialOrderList.addEventListener('touchcancel',()=>{cancelMaterialHold();if(materialOrderDrag?.pointerId===null)endMaterialOrderDrag(false)});
materialOrderList.addEventListener('contextmenu',e=>{if(materialOrderHold||materialOrderDrag)e.preventDefault()});
document.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')cancelMaterialHold()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){cancelMaterialHold();if(materialOrderDrag){e.preventDefault();endMaterialOrderDrag(false)}}});
window.addEventListener('blur',()=>{cancelMaterialHold();endMaterialOrderDrag(false)});
const renderBeforeMaterialOrder=render;render=function(){
 // A timer tick or incoming state refresh safely cancels an unfinished gesture.
 cancelMaterialHold();if(materialOrderDrag)endMaterialOrderDrag(false);
 renderBeforeMaterialOrder();
 const cards=[...materialOrderList.children].filter(el=>el.classList.contains('item'));
 cards.forEach((card,index)=>{const material=state.materials[index];if(!material)return;card.dataset.materialId=material.id;
 const controls=document.createElement('div');controls.className='material-order-controls';
 const handle=document.createElement('button');handle.type='button';handle.className='alt material-drag-handle';handle.textContent='↕ Reorder';handle.setAttribute('aria-label','Reorder '+material.name);handle.setAttribute('aria-keyshortcuts','ArrowUp ArrowDown Home End');
 handle.onkeydown=e=>{const current=state.materials.findIndex(m=>m.id===material.id),to={ArrowUp:current-1,ArrowDown:current+1,Home:0,End:state.materials.length-1}[e.key];if(to!==undefined){e.preventDefault();moveMaterial(material.id,to,true)}};
 const up=document.createElement('button');up.type='button';up.className='alt';up.textContent='↑ Move up';up.setAttribute('aria-label','Move '+material.name+' up');up.disabled=index===0;up.onclick=()=>moveMaterial(material.id,state.materials.findIndex(m=>m.id===material.id)-1,true);
 const down=document.createElement('button');down.type='button';down.className='alt';down.textContent='↓ Move down';down.setAttribute('aria-label','Move '+material.name+' down');down.disabled=index===state.materials.length-1;down.onclick=()=>moveMaterial(material.id,state.materials.findIndex(m=>m.id===material.id)+1,true);
 controls.append(handle,up,down);card.prepend(controls);
 });
};
render();
