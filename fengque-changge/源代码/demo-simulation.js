/* Web adapter. RealmSim receives JSON snapshots; legacy court/romance keep their identities. */
const simEsc=mindEscape;
const simTick=()=>state.elapsed*30+(state.day||1)-1;
const simActive=()=>!!state.simulation?.active;
let simChangingMonth=false;
const simBeforeSave=save;save=function(){
 if(simActive()){
  const keys=Object.keys(state.dailyHistory||{}).sort((a,b)=>{const [am,ad]=a.split('-').map(Number),[bm,bd]=b.split('-').map(Number);return am*30+ad-bm*30-bd;});
  for(const key of keys.slice(0,-7))delete state.dailyHistory[key];
  if(state.logs.length>800)state.logs.splice(0,state.logs.length-800);
 }return simBeforeSave();
};
const simBeforeLog=log;log=function(text,type='日常',id){simBeforeLog(text,type,id);if(simActive()&&!['日程','月报'].includes(type))RealmSim.note(state.simulation,type,text,{tick:simTick(),actor:id||null});};
const simBeforePay=pay;pay=function(ap,money=0){if(simActive()&&state.ap<ap){toast('今天已经有些累了，睡一觉，明天再安排。');return false;}if(simActive()&&state.money<money){toast('宫里自己用的钱还不够，先换一件事吧。');return false;}return simBeforePay(ap,money);};
function simInput(){
 const f=frontEnsure();return {tick:simTick(),seed:f.seed,economy:{treasury:f.treasury,grain:f.grain,arrears:f.arrears,tax:f.tax,reserve:f.ruin?.reserve||0},
  regions:Object.fromEntries(REGIONS.map(r=>{const p=state.provinces[r.id],l=f.local[r.id];return [r.id,{id:r.id,name:r.name,focus:['capital','jiangnan','north'].includes(r.id),food:l.grain,health:l.health,waterRisk:l.waterRisk,corruption:l.corruption,infrastructure:Math.max(5,Math.round(p.prosperity/2)),business:p.prosperity,public:p.public,security:p.security,refugees:0,grainPrice:1}];})),
  actors:PEOPLE.filter(p=>castAge(p)>=18&&state.relations[p.id]).map(p=>({id:p.id,name:p.name,official:frontOfficials().some(q=>q.id===p.id),skill:castProfile(p.id)?.specialty||'',skills:{admin:frontAbility(p,'admin'),military:frontAbility(p,'military')}}))};
}
function simPull(){
 const s=state.simulation,f=frontEnsure();Object.assign(s.economy,{treasury:f.treasury,grain:f.grain,arrears:f.arrears,tax:f.tax,reserve:f.ruin?.reserve||0});
 const officials=new Set(frontOfficials().map(p=>p.id));
 const current=simInput().actors;for(const a of current)if(!s.actors.some(x=>x.id===a.id))s.actors.push({...a,stress:20,health:80,busyUntil:0,met:0,contactDays:[],mood:'平常'});
 for(const a of s.actors){a.official=officials.has(a.id);const p=PEOPLE.find(p=>p.id===a.id);if(p)a.skills={admin:frontAbility(p,'admin'),military:frontAbility(p,'military')};const old=f.orders.find(j=>j.actor===a.id&&j.status==='pending');if(old)a.busyUntil=Math.max(a.busyUntil,old.due-1);}
 for(const r of Object.values(s.regions)){const p=state.provinces[r.id],l=f.local[r.id];Object.assign(r,{food:l.grain,health:l.health,waterRisk:l.waterRisk,corruption:l.corruption,business:p.prosperity,public:p.public,security:p.security});}
}
function simPush(oldSerial=0){
 const s=state.simulation,f=frontEnsure();Object.assign(f,{treasury:s.economy.treasury,grain:s.economy.grain,arrears:s.economy.arrears,tax:s.economy.tax});
 for(const r of Object.values(s.regions)){Object.assign(state.provinces[r.id],{prosperity:r.business,public:r.public,security:r.security});Object.assign(f.local[r.id],{grain:r.food,health:r.health,waterRisk:r.waterRisk,corruption:r.corruption});}
 for(const e of s.events.filter(e=>Number(e.id.slice(6))>oldSerial)){
  const month=Math.floor(e.tick/30),day=e.tick%30+1;
  state.logs.push({month,type:e.kind,text:day+'日 · '+e.text});
  for(const id of e.actors||[e.actor].filter(Boolean))if(state.relations[id]?.mind)rememberMind(id,e.text,e.kind,true);
  if(e.kind==='人物往来'){
   const edge=state.socialEdges.find(x=>(x.a===e.actors[0]&&x.b===e.actors[1])||(x.b===e.actors[0]&&x.a===e.actors[1]));
   if(edge){edge.aff=clamp((edge.aff??50)+(e.stance<0?-1:1));edge.realmLast=e.id;}
  }
  if(e.kind==='重要警示'){state.army=clamp(state.army-1);state.people=clamp(state.people-1);}
  if(e.kind==='地方回奏'){
   const j=s.jobs.find(j=>j.id===e.job);if(j)frontReactions('sim:'+j.id,'result',{success:j.quality>=45,money:j.money,public:j.type==='relief'?5:0},j.type==='audit'?['law']:['care'],REALM_DATA.projects.find(p=>p.id===j.type).dept,j.actor,j.name);
  }
  if(e.kind==='税令'){
   f.taxMonth=state.elapsed;state.government.tax=f.tax==='light'?8:f.tax==='heavy'?13:10;
   frontReactions('sim-tax:'+state.elapsed,'decision',{},f.tax==='light'?['care','growth']:f.tax==='heavy'?['revenue','security']:['thrift','law'],'revenue',f.heads.revenue,e.text);
  }
  if(e.kind==='地方施政'){const j=s.jobs.find(j=>j.id===e.job);if(j){frontLedger('地方花费',-j.money,-j.grain,e.text);frontReactions('sim:'+j.id,'decision',{money:j.money},j.type==='audit'?['law']:['care'],REALM_DATA.projects.find(p=>p.id===j.type).dept,j.actor,j.name);}}
  if(e.kind==='补支俸饷')frontLedger('给官兵发钱',-e.amount,0,e.text);
 }
 for(const row of s.days.filter(d=>d.tick>(s.recordedDayTick??s.started))){f.ledger.push({tick:row.tick+1,month:Math.floor(row.tick/30),kind:'经营日计',money:row.income-row.payrollPaid,grain:row.harvest-row.grainUsed,text:'实税'+row.income+'、粮入'+row.harvest+'、实付俸饷'+row.payrollPaid+'、军粮'+row.grainUsed+'。',balance:row.treasury,grainBalance:row.grain});s.recordedDayTick=row.tick;}f.ledger=f.ledger.slice(-180);
 const h=state.dailyHistory[todayKey()];if(h)for(const a of s.actors)if(h.entries[a.id]&&a.routine)h.entries[a.id]=a.routine.map(x=>({...x,location:PEOPLE.find(p=>p.id===a.id)?.location||'quarters'}));
}
function simStart(){
 if(!simActive()){
  const oldLogs=state.logs.slice();state.simulation=RealmSim.create(simInput(),REALM_DATA);state.ap=REALM_DATA.dailyAP;state.simulation.ui={region:'capital',page:'realm'};simPush();
  const s=state.simulation;s.historyStart=s.started;for(const entry of oldLogs){const tick=Number(entry.month)*30+(entry.day?entry.day-1:0);if(!Number.isFinite(tick))continue;s.historyStart=Math.min(s.historyStart,tick);RealmSim.note(s,entry.type||'旧记事',entry.text,{tick,source:'旧存档记事',datePrecision:entry.day?'day':'month'});}
 }
 state.introSeen=true;closeModal();state.tab='realm';render();save();
}
function simDay(){
 if(!simActive()||simChangingMonth||state.simulation.tick>=simTick())return;
 const s=state.simulation;simPull();const serial=s.serial;RealmSim.advance(s,simTick(),REALM_DATA);state.ap=REALM_DATA.dailyAP;simPush(serial);save();
}
function simDispatch(command,ap=1){
 if(!simActive())return false;if(isAway()){toast('请先结束巡游回京，再安排此事。');return false;}if(state.ap<ap){toast('今天还能安排不足，可先就寝。');return false;}
 simPull();const s=state.simulation,serial=s.serial,cmd={...command,tick:s.tick,id:command.id||command.type+':'+s.tick+':'+(s.serial+1)};
 const result=RealmSim.command(s,cmd,REALM_DATA);if(!result.ok){toast(result.reason);return false;}state.ap-=ap;simPush(serial);save();return result;
}
function simButton(action,id,label,disabled=false){return '<button class="btn ghost" data-action="'+action+'" data-id="'+simEsc(id)+'" '+(disabled?'disabled':'')+'>'+label+'</button>';}
function simDate(tick){return date(Math.floor(tick/30))+' · '+(tick%30+1)+'日';}
function simRegionCard(r){
 const v=RealmSim.visual(r);return '<article class="card sim-region"><div class="sim-landscape '+(v.market==='常市开张'?'revived':'ruined')+'"><span>山</span><span>'+(v.fields==='阡陌渐复'?'田 田 田':'荒　田')+'</span><span>'+(v.market==='常市开张'?'店 舍 店':'舍　摊')+'</span></div><h3>'+simEsc(r.name)+'</h3><p>吃饭：<b>'+(r.food<25?'还有不少人挨饿':r.food<40?'勉强够吃':'暂时够吃')+'</b><br>出门：<b>'+(r.security<30?'路上不太安全':r.security<55?'比从前安稳些':'比较安心')+'</b><br>买粮：'+(r.grainPrice>1.5?'粮价偏贵':'粮价还算稳')+'</p><details><summary>再看仔细些</summary><p>'+Object.values(v).map(simEsc).join(' · ')+'</p><div class="sim-numbers">'+[['百姓存粮',r.food],['安全',r.security],['水患风险',r.waterRisk],['贪腐',r.corruption],['生计',r.business],['逃荒户数',r.refugees]].map(([k,v])=>'<span>'+k+' <b>'+v+'</b></span>').join('')+'</div><p class="mini">除逃荒户数外均为0—100。存粮、安全、生计越高越好；水患、贪腐越低越好。</p></details>'+simButton('simRegion',r.id,'这里能做什么？')+'</article>';
}
function simFunds(){
 if(!simActive())return ruinCouncil();const f=frontEnsure(),s=f.ruin,labels={inventory:['清点旧仓库','旧库里还有没交接的钱粮。先派人清点，两天后送来。'],collect:['催各地交回欠的钱','把早该送到朝廷的钱和粮收回来。能收多少，要看确实还欠多少。'],advance:['向叶家借钱粮','叶家可以先垫上，但借来的要还，也会更依赖他们。']};
 simOpen('先找钱和粮','<p>眼前能走这几条路。每条只能用一次；不是立刻到账，办好后会记在账上。</p>'+(!frontCanOrder()?'<p>先去上朝，让负责的人接下这件事。</p>'+simButton('simFundsEnter','',courtStatus()==='left'?'明天上朝再商量':'去上朝 · 1次安排'):'')+RUIN_DATA.routes.map(t=>{const done=s.routes.find(o=>o.id===t.id),label=labels[t.id]||[t.title,t.description],pool=t.pool==='receivables'?{money:f.taxReceivables,grain:s.pools.outsideGrain}:s.pools[t.pool];return '<div class="record"><h3>'+label[0]+'</h3><p>'+label[1]+'</p><p>能到手：钱'+Math.min(t.money,pool?.money||0)+'、粮'+Math.min(t.grain,pool?.grain||0)+' · 要等'+t.days+'天'+(t.id==='advance'?'；到期需还钱42、粮40':'')+'</p>'+(done?'<p class="tag">'+(done.status==='pending'?'正在办，还要'+Math.max(0,done.due-mindTick())+'天':'已经收到了')+'</p>':simButton('simFundRoute',t.id,'就这样办 · 1次安排',!frontCanOrder()||state.ap<1))+'</div>';}).join('')+'<details><summary>想看详细的来往和代价？</summary><p>借钱、追款会影响世家对朝廷的态度，原本欠下的银钱不会抹掉。</p>'+simButton('ruinCouncil','','打开原账册')+'</details>');
}
function simGuide(){
 const s=state.simulation,e=s.economy,pending=frontEnsure().ruin.routes.find(r=>r.status==='pending');
 if(pending)return '<p>去取钱粮的人还没回来，还要'+Math.max(0,pending.due-mindTick())+'天。可以先见个人，或点下方「今天先睡了」，让日子往前走。</p>'+simButton('simPage','people','先看看大家在做什么');
 if(e.grain===0)return '<p>粮仓空了。先找一笔能用的钱粮；旧库清点和向外借粮，都在这里商量。</p>'+simButton('simFunds','','找第一笔钱粮');
 if(s.jobs.some(j=>j.status==='pending'))return '<p>已经有人去办事了。等几天看结果，这会儿可以见人、逛逛或歇一歇。</p>'+simButton('simPage','jobs','看看事情办到哪了');
 return '<p>手里有一点钱粮了。先给百姓送粮，或修一条水渠；选好事情，再找一个做得来的人负责。</p>'+simButton('simRegion','capital','先看看京畿能做什么');
}
function simView(){
 const s=state.simulation;if(!s?.active)return '<div class="card"><h2>从上回继续，把日子过起来</h2><p>开启后一天可以安排六件事，三十天过一个月。钱、粮、人物与旧案都接着上回。</p><p>先找钱和粮，再帮百姓、给官兵发钱、安排大家办事。也可以见人、过节或出去走走。</p>'+simButton('simStart','','接着经营')+'</div>';
 simPull();const e=s.economy,slot=REALM_DATA.slots[Math.min(6,Math.max(0,6-state.ap))],focus=Object.values(s.regions).filter(r=>r.focus),festival=REALM_DATA.festivals.find(f=>f.month===state.elapsed%12&&f.day===state.day);
 return '<div class="eyebrow">'+simEsc(date())+' · '+state.day+'日 · '+slot+' · '+RealmSim.weather(s,REALM_DATA)+'</div><h2>今天先做什么？</h2><p class="lead">先管好钱和粮，再去见想见的人。每天安排六件事，没做完的留到明天。</p><div class="front-metrics">'+[['朝廷的钱',e.treasury],['存粮',e.grain],['还没发的薪水',e.arrears],['今天还能安排',state.ap+'/6']].map(([k,v])=>'<div>'+k+'<b>'+v+'</b></div>').join('')+'</div><div class="actions">'+simButton('simPage','jobs','谁在办事')+simButton('simPage','people','大家在做什么')+simButton('simPage','calendar','过节和休息')+simButton('simPage','annals','这一年的记事')+simButton('simFunds','','先找钱和粮')+simButton('simPay','','给官兵发钱 · 最多12钱 / 1次安排',e.treasury<Math.min(12,e.arrears)||e.arrears<=0)+'</div><details class="sim-rules"><summary>每天会花掉多少？</summary><p>每天给军营用粮1；每五天收一笔税，也要给官兵发12钱。不够就继续记欠。朝廷的钱和宫里自己用的钱分开算。</p></details><div class="card section-space"><h3>先做这一件</h3>'+simGuide()+simButton('audition','','也可以去选秀 · 第一次免费')+(festival?simButton('simFestival','',festival.name+' · 留一席饭 / 1次安排'):'')+'</div><div class="sim-regions">'+focus.map(simRegionCard).join('')+'</div><details class="card section-space"><summary>其余五地也在运转</summary>'+Object.values(s.regions).filter(r=>!r.focus).map(simRegionCard).join('')+'</details><details class="card section-space"><summary>以后慢慢做到</summary>'+REALM_DATA.goals.map(g=>'<p><b>'+(s.goals.includes(g.id)?'✓ ':'○ ')+g.name+'</b> · '+g.text+'</p>').join('')+'</details>';
}
function simOpen(title,body){openModal(title,simDate(simTick()),body,'经营 · 大梁');}
function simRegion(id){
 if(!simActive())return;simPull();const s=state.simulation,r=s.regions[id];if(!r)return;s.ui.region=id;
 simOpen(r.name+' · 百姓的日子',simRegionCard(r)+'<h3>让谁去做？</h3><p class="mini">选一个人负责。同一个人忙完手里的事，才能接下一件；擅长这件事的人，通常做得更快更好。</p><div class="opts">'+REALM_DATA.projects.map(p=>{
  const f=frontEnsure(),head=f.heads[p.dept],pool=frontOfficials().sort((a,b)=>(b.id===head)-(a.id===head)||frontAbility(b,p.skill)-frontAbility(a,p.skill)).slice(0,4);
  return '<details class="record"><summary><b>'+p.name+'</b> · 花钱'+p.money+'、用粮'+p.grain+' · '+p.days+'天左右</summary><p class="mini">点一个人，花1次安排。'+(s.economy.treasury<p.money||s.economy.grain<p.grain?'眼下钱粮还不够，先找钱和粮。':'不太熟练的人会多花一天，完成的效果也会少些。')+'</p>'+pool.map(a=>simButton('simProject',id+'|'+p.id+'|'+a.id,a.name+' · '+(a.id===head?'本部门负责人 · ':'')+(frontAbility(a,p.skill)>=60?'比较擅长':frontAbility(a,p.skill)>=45?'做得来':'还不熟练'),state.ap<1||s.actors.find(x=>x.id===a.id)?.busyUntil>s.tick||s.jobs.some(j=>j.status==='pending'&&j.actor===a.id)||s.economy.treasury<p.money||s.economy.grain<p.grain)).join('')+'</details>';
 }).join('')+'</div><details><summary>要不要调整收税？</summary><p class="mini">所有地方一起改，每月只能改一次。多收能解眼前之急，可百姓和商人也会更难过。</p><div class="actions">'+Object.entries(REALM_DATA.policies).map(([key,p])=>simButton('simTax',key,p.name+(s.economy.tax===key?' · 正在这样收':''))).join('')+'</div></details>');save();
}
function simPage(page){
 if(!simActive()){simStart();return;}const s=state.simulation;
 if(page==='jobs')simOpen('正在办的事',s.jobs.slice().reverse().map(j=>{const a=s.actors.find(a=>a.id===j.actor);return '<div class="record"><b>'+s.regions[j.region].name+' · '+j.name+'</b><p>'+simEsc(a?.name||'原承办人')+' · '+(j.status==='pending'?'还要'+Math.max(0,j.due-s.tick)+'日':'已经办好')+' · 接下这件事时的熟练程度'+j.quality+'</p><p class="mini">花了朝廷的钱'+j.money+' / 存粮'+j.grain+'；忙着办事时，私下见面要等一等；朝廷正事照常可以传达。</p></div>';}).join('')||'<p>还没安排大家办事。先清点旧仓库，找出能用的钱和粮。</p>');
 if(page==='people')simOpen('大家在做什么',s.actors.slice(0,15).map(a=>'<div class="record"><b>'+simEsc(a.name)+'</b><p>'+simEsc(a.routine?.[Math.min(6,6-state.ap)]?.text||'还在忙手里的事。')+'</p><p class="mini">'+a.mood+' · 压力'+a.stress+' · 健康'+a.health+(a.busyUntil>s.tick?' · 私下见面还要等'+(a.busyUntil-s.tick)+'日':'')+'</p>'+simButton('dailySchedule',a.id,'今天的安排')+simButton('visit',a.id,'去见一面 · 1次安排')+'</div>').join(''));
 if(page==='calendar')simOpen('过节和休息','<p>每天可以找一点自己的空闲，别的事暂且放一放。</p><div class="actions">'+REALM_DATA.leisure.map(l=>simButton('simLeisure',l.id,l.name+' · 1次安排')).join('')+'</div>'+REALM_DATA.festivals.map(f=>'<p>'+['正','二','三','四','五','六','七','八','九','十','十一','腊'][f.month]+'月'+f.day+'日 · '+f.name+(state.elapsed%12===f.month&&state.day===f.day?simButton('simFestival','','今日相聚 · 1次安排'):'')+'</p>').join(''));
 if(page==='annals'){
  const year=Math.floor(s.tick/360),years=Array.from({length:year-Math.floor((s.historyStart??s.started)/360)+1},(_,i)=>year-i);
  simOpen('这一年的记事','<p>这里记着这一局真正发生的事，过了年也能回来翻。可以下载保存一份。</p>'+simButton('simExport','','下载经营记录')+years.map(y=>{const a=RealmSim.annals(s,y);return '<details class="record" open><summary>'+simEsc(a.title)+' · 事项'+a.summary.events+'</summary>'+a.entries.slice().reverse().map(e=>'<p><span class="tag">'+(Math.floor(e.tick/30)%12+1)+'月'+(e.datePrecision==='month'?' · 日子未记':(e.tick%30+1)+'日')+' · '+simEsc(e.kind)+'</span> '+simEsc(e.text)+'</p>').join('')+'</details>';}).join(''));
 }
}
function simEndDay(){
 if(!simActive()){actions.month();return;}simOpen('今天先睡了？','<p>今天还能安排'+state.ap+'件事，睡醒就恢复到6。大家会继续办事，粮食也照常用；要紧事拖久了会有后果。</p><button class="btn primary wide" data-action="simSleep">睡一觉，过到明天</button><button class="btn ghost wide" data-action="close">再走走</button>');
}
const simBeforeDailyPanel=dailyPanel;dailyPanel=function(id,key){
 if(!simActive())return simBeforeDailyPanel(id,key);const a=state.simulation.actors.find(a=>a.id===id);if(!a)return simBeforeDailyPanel(id,key);
 const history=key?state.dailyHistory[key]?.entries[id]:a.routine;if(!history)return;
 const days=Object.keys(state.dailyHistory).filter(k=>state.dailyHistory[k].entries[id]).slice(-7).reverse(),h=state.dailyHistory[key||todayKey()];
 openModal(a.name+' · 今天的安排',date(h?.month??state.elapsed)+' · '+(h?.day??state.day)+'日','<div class="actions">'+days.map(k=>simButton('historyDay',id+'|'+k,state.dailyHistory[k].day+'日')).join('')+'</div>'+history.map(e=>'<div class="record"><span class="tag">'+simEsc(e.slot)+' · '+simEsc(e.place||wloc(e.location).name)+'</span><p>'+simEsc(e.text)+'</p></div>').join('')+'<p class="mini">近七日的行程可回看，要紧的事另记在人物记忆与年度记事中。隐情仍要慢慢相处才能知道。</p>'+simButton('visit',id,'去见一面 · 1次安排')+simButton('archive',id,'交际与记事'),'人物行程');
};actions.dailySchedule=id=>dailyPanel(id);actions.historyDay=raw=>{const [id,key]=raw.split('|');dailyPanel(id,key);};
const simBeforeTax=frontTax;frontTax=function(id){if(!simActive())return simBeforeTax(id);if(!frontCanOrder()){toast('须先入朝，再改税令。');return;}if(simDispatch({type:'tax',policy:id}))frontFinance();};actions.frontTax=frontTax;
const simBeforeStartTask=frontStartTask;frontStartTask=function(raw){
 if(simActive()){
  const parts=String(raw).split('|'),type=FRONT.tasks.find(t=>t.id===parts[0]),actor=type?frontEnsure().heads[type.dept]:null;
  if(actor&&state.simulation.jobs.some(j=>j.actor===actor&&j.status==='pending')){toast('这位部首正在领办经营差事，可先另任部首，或候其回奏。');return;}
 }return simBeforeStartTask(raw);
};actions.frontTask=frontStartTask;
const simBeforeBuild=buildDay;buildDay=function(){const key=simBeforeBuild();simDay();selectionChecksDay();return key;};
const simBeforeMonth=frontMonth;frontMonth=function(month){
 if(!simActive())return simBeforeMonth(month);const f=frontEnsure();if(f.months[month])return;
 const rows=state.simulation.days.filter(d=>Math.floor(d.tick/30)===month);f.months[month]={month,daily:true,income:rows.reduce((n,d)=>n+d.income,0),harvest:rows.reduce((n,d)=>n+d.harvest,0),paid:rows.reduce((n,d)=>n+d.payrollPaid,0),arrears:f.arrears,treasury:f.treasury,grain:f.grain};
 frontLedger('日计汇总',0,0,'本月税粮与俸饷已按日实收实付，月末仅结册。');ruinMonth(month);
};
const simBeforeNextMonth=actions.nextMonth;let simFastForward=false;
actions.nextMonth=()=>{
 if(!simActive())return simBeforeNextMonth();if(isAway()){toast('请先回京，再结算本月。');return;}
 if(!simFastForward){simOpen('提前收月','<p>将逐日推演本月余下'+(30-state.day)+'日。钱粮消耗、逾期事项、NPC往来与工程照常发生；可能错过节令与邀约。</p><button class="btn primary wide" data-action="simFastMonth">仍然收月</button><button class="btn ghost wide" data-action="close">继续今日</button>');return;}
 while(state.day<30){state.day++;buildDay();}simChangingMonth=true;try{simBeforeNextMonth();}finally{simChangingMonth=false;}buildDay();state.ap=REALM_DATA.dailyAP;render();save();
};
for(const key of ['frontNextMonthReview','daliangNextMonth']){const before=actions[key];actions[key]=arg=>{if(!simActive())return before(arg);simFastForward=true;try{return before(arg);}finally{simFastForward=false;}};}
const simBeforeNotices=importantNotices;importantNotices=function(){
 const list=simBeforeNotices();if(!simActive())return list;const s=state.simulation,e=s.events.filter(e=>e.urgent).at(-1);
 if(e&&(s.economy.grain===0||s.economy.arrears>96))list.unshift({id:'sim:'+e.id,title:'钱粮还得再想办法',text:e.text,action:'simHome',unread:!courierState().seen['sim:'+e.id]});return list;
};window.__courierAudit.importantNotices=importantNotices;
const simBeforeIntroDone=actions.introDone;actions.introDone=()=>{simBeforeIntroDone();simStart();};
const simBeforeIntro=intro;intro=function(){simBeforeIntro();$('modalBody').insertAdjacentHTML('afterbegin','<p class="sim-intro">V15 经营模式：每日六点精力，三十天过一个月。先从旧库筹措、京畿复耕和江南修渠开始；日常相处、旧案、选秀仍在。</p>');};
const simBeforeMonthAction=actions.month;actions.month=()=>simActive()?simEndDay():simBeforeMonthAction();
const simBeforeVisit=visit;visit=function(id){
 const a=state.simulation?.actors?.find(a=>a.id===id);if(simActive()&&a?.busyUntil>simTick()){
  const reply=id==='xu'?'臣还在核这份原册。私下的约，容臣办完再赴；若有政务，请陛下传旨。':id==='jiang'?'臣已约了人核荐册，不宜失信。陛下若问朝事，臣仍听旨。':id==='xie'?'陛下，奴才还得出去核一句话。等有了准信，再回来陪您说。':'臣手头这项差事还未交卷。容臣办妥，再来请安。';
  openModal('传来的回话',a.name,'<div class="scene-text">“'+reply+'”</div><p class="mini">未扣精力；还要'+(a.busyUntil-simTick())+'日。政务指令照常可办。</p>','召见');return;
 }return simBeforeVisit(id);
};actions.visit=id=>visit(id);
const simBeforeCommit=commitSocial;commitSocial=function(p,row){
 simBeforeCommit(p,row);if(!simActive()||!['care','chat'].includes(row.category)||!row.committed)return;
 const s=state.simulation,a=s.actors.find(a=>a.id===p.id);if(!a||a.contactDays.includes(s.tick))return;
 const before=s.serial;const res=RealmSim.command(s,{id:'contact:'+s.tick+':'+p.id,tick:s.tick,type:'contact',actor:p.id},REALM_DATA);if(res.ok)simPush(before);
};
const simBeforeSocial=socialRows;socialRows=function(p,c,category,topic){
 const old=simBeforeSocial(p,c,category,topic);if(!simActive()||!['chat','care'].includes(category)||!['recent','listen'].includes(topic))return old;
 const s=state.simulation,a=s.actors.find(a=>a.id===p.id);if(!a)return old;const job=s.jobs.find(j=>j.actor===p.id&&j.status==='pending'),tier=socialTier(p),rain=RealmSim.weather(s,REALM_DATA).includes('雨');let lines=[];
 if(job)lines=['在看'+s.regions[job.region].name+'送来的副册，'+job.name+'还未交卷。臣把几处对不上数的另记了一页。','这两日忙的是'+job.name+'。地方路远，回话得等，急也没法省下这段工夫。',''+job.name+'还在办。今日先把所需的数目核清，明日再催一次回文。'];
 else if(p.id==='xu'&&s.economy.arrears>30)lines=['刚核完俸饷册。几个衙门递来的数不一样，臣还要再对一次。身子倒无妨，陛下不必挂心。','今日在看旧欠，没往别处去。茶凉了两回，倒忘了叫人换。','在和户部对账。还有一点没弄清，等副册送来再问。'];
 else if(p.id==='jiang')lines=['今日核了几份荐册。家中递来的那一份，也得照样查过。',rain?'方才在廊下避雨。带来的书没有淋湿，只是袖口沾了些水。':'方才在廊下走了一会儿。回来再看那份荐册，倒觉出一处应当再问。','今日起得早，眼下有些倦。陛下若要问功课，倒还不至于答不上。'];
 else if(p.id==='xie')lines=['出去了一趟，回来得迟。路边的热饼没买着，倒带回一身风。','今日耳边清净了一阵，奴才趁机把旧笺按日期理了。陛下这会儿过来，正好能坐坐。','刚换过茶，还是温的。奴才今日没什么不适，只是走得多，鞋底该换了。'];
 if(!lines.length)return old;
 return old.concat(lines.map((reply,i)=>({id:'sim:'+p.id+':'+(job?.id||(p.id==='xu'?'accounts':'daily'))+':'+i,semantic:'sim:'+p.id+':'+(job?.id||'daily')+':'+i,reply,category,topic,socialTier:tier,score:125,everyday:true,minTier:0})));
};
const simBeforeRender=render;render=function(){
 if(simChangingMonth)return;simBeforeRender();const s=$('screen');if(state.tab==='realm')s.innerHTML=simView();
 if(state.tab==='home')s.insertAdjacentHTML('afterbegin','<section class="card sim-home"><h3>大梁 · 今日经营</h3><p>'+(simActive()?'国库'+state.frontCourt.treasury+' · 存粮'+state.frontCourt.grain+' · 欠饷'+state.frontCourt.arrears+'。今日还有'+state.ap+'点精力。':'从现存人物与账册接手，按日经营山河与宫廷。')+'</p>'+simButton('simHome','',simActive()?'去看山河与人间':'接手经营')+'</section>');
 if(state.tab==='notes'&&simActive())s.insertAdjacentHTML('afterbegin','<section class="card"><h3>地方回奏与人物往来</h3>'+simButton('simPage','annals','查阅这一年的记事')+simButton('simExport','','导出经营快照')+'</section>');
 if(simActive()){
  $('monthButton').textContent='今天先睡了';const ap=$('ap');if(ap?.parentNode?.lastChild?.nodeType===3)ap.parentNode.lastChild.textContent='/6';if(ap?.parentNode?.firstChild?.nodeType===3)ap.parentNode.firstChild.textContent='今天剩余 ';const money=$('money');if(money?.parentNode?.firstChild?.nodeType===3)money.parentNode.firstChild.textContent='宫里用钱 ';
  const footer=document.querySelector('.bottom-bar strong');if(footer)footer.textContent='一天安排六件事，想睡时就歇下';
  const dateEl=$('date');dateEl.textContent=date()+' · '+state.day+'日 · '+REALM_DATA.slots[Math.min(6,Math.max(0,6-state.ap))];
 }save();
};
Object.assign(actions,{simStart,simHome:()=>{closeModal();state.tab='realm';render();},simRegion,simPage,
 simFunds,simFundsEnter:()=>{if(isAway()){returnTour();simFunds();return;}if(courtStatus()==='left'){if(state.day>=30){simEndDay();return;}actions.nextDay();}closeModal();actions.tab('court');simFunds();},
 simFundRoute:id=>{ruinRoute(id);simFunds();render();},
 simProject:raw=>{const [region,project,actor]=String(raw).split('|');if(simDispatch({type:'project',region,project,actor})){simRegion(region);render();}},
 simPay:()=>{if(simDispatch({type:'payArrears'}))render();},simTax:policy=>{if(simDispatch({type:'tax',policy})){simRegion(state.simulation.ui.region);render();}},
 simLeisure:activity=>{const r=simDispatch({type:'leisure',activity});if(r){result('得了一刻闲',r.event.text,'今天还能安排 −1');render();}},
 simFestival:()=>{const r=simDispatch({type:'festival'});if(r){result('今夜相聚',r.event.text,'今天还能安排 −1');render();}},
 simSleep:()=>{if(state.day<30)actions.nextDay();else{simFastForward=true;try{actions.nextMonth();}finally{simFastForward=false;}}},
 simFastMonth:()=>{simFastForward=true;try{actions.nextMonth();}finally{simFastForward=false;}},
 simExport:()=>{if(!simActive())return;const data={schemaVersion:1,game:'fengque-changge',simulation:RealmSim.copy(state.simulation),annals:RealmSim.annals(state.simulation,Math.floor(simTick()/360))};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='这一年的记事_经营存档.json';a.click();URL.revokeObjectURL(a.href);}
});
const simStyle=document.createElement('style');simStyle.textContent='.sim-regions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:20px}.sim-region{min-width:0}.sim-numbers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;font-size:12px}.sim-landscape{display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px;background:#ded9c8;color:#7d735f;border-radius:10px;font-size:21px;letter-spacing:9px}.sim-landscape.revived{background:#dce7c9;color:#577248}.sim-region p{line-height:1.8}.sim-region .btn{white-space:normal}.sim-intro{padding:14px;background:#f3ead9;border-radius:10px}@media(max-width:700px){.sim-regions{grid-template-columns:1fr}.sim-landscape{flex-direction:row;justify-content:space-evenly;letter-spacing:5px}.nav{flex-wrap:wrap}}';document.head.appendChild(simStyle);
