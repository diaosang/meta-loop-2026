/* Persistent ruined-country opening. No online model, fabricated genealogies or invisible refill. */
function ruinInit(f){
 if(state.openingScenario!=='ruined-realm'||f.ruin)return;
 const n=RUIN_DATA.national;
 f.ruin={version:'13.6',started:mindTick(),control:n.control,days:{},months:{},routes:[],pressures:[],serial:0,
  pools:{sealed:{money:24,grain:36},outsideGrain:24,credit:{money:28,grain:36}},debt:{silver:0,grain:0,paidSilver:0,paidGrain:0},events:[],observed:{}};
 f.treasury=n.treasury;f.grain=n.grain;f.arrears=n.arrears;f.taxReceivables=n.receivables;
 state.money=n.private;state.authority=n.authority;state.people=n.people;state.army=n.army;
 state.strife.threat=n.threat;state.strife.factionTension=n.tension;state.strife.warExhaustion=28;
 Object.assign(state.government,{training:n.training,diplomacy:n.diplomacy,security:22,works:0,treasuryHealth:8});
 for(const r of REGIONS){const p=state.provinces[r.id],l=f.local[r.id];
  for(const key of ['prosperity','public','security']){const [lo,hi]=RUIN_DATA.local[key];p[key]=lo+mindHash(f.seed+':ruin:'+r.id+key)%(hi-lo+1);}
  for(const key of ['grain','health','waterRisk','corruption','literacy']){const [lo,hi]=RUIN_DATA.local[key];l[key]=lo+mindHash(f.seed+':ruin:'+r.id+key)%(hi-lo+1);}
 }
 for(const p of frontOfficials()){
  const h=mindHash(f.seed+':old-court:'+p.id),r=state.relations[p.id],m=f.ministers[p.id],core=RUIN_DATA.core[p.id];
  r.loyalty=core?.loyalty??18+h%23;r.ambition=core?.ambition??55+(h>>>4)%34;
  m.ambition=r.ambition;m.influence=core?.influence??48+(h>>>9)%35;m.integrity=core?m.integrity:38+(h>>>13)%38;
 }
 f.heads.personnel='xu';f.heads.revenue='ye';f.heads.rites='jiang';f.heads.war='lu';
 // Keep remaining departments unique after installing the original senior office-holders.
 const used=new Set(['xu','ye','jiang','lu']);
 for(const id of ['justice','works']){let p=frontOfficials().find(p=>p.id===f.heads[id]&&!used.has(p.id));if(!p)p=frontOfficials().filter(p=>!used.has(p.id)).sort((a,b)=>frontAbility(b,'admin')-frontAbility(a,'admin'))[0];if(p){f.heads[id]=p.id;used.add(p.id);}}
 // Reports are rebuilt below against actual ruined conditions, instead of the previous rich start.
 f.affairs=[];f.returns=[];f.ruin.deferred=0;
 log('先帝遗下空库与旧欠。可拨国库银0、仓粮0，积欠俸饷96；新帝握印，六部钱粮与签押仍多在旧臣之手。','登基危局');
}
function ruinState(){return frontEnsure().ruin||null;}
function ruinChange(control=0,tension=0,actor=null,influence=0){const f=frontEnsure(),s=f.ruin;if(!s)return;s.control=clamp(s.control+control);state.strife.factionTension=clamp(state.strife.factionTension+tension);if(actor&&f.ministers[actor])f.ministers[actor].influence=clamp((f.ministers[actor].influence||0)+influence);}
function ruinTrack(text,kind='朝臣动静',actor=null){const s=ruinState();if(!s)return;s.events.push({tick:mindTick(),text,kind,actor});s.events=s.events.slice(-60);log(text,kind,actor);if(actor)rememberMind(actor,text,kind,true);}
function ruinRoutesBody(){const f=frontEnsure(),s=f.ruin;if(!s)return '';
 return '<h4>先找可动用的钱粮</h4><p class="mini">国库可拨为零，不等于世间再无粮。旧库须点交、欠解须催收、借粮须记债；每条只办一次，均有实际来源和代价。</p>'+RUIN_DATA.routes.map(t=>{
  const o=s.routes.find(o=>o.id===t.id);return '<div class="record"><b>'+t.title+'</b><p>'+t.description+'</p><p class="mini">1行动 · '+t.days+'日 · 到账银'+t.money+'、粮'+t.grain+' · '+(t.control>0?'掌控+'+t.control:'掌控'+t.control)+'</p>'+(o?'<span class="tag">'+(o.status==='pending'?'已发令 · 尚需'+Math.max(0,o.due-mindTick())+'日':'已点交')+'</span>'+(o.result?'<p>'+frontEsc(o.result)+'</p>':''):'<button class="btn primary" data-action="ruinRoute" data-id="'+t.id+'" '+(!frontCanOrder()||state.ap<1?'disabled':'')+'>定此策 · 1行动</button>')+'</div>';
 }).join('');}
