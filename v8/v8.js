/* V8 additive upgrade. Existing JSON fields and cloud revision handling are retained. */
'use strict';
const v8Style=document.createElement('style');v8Style.textContent=`
.v8-picker{position:relative;margin:4px 0 12px}.v8-picker button{width:100%;text-align:left;white-space:normal;min-height:44px}
dialog{color:#edf1f7;background:#101923;border:1px solid #55c4b6;border-radius:10px;width:min(95vw,600px);max-height:85dvh;padding:18px}dialog::backdrop{background:#000b}
#v8Choices{overflow:auto;max-height:52dvh;display:grid;gap:6px;margin-top:12px}#v8Choices button{text-align:left;min-height:48px}
#v8Picker[open]{display:flex;flex-direction:column;overflow:hidden;max-height:min(85dvh,85svh)}
#v8Picker>h2,#v8Picker>label,#v8Search,#v8ChoiceStatus,#v8PickerClose{flex-shrink:0}
#v8Choices{display:flex;flex-direction:column;flex:0 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch}
#v8Choices button{flex:0 0 auto;width:100%;white-space:normal;overflow-wrap:anywhere}
#v8Picker[data-kind="customers"]{width:min(92vw,460px);padding:14px}
#v8Picker[data-kind="customers"] h2{font-size:16px;line-height:1.3;margin-bottom:10px;letter-spacing:.02em}
#v8Picker[data-kind="customers"] #v8Choices{max-height:40dvh;gap:4px;margin-top:8px}
#v8Picker[data-kind="customers"] #v8Choices button{min-height:40px;padding:8px 10px;font-size:14px;line-height:1.35;border-radius:5px;background:#172b3b;border-color:#365a70;color:#edf1f7;font-weight:500}
#v8Picker[data-kind="customers"] #v8Search{min-height:42px;padding:8px 10px;font-size:16px}
#v8Picker[data-kind="customers"] #v8ChoiceStatus{font-size:12px;margin:8px 0}
#v8PickerClose{align-self:flex-start;margin-top:4px}
#v8Summary{margin:12px 0}#v8NewOrder{margin:10px 0}.v8-history{white-space:pre-wrap}nav{scrollbar-width:thin}
`;document.head.append(v8Style);
function v8Field(id,label,type='text',value=''){const d=document.createElement('div');d.className='field';d.innerHTML=`<label for="${id}">${label}</label><input id="${id}" type="${type}" value="${safe(value)}">`;return d}
function v8Select(id,label,options){const d=document.createElement('div');d.className='field';d.innerHTML=`<label for="${id}">${label}</label><select id="${id}">${options.map(x=>`<option>${safe(x)}</option>`).join('')}</select>`;return d}
const kinds=['Sale','Donation','Giveaway','Prototype'];
const projectsScreen=document.createElement('div');projectsScreen.id='non-sale-projects';projectsScreen.className='tab hidden';$('appShell').append(projectsScreen);
const projectsNav=document.createElement('button');projectsNav.type='button';projectsNav.dataset.tab=projectsScreen.id;projectsNav.textContent='Special Projects';document.querySelector('nav button[data-tab="settings"]').before(projectsNav);
document.querySelectorAll('.notice').forEach(el=>{if(el.textContent.includes('Customer-to-order linking is still a later step'))el.textContent='V8: customers link to new orders. Export a JSON backup before switching devices or importing a replacement shop.'});
const v8Validate=validate;validate=function(data){v8Validate(data);for(const o of data.orders){if(o.kind!==undefined&&!kinds.includes(o.kind))throw Error('Invalid order purpose.');if(o.laborEntries!==undefined&&(!Array.isArray(o.laborEntries)||o.laborEntries.some(x=>!x||!Number.isFinite(Number(x.hours))||Number(x.hours)<0)))throw Error('Invalid labor entries.');}if(data.activeTimer&&(!data.orders.some(o=>o.id===data.activeTimer.id)||!Number.isFinite(data.activeTimer.start)||data.activeTimer.start<0||data.activeTimer.start>Date.now()+60000))throw Error('Invalid active timer.');return data;};
const newSection=$('orderForm').closest('section'),editSection=$('orderTools');
const newScreen=document.createElement('div');newScreen.id='new-order';newScreen.className='tab hidden';$('appShell').append(newScreen);newScreen.append(newSection);
const editScreen=document.createElement('div');editScreen.id='edit-order';editScreen.className='tab hidden';$('appShell').append(editScreen);editScreen.append(editSection);
const newButton=document.createElement('button');newButton.id='v8NewOrder';newButton.textContent='+ New order';newButton.onclick=()=>tab('new-order');$('orders').prepend(newButton);
const cancelNew=document.createElement('button');cancelNew.type='button';cancelNew.className='alt';cancelNew.textContent='Back to orders';cancelNew.onclick=()=>tab('orders');$('orderForm').append(cancelNew);
$('orderForm').querySelector('.grid').append(v8Select('v8Kind','Order purpose',kinds),v8Field('v8InitialHours','Work hours already spent','number','0'));
$('v8InitialHours').min='0';$('v8InitialHours').step='any';
const customerSelect=v8Select('v8Customer','Saved customer (optional)',['Choose saved customer']);$('ocustomer').parentElement.before(customerSelect);
$('v8Customer').onchange=()=>{const c=(state.customers||[]).find(x=>x.id===$('v8Customer').value);if(c)$('ocustomer').value=c.name};
$('ocustomer').addEventListener('input',()=>{$('v8Customer').value=''});
$('v8Kind').onchange=()=>{if($('v8Kind').value!=='Sale'){$('oprice').value='0';$('opaid').value='0';$('oshipcharged').value='0'}};
const v8DefaultPrice=setDefaultPrice;setDefaultPrice=function(){v8DefaultPrice();if($('v8Kind').value!=='Sale')$('oprice').value='0'};$('oproduct').onchange=setDefaultPrice;$('oqty').oninput=setDefaultPrice;
const editGrid=$('orderEditFields').querySelector('.grid');
editGrid.prepend(v8Field('v8EditCustomer','Customer name'),v8Field('v8EditProduct','Product description'),v8Field('v8EditQty','Quantity','number','1'),v8Select('v8EditKind','Order purpose',kinds),v8Select('v8EditStatus','Order status',STANDARD_STATUSES),v8Field('v8EditRate','Hourly labor rate','number','0'),v8Field('v8EditHours','Total recorded hours (change to correct a mistake)','number','0'));
$('v8EditHours').min='0';$('v8EditHours').step='any';$('v8EditHours').required=true;
$('v8EditQty').min='1';$('v8EditQty').step='1';$('v8EditRate').min='0';$('v8EditRate').step='0.01';
const laborHistory=document.createElement('div');laborHistory.id='v8LaborHistory';$('orderToolsForm').append(laborHistory);
const v8OpenTools=openOrderTools;openOrderTools=function(id,mode){tab('edit-order');v8OpenTools(id,mode);const o=state.orders.find(x=>x.id===id);if(!o)return;
for(const [key,value] of Object.entries({Customer:o.customer,Product:o.product,Qty:o.qty||1,Kind:o.kind||'Sale',Status:o.status,Rate:o.rate??state.rate,Hours:o.hours||0})){$('v8Edit'+key).value=value;$('v8Edit'+key).disabled=mode!=='edit'||(key==='Hours'&&timer?.id===id)}
const entries=o.laborEntries||[];$('v8LaborHistory').innerHTML=`<h3>Recorded labor: ${Number(o.hours||0).toFixed(2)} hours · ${money(laborPay(o))}</h3><p class="hint">${timer?.id===id?'Stop this order’s timer before correcting total hours. ':''}${entries.length?'Work entries (historical; corrections below adjust the total):':'Earlier hours remain included in the total.'}</p>`+entries.map(x=>`<p>${safe(x.at)} · ${Number(x.hours).toFixed(2)} hours · ${safe(x.source)}</p>`).join('')+(o.laborCorrections||[]).map(x=>`<p>${safe(x.at)} · Hours corrected: ${Number(x.from).toFixed(2)} → ${Number(x.to).toFixed(2)}</p>`).join('');};
$('cancelOrderTools').onclick=()=>{draftForms.delete('orderToolsForm');draft=draftForms.size>0;tab('orders')};
const v8Submit=$('orderForm').onsubmit;
$('orderForm').onsubmit=e=>{const name=$('ocustomer').value.trim();if(!name){e.preventDefault();return alert('Enter a customer or project name.')}
const hours=n('v8InitialHours'),kind=$('v8Kind').value,selected=$('v8Customer').value;
// Extend the record before the existing atomic validation/save path.
const previousSave=save;save=function(){const o=state.orders[0];o.kind=kind;o.hours=hours;o.createdAt=new Date().toISOString();
state.customers??=[];let c=state.customers.find(x=>x.id===selected)||state.customers.find(x=>x.name.trim().toLowerCase()===name.toLowerCase());
if(!c){c={id:uid(),name,phone:'',email:'',notes:''};state.customers.push(c)}o.customerId=c.id;
if(hours)o.laborEntries=[{at:new Date().toISOString(),hours,source:'Initial work'}];return previousSave()};
try{v8Submit(e);if(state.orders[0]?.createdAt){draftForms.delete('orderForm');draft=draftForms.size>0;tab('orders')}}finally{save=previousSave}};
const v8EditSubmit=$('orderToolsForm').onsubmit;
$('orderToolsForm').onsubmit=e=>{const o=state.orders.find(x=>x.id===$('orderToolsId').value);if(!o)return v8EditSubmit(e);const previousSave=save;
save=function(){const updated=state.orders.find(x=>x.id===o.id);if(orderToolsMode==='edit'){
if(!$('v8EditCustomer').value.trim()||!$('v8EditProduct').value.trim())throw Error('Customer and product are required.');
updated.customer=$('v8EditCustomer').value.trim();updated.product=$('v8EditProduct').value.trim();updated.qty=Math.max(1,Math.floor(n('v8EditQty')));updated.kind=$('v8EditKind').value;updated.status=$('v8EditStatus').value;updated.rate=n('v8EditRate');
if(!$('v8EditHours').disabled){const raw=$('v8EditHours').value,hours=Number(raw);if(!raw.trim()||!Number.isFinite(hours)||hours<0)throw Error('Enter total hours of zero or greater.');if(hours!==Number(o.hours||0)){if(timer?.id===o.id)throw Error('Stop the timer before correcting hours.');updated.hours=hours;updated.laborCorrections=[...(o.laborCorrections||[]),{at:new Date().toISOString(),from:Number(o.hours||0),to:hours}]}}
if(updated.customer!==o.customer)delete updated.customerId;
}else{updated.laborEntries=[...(o.laborEntries||[]),{at:new Date().toISOString(),hours:n('orderHoursToAdd'),source:'Manual hours'}]}
return previousSave()};try{v8EditSubmit(e);if($('orderTools').classList.contains('hidden')){draftForms.delete('orderToolsForm');draft=draftForms.size>0;tab('orders')}}finally{save=previousSave}};
// Durable local timer checkpoint; JSON exports include the active timer for recovery.
const v8Toggle=toggleTimer;toggleTimer=function(id){if(timer){const o=state.orders.find(x=>x.id===id);if(o&&timer.id===id){const elapsed=(Date.now()-timer.start)/3600000;o.laborEntries=[...(o.laborEntries||[]),{at:new Date().toISOString(),hours:elapsed,source:'Timer'}];delete state.activeTimer}}
v8Toggle(id);if(timer){state.activeTimer={...timer};save()}};
const v8Render=render;render=function(){v8Render();
if(!timer&&state.activeTimer&&state.orders.some(o=>o.id===state.activeTimer.id))timer={...state.activeTimer};
const selected=$('v8Customer').value;$('v8Customer').innerHTML='<option value="">Choose saved customer</option>'+(state.customers||[]).map(c=>`<option value="${safe(c.id)}">${safe(c.name)}</option>`).join('');$('v8Customer').value=selected;
const nonSales=state.orders.filter(o=>!isSaleOrder(o));let summary=$('v8Summary');if(!summary){summary=document.createElement('section');summary.id='v8Summary';projectsScreen.append(summary)}
summary.innerHTML='<h2>Donations, giveaways & prototypes</h2>'+kinds.slice(1).map(k=>{const rows=nonSales.filter(o=>o.kind===k),totals=orderTotals(rows);return `<div class="project-summary-group"><h3>${k}</h3><div class="grid project-stats">
<div class="stat"><small>Projects</small><strong>${totals.count}</strong></div>
<div class="stat"><small>Materials</small><strong>${money(totals.materials)}</strong></div>
<div class="stat"><small>Labor value</small><strong>${money(totals.labor)}</strong></div>
<div class="stat"><small>Retail value</small><strong>${money(totals.retail)}</strong></div>
<div class="stat"><small>Total cost, including labor</small><strong>${money(productionCost(totals))}</strong></div>
</div></div>`}).join('');
[...$('ordersList').children].forEach((item,i)=>{const o=state.orders[i];if(o?.kind){const badge=document.createElement('p');badge.className='chip';badge.textContent=o.kind;item.prepend(badge)}});
[...$('customerList').children].forEach((item,i)=>{const name=item.querySelector('strong')?.textContent;if(!name)return;const c=(state.customers||[]).find(c=>c.name===name);const orders=state.orders.filter(o=>o.customerId===c?.id||(!o.customerId&&o.customer?.trim().toLowerCase()===name.trim().toLowerCase()));const p=document.createElement('p');p.className='hint v8-history';p.textContent=`${orders.length} orders · purchases ${money(orders.filter(o=>!o.kind||o.kind==='Sale').reduce((s,o)=>s+Number(o.price||0)+Number(o.shippingCharged||0),0))}\n`+orders.map(o=>`${o.product} · ${o.status} · ${money(o.price)}`).join('\n');item.append(p)});
v8EnhanceSelects();};
$('customerSearch').oninput=()=>render();
$('customers').querySelector('p.hint').textContent='Customer profiles link to new orders and show order history and purchase totals. Older orders match by customer name.';
const picker=document.createElement('dialog');picker.id='v8Picker';picker.innerHTML='<h2 id="v8PickerTitle">Choose an option</h2><label for="v8Search">Search options</label><input id="v8Search" type="search" autocomplete="off"><div id="v8Choices"></div><p id="v8ChoiceStatus" role="status"></p><button type="button" id="v8PickerClose" class="alt">Cancel</button>';document.body.append(picker);
let v8Target=null;function v8Choices(){picker.dataset.kind=v8Target.id==='v8Customer'?'customers':'options';if(v8Target.id==='v8Customer'){const selected=v8Target.value;v8Target.innerHTML='<option value="">Choose saved customer</option>'+(state.customers||[]).map(c=>`<option value="${safe(c.id)}">${safe(c.name)}</option>`).join('');v8Target.value=selected}const query=$('v8Search').value.toLowerCase();$('v8Choices').replaceChildren();const options=[...v8Target.options].filter(o=>!o.disabled&&(v8Target.id!=='v8Customer'||o.value!=='')&&o.textContent.toLowerCase().includes(query));for(const option of options){const b=document.createElement('button');b.type='button';b.textContent=option.textContent;b.onclick=()=>{v8Target.value=option.value;v8Target.dispatchEvent(new Event('input',{bubbles:true}));v8Target.dispatchEvent(new Event('change',{bubbles:true}));picker.close();v8EnhanceSelects()};$('v8Choices').append(b)}$('v8ChoiceStatus').textContent=options.length+' options';}
$('v8Search').oninput=v8Choices;$('v8PickerClose').onclick=()=>picker.close();
function v8EnhanceSelects(){document.querySelectorAll('#appShell select:not(.status-select)').forEach(select=>{if(!select.nextElementSibling?.classList.contains('v8-picker')){const wrapper=document.createElement('div');wrapper.className='v8-picker';const button=document.createElement('button');button.type='button';button.className='alt';button.onclick=()=>{v8Target=select;$('v8PickerTitle').textContent=select.parentElement.querySelector('label')?.textContent||'Choose an option';$('v8Search').value='';v8Choices();picker.showModal();$('v8Search').focus()};wrapper.append(button);select.after(wrapper);select.style.display='none'}const button=select.nextElementSibling.firstChild;button.textContent=(select.selectedOptions[0]?.textContent||'Choose an option')+' ▾';button.disabled=select.disabled;button.setAttribute('aria-label',(select.parentElement.querySelector('label')?.textContent||'Choose')+': '+button.textContent)})}
const v8AddRecipe=addRecipeLine;addRecipeLine=function(...args){v8AddRecipe(...args);v8EnhanceSelects()};
// Search inputs are filters, never unsaved shop changes.
$('appShell').addEventListener('input',e=>{if(e.target.type==='search'){draftForms.delete(e.target.closest('form')?.id||'settings');draft=draftForms.size>0}});
let v8Current='dashboard',v8Leaving=false;const v8Tab=tab;
function v8Show(screen){v8Current=screen;v8Tab(screen);window.scrollTo(0,0)}
history.replaceState({nsmV8:true,guard:true},'');history.pushState({nsmV8:true,screen:'dashboard'},'');
function v8CurrentScreenHasDraft(){const current=$(v8Current);return !!current&&([...current.querySelectorAll('form')].some(form=>draftForms.has(form.id))||(v8Current==='settings'&&draftForms.has('settings')));}
tab=function(screen){if(screen===v8Current)return v8Show(screen);if(v8CurrentScreenHasDraft()&&!confirm('Leave this screen? Unsaved form entries remain until you reset or reload.'))return;v8Show(screen);history.pushState({nsmV8:true,screen},'')};
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
const exit=document.createElement('dialog');exit.id='v8Exit';exit.innerHTML='<h2>Leave NSM Shop Manager?</h2><p id="v8ExitMessage"></p><div class="actions"><button id="v8Stay">Keep working</button><button id="v8Leave" class="warn">Leave app</button></div>';document.body.append(exit);
$('v8Stay').onclick=()=>exit.close();$('v8Leave').onclick=()=>{if(timer)return;$('v8Exit').close();v8Leaving=true;history.go(-2)};
window.addEventListener('popstate',e=>{if(v8Leaving)return;if(picker.open){picker.close();history.pushState({nsmV8:true,screen:v8Current},'');return}if(e.state?.screen){v8Show(e.state.screen);return}history.pushState({nsmV8:true,screen:v8Current},'');$('v8ExitMessage').textContent=timer?'A timer is running. Keep working, then stop it before leaving.':draft?'Unsaved form entries will be lost if the app closes. Saved orders remain on this device.':'Your saved work remains on this device. Leave the app?';$('v8Leave').disabled=!!timer;if(!exit.open)exit.showModal()});
// Separate V8 test cache keeps local experiments away from live V7 accounts.
const localButton=document.createElement('button');localButton.type='button';localButton.className='alt';localButton.textContent='Open isolated V8 test copy';$('loginForm').after(localButton);
localButton.onclick=()=>task(async()=>{if(opened)return;activeUser={id:'v8-local-test',email:'v8-test@local'};KEY='nsm_v8_test_only';localRaw=localStorage.getItem(KEY);if(localRaw)restoreCache(localRaw);else{state=clone(seed);showApp();persistLocal()}accountUI();statusMessage('Isolated V8 test copy. Import a JSON backup in Settings to test your data. This copy does not sync to cloud.')});
exportData=function(){if(timer)return alert('Stop the running timer before exporting so all hours are included.');exportJSON(state,'nsm-shop-manager-v8-backup.json')};
render();
if('serviceWorker' in navigator&&location.protocol!=='file:'){
 const updates=document.createElement('div');updates.className='actions';updates.innerHTML='<button type="button" class="alt" id="v8UpdateApp">Check for app updates</button><p id="v8UpdateStatus" class="hint" role="status">App version V8.20</p>';$('cloudPanel').append(updates);
 const registration=navigator.serviceWorker.register('./sw-v8.js',{updateViaCache:'none'});registration.then(reg=>reg.update()).catch(()=>{});
 $('v8UpdateApp').onclick=async()=>{
  const message=$('v8UpdateStatus');
  if(timer){message.textContent='Stop your timer before updating the app.';return}
  if(draft){message.textContent='Save or cancel your form changes before updating the app.';return}
  if(busy){message.textContent='Wait for the current operation to finish, then check again.';return}
  if(!navigator.onLine){message.textContent='Connect to the internet to check for app updates.';return}
  $('v8UpdateApp').disabled=true;message.textContent='Checking for updates. Your saved shop data stays on this device.';
  try{const reg=await registration;await reg.update();const worker=reg.installing||reg.waiting;
   if(worker&&worker.state!=='activated')await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Update is taking longer than expected. Try again shortly.')),15000);function check(){if(worker.state==='activated'){clearTimeout(timeout);worker.removeEventListener('statechange',check);resolve()}else if(worker.state==='redundant'){clearTimeout(timeout);worker.removeEventListener('statechange',check);reject(Error('Update could not be installed. Try again.'))}}worker.addEventListener('statechange',check);check()});
   if(timer||draft||busy)throw Error('Finish your current work before updating.');
   const url=new URL(location.href);url.searchParams.set('update',String(Date.now()));location.replace(url.href);
  }catch(err){message.textContent=err.message;$('v8UpdateApp').disabled=false}
 };
}
