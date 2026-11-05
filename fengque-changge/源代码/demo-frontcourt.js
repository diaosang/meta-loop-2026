/* A persistent government loop: appointments, treasury, execution, return and minister response. */
const FRONT=FRONTCOURT_DATA,frontEsc=mindEscape;
function frontOfficials(){return PEOPLE.filter(p=>state.relations[p.id]&&castAge(p)>=18&&(p.official||state.relations[p.id].recruited||['xu','jiang','ye'].includes(p.id))&&!state.relations[p.id].rank&&state.relations[p.id].officer!==false);}
function frontAbility(p,key='admin'){return Number(state.relations[p.id]?.skills?.[key]??p.skills?.[key]??state.relations[p.id]?.politics??30);}
function frontEnsure(){
 initExploration();
 if(!state.frontCourt){
  state.frontCourt={version:'13.5',treasury:180,grain:260,arrears:0,tax:'normal',taxMonth:null,heads:{},ministers:{},local:{},orders:[],affairs:[],returns:[],ledger:[],
   days:{},months:{},serial:0,examYear:null,academy:[],reactions:[],recruits:[],tab:'affairs',seed:state.stories?.seed||mindHash('court:'+state.elapsed)};
 }
 const f=state.frontCourt;
 f.policyDays=f.policyDays||{};f.taxReceivables=f.taxReceivables??36;f.austerityMonths=f.austerityMonths||0;f.migration=f.migration||{source:'13.4',at:mindTick()};
 for(const p of frontOfficials())if(!f.ministers[p.id]){
  const h=mindHash(f.seed+':minister:'+p.id),type=p.type;
  const principle=p.id==='xu'?'merit':p.id==='ye'?'thrift':p.id==='jiang'?'care':/温柔|敏感/.test(type)?'care':/严正|戒备/.test(type)?'law':/务实/.test(type)?'thrift':/明朗|寡言/.test(type)?'security':/野心/.test(type)?'merit':/圆融|骄矜/.test(type)?(storyOf(p).origin==='gentry'?'clan':'growth'):'growth';
  f.ministers[p.id]={principle,integrity:45+h%46,ambition:30+(h>>>3)%61,performance:50,completed:0,failed:0,examined:false};
 }
 for(const region of REGIONS)if(!f.local[region.id]){
  const h=mindHash(f.seed+':local:'+region.id);
  f.local[region.id]={waterRisk:region.id==='jiangnan'?70:32+h%25,grain:60+h%26,literacy:35+h%22,health:62+h%20,corruption:22+h%25};
 }
 const used=new Set(Object.values(f.heads));
 for(const d of FRONT.departments){const current=PEOPLE.find(p=>p.id===f.heads[d.id]);
  if(current&&!frontOfficials().some(p=>p.id===current.id)){delete f.heads[d.id];}
  if(f.heads[d.id])continue;
  const fit=p=>frontAbility(p,d.skill)+((p.role||'').includes(d.name)?25:0)+(p.id==='ye'&&d.id==='revenue'?25:0)+(p.id==='xu'&&d.id==='personnel'?20:0);
  const pool=frontOfficials().filter(p=>!used.has(p.id)).sort((a,b)=>fit(b)-fit(a)||mindHash(a.id)-mindHash(b.id));
  if(pool[0]){f.heads[d.id]=pool[0].id;used.add(pool[0].id);}
 }
 if(typeof ruinInit==='function')ruinInit(f);
 return f;
}
function frontDept(id){return FRONT.departments.find(d=>d.id===id);}
function frontHead(id){return PEOPLE.find(p=>p.id===frontEnsure().heads[id]);}
function frontSpend(money=0,grain=0,ap=0){
 const f=frontEnsure();if(state.ap<ap){toast('行动不足。');return false;}
 if(f.treasury<money||f.grain<grain){toast(f.treasury<money?'国库现银不足，须先筹措或改定较小额度。':'仓粮不足，须先整储或调整方案。');return false;}
 f.treasury-=money;f.grain-=grain;state.ap-=ap;return true;
}
function frontLedger(kind,money,grain,text){const f=frontEnsure();f.ledger.push({tick:mindTick(),month:state.elapsed,kind,money,grain,text,balance:f.treasury,grainBalance:f.grain});f.ledger=f.ledger.slice(-100);}
function frontReactions(context,phase,effects,tags,dept,actor,source){
 const f=frontEnsure(),stamp=context+':'+phase;
 if(f.reactions.some(x=>x.stamp===stamp))return [];
 const direct=frontHead(dept),pool=frontOfficials(),chosen=[];
 // Responsible official, independent departments and different principles; no blanket court-wide meter change.
 for(const p of [pool.find(p=>p.id===actor),direct,...['xu','jiang','ye'].map(id=>pool.find(p=>p.id===id)),...pool.filter(p=>p.id!==actor&&Object.values(f.heads).includes(p.id)),...pool]){
  if(!p||chosen.some(q=>q.id===p.id))continue;chosen.push(p);if(chosen.length>=8)break;
 }
 const uniquePrinciples=new Set(chosen.map(p=>f.ministers[p.id].principle));
 for(const p of pool)if(!uniquePrinciples.has(f.ministers[p.id].principle)){chosen.push(p);break;}
 const out=[];
 for(const p of chosen){
  const m=f.ministers[p.id],r=state.relations[p.id],k=m.principle;
  let aff=0,loyalty=0,reason='';
  if(phase==='decision'){
   if(tags.includes(k)||k==='care'&&tags.includes('relief')||k==='merit'&&tags.includes('audit')){loyalty=1;aff=1;reason={care:'认可先顾灾民与民生的安排。',thrift:'赞同按国用限额、避免虚支的主张。',merit:'赞同按才与实据办事，不以亲疏代替考核。',security:'支持保住守备、军粮与军心。',law:'赞同先核证、分清责任再处置。',growth:'认可让农桑商运得以恢复的打算。',clan:'认为此举顾到了既有官员的体面。'}[k];}
   if(k==='thrift'&&(effects.money||0)>=24){aff=-1;loyalty=tags.includes('thrift')?1:0;reason='担心大额支出挤压下月俸饷，主张留足备用银。';}
   if(k==='care'&&tags.includes('revenue')){aff=-2;loyalty=-1;reason='反对灾年再添征派，担心地方先受其害。';}
   if(k==='law'&&tags.includes('delegate')&&!tags.includes('law')){aff=-1;reason='担心原衙门自核难以纠偏，请留独立复核。';}
   if(k==='clan'&&tags.includes('audit')){aff=-2;loyalty=-1;reason='忧虑清查扩及荐引与宗族往来，私下有所保留。';}
   if(tags.includes('appointment')&&p.id!==actor){aff=0;loyalty=k==='merit'?(effects.meritFit?1:-1):0;reason=loyalty>0?'新任人选任事能力相称，认可择能任事。':loyalty<0?'新任任事能力尚不足，担心亲疏代替了才干。':'';}
  }else{
   const good=effects.success!==false;
   if(p.id===actor||p.id===direct?.id){aff=good?2:-1;loyalty=good?2:-1;reason=good?'自己所领事项已有验收，认为前次用人和拨款有了着落。':'承办未达预期，知须补办，也担忧失去信任。';}
   else if(k==='care'&&((effects.public||0)>0||(effects.waterRisk||0)<0||(effects.healthLocal||0)>0)){loyalty=good?2:0;aff=good?1:-1;reason=good?'见地方已恢复救济或生计，前次的支持有了实效。':'救济效果未足，认为仍须续办，不能只以回册报好。';}
   else if(k==='thrift'&&(effects.money||0)>=24){loyalty=good?1:-1;aff=good?0:-2;reason=good?'大额用度已有验核，仍要求接着核销后续支出。':'拨款已出却未足额见效，要求核销与补办，不能一笔算妥。';}
   else if(k==='law'&&(effects.corruption||0)<0){loyalty=good?2:0;aff=good?1:0;reason=good?'原册与回报已有互证，愿支持继续据证厘责。':'材料仍有缺项，暂不据此赞成定罪。';}
   else if(k==='security'&&((effects.threat||0)<0||(effects.army||0)>0)){loyalty=good?2:-1;aff=good?1:-1;reason=good?'边防与军粮已见改善，支持继续按实补给。':'担心边防迟滞，要求把缺额与补办期限说清。';}
   else if(k==='clan'&&(effects.corruption||0)<0&&good){aff=-1;reason='清查确有实效，但相关旧交往来受限，私下仍有芥蒂。';}
  }
  if(!aff&&!loyalty)continue;
  const oldAff=r.aff,oldLoyalty=r.loyalty;r.aff=clamp(r.aff+aff);r.loyalty=clamp(r.loyalty+loyalty);
  const item={npc:p.id,name:p.name,principle:FRONT.principles[k],aff:r.aff-oldAff,loyalty:r.loyalty-oldLoyalty,reason,phase,stamp};out.push(item);
  rememberMind(p.id,source+'：'+reason+'（忠诚'+(item.loyalty>=0?'+':'')+item.loyalty+'，好感'+(item.aff>=0?'+':'')+item.aff+'）','朝政反应',true);
 }
 f.reactions.push({stamp,tick:mindTick(),source,items:out});f.reactions=f.reactions.slice(-100);return out;
}
function frontReactionHtml(rows){return rows?.length?'<div class="front-reactions"><h4>相关臣子反应</h4>'+rows.map(r=>'<div class="record"><b>'+frontEsc(r.name)+'</b><span class="mini"> · '+frontEsc(r.principle)+' · 忠诚'+(r.loyalty>=0?'+':'')+r.loyalty+' / 好感'+(r.aff>=0?'+':'')+r.aff+'</span><p>'+frontEsc(r.reason)+'</p></div>').join('')+'</div>':'';}
function frontApply(effects,region,scale=1){
 const f=frontEnsure(),pr=state.provinces[region],local=f.local[region];
 for(const [k,v]of Object.entries(effects)){const delta=Math.round(v*scale);
  if(['public','prosperity','security'].includes(k)&&pr)pr[k]=clamp(pr[k]+delta);
  else if(['waterRisk','literacy','health','corruption'].includes(k)&&local)local[k]=clamp(local[k]+delta);
  else if(k==='healthLocal'&&local)local.health=clamp(local.health+delta);
  else if(k==='grainLocal'&&local)local.grain=clamp(local.grain+delta);
  else if(k==='grain')f.grain=Math.max(0,f.grain+delta);
  else if(k==='treasury')f.treasury=Math.max(0,f.treasury+delta);
  else if(k==='arrears')f.arrears=Math.max(0,f.arrears+delta);
  else if(k==='austerity')f.austerityMonths=Math.min(2,f.austerityMonths+delta);
  else if(k==='recover'){const got=Math.min(f.taxReceivables,Math.max(0,delta));f.taxReceivables-=got;f.treasury+=got;}
  else if(k==='repay'){const paid=Math.min(f.treasury,f.arrears,Math.max(0,delta));f.treasury-=paid;f.arrears-=paid;}
  else if(k==='threat')state.strife.threat=clamp(state.strife.threat+delta);
  else if(['army','authority','people'].includes(k))state[k]=clamp(state[k]+delta);
  else if(['training','diplomacy'].includes(k))state.government[k]=clamp(state.government[k]+delta);
 }
 if(effects.public)state.people=clamp(state.people+Math.round(effects.public*scale/3));
}
function frontQuality(actor,dept,uid){
 const f=frontEnsure(),p=PEOPLE.find(p=>p.id===actor),d=frontDept(dept),m=f.ministers[actor];
 if(!p||!m)return {score:0,passed:false,ability:0,integrity:0,roll:0};
 const ability=frontAbility(p,d.skill),roll=mindHash(f.seed+':execution:'+uid)%21-10,rulerBonus=Math.round(((state.playerStats[d.skill]||35)-35)/12),score=Math.round(ability*.62+m.integrity*.23+(state.relations[actor].loyalty||50)*.15+roll+rulerBonus);
 return {score,passed:score>=62,ability,integrity:m.integrity,roll,rulerBonus};
}
function frontStartTask(raw){
 const [id,region]=String(raw).split('|'),t=FRONT.tasks.find(t=>t.id===id),f=frontEnsure();if(!t||!f.local[region])return;
 if(isAway()||courtStatus()!=='open'){toast('须在朝中发令。');return;}
 if(f.orders.some(o=>o.task===id&&o.region===region&&o.month===state.elapsed)){toast('本月这项已经安排，先看在办与回奏。');return;}
 if(f.orders.filter(o=>o.status==='pending'&&o.dept===t.dept).length>=2){toast('本部已有两项在办，先待回奏或另择轻重。');return;}
 if(t.id==='exam'&&f.examYear===Math.floor(state.elapsed/12)){toast('本年度已开科，下年再议。');return;}
 const head=frontHead(t.dept);if(!head){toast('本部尚无人主事，先任用官员。');return;}
 if(!frontSpend(t.money,t.grain,t.ap))return;
 const uid='order-'+(++f.serial),o={uid,task:id,dept:t.dept,region,actor:head.id,month:state.elapsed,created:mindTick(),due:mindTick()+t.days,status:'pending',cost:{money:t.money,grain:t.grain},quality:frontQuality(head.id,t.dept,uid)};
 f.orders.push(o);if(t.id==='exam')f.examYear=Math.floor(state.elapsed/12);
 frontLedger('六部拨款',-t.money,-t.grain,t.name+' · '+regionOf(region).name);
 o.decisionReactions=frontReactions(uid,'decision',{money:t.money},t.tags,t.dept,head.id,t.name);
 log(frontDept(t.dept).name+'领办“'+t.name+'”，'+regionOf(region).name+'，'+t.days+'日后具报。','六部施政',head.id);save();render();frontOrder(uid);
}
function frontFinishOrder(o){
 const f=frontEnsure(),t=FRONT.tasks.find(t=>t.id===o.task);if(o.status!=='pending'||!t)return;
 const q=o.quality||frontQuality(o.actor,o.dept,o.uid),scale=q.passed?1:.45;o.quality=q;o.status=q.passed?'completed':'needs-work';o.completed=mindTick();
 const applied=Math.max(0,scale-(o.effectScale||0));frontApply(t.effects,o.region,applied);o.effectScale=Math.max(o.effectScale||0,scale);
 const m=f.ministers[o.actor];if(m){m.completed+=q.passed?1:0;m.failed+=q.passed?0:1;m.performance=clamp(m.performance+(q.passed?5:-5));m.examined=true;}
 o.result=q.passed?regionOf(o.region).name+'所办“'+t.name+'”已按原定额度验收，原册与回册可互核。':regionOf(o.region).name+'回册仍有缺项，“'+t.name+'”只先完成部分；原拨款保留待核，不再以全成记功。';
 if(t.id==='exam'&&q.passed&&!o.newOfficial)frontRecruit(o);
 o.resultReactions=frontReactions(o.uid,o.retried?'result-retry':'result',{...t.effects,money:t.money,success:q.passed},t.tags,t.dept,o.actor,t.name+'回奏');
 frontGrowth(t.dept==='war'?'military':t.dept==='rites'?'literature':'admin');
 f.returns.push({id:o.uid,title:t.name+' · '+(q.passed?'已验收':'待补办'),text:o.result,tick:mindTick(),urgent:false,kind:'order'});
 log(o.result,'六部回奏',o.actor);
}
function frontRecruit(o){
 const f=frontEnsure(),uid='exam-'+o.uid,h=mindHash(f.seed+uid),existing=PEOPLE.find(p=>p.id===uid);if(existing)return;
 const names=['温令章','岑望舒','纪行舟','陶知微','邵怀直','方静川'],name=names[h%names.length]+'·'+(f.recruits.length+1);
 const offset=Math.floor((state.elapsed-2)/12),p={id:uid,name,age:24+h%7-offset,gender:'男',role:'新科进士 · 候授差遣',official:true,romance:false,type:['严正守礼','务实重利','温柔体贴'][h%3],
  location:'office',schedule:['office','library'],group:'new-official',color:'#8b9e90',initial:35,trust:40,loyalty:58,specialty:'理政',specialtyKey:'admin',specialtyLevel:5+h%3,
  skills:{admin:64+h%23,literature:70+h%21,military:25+h%30,charm:40+h%30},desc:'经过本届覆核入选，尚须授予实际差遣，不能只凭一纸榜名论终身功过。'};
 PEOPLE.push(p);state.relations[uid]={aff:35,trust:40,love:0,rank:null,loyalty:58,officer:true,recruited:true,notes:[],counts:{},gain:0,skills:clone(p.skills),politics:p.skills.admin,force:p.skills.military,mind:null};
 state.cast.generated.push(uid);state.cast.generatedProfiles[uid]={...clone(p),clan:name.slice(0,1)+'氏',household:'家-'+uid,parents:[],background:'新科覆核入选，父母家世仍待本人慢慢说起。',bio:p.desc,inner:'待授差遣，不急着夸功。'};
 ensureMinds();ensureInteractionStats();storyOf(p);frontEnsure();f.recruits.push(uid);o.newOfficial=uid;
}
function frontAppoint(raw){
 const [dept,id]=String(raw).split('|'),f=frontEnsure(),d=frontDept(dept),p=frontOfficials().find(p=>p.id===id);if(!d||!p)return;
 if(isAway()||courtStatus()!=='open'||!frontSpend(0,0,1))return;
 if(f.heads[dept]===id){state.ap++;return;}
 if(Object.entries(f.heads).some(([k,v])=>k!==dept&&v===id)){state.ap++;toast('此人已主另一部；先替换原部，避免一人兼领六部。');return;}
 const key=dept+':'+todayKey();if(f.policyDays['appoint:'+key]){state.ap++;toast('同部当日已改任，明日再议。');return;}
 const previous=f.heads[dept],old=PEOPLE.find(p=>p.id===previous);f.heads[dept]=id;f.policyDays['appoint:'+key]=true;
 if(old){state.relations[old.id].aff=clamp(state.relations[old.id].aff-1);rememberMind(old.id,'原领'+d.name+'改由'+p.name+'主事，旧事项仍须按经手责任交清。','官员调任',true);}
 state.relations[id].aff=clamp(state.relations[id].aff+1);state.relations[id].loyalty=clamp(state.relations[id].loyalty+1);
 f.lastAppointmentReactions=frontReactions('appoint:'+dept+':'+todayKey(),'decision',{meritFit:frontAbility(p,d.skill)>=60},['appointment'],dept,id,d.name+'改任');
 log('命'+p.name+'主'+d.name+'；原在办事项保留原承办责任，不因换人抹去。','任官',id);save();render();frontAppointments(dept);
}
function frontTax(id){
 const f=frontEnsure(),p=FRONT.taxes[id];if(!p||f.taxMonth===state.elapsed||isAway()||courtStatus()!=='open'||!frontSpend(0,0,1))return;
 f.tax=id;f.taxMonth=state.elapsed;state.government.tax=id==='light'?8:id==='heavy'?13:10;
 frontReactions('tax:'+state.elapsed,'decision',{},id==='light'?['care','growth']:id==='heavy'?['revenue','security']:['thrift','law'],'revenue',f.heads.revenue,'本月税令 · '+p.name);
 log('本月定“'+p.name+'”，收入与地方负担于月末结算，不先把应收当现银。','税赋');save();render();frontFinance();
}
function frontMonth(month){
 const f=frontEnsure();if(f.months[month])return;
 const policy=FRONT.taxes[f.tax],regions=REGIONS.length;
 let income=0,harvest=0;
 for(const r of REGIONS){const pr=state.provinces[r.id],l=f.local[r.id];
  const due=Math.max(2,Math.round(pr.prosperity/9*policy.income)),received=Math.max(2,Math.round(pr.prosperity/9*policy.income*(1-l.corruption/160)));
  income+=received;f.taxReceivables+=Math.max(0,due-received);
  harvest+=Math.max(1,Math.round((pr.prosperity+pr.public)/30*(l.health/90)));
  pr.public=clamp(pr.public+policy.public);pr.prosperity=clamp(pr.prosperity+policy.prosperity);
  l.grain=clamp(l.grain+3-(l.waterRisk>65?6:0));l.waterRisk=clamp(l.waterRisk+(month%12>=3&&month%12<=6?4:-3));
 }
 const salary=12+Math.floor(frontOfficials().length/12),garrison=12,maintenance=(f.austerityMonths>0?2:4)+f.orders.filter(o=>o.status==='pending').length*2;
 if(f.austerityMonths>0)f.austerityMonths--;
 if(typeof ruinRevenue==='function')income=ruinRevenue(income,month);
 const obligations=salary+garrison+maintenance+f.arrears,available=f.treasury+income,reserve=f.ruin?Math.min(available,f.ruin.reserve||0):0,paid=Math.min(available-reserve,obligations),newArrears=obligations-paid;
 f.treasury=available-paid;f.arrears=newArrears;const 粮耗=20,stock=f.grain+harvest,grainPaid=Math.min(stock,粮耗);f.grain=stock-grainPaid;
 const summary={month,income,harvest,salary,garrison,maintenance,previousArrears:obligations-salary-garrison-maintenance,paid,arrears:newArrears,grainUsed:grainPaid,grainNeed:粮耗,treasury:f.treasury,grain:f.grain,tax:f.tax};
 f.months[month]=summary;frontLedger('月度岁计',income-paid,harvest-grainPaid,'税收'+income+'、应付'+obligations+'，实付'+paid+'；粮入'+harvest+'、粮用'+grainPaid+'。');
 if(newArrears||grainPaid<粮耗){state.army=clamp(state.army-3);state.people=clamp(state.people-2);frontReactions('settlement:'+month,'result',{money:30,success:false},['thrift'],'revenue',f.heads.revenue,'岁计不足');}
 else frontReactions('settlement:'+month,'result',{success:true},['thrift'],'revenue',f.heads.revenue,'岁计按额支给');
 log('国库月结：入'+income+'，实支'+paid+'，余'+f.treasury+'；仓粮余'+f.grain+(newArrears?'，旧欠'+newArrears:'，本期无欠支')+'。','岁计');
 // Temporary surtax expires rather than silently becoming permanent.
 if(f.tax==='heavy')f.tax='normal';
}
function frontConditions(){
 const f=frontEnsure(),region=REGIONS.slice().sort((a,b)=>f.local[b.id].waterRisk-f.local[a.id].waterRisk)[0],hungry=REGIONS.slice().sort((a,b)=>f.local[a.id].grain-f.local[b.id].grain)[0];
 const sick=REGIONS.slice().sort((a,b)=>f.local[a.id].health-f.local[b.id].health)[0],corrupt=REGIONS.slice().sort((a,b)=>f.local[b.id].corruption-f.local[a.id].corruption)[0];
 const out=[];if(f.local[region.id].waterRisk>=65)out.push(['flood',region.id]);
 if(f.local[hungry.id].grain<=38)out.push(['famine',hungry.id]);
 if(state.strife.threat>=60)out.push(['border','north']);
 if(f.treasury<35||f.arrears>0)out.push(['deficit','capital']);
 if(f.local[sick.id].health<42)out.push(['epidemic',sick.id]);
 if(f.local[corrupt.id].corruption>=57)out.push(['transport',corrupt.id]);
 if(f.examYear===Math.floor(state.elapsed/12)&&f.local.capital.corruption>=35)out.push(['examleak','capital']);
 if(state.government.diplomacy>=55&&state.elapsed%6===3)out.push(['trade','north']);return out;
}
function frontCreateAffairs(){
 const f=frontEnsure();for(const [type,region]of frontConditions()){
  if(f.affairs.some(a=>a.type===type&&(['presented','pending','overdue','needs-work'].includes(a.status)||state.elapsed-(a.month||0)<2)))continue;
  if(f.affairs.filter(a=>a.status==='presented').length>=3)break;
  const t=FRONT.events.find(t=>t.id===type),uid='affair-'+(++f.serial),head=frontHead(t.dept);
  f.affairs.push({uid,type,region,dept:t.dept,actor:head?.id||null,month:state.elapsed,created:mindTick(),deadline:mindTick()+5,status:'presented',heard:[],choices:t.choices.map(c=>c.id)});
 }
}
function frontAffairText(a,text){return String(text).replaceAll('{region}',regionOf(a.region).name);}
function frontDecide(raw){
 const [uid,key]=String(raw).split('|'),f=frontEnsure(),a=f.affairs.find(a=>a.uid===uid),t=a&&FRONT.events.find(t=>t.id===a.type),c=t?.choices.find(c=>c.id===key);
 if(!a||!['presented','overdue'].includes(a.status)||!c)return;
 if(isAway()||courtStatus()!=='open'){toast('回京入朝后方可传旨。');return;}
 if(!frontSpend(c.money,c.grain,1))return;
 a.choice=c.id;a.status='pending';a.ordered=mindTick();a.due=mindTick()+c.days;a.cost={money:c.money,grain:c.grain};
 a.quality=frontQuality(a.actor,a.dept,a.uid);a.decisionReactions=frontReactions(a.uid,'decision',{money:c.money},c.tags,a.dept,a.actor,t.title+' · '+c.label);
 frontLedger('重大事项',-c.money,-c.grain,t.title+' · '+c.label);log(t.title+'：'+c.label+'，限'+c.days+'日回奏。','御批',a.actor);
 frontGrowth('admin');save();render();frontAffair(uid);
}
function frontFinishAffair(a){
 const f=frontEnsure(),t=FRONT.events.find(t=>t.id===a.type),c=t.choices.find(c=>c.id===a.choice);if(a.status!=='pending'||!c)return;
 const q=a.quality||frontQuality(a.actor,a.dept,a.uid),scale=q.passed?1:.55;a.quality=q;a.status=q.passed?'completed':'needs-work';a.completed=mindTick();
 const before={treasury:f.treasury,arrears:f.arrears,taxReceivables:f.taxReceivables},applied=Math.max(0,scale-(a.effectScale||0));frontApply(c.effects,a.region,applied);a.effectScale=Math.max(a.effectScale||0,scale);
 if(c.effects.treasury||c.effects.recover||c.effects.repay)frontLedger('筹解与实付',f.treasury-before.treasury,0,'本次实收'+(Math.round((c.effects.treasury||0)*applied)+before.taxReceivables-f.taxReceivables)+'，实付旧欠'+(before.arrears-f.arrears)+'；余欠'+f.arrears+'，待清解'+f.taxReceivables+'。');
 a.result=frontAffairText(a,c.label+'：'+(q.passed?'原定续办已具回册，拨用与结果可核。':'先完成部分，原册仍有缺项，须限期补办；不以全成记功。'));
 const details=frontEffects(c.effects,scale);
 a.result+=' '+details+'。';if(a.type==='deficit')a.result+=' 本次实收'+(Math.round((c.effects.treasury||0)*applied)+before.taxReceivables-f.taxReceivables)+'，实付旧欠'+(before.arrears-f.arrears)+'；国库现银'+f.treasury+'、余欠'+f.arrears+'。';
 const m=f.ministers[a.actor];if(m){m.performance=clamp(m.performance+(q.passed?6:-4));m.completed+=q.passed?1:0;m.failed+=q.passed?0:1;m.examined=true;}
 a.resultReactions=frontReactions(a.uid,a.retried?'result-retry':'result',{...c.effects,money:c.money,success:q.passed},c.tags,a.dept,a.actor,t.title+'回奏');
 f.returns.push({id:a.uid,title:t.title+' · '+(q.passed?'已回奏':'须补办'),text:a.result,tick:mindTick(),urgent:true,kind:'affair'});log(a.result,'御前回奏',a.actor);
}
function frontDay(key){
 const f=frontEnsure();if(f.days[key])return;f.days[key]=true;
 const current=state.elapsed;if(f.lastMonth===undefined)f.lastMonth=current;
 for(let month=f.lastMonth;month<current;month++)frontMonth(month);f.lastMonth=Math.max(f.lastMonth,current);
 for(const o of f.orders)if(o.status==='pending'&&mindTick()>=o.due)frontFinishOrder(o);
 for(const a of f.affairs){
  if(a.status==='pending'&&mindTick()>=a.due)frontFinishAffair(a);
  if(a.status==='presented'&&mindTick()>a.deadline){
   a.status='overdue';a.result='御批期限已过，地方仍按旧额救急，跨府与蠲免尚未获准。续办受阻，须另议。';
   frontApply({public:-3,prosperity:-1},a.region);a.resultReactions=frontReactions(a.uid,'overdue',{public:3,success:false,money:24},['care'],a.dept,a.actor,'奏事逾期');
   f.returns.push({id:a.uid,title:FRONT.events.find(t=>t.id===a.type).title+' · 逾期',text:a.result,tick:mindTick(),urgent:true,kind:'affair'});log(a.result,'奏事逾期',a.actor);
  }
 }
 frontCreateAffairs();for(const k of Object.keys(f.days).slice(0,-100))delete f.days[k];f.returns=f.returns.slice(-60);
}
function frontGrowth(key){const f=frontEnsure();f.growth=f.growth||{};const row=f.growth[state.elapsed]=f.growth[state.elapsed]||{};if((row[key]||0)>=2)return;row[key]=(row[key]||0)+1;state.playerStats[key]=clamp((state.playerStats[key]||35)+1);}
function frontRetry(raw){
 const [kind,id]=String(raw).split('|'),f=frontEnsure(),a=(kind==='affair'?f.affairs:f.orders).find(a=>a.uid===id);if(!a||a.status!=='needs-work'||a.retried)return;
 if(isAway()||courtStatus()!=='open')return;
 const money=Math.ceil((a.cost?.money||0)*.35),grain=Math.ceil((a.cost?.grain||0)*.25);if(!frontSpend(money,grain,1))return;
 const head=frontHead(a.dept);a.actor=head?.id||a.actor;a.quality=frontQuality(a.actor,a.dept,a.uid+':retry');a.due=mindTick()+2;a.status='pending';a.retried=true;
 frontLedger('补办拨款',-money,-grain,'补办'+id+'，只补尚未完成的部分。');save();render();kind==='affair'?frontAffair(id):frontOrder(id);
}

