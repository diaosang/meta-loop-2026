/* IndexedDB stores full slots and rolling backups. localStorage remains a fast legacy mirror. */
const FQVault={db:null,booting:typeof indexedDB!=='undefined',ready:false,dirty:false,pending:null,writing:null,paused:false,error:null,day:null,rows:[],preview:null,memory:new Map()};
function vaultOpen(){return new Promise((resolve,reject)=>{const r=indexedDB.open('fengque-vault-v16',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('saves'))r.result.createObjectStore('saves',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||Error('浏览器没有打开存档库。'));r.onblocked=()=>reject(Error('另一个页面正在升级存档库，请先关掉旧页面再试。'));});}
function vaultPutMany(rows){if(!FQVault.db)return Promise.reject(Error('当前浏览器不能存多份进度，请先下载一份。'));return new Promise((resolve,reject)=>{const tx=FQVault.db.transaction('saves','readwrite'),store=tx.objectStore('saves');for(const r of rows)store.put(r);tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error||Error('存档没有写完。'));});}
function vaultGet(id){if(!FQVault.db)return Promise.resolve(null);return new Promise((resolve,reject)=>{const tx=FQVault.db.transaction('saves','readonly'),r=tx.objectStore('saves').get(id);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});}
function vaultAll(){if(!FQVault.db)return Promise.resolve([]);return new Promise((resolve,reject)=>{const r=FQVault.db.transaction('saves','readonly').objectStore('saves').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function vaultDelete(id){return new Promise((resolve,reject)=>{const tx=FQVault.db.transaction('saves','readwrite');tx.objectStore('saves').delete(id);tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(tx.error);});}
function vaultLabel(envelope){try{const {payload}=FengqueSave.unpack(envelope);return date(payload.elapsed)+' · '+(payload.day||1)+'日 · '+(payload.world16?'第'+payload.world16.dynasty.generation+'代 · ':'')+'宫里钱'+payload.money;}catch{return '这份进度有一处读不对';}}
async function vaultFlush(){
 if(FQVault.booting||FQVault.paused||!FQVault.dirty)return;if(FQVault.writing)return FQVault.writing;
 FQVault.writing=(async()=>{while(FQVault.dirty&&!FQVault.paused){FQVault.dirty=false;const envelope=FengqueSave.pack(state),rows=[{id:'current',kind:'auto',envelope}],day=state.elapsed*30+(state.day||1)-1;
   if(FQVault.day!==day){const last=await vaultGet('current');if(last){rows.push({id:'backup:'+day%3,kind:'backup',envelope:last.envelope});}FQVault.day=day;}
   try{await vaultPutMany(rows);try{localStorage.setItem('fengque-save-meta-v16',JSON.stringify({savedAt:envelope.savedAt,checksum:envelope.checksum}));}catch{}$('saveStatus').textContent='已自动存好';FQVault.error=null;}catch(e){FQVault.error=e.message;$('saveStatus').textContent='浏览器备用存档未写好，请下载一份进度';break;}
  }})().catch(e=>{FQVault.error=e.message;$('saveStatus').textContent='这次未存好，请下载进度';}).finally(()=>{FQVault.writing=null;});return FQVault.writing;
}
const vaultBeforeSave=save;save=function(){if(FQVault.booting||FQVault.paused)return;vaultBeforeSave();if(!FQVault.db)return;FQVault.dirty=true;if(!FQVault.pending)FQVault.pending=Promise.resolve().then(()=>{FQVault.pending=null;return vaultFlush();});};
async function vaultWait(){if(FQVault.pending)await FQVault.pending;if(FQVault.writing)await FQVault.writing;if(FQVault.dirty)await vaultFlush();}
function vaultHydrate(payload){
 const next=FengqueSave.check(FengqueWorld.copy(payload));const oldState=state,oldPeople=PEOPLE.map(p=>FengqueWorld.copy(p));
 try{state=next;session=null;modalAfter=null;world16Placement=null;PEOPLE.splice(0,PEOPLE.length,...WORLD16_BASE.map(p=>FengqueWorld.copy(p)));ensureCastState();if(state.world16)world16RestorePeople();initExploration();ensureCourtScene();ensureMinds();ensureInteractionStats();frontEnsure();daliangEnsure();if(state.world16){const errors=FengqueWorld.validate(state.world16);if(errors.length)throw Error(errors[0]);}closeModal();state.tab=state.world16?'world16':simActive()?'realm':'home';render();}
 catch(e){state=oldState;PEOPLE.splice(0,PEOPLE.length,...oldPeople);throw e;}
}
async function vaultPanel(){
 await vaultWait();FQVault.rows=await vaultAll();const record=id=>FQVault.rows.find(r=>r.id===id),slot=i=>{const r=record('manual:'+i);return '<div class="record"><h3>手动进度 '+i+'</h3><p>'+simEsc(r?vaultLabel(r.envelope):'还没放进度')+'</p>'+simButton('vaultManualSave',String(i),r?'用现在的进度覆盖这里':'把现在的进度放这里')+(r?simButton('vaultPreview','manual:'+i,'读这份')+simButton('vaultDeleteAsk','manual:'+i,'删这份'):'')+'</div>';};
 world16Open('存好／换个进度','<p>自动存好当前进度，也留最近三次换日备份。手动进度有三格；读档前会先让你看清日期，不会立即覆盖。</p>'+(FQVault.error?'<p class="effect">'+simEsc(FQVault.error)+'</p>':'')+'<div class="actions">'+simButton('vaultDownload','','下载完整进度')+simButton('vaultChooseFile','','读取以前下载的进度')+'</div><input id="vaultFile" type="file" accept=".json,application/json" hidden><div class="vault-slots">'+[1,2,3].map(slot).join('')+'</div><details><summary>自动留下的备份</summary>'+FQVault.rows.filter(r=>r.kind==='backup'||r.kind==='before-load').sort((a,b)=>b.envelope.savedAt-a.envelope.savedAt).map(r=>'<div class="record"><p>'+simEsc(vaultLabel(r.envelope))+'</p>'+simButton('vaultPreview',r.id,'先看看这份')+'</div>').join('')+'</details>');
 const input=$('vaultFile');if(input)input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{if(file.size>35*1024*1024)throw Error('文件太大，请确认选的是游戏的完整进度。');const text=await file.text();vaultPreviewText(text,file.name);}catch(e){vaultProblem(e.message);}};
}
function vaultProblem(message){world16Open('这份先别读','<p>'+simEsc(message)+'</p><p>当前进度和原文件都还在。可以换一份备份，或先下载当前进度。</p>'+simButton('vaultPanel','','回到存档页'));}
function vaultPreviewText(text,name='所选进度'){
 try{const read=FengqueSave.unpack(text);FQVault.preview={...read,name};world16Open('先看看这份进度','<h3>'+simEsc(name)+'</h3><p>'+simEsc(vaultLabel(read.legacy?FengqueSave.pack(read.payload):JSON.parse(text)))+'</p><p>这里共有'+Object.keys(read.payload.relations).length+'位人物记录'+(read.payload.world16?'、'+Object.keys(read.payload.world16.palace.buildings).length+'处宫室':'')+'。'+(read.legacy?'旧版完整进度可以继续读，未有的系统会在使用时补齐。':'校验已通过。')+'</p><p>确认后才切换。当前进度会先留一份备份。</p>'+simButton('vaultApply','','确认读取，继续这份人生')+simButton('vaultCancel','','先不读'));}
 catch(e){FQVault.preview=null;vaultProblem(e.message);}
}
async function vaultApply(){
 const preview=FQVault.preview;if(!preview||FQVault.loading)return;FQVault.loading=true;const curtain=document.createElement('div');curtain.id='vaultSwitchCurtain';curtain.textContent='正在收好旧进度，翻开新的一页……';curtain.style.cssText='position:fixed;inset:0;z-index:210;background:#fff9f2ed;display:grid;place-items:center;color:#94606c';document.body.appendChild(curtain);await vaultWait();FQVault.paused=true;
 try{const current=FengqueSave.pack(state);await vaultPutMany([{id:'before-load',kind:'before-load',envelope:current}]);FQVault.preview=null;vaultHydrate(preview.payload);FQVault.paused=false;save();await vaultWait();toast('已读回这份进度。原来的进度留在自动备份里。');}catch(e){FQVault.paused=false;vaultProblem(e.message);}finally{FQVault.loading=false;curtain.remove();}
}
async function vaultManualSave(slot,confirmed=false){
 if(!['1','2','3'].includes(String(slot)))return;const id='manual:'+slot,old=await vaultGet(id);
 if(old&&!confirmed){world16Open('覆盖这一格进度？','<p>原来是：'+simEsc(vaultLabel(old.envelope))+'</p><p>覆盖前会把原来的这份留进备份。</p>'+simButton('vaultManualConfirm',String(slot),'确定覆盖')+simButton('vaultPanel','','先不覆盖'));return;}
 try{const envelope=FengqueSave.pack(state);await vaultPutMany([{id,kind:'manual',envelope},...(old?[{id:'manual-old:'+slot,kind:'backup',envelope:old.envelope}]:[])]);toast('这格进度存好了。');await vaultPanel();}catch(e){vaultProblem(e.message);}
}
const vaultBeforeReset=actions.resetConfirm;function vaultResetNow(){PEOPLE.splice(0,PEOPLE.length,...WORLD16_BASE.map(p=>FengqueWorld.copy(p)));FQVault.preview=null;world16Placement=null;vaultBeforeReset();if(simActive())world16Start();save();}
actions.resetConfirm=()=>{if(typeof indexedDB==='undefined'){vaultResetNow();return;}return vaultResetAsync();};async function vaultResetAsync(){
 await vaultWait();try{if(FQVault.db)await vaultPutMany([{id:'before-reset',kind:'backup',envelope:FengqueSave.pack(state)}]);vaultResetNow();}catch(e){vaultProblem('没能先留下旧进度，暂不重开：'+e.message);}
};
Object.assign(actions,{vaultPanel,vaultDownload:()=>world16Download(FengqueSave.pack(state),'凤阙长歌_完整进度.json'),vaultChooseFile:()=>$('vaultFile')?.click(),vaultPreview:async id=>{const r=await vaultGet(id);if(r)vaultPreviewText(JSON.stringify(r.envelope),id.startsWith('manual')?'手动进度':'自动备份');},vaultApply,vaultCancel:()=>{FQVault.preview=null;vaultPanel();},vaultManualSave:slot=>vaultManualSave(slot),vaultManualConfirm:slot=>vaultManualSave(slot,true),vaultDeleteAsk:id=>{if(!/^manual:[123]$/.test(id))return;world16Open('删掉这格进度？','<p>只删除这格手动进度，不会动现在正在玩的这一份。</p>'+simButton('vaultDelete',id,'确定删除')+simButton('vaultPanel','','留着'));},vaultDelete:async id=>{if(!/^manual:[123]$/.test(id))return;try{await vaultDelete(id);await vaultPanel();}catch(e){vaultProblem(e.message);}}});
actions.export=()=>world16Download(FengqueSave.pack(state),'凤阙长歌_完整进度.json');
for(const key of ['vaultPanel','vaultPreview','vaultApply','vaultManualSave','vaultManualConfirm','vaultDelete']){const before=actions[key];actions[key]=arg=>Promise.resolve().then(()=>before(arg)).catch(e=>vaultProblem(e.message||'存档库暂时没能读写，请保留当前进度。'));}
async function vaultBoot(){
 let corrupt=false;try{if(FQ_BOOT.raw)FengqueSave.unpack(FQ_BOOT.raw);}catch{corrupt=true;}
 try{FQVault.db=await vaultOpen();const rows=await vaultAll(),current=rows.find(r=>r.id==='current'),localAt=FQ_BOOT.raw&&FQ_BOOT.meta?.checksum===FengqueSave.hash(FQ_BOOT.raw)?FQ_BOOT.meta.savedAt:0;let chosen=null;
  if(current&&(corrupt||current.envelope.savedAt>localAt))try{FengqueSave.unpack(current.envelope);chosen=current;}catch{corrupt=true;}
  if(corrupt&&!chosen)for(const row of rows.filter(r=>r.kind==='backup'||r.kind==='before-load').sort((a,b)=>b.envelope.savedAt-a.envelope.savedAt)){try{FengqueSave.unpack(row.envelope);chosen=row;break;}catch{}}
  if(chosen){FQVault.paused=true;vaultHydrate(FengqueSave.unpack(chosen.envelope).payload);FQVault.paused=false;if(corrupt)toast('上次的进度读不对，已恢复最近一份完整备份。');}
  if(corrupt&&FQ_BOOT.raw)await vaultPutMany([{id:'damaged-original',kind:'damaged',raw:FQ_BOOT.raw}]);
  FQVault.booting=false;FQVault.ready=true;FQ_BOOT.block=false;if(corrupt&&!chosen){FQVault.paused=true;world16Open('原进度有一处读不对','<p>先别重开。原始数据已留在本机，自动保存暂时停下，可以选择另一份完整备份。</p>'+simButton('vaultPanel','','查看备份或导入文件')+simButton('vaultKeepNewAsk','','确实没有旧进度，另开一份'));return;}save();await vaultWait();
 }catch(e){FQVault.booting=false;FQVault.ready=true;FQVault.error=e.message;FQ_BOOT.block=false;if(corrupt){FQVault.paused=true;vaultProblem('旧进度读不对，而且备份库未打开。自动存档已停下，请先导入一份完好文件。');}else{vaultBeforeSave();$('saveStatus').textContent='当前进度已存；多份备份暂不可用';}}
 finally{document.getElementById('vaultBootCurtain')?.remove();}
}
Object.assign(actions,{vaultKeepNewAsk:()=>world16Open('确定另开一份？','<p>损坏的原数据会保留在本机，不再当成当前进度；另开后会自动存好新的进度。</p>'+simButton('vaultKeepNew','','确定另开')+simButton('vaultPanel','','再看看备份')),vaultKeepNew:()=>{FQVault.paused=false;closeModal();save();}});
if(typeof indexedDB!=='undefined'){const curtain=document.createElement('div');curtain.id='vaultBootCurtain';curtain.setAttribute('role','status');curtain.textContent='正在翻开上次的进度……';curtain.style.cssText='position:fixed;inset:0;z-index:200;background:#fff9f2ed;display:grid;place-items:center;color:#94606c';document.body.appendChild(curtain);vaultBoot();}else{FQVault.booting=false;FQVault.ready=true;FQ_BOOT.block=false;}
