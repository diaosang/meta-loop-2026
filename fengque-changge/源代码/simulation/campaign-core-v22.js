/* V22: optional deeper realm rules. Pure JSON, no browser clock or DOM. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./campaign-core-v19.js'));else root.FengqueCampaign22=factory(root.FengqueCampaign);})(typeof globalThis!=='undefined'?globalThis:this,function(base){
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x)),cap=(n,a=0,b=100)=>Math.max(a,Math.min(b,n)),types=['shield','bow','cavalry'];
 const total=base.troops,zero=()=>({shield:0,bow:0,cavalry:0});
 const ownerName={crown:'朝廷',rebels:'起义军',enemy:'北燕'};
 const estates={capital:[25,40,20,15],south:[15,15,50,20],ji:[15,25,15,45],pass:[20,10,10,60],north:[15,10,25,50]};
 const borders={capital:['ji','pass','south'],south:['ji','capital'],ji:['south','capital'],pass:['capital','north'],north:['pass']};
 const guard={capital:0,south:0,ji:400,pass:520,north:650};
 const talentPool=[
  {id:'gu22',name:'顾行简',age:27,gender:'男',clan:'寒门',military:34,admin:76,loyalty:66,integrity:90,trait:'清慎',desc:'县学出身，曾替邻里核过灾年粮册。理事耐心，不肯替豪户遮掩。'},
  {id:'qin22',name:'秦照野',age:25,gender:'男',clan:'边军',military:79,admin:36,loyalty:59,integrity:65,trait:'善骑',desc:'边营副尉，擅走侧路，带过被断粮的游骑。熟军务，对京中人情不大耐烦。'},
  {id:'ruan22',name:'阮青棠',age:29,gender:'女',clan:'寒门',military:43,admin:71,loyalty:72,integrity:84,trait:'知农事',desc:'曾替县中修水册、分种粮。重视田亩与百姓生计，擅长恢复耕种。'},
  {id:'pei22',name:'裴观澜',age:31,gender:'男',clan:'姜氏门生',military:45,admin:86,loyalty:39,integrity:43,trait:'通政务',desc:'在姜氏门下多年，熟悉六部章程，办事极快。遇到家门利益时，未必肯全依朝廷。'},
  {id:'ye22',name:'叶书衡',age:28,gender:'男',clan:'叶氏旁支',military:48,admin:79,loyalty:46,integrity:58,trait:'善理财',desc:'叶氏旁支，曾管沿河货栈。懂市价和运额，另有自己的家业；亲属关系尚待实访。'},
  {id:'wen22',name:'闻清和',age:30,gender:'男',clan:'医户',military:31,admin:68,loyalty:74,integrity:91,trait:'恤民',desc:'随父行医，灾年曾管施粥。长于安置流民，不愿用重税逼百姓。'},
  {id:'han22',name:'韩定川',age:33,gender:'男',clan:'军户',military:74,admin:49,loyalty:69,integrity:77,trait:'守阵',desc:'出身军户，在关城守过多年。看重军饷和守兵的性命，不轻许冒进。'},
  {id:'lin22',name:'林映雪',age:26,gender:'女',clan:'书吏之家',military:37,admin:81,loyalty:61,integrity:82,trait:'善核账',desc:'家中世代抄录账册，能从零散收据对出缺项。愿凭本事任实职，不依附京中门第。'}
 ];
 const active=s=>s?.depth22?.enabled===true;
 const region=(s,id)=>s.regions.find(r=>r.id===id),detail=(s,id)=>s.depth22.regions[id];
 const person=(s,id)=>base.officer(s,id),faction=p=>p?.clan?.includes('姜')?'jiang':p?.clan?.includes('叶')?'ye':null;
 function note(s,kind,text,extra={}){const e={id:'c19-'+(++s.serial),turn:s.turn,tick:s.tick,kind,text,...extra};s.history.push(e);return e;}
 function enable(s){
  if(active(s))return s;
  if(s.battle?.status==='fighting')throw Error('先结束眼下战事，再接入新经营。');
  const d={version:1,enabled:true,startTurn:s.turn,graceUntil:s.turn+2,serial:0,regions:{},clans:{jiang:{name:'姜氏',silver:100,grain:100,mood:50,nextPlan:s.turn+3},ye:{name:'叶氏',silver:600,grain:500,mood:45,nextPlan:s.turn+3}},plots:[],raids:[],sought:0,lastSeek:s.turn-2,loot:s.battles.filter(b=>b.status==='won').map(b=>b.target),lastBudget:null};
  for(const r of s.regions){const [crown,jiang,ye,free]=estates[r.id];d.regions[r.id]={estate:{crown,jiang,ye,free},market:0,fort:r.id==='capital'?1:0,route:0,garrison:zero(),guard:r.owner==='crown'?0:guard[r.id],escrow:r.missing?[{amount:r.missing,actor:r.diverter||'local-clerk',kind:'old'}]:[],sealUntil:0,transportUntil:0,taxConsent:!!r.clanSlots,turnsServed:0};}
  for(const p of s.roster){p.integrity22=p.id==='shen19'?86:p.id==='liu19'?45:66;p.merits22=p.merits22||0;}
  s.depth22=d;note(s,'新政','州府、田册与驻军已另开一页。新增世家行动与敌情留有两旬准备，不倒填往事。');return s;
 }
 function freeArmy(s){const a=clone(s.army);for(const q of Object.values(s.depth22.regions))for(const k of types)a[k]-=q.garrison[k];if(s.battle?.status==='fighting')for(const k of types)a[k]-=s.battle.remaining[k];return Object.fromEntries(types.map(k=>[k,Math.max(0,a[k])]))}
 function influence(s,key){let n=key==='ye'?Math.min(15,Math.floor(s.debt.principal/200)):0;for(const r of s.regions){if(r.owner!=='crown')continue;n+=detail(s,r.id).estate[key]*.25;if(faction(person(s,r.governor))===key)n+=8;if(key==='jiang'&&r.clanSlots)n+=10;}return cap(Math.round(n));}
 function quote(s,r,actual=false){
  const q=detail(s,r.id),p=person(s,r.governor);
  if(r.owner!=='crown'||!r.governor||r.governor!=='existing'&&!p)return {region:r.id,silver:0,grain:0,grossSilver:0,grossGrain:0,missing:0,rents:{jiang:0,ye:0},grainRents:{jiang:0,ye:0},clanRetained:0,blocked:0};
  const admin=p?.admin||50,extra=r.level-1;
  let grossSilver=Math.max(0,r.silver+extra*10+q.market*20+(admin>=70?10:admin<40?-5:0)+(p?.trait==='善理财'?8:0));
  let grossGrain=r.grain+extra*20+(p?.trait==='知农事'?15:0);
  const unrest=Math.max(0,r.unrest-30);grossSilver-=Math.floor(grossSilver*unrest/200);grossGrain-=Math.floor(grossGrain*unrest/200);
  const rents={},grainRents={};for(const k of ['jiang','ye']){rents[k]=Math.floor(grossSilver*q.estate[k]*.003);grainRents[k]=Math.floor(grossGrain*q.estate[k]*.002);}
  const clanRetained=r.clanSlots?Math.min(15,grossSilver-rents.jiang-rents.ye):0;
  const blocking=q.transportUntil>=s.turn&&!q.route;
  const blocked=blocking?Math.min(15,Math.max(0,grossSilver-rents.jiang-rents.ye-clanRetained)):0;
  const rawGrain=Math.max(0,grossGrain-grainRents.jiang-grainRents.ye-(r.id==='capital'||r.id==='south'?0:q.route?5:20)),blockedGrain=blocking?Math.min(15,rawGrain):0;
  const hidden=actual&&!r.audited&&p&&(p.integrity22||0)<75?Math.min(Math.max(0,grossSilver-rents.jiang-rents.ye-clanRetained-blocked),12,Math.max(2,Math.floor((100-p.integrity22)/8))):0;
  const forced=q.taxConsent?0:clanRetained;
  const silver=Math.max(0,grossSilver-rents.jiang-rents.ye-clanRetained-blocked-hidden);
  const grain=rawGrain-blockedGrain;
  return {region:r.id,silver,grain,grossSilver,grossGrain,rents,grainRents,clanRetained,missing:hidden+forced,hidden,forced,blocked,blockedGrain,actor:r.governor};
 }
 function forecast(s){if(!active(s))return null;const lines=s.regions.map(r=>quote(s,r)),extra=Math.max(0,Math.ceil((total(s.army)-600)/100)),costSilver=80+extra*6,costGrain=80+extra*8;return {lines,silver:lines.reduce((a,r)=>a+r.silver,0)-costSilver,grain:lines.reduce((a,r)=>a+r.grain,0)-costGrain,costSilver,costGrain};}
 const projectSpec={market:{silver:50,grain:0,label:'重开集市',key:'market'},fort:{silver:50,grain:10,label:'修补城防',key:'fort'},route:{silver:70,grain:10,label:'修官道',key:'route'}};
 function costReason(s,silver,grain=0,affair=true){if(affair&&s.ap<1)return '这旬国事已用完，先安排日常或到下一旬。';if(s.economy.treasury<silver)return '库银不足，先看钱粮与旧库。';if(s.economy.grain<grain)return '存粮不足，先恢复粮田或实际购粮。';return '';}
 function reason(s,c){
  if(!active(s))return base.reason(s,c);
  if(!c||typeof c.type!=='string')return '未收到安排。';
  if(s.battle?.status==='fighting'&&!['order','pay','wages'].includes(c.type))return '先下完这场军令或撤军，再办别的国事。';
  const r=c.region&&region(s,c.region),q=r&&detail(s,r.id),p=c.id&&person(s,c.id);
  if(['build22','redeem22','seal22','revoke22','relief22','station22'].includes(c.type)&&(!r||r.owner!=='crown'))return '须先收复这处地方。';
  if(c.type==='build22'){
   const spec=projectSpec[c.project];if(!spec)return '未选定工程。';const why=costReason(s,spec.silver,spec.grain);if(why)return why;
   if(q[spec.key]>=(spec.key==='route'?1:2))return '这处工程已经修妥。';if(s.works.some(w=>w.status==='pending'&&w.region===r.id&&w.project22===c.project))return '同一工程正在办，等回报再看。';return '';
  }
  if(c.type==='redeem22'){if(!['jiang','ye'].includes(c.clan)||q.estate[c.clan]<10)return '这家在当地已不足十份田，不能再按此数赎回。';return costReason(s,60);}
  if(c.type==='seal22'){if(q.sealUntil>=s.turn+2)return '此地税册仍封存着，不必重复花费。';return costReason(s,20);}
  if(c.type==='revoke22'){if(!r.clanSlots)return '此地没有家族税吏席位。';if(!r.audited&&q.estate.jiang>=25)return '先查出实据，或将姜氏在此地的田产降到二十五份以下，再收回税册。';return costReason(s,20);}
  if(c.type==='relief22'){if(r.unrest<15)return '眼下民情尚稳，不必重复派粮。';return costReason(s,0,30);}
  if(c.type==='station22'){
   if(r.id==='capital')return '京营为未调出的兵，不另设一份驻军。';if(!Number.isInteger(c.amount)||![0,100,200,300].includes(c.amount))return '请选择调回、驻守一百、二百或三百。';if(total(q.garrison)===c.amount)return '驻兵数没有改变。';
   const available=freeArmy(s),delta=c.amount-total(q.garrison);if(delta>0&&total(available)-delta<200)return '京畿须留下二百，兵不足时先到军营补兵。';return costReason(s,0,delta>0?5:0,false);
  }
  if(c.type==='seek22'){if(s.depth22.sought>=talentPool.length)return '这一批访单已经查遍，现有人才仍可培养。';if(s.turn-s.depth22.lastSeek<2)return '访人才需要两旬，先看看已来的人。';return costReason(s,25);}
  if(c.type==='reward22'){if(!p||!(p.merits22>0))return '须已任用且有实绩，方可论功赏银。';return costReason(s,20);}
  if(c.type==='buygrain22'){if(s.depth22.lastGrain===s.turn)return '这旬已经采买过一批粮。';if(s.depth22.clans.ye.grain<80)return '叶氏货栈这批存粮不足八十，先等运额补来。';return costReason(s,s.depth22.regions.south.route?60:80,0,false);}
  if(c.type==='attack'){
   const why=base.reason(s,c);if(why)return why;const a=freeArmy(s);if(!types.every(k=>c.army[k]<=a[k])||total(a)-total(c.army)<200)return '驻守州城的兵不能再出征；京营还须留二百。';return '';
  }
  if(c.type==='borrow'&&s.depth22.clans.ye.silver<200)return '叶氏现银不足二百，这一旬不能再借。';
  if(c.type==='appoint'&&r?.governor===c.id)return '此人已经在这里任职。';
  return base.reason(s,c);
 }
 function spend(s,silver,grain=0,affair=true){s.economy.treasury-=silver;s.economy.grain-=grain;if(affair)s.ap--;}
 function allocate(s,q,n){const previous=clone(q.garrison),a=freeArmy(s);for(const k of types)a[k]+=previous[k];q.garrison=zero();let remaining=n;for(const k of types){q.garrison[k]=Math.min(a[k],remaining);remaining-=q.garrison[k];}}
 function command(s,c){
  if(!active(s))return base.command(s,c);const why=reason(s,c);if(why)return {ok:false,error:why};
  const d=s.depth22,r=c.region&&region(s,c.region),q=r&&detail(s,r.id);let text='';
  if(c.type==='build22'){const p=projectSpec[c.project];spend(s,p.silver,p.grain);s.works.push({region:r.id,due:s.turn+2,status:'pending',project22:c.project});text=r.name+'已开始'+p.label+'，两旬后查验。';}
  else if(c.type==='redeem22'){spend(s,60);q.estate[c.clan]-=10;q.estate.crown+=10;d.clans[c.clan].silver+=60;d.clans[c.clan].mood=cap(d.clans[c.clan].mood-4);text='以库银60赎回'+r.name+'的'+d.clans[c.clan].name+'田十份，银已交原主，田归官田；下一旬租额按新田册算。';}
  else if(c.type==='seal22'){spend(s,20);q.sealUntil=s.turn+3;text=r.name+'税册暂封三旬，官吏共同验印；封存期间姜氏不能接管税册。';}
  else if(c.type==='revoke22'){spend(s,20);r.clanSlots=0;q.taxConsent=false;d.clans.jiang.mood=cap(d.clans.jiang.mood-12);const p=person(s,r.governor);if(faction(p)==='jiang')p.loyalty=cap(p.loyalty-8);text='已收回'+r.name+'两席税吏。往后不再留用该笔银15，已查款仍须按实据追讨。';}
  else if(c.type==='relief22'){spend(s,0,30);r.unrest=cap(r.unrest-25);const p=person(s,r.governor);if(p)p.loyalty=cap(p.loyalty+2);text='存粮30已送'+r.name+'分给百姓，怨情下降25。';}
  else if(c.type==='station22'){const before=total(q.garrison);allocate(s,q,c.amount);if(c.amount>before)s.economy.grain-=5;text=r.name+'现驻兵'+c.amount+'；兵从京营调拨，共用原有兵额，未另生新兵。';}
  else if(c.type==='seek22'){
   spend(s,25);const added=talentPool.slice(d.sought,d.sought+2).map(p=>({...clone(p),recruited:false,alive:true,integrity22:p.integrity,merits22:0}));s.roster.push(...added);d.sought+=added.length;d.lastSeek=s.turn;text='访得'+added.map(p=>p.name).join('、')+'，已入荐举册，尚须亲自考校任用。';
  }
  else if(c.type==='reward22'){spend(s,20);const p=person(s,c.id);p.merits22--;p.loyalty=cap(p.loyalty+12);text='按实绩赏'+p.name+'银20，消去一项待赏功绩；忠诚上升12，私交不随此改变。';}
  else if(c.type==='buygrain22'){const price=d.regions.south.route?60:80;spend(s,price,0,false);s.economy.grain+=80;d.clans.ye.grain-=80;d.clans.ye.silver+=price;d.lastGrain=s.turn;text='实付银'+price+'，从叶氏货栈买粮80，已经入仓；未增加借款。';}
  else if(c.type==='order'){battleOrder(s,c.order);return {ok:true};}
  else {
   const oldGovernor=r?.governor,oldAmount=c.type==='disposition'?s.audits.find(a=>a.id===c.id)?.amount:0;
   const result=base.command(s,c);if(!result.ok)return result;
   if(c.type==='appoint'){const old=person(s,oldGovernor);if(old&&old.id!==c.id)old.loyalty=cap(old.loyalty-3);q.turnsServed=0;}
   if(c.type==='attack'){s.battle.enemy=Math.max(100,q.guard);s.battle.terrain22=r.id;s.battle.owner22=r.owner;}
   if(c.type==='audit'){const a=s.audits[s.audits.length-1];a.entries22=clone(q.escrow);q.escrow=[];}
   if(c.type==='disposition'){const a=s.audits.find(a=>a.id===c.id);if(a.entries22&&c.choice==='pardon'){detail(s,a.region).released=(detail(s,a.region).released||0)+oldAmount;}a.entries22=[];}
   if(c.type==='petition'){const a=s.petitions.find(a=>a.id===c.id);detail(s,a.region).taxConsent=c.choice==='accept';d.clans.jiang.mood=cap(d.clans.jiang.mood+(c.choice==='accept'?6:-8));}
   if(c.type==='wages'){const gain=Math.min(5,Math.floor(c.amount/20));for(const p of s.roster.filter(p=>p.recruited&&p.alive!==false))p.loyalty=cap(p.loyalty+gain);}
   if(c.type==='pay')d.clans.ye.silver+=c.amount;
   if(c.type==='borrow')d.clans.ye.silver-=200;
   return result;
  }
  note(s,'安排',text,{command:c.type,actor:c.id||null,region:c.region||null});return {ok:true,text};
 }
 const intents={ji:['压向桥头','弓手换阵','追击前队','收缩守阵'],pass:['凭关放箭','重盾出关','骑兵压翼','据险收阵'],north:['骑兵试探','穿插侧翼','弓骑回射','佯退诱追']};
 function battleInfo(s){const b=s.battle;if(!b)return null;const list=intents[b.target]||intents.ji;return {intent:list[b.round%4],repeating:b.orders.length>=2&&b.orders.at(-1).order===b.orders.at(-2).order,terrain:b.target==='pass'?'关隘':b.target==='north'?'旷野':'河桥'};}
 function loseTroops(s,a,n){let left=Math.min(total(a),n),lost=left;for(const [k,part]of [['shield',.65],['bow',.25],['cavalry',.10]]){const v=Math.min(a[k],left,Math.floor(lost*part));a[k]-=v;s.army[k]-=v;left-=v;}for(const k of types){const v=Math.min(a[k],left);a[k]-=v;s.army[k]-=v;left-=v;}return lost-left;}
 function battleOrder(s,order){
  const b=s.battle,p=person(s,b.commander);if(order==='retreat'||!p){finish(s,'retreat');return;}
  const info=battleInfo(s),round=b.round%4;let hit={hold:55,volley:75,flank:110,charge:95}[order],loss={hold:12,volley:22,flank:25,charge:38}[order];
  const ideal=b.target==='pass'?['volley','hold','volley','flank'][round]:b.target==='north'?['hold','volley','hold','flank'][round]:['hold','flank','charge','volley'][round];
  if(order===ideal){hit+=40;loss=Math.max(4,loss-10);b.enemyExposed=true;}
  if(order==='volley'&&b.remaining.bow<40){hit=30;loss+=10;}
  if(order==='flank'){if(b.remaining.cavalry<35){hit=25;loss+=20;}else if(b.scouted&&order===ideal)hit+=25;}
  if(order==='charge'&&b.enemyExposed){hit+=45;loss=Math.max(5,loss-10);b.enemyExposed=false;}
  if(b.target==='north'&&round===3&&order==='charge'){hit=Math.floor(hit*.5);loss+=25;}
  if(info.repeating&&b.orders.at(-1).order===order){hit=Math.floor(hit*.7);loss+=12;}
  if(!b.scouted&&b.round===0){loss+=20;hit=Math.max(10,hit-20);}
  hit=Math.max(8,Math.round(hit*(.6+total(b.remaining)/800)+(p.military-60)/2+s.army.training/10+(p.trait==='善骑'&&order==='flank'?15:0)));
  if(p.loyalty<35)hit=Math.round(hit*.75);if(b.target==='pass')loss+=9;if(b.target==='north')loss+=16;
  const actualLoss=loseTroops(s,b.remaining,Math.max(1,loss));b.enemy=Math.max(0,b.enemy-hit);b.round++;b.orders.push({round:b.round,order,intent:info.intent,damage:hit,loss:actualLoss,remaining:total(b.remaining),enemy:b.enemy});
  if(!b.enemy)finish(s,'won');else if(b.round>=5||total(b.remaining)<100)finish(s,'lost');
 }
 function finish(s,status){
  const b=s.battle,r=region(s,b.target),q=detail(s,r.id),p=person(s,b.commander);b.status=status;b.finished=s.tick;let text;
  if(status==='won'){
   r.owner='crown';r.governor=null;r.unrest=65;q.guard=0;
   const first=!s.depth22.loot.includes(r.id);if(first){s.economy.treasury+=240;s.economy.grain+=160;s.depth22.loot.push(r.id);}if(p){p.military=cap(p.military+2);p.loyalty=cap(p.loyalty+4);p.merits22++;}
   for(const raid of s.depth22.raids)if(raid.origin===r.id&&raid.status==='preparing'){raid.status='cancelled';note(s,'敌情解除',r.name+'已被收复，原拟从此出发的袭扰停止。',{raid:raid.id});}
   text='收复'+r.name+'。'+(first?'首次缴获银240、粮160已入库。':'此地此前已收缴过物资，本次不重复发缴获。')+'任知府后才有钱粮上解。';
  }else {q.guard=Math.max(100,b.enemy);text=status==='retreat'?'已撤回余部，本次军费不退，未取得土地。':'战事失利，余部退回京营；敌阵与本次战损均留在军报上。';}
  note(s,'战报',text,{battle:b.id,commander:b.commander,region:r.id});s.battles.push(clone(b));
 }
 function settleProjects(s){
  for(const a of s.audits)if(a.status==='pending'&&a.due<=s.turn){a.status='verified';const who=[...new Set((a.entries22||[]).map(e=>e.actor==='jiang-tax22'?'姜氏税吏':person(s,e.actor)?.name||'地方经手人'))].join('、');note(s,'查账回报',region(s,a.region).name+'原册、船单与收据已经对上：'+(who||'地方经手人')+'账外留银'+a.amount+'。可按实数追款，不据此指认未查明的幕后之人。',{audit:a.id});}
  for(const w of s.works)if(w.status==='pending'&&w.due<=s.turn){const r=region(s,w.region);if(r.owner!=='crown'){w.due++;if(!w.paused22){note(s,'工程暂缓',r.name+'尚在敌手，工程暂停，收复以后再查验。',{region:r.id});w.paused22=true;}continue;}w.status='done';if(w.project22){detail(s,r.id)[projectSpec[w.project22].key]++;note(s,'工程回报',r.name+projectSpec[w.project22].label+'已完工，下一旬起按新条件算。',{region:r.id});}else{r.level++;note(s,'田地恢复',r.name+'田间水道已通，下一旬起增产。',{region:r.id});}}
 }
 function plots(s){
  const d=s.depth22;
  for(const a of d.plots.filter(a=>a.status==='preparing')){
   const r=region(s,a.region),q=detail(s,r.id),p=person(s,r.governor);let blocked=r.owner!=='crown';
   if(a.clan==='jiang')blocked ||= q.sealUntil>=s.turn||q.estate.jiang<20||(p?.loyalty>=65)||!!r.clanSlots;
   else blocked ||= q.route>0||q.estate.ye<30||s.debt.paid-a.paidBaseline>=100||s.debt.principal===0;
   if(blocked){a.status='blocked';note(s,'世家回音',d.clans[a.clan].name+'在'+r.name+'的'+a.label+'没有办成；实际任官、田产或运道已改变条件。',{plot:a.id,region:r.id});continue;}
   if(a.due<=s.turn){a.status='executed';if(a.clan==='jiang'){r.clanSlots=2;q.taxConsent=false;note(s,'姜氏夺税册',r.name+'税册被姜氏税吏接手，往后每旬私扣银15。可查实、撤其席位，或先改变当地经手权。',{plot:a.id,region:r.id});}else{q.transportUntil=s.turn+3;note(s,'叶氏扣运',r.name+'运额被截三旬，每旬少到银15、粮15。修通官道可绕行，债额仍照借据。',{plot:a.id,region:r.id});}}
  }
  if(s.turn<=d.graceUntil)return;
  for(const key of ['jiang','ye']){
   const clan=d.clans[key];if(s.turn<clan.nextPlan||clan.silver<30||d.plots.some(a=>a.clan===key&&a.status==='preparing'))continue;
   const r=s.regions.find(r=>{if(r.owner!=='crown')return false;const q=detail(s,r.id),p=person(s,r.governor);return key==='jiang'?q.estate.jiang>=20&&!r.clanSlots&&q.sealUntil<s.turn&&(p?.loyalty||50)<65:q.estate.ye>=30&&!q.route&&s.debt.principal>0&&q.transportUntil<s.turn;});
   if(!r)continue;clan.silver-=30;clan.nextPlan=s.turn+4;
   const a={id:'plot22-'+(++d.serial),clan:key,region:r.id,label:key==='jiang'?'夺税册':'扣运额',status:'preparing',created:s.turn,due:s.turn+2,paidBaseline:s.debt.paid};d.plots.push(a);note(s,'世家动向',clan.name+'正准备在'+r.name+a.label+'，预计第'+a.due+'旬动手。尚有两旬可改任官、田册或运道。',{plot:a.id,region:r.id});
  }
 }
 function resolveRaid(s,a){
  const r=region(s,a.target),q=detail(s,r.id),origin=region(s,a.origin);if(origin.owner==='crown'||r.owner!=='crown'){a.status='cancelled';if(origin.owner!=='crown')detail(s,origin.id).guard+=a.force;return;}
  const defenders=r.id==='capital'?freeArmy(s):q.garrison,p=person(s,r.governor),strength=total(defenders)+q.fort*80+Math.floor((p?.military||35)/2),needed=a.force+(origin.owner==='enemy'?40:10),won=strength>=needed;
  const loss=loseTroops(s,defenders,Math.min(total(defenders),Math.ceil(a.force*(won?.10:.20))));if(r.id==='capital'){/* freeArmy returns a view copy; army was reduced by loseTroops. */}
  a.status=won?'repelled':'broke';a.loss=loss;a.defense=strength;a.required=needed;a.resolved=s.turn;
  const returning=Math.round(a.force*(won?.3:.75));if(origin.owner!=='crown')detail(s,origin.id).guard+=returning;
  if(won){if(p){p.military=cap(p.military+1);p.merits22++;}note(s,'守城回报',r.name+'守住了。驻兵与城防合计'+strength+'，对方来势'+needed+'；实际折兵'+loss+'。',{raid:a.id,region:r.id});}
  else {r.unrest=cap(r.unrest+15);if(r.id==='capital'){const silver=Math.min(40,s.economy.treasury),grain=Math.min(30,s.economy.grain);s.economy.treasury-=silver;s.economy.grain-=grain;note(s,'京畿遭扰','敌骑劫去银'+silver+'、粮'+grain+'，折兵'+loss+'；京畿仍在朝廷掌管。',{raid:a.id,region:r.id});}else{r.owner=origin.owner;r.governor=null;q.garrison=zero();q.guard=Math.max(100,a.force-returning);q.fort=Math.max(0,q.fort-1);if(p)p.loyalty=cap(p.loyalty-6);note(s,'州城失守',r.name+'守力'+strength+'未抵住来势'+needed+'，折兵'+loss+'，余兵退回京营。地方停止交粮，原知府已撤回。',{raid:a.id,region:r.id});}}
 }
 function raids(s){
  const d=s.depth22;for(const a of d.raids.filter(a=>a.status==='preparing'&&a.due<=s.turn))resolveRaid(s,a);
  if(s.turn<=d.graceUntil)return;
  for(const r of s.regions.filter(r=>r.owner!=='crown')){
   const q=detail(s,r.id);q.guard=Math.min(Math.round(guard[r.id]*1.3),q.guard+15);
   if(q.guard<200||d.raids.some(a=>a.origin===r.id&&a.status==='preparing')||s.turn<(q.nextRaid||d.startTurn+3))continue;
   const target=borders[r.id].map(id=>region(s,id)).filter(r=>r.owner==='crown').sort((a,b)=>(a.id==='capital')-(b.id==='capital'))[0];if(!target)continue;
   const force=Math.min(230,Math.floor(q.guard*.4));q.guard-=force;q.nextRaid=s.turn+4;
   const a={id:'raid22-'+(++d.serial),origin:r.id,target:target.id,force,status:'preparing',created:s.turn,due:s.turn+2};d.raids.push(a);note(s,'边境急报',r.name+'有'+ownerName[r.owner]+'兵'+force+'集结，预计第'+a.due+'旬袭扰'+target.name+'。可驻兵、修城防，或先取其出发地。',{raid:a.id,region:target.id});
  }
 }
 function settle(s){
  s.turn++;s.ap=2;const d=s.depth22,deliveries=[],rents={jiang:{silver:0,grain:0},ye:{silver:0,grain:0}};let income=0,harvest=0;
  for(const r of s.regions){
   if(r.owner!=='crown'||!r.governor)continue;const p=person(s,r.governor);if(r.governor!=='existing'&&!p){r.governor=null;continue;}
   const q=detail(s,r.id),line=quote(s,r,true);income+=line.silver;harvest+=line.grain;deliveries.push(line);
   for(const key of ['jiang','ye']){rents[key].silver+=line.rents[key];rents[key].grain+=line.grainRents[key];}
   rents.ye.silver+=line.blocked;rents.ye.grain+=line.blockedGrain;
   if(line.clanRetained&&q.taxConsent)rents.jiang.silver+=line.clanRetained;
   if(line.hidden){q.escrow.push({amount:line.hidden,actor:p.id,kind:'diversion',turn:s.turn});r.diverter=p.id;}
   if(line.forced){q.escrow.push({amount:line.forced,actor:'jiang-tax22',kind:'forced-tax',turn:s.turn});r.diverter='jiang-tax22';}
   r.missing+=line.missing;r.unrest=cap(r.unrest-(p?.trait==='恤民'?15:p?.admin>=70?12:7));q.turnsServed++;
   if(p&&q.turnsServed%3===0){p.admin=cap(p.admin+1);p.merits22++;}
  }
  for(const key of ['jiang','ye']){d.clans[key].silver+=rents[key].silver;d.clans[key].grain+=rents[key].grain;}
  const extra=Math.max(0,Math.ceil((total(s.army)-600)/100)),silverCost=80+extra*6,grainCost=80+extra*8,e=s.economy,paidSilver=Math.min(e.treasury+income,silverCost),paidGrain=Math.min(e.grain+harvest,grainCost);e.treasury+=income-paidSilver;e.grain+=harvest-paidGrain;e.arrears+=silverCost-paidSilver;
  for(const p of s.roster.filter(p=>p.recruited&&p.alive!==false))p.loyalty=cap(p.loyalty+(paidGrain<grainCost||paidSilver<silverCost?-3:s.turn%2===0&&e.arrears===0?1:0));
  settleProjects(s);
  const debt=s.debt;let debtPaid=0;if(debt.principal&&s.turn>=debt.due){const due=Math.min(debt.principal+(debt.currentPaid||0),debt.installment),remaining=Math.max(0,due-(debt.currentPaid||0)),paid=Math.min(remaining,e.treasury,debt.principal);e.treasury-=paid;debt.principal-=paid;debt.paid+=paid;debtPaid=paid;debt.overdue=Math.min(debt.principal,debt.overdue+Math.max(0,remaining-paid));debt.currentPaid=0;debt.due+=3;d.clans.ye.silver+=paid;note(s,'叶氏借据','本期应还'+due+'，到期实还'+paid+'；尚欠'+debt.principal+'，逾期'+debt.overdue+'。');}
  d.lastBudget={turn:s.turn,income,harvest,paidSilver,paidGrain,debtPaid,rents,deliveries};note(s,'旬结','收银'+income+'、粮'+harvest+'；常费实支银'+paidSilver+'、粮'+paidGrain+'。',{...clone(d.lastBudget)});
  plots(s);raids(s);
 }
 function advance(s,target){if(!active(s))return base.advance(s,target);if(!Number.isInteger(target)||target<s.tick)throw Error('山河日期不能倒退。');if(s.battle?.status==='fighting'&&target>=s.nextTick)return {ok:false,error:'先结束这场战斗，再到下一旬。'};while(s.nextTick<=target){s.tick=s.nextTick;settle(s);s.nextTick+=10;}s.tick=target;return {ok:true};}
 function validate(s){
  base.validate(s);if(!s.depth22)return true;const d=s.depth22,nat=n=>Number.isInteger(n)&&n>=0;
  if(d.version!==1||typeof d.enabled!=='boolean'||!nat(d.startTurn)||!nat(d.graceUntil)||!nat(d.serial)||!d.regions||!d.clans||!['plots','raids','loot'].every(k=>Array.isArray(d[k]))||!nat(d.sought)||d.sought>talentPool.length||!Number.isInteger(d.lastSeek)||!d.loot.every(id=>s.regions.some(r=>r.id===id))||new Set(d.loot).size!==d.loot.length)throw Error('山河新篇记录缺页。');
  for(const k of ['jiang','ye'])if(!d.clans[k]||!['silver','grain','mood','nextPlan'].every(n=>nat(d.clans[k][n])))throw Error('世家钱粮记录有误。');
  const deployed=zero();for(const r of s.regions){const q=d.regions[r.id];if(!q||!q.estate||!['crown','jiang','ye','free'].every(k=>nat(q.estate[k]))||Object.values(q.estate).reduce((a,b)=>a+b,0)!==100||!['market','fort','route','guard','sealUntil','transportUntil','turnsServed'].every(k=>nat(q[k]))||q.market>2||q.fort>2||q.route>1||!types.every(k=>nat(q.garrison?.[k]))||!Array.isArray(q.escrow)||q.escrow.some(e=>!nat(e.amount)))throw Error('地方田册或驻军记录有误。');for(const k of types)deployed[k]+=q.garrison[k];if(q.escrow.reduce((a,e)=>a+e.amount,0)!==r.missing)throw Error('待查款与原账对不上。');}
  if(!types.every(k=>deployed[k]+(s.battle?.status==='fighting'?s.battle.remaining[k]:0)<=s.army[k]))throw Error('驻军与出征兵额重复。');
  for(const p of s.roster)if(!nat(p.merits22)||!nat(p.integrity22)||p.integrity22>100)throw Error('人才实绩记录有误。');
  for(const a of d.plots)if(!['jiang','ye'].includes(a.clan)||!d.regions[a.region]||!nat(a.due)||!nat(a.created)||!nat(a.paidBaseline)||a.due<a.created||!['preparing','blocked','executed'].includes(a.status))throw Error('世家动向记录有误。');
  for(const a of d.raids)if(!d.regions[a.origin]||!d.regions[a.target]||!nat(a.force)||a.force>10000||!nat(a.due)||!nat(a.created)||a.due<a.created||!['preparing','cancelled','repelled','broke'].includes(a.status))throw Error('敌情记录有误。');
  if(new Set([...d.plots,...d.raids].map(a=>a.id)).size!==d.plots.length+d.raids.length)throw Error('对抗事件编号重复。');
  for(const w of s.works)if(w.project22&&!Object.hasOwn(projectSpec,w.project22))throw Error('州府工程类型有误。');return true;
 }
 return {...base,active,enable,command,reason,advance,validate,forecast,quote,freeArmy,influence,battleInfo,talents:clone(talentPool),projectSpec:clone(projectSpec),ownerName};
});
