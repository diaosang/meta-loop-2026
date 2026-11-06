/* A smaller court front end. Decisions still use the original guarded commands and accounts. */
const SIMPLE_COURT = {
  departments: {personnel:'选用官员', revenue:'管钱粮', rites:'办学选才', war:'整顿军务', justice:'查案伸冤', works:'修桥治水'},
  tasks: {audit:'查官员办事好不好', inspect:'派人查地方官', granary:'清点和补充粮仓', farming:'帮百姓恢复耕种', school:'修学堂、添书本', exam:'开科考试，选用人才', training:'操练边军', garrison:'查守军和驻地', review:'重查疑案', prison:'清查久拖未审的案子', water:'修堤坝、疏通水道', roads:'修桥铺路'},
  events: {
    flood: ['两府遭了水灾', '陛下，{region}与邻府遭了水灾。地方已先开仓救急，如今粮食不够，还请朝廷接济，并定灾户的税该如何减免。', {relief:['送粮救灾，减免灾户的税','救急与修堤一并办，再派人查清受灾田亩。'],audit:['先送一批口粮，查清再补','先解眼前之急，等灾情核实后再定后续接济。'],delegate:['请邻府接济，朝廷帮运粮','朝廷少花些钱粮，但地方要多担一些。']}],
    famine: ['百姓缺粮，也缺来年的种子', '陛下，{region}接连歉收。地方已开仓接济，可百姓吃饭和来年播种仍难两全，还需朝廷补给。', {relief:['口粮和种子一并送去','先让百姓吃上饭，也顾着来年耕种；灾户的税暂缓收。'],loan:['先保住种子，再接济口粮','保住农时，口粮按查明的户数接济。'],market:['从外地运粮，官仓补一部分','让粮商按公道价运粮，朝廷也出一部分；运到前仍有缺口。']}],
    transport: ['运来的粮食少了一批', '陛下，运粮的船到了，入仓的数却对不上。各处账册说法不一，眼下已先补了军粮，短缺和经手责任还须查清。', {joint:['分头查账，再定谁有过错','收齐各处原账，保护证人，不凭一面之词拿人。'],recover:['先补运粮食，让经手衙门查账','补粮较快，但自查之后仍须复核。'],suspend:['换人运粮，原经手人先回避','先停这件事的经手权；有无罪责，查清再论。']}],
    border: ['边境遭袭，守军请援', '陛下，北境几处驿路遭袭，守军正在固守。兵部请补钱粮、调邻镇协防，还待陛下定夺。', {reinforce:['补钱粮，调邻镇一起守','先稳住守备和运粮，不许将领贪功冒进。'],fortify:['先修好防守，再查敌情','用度较少，眼下仍要靠边军守住。'],envoy:['守住边境，再派使者探问','备好基本军需，试着缓和局势。']}],
    examleak: ['有人告发考官收礼', '陛下，几名考生具名告发主考收礼，礼单已封存。考试不能尽废，涉事考官是否回避、试卷如何复查，还请陛下定夺。', {protect:['保护告发者，另派人查试卷','让涉事考官回避，分头查证，不急着定罪。'],ministry:['让礼部先查，再派人抽查','手续较快，但要防着原衙门相互遮掩。'],retest:['封存有疑的试卷，另行复试','多花一些钱，重核有疑的场次，其余考试照常。']}],
    trade: ['邻国想用马匹换丝绸', '陛下，邻国使者带来国书，想以马匹换丝绸。身份已验明，往来多少、如何验货收税，还需朝廷定下来。', {trial:['先换一小批，验过货再说','先试一次，再商量往后定额。'],limited:['照旧往来，先不增加','守住原有规矩，所得也少一些。'],delay:['先回书，等边防查清再谈','暂缓立约，仍保留往来。']}],
    deficit: ['钱粮不够，先保哪一头？', '陛下，库中钱粮不够，旧欠也未付清。官兵俸饷、地方救急与在办差事难以同时顾全，还请陛下定个先后。', {austerity:['先停不急的开销','暂缓两月非急常费，旧欠仍留账，不能当作已经还清。'],levy:['暂时多收一笔税','办好后收银30，先补旧欠最多8；百姓的负担会更重。'],audit:['追回欠税，分批还旧欠','从已核实的欠税中收回最多18，补旧欠最多10；未收到的不算库银。']}],
    epidemic: ['两地疫病，缺医少药', '陛下，{region}与邻地病者增多。医官已去救治，可药材和口粮都缺，还需朝廷调给。', {full:['医药和口粮一并送去','救治与接济一起办，另派人查病从何来。'],target:['先把医药送到病情最重的地方','先补最急的缺口，其余地方还须接着看诊。'],local:['请邻府派医官，朝廷补药钱','花费较少，但地方恢复得慢些。']}]
  }
};
const simpleCourtEsc = mindEscape;
let simpleCourtDraft = null;
const simpleCourtLegacy = {side:actions.courtSide, dept:actions.courtDept, prepare:actions.frontPrepareReview, nextReview:actions.frontNextMonthReview, retry:actions.frontRetry, appoint:actions.frontAppoint};
function simpleCourtButton(action,id,label,primary=false,disabled=false){return '<button class="btn '+(primary?'primary':'ghost')+'" data-action="'+action+'" data-id="'+simpleCourtEsc(id||'')+'"'+(disabled?' disabled':'')+'>'+simpleCourtEsc(label)+'</button>';}
function simpleCourtDetails(title,body){return '<details class="simple-court-details"><summary>'+simpleCourtEsc(title)+'</summary>'+body+'</details>';}
function simpleCourtOpen(title,body,back='simpleCourtAffairs'){
  openModal(title,'', '<div class="simple-court-panel">'+(back?'<button class="text-btn simple-court-back" data-action="'+back+'">← '+(back==='simpleCourtHall'?'回大殿':back==='simpleCourtProgress'?'回办理进度':back==='simpleCourtWork'?'重新选一件事':'回今日要事')+'</button>':'')+body+'</div>','前朝 · 大梁');
}
function simpleCourtRulerAlive(){const w=state.world16;return !w||w.people[w.dynasty.rulerId]?.alive!==false;}
function simpleCourtTitle(a){return SIMPLE_COURT.events[a.type]?.[0]||FRONT.events.find(t=>t.id===a.type)?.title||'待议之事';}
function simpleCourtQueue(){return frontEnsure().affairs.filter(a=>['presented','overdue'].includes(a.status)).slice().sort((a,b)=>(a.status!=='overdue')-(b.status!=='overdue')||a.deadline-b.deadline||a.created-b.created);}
function simpleCourtPressures(){return (frontEnsure().ruin?.pressures||[]).filter(p=>p.status==='open');}
function simpleCourtFundsPending(){return (frontEnsure().ruin?.routes||[]).filter(r=>r.status==='pending');}
function simpleCourtGuide(){
  const f=frontEnsure(),queue=simpleCourtQueue(),funds=simpleCourtFundsPending(),untried=RUIN_DATA.routes.some(t=>!f.ruin?.routes.some(r=>r.id===t.id));
  if(!simpleCourtRulerAlive())return {text:'先帝已逝。请先在家人和传承中选定继承人。',label:'家人和传承',action:'world16Dynasty'};
  if(!frontCanOrder())return {text:isAway()?'正在巡游，回京后再召百官。':courtStatus()==='left'?'今日已退朝。先去歇息，明日再议。':'百官已候在殿外，入朝后再作安排。',label:'查看今日要事',action:'simpleCourtAffairs'};
  if((f.grain===0||f.treasury===0)&&!funds.length&&untried)return {text:'库里钱粮不够，先清点旧库，找出能用的。',label:'先找钱粮',action:'simpleCourtFunds'};
  if(queue.length)return {text:'有'+queue.length+'件事等你定夺。先看眼前要紧的，闲事交给各部。',label:'先看要紧事',action:'simpleCourtAffairs'};
  if(funds.length)return {text:'钱粮已有着落，还在路上。可以先看进度，再退朝见人。',label:'看钱粮何时送到',action:'simpleCourtProgress'};
  return {text:'暂时没有新事请旨。可以安排地方事务，也可以退朝歇一歇。',label:'安排一件事',action:'simpleCourtWork'};
}
hallCourt=function(){
  ensureCourtScene();const f=frontEnsure(),guide=simpleCourtGuide();
  return '<section class="audience restored-court simple-court" aria-label="奉天殿上朝"><div class="hall-art">'+hallSvg()+'</div><header class="audience-status"><b>'+simpleCourtEsc(date())+' · '+state.day+'日</b><span>朝廷银 '+f.treasury+'　仓粮 '+f.grain+'</span><span>今天还能安排 '+state.ap+' 件</span></header><div class="audience-label">奉天殿</div><aside class="audience-menu" aria-label="御前事务">'+[
    ['simpleCourtAffairs','今日要事'],['simpleCourtWork','安排办事'],['simpleCourtProgress','办理进度'],['simpleCourtMore','更多'],['simpleCourtLeave','退朝']
  ].map(([action,label])=>'<button data-action="'+action+'">'+label+'</button>').join('')+'</aside><div class="simple-court-guide"><b>今日先办</b><p>'+simpleCourtEsc(guide.text)+'</p>'+simpleCourtButton(guide.action,'',guide.label,true)+'</div><nav class="audience-depts" aria-label="前朝衙门">'+[
    ['吏','选人','吏部'],['户','钱粮','户部'],['礼','人才','礼部'],['兵','军务','兵部'],['刑','查案','刑部'],['工','修建','工部']
  ].map(([id,label,dept])=>'<button data-action="courtDept" data-id="'+id+'" aria-label="'+dept+' · '+label+'"><b>'+label+'</b><small>'+dept+'</small></button>').join('')+'</nav><div class="audience-caption">先看要事，选好办法，再等回报。其余簿册在「更多」。</div></section>';
};finalCourt=hallCourt;worldCourt=hallCourt;
const simpleCourtBeforeStrife=strifeSummary;strifeSummary=function(){return state.tab==='court'?'':simpleCourtBeforeStrife();};