function ruinEntry(){if(frontCanOrder())return '';return '<p class="mini">'+(isAway()?'正在巡游，先回京。':courtStatus()==='left'?'今日已退朝，可翌日入朝再议。':'尚未入朝，可入朝议定筹措。')+'</p><button class="btn primary" data-action="ruinEnter">'+(isAway()?'回京继续筹措':courtStatus()==='left'?'翌日入朝议筹措':'入朝议筹措 · 1行动')+'</button>';}
function ruinCouncil(){
 const f=frontEnsure(),s=f.ruin;if(!s){frontSources();return;}
 frontOpen('风雨登基 · 钱粮与朝权','谢无咎将空库册与欠饷册并放在御案：“陛下，眼下能拨的，都在这两册末尾。旧臣能办到的，却未必都写在这里。”',
  '<div class="front-metrics"><div>可拨国库<b>'+f.treasury+'</b></div><div>可拨仓粮<b>'+f.grain+'</b></div><div>积欠俸饷<b>'+f.arrears+'</b></div><div>皇权掌控<b>'+s.control+'</b></div></div>'+ruinEntry()+ruinRoutesBody()+
  '<h4>往后怎样续办</h4><p>已核实的待解税银尚余'+f.taxReceivables+'；可以每月催解一笔，最多12。它从真实待解扣除，不是凭空岁入。</p><button class="btn ghost" data-action="ruinCollect" '+(!frontCanOrder()||state.ap<1||f.taxReceivables<=0||s.months['collect:'+state.elapsed]?'disabled':'')+'>催解旧项 · 1行动 / 三日后到银</button><p class="mini">'+(s.reserve?'已定月末留续赈现银最多6，其余实付俸饷；不足部分仍记欠饷并影响军民。':'可令月末保留最多6银续赈，俸饷余欠照记。保住下月的办事钱，也是在拖欠的人面前承担代价。')+'</p><button class="btn ghost" data-action="ruinReserve" '+(!frontCanOrder()||state.ap<1||s.reserve?'disabled':'')+'>定留续赈银6 · 1行动</button>'+
  '<h4>朝臣的底牌</h4>'+Object.entries(RUIN_DATA.core).map(([id,c])=>{const r=state.relations[id],m=f.ministers[id];return '<div class="record"><b>'+frontEsc(frontName(id))+'</b><p>'+c.stance+'</p><p class="mini">忠诚'+r.loyalty+' · 野心'+r.ambition+' · 影响力'+m.influence+'</p></div>';}).join('')+
  '<h4>尚存的借据</h4><p>叶氏银债'+s.debt.silver+'，粮债'+s.debt.grain+'；已还银'+s.debt.paidSilver+'、粮'+s.debt.paidGrain+'。与旧欠俸饷分账，不因月底结算凭空划清。</p>'+
  '<h4>留签与索权</h4>'+s.pressures.slice(-4).reverse().map(c=>'<div class="record"><b>'+frontEsc(frontName(c.actor))+' · '+RUIN_DATA.pressure.title+'</b><p>'+frontEsc(c.result||'需补的签押被扣住，要求由其荐员代签。')+'</p><button class="btn ghost" data-action="ruinPressure" data-id="'+c.id+'">看原委与处置</button></div>').join('')+
  '<h4>已发生的动静</h4>'+s.events.slice(-6).reverse().map(e=>'<div class="record"><p>'+frontEsc(e.text)+'</p></div>').join(''));save();
}
function ruinEnter(){
 if(isAway()){returnTour();ruinCouncil();return;}
 if(frontCanOrder()){ruinCouncil();return;}
 if(state.ap<2){toast('入朝与议定筹措各需1行动；本月不足，可正常月结后再议。');return;}
 if(courtStatus()==='left'){if(state.day>=30){actions.month();return;}actions.nextDay();}
 closeModal();actions.tab('court');if(frontCanOrder())ruinCouncil();
}
function ruinRoute(id){
 const f=frontEnsure(),s=f.ruin,t=RUIN_DATA.routes.find(t=>t.id===id);if(!s||!t||!frontCanOrder()||s.routes.some(o=>o.id===id)||state.ap<1)return;
 let silver=t.money,grain=t.grain;
 if(t.pool==='receivables'){silver=Math.min(silver,f.taxReceivables);grain=Math.min(grain,s.pools.outsideGrain);if(!silver&&!grain)return;f.taxReceivables-=silver;s.pools.outsideGrain-=grain;}
 else{const pool=s.pools[t.pool];silver=Math.min(silver,pool.money);grain=Math.min(grain,pool.grain);if(!silver&&!grain)return;pool.money-=silver;pool.grain-=grain;}
 state.ap--;const uid='ruin-route-'+id;s.routes.push({id,uid,status:'pending',created:mindTick(),due:mindTick()+t.days,silver,grain,actor:t.actor});
 if(id==='advance'){s.debt.silver+=42;s.debt.grain+=40;}
 ruinChange(t.control,t.tension,t.actor,t.influence);frontReactions(uid,'decision',{},t.tags,id==='collect'?'rites':id==='advance'?'revenue':'personnel',t.actor,t.title);
 ruinTrack('定“'+t.title+'”，限'+t.days+'日点交；现银与仓粮尚未到账。','危局发令',t.actor);
 frontOpen(t.title,'所定已发交；资源仍待真实点交。','<div class="scene-text">'+t.reply+'</div><p>'+t.days+'日后点交银'+silver+'、粮'+grain+'；'+(id==='advance'?'银债42、粮债40已立借据。':'来源已留置待交，不会重复征解。')+'</p><button class="btn ghost" data-action="ruinCouncil">回看筹措与朝权</button>');save();render();
}
function ruinCompleteRoute(o){
 const f=frontEnsure(),s=f.ruin,t=RUIN_DATA.routes.find(t=>t.id===o.id)||{title:'催解已核旧项',actor:'ye',tags:['law','thrift']};if(o.status!=='pending')return;o.status='completed';o.completed=mindTick();f.treasury+=o.silver;f.grain+=o.grain;
 o.result='原册与点交回执已对：实收银'+o.silver+'、粮'+o.grain+'；'+(o.id==='advance'?'借据仍存，不作无偿岁入。':'未将其余账面应收当作到手钱粮。');
 frontLedger(o.id==='advance'?'借款点交':'旧项点交',o.silver,o.grain,t.title+'。'+o.result);ruinTrack(t.title+'：'+o.result,'危局回报',t.actor);
 frontReactions(o.uid,'result',{success:true},t.tags,o.id==='collect'?'rites':o.id==='advance'?'revenue':'personnel',t.actor,t.title+'回报');
}
function ruinCollect(){
 const f=frontEnsure(),s=f.ruin;if(!s||!frontCanOrder()||state.ap<1||f.taxReceivables<=0||s.months['collect:'+state.elapsed])return;
 const silver=Math.min(12,f.taxReceivables),id='collect-'+state.elapsed;f.taxReceivables-=silver;state.ap--;s.months['collect:'+state.elapsed]=true;
 s.routes.push({id,uid:'ruin-'+id,status:'pending',created:mindTick(),due:mindTick()+3,silver,grain:0,actor:'ye'});ruinTrack('命催解已核旧项'+silver+'，三日送回回执；未向灾户添征，银尚未到库。','催解旧项','ye');save();render();ruinCouncil();
}
function ruinReserve(){const s=ruinState();if(!s||s.reserve||!frontCanOrder()||state.ap<1)return;state.ap--;s.reserve=6;ruinTrack('定月末留续赈现银最多6，其余实付俸饷；旧欠不抹，新欠照记，缺饷后果仍由朝廷承担。','国用取舍','ye');save();render();ruinCouncil();}
function ruinPressureEligible(p){const f=frontEnsure(),m=f.ministers[p.id],r=state.relations[p.id];return m&&m.influence>=50&&r.loyalty<45&&(r.ambition||m.ambition)>=r.loyalty+15;}
function ruinMakePressure(){
 const f=frontEnsure(),s=f.ruin;if(!s||s.pressures.some(c=>['open','checking'].includes(c.status))||s.months['pressure:'+state.elapsed]||mindTick()-s.started<3||s.control>=60)return;
 const p=frontOfficials().filter(p=>ruinPressureEligible(p)&&Object.values(f.heads).includes(p.id)).sort((a,b)=>(f.ministers[b.id].influence-state.relations[b.id].loyalty)-(f.ministers[a.id].influence-state.relations[a.id].loyalty))[0];if(!p)return;
 const dept=FRONT.departments.find(d=>f.heads[d.id]===p.id)?.id||'personnel',id='pressure-'+(++s.serial),c={id,actor:p.id,dept,status:'open',created:mindTick(),deadline:mindTick()+3,delayed:[],revenueWithheld:false};
 // A signature network can delay one already-pending order; never delete its cost or responsibility.
 const target=[...f.orders,...f.affairs].find(o=>o.status==='pending'&&!o.ruinDelayed);
 if(target){target.due+=RUIN_DATA.pressure.delay;target.ruinDelayed=id;c.delayed.push(target.uid);}
 s.pressures.push(c);s.months['pressure:'+state.elapsed]=true;
 ruinTrack(frontName(p.id)+'扣住补签回执，提出先让其荐员代签'+(target?'；一项在办差事已迟两日':'；下一期解银有被留置的风险')+'。尚未查明其余责任，不以此直接认作谋反。','留签索权',p.id);
}
function ruinPressure(id){
 const f=frontEnsure(),s=f.ruin,c=s?.pressures.find(c=>c.id===id);if(!c)return;
 frontOpen(frontName(c.actor)+' · 留签索权','他在殿前仍称“臣不敢”，却将那份待签的回执留在袖边。',
  '<div class="scene-text">“'+({xu:'此事新旧经手交错，臣熟悉其中的人。陛下若允臣所荐之人先过目，下面也少些往返。',ye:'钱粮在路上，签押却还没对齐。陛下不如让臣荐的人先接手，臣也好催下面放行。',lu:'下面缺的是能当场认账的人。陛下若信得过，臣可荐个熟悉军中交收的先看着。'}[c.actor]||'此事原有人熟悉。陛下若允臣所荐之人先行过目，下面交接也省些往返。')+'”</div><p>'+RUIN_DATA.pressure.brief.replace('承办差事因而迟两日。',c.delayed.length?'一项在办差事因而迟两日。':'本次尚未拖及在办差事，却卡住了后续解银。')+'</p><p class="mini">'+(c.delayed.length?'已迟两日的差事：'+c.delayed.map(id=>{const a=f.affairs.find(a=>a.uid===id),o=f.orders.find(o=>o.uid===id);return frontEsc(a?FRONT.events.find(t=>t.id===a.type).title:o?FRONT.tasks.find(t=>t.id===o.task).name:'原承办差事');}).join('、'):'本次尚无在办差事可拖延。')+'</p>'+ruinEntry()+
  (c.status==='open'?'<div class="opts">'+RUIN_DATA.pressure.choices.map(t=>'<button class="opt" data-action="ruinPressureChoose" data-id="'+id+'|'+t.id+'" '+(!frontCanOrder()||state.ap<t.ap?'disabled':'')+'><b>'+t.label+'</b><small>'+t.text+'</small><small>'+t.ap+'行动 · 掌控'+(t.control>=0?'+':'')+t.control+' · '+(t.days?t.days+'日后核验':'立即传旨')+'</small></button>').join('')+'</div>':'<p>'+frontEsc(c.result||'已另派人核验，尚需'+Math.max(0,c.due-mindTick())+'日。')+'</p>')+'<button class="text-btn" data-action="ruinCouncil">回看全局</button>');save();
}
function ruinPressureChoose(raw){
 const [id,key]=String(raw).split('|'),f=frontEnsure(),s=f.ruin,c=s?.pressures.find(c=>c.id===id),t=RUIN_DATA.pressure.choices.find(t=>t.id===key);if(!c||c.status!=='open'||!t||!frontCanOrder()||state.ap<t.ap)return;
 state.ap-=t.ap;c.choice=key;c.status=t.days?'checking':'settled';c.due=mindTick()+t.days;
 if(t.days)c.result='另派无涉此事的官员点验，尚待两日回签；已误日期仍记原账。';
 else{ruinChange(t.control,t.tension,c.actor,t.influence);c.result=t.text;ruinTrack(frontName(c.actor)+'留签处置：'+t.label+'。'+t.text,'朝权交涉',c.actor);}
 save();render();ruinPressure(id);
}
function ruinRevenue(income,month){
 const f=state.frontCourt,s=f?.ruin;if(!s)return income;
 const c=s.pressures.find(c=>['open','checking'].includes(c.status));if(!c||s.months['withheld:'+month])return income;
 const withheld=Math.min(RUIN_DATA.pressure.holdback,income);if(!withheld)return income;
 s.months['withheld:'+month]=withheld;c.revenueWithheld=true;f.taxReceivables+=withheld;
 ruinTrack(frontName(c.actor)+'经手的补签尚未交齐，本期解银'+withheld+'留在原处，改列待解，未入现银。','解银留置',c.actor);return income-withheld;
}
function ruinMonth(month){
 const f=frontEnsure(),s=f.ruin;if(!s||s.months['debt:'+month])return;s.months['debt:'+month]=true;
 const silver=Math.min(6,s.debt.silver,f.treasury),grain=Math.min(4,s.debt.grain,f.grain);
 if(silver||grain){f.treasury-=silver;f.grain-=grain;s.debt.silver-=silver;s.debt.grain-=grain;s.debt.paidSilver+=silver;s.debt.paidGrain+=grain;frontLedger('旧借据实还',-silver,-grain,'叶氏借据本月实还；余银债'+s.debt.silver+'、粮债'+s.debt.grain+'。');}
 if(s.debt.silver||s.debt.grain)ruinTrack('叶氏借据尚余银'+s.debt.silver+'、粮'+s.debt.grain+'；不足者留账，不凭月底划清。','借据催还','ye');
}
function ruinDay(key){
 const f=frontEnsure(),s=f.ruin;if(!s||s.days[key])return;s.days[key]=true;
 for(const o of s.routes)if(o.status==='pending'&&mindTick()>=o.due)ruinCompleteRoute(o);
 for(const c of s.pressures){
  if(c.status==='checking'&&mindTick()>=c.due){const t=RUIN_DATA.pressure.choices.find(t=>t.id===c.choice);c.status='settled';c.result='补签与原册已核，留解解除；只据本次经手追责，不增添未经查证的谋逆罪名。';ruinChange(t.control,t.tension,c.actor,t.influence);ruinTrack(frontName(c.actor)+'交回补签，另员点验已成。','交签回报',c.actor);}
  if(c.status==='open'&&mindTick()>c.deadline&&!c.neglected){c.neglected=true;ruinChange(-2,3,c.actor,2);ruinTrack(frontName(c.actor)+'的索权仍未议定，诸部继续等补签；对方的试探多了一分把握。','留签逾期',c.actor);}
 }
 ruinMakePressure();for(const k of Object.keys(s.days).slice(0,-100))delete s.days[k];
}
const ruinQualityBefore=frontQuality;frontQuality=function(actor,dept,uid){const q=ruinQualityBefore(actor,dept,uid),s=state.frontCourt?.ruin;if(!s)return q;const penalty=Math.round(Math.max(0,60-s.control)/6);return {...q,controlPenalty:penalty,score:q.score-penalty,passed:q.score-penalty>=62};};
const ruinFinishOrderBefore=frontFinishOrder;frontFinishOrder=function(o){const pending=o.status==='pending';ruinFinishOrderBefore(o);if(pending&&o.status!=='pending'&&ruinState())ruinChange(o.status==='completed'?2:-1);};
const ruinFinishAffairBefore=frontFinishAffair;frontFinishAffair=function(a){const pending=a.status==='pending';ruinFinishAffairBefore(a);if(pending&&a.status!=='pending'&&ruinState())ruinChange(a.status==='completed'?2:-1);};
const ruinMonthBefore=frontMonth;frontMonth=function(month){const existed=state.frontCourt?.months[month];ruinMonthBefore(month);if(!existed)ruinMonth(month);};
const ruinDayBefore=frontDay;frontDay=function(key){ruinDayBefore(key);ruinDay(key);};
const ruinConditionsBefore=frontConditions;frontConditions=function(){const out=ruinConditionsBefore();if(!state.frontCourt?.ruin)return out;const order=['deficit','famine','border','flood','transport','epidemic','examleak','trade'];return out.sort((a,b)=>order.indexOf(a[0])-order.indexOf(b[0]));};
const ruinAffairsBefore=frontAffairsBody;frontAffairsBody=function(){const s=ruinState();return (s?'<div class="approval-entry"><b>先帝遗局：可拨银'+state.frontCourt.treasury+'、粮'+state.frontCourt.grain+'，积欠'+state.frontCourt.arrears+'。</b><p>先决定从何处点交钱粮，才有能力续赈与援饷。开局三策均可不先花国库钱粮。</p><button class="btn primary" data-action="ruinCouncil">议救急与朝权</button></div>':'')+ruinAffairsBefore();};
const ruinFinanceBefore=frontFinanceBody;frontFinanceBody=function(){const s=ruinState();return ruinFinanceBefore()+(s?'<h4>权臣借据</h4><p>另欠叶氏银'+s.debt.silver+'、粮'+s.debt.grain+'。每月只按剩余现银实还最多6、仓粮最多4；未还保留。</p><button class="btn ghost" data-action="ruinCouncil">看点交来源与朝权</button>':'');};
const ruinNoticesBefore=importantNotices;importantNotices=function(){const out=ruinNoticesBefore(),s=ruinState();if(!s)return out;const prefix=[];
 if(!s.routes.length)prefix.push({id:'ruin-opening',title:'空库与欠饷，请先定可用钱粮',text:'陛下，能拨的银粮都是零。旧库、欠解与叶氏垫付各有代价，请先定其中一策。',action:'ruinCouncil',unread:true});
 for(const c of s.pressures.filter(c=>c.status==='open'))prefix.push({id:c.id,title:frontName(c.actor)+'留签索权',text:'陛下，有回执被扣住了。对方愿交签，却要让其荐员先过目。已有迟滞，请定处理。',action:'ruinPressure',arg:c.id,unread:true});
 return prefix.concat(out);
};window.__courierAudit.importantNotices=importantNotices;
const ruinHallBefore=hallCourt;hallCourt=function(){const html=ruinHallBefore(),s=ruinState();return s?html.replace('<div class="audience-time">','<div class="audience-time"><button data-action="ruinCouncil">危局 · 掌控'+s.control+'</button>'):html;};finalCourt=hallCourt;worldCourt=hallCourt;
const ruinBooksBefore=hallBooks;hallBooks=function(){ruinBooksBefore();if(ruinState())$('modalBody').insertAdjacentHTML('afterbegin','<button class="opt" data-action="ruinCouncil"><b>风雨登基 · 钱粮与朝权</b><small>旧库点交、借据、权臣底牌与留签。</small></button>');};
const ruinSummaryBefore=strifeSummary;strifeSummary=function(){const s=ruinState();return s?'<div class="card strife-card"><div class="section-heading"><h3>风雨中的朝局</h3><span class="tag">'+(s.control<35?'皇权未稳':s.control<60?'渐收权柄':'朝权渐稳')+'</span></div><div class="strife-meters"><div><small>掌控</small><b>'+s.control+'</b></div><div><small>边患</small><b>'+state.strife.threat+'</b></div><div><small>内斗</small><b>'+state.strife.factionTension+'</b></div><div><small>欠饷</small><b>'+state.frontCourt.arrears+'</b></div></div><p class="mini">钱粮、签押与荐举尚有旧臣把持。个人亲近不等于臣服，办成差事才逐步收回权柄。</p><button class="btn ghost wide" data-action="ruinCouncil">看救急与朝权</button></div>':ruinSummaryBefore();};
const ruinIntroBefore=intro;intro=function(){if(!ruinState()){ruinIntroBefore();return;}frontOpen('风雨登基','十九岁继位，接到的是空库、欠饷与满殿试探。','<div class="scene-text">'+RUIN_DATA.intro+'</div><p>国库可拨银0、仓粮0；积欠96，内帑仅余8。诸地水患、缺粮、吏弊交错，边镇催饷，皇权掌控18。</p><p>先从殿内“危局”筹措：旧库点交、催解旧税，或接受权臣垫付。三策都不先花国库钱粮，但要等回执，也各有代价。</p><p class="mini">每月15行动，入朝1点。旧存档继续原局势，不强制归零；重新开局使用此设定。</p><button class="btn primary wide" data-action="introDone">临朝，先看空库册</button>');};
const ruinRenderBefore=render;render=function(){ruinRenderBefore();const screen=$('screen');if(screen&&state.tab==='notes'&&!screen.querySelector('.ruin-new-book'))screen.insertAdjacentHTML('beforeend','<section class="card section-space ruin-new-book"><h3>另起风雨登基新局</h3><p>新局从空库、欠饷和权臣试探开始。此操作会清除当前浏览器这一份试玩进度，确认前可先导出。</p><div class="actions"><button class="btn ghost" data-action="export">先导出当前存档</button><button class="btn ghost" data-action="reset">查看重新开局确认</button></div></section>');};
Object.assign(actions,{ruinCouncil,ruinRoute,ruinEnter,ruinPressure,ruinPressureChoose,ruinCollect,ruinReserve});
// Hook runs both on a genuine new save and on reset; legacy saves have no scenario marker.
frontEnsure();if(ruinState()){const s=ruinState();if(!s.reportsPrepared){s.reportsPrepared=true;state.frontCourt.affairs=state.frontCourt.affairs.filter(a=>a.status!=='presented'||a.choice);}frontCreateAffairs();ruinDay(todayKey());}
window.__ruinAudit={version:'13.6',state:ruinState,day:ruinDay,init:ruinInit,eligible:ruinPressureEligible};
