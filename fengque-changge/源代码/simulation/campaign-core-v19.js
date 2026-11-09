/* V19 campaign: JSON commands, one treasury, explicit assets and battle orders. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FengqueCampaign=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x)),bound=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
 const troops=a=>a.shield+a.bow+a.cavalry;
 const roster=[
  {id:'zhou19',name:'周砚',military:66,admin:38,loyalty:52,clan:'叶氏门生',trait:'守阵',recruited:false},
  {id:'shen19',name:'沈实',military:29,admin:55,loyalty:63,clan:'寒门',trait:'谨慎',recruited:false},
  {id:'liu19',name:'刘岑',military:41,admin:78,loyalty:40,clan:'姜氏门生',trait:'通人情',recruited:false}
 ];
 function note(s,kind,text,extra={}){const e={id:'c19-'+(++s.serial),turn:s.turn,tick:s.tick,kind,text,...extra};s.history.push(e);return e;}
 function create(tick=66){return {version:1,active:true,tick,started:tick,nextTick:tick+10,turn:1,ap:2,serial:0,economy:{treasury:300,grain:200,arrears:0},debt:{principal:3000,installment:300,due:4,overdue:0,paid:0},army:{shield:360,bow:150,cavalry:90,training:40},roster:copy(roster),regions:[
  {id:'capital',name:'京畿',owner:'crown',governor:'existing',silver:40,grain:30,unrest:15,level:1,missing:0},
  {id:'south',name:'南郡',owner:'crown',governor:'existing',silver:20,grain:20,unrest:20,level:1,missing:0},
  {id:'ji',name:'济州',owner:'rebels',governor:null,silver:40,grain:60,unrest:65,level:1,missing:0},
  {id:'pass',name:'雁门关',owner:'enemy',governor:null,silver:30,grain:30,unrest:50,level:1,missing:0},
  {id:'north',name:'朔方城',owner:'enemy',governor:null,silver:60,grain:50,unrest:55,level:1,missing:0}
 ],scouts:[],suppliesOpened:false,trainingDue:0,battle:null,battles:[],audits:[],works:[],petitions:[],history:[],stories:{seen:[],resolved:[],selection:null},profiles:{}};}
 function officer(s,id){return s.roster.find(p=>p.id===id&&p.recruited&&p.alive!==false);}
 function busy(s,id){return s.regions.some(r=>r.governor===id)||s.battle?.commander===id&&s.battle.status==='fighting';}
 function spend(s,m,g=0){s.economy.treasury-=m;s.economy.grain-=g;}
 function reason(s,c){
  if(!s?.active)return '尚未开始这段山河。';
  if(!c||typeof c.type!=='string')return '未收到要办的事。';
  if(!['order','pay','wages'].includes(c.type)&&s.battle?.status==='fighting')return '军令未了，先打完这一仗或撤军。';
  const costs={recruit:[20,0],train:[30,20],supplies:[0,0],scout:[20,0],attack:[60,30],appoint:[0,0],audit:[20,0],farm:[40,10],levy:[0,0],borrow:[0,0]};
  const cost=costs[c.type];if(cost&&(s.ap<1||s.economy.treasury<cost[0]||s.economy.grain<cost[1]))return '这旬安排或钱粮不够，先看账面再办。';
  if(c.type==='recruit'){const p=s.roster.find(p=>p.id===c.id);if(!p||p.recruited||p.alive===false)return '此人已任用，或不在荐举册。';}
  else if(c.type==='train'){if(s.trainingDue>s.turn)return '军中正在操练，等下一旬再验成果。';}
  else if(c.type==='supplies'&&s.suppliesOpened)return '旧库已经清过，不能再领一遍。';
  else if(['scout','attack'].includes(c.type)){
   const r=s.regions.find(r=>r.id===c.region);if(!r||r.owner==='crown')return '此地已在朝廷手中。';
   if(c.region==='north'&&s.regions.find(r=>r.id==='pass').owner!=='crown')return '先取雁门关，才能打通往朔方的路。';
   if(c.type==='scout'&&s.scouts.includes(c.region))return '这一带敌情已经查明。';
   if(c.type==='attack'){
    const p=officer(s,c.commander),a=c.army;if(!p||busy(s,p.id))return '须选一位已经任用、未在地方任职的将领。';
    if(!a||!['shield','bow','cavalry'].every(k=>Number.isInteger(a[k])&&a[k]>=0&&a[k]<=s.army[k]))return '配兵数有误。';
    if(troops(a)<200||troops(s.army)-troops(a)<200)return '出征至少二百人，京畿也须留下二百守军。';
   }
  }else if(['appoint','audit','farm'].includes(c.type)){
   const r=s.regions.find(r=>r.id===c.region);if(!r||r.owner!=='crown')return '先收复此地，再安排地方事务。';
   if(c.type==='appoint'){const p=officer(s,c.id);if(!p||busy(s,p.id))return '此人未任用，或正在别处任职。';}
   if(c.type==='audit'&&(!r.missing||s.audits.some(a=>a.region===r.id&&a.status==='pending')))return '尚无未查的亏空，或已有人在查。';
   if(c.type==='farm'&&(r.level>=3||s.works.some(w=>w.region===r.id&&w.status==='pending')))return '此地田地已修好，或正在恢复耕种。';
  }else if(c.type==='order'){
   if(!s.battle||s.battle.status!=='fighting'||!['hold','volley','flank','charge','retreat'].includes(c.order))return '这道军令眼下不能用。';
  }else if(c.type==='pay'){if(!Number.isInteger(c.amount)||c.amount<=0||c.amount>s.debt.principal||c.amount>s.economy.treasury)return '实还银两须在库银与欠款以内。';}
  else if(c.type==='wages'){if(!Number.isInteger(c.amount)||c.amount<=0||c.amount>s.economy.arrears||c.amount>s.economy.treasury)return '补发银两须在库银与欠薪以内。';}
  else if(c.type==='levy'&&s.lastLevy===s.turn)return '这旬已收过加税。';
  else if(c.type==='borrow'&&s.lastBorrow===s.turn)return '这旬已向叶氏借过银子。';
  else if(c.type==='petition'){
   const p=s.petitions.find(p=>p.id===c.id);if(!p||p.status!=='open'||!['accept','deny'].includes(c.choice))return '这件请托已经答过。';
  }else if(c.type==='disposition'){
   const a=s.audits.find(a=>a.id===c.id);if(!a||a.status!=='verified'||!['recover','dismiss','pardon'].includes(c.choice))return '先核清账目，再处置。';
  }else if(!cost&&!['order','pay','wages','disposition','petition'].includes(c.type))return '未识别的安排。';
  return '';
 }
 function battleOrder(s,order){
  const b=s.battle,p=officer(s,b.commander);if(!p){finish(s,'retreat');return;}
  if(order==='retreat'){finish(s,'retreat');return;}
  const intent=['压向桥头','弓手换阵','追击前队','收缩守阵'][b.round%4];
  let hit={hold:55,volley:75,flank:110,charge:95}[order],loss={hold:12,volley:22,flank:25,charge:38}[order];
  if(order==='hold'&&intent==='压向桥头'){hit+=25;loss-=5;b.enemyExposed=true;}
  if(order==='volley'&&b.remaining.bow<40){hit=30;loss+=10;}
  if(order==='flank'){if(b.remaining.cavalry<35){hit=25;loss+=20;}else if(b.scouted&&intent==='弓手换阵'){hit+=55;loss-=8;}}
  if(order==='charge'&&b.enemyExposed){hit+=65;loss-=16;b.enemyExposed=false;}
  if(!b.scouted&&b.round===0){loss+=20;hit-=20;}
  hit=Math.max(8,Math.round(hit*(.6+troops(b.remaining)/800)+(p.military-60)/2+s.army.training/10));
  if(p.loyalty<35)hit=Math.round(hit*.75);
  if(b.target==='pass')loss+=9;if(b.target==='north')loss+=16;
  loss=Math.min(troops(b.remaining),Math.max(1,loss));let rest=loss;
  for(const k of ['shield','bow','cavalry']){const n=k==='cavalry'?Math.min(rest,b.remaining[k]):Math.min(b.remaining[k],Math.ceil(loss*({shield:.65,bow:.25}[k])));b.remaining[k]-=n;s.army[k]-=n;rest-=n;}
  for(const k of ['shield','bow','cavalry']){const n=Math.min(Math.max(0,rest),b.remaining[k]);b.remaining[k]-=n;s.army[k]-=n;rest-=n;}
  b.enemy=Math.max(0,b.enemy-hit);b.round++;b.orders.push({round:b.round,order,intent,damage:hit,loss,remaining:troops(b.remaining),enemy:b.enemy});
  if(b.enemy===0)finish(s,'won');else if(b.round>=5||troops(b.remaining)<100)finish(s,'lost');
 }
 function finish(s,status){const b=s.battle;b.status=status;b.finished=s.tick;const p=officer(s,b.commander);let text;
  if(status==='won'){const r=s.regions.find(r=>r.id===b.target);r.owner='crown';r.governor=null;r.unrest=65;s.economy.treasury+=240;s.economy.grain+=160;if(p){p.military=bound(p.military+2);p.loyalty=bound(p.loyalty+4);}text='收复'+r.name+'，缴获银240、粮160。先派知府，地方才能送回钱粮。';}
  else text=status==='retreat'?'已撤回剩余部队，本次军费不退，未取得土地。':'战事失利，余部撤回京畿；先休整，再议进军。';
  note(s,'战报',text,{battle:b.id,commander:b.commander});s.battles.push(copy(b));
 }
 function command(s,c){const why=reason(s,c);if(why)return {ok:false,error:why};const cost={recruit:[20,0],train:[30,20],supplies:[0,0],scout:[20,0],attack:[60,30],appoint:[0,0],audit:[20,0],farm:[40,10],levy:[0,0],borrow:[0,0]}[c.type];if(cost){s.ap--;spend(s,...cost);}
  let text='';
  if(c.type==='supplies'){s.suppliesOpened=true;s.economy.treasury+=160;s.economy.grain+=120;text='清出旧库散银160、可用存粮120，已经入账。';}
  if(c.type==='recruit'){const p=s.roster.find(p=>p.id===c.id);p.recruited=true;text=p.name+'通过实试，领到实差；所用银20是考校与行装。';}
  if(c.type==='train'){s.army.training=bound(s.army.training+12);s.trainingDue=s.turn+1;s.army.shield+=60;s.army.bow+=30;s.army.cavalry+=10;text='军营补入新兵一百，整修弓甲；下一旬可再次操练。';}
  if(c.type==='scout'){s.scouts.push(c.region);text='斥候探明桥头、坡上弓阵与侧路；下一仗可以据此下令。';}
  if(c.type==='attack'){const id='battle19-'+(++s.serial),r=s.regions.find(r=>r.id===c.region);s.battle={id,target:r.id,commander:c.commander,initial:copy(c.army),remaining:copy(c.army),enemy:r.id==='ji'?400:r.id==='pass'?520:650,round:0,status:'fighting',scouted:s.scouts.includes(r.id),orders:[],started:s.tick};text='军令已发，出征'+troops(c.army)+'人；留守'+(troops(s.army)-troops(c.army))+'人。';}
  if(c.type==='order'){battleOrder(s,c.order);return {ok:true};}
  if(c.type==='appoint'){const r=s.regions.find(r=>r.id===c.region),p=officer(s,c.id);r.governor=p.id;r.unrest=Math.max(0,r.unrest-15);p.loyalty=bound(p.loyalty+2);text=p.name+'领'+r.name+'知府印。'+(p.clan==='姜氏门生'?'姜氏门生取得了此地经手权。':'此地账册由他本人经手。');if(!s.petitions.some(a=>a.region===r.id)){s.petitions.push({id:'petition19-'+(++s.serial),region:r.id,actor:p.id,kind:'jiang',status:'open'});}}
  if(c.type==='audit'){const r=s.regions.find(r=>r.id===c.region),a={id:'audit19-'+(++s.serial),region:r.id,actor:r.governor,culprit:r.diverter||r.governor,amount:r.missing,due:s.turn+2,status:'pending'};s.audits.push(a);r.missing=0;text='原账已封，另查船单与仓册；两旬后回报，此前不定罪。';}
  if(c.type==='farm'){s.works.push({region:c.region,due:s.turn+2,status:'pending'});text='已送种粮、修复田间水道；两旬后查验，往后每旬增银10、粮20。';}
  if(c.type==='levy'){s.lastLevy=s.turn;s.economy.treasury+=100;for(const r of s.regions.filter(r=>r.owner==='crown'))r.unrest=bound(r.unrest+18);text='加收银100，各地百姓负担加重，怨情增加。';}
  if(c.type==='borrow'){s.lastBorrow=s.turn;s.economy.treasury+=200;if(!s.debt.principal){s.debt.due=s.turn+3;s.debt.currentPaid=0;}s.debt.principal+=200;text='叶氏新借银200，欠款实增200；还期在借据中明列。';}
  if(c.type==='pay'){s.economy.treasury-=c.amount;s.debt.principal-=c.amount;s.debt.paid+=c.amount;const overduePaid=Math.min(c.amount,s.debt.overdue);s.debt.overdue-=overduePaid;s.debt.currentPaid=(s.debt.currentPaid||0)+c.amount-overduePaid;text='实还叶氏银'+c.amount+'，尚欠'+s.debt.principal+'。';}
  if(c.type==='wages'){s.economy.treasury-=c.amount;s.economy.arrears-=c.amount;text='官兵旧欠实发银'+c.amount+'，尚欠薪'+s.economy.arrears+'。';}
  if(c.type==='disposition'){const a=s.audits.find(a=>a.id===c.id),r=s.regions.find(r=>r.id===a.region),p=officer(s,a.actor);a.status='closed';a.decision=c.choice;if(c.choice!=='pardon'){s.economy.treasury+=a.amount;a.recovered=a.amount;r.audited=true;if(p)p.loyalty=bound(p.loyalty+(c.choice==='dismiss'||a.culprit===p.id?-4:2));if(c.choice==='dismiss'&&r.governor===a.actor)r.governor=null;}else{a.recovered=0;r.unrest=bound(r.unrest+10);}text=c.choice==='pardon'?'已经查实的亏空暂不追讨，银两没有回库，百姓议论更多。':'追回已经查实的亏空银'+a.amount+'。'+(c.choice==='dismiss'?'知府因本人经手或监督失察撤职，未据此指认为幕后主使。':'按实据追究留银者，知府留任。');}
  if(c.type==='petition'){const a=s.petitions.find(a=>a.id===c.id),r=s.regions.find(r=>r.id===a.region),p=officer(s,a.actor);a.status='closed';a.decision=c.choice;if(c.choice==='accept'){r.clanSlots=2;if(p)p.loyalty=bound(p.loyalty+6);text='准姜氏门人掌两席税吏，'+r.name+'每旬银15由其经手留用。原知府仍任，家门权力确实扩张。';}else{r.clanSlots=0;if(p&&p.clan==='姜氏门生')p.loyalty=bound(p.loyalty-8);text='驳回姜氏两席税吏之请，地方收入保留。'+(p?.clan==='姜氏门生'?'原知府对朝廷忠诚下降8，差事仍在。':'原任知府不受牵连。');}}
  note(s,'安排',text,{command:c.type,actor:c.id||c.commander||null,region:c.region||null});return {ok:true,text};
 }
 function settle(s){s.turn++;s.ap=2;let income=0,harvest=0;const deliveries=[];
  for(const r of s.regions){if(r.owner!=='crown'||!r.governor)continue;const p=officer(s,r.governor);if(r.governor!=='existing'&&!p){r.governor=null;continue;}let silver=r.silver,grain=r.grain;
   if(!['capital','south'].includes(r.id)){const extra=r.level-1;silver+=extra*10;grain+=extra*20;const missing=r.audited?0:p?.clan==='姜氏门生'?Math.min(15,silver):Math.min(8,silver);silver-=missing;r.missing+=missing;r.diverter=p?.clan==='姜氏门生'?p.id:'local-clerk';const clanRetained=r.clanSlots?15:0;silver=Math.max(0,silver-clanRetained);grain-=20;r.unrest=Math.max(0,r.unrest-(p?.admin>=70?15:10));deliveries.push({region:r.id,expected:r.silver+extra*10,actual:silver,grain,missing,clanRetained,actor:r.governor});}
   if(r.id==='south'&&s.debt.overdue>=300){silver=Math.max(0,silver-15);grain=Math.max(0,grain-15);note(s,'叶氏停运','逾期银已满三百，叶氏暂扣南郡运额：本旬少到银15、粮15；实还逾期至三百以下即可恢复。');}
   if(['capital','south'].includes(r.id)){silver+=(r.level-1)*10;grain+=(r.level-1)*20;}
   income+=silver;harvest+=grain;
  }
  const extra=Math.max(0,Math.ceil((troops(s.army)-600)/100)),silverCost=80+extra*6,grainCost=80+extra*8;
  const e=s.economy,paidSilver=Math.min(e.treasury+income,silverCost),paidGrain=Math.min(e.grain+harvest,grainCost);e.treasury+=income-paidSilver;e.grain+=harvest-paidGrain;e.arrears+=silverCost-paidSilver;
  if(paidGrain<grainCost||paidSilver<silverCost)for(const p of s.roster.filter(p=>p.recruited))p.loyalty=bound(p.loyalty-3);
  for(const a of s.audits)if(a.status==='pending'&&a.due<=s.turn){a.status='verified';note(s,'查账回报','船单、收据与仓册相互对上：'+s.regions.find(r=>r.id===a.region).name+(a.culprit==='local-clerk'?'仓吏':'知府本人')+'账外留银'+a.amount+'。可据实追款，未查明幕后主使。',{audit:a.id});}
  for(const w of s.works)if(w.status==='pending'&&w.due<=s.turn){w.status='done';const r=s.regions.find(r=>r.id===w.region);r.level++;note(s,'田地恢复',r.name+'田间水道已通，下一旬起增产。');}
  const d=s.debt;if(d.principal&&s.turn>=d.due){const due=Math.min(d.principal+(d.currentPaid||0),d.installment),remaining=Math.max(0,due-(d.currentPaid||0)),paid=Math.min(remaining,e.treasury,d.principal);e.treasury-=paid;d.principal-=paid;d.paid+=paid;d.overdue=Math.min(d.principal,d.overdue+Math.max(0,remaining-paid));d.currentPaid=0;d.due+=3;note(s,'叶氏借据','本期应还'+due+'，到期实还'+paid+'；尚欠本金'+d.principal+'，其中逾期'+d.overdue+'。');}
  note(s,'旬结','收银'+income+'、粮'+harvest+'；常费实支银'+paidSilver+'、粮'+paidGrain+'。',{income,harvest,paidSilver,paidGrain,deliveries});
 }
 function advance(s,target){if(!Number.isInteger(target)||target<s.tick)throw Error('山河日期不能倒退。');if(s.battle?.status==='fighting'&&target>=s.nextTick)return {ok:false,error:'先结束这场战斗，再推到下一旬。'};while(s.nextTick<=target){s.tick=s.nextTick;settle(s);s.nextTick+=10;}s.tick=target;return {ok:true};}
 function validate(s){
  const nat=n=>Number.isInteger(n)&&n>=0;
  if(s?.version!==1||s.active!==true||!nat(s.tick)||!nat(s.started)||!nat(s.turn)||s.turn<1||!nat(s.nextTick)||s.nextTick<=s.tick||!nat(s.ap)||s.ap>2||!nat(s.serial))throw Error('山河进度不完整。');
  if(!s.economy||!['treasury','grain','arrears'].every(k=>nat(s.economy[k]))||!s.debt||!['principal','installment','due','overdue','paid'].every(k=>nat(s.debt[k]))||s.debt.overdue>s.debt.principal||!s.army||!['shield','bow','cavalry','training'].every(k=>nat(s.army[k])))throw Error('山河钱粮或军队记录有误。');
  for(const key of ['roster','regions','history','audits','works','scouts','battles','petitions'])if(!Array.isArray(s[key]))throw Error('山河册缺页。');
  if(new Set(s.roster.map(p=>p.id)).size!==s.roster.length||new Set(s.regions.map(r=>r.id)).size!==s.regions.length||!['capital','south','ji','pass','north'].every(id=>s.regions.some(r=>r.id===id)))throw Error('人物或疆域编号有误。');
  for(const r of s.regions)if(!['crown','rebels','enemy'].includes(r.owner)||!nat(r.missing)||!nat(r.level)||r.governor&&r.governor!=='existing'&&!s.roster.some(p=>p.id===r.governor&&p.recruited))throw Error('地方经手记录有误。');
  if(s.battle){const b=s.battle;if(!['fighting','won','lost','retreat'].includes(b.status)||!nat(b.enemy)||!nat(b.round)||b.round>5||!s.regions.some(r=>r.id===b.target)||!s.roster.some(p=>p.id===b.commander)||!['shield','bow','cavalry'].every(k=>nat(b.remaining?.[k])&&nat(b.initial?.[k])&&b.remaining[k]<=b.initial[k])||!Array.isArray(b.orders))throw Error('战场记录有误。');}
  return true;
 }
 return {create,command,advance,validate,reason,troops,officer,busy};
});