function simpleCourtGate(context,ap=1){
  if(!simpleCourtRulerAlive())return '<p class="simple-court-notice">先帝已逝，须先安排传位。</p>'+simpleCourtButton('world16Dynasty','','家人和传承',true);
  if(isAway())return '<p class="simple-court-notice">正在地方巡游，先回京再安排此事。</p>'+simpleCourtButton('simpleCourtEnter',context,'结束巡游，回京',true);
  if(courtStatus()==='left')return '<p class="simple-court-notice">今日已退朝，明日再召百官。此事仍会留着。</p>'+simpleCourtButton('simpleCourtSleepAsk',context,'明天上朝继续',true);
  if(state.ap<ap+(frontCanOrder()?0:1))return '<p class="simple-court-notice">今天余力不足，歇一夜再办。事情和期限仍会照常往前走。</p>'+simpleCourtButton('simpleCourtSleepAsk',context,'睡一觉，明天继续',true);
  if(!frontCanOrder())return '<p class="simple-court-notice">先入朝，再让百官接下这件事。入朝用1次安排，办事另计。</p>'+simpleCourtButton('simpleCourtEnter',context,'入朝继续 · 1次安排',true);
  return '';
}
function simpleCourtResume(context){const i=context.indexOf(':'),kind=i<0?context:context.slice(0,i),id=i<0?'':context.slice(i+1);({affair:()=>simpleCourtAffair(id),funds:simpleCourtFunds,work:()=>simpleCourtWorkConfirm(id,true),task:()=>simpleCourtTask(id),finance:simpleCourtFinance,people:()=>simpleCourtAppointments(id),pressure:()=>simpleCourtPressure(id) }[kind]||simpleCourtAffairs)();}
function simpleCourtEnter(context){
  if(!simpleCourtRulerAlive())return world16Dynasty();
  if(isAway()){returnTour();simpleCourtResume(context);return;}
  const workAP=context.startsWith('pressure:')?0:context.startsWith('task:')?(FRONT.tasks.find(t=>t.id===context.slice(5).split('|')[0])?.ap??1):1;
  if(courtStatus()==='left'||state.ap<workAP+(frontCanOrder()?0:1)){simpleCourtSleepAsk(context);return;}
  if(!frontCanOrder()){closeModal();actions.tab('court');}
  simpleCourtResume(context);
}
function simpleCourtSleepAsk(context){simpleCourtOpen('歇一夜，明日再议？','<p>只过一日。钱粮、在办差事和奏事期限照常推进，醒来后回到这件事。</p>'+simpleCourtButton('simpleCourtSleep',context,'歇一夜，明日继续',true)+simpleCourtButton('simpleCourtResume',context,'先不歇，回去看看'),'simpleCourtHall');}
function simpleCourtSleep(context){
  if(!simActive()){simpleCourtOpen('先把今日安排好','<p>这份旧进度仍按月安排。可回宫门开启按日经营，沿用现有的人物和账册。</p>'+simpleCourtButton('simStart','','接着按日经营',true),'simpleCourtHall');return;}
  actions.simSleep();simpleCourtEnter(context);
}
function simpleCourtAffairs(){
  frontCreateAffairs();const queue=simpleCourtQueue(),pressure=simpleCourtPressures();
  const cards=queue.map(a=>'<article class="simple-court-row"><span class="tag">'+(a.status==='overdue'?'已耽搁，请尽快定夺':'还剩'+Math.max(0,a.deadline-mindTick())+'日定夺')+'</span><h3>'+simpleCourtEsc(simpleCourtTitle(a))+'</h3><p>'+simpleCourtEsc(regionOf(a.region).name)+' · '+simpleCourtEsc(frontName(a.actor))+'候旨</p>'+simpleCourtButton('simpleCourtAffair',a.uid,'听禀报，拿主意',true)+'</article>');
  simpleCourtOpen('今日要事','<p class="simple-court-intro">'+(queue.length?'这'+queue.length+'件事需要你定夺。地方小事由各部照常办理。':'今日暂无新的要事请旨。')+'</p>'+cards.join('')+pressure.map(p=>'<article class="simple-court-row"><h3>'+simpleCourtEsc(frontName(p.actor))+'扣着回执不肯交</h3><p>办事被耽搁了，须定个处置办法。</p>'+simpleCourtButton('simpleCourtPressure',p.id,'问清原委',true)+'</article>').join('')+(!queue.length&&!pressure.length?simpleCourtButton('simpleCourtProgress','','看看先前办到哪了'):'')+(frontEnsure().treasury===0||frontEnsure().grain===0?'<div class="simple-court-notice">钱粮不够时，先找一笔能动用的。'+simpleCourtButton('simpleCourtFunds','','先找钱粮')+'</div>':''),'simpleCourtHall');
}
function simpleCourtCost(c){return '用银'+c.money+' · 用粮'+c.grain+' · 约'+c.days+'日后回报';}
function simpleCourtShortage(c){const f=frontEnsure(),parts=[];if(f.treasury<c.money)parts.push('银'+(c.money-f.treasury));if(f.grain<c.grain)parts.push('粮'+(c.grain-f.grain));return parts.length?'还缺'+parts.join('、'):'';}
function simpleCourtAffair(id){
  const a=frontEnsure().affairs.find(a=>a.uid===id),t=a&&FRONT.events.find(t=>t.id===a.type);if(!a||!t)return;
  const data=SIMPLE_COURT.events[a.type],can=['presented','overdue'].includes(a.status),gate=can||a.status==='needs-work'?simpleCourtGate('affair:'+id):'';
  const noticeId='front:'+a.uid+':'+a.status;if(can||a.status==='needs-work')delete courierState().seen[noticeId];else courierState().seen[noticeId]=mindTick();
  let body='<div class="scene-text">“'+simpleCourtEsc((data?.[1]||t.brief).replaceAll('{region}',regionOf(a.region).name))+'”</div>';
  if(can){
    body+='<p class="mini">'+simpleCourtEsc(frontName(a.actor))+'承办 · '+(a.status==='overdue'?'已过原定期限，请尽快定夺。':'还剩'+Math.max(0,a.deadline-mindTick())+'日定夺。')+'</p>'+gate;
    if(t.choices.every(c=>!!simpleCourtShortage(c)))body+='<p class="simple-court-notice">眼下钱粮还不够。先找到钱粮，再回来定办法。</p>'+simpleCourtButton('simpleCourtFunds','','先找钱粮',true);
    const options='<div class="opts">'+t.choices.map(c=>{
      const copy=data?.[2]?.[c.id]||[c.label,c.description],lack=simpleCourtShortage(c),blocked=!!gate||!!lack;
      return '<button class="opt" data-action="simpleCourtDecide" data-id="'+id+'|'+c.id+'"'+(blocked?' disabled':'')+'><b>'+simpleCourtEsc(copy[0])+'</b><small>'+simpleCourtEsc(copy[1])+'</small><small>'+simpleCourtCost(c)+' · 1次安排'+(lack?' · '+lack:'')+'</small></button>';
    }).join('')+'</div>';
    body+='<h3>这件事怎么办？</h3>'+(t.choices.every(c=>!!simpleCourtShortage(c))?simpleCourtDetails('先看看可选的办法（钱粮未齐）',options):options);
  }else{
    const c=t.choices.find(c=>c.id===a.choice),label=data?.[2]?.[c?.id]?.[0]||c?.label||'原定安排';
    body+='<h3>'+(a.status==='pending'?'已经交下去办了':a.status==='needs-work'?'这件事还没办妥':'已收到回报')+'</h3><p>'+simpleCourtEsc(label)+'。</p><p>'+simpleCourtEsc(frontName(a.actor))+(a.status==='pending'?'正在办理，约'+Math.max(0,a.due-mindTick())+'日后回报。':a.status==='needs-work'?'送来的回报不全，原定事情只办好了一部分。':'已把办事结果呈上。')+'</p>';
    if(a.status==='needs-work'&&!a.retried)body+=gate+simpleCourtButton('simpleCourtRetry','affair|'+id,'补派人复查 · 用银'+Math.ceil((a.cost?.money||0)*.35)+' / 粮'+Math.ceil((a.cost?.grain||0)*.25)+' / 1次安排',true,!!gate||!!simpleCourtShortage({money:Math.ceil((a.cost?.money||0)*.35),grain:Math.ceil((a.cost?.grain||0)*.25)}));
    if(a.result)body+=simpleCourtDetails('看完整回报','<p>'+simpleCourtEsc(a.result)+'</p>');
    body+=simpleCourtButton('simpleCourtAffairs','','下一件要事',true)+simpleCourtButton('simpleCourtProgress','','看看办理进度');
  }
  body+=simpleCourtDetails('想先听听官员怎么说？',frontAdvice(a))+simpleCourtDetails('查看原奏与凭据','<p>'+simpleCourtEsc(frontAffairText(a,t.brief))+'</p>'+t.evidence.map(x=>'<p>'+simpleCourtEsc(x)+'</p>').join(''));
  if(!can)body+=simpleCourtDetails('看看臣子的反应',frontReactionHtml(a.decisionReactions)+frontReactionHtml(a.resultReactions)||'<p>尚无新回话。</p>');
  if(can)body+=simpleCourtDetails('查看预计变化',t.choices.map(c=>'<p>'+simpleCourtEsc(data?.[2]?.[c.id]?.[0]||c.label)+'：'+simpleCourtEsc(frontEffects(c.effects))+'</p>').join(''));
  simpleCourtOpen(simpleCourtTitle(a),body);save();
}
function simpleCourtDecide(raw){const [id]=String(raw).split('|');frontDecide(raw);simpleCourtAffair(id);}