// Views do not grant rewards. All changes go through the guarded commands above.
const frontStatus={presented:'待御批',overdue:'逾期待议',pending:'在办',completed:'已验收','needs-work':'须补办'};
const frontLabels={public:'地方民心',prosperity:'生计',security:'治安',waterRisk:'水患',corruption:'吏弊',literacy:'文教',healthLocal:'康健',grainLocal:'地方储粮',grain:'仓粮',authority:'威望',training:'训练',army:'军心',threat:'边患',talent:'入选人才',diplomacy:'邦交',treasury:'国库',arrears:'欠支',austerity:'减常费月数',recover:'清解上限',repay:'补欠上限'};
function frontEffects(e,scale=1){return Object.entries(e).map(([k,v])=>frontLabels[k]+(Math.round(v*scale)>=0?'+':'')+Math.round(v*scale)).join(' · ');}
function frontName(id){return PEOPLE.find(p=>p.id===id)?.name||'待授官员';}
function frontCost(x){return '行动'+(x.ap??1)+' · 国库银'+x.money+' · 仓粮'+x.grain+' · '+x.days+'日后回奏';}
function frontCanOrder(){return !isAway()&&courtStatus()==='open';}
function frontOpen(title,intro,body){openModal(title,intro,body,'前朝 · 晟朝政务');}
function frontTaskRow(o){const t=FRONT.tasks.find(t=>t.id===o.task);return '<div class="record"><span class="tag">'+frontStatus[o.status]+'</span> <b>'+frontEsc(t.name)+'</b><p>'+frontEsc(regionOf(o.region).name)+' · '+frontEsc(frontName(o.actor))+(o.status==='pending'?' · 尚需'+Math.max(0,o.due-mindTick())+'日':'')+'</p><button class="btn ghost" data-action="frontOrder" data-id="'+o.uid+'">看拨款与回奏</button></div>';}
function frontAffairRow(a){const t=FRONT.events.find(t=>t.id===a.type);return '<div class="record"><span class="tag">'+frontStatus[a.status]+'</span><h4>'+frontEsc(t.title)+'</h4><p>'+frontEsc(regionOf(a.region).name)+' · '+frontEsc(t.reason)+'</p><button class="btn '+(['presented','overdue'].includes(a.status)?'primary':'ghost')+'" data-action="frontAffair" data-id="'+a.uid+'">'+(['presented','overdue'].includes(a.status)?'听议并御批':'看办理与回奏')+'</button></div>';}
function frontAffairsBody(){
 const f=frontEnsure(),active=f.affairs.filter(a=>['presented','overdue','pending','needs-work'].includes(a.status));
 return '<p class="mini">府县先行救急，部院在原定额度内办理常务。跨府调粮、蠲免、跨镇调兵及大案才请陛下裁决。奏事留有期限，未批不能当作已办。</p>'+(active.map(frontAffairRow).join('')||'<p>暂无需要新裁决的大事，可安排六部常务、考课官员。</p>')+'<details class="front-details"><summary>地方例行公事 · 部院自行处置</summary><p>街巷排水、铺户争界、例行巡骑及小额仓耗，由府县先核办，部院按额复核；不另扣陛下行动，也不因未亲批便损民心。</p><p>超过定额、连续未愈或涉及跨府、官员责任时，才按实际局势形成御前奏事。</p></details>';
}
function frontAffairs(){frontCreateAffairs();const urgent=frontEnsure().affairs.some(a=>['flood','famine','epidemic'].includes(a.type)&&['presented','overdue'].includes(a.status));frontOpen('御前议事','谢无咎捧册上前：“陛下，'+(urgent?'有司已经先救了急。':'有司已依职掌核过。')+'需请您定夺的，臣另列在这里。”',frontAffairsBody());}
function frontAdvice(a){
 const f=frontEnsure(),all=frontOfficials(),p=[];
 for(const q of [all.find(p=>p.id===a.actor),...['xu','ye','jiang','lu'].map(id=>all.find(p=>p.id===id)),...all.filter(p=>Object.values(f.heads).includes(p.id))])if(q&&!p.some(p=>p.id===q.id)&&p.length<7&&(FRONT.bespokeAdvice[q.id]||!p.some(p=>!FRONT.bespokeAdvice[p.id]&&f.ministers[p.id].principle===f.ministers[q.id].principle)))p.push(q);
 return '<h4>廷议 · 听主张</h4>'+p.map(p=>{const k=f.ministers[p.id].principle,line=FRONT.bespokeAdvice[p.id]?.[a.type]||FRONT.advice[a.type]?.[k]||'请先核实原册，再定办理额度。';return '<div class="record"><b>'+frontEsc(p.name)+'</b> <span class="mini">'+FRONT.principles[k]+'</span><p>“'+frontEsc(line)+'”'+'</p></div>';}).join('')+'<p class="mini">此处只听议，不改好感或忠诚。御批后记立场反应，回奏后再看成效。</p>';

}
function frontAffair(id){
 const f=frontEnsure(),a=f.affairs.find(a=>a.uid===id);if(!a)return;const t=FRONT.events.find(t=>t.id===a.type),c=t.choices.find(c=>c.id===a.choice),can=['presented','overdue'].includes(a.status);
 const noticeId='front:'+a.uid+':'+a.status;if(can||a.status==='needs-work')delete courierState().seen[noticeId];else courierState().seen[noticeId]=mindTick();
 const options=can?t.choices.map(c=>{const blocked=frontChoiceBlockReason(c);return '<button class="opt" data-action="frontDecide" data-id="'+a.uid+'|'+c.id+'" '+(blocked?'disabled':'')+'><b>'+frontEsc(c.label)+'</b><small>'+frontEsc(c.description)+'</small><small>'+frontCost(c)+'；办成预计 '+frontEffects(c.effects)+'</small>'+(blocked?'<small class="approval-block-reason">'+frontEsc(blocked)+'</small>':'')+'</button>';}).join(''):'';

 frontOpen(t.title,regionOf(a.region).name+' · '+frontStatus[a.status]+' · '+frontName(a.actor)+'承办',
  '<div class="scene-text">“陛下，'+frontEsc(frontAffairText(a,t.brief))+'”</div><p><b>何以请旨：</b>'+frontEsc(t.reason)+'</p><details class="front-details"><summary>看核验材料</summary>'+t.evidence.map(x=>'<p>'+frontEsc(x)+'</p>').join('')+'</details><details class="front-details"><summary>听六部廷议</summary>'+frontAdvice(a)+'</details>'+
  frontApprovalEntry(a)+(can?'<p class="mini">'+(frontCanOrder()?'距原定御批期限 '+Math.max(0,a.deadline-mindTick())+'日。额度不足的方案暂不可批。':'先按上方入口继续批阅；入朝后可选择御批方案。')+'</p><div class="opts">'+options+'</div>':'<p>御批：'+frontEsc(c?.label||'')+'。</p>'+(a.status==='pending'?'<p>已经发交有司，尚需'+Math.max(0,a.due-mindTick())+'日回奏。有司已领旨，按期具报。</p>':''))+
  (a.result?'<h4>回奏与实效</h4><p>'+frontEsc(a.result)+'</p>':'')+frontReactionHtml(a.decisionReactions)+frontReactionHtml(a.resultReactions)+
  (a.status==='needs-work'&&!a.retried?'<button class="btn primary" data-action="frontRetry" data-id="affair|'+a.uid+'">补拨复核 · 1行动 / 银'+Math.ceil((a.cost?.money||0)*.35)+' / 粮'+Math.ceil((a.cost?.grain||0)*.25)+'</button>':'')+
  '<p class="mini">参考制度：'+frontEsc(FRONT.sources.find(s=>s.id===t.source)?.title||'')+'；本案为架空原创。</p>');save();
}
function frontDeptPanel(raw){
 const [id,regionArg]=String(raw).split('|'),d=frontDept(id);if(!d)return;const f=frontEnsure(),region=regionArg||f.region||'capital';if(!f.local[region])return;f.region=region;
 const p=frontHead(id),pr=state.provinces[region],l=f.local[region];
 const targets=REGIONS.map(r=>'<button class="btn '+(r.id===region?'primary':'ghost')+'" data-action="frontDept" data-id="'+id+'|'+r.id+'">'+r.name+'</button>').join('');
 const tasks=FRONT.tasks.filter(t=>t.dept===id).map(t=>{const used=f.orders.some(o=>o.task===t.id&&o.region===region&&o.month===state.elapsed),full=f.orders.filter(o=>o.dept===id&&o.status==='pending').length>=2,exam=t.id==='exam'&&f.examYear===Math.floor(state.elapsed/12);return '<button class="opt" data-action="frontTask" data-id="'+t.id+'|'+region+'" '+(used||full||exam||!frontCanOrder()||!p||state.ap<t.ap||f.treasury<t.money||f.grain<t.grain?'disabled':'')+'><b>'+t.name+(used?' · 本月已安排':exam?' · 本年已开科':'')+'</b><small>'+t.description+'</small><small>'+frontCost(t)+'；办成预计 '+frontEffects(t.effects)+'</small></button>';}).join('');
 frontOpen(d.name+' · '+d.scope,'主事：'+frontName(p?.id)+' · '+(p?({admin:'政务',military:'武略',literature:'文才'}[d.skill]||'能力')+frontAbility(p,d.skill):'先任官'),
  '<button class="btn ghost" data-action="frontAppointments" data-id="'+id+'">比较人选 / 改任主事</button><h4>施政地方</h4><div class="actions front-targets">'+targets+'</div><p class="mini">'+regionOf(region).name+'：生计'+pr.prosperity+' · 民心'+pr.public+' · 水患'+l.waterRisk+' · 吏弊'+l.corruption+'</p><div class="opts">'+tasks+'</div><h4>本部承办记录</h4>'+f.orders.filter(o=>o.dept===id).slice(-5).reverse().map(frontTaskRow).join(''));save();
}
function frontOrder(id){
 const f=frontEnsure(),o=f.orders.find(o=>o.uid===id);if(!o)return;const t=FRONT.tasks.find(t=>t.id===o.task);
 frontOpen(t.name+' · '+frontStatus[o.status],regionOf(o.region).name+' · 原承办 '+frontName(o.actor),'<p>'+t.description+'</p><p>已拨国库银'+o.cost.money+'、仓粮'+o.cost.grain+'；'+(o.status==='pending'?'尚需'+Math.max(0,o.due-mindTick())+'日回奏。':'已经到期验核。')+'</p>'+
  (o.result?'<div class="scene-text">'+frontEsc(o.result)+'</div><p>累计落实：'+frontEffects(t.effects,o.effectScale||0)+'</p>':'<p class="mini">结果受承办能力、履职与执行偏差影响，预期增益尚未入账。</p>')+
  (o.newOfficial?'<p>新科入选：'+frontEsc(frontName(o.newOfficial))+'。已列百官，可比较授职。</p>':'')+frontReactionHtml(o.decisionReactions)+frontReactionHtml(o.resultReactions)+
  (o.status==='needs-work'&&!o.retried?'<button class="btn primary" data-action="frontRetry" data-id="order|'+o.uid+'">限期补办 · 1行动 / 银'+Math.ceil(o.cost.money*.35)+' / 粮'+Math.ceil(o.cost.grain*.25)+'</button>':''));
}
function frontReview(id){
 const f=frontEnsure(),p=frontOfficials().find(p=>p.id===id),m=f.ministers[id];if(!p||!m||m.reviewMonth===state.elapsed||!frontCanOrder()||!frontSpend(0,0,1))return;
 m.reviewMonth=state.elapsed;m.examined=true;const r=state.relations[id],good=m.failed===0&&m.completed>0;
 const evidence='已验收'+m.completed+'项，欠妥'+m.failed+'次；履职评分'+m.performance+'。操守风险评估：'+(m.integrity>=75?'较低':m.integrity>=60?'仍须复核':'应另员核验')+'，此评估不作定罪凭据。';
 m.review=evidence;if(good)r.loyalty=clamp(r.loyalty+1);rememberMind(id,'本月考课：'+evidence,'考课',true);log(p.name+'考课：'+evidence,'考课',id);save();render();frontAppointments(f.reviewDept||'personnel');
}
function frontAppointments(dept='personnel'){
 const f=frontEnsure(),d=frontDept(dept);if(!d)return;f.reviewDept=dept;
 const list=frontOfficials().slice().sort((a,b)=>frontAbility(b,d.skill)-frontAbility(a,d.skill));
 frontOpen(d.name+' · 比较与任用','本部每名主事独任一部；每部当日改任一次，任命耗1行动。好感与政务能力分别列示。',list.map(p=>{const r=state.relations[p.id],m=f.ministers[p.id],held=FRONT.departments.find(k=>f.heads[k.id]===p.id);return '<div class="record"><b>'+frontEsc(p.name)+'</b> '+(held?'<span class="tag">'+held.name+'主事</span>':'<span class="mini">候授</span>')+'<p>任事能力 '+frontAbility(p,d.skill)+' · 忠诚 '+r.loyalty+' · 好感 '+r.aff+' · 主张 '+FRONT.principles[m.principle]+'</p><p class="mini">'+(m.examined?frontEsc(m.review||('已验收'+m.completed+'项，欠妥'+m.failed+'次；履职评分'+m.performance+'。')):'尚无本版考课结果，不能只看门第与好感。')+'</p><div class="actions"><button class="btn '+(!held?'primary':'ghost')+'" data-action="frontAppoint" data-id="'+dept+'|'+p.id+'" '+(held||!frontCanOrder()||state.ap<1?'disabled':'')+'>任为本部主事 · 1行动</button><button class="btn ghost" data-action="frontReview" data-id="'+p.id+'" '+(m.reviewMonth===state.elapsed||!frontCanOrder()||state.ap<1?'disabled':'')+'>考课 · '+(m.reviewMonth===state.elapsed?'本月已核':'1行动')+'</button></div></div>';}).join('')+frontReactionHtml(f.lastAppointmentReactions));save();
}
function frontFinanceBody(){
 const f=frontEnsure(),last=Object.values(f.months).at(-1);
 return '<div class="front-metrics"><div>国库现银<b>'+f.treasury+'</b></div><div>中央仓粮<b>'+f.grain+'</b></div><div>未付旧欠<b>'+f.arrears+'</b></div></div><p>田赋按八地生计、吏弊与税令结算；粮入受生计、民心与康健影响。月末支付百官俸银、驻防、在办差事及旧欠。内库'+state.money+'用于宫廷生活，另行记账。</p><p class="mini">待清解税银'+f.taxReceivables+'，尚未入现银；非急常费缩减尚余'+f.austerityMonths+'月。</p>'+
  (last?'<div class="record"><b>最近一次月结</b><p>银入'+last.income+' · 俸银'+last.salary+' · 驻防'+last.garrison+' · 常费'+last.maintenance+' · 前欠'+last.previousArrears+' · 实付'+last.paid+' · 余欠'+last.arrears+'</p><p>粮入'+last.harvest+' · 应用'+last.grainNeed+' · 实用'+last.grainUsed+'。</p></div>':'<p class="mini">尚未月结。应收不计作已到现银。</p>')+
  '<h4>税令 · 当前'+FRONT.taxes[f.tax].name+'</h4><p class="mini">一月定一次，耗1行动；临时加派只执行至本月结算。地方生计与民心会随税令变化。</p><div class="opts">'+Object.entries(FRONT.taxes).map(([id,p])=>'<button class="opt" data-action="frontTax" data-id="'+id+'" '+(f.taxMonth===state.elapsed||!frontCanOrder()||state.ap<1?'disabled':'')+'><b>'+p.name+'</b><small>相对税入 '+Math.round(p.income*100)+'%；月底各地民心'+(p.public>=0?'+':'')+p.public+'、生计'+(p.prosperity>=0?'+':'')+p.prosperity+'。</small></button>').join('')+'</div>';
}
function frontFinance(){frontOpen('户部岁计','现银、仓粮与欠支逐笔留账。',frontFinanceBody());}
function frontLocalBody(){const f=frontEnsure();return '<p class="mini">八地数值会影响税粮与重大奏事。高水患、缺粮、时疫、吏弊及边患达到条件才上报；每次治理需等待回奏。</p>'+REGIONS.map(r=>{const p=state.provinces[r.id],l=f.local[r.id];return '<div class="record"><b>'+r.name+'</b><p>生计'+p.prosperity+' · 民心'+p.public+' · 治安'+p.security+'</p><p class="mini">水患'+l.waterRisk+' · 储粮'+l.grain+' · 文教'+l.literacy+' · 康健'+l.health+' · 吏弊'+l.corruption+'</p><div class="actions"><button class="btn ghost" data-action="frontDept" data-id="works|'+r.id+'">工部治理</button><button class="btn ghost" data-action="frontDept" data-id="revenue|'+r.id+'">户部钱粮</button></div></div>';}).join('');}
function frontHistoryBody(){const f=frontEnsure();return '<h4>回奏</h4>'+f.returns.slice(-12).reverse().map(r=>'<div class="record"><b>'+frontEsc(r.title)+'</b><p>'+frontEsc(r.text)+'</p><button class="text-btn" data-action="'+(r.kind==='affair'?'frontAffair':'frontOrder')+'" data-id="'+r.id+'">看原旨及臣子反应</button></div>').join('')+'<h4>钱粮流水</h4>'+f.ledger.slice(-20).reverse().map(l=>'<div class="record"><b>'+frontEsc(l.kind)+'</b><p>'+frontEsc(l.text)+'</p><p class="mini">银'+(l.money>=0?'+':'')+l.money+' · 粮'+(l.grain>=0?'+':'')+l.grain+'；账后银'+l.balance+'、粮'+l.grainBalance+'</p></div>').join('');}
function frontStudy(key){const f=frontEnsure();if((f.growth?.[state.elapsed]?.[key]||0)>=2||!['admin','military','literature'].includes(key)||f.policyDays['study:'+state.elapsed+':'+key]||!frontCanOrder()||!frontSpend(0,0,1))return;f.policyDays['study:'+state.elapsed+':'+key]=true;frontGrowth(key);frontGrowth(key);log('御前研习'+({admin:'治政',military:'兵略',literature:'经义'}[key])+'；每项能力每月最多增长2点，实际领办亦计此限。','帝王研习');save();render();}
function frontPanelBody(id){
 const f=frontEnsure();let body='';
 if(id==='affairs')body=frontAffairsBody();
 if(id==='depts')body='<p class="mini">每部最多同时领两项；同项同地一月一次。拨款后先在办，按日回奏，失当可另拨补办。八地均可施政。</p><div class="front-depts">'+FRONT.departments.map(d=>'<button class="opt" data-action="frontDept" data-id="'+d.id+'"><b>'+d.name+'</b><small>'+d.scope+'</small><small>主事：'+frontEsc(frontName(f.heads[d.id]))+'</small></button>').join('')+'</div><h4>在办与近期回奏</h4>'+f.orders.slice(-8).reverse().map(frontTaskRow).join('');
 if(id==='officials')body='<p>择任主事须看所掌事务的能力；相熟可体谅，不能代替任事。考课保留原承办记录，换人不会抹平欠妥事项。</p><div class="actions">'+FRONT.departments.map(d=>'<button class="btn ghost" data-action="frontAppointments" data-id="'+d.id+'">'+d.name+'人选</button>').join('')+'</div><h4>女帝研习</h4><div class="actions">'+[['admin','治政'],['military','兵略'],['literature','经义']].map(([k,n])=>'<button class="btn ghost" data-action="frontStudy" data-id="'+k+'" '+(f.policyDays['study:'+state.elapsed+':'+k]||(f.growth?.[state.elapsed]?.[k]||0)>=2||state.ap<1?'disabled':'')+'>'+n+' '+state.playerStats[k]+' · 研习1行动</button>').join('')+'</div><p class="mini">各能力每月成长上限2点；领办政务与研习共同计入。</p>';
 if(id==='finance')body=frontFinanceBody();if(id==='local')body=frontLocalBody();if(id==='history')body=frontHistoryBody();
 return body;
}

