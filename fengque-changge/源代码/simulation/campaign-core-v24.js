/* Local development, offices and rival recruitment. Pure JSON; old campaigns delegate unchanged. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./campaign-core-v23.js'));else root.FengqueCampaign24=factory(root.FengqueCampaign23);})(typeof globalThis!=='undefined'?globalThis:this,function(base){
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x)),cap=n=>Math.max(0,Math.min(100,n)),nat=n=>Number.isInteger(n)&&n>=0;
 const active24=s=>s?.govern24?.enabled===true;
 const regions=s=>s.regions.filter(r=>r.owner==='crown'),officer=(s,id)=>base.officer(s,id),area=(s,id)=>s.regions.find(r=>r.id===id);
 const clan=p=>p?.clan?.includes('姜')?'jiang':p?.clan?.includes('叶')?'ye':null;
 const policySpec={
  capital:[{id:'capital-grain',name:'京仓',silver:0,grain:25,desc:'充实京城粮仓，每旬多粮25。'},{id:'capital-workshop',name:'官作坊',silver:25,grain:0,desc:'重开官作坊，每旬多银25。'}],
  south:[{id:'south-grain',name:'粮仓',silver:0,grain:40,desc:'先保粮食，每旬多粮40。'},{id:'south-trade',name:'商埠',silver:35,grain:0,desc:'先通商路，每旬多银35；与官道合用可绕开叶氏抬价。'}],
  ji:[{id:'ji-farm',name:'复垦',silver:0,grain:35,desc:'复垦荒田，每旬多粮35。'},{id:'ji-garrison',name:'军屯',silver:0,grain:15,shield:15,desc:'每旬多粮15，每次补兵另添盾兵15。'}],
  pass:[{id:'pass-market',name:'关市',silver:30,grain:0,desc:'恢复关市，每旬多银30。'},{id:'pass-horses',name:'马场',silver:0,grain:10,cavalry:15,desc:'每旬多粮10，每次补兵另添轻骑15。'}],
  north:[{id:'north-farm',name:'边屯',silver:0,grain:30,desc:'安置边屯，每旬多粮30。'},{id:'north-trade',name:'互市',silver:40,grain:0,desc:'经营互市，每旬多银40。'}]
 };
 const officeSpec={marshal:{name:'京营统领',desc:'每次补兵另添盾兵10；带兵70以上再添弓手10。'},treasurer:{name:'司库主事',desc:'理事70、忠诚65以上，实买粮80可少付银20。'},inspector:{name:'都察院主事',desc:'理事70、忠诚65以上，新查账由两旬缩为一旬。'}};
 const policy=(s,id)=>policySpec[id]?.find(p=>p.id===s.govern24?.regions[id]?.policy);
 function note(s,kind,text,extra={}){s.history.push({id:'c19-'+(++s.serial),turn:s.turn,tick:s.tick,kind,text,...extra});}
 function enablePlay(s){
  if(active24(s))return s;if(!base.active(s))throw Error('先接入州府经营。');if(base.ended(s))throw Error('此局已终，不能再接入新政。');if(s.battle?.status==='fighting')throw Error('先结束这一仗，再接入治国经营。');
  s.govern24={version:1,enabled:true,startTurn:s.turn,graceUntil:s.turn+4,serial:0,regions:Object.fromEntries(s.regions.map(r=>[r.id,{policy:null,project:null}])),offices:{marshal:null,treasurer:null,inspector:null},plots:[],next:{jiang:s.turn+4,ye:s.turn+4},marketUntil:0,granaryUntil:0,ledger:[],goal:'restore',honors:[]};
  note(s,'治国经营','各地可择一项发展方向；御前三职与人才培养已开放。新增争人与抬价从四旬后开始准备，不追算旧事。');return s;
 }
 function posting(s,id){return active24(s)?Object.entries(s.govern24.offices).find(([,p])=>p?.id===id)?.[0]||null:null;}
 function onLeave(s,id){return active24(s)&&(officer(s,id)?.leaveUntil24||0)>s.turn;}
 function busy(s,id){return base.busy(s,id)||!!posting(s,id)||onLeave(s,id);}
 function held(s,key){const job=s.govern24?.offices[key],p=job&&officer(s,job.id);return p&&!onLeave(s,p.id)?p:null;}
 function reconcile(s){if(!active24(s))return;for(const [key,j]of Object.entries(s.govern24.offices))if(j&&!officer(s,j.id)){s.govern24.offices[key]=null;note(s,'御前空缺',officeSpec[key].name+'原任已不能任事，职务空缺，待另选人。',{actor:j.id});}}
 const skilled=p=>!!p&&p.admin>=70&&p.loyalty>=65;
 function ready(s,id){const r=area(s,id);return r?.owner==='crown'&&!!r.governor&&(r.governor==='existing'||!!officer(s,r.governor)&&!onLeave(s,r.governor));}
 function power(s,key){return base.influence(s,key)+(active24(s)?Object.values(s.govern24.offices).filter(j=>j&&clan(officer(s,j.id))===key).length*6:0);}
 function development(s,id){
  const zero={region:id,policy:null,silver:0,grain:0,rents:{jiang:0,ye:0},grainRents:{jiang:0,ye:0}};if(!active24(s)||!ready(s,id))return zero;const spec=policy(s,id);if(!spec)return zero;
  const r=area(s,id),p=officer(s,r.governor),estate=s.depth22.regions[id].estate;
  const scale=(p?.admin>=70?1.2:1)*((p&&p.loyalty<50)?0.5:1)*(r.unrest>=50?.5:1),rawSilver=Math.floor(spec.silver*scale),rawGrain=Math.floor(spec.grain*scale),rents={},grainRents={};
  for(const k of ['jiang','ye']){rents[k]=Math.floor(rawSilver*estate[k]*.003);grainRents[k]=Math.floor(rawGrain*estate[k]*.002);}
  return {region:id,policy:spec.id,actor:r.governor,rawSilver,rawGrain,silver:rawSilver-rents.jiang-rents.ye,grain:rawGrain-grainRents.jiang-grainRents.ye,rents,grainRents};
 }
 function quote(s,r,actual=false){const q=base.quote(s,r,actual);if(!active24(s))return q;const d=development(s,r.id);return {...q,silver:q.silver+d.silver,grain:q.grain+d.grain,grossSilver:q.grossSilver+(d.rawSilver||0),grossGrain:q.grossGrain+(d.rawGrain||0),rents:{jiang:q.rents.jiang+d.rents.jiang,ye:q.rents.ye+d.rents.ye},grainRents:{jiang:q.grainRents.jiang+d.grainRents.jiang,ye:q.grainRents.ye+d.grainRents.ye},development24:d};}
 function forecast(s){const f=base.forecast(s);if(!active24(s)||!f)return f;const lines=s.regions.map(r=>quote(s,r));return {...f,lines,silver:f.silver+lines.reduce((n,r)=>n+r.development24.silver,0),grain:f.grain+lines.reduce((n,r)=>n+r.development24.grain,0)};}
 function price(s){return (s.depth22.regions.south.route?60:80)+(active24(s)&&s.govern24.marketUntil>s.turn?20:0)-(active24(s)&&skilled(held(s,'treasurer'))?20:0);}
 function cost(s,silver=0,grain=0){return s.ap<1?'这旬国事已用完，下一旬再安排。':s.economy.treasury<silver?'库银不足。':s.economy.grain<grain?'存粮不足。':'';}
 function reason(s,c){
  if(!active24(s))return base.reason(s,c);if(base.ended(s))return '此局已终，不能再安排国事。';if(!c||typeof c.type!=='string')return '未收到安排。';
  if(s.battle?.status==='fighting'&&!['order','pay','wages','pin24'].includes(c.type))return '先下完这场军令或撤军，再办国事。';
  const r=c.region&&area(s,c.region),p=c.id&&officer(s,c.id);
  if(c.type==='policy24'){
   if(!r||!ready(s,r.id))return '先收复地方并任知府，再定发展方向。';const q=s.govern24.regions[r.id];if(!policySpec[r.id].some(p=>p.id===c.policy))return '未选定这处地方可办的方向。';if(q.project)return '新方向正在办，等回报再改。';if(q.policy===c.policy)return '已经沿这个方向经营。';return cost(s,50,10);
  }
  if(c.type==='post24'){
   if(!officeSpec[c.post])return '未选定御前职位。';if(c.id===null)return !s.govern24.offices[c.post]?'此职已经空着。':cost(s);
   if(!p)return '先在人才册考校任用。';if(busy(s,p.id))return '此人已有实职、正在领军或尚未返京；先撤原职，再另作安排。';return cost(s);
  }
  if(c.type==='develop24'){
   if(!p)return '先任用此人。';if(onLeave(s,p.id)||s.battle?.status==='fighting')return '此人未能在朝任事，先等回报。';if(!['military','admin','integrity22'].includes(c.path))return '先选带兵、理事或清慎。';if((p.training24?.length||0)>=2)return '此人已完成两次擢升，往后仍可按实绩赏功。';if((p[c.path]||0)>=100)return '这一项已满，不必空投实绩。';if((p.merits22||0)<2)return '需两份真实实绩，任职三旬或胜仗可积累。';return cost(s,40);
  }
  if(c.type==='release24'){if(!regions(s).length)return '先守住一处州县。';if(s.govern24.granaryUntil>=s.turn+2)return '官粮仍在平价，不必重复放。';return cost(s,0,40);}
  if(c.type==='pin24')return ['restore','prosper','authority'].includes(c.goal)?'':'未选定本朝志。';
  if(c.type==='buygrain22')return s.depth22.lastGrain===s.turn?'这旬已经买过一批粮。':s.depth22.clans.ye.grain<80?'叶氏货栈存粮不足八十。':s.economy.treasury<price(s)?'库银不足，这批粮需银'+price(s)+'。':'';
  if(c.type==='appoint'&&p&&(posting(s,p.id)||onLeave(s,p.id)))return '此人仍有御前实职或尚未返京，先撤原职，再任知府。';
  if(c.type==='attack'&&(posting(s,c.commander)||onLeave(s,c.commander)))return '领军者须先交出御前实职，且已经返京。';
  return base.reason(s,c);
 }
 function command(s,c){
  const why=reason(s,c);if(why)return {ok:false,error:why};if(!active24(s))return base.command(s,c);const d=s.govern24,p=c.id&&officer(s,c.id);let text;
  if(c.type==='policy24'){s.ap--;s.economy.treasury-=50;s.economy.grain-=10;d.regions[c.region].project={policy:c.policy,remaining:2,started:s.turn};text=area(s,c.region).name+'开始筹办'+policySpec[c.region].find(p=>p.id===c.policy).name+'，需两旬；旧方向持续到新方向办成。';}
  else if(c.type==='post24'){
   const old=d.offices[c.post]&&officer(s,d.offices[c.post].id);s.ap--;if(old)old.loyalty=cap(old.loyalty-3);d.offices[c.post]=p?{id:p.id,served:0}:null;
   if(p){p.loyalty=cap(p.loyalty+3);const k=clan(p);if(k)s.depth22.clans[k].mood=cap(s.depth22.clans[k].mood+4);}
   text=p?p.name+'任'+officeSpec[c.post].name+'，原职'+(old?'由'+old.name+'交出':'尚空')+'；不与知府或领军兼任。':officeSpec[c.post].name+'已撤回，'+old.name+'返回待命，忠诚下降3。';
  }
  else if(c.type==='develop24'){s.ap--;s.economy.treasury-=40;p.merits22-=2;p[c.path]=Math.min(100,(p[c.path]||0)+10);p.training24=p.training24||[];p.training24.push({path:c.path,turn:s.turn});text='据实绩擢升'+p.name+'，'+({military:'带兵',admin:'理事',integrity22:'清慎'})[c.path]+'提升10，已用实绩2、银40。';}
  else if(c.type==='release24'){s.ap--;s.economy.grain-=40;d.granaryUntil=s.turn+3;d.marketUntil=0;for(const r of regions(s))r.unrest=cap(r.unrest-5);text='官粮40已经放出，平价至第'+d.granaryUntil+'旬前；本次抬价停止，各地怨情下降5。';}
  else if(c.type==='pin24'){d.goal=c.goal;return {ok:true,text:'本朝志已另记。'};}
  else if(c.type==='buygrain22'){const paid=price(s);s.economy.treasury-=paid;s.economy.grain+=80;s.depth22.clans.ye.silver+=paid;s.depth22.clans.ye.grain-=80;s.depth22.lastGrain=s.turn;text='实付银'+paid+'，从叶氏买粮80，已入官仓；采购价含官道、司库与当前粮价。';}
  else {
   const res=base.command(s,c);if(!res.ok)return res;
   if(c.type==='train'){
    const chief=held(s,'marshal');let shield=chief?10:0,bow=chief?.military>=70?10:0,cavalry=0;
    if(ready(s,'ji'))shield+=policy(s,'ji')?.shield||0;if(ready(s,'pass'))cavalry+=policy(s,'pass')?.cavalry||0;
    s.army.shield+=shield;s.army.bow+=bow;s.army.cavalry+=cavalry;if(shield+bow+cavalry)note(s,'补兵协力','御前与地方另补盾兵'+shield+'、弓手'+bow+'、轻骑'+cavalry+'，都计入全军，以后照数供粮。');
   }
   if(c.type==='audit'&&skilled(held(s,'inspector'))){const a=s.audits.at(-1);a.due=s.turn+1;a.inspector24=held(s,'inspector').id;note(s,'查账提速',held(s,'inspector').name+'复核新案，改为下一旬交实据。',{audit:a.id});}
   if(c.type==='relief22'&&c.region==='south'){d.granaryUntil=s.turn+3;d.marketUntil=0;}
   resolvePlots(s,false);return res;
  }
  note(s,'治国安排',text,{command:c.type,actor:c.id||null,region:c.region||null});resolvePlots(s,false);return {ok:true,text};
 }
 function employed(s,id){return s.regions.some(r=>r.owner==='crown'&&r.governor===id)||!!posting(s,id);}
 function priceBlocked(s){const d=s.govern24;return skilled(held(s,'treasurer'))||ready(s,'south')&&policy(s,'south')?.id==='south-trade'&&!!s.depth22.regions.south.route||d.granaryUntil>s.turn||regions(s).reduce((n,r)=>n+s.depth22.regions[r.id].estate.ye,0)<40;}
 function blocked(s,a){if(a.kind==='price')return priceBlocked(s);const p=officer(s,a.actor);return !p||!employed(s,a.actor)||p.loyalty>=65||onLeave(s,a.actor)||power(s,'jiang')<(clan(p)==='jiang'?15:30);}
 function resolvePlots(s,execute){const d=s.govern24;for(const a of d.plots.filter(a=>a.status==='preparing')){
  if(blocked(s,a)){a.status='blocked';a.resolved=s.turn;note(s,'反制奏效',a.title+'：条件已改变，本次没有办成。',{plot:a.id});continue;}
  if(!execute||a.due>s.turn)continue;a.status='executed';a.resolved=s.turn;
  if(a.kind==='price'){d.marketUntil=s.turn+3;note(s,'叶氏抬价','货栈开始抬价，至第'+d.marketUntil+'旬前购粮另付银20。可用官粮平价或可信司库解围。',{plot:a.id});}
  else {const p=officer(s,a.actor);for(const r of s.regions)if(r.governor===p.id){r.governor=null;s.depth22.regions[r.id].turnsServed=0;}for(const key of Object.keys(d.offices))if(d.offices[key]?.id===p.id)d.offices[key]=null;p.leaveUntil24=s.turn+2;p.loyalty=cap(p.loyalty-5);note(s,'官员回府',p.name+'受家门与人情牵制，回府两旬；原实职现空缺，须另任人。到第'+p.leaveUntil24+'旬可重新安排。',{plot:a.id,actor:p.id});}
 }if(d.marketUntil>s.turn&&priceBlocked(s)){d.marketUntil=0;note(s,'粮价回稳','条件已改变，叶氏本次抬价停止。');}}
 function startPlots(s){const d=s.govern24;if(s.turn<d.graceUntil)return;for(const k of ['jiang','ye']){
  if(d.next[k]>s.turn||d.plots.some(a=>a.clan===k&&a.status==='preparing'))continue;const c=s.depth22.clans[k];if(c.silver<30)continue;let a;
  if(k==='jiang'){
   if(power(s,k)<15)continue;const p=s.roster.filter(p=>p.recruited&&p.alive!==false&&employed(s,p.id)&&!onLeave(s,p.id)&&p.loyalty<(clan(p)==='jiang'?65:power(s,k)>=30?50:0)).sort((a,b)=>a.loyalty-b.loyalty)[0];if(!p)continue;
   const r=s.regions.find(r=>r.governor===p.id);a={kind:'recall',actor:p.id,region:r?.id||'capital',title:'姜氏正在争取'+p.name};
  }else {if(d.marketUntil>s.turn||priceBlocked(s)||c.grain<80)continue;a={kind:'price',region:'south',title:'叶氏货栈准备抬高粮价'};}
  c.silver-=30;d.next[k]=s.turn+5;a={...a,id:'govern24-'+(++d.serial),clan:k,created:s.turn,due:s.turn+2,status:'preparing',paid:30};d.plots.push(a);note(s,'世家动向',a.title+'，预计第'+a.due+'旬动手。'+(k==='jiang'?'可赏功至忠诚65、换任，或削弱姜氏根基。':'可任可信司库、建商埠通官道、放粮平价，或削减叶氏田产。'),{plot:a.id,region:a.region,actor:a.actor||null});
 }}
 function goals(s){if(!active24(s))return [];const lands=regions(s),f=forecast(s),realPosts=new Set([...lands.map(r=>r.governor),...Object.values(s.govern24.offices).filter(Boolean).map(j=>j.id)]),independent=[...realPosts].filter(id=>id!=='existing'&&officer(s,id)&&!clan(officer(s,id))).length,developed=lands.filter(r=>policy(s,r.id)).length,estates=lands.reduce((n,r)=>n+s.depth22.regions[r.id].estate.crown,0),recovered=s.audits.reduce((n,a)=>n+(a.recovered||0),0);
  const row=(key,name,value,target)=>({key,name,value,target,done:value>=target});return [
   {id:'restore',name:'复土',title:'山河重定',steps:[row('land','五地归朝',lands.length,5),row('governors','知府到任',lands.filter(r=>!!r.governor).length,5),row('forts','城防至少一重',lands.filter(r=>s.depth22.regions[r.id].fort>=1).length,2)]},
   {id:'prosper',name:'富国',title:'仓廪丰实',steps:[row('developed','发展方向已办成',developed,3),row('silver','预计旬净银',f.silver,80),row('grain','预计旬净粮',f.grain,40),row('wages','欠饷已清',s.economy.arrears===0?1:0,1)]},
   {id:'authority',name:'亲政',title:'政归御前',steps:[row('estate','官田总份数',estates,200),row('independent','独立出身实职',independent,4),row('recovered','实查追回银',recovered,100)]}
  ];
 }
 function afterTurn(s){const d=s.govern24;
  for(const [key,j]of Object.entries(d.offices)){if(!j)continue;const p=officer(s,j.id);if(!p||onLeave(s,j.id)){d.offices[key]=null;continue;}j.served++;if(j.served%3===0){p.merits22=(p.merits22||0)+1;note(s,'御前实绩',p.name+'在'+officeSpec[key].name+'任满三旬，添实绩一份。',{actor:p.id});}}
  for(const r of s.regions){const q=d.regions[r.id];if(!q.project||!ready(s,r.id))continue;q.project.remaining--;if(!q.project.remaining){q.policy=q.project.policy;q.project=null;note(s,'地方方向办成',r.name+'的'+policy(s,r.id).name+'已办成，下一旬开始计新增收入。',{region:r.id});}}
  if(d.marketUntil>s.turn&&priceBlocked(s)){d.marketUntil=0;note(s,'粮价回稳','条件已改变，叶氏本次抬价停止。');}
  resolvePlots(s,true);startPlots(s);
  for(const g of goals(s))if(g.steps.every(a=>a.done)&&!d.honors.some(h=>h.goal===g.id)){d.honors.push({goal:g.id,title:g.title,turn:s.turn,tick:s.tick});note(s,'本朝留名',g.title+'：'+g.steps.map(a=>a.name).join('、')+'已达成，王朝继续。');}
 }
 function advance(s,target){
  if(!active24(s))return base.advance(s,target);if(!nat(target)||target<s.tick||target-s.tick>3660)return {ok:false,error:'日期有误。'};if(base.ended(s))return {ok:false,error:'此局已终。'};
  if(s.battle?.status==='fighting'&&target>=s.nextTick)return {ok:false,error:'先下完军令或撤军，再到下一旬。'};
  while(s.tick<target){const end=Math.min(target,s.nextTick),settling=end===s.nextTick,turn=s.turn,lines=settling?s.regions.map(r=>development(s,r.id)):[];
   if(settling)for(const line of lines){s.economy.treasury+=line.silver;s.economy.grain+=line.grain;for(const k of ['jiang','ye']){s.depth22.clans[k].silver+=line.rents[k];s.depth22.clans[k].grain+=line.grainRents[k];}}
   const result=base.advance(s,end);if(!result.ok)return result;
   if(s.turn>turn){const entry={turn:s.turn,silver:lines.reduce((n,l)=>n+l.silver,0),grain:lines.reduce((n,l)=>n+l.grain,0),lines};s.govern24.ledger.push(entry);s.govern24.ledger=s.govern24.ledger.slice(-36);if(entry.silver||entry.grain)note(s,'发展实收','发展方向另收银'+entry.silver+'、粮'+entry.grain+'，已入库并照田册分成。');if(!base.ended(s))afterTurn(s);}
   if(base.ended(s))break;
  }return {ok:true,ended:base.ended(s)};
 }
 function validate(s){base.validate(s);if(!s.govern24)return true;const d=s.govern24,known=new Set(s.regions.map(r=>r.id));if(d.version!==1||d.enabled!==true||!nat(d.startTurn)||d.startTurn>s.turn||d.graceUntil!==d.startTurn+4||!nat(d.serial)||!d.regions||!d.offices||!d.next||!['jiang','ye'].every(k=>nat(d.next[k]))||!nat(d.marketUntil)||!nat(d.granaryUntil)||!Array.isArray(d.ledger)||d.ledger.length>36||!Array.isArray(d.plots)||!Array.isArray(d.honors)||!['restore','prosper','authority'].includes(d.goal))throw Error('治国经营记录有误。');
  for(const r of s.regions){const q=d.regions[r.id];if(!q||q.policy!==null&&!policySpec[r.id].some(p=>p.id===q.policy)||q.project&&(!policySpec[r.id].some(p=>p.id===q.project.policy)||!Number.isInteger(q.project.remaining)||q.project.remaining<1||q.project.remaining>2||!nat(q.project.started)||q.project.started>s.turn))throw Error('地方发展方向或工期有误。');}
  const assigned=new Set();for(const key of Object.keys(officeSpec)){const j=d.offices[key];if(j!==null&&(!j||!officer(s,j.id)||!nat(j.served)||assigned.has(j.id)||base.busy(s,j.id)||onLeave(s,j.id)))throw Error('御前实职不能重任。');if(j)assigned.add(j.id);}
  for(const p of s.roster){if(p.training24&&(!Array.isArray(p.training24)||p.training24.length>2||p.training24.some(t=>!['military','admin','integrity22'].includes(t.path)||!nat(t.turn)||t.turn>s.turn)))throw Error('人才培养记录有误。');if(p.leaveUntil24!==undefined&&!nat(p.leaveUntil24))throw Error('官员返京日期有误。');if(onLeave(s,p.id)&&employed(s,p.id))throw Error('回府官员仍占实职。');}
  const ids=new Set();for(const a of d.plots){if(!a.id||ids.has(a.id)||!['recall','price'].includes(a.kind)||!['jiang','ye'].includes(a.clan)||!known.has(a.region)||!nat(a.created)||a.created>s.turn||a.due!==a.created+2||a.paid!==30||!['preparing','blocked','executed'].includes(a.status)||a.kind==='recall'&&!s.roster.some(p=>p.id===a.actor))throw Error('世家争人或粮价记录有误。');ids.add(a.id);}
  for(const e of d.ledger){if(!nat(e.turn)||e.turn>s.turn||!nat(e.silver)||!nat(e.grain)||!Array.isArray(e.lines)||e.silver!==e.lines.reduce((n,l)=>n+l.silver,0)||e.grain!==e.lines.reduce((n,l)=>n+l.grain,0)||new Set(e.lines.map(l=>l.region)).size!==e.lines.length)throw Error('地方发展实账有误。');for(const l of e.lines)if(!known.has(l.region)||!nat(l.silver)||!nat(l.grain)||!['jiang','ye'].every(k=>nat(l.rents?.[k])&&nat(l.grainRents?.[k])))throw Error('发展收入来源有误。');}
  if(new Set(d.honors.map(h=>h.goal)).size!==d.honors.length||d.honors.some(h=>!['restore','prosper','authority'].includes(h.goal)||!nat(h.turn)||h.turn>s.turn||!nat(h.tick)||h.tick>s.tick))throw Error('本朝留名记录有误。');return true;
 }
 return {...base,active24,enablePlay,policySpec,officeSpec,posting,onLeave,held,skilled,policy,ready,power,development,quote,forecast,price,reason,command,busy,advance,goals,reconcile,validate};
});