function simpleCourtFunds(){
  const f=frontEnsure(),s=f.ruin;if(!s)return simpleCourtFinance();
  const labels={inventory:['清点旧仓库','先找出还没交清的钱粮，核清后送来。'],collect:['催各地交回欠税','收回本来就欠着朝廷的钱粮，不能凭空添一笔。'],advance:['向叶家借钱粮','到账快些，但以后要还，也会更倚重叶家。']};
  const gate=simpleCourtGate('funds');
  simpleCourtOpen('先找钱粮','<p>朝廷银'+f.treasury+'，仓粮'+f.grain+'。先选一条办法，钱粮送到后才能花。</p>'+gate+RUIN_DATA.routes.map(t=>{
    const done=s.routes.find(o=>o.id===t.id),pool=t.pool==='receivables'?{money:f.taxReceivables,grain:s.pools.outsideGrain}:s.pools[t.pool],money=Math.min(t.money,pool?.money||0),grain=Math.min(t.grain,pool?.grain||0),label=labels[t.id]||[t.title,t.description];
    return '<article class="simple-court-row"><h3>'+label[0]+'</h3><p>'+label[1]+'</p>'+(done?'<p class="tag">'+(done.status==='pending'?'正在清点或转运，还需'+Math.max(0,done.due-mindTick())+'日':'已经送到过了，这条不能重复领')+'</p>':'<p>可送来银'+money+'、粮'+grain+' · '+t.days+'日后到 · 1次安排</p>'+(t.id==='advance'?'<p class="mini">会欠叶家银42、粮40，往后按月偿还。</p>':'')+simpleCourtButton('simpleCourtFund',t.id,'就这样办',t.id==='inventory',!!gate||money+grain===0))+'</article>';
  }).join('')+simpleCourtDetails('往后还能怎样收钱？','<p>已经核实的欠税还余'+f.taxReceivables+'。每月可催收最多12，三日后送来；本月已催过便须等下月。</p>'+simpleCourtButton('simpleCourtCollect','','催收这笔欠税 · 1次安排',false,!!gate||f.taxReceivables<=0||!!s.months['collect:'+state.elapsed])),'simpleCourtHall');
}
function simpleCourtFund(id){
  const s=frontEnsure().ruin,before=s?.routes.length||0;ruinRoute(id);if(!s||s.routes.length===before)return simpleCourtFunds();
  const r=s.routes.at(-1);simpleCourtOpen('已经吩咐下去了','<p>'+simpleCourtEsc(frontName(r.actor))+'已接下此事，约'+Math.max(0,r.due-mindTick())+'日后送来银'+r.silver+'、粮'+r.grain+'。</p><p class="mini">钱粮还在清点或路上，尚未记入库中。</p>'+simpleCourtButton('simpleCourtAffairs','','再看一件要事',true)+simpleCourtButton('simpleCourtProgress','','看办理进度'),'simpleCourtHall');
}
function simpleCourtCollect(){const s=frontEnsure().ruin,n=s?.routes.length||0;ruinCollect();if(s&&s.routes.length>n){simpleCourtProgress();}else simpleCourtFunds();}