function frontSources(){frontOpen('前朝参考与规则','参考《皇帝成长计划2》的国家经营方向，采用晟朝原创流程与数值。','<p>一月仍用原有十五行动。每日可入朝，入朝耗1行动；同日退朝后不重开。六部差事、御批和任官另计行动。国家钱粮跨月保留，内库沿用宫廷账目。</p>'+FRONT.sources.map(s=>'<div class="record"><b>'+frontEsc(s.title)+'</b><p>'+frontEsc(s.used)+'</p><p class="mini">'+frontEsc(s.url)+'</p></div>').join('')+'<p>'+frontEsc(FRONT.note)+'</p>');}

// The scene layout module below binds the hall renderer.
const frontBeforeBuild=buildDay;buildDay=function(){const key=frontBeforeBuild();frontEnsure();frontDay(key);return key;};
// The old month's daily simulation uses an earlier build function. Follow its
// actual day callbacks too, so a month skip completes jobs on their due dates.
const frontBeforeMindDay=processMindDay;processMindDay=function(key,...args){const result=frontBeforeMindDay(key,...args);frontEnsure();frontDay(key);return result;};
const frontBeforeNotices=importantNotices;
importantNotices=function(){
 const f=frontEnsure(),out=[],seen=courierState().seen;
 for(const a of f.affairs){if(!['presented','overdue','needs-work'].includes(a.status))continue;const t=FRONT.events.find(t=>t.id===a.type),id='front:'+a.uid+':'+a.status;
  out.push({id,title:t.title,text:a.status==='presented'?'陛下，'+frontAffairText(a,t.brief):'陛下，'+(a.result||'前次奏办未妥，请阅回册。'),action:'frontAffair',arg:a.uid,unread:!seen[id]});}
 for(const r of f.returns.filter(r=>r.urgent).slice(-4)){const a=f.affairs.find(a=>a.uid===r.id);if(!a||a.status!=='completed')continue;const id='front:'+a.uid+':'+a.status;out.push({id,title:r.title,text:'陛下，'+r.text,action:'frontAffair',arg:a.uid,unread:!seen[id]});}
 // Preserve a genuine unresolved legacy case, while routine legacy generator reports stay in the archive.
 const combined=out.concat(frontBeforeNotices().filter(n=>n.id.startsWith('grain:')||n.id.startsWith('story-check:')));
 return combined.filter((n,i)=>combined.findIndex(x=>x.id===n.id)===i);
};
actions.frontTab=id=>{if(!['affairs','depts','officials','finance','local','history'].includes(id))return;frontEnsure().tab=id;render();};
Object.assign(actions,{frontAffair,frontAffairs,frontDecide,frontDept:frontDeptPanel,frontTask:frontStartTask,frontOrder,frontAppointments,frontAppoint,frontReview,frontTax,frontFinance,frontRetry,frontStudy,frontSources});
actions.randomEvent=frontAffairs;eventMenu=frontAffairs;
const frontBeforeCourtDept=actions.courtDept;actions.courtDept=id=>{const key={'吏':'personnel','户':'revenue','礼':'rites','兵':'war','刑':'justice','工':'works'}[id];if(key)frontDeptPanel(key);else if(id==='奏'||id==='通')frontAffairs();else frontBeforeCourtDept(id);};
const frontBeforeSide=actions.courtSide;actions.courtSide=id=>{if(id==='events')frontAffairs();else if(id==='exam')frontDeptPanel('rites');else if(id==='trade'||id==='foreign')frontAffairs();else frontBeforeSide(id);};
const frontBeforeGovernment=actions.government;actions.government=id=>{const map={water:'water',repair:'roads',school:'school',train:'training',patrol:'garrison',review:'review',inspect:'inspect',law:'audit',audit:'audit',exam:'exam'};if(map[id]){const t=FRONT.tasks.find(t=>t.id===map[id]);frontDeptPanel(t.dept);}else if(['treasury','taxlow','taxhigh'].includes(id))frontFinance();else if(['officials','appoint'].includes(id))frontAppointments();else frontBeforeGovernment(id);};
// The retired ritual's courtDone gate must not block the new open government loop.
const frontBeforeMonth=actions.nextMonth;actions.nextMonth=()=>{if(isAway()){toast('请先回京，再结算本月。');return;}state.courtDone=true;frontBeforeMonth();};
actions.month=()=>{const f=frontEnsure();frontOpen('结束本月','本月余'+state.ap+'行动，剩余点数不结转。','<p>下月恢复15行动，首次入朝耗1行动。户部按地方生计结税粮、支付俸饷及旧欠；内库另结宫廷收入与俸例。</p><p>在办差事按原期限回奏，未御批奏事会逾期并留下影响。跨月不会抹去欠支和欠妥记录。</p><p>当前待批'+f.affairs.filter(a=>['presented','overdue'].includes(a.status)).length+'件；六部在办'+f.orders.filter(o=>o.status==='pending').length+'项。</p><button class="btn primary wide" data-action="nextMonth">确认进入下月</button>');};
intro=function(){frontOpen('陛下，百官已在殿中候旨','十九岁登基，后宫尚空。今日先听前朝，日后也可与人物慢慢熟悉。','<div class="intro-steps"><p><b>一 · 议事与任人</b><br>点击殿内“奏”或右侧“御前呈报”议事；底部六部可办差事，“通”可看百官与簿册。普通府县常务自行处置。</p><p><b>二 · 拨款与回奏</b><br>国库、仓粮与宫中内库分别记账。差事需3—5日，过一天或月结后再看成效和臣子反应。</p><p><b>三 · 日常与相处</b><br>每月15行动；入朝1点、见面1点可聊3次。退朝后今日不再重开，可在翌日上朝。</p></div><button class="btn primary wide" data-action="introDone">临朝听政</button>');};
window.__frontCourtAudit={version:'13.5',ensure:frontEnsure,day:frontDay,month:frontMonth,conditions:frontConditions,officials:frontOfficials,quality:frontQuality,start:frontStartTask,decide:frontDecide,finishOrder:frontFinishOrder,finishAffair:frontFinishAffair,reactions:frontReactions};
window.__courierAudit.importantNotices=importantNotices;
const frontStyles=document.createElement('style');frontStyles.textContent='.front-banner{padding:24px 20px;border-radius:18px;background:linear-gradient(120deg,#efe2d3,#f7ede7);border:1px solid var(--line)}.front-banner h2{margin:12px 0}.front-banner p{font-size:13px;line-height:1.8}.front-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:16px 0}.front-metrics>div{padding:12px 8px;border:1px solid var(--line);border-radius:12px;text-align:center;font-size:12px}.front-metrics b{display:block;font:23px Georgia,serif;color:#a34f68;margin-top:5px}.front-tabs{gap:7px}.front-tabs .btn{flex:1;padding:11px 9px;white-space:nowrap}.front-depts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.front-depts .opt{margin:0}.front-details{padding:12px 0;border-bottom:1px solid var(--line);font-size:13px;line-height:1.9}.front-details summary{cursor:pointer;color:#a34f68}.front-targets .btn{padding:8px 11px}.front-reactions{margin-top:18px}.front-court h4{margin-bottom:10px}.front-court .record{overflow-wrap:anywhere}.front-court>section{min-width:0}@media(max-width:520px){.front-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}.front-banner{padding:19px 15px}.front-metrics{gap:5px}.front-metrics>div{padding:11px 3px;font-size:10px}.front-depts .opt{padding:13px 11px}.front-depts small{line-height:1.8}}';document.head.appendChild(frontStyles);
frontEnsure();frontDay(todayKey());
