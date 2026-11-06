/* JSON-only rules. No DOM, clock, global game state, network or random source. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RealmSim=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x)),clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
 function hash(s){let n=2166136261;for(const c of String(s)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
 function record(s,kind,text,extra={}){const e={id:'realm-'+(++s.serial),tick:s.tick,kind,text,...extra};s.events.push(e);return e;}
 function create(input,data){
  const s={schemaVersion:1,active:true,tick:input.tick,started:input.tick,seed:input.seed||1,serial:0,economy:copy(input.economy),regions:copy(input.regions),actors:copy(input.actors),jobs:[],events:[],days:[],bonds:{},memories:{},stamps:{},goals:[],festivalDays:[],leisureDays:[],paidArrears:0,replies:{}};
  for(const a of s.actors){a.stress=20;a.health=80;a.busyUntil=0;a.met=0;a.contactDays=[];a.mood='平常';}
  record(s,'登基','接手大梁日常经营；国库、粮仓与旧欠沿用现存账册。');plan(s,data);return s;
 }
 function weather(s,data){return data.weather[hash(s.seed+':weather:'+s.tick)%data.weather.length];}
 function visual(r){
  return {fields:r.food>=38&&r.infrastructure>=25?'阡陌渐复':'荒田待垦',market:r.food>=35&&r.security>=35&&r.business>=35?'常市开张':'零星摊贩',night:r.security>=60&&r.business>=45?'夜市点灯':'入夜闭坊',water:r.waterRisk>60?'堤岸待修':'水道尚稳'};
 }
 function plan(s,data){
  const rain=weather(s,data).includes('雨'),hungry=Object.values(s.regions).some(r=>r.food<25);
  for(const a of s.actors){
   const job=s.jobs.find(j=>j.actor===a.id&&j.status==='pending'),h=hash(s.seed+':'+a.id+':'+s.tick),work=job?'督办'+job.name:a.id==='xu'?(s.economy.arrears>30?'核对俸饷与调粮副册':'整理旧案与六部回卷'):a.id==='jiang'?'与族中荐举者核对履历':a.id==='xie'?'核实京中来话的出处':a.official?'当值，处理本衙门差事':a.skill==='music'?'练习新曲，校订旧谱':'处理生计与家中事务';
   if(!job&&s.tick>=a.busyUntil&&((a.id==='xu'&&h%7===0)||(a.id==='xie'&&h%5===0)))a.busyUntil=s.tick+2;
   a.stress=clamp(a.stress+(job?2:hungry&&a.official?1:-1));if(s.tick%3===0)a.health=clamp(a.health+(a.stress>65?-1:a.stress<35?1:0));a.mood=a.health<45?'不适':a.stress>65?'疲惫':s.tick<a.busyUntil?'专注':'平常';
   a.routine=data.slots.map((slot,i)=>({slot,place:i===0||i===6?'住处':i===2?'膳房':i===3&&s.tick<a.busyUntil?'外出办事':i===4?(rain?'廊下':a.official?'衙门':'市集'):i===5?'住处':a.official?'衙门':'住处',text:i===0?'洗漱，更衣。':i===2?'用膳歇息。':i===6?'熄灯歇下。':i===5?(h%2?'整理今日用过的物件。':'留一盏灯，读半卷闲书。'):i===4?(rain?'避雨，等雨势稍缓再走。':h%2?'沿街买些日用。':'散值后独自走走。'):work+(s.tick<a.busyUntil?'，暂不接私下邀约。':'。')}));
  }
 }
 function memory(s,id,event){const list=s.memories[id]||(s.memories[id]=[]);list.push({event:event.id,tick:s.tick,kind:event.kind,text:event.text});if(list.length>90)list.shift();}
 function social(s){
  const at=id=>s.actors.find(a=>a.id===id),pairs=[['xu','jiang'],['xu','xie'],['jiang','ye'],['jiang','xie']],pair=pairs[hash(s.seed+':pair:'+s.tick)%pairs.length],a=at(pair[0]),b=at(pair[1]);if(!a||!b)return;
  const id=[a.id,b.id].sort().join('|'),bond=s.bonds[id]||(s.bonds[id]={a:a.id,b:b.id,stance:0,meetings:0}),hard=s.economy.arrears>60,friction=hard||s.economy.tax==='heavy';bond.stance=clamp(bond.stance+(friction?-2:1),-50,50);bond.meetings++;
  let text;
  if(id==='jiang|xu')text=friction?'许知衡要求先按欠额补饷，姜禹瀛坚持先核地方实收。两人未能当日议定，暂各备副册。':'许知衡与姜禹瀛对上了地方副册，对调粮先后暂得一致。';
  else if(id==='xie|xu')text='谢无咎递来一份京中口述，许知衡请他补上来话时日与出处；两人约定核过原件再报。';
  else if(id==='jiang|ye')text=friction?'姜禹瀛请叶承钧先通商路，叶承钧要求户部明列还期。两家的来往仍在，这笔事尚未谈拢。':'姜禹瀛与叶承钧核过一段运粮路程，约定各留副册，互不独揽签押。';
  else text='姜禹瀛询问荐举名册的流转，谢无咎只交出已核的公开一页，余下仍待互证。';
  const e=record(s,'人物往来',text,{actors:pair,channel:'衙门值房登记',stance:bond.stance});memory(s,a.id,e);memory(s,b.id,e);
 }
 function refreshGoals(s,data){
  const focus=Object.values(s.regions).filter(r=>r.focus),done=s.jobs.filter(j=>j.status==='done'),north=focus.find(r=>r.id==='north'||/北/.test(r.name)),e=s.economy;
  const tests={survive:()=>s.paidArrears>0&&e.grain>0,livelihood:()=>focus.every(r=>r.food>=40&&r.security>=40)&&done.length>=2,service:()=>done.some(j=>j.type==='audit')&&focus.reduce((n,r)=>n+r.corruption,0)/Math.max(1,focus.length)<45,border:()=>e.arrears<=30&&(north?.security||0)>=55&&s.paidArrears>0,flourish:()=>focus.every(r=>visual(r).market==='常市开张')&&s.festivalDays.length>=2&&e.treasury>0&&e.grain>0};
  for(const g of data.goals)if(!s.goals.includes(g.id)&&tests[g.id]()){s.goals.push(g.id);record(s,'国势阶段','达成「'+g.name+'」；后续仍可反复，天下不会因此停转。');}
 }
 function advanceOne(s,data){
  s.tick++;const e=s.economy,rain=weather(s,data).includes('雨'),policy=data.policies[e.tax]||data.policies.normal,before=copy(e);let income=0,harvest=0;
  for(const r of Object.values(s.regions)){
   if(s.tick%5===0){income+=Math.max(0,Math.floor(r.business/18*policy.income*(1-r.corruption/130)));r.public=clamp(r.public+policy.public);r.business=clamp(r.business+policy.business+(r.security<25?-1:0));}
   const productive=r.infrastructure>=25&&r.waterRisk<65&&r.security>=25;
   if(s.tick%7===0&&productive){harvest+=2;r.food=clamp(r.food+4);}else if(s.tick%3===0)r.food=clamp(r.food-1);
   if(rain&&r.waterRisk>65){r.food=clamp(r.food-1);r.infrastructure=clamp(r.infrastructure-1);}
   if(r.food<25&&s.tick%3===0){r.refugees++;r.security=clamp(r.security-1);r.public=clamp(r.public-1);}
   if(e.arrears>60&&s.tick%5===0)r.security=clamp(r.security-1);
   r.grainPrice=Math.round((1+(100-r.food)/80+r.refugees/80)*100)/100;
  }
  e.treasury+=income;e.grain+=harvest;const used=Math.min(e.grain,1);e.grain-=used;
  if(s.tick%5===0){const paid=Math.min(Math.max(0,e.treasury-(e.reserve||0)),12);e.treasury-=paid;e.arrears+=12-paid;}
  for(const j of s.jobs){if(j.status!=='pending'||j.due>s.tick)continue;const r=s.regions[j.region],def=data.projects.find(p=>p.id===j.type);j.status='done';j.finished=s.tick;const strength=j.quality<45?0.6:1;for(const [k,v]of Object.entries(def.effect))r[k]=clamp(r[k]+Math.round(v*strength));const ev=record(s,'地方回奏',r.name+' · '+j.name+'：'+def.text+(strength<1?'承办经验不足，只完成了部分原定目标。':''),{job:j.id,actor:j.actor,region:j.region});memory(s,j.actor,ev);}
  if((used<1||e.arrears>96)&&s.tick%5===0)record(s,'重要警示',used<1?'官仓已空，今日军营口粮未能按额拨足。须筹粮或减少新开工程。':'俸饷旧欠仍在扩大，营中与衙门催支。',{urgent:true});
  if(s.tick%2===0)social(s);
  const month=Math.floor(s.tick/30)%12,day=s.tick%30+1,festival=data.festivals.find(f=>f.month===month&&f.day===day);if(festival)record(s,'节令',festival.name+'：'+festival.text,{festival:festival.name});
  s.days.push({tick:s.tick,income,harvest,grainUsed:used,payrollPaid:before.treasury+income-e.treasury,arrears:e.arrears,treasury:e.treasury,grain:e.grain,weather:weather(s,data)});
  plan(s,data);refreshGoals(s,data);
 }
 function advance(s,target,data){if(!Number.isInteger(target)||target<s.tick||target-s.tick>3660)return {ok:false,reason:'无效日期'};while(s.tick<target)advanceOne(s,data);return {ok:true};}
 function command(s,c,data){
  if(!c||!c.id||!Number.isInteger(c.tick)||c.tick!==s.tick)return {ok:false,reason:'指令已过期，请重新查看今日安排。'};
  if(s.stamps[c.id])return {ok:false,reason:'这项安排已经记下。'};
  const e=s.economy;
  function fail(reason){return {ok:false,reason};}
  function finish(kind,text,extra={}){s.stamps[c.id]=s.tick+1;const event=record(s,kind,text,extra);refreshGoals(s,data);return {ok:true,event};}
  if(c.type==='project'){
   const def=data.projects.find(p=>p.id===c.project),r=s.regions[c.region],a=s.actors.find(a=>a.id===c.actor);
   if(!def||!r||!a||!a.official)return fail('须指定地方、工程及在任承办官。');
   if(a.busyUntil>s.tick||s.jobs.some(j=>j.status==='pending'&&(j.actor===a.id||j.type===def.id&&j.region===r.id)))return fail('承办人或本项地方差事尚未办结。');
   if(e.treasury<def.money||e.grain<def.grain)return fail('钱粮不足，须先筹措或缩小安排。');
   e.treasury-=def.money;e.grain-=def.grain;const quality=Number(a.skills?.[def.skill]??30),delay=quality<45?1:0;
   const j={id:c.id,type:def.id,name:def.name,region:r.id,actor:a.id,quality,started:s.tick,due:s.tick+def.days+delay,status:'pending',money:def.money,grain:def.grain};s.jobs.push(j);a.busyUntil=j.due;
   const result=finish('地方施政',a.name+'负责'+r.name+'「'+def.name+'」，花朝廷的钱'+def.money+'、存粮'+def.grain+'；'+(def.days+delay)+'天后看结果。',{job:j.id,actor:a.id,region:r.id});memory(s,a.id,result.event);plan(s,data);return result;
  }
  if(c.type==='payArrears'){
   const amount=Math.min(12,e.arrears);if(amount<=0)return fail('没有欠薪了。');if(e.treasury<amount)return fail('朝廷的钱不够'+amount+'，先想办法收一笔。');e.treasury-=amount;e.arrears-=amount;s.paidArrears+=amount;return finish('补支俸饷','实际发了'+amount+'钱，还欠'+e.arrears+'。',{amount});
  }
  if(c.type==='tax'){
   if(!data.policies[c.policy])return fail('无此税令。');if(s.stamps['tax:'+Math.floor(s.tick/30)])return fail('本月已改过税令，待下月再议。');
   e.tax=c.policy;s.stamps['tax:'+Math.floor(s.tick/30)]=s.tick+1;return finish('税令','改行'+data.policies[c.policy].name+'；每五日实收，商情与民心也随之变化。');
  }
  if(c.type==='contact'){
   const a=s.actors.find(a=>a.id===c.actor);if(!a)return fail('此人不在册。');if(a.busyUntil>s.tick)return fail(a.name+'正在办差，最早'+(a.busyUntil-s.tick)+'日后回话。');
   if(a.contactDays.includes(s.tick))return fail('今日已留过一段相处，改日再续。');a.contactDays.push(s.tick);a.met++;a.stress=clamp(a.stress-3);
   const stage=a.met<3?'礼数周全':a.met<7?'渐渐熟悉':a.met<12?'相互亲近':'彼此信任';return finish('私下相处','与'+a.name+'留了一段闲暇；'+stage+'。',{actor:a.id});
  }
  if(c.type==='leisure'){
   const l=data.leisure.find(x=>x.id===c.activity);if(!l)return fail('无此活动。');if(s.leisureDays.includes(s.tick))return fail('今日已歇过一阵，明日再来。');s.leisureDays.push(s.tick);return finish('生活',l.text);
  }
  if(c.type==='festival'){
   const f=data.festivals.find(f=>f.month===Math.floor(s.tick/30)%12&&f.day===s.tick%30+1);if(!f)return fail('今日没有这一节令。');if(s.festivalDays.includes(s.tick))return fail('今日已经相聚。');
   s.festivalDays.push(s.tick);return finish('节令相聚',f.name+'：'+f.text+' 今夜留了一席家常饭，没有额外赐金。');
  }
  return fail('未知指令。');
 }
 function annals(s,year){const rows=s.events.filter(e=>Math.floor(e.tick/360)===year);return {schemaVersion:1,year:year+1,title:'大梁实录 · 景和'+(year+1)+'年',entries:copy(rows),summary:{projects:rows.filter(e=>e.kind==='地方回奏').length,meetings:rows.filter(e=>e.kind==='私下相处').length,events:rows.length}};}
 return {version:'15.0',create,advance,command,visual,weather,annals,copy,hash,note:record};
});