function simpleCourtJobs(){
  const f=frontEnsure(),rows=[];
  for(const r of f.ruin?.routes||[])rows.push({key:'route:'+r.id,name:r.id==='inventory'?'清点旧仓库':r.id==='advance'?'向叶家借的钱粮':r.id==='collect'?'催收欠税':'收回朝廷欠税',actor:r.actor,status:r.status==='pending'?'pending':'completed',due:r.due,finished:r.completed||r.due,text:r.result||'',money:r.silver,grain:r.grain});
  for(const j of state.simulation?.jobs||[])rows.push({key:'job:'+j.id,name:regionOf(j.region).name+' · '+j.name,actor:j.actor,status:j.status==='done'?'completed':j.status,due:j.due,finished:j.finished||j.due,text:state.simulation.events.find(e=>e.job===j.id&&e.kind==='地方回奏')?.text||'',money:j.money,grain:j.grain});
  for(const a of f.affairs.filter(a=>!['presented','overdue'].includes(a.status)))rows.push({key:'affair:'+a.uid,name:simpleCourtTitle(a),actor:a.actor,status:a.status,due:a.due,finished:a.completed||a.due,text:a.result||''});
  for(const o of f.orders)rows.push({key:'order:'+o.uid,name:regionOf(o.region).name+' · '+(SIMPLE_COURT.tasks[o.task]||FRONT.tasks.find(t=>t.id===o.task)?.name),actor:o.actor,status:o.status,due:o.due,finished:o.completed||o.due,text:o.result||'',money:o.cost?.money,grain:o.cost?.grain});
  return rows.sort((a,b)=>(a.due??0)-(b.due??0));
}
function simpleCourtJobRow(row){const pending=row.status==='pending',label=pending?'还需'+Math.max(0,row.due-mindTick())+'日':row.status==='completed'?'已回报':row.status==='needs-work'?'还没办妥':'原安排中断';return '<article class="simple-court-row"><span class="tag">'+label+'</span><h3>'+simpleCourtEsc(row.name)+'</h3><p>'+simpleCourtEsc(frontName(row.actor))+(pending?'正在办。':'原先承办。')+'</p>'+simpleCourtButton('simpleCourtJob',row.key,pending?'看这件事':'看回报')+'</article>';}
function simpleCourtProgress(){const rows=simpleCourtJobs(),active=rows.filter(r=>r.status!=='completed'),done=rows.filter(r=>r.status==='completed').sort((a,b)=>b.finished-a.finished).slice(0,8);simpleCourtOpen('办理进度','<p>下过的旨意与安排都记在这里。尚未回报的，不会算作办好了。</p>'+(active.length?active.map(simpleCourtJobRow).join(''):'<p class="simple-court-notice">暂时没有在办的事。</p>')+(done.length?simpleCourtDetails('已回报的 '+done.length+' 件',done.map(simpleCourtJobRow).join('')):''),'simpleCourtHall');}
function simpleCourtJob(key){const row=simpleCourtJobs().find(r=>r.key===key);if(!row)return;const kind=key.slice(0,key.indexOf(':')),id=key.slice(key.indexOf(':')+1);if(kind==='affair')return simpleCourtAffair(id);if(kind==='order')return simpleCourtOrder(id);
  simpleCourtOpen(row.name,'<p>'+simpleCourtEsc(frontName(row.actor))+(row.status==='pending'?'正在办，约'+Math.max(0,row.due-mindTick())+'日后回报。':row.status==='completed'?'已送来回报。':'原安排已中断，须另派人重新办理。')+'</p>'+(kind==='route'?'<p>这笔银'+row.money+'、粮'+row.grain+(row.status==='pending'?'尚在路上。':'已照实入账。')+'</p>':'<p>原先用银'+row.money+'、粮'+row.grain+'。</p>')+(row.text?'<div class="scene-text">'+simpleCourtEsc(row.text)+'</div>':'')+simpleCourtButton('simpleCourtAffairs','','再看今日要事'),'simpleCourtProgress');
}

function simpleCourtWork(){
  if(!simActive())return simpleCourtDept('revenue');
  simpleCourtOpen('想先办什么？','<p>先选一件事，下一步再定地方和人选。</p><div class="opts">'+REALM_DATA.projects.map(p=>'<button class="opt" data-action="simpleCourtWorkConfirm" data-id="'+p.id+'"><b>'+simpleCourtEsc(p.name)+'</b><small>'+simpleCourtCost(p)+'</small></button>').join('')+'</div>','simpleCourtHall');
}
function simpleCourtBusy(id){const a=state.simulation?.actors.find(a=>a.id===id);return !!(a?.busyUntil>simTick()||state.simulation?.jobs.some(j=>j.status==='pending'&&j.actor===id)||frontEnsure().orders.some(o=>o.status==='pending'&&o.actor===id));}
function simpleCourtWorkConfirm(id,keep=false){
  const p=REALM_DATA.projects.find(p=>p.id===id);if(!p||!simActive())return;
  const all=frontOfficials().slice().sort((a,b)=>frontAbility(b,p.skill)-frontAbility(a,p.skill)||a.id.localeCompare(b.id)),available=all.filter(a=>!simpleCourtBusy(a.id));
  if(!keep||simpleCourtDraft?.kind!=='project'||simpleCourtDraft.id!==id)simpleCourtDraft={kind:'project',id,region:frontEnsure().region||'capital',actor:available[0]?.id||''};
  const draft=simpleCourtDraft,actor=all.find(a=>a.id===draft.actor),gate=simpleCourtGate('work:'+id),lack=simpleCourtShortage(p),duplicate=state.simulation.jobs.some(j=>j.status==='pending'&&j.type===id&&j.region===draft.region),days=p.days+(actor&&frontAbility(actor,p.skill)<45?1:0);
  simpleCourtOpen(p.name,'<p>定好地方和人选，再交下去办。只查看、换人选都不花钱粮。</p>'+gate+'<label class="simple-court-field">办在哪儿<select data-simple-court="project-region">'+REGIONS.map(r=>'<option value="'+r.id+'"'+(r.id===draft.region?' selected':'')+'>'+r.name+'</option>').join('')+'</select></label><label class="simple-court-field">派谁去办<select data-simple-court="project-actor">'+(!available.length?'<option value="">眼下无人得闲</option>':'')+all.map(a=>'<option value="'+a.id+'"'+(a.id===draft.actor?' selected':'')+(simpleCourtBusy(a.id)?' disabled':'')+'>'+simpleCourtEsc(a.name)+' · '+(simpleCourtBusy(a.id)?'正在办别的差事':frontAbility(a,p.skill)>=60?'比较擅长':frontAbility(a,p.skill)>=45?'做得来':'还不熟练')+'</option>').join('')+'</select></label><p class="simple-court-cost">用银'+p.money+' · 用粮'+p.grain+' · 约'+days+'日后回报 · 1次安排</p>'+(lack?'<p class="simple-court-notice">'+lack+'。</p>'+simpleCourtButton('simpleCourtFunds','','先找钱粮'):'')+(duplicate?'<p class="simple-court-notice">这个地方的同一件事还没办完，先等回报。</p>':'')+simpleCourtButton('simpleCourtProject',id,'交给'+(actor?.name||'承办官')+'去办',true,!!gate||!!lack||duplicate||!actor||simpleCourtBusy(actor.id)),'simpleCourtWork');
}
function simpleCourtProject(id){
  const draft=simpleCourtDraft;if(draft?.kind!=='project'||draft.id!==id)return;
  if(simpleCourtGate('work:'+id))return simpleCourtWorkConfirm(id,true);
  const res=simDispatch({type:'project',project:id,region:draft.region,actor:draft.actor});if(!res)return simpleCourtWorkConfirm(id,true);
  const job=state.simulation.jobs.at(-1);simpleCourtDraft=null;render();simpleCourtJob('job:'+job.id);
}
function simpleCourtDept(raw){
  const [id,regionArg]=String(raw).split('|'),d=frontDept(id);if(!d)return;
  if(id==='personnel')return simpleCourtAppointments(id);if(id==='revenue')return simpleCourtFinance();
  const region=regionArg||frontEnsure().region||'capital';simpleCourtOpen(SIMPLE_COURT.departments[id],'<p>这几件事归'+simpleCourtEsc(d.name)+'管。先选事情，再定地方。</p><div class="opts">'+FRONT.tasks.filter(t=>t.dept===id).map(t=>'<button class="opt" data-action="simpleCourtTask" data-id="'+t.id+'|'+region+'"><b>'+simpleCourtEsc(SIMPLE_COURT.tasks[t.id]||t.name)+'</b><small>'+simpleCourtCost(t)+' · '+t.ap+'次安排</small></button>').join('')+'</div>'+simpleCourtDetails('看看谁负责这个衙门','<p>'+simpleCourtEsc(frontName(frontEnsure().heads[id]))+'现任主事。</p>'+simpleCourtButton('simpleCourtAppointments',id,'安排谁来负责')),'simpleCourtHall');
}
function simpleCourtTask(raw){
  const [id,r]=String(raw).split('|'),t=FRONT.tasks.find(t=>t.id===id),f=frontEnsure(),region=r||f.region||'capital';if(!t||!f.local[region])return;
  simpleCourtDraft={kind:'task',id,region};const head=frontHead(t.dept),gate=simpleCourtGate('task:'+id+'|'+region,t.ap),used=f.orders.some(o=>o.task===id&&o.region===region&&o.month===state.elapsed),full=f.orders.filter(o=>o.dept===t.dept&&o.status==='pending').length>=2,exam=id==='exam'&&f.examYear===Math.floor(state.elapsed/12),busy=head&&simpleCourtBusy(head.id),lack=simpleCourtShortage(t);
  const reason=used?'本月在此地已经安排过了，先看回报。':exam?'今年已经开过科，明年再议。':full?'这个衙门已有两件事在办，先等回报。':busy?'主事正在办别的差事，可先等一等或另派主事。':!head?'这个衙门还没人负责。':lack;
  simpleCourtOpen(SIMPLE_COURT.tasks[id]||t.name,gate+'<label class="simple-court-field">办在哪儿<select data-simple-court="task-region">'+REGIONS.map(q=>'<option value="'+q.id+'"'+(q.id===region?' selected':'')+'>'+q.name+'</option>').join('')+'</select></label><p>承办：'+simpleCourtEsc(frontName(head?.id))+'</p><p class="simple-court-cost">'+simpleCourtCost(t)+' · '+t.ap+'次安排</p>'+(reason?'<p class="simple-court-notice">'+simpleCourtEsc(reason)+'</p>':'')+(lack?simpleCourtButton('simpleCourtFunds','','先找钱粮'):'')+simpleCourtButton('simpleCourtTaskCommit',id+'|'+region,'就这样办',true,!!gate||!!reason)+simpleCourtDetails('换个主事，或看看办成有什么用',simpleCourtButton('simpleCourtAppointments',t.dept,'安排谁来负责')+'<p>'+simpleCourtEsc(t.description)+'</p><p>'+simpleCourtEsc(frontEffects(t.effects))+'</p>'),'simpleCourtWork');
}
function simpleCourtTaskCommit(raw){const [id,region]=String(raw).split('|'),t=FRONT.tasks.find(t=>t.id===id);if(!t)return;const f=frontEnsure(),n=f.orders.length;if(simpleCourtGate('task:'+raw,t.ap)||simpleCourtBusy(f.heads[t.dept]))return simpleCourtTask(raw);frontStartTask(raw);if(f.orders.length>n)simpleCourtOrder(f.orders.at(-1).uid);else simpleCourtTask(raw);}
function simpleCourtOrder(id){const o=frontEnsure().orders.find(o=>o.uid===id),t=o&&FRONT.tasks.find(t=>t.id===o.task);if(!o||!t)return;const gate=o.status==='needs-work'?simpleCourtGate('task:'+t.id+'|'+o.region):'';simpleCourtOpen(SIMPLE_COURT.tasks[o.task]||t.name,'<p>'+simpleCourtEsc(regionOf(o.region).name)+' · '+simpleCourtEsc(frontName(o.actor))+'承办。</p><p>'+(o.status==='pending'?'约'+Math.max(0,o.due-mindTick())+'日后回报。':o.status==='completed'?'事情已经回报。':'原定事情还没办妥。')+'</p><p class="mini">已用银'+o.cost.money+'、粮'+o.cost.grain+'。</p>'+(o.result?'<div class="scene-text">'+simpleCourtEsc(o.result)+'</div>':'')+(o.status==='needs-work'&&!o.retried?gate+simpleCourtButton('simpleCourtRetry','order|'+id,'补派人复查 · 用银'+Math.ceil(o.cost.money*.35)+' / 粮'+Math.ceil(o.cost.grain*.25)+' / 1次安排',true,!!gate):'')+simpleCourtDetails('看看臣子的反应',frontReactionHtml(o.decisionReactions)+frontReactionHtml(o.resultReactions)||'<p>尚无新回话。</p>'),'simpleCourtProgress');}

function simpleCourtFinance(){
  const f=frontEnsure(),gate=simpleCourtGate('finance'),amount=Math.min(12,f.arrears),s=f.ruin;
  simpleCourtOpen('朝廷的钱粮','<div class="simple-court-numbers"><div>库中银<b>'+f.treasury+'</b></div><div>仓中粮<b>'+f.grain+'</b></div><div>欠下的俸饷<b>'+f.arrears+'</b></div></div><p class="mini">这是朝廷的账，宫里的日常用钱另算。</p>'+gate+'<div class="actions">'+simpleCourtButton('simpleCourtFunds','','先找钱粮',true)+(simActive()?simpleCourtButton('simpleCourtPay','','给官兵发钱 · 银'+amount+' / 1次安排',false,!!gate||amount<=0||f.treasury<amount):'')+'</div>'+simpleCourtDetails('想调整收税吗？','<p>每月只能改一次。多收眼前能添银，也会加重百姓负担。</p>'+Object.entries(simActive()?REALM_DATA.policies:FRONT.taxes).map(([id,p])=>simpleCourtButton('simpleCourtTax',id,p.name+(f.tax===id?' · 当前如此':''),false,!!gate||f.taxMonth===state.elapsed)).join(''))+simpleCourtDetails('查一查收支和借据','<p>尚未收回的已核欠税：银'+f.taxReceivables+'。</p>'+(s?'<p>另欠叶家银'+s.debt.silver+'、粮'+s.debt.grain+'。有余钱粮才按月偿还，不会凭空抹掉。</p>':'')+f.ledger.slice(-10).reverse().map(l=>'<p>'+simpleCourtEsc(l.kind)+'：'+simpleCourtEsc(l.text)+' <small>账后银'+l.balance+'、粮'+l.grainBalance+'</small></p>').join(''))+simpleCourtDetails('粮仓和百姓的耕种',FRONT.tasks.filter(t=>t.dept==='revenue').map(t=>simpleCourtButton('simpleCourtTask',t.id+'|capital',SIMPLE_COURT.tasks[t.id])).join('')),'simpleCourtHall');
}
function simpleCourtPay(){if(simpleCourtGate('finance'))return simpleCourtFinance();const res=simDispatch({type:'payArrears'});if(!res)return simpleCourtFinance();render();simpleCourtOpen('这笔俸饷已发下','<p>'+simpleCourtEsc(res.event.text)+'</p>'+simpleCourtButton('simpleCourtFinance','','回看朝廷钱粮'),'simpleCourtHall');}
function simpleCourtAppointments(dept='personnel'){
  const d=frontDept(dept);if(!d)return;const f=frontEnsure(),all=frontOfficials().slice().sort((a,b)=>frontAbility(b,d.skill)-frontAbility(a,d.skill)),gate=simpleCourtGate('people:'+dept),current=f.heads[dept];
  simpleCourtDraft={kind:'appointment',dept,actor:current||all[0]?.id||''};
  simpleCourtOpen('安排谁来负责','<p>选一个衙门，再挑一位主事。任用花1次安排，原先在办的事仍须交清。</p>'+gate+'<label class="simple-court-field">管哪一摊<select data-simple-court="appointment-dept">'+FRONT.departments.map(q=>'<option value="'+q.id+'"'+(q.id===dept?' selected':'')+'>'+q.name+' · '+SIMPLE_COURT.departments[q.id]+'</option>').join('')+'</select></label><label class="simple-court-field">选谁负责<select data-simple-court="appointment-actor">'+all.map(p=>{const held=FRONT.departments.find(q=>q.id!==dept&&f.heads[q.id]===p.id);return '<option value="'+p.id+'"'+(p.id===current?' selected':'')+(held?' disabled':'')+'>'+simpleCourtEsc(p.name)+' · '+(held?'已管'+held.name:p.id===current?'现任主事':frontAbility(p,d.skill)>=60?'比较擅长':frontAbility(p,d.skill)>=45?'做得来':'还不熟练')+'</option>';}).join('')+'</select></label><p class="mini">相熟不等于能办事。初选仍是现任主事，换人后再点下方任用。</p>'+simpleCourtButton('simpleCourtAppoint',dept,'任用所选的人 · 1次安排',true,!!gate)+simpleCourtDetails('想仔细比较人选？',all.slice(0,10).map(p=>'<p>'+simpleCourtEsc(p.name)+'：任事能力'+frontAbility(p,d.skill)+'，忠诚'+state.relations[p.id].loyalty+'，好感'+state.relations[p.id].aff+'。</p>').join('')+simpleCourtButton('simpleCourtLegacyAppointments',dept,'打开完整名册')),'simpleCourtHall');
}
function simpleCourtAppoint(dept){const draft=simpleCourtDraft;if(draft?.kind!=='appointment'||draft.dept!==dept)return;const f=frontEnsure(),old=f.heads[dept];if(old===draft.actor){toast('他已在负责，不必再花一次安排。');return;}if(simpleCourtGate('people:'+dept))return simpleCourtAppointments(dept);frontAppoint(dept+'|'+draft.actor);if(f.heads[dept]!==old){simpleCourtOpen('主事已定','<p>'+simpleCourtEsc(frontName(f.heads[dept]))+'将负责'+simpleCourtEsc(frontDept(dept).name)+'。原来的在办事项照旧留账交接。</p>'+simpleCourtButton('simpleCourtWork','','安排一件事',true),'simpleCourtHall');}else simpleCourtAppointments(dept);}
function simpleCourtPressure(id){const s=frontEnsure().ruin,p=s?.pressures.find(p=>p.id===id);if(!p)return;const labels={verify:['另派人核账，催他交回执','不顺着他的条件走，等两日核清；朝中会有些争执。'],concede:['这一次先用他荐的人','先放行此事，但他在朝中的势力会更大。'],rebuke:['命他交回执，不再让他经手此案','立即停他在此案的经手权，朝中争执会更大。']};simpleCourtOpen(frontName(p.actor)+'扣着回执不肯交','<div class="scene-text">“陛下，回执迟迟未交，原定的差事已经耽搁。'+simpleCourtEsc(frontName(p.actor))+'愿让自己荐来的人代签，却要往后的差遣先经过他。”</div><p>这是扣押回执、借机要权，还不能据此断定他贪污或谋反。</p>'+(p.status==='open'?simpleCourtGate('pressure:'+id,0)+RUIN_DATA.pressure.choices.map(c=>'<button class="opt" data-action="simpleCourtPressureChoose" data-id="'+id+'|'+c.id+'"'+(!!simpleCourtGate('pressure:'+id,c.ap)?' disabled':'')+'><b>'+labels[c.id][0]+'</b><small>'+labels[c.id][1]+' · '+c.ap+'次安排</small></button>').join(''):'<p>'+simpleCourtEsc(p.result||'已另派人核查，等回报。')+'</p>'));}
function simpleCourtMore(){simpleCourtOpen('其余朝事与簿册','<p>不急的事慢慢看。只翻阅不花今日安排。</p><div class="opts">'+[
  ['simpleCourtFinance','朝廷的钱粮','收税、欠款和收支记录。'],['simpleCourtAppointments','安排谁负责','查看六部主事，换个合适的人。'],['daliangPanel','旧案与朝中势力','许家旧案、姜叶荐举和谢无咎的线索。'],['world16Dynasty','家人和传承','照看孩子，安排继承。'],['simpleCourtRites','开科与学堂','考试选才，修学堂、添书本。'],['simpleCourtOldBooks','完整政务簿册','细看各地情形、履职记录和旧账。']
].map(([action,label,desc])=>'<button class="opt" data-action="'+action+'"><b>'+label+'</b><small>'+desc+'</small></button>').join('')+'</div>','simpleCourtHall');}
function simpleCourtHall(){closeModal();if(state.tab!=='court'){state.tab='court';}render();}

Object.assign(actions,{
  simpleCourtAffairs,simpleCourtAffair,simpleCourtDecide,simpleCourtFunds,simpleCourtFund,simpleCourtCollect,simpleCourtProgress,simpleCourtJob,simpleCourtWork,simpleCourtWorkConfirm,simpleCourtProject,simpleCourtTask,simpleCourtTaskCommit,simpleCourtFinance,simpleCourtPay,simpleCourtAppointments,simpleCourtAppoint,simpleCourtMore,simpleCourtHall,simpleCourtEnter,simpleCourtSleepAsk,simpleCourtSleep,simpleCourtResume,simpleCourtPressure,
  simpleCourtLeave:()=>simpleCourtLegacy.side('leave'),simpleCourtRites:()=>simpleCourtDept('rites'),simpleCourtOldBooks:hallBooks,simpleCourtLegacyAppointments:frontAppointments,
  simpleCourtRetry:raw=>{frontRetry(raw);const [kind,id]=raw.split('|');kind==='affair'?simpleCourtAffair(id):simpleCourtOrder(id);},
  simpleCourtPressureChoose:raw=>{ruinPressureChoose(raw);simpleCourtPressure(raw.split('|')[0]);},
  simpleCourtTax:id=>{if(simpleCourtGate('finance'))return simpleCourtFinance();frontTax(id);simpleCourtFinance();},
  frontAffair:simpleCourtAffair,frontAffairs:simpleCourtAffairs,frontOrder:simpleCourtOrder,frontDept:simpleCourtDept,frontFinance:simpleCourtFinance,
  frontPrepareReview:id=>{simpleCourtLegacy.prepare(id);if(!frontEnsure().reviewPlan||frontEnsure().reviewPlan.status!=='offered')simpleCourtAffair(id);},
  frontNextMonthReview:id=>{simpleCourtLegacy.nextReview(id);simpleCourtAffair(id);}
});
actions.courtSide=id=>id==='events'?simpleCourtAffairs():id==='exam'?simpleCourtDept('rites'):['trade','foreign'].includes(id)?simpleCourtAffairs():simpleCourtLegacy.side(id);
actions.courtDept=id=>{const dept={'吏':'personnel','户':'revenue','礼':'rites','兵':'war','刑':'justice','工':'works'}[id];if(dept)simpleCourtDept(dept);else if(id==='奏')simpleCourtAffairs();else if(id==='军')simpleCourtDept('war');else if(id==='通')simpleCourtMore();else simpleCourtLegacy.dept(id);};
document.addEventListener('change',event=>{
  const el=event.target,key=el.dataset?.simpleCourt;if(!key||!simpleCourtDraft)return;
  if(key==='project-region'&&REGIONS.some(r=>r.id===el.value)){simpleCourtDraft.region=el.value;simpleCourtWorkConfirm(simpleCourtDraft.id,true);}
  if(key==='project-actor'&&frontOfficials().some(p=>p.id===el.value)){simpleCourtDraft.actor=el.value;simpleCourtWorkConfirm(simpleCourtDraft.id,true);}
  if(key==='task-region'&&REGIONS.some(r=>r.id===el.value))simpleCourtTask(simpleCourtDraft.id+'|'+el.value);
  if(key==='appointment-dept')simpleCourtAppointments(el.value);
  if(key==='appointment-actor'&&frontOfficials().some(p=>p.id===el.value))simpleCourtDraft.actor=el.value;
});
const simpleCourtBeforeIntro=intro;intro=function(){simpleCourtBeforeIntro();const body=$('modalBody');body.innerHTML=body.innerHTML.replace(/V15 经营模式：[^<]*/, '每天可安排六件事。上朝先看要事，选好办法，再等官员回报；退朝后可见人、逛逛或歇息。').replace('每月15行动。先在原大殿筹措钱粮，再从“遗局”查旧案、议荐举。','每天六次安排。先在大殿找钱粮，旧案和朝中势力可从“更多”慢慢看。');};
const simpleCourtStyle=document.createElement('style');simpleCourtStyle.textContent=`
.simple-court .audience-status{max-width:calc(100% - 178px)}
.simple-court .audience-label{left:38%;top:30%;font-size:25px}
.simple-court .audience-menu{gap:8px}
.simple-court .audience-menu button{min-height:43px;letter-spacing:2px}
.simple-court .audience-depts{grid-template-columns:repeat(6,minmax(0,1fr));bottom:57px;gap:8px}
.simple-court .audience-depts button{font-size:18px;min-height:63px;line-height:1.5;padding:8px 2px}
.simple-court .audience-depts b,.simple-court .audience-depts small{display:block;font-weight:normal}
.simple-court .audience-depts small{font-size:10px;opacity:.8}
.simple-court-guide{position:absolute;left:5%;right:5%;bottom:146px;padding:16px 20px;background:#fff8e9f5;color:#654536;border:1px solid #cfb179;border-radius:8px;max-width:550px}
.simple-court-guide>b{font-size:12px;letter-spacing:2px;color:#96743b}
.simple-court-guide p{font-size:15px;line-height:1.8;margin:8px 0 12px}
.simple-court-guide .btn{font-size:14px;padding:10px 16px}
.simple-court-panel p{line-height:1.8}.simple-court-back{padding:0 0 12px}.simple-court-panel .opts{margin-top:12px}
.simple-court-panel .opt:disabled{opacity:1;background:#f6f1ec;color:#887064;border-color:#dfd2c5}.simple-court-panel .opt:disabled small{color:#8e7a70}
.simple-court-row{padding:17px 0;border-bottom:1px solid var(--line)}.simple-court-row h3{margin:8px 0}.simple-court-row>.btn{margin-top:5px}
.simple-court-details{margin-top:18px;padding:12px 0;border-top:1px solid var(--line);font-size:13px;line-height:1.8}.simple-court-details summary{cursor:pointer;color:#98674c;padding:4px 0}
.simple-court-field{display:block;margin:15px 0;font-size:13px}.simple-court-field select{display:block;width:100%;min-width:0;margin-top:7px;padding:12px;background:#fffaf4;border:1px solid var(--line);border-radius:8px;color:inherit;font:inherit}
.simple-court-notice{padding:12px;background:#f6ecdf;border-radius:8px;font-size:13px}.simple-court-cost{color:#996645;font-size:13px}.simple-court-panel .btn{white-space:normal;line-height:1.65;margin-right:6px;margin-top:8px;max-width:100%}
.simple-court-numbers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.simple-court-numbers>div{padding:12px 5px;text-align:center;border:1px solid var(--line);border-radius:8px;font-size:12px}.simple-court-numbers b{display:block;font:24px Georgia,serif;margin-top:6px;color:#a34f68}
@media(max-width:600px){.simple-court .audience-status{max-width:calc(100% - 116px)}.simple-court .audience-label{left:27%;top:30%;font-size:21px}.simple-court .audience-menu{gap:7px}.simple-court .audience-menu button{min-height:39px;font-size:13px;letter-spacing:1px}.simple-court .audience-depts{gap:3px;bottom:61px}.simple-court .audience-depts button{font-size:15px;min-height:58px}.simple-court-guide{left:4%;right:4%;bottom:143px;padding:12px 14px}.simple-court-guide p{font-size:13px;margin:6px 0}.simple-court-guide .btn{font-size:12px;padding:9px 14px}.simple-court .audience-caption{font-size:10px}.simple-court-panel .opt{padding:14px}.simple-court-panel .opt small{font-size:12px}}
`;document.head.appendChild(simpleCourtStyle);
window.__simpleCourtAudit={version:'16.1',guide:simpleCourtGuide,queue:simpleCourtQueue,jobs:simpleCourtJobs,copy:SIMPLE_COURT};
