/* Persistent lives, explicit kinship and a collision-checked palace. JSON only. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FengqueWorld=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x)),bound=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
 const historyIndexes=new WeakMap();
 function historyEvent(w,id){let index=historyIndexes.get(w);if(!index){index=new Map(w.history.map(e=>[e.id,e]));historyIndexes.set(w,index);}return index.get(id);}
 function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
 const pick=(w,a,key)=>a[hash(w.seed+':'+key)%a.length];
 const age=(w,p)=>Number.isFinite(p.birthMonth)?Math.floor((Math.floor(w.tick/30)-p.birthMonth)/12):null;
 function uid(w,type){return 'w'+w.seed.toString(36)+'-'+type+'-'+(++w.serial).toString(36);}
 function event(w,kind,text,actors=[],extra={}){const e={id:uid(w,'event'),tick:w.tick,kind,text,actors,...extra};w.history.push(e);historyIndexes.get(w)?.set(e.id,e);for(const id of actors){const p=w.people[id];if(p){p.memoryIds.push(e.id);if(p.memoryIds.length>90)p.memoryIds.shift();}}return e;}
 function create(input,data){
  const w={schemaVersion:1,seed:Number(input.seed)>>>0,tick:input.tick,started:input.tick,serial:0,people:{},families:{},relationships:{},history:[],months:{},years:{},palace:{width:10,height:8,buildings:{},uses:{},selected:null},dynasty:{generation:1,rulerId:'ruler-nine',heirId:null,rulers:[],pregnancy:null,familyPlan:null},generated:[],stamps:{}};
  for(const p of input.people||[]){const q={id:p.id,name:p.name,gender:p.gender||'男',birthMonth:p.birthMonth,alive:p.alive!==false,deathTick:p.alive===false?input.tick:null,source:p.source||'legacy',fixed:!!p.fixed,active:!!p.active,familyId:p.familyId||null,parents:(p.parents||[]).slice(),children:[],spouse:null,memoryIds:[],skills:copy(p.skills||{}),traits:[],goal:p.goal||'过好眼前的日子',location:p.location||'capital',birthplace:p.birthplace||null,role:p.role||'',career:p.official?'official':'resident',lifespan:p.lifespan||82+hash(w.seed+':life:'+p.id)%16};w.people[p.id]=q;}
  for(const p of Object.values(w.people))for(const id of p.parents)if(w.people[id]&&!w.people[id].children.includes(p.id))w.people[id].children.push(p.id);
  for(const f of input.families||[])w.families[f.id]={...copy(f),type:'legacy',source:'legacy',members:f.members.filter(id=>w.people[id]),branches:[],events:[],wealth:null,prestige:null,heir:null};
  for(const m of input.marriages||[])if(m.status==='married'&&w.people[m.a]?.alive&&w.people[m.b]?.alive){w.people[m.a].spouse=m.b;w.people[m.b].spouse=m.a;}
  w.people['ruler-nine']={id:'ruler-nine',name:'九公主',gender:'女',birthMonth:2-19*12,alive:true,source:'royal',fixed:true,active:false,familyId:'royal-liang',parents:[],children:[],spouse:null,memoryIds:[],skills:{admin:18,literature:30,military:20},traits:['谨慎'],goal:'把大梁接回来',location:'capital',role:'在位女帝',career:'ruler',lifespan:86};
  w.families['royal-liang']={id:'royal-liang',surname:'皇室',type:'royal',name:'大梁皇室',members:['ruler-nine'],branches:[],events:[],wealth:0,prestige:50,heir:'ruler-nine',origin:'皇室血脉，沿现存记录续谱。'};
  w.dynasty.rulers.push({id:'ruler-nine',started:input.tick,ended:null,kind:'登基',generation:1});
  const add=(type,x,y)=>{const id=uid(w,'building');w.palace.buildings[id]={id,type,x,y,rotation:0,level:1,status:'ready',created:input.tick,due:null,residents:[],protected:true};};add('hall',3,0);add('bedroom',0,0);
  for(let i=0;i<6;i++)generateFamily(w,data,i);
  event(w,'世界续册','沿用现有人物与旧事，另建六户人家的实谱；同姓不自动结亲。');return w;
 }
 function newPerson(w,data,f,options){
  const id=uid(w,'npc'),gender=options.gender||'男',key=options.key||id,traits=[pick(w,data.traits,key+':trait')];const other=pick(w,data.traits,key+':trait2');if(other!==traits[0])traits.push(other);
  const type=data.familyTypes.find(t=>t.id===f.type)||data.familyTypes[0],skills={admin:28+hash(w.seed+key+'a')%35,military:22+hash(w.seed+key+'m')%35,literature:28+hash(w.seed+key+'l')%35,charm:48+hash(w.seed+key+'c')%40};skills[type.skill]=bound(skills[type.skill]+16);
  const p={id,name:(f.type==='royal'?'':f.surname)+pick(w,gender==='女'?data.femaleNames:data.maleNames,key+':name'),gender,birthMonth:options.birthMonth,alive:options.alive!==false,deathTick:options.alive===false?Math.min(w.tick,(options.birthMonth+65*12)*30):null,source:options.source||'generated',fixed:false,active:!!options.active,familyId:f.id,parents:(options.parents||[]).slice(),children:[],spouse:null,memoryIds:[],skills,traits,personality:pick(w,data.personality,key+':personality'),goal:type.goal,location:options.location||f.location,birthplace:f.location,role:options.role||'尚在家中',career:'resident',lifespan:72+hash(w.seed+':lifespan:'+id)%24};
  p.aspiration=type.id==='merchant'?'merchant':type.id==='scholar'?'teacher':type.id==='military'?'military':'official';if(p.traits.includes('好胜')&&hash(id+':change')%4===0){p.aspiration='official';p.goal='凭所学谋一份实差';}
  if(options.inherit){for(const k of Object.keys(skills))p.skills[k]=bound(Math.round(options.inherit.reduce((n,x)=>n+(x.skills[k]||30),0)/options.inherit.length)+(hash(id+k)%13)-6);p.traits=Array.from(new Set(options.inherit.flatMap(x=>x.traits).slice(0,2)));}
  w.people[id]=p;f.members.push(id);if(p.active)w.generated.push(id);for(const parent of p.parents)if(w.people[parent])w.people[parent].children.push(id);return p;
 }
 function generateFamily(w,data,index){
  const type=data.familyTypes[index%data.familyTypes.length],surname=pick(w,data.surnames,'family:'+index+':surname'),id=uid(w,'family'),month=Math.floor(w.tick/30),f={id,surname,type:type.id,name:surname+'氏 · '+type.name,location:['capital','jiangnan','north'][index%3],members:[],branches:[],events:[],wealth:type.wealth,prestige:type.prestige,heir:null,origin:type.origin};w.families[id]=f;
  let parent=null;for(let generation=0;generation<3;generation++){
   const a=96-generation*26,birthMonth=month-a*12,father=newPerson(w,data,f,{birthMonth,gender:'男',alive:generation===2,key:id+':g'+generation,parents:parent?[parent.id,parent.familyPartner]:[],role:generation===0?'祖辈 · '+(type.id==='military'?'边地军吏':'乡里授徒者'):generation===1?'祖辈 · '+(type.id==='merchant'?'往来行商':'地方书办'):'家中长辈'}),mother=newPerson(w,data,f,{birthMonth:birthMonth+24,gender:'女',alive:generation===2,key:id+':gm'+generation,role:'家中长辈'});if(father.alive&&mother.alive){father.spouse=mother.id;mother.spouse=father.id;}else{father.widowedBy=mother.id;mother.widowedBy=father.id;}parent=father;father.familyPartner=mother.id;
   const e=event(w,'家族旧录',father.name+'与'+mother.name+'成家，靠'+(type.id==='merchant'?'经营商路':type.id==='military'?'军中差事':'家中生计')+'养育后辈。',[father.id,mother.id],{family:id,background:true,datePrecision:'generation'});f.events.push(e.id);
  }
  for(let j=0;j<(index<2?4:3);j++){
   const years=18+(index*3+j*2)%8,p=newPerson(w,data,f,{birthMonth:month-years*12,gender:'男',alive:true,active:true,key:id+':current:'+j,parents:[parent.id,parent.familyPartner],role:type.id==='merchant'?'商家子弟':type.id==='military'?'习武青年':'待试的读书人'});p.generation=4;f.heir=f.heir||p.id;
  }
  return f;
 }
 function ancestors(w,id,depth=4){const found=new Set();function walk(key,d){if(!d||!w.people[key])return;for(const p of w.people[key].parents){if(found.has(p))continue;found.add(p);walk(p,d-1);}}walk(id,depth);return found;}
 function related(w,a,b){if(a===b)return true;const aa=ancestors(w,a),bb=ancestors(w,b);return aa.has(b)||bb.has(a)||[...aa].some(id=>bb.has(id));}
 function marry(w,a,b){const p=w.people[a],q=w.people[b];if(!p||!q||!p.alive||!q.alive||p.spouse||q.spouse||age(w,p)<18||age(w,q)<18||related(w,a,b))return false;p.spouse=b;q.spouse=a;event(w,'成家',p.name+'与'+q.name+'自愿成家。',[a,b],{families:[p.familyId,q.familyId]});return true;}
 function child(w,data,a,b,royal=false){
  const p=w.people[a],q=w.people[b];if(!p?.alive||!q?.alive||age(w,p)<18||age(w,q)<18||age(w,p)>55||age(w,q)>55||Math.min(age(w,p),age(w,q))>45||related(w,a,b))return null;const f=w.families[royal?'royal-liang':p.familyId];if(!f)return null;
  const newborn=newPerson(w,data,f,{birthMonth:Math.floor(w.tick/30),gender:hash(w.seed+':child:'+w.serial)%2?'女':'男',active:false,source:royal?'royal':'generated',parents:[a,b],inherit:[p,q],key:'child:'+w.serial,role:royal?'皇室幼子':'家中幼子'});newborn.generation=Math.max(p.generation||1,q.generation||1)+1;event(w,'出生',p.name+'与'+q.name+'的孩子'+newborn.name+'出生，父母与谱系已记。',[newborn.id,a,b],{family:f.id});return newborn;
 }
 function deceased(w,id,kind='寿终'){const p=w.people[id];if(!p?.alive)return false;const formerCareer=p.career,survivors=[...p.children,p.spouse].filter(id=>id&&w.people[id]?.alive);p.alive=false;p.active=false;p.deathTick=w.tick;p.career='deceased';if(p.spouse&&w.people[p.spouse]){const s=w.people[p.spouse];s.widowedBy=id;s.spouse=null;}p.spouse=null;event(w,'离世',p.name+'离世，旧日关系与记事仍留在册中。',[id,...survivors],{cause:kind,formerCareer});return true;}
 function month(w,data){
  const m=Math.floor(w.tick/30);if(w.months[m])return;w.months[m]=true;
  for(const p of Object.values(w.people)){
   if(!p.alive)continue;const years=age(w,p);
   if(p.source==='generated'&&years>=18&&!p.active&&!['deceased','retired'].includes(p.career)){p.active=true;w.generated.push(p.id);p.role='初入人世的青年';event(w,'成年',p.name+'成年，开始自己谋求前路。',[p.id],{family:p.familyId});}
   if(years>=p.lifespan)deceased(w,p.id);
   if(p.id===w.dynasty.rulerId)continue;
   if(p.source==='generated'&&p.active&&!p.inPalace&&!p.royalSpouseOf&&p.career==='resident'&&years>=20&&!['merchant','teacher'].includes(p.aspiration)&&(p.skills.admin>=58||p.skills.literature>=65||p.skills.military>=65)&&hash(w.seed+':office:'+p.id+':'+m)%12===0){p.career='candidate';p.candidateSince=Math.floor(m/12);p.role=p.aspiration==='military'?'等候考校的习武人':'等候考校的读书人';event(w,'求职',p.name+'递了履历，希望凭所学谋一份差事。',[p.id],{family:p.familyId});}
   if(p.source==='generated'&&p.active&&p.career==='resident'&&years>=23&&['merchant','teacher'].includes(p.aspiration)&&p.skills[p.aspiration==='merchant'?'admin':'literature']>=65&&hash(w.seed+p.id+':trade:'+m)%4===0){p.career=p.aspiration;p.role=p.aspiration==='merchant'?'独自经营的商人':'开馆授徒的先生';event(w,'谋生',p.name+(p.aspiration==='merchant'?'盘下一份小生意，慢慢经营。':'开始授徒，把家学继续教下去。'),[p.id],{family:p.familyId});}
   if(p.source==='generated'&&years>=65&&p.career==='official'){p.career='retired';p.role='已经告老的旧官';event(w,'告老',p.name+'年事已高，交清原差事后告老，旧任职与人情仍留在册中。',[p.id],{family:p.familyId});}
  }
  const preg=w.dynasty.pregnancy;
  if(preg&&m>=preg.due){const c=child(w,data,preg.mother,preg.father,true);w.dynasty.pregnancy=null;w.dynasty.familyPlan=null;if(c)w.dynasty.lastBirth=c.id;else event(w,'皇室记事','原定的家事未能继续，未凭空添写皇嗣。',[preg.mother,preg.father]);}
  const plan=w.dynasty.familyPlan;
  const mother=plan&&w.people[plan.mother],father=plan&&w.people[plan.father];
  const fertile=plan&&mother?.alive&&father?.alive&&age(w,mother)>=18&&age(w,mother)<=45&&age(w,father)>=18&&age(w,father)<=55;
  const healthFactor=plan?Math.min(mother?.health??80,father?.health??80)/100:0;
  const fertilityFactor=plan?Math.min(mother?.fertility??100,father?.fertility??100)/100:0;
  const chance=plan?Math.min(60,Math.max(0,60*healthFactor*fertilityFactor*(age(w,mother)>35?.6:1))):0;
  if(plan&&!w.dynasty.pregnancy&&m>plan.started&&fertile&&healthFactor>=.45&&hash(w.seed+':plan:'+m)%100<chance){
   w.dynasty.pregnancy={mother:plan.mother,father:plan.father,started:m,due:m+9};event(w,'皇室记事','太医复核后，记下有孕之喜，日后按月照看。',[plan.mother,plan.father]);
  }
  const year=Math.floor(m/12);if(!w.years[year]){w.years[year]=true;yearly(w,data,year);}
 }
 function yearly(w,data,year){
  for(const p of Object.values(w.people))if(p.source==='generated'&&p.alive&&!p.inPalace&&!p.royalSpouseOf&&p.career==='candidate'&&year>(p.candidateSince??year)&&Math.max(p.skills.literature,p.aspiration==='military'?p.skills.military:0)>=70&&hash(w.seed+':pass:'+p.id+':'+year)%3===0){p.career='official';p.role=p.aspiration==='military'?'考校入选的营中校尉':'考校入选的地方佐官';event(w,'考校任用',p.name+'经过待试与考校，以所学入选差事，从实际事情做起。',[p.id],{family:p.familyId});}
  const free=Object.values(w.people).filter(p=>p.source==='generated'&&!p.fixed&&p.alive&&!p.spouse&&!p.inPalace&&!p.royalSpouseOf&&age(w,p)>=18&&age(w,p)<=42);
  if(!w.town34)for(const p of free){if(p.spouse)continue;const q=free.find(q=>q.id!==p.id&&!q.spouse&&q.familyId!==p.familyId&&!related(w,p.id,q.id)&&Math.abs(age(w,p)-age(w,q))<=12);if(q&&hash(w.seed+p.id+':marry:'+year)%100<65)marry(w,p.id,q.id);}
  // New families include brothers; outsiders of matching age arise through explicit migration.
  for(const f of Object.values(w.families).filter(f=>f.type!=='royal'&&f.type!=='legacy')){
   const household=f.members.map(id=>w.people[id]),need=household.some(p=>p?.alive&&p.active&&!p.spouse&&age(w,p)>=20&&age(w,p)<35);
   if(need&&Object.values(w.people).filter(p=>p.source==='generated'&&p.alive).length<250&&hash(w.seed+f.id+year)%3===0){const p=newPerson(w,data,f,{birthMonth:Math.floor(w.tick/30)-(20+hash(f.id+year)%7)*12,gender:'女',active:true,key:f.id+':migrant:'+year,role:'新迁居的手艺人'});p.birthplace='外地';p.migrant=true;p.familyId=f.id;event(w,'迁居',p.name+'迁来本地谋生；入户相助不等于与'+f.surname+'家有血缘。',[p.id],{family:f.id});}
   if(!w.town34)for(const p of household.filter(p=>p?.alive&&p.spouse&&p.id<p.spouse&&age(w,p)>=20&&age(w,p)<=42&&p.children.length<3))if(hash(w.seed+p.id+':birth:'+year)%100<45)child(w,data,p.spouse,p.id);
   const alive=household.filter(p=>p?.alive);if(!alive.length){f.status='extinct';f.heir=null;}else{const old=f.heir;f.status='living';const next=alive.filter(p=>age(w,p)>=18).sort((a,b)=>b.skills.admin-a.skills.admin)[0];f.heir=next?.id||alive[0].id;const working=alive.some(p=>p.career==='official');f.prestige=bound(f.prestige+(working?2:0));f.wealth=Math.max(0,f.wealth+(working?2:f.type==='merchant'?1:-1));if(old!==f.heir&&old)event(w,'家族交接',f.name+'由'+w.people[f.heir].name+'接手家计，旧存家产'+f.wealth+'照册承接，没有重新生成一份。',[old,f.heir],{family:f.id});}
  }
 }
 function daily(w,data){
  const active=Object.values(w.people).filter(p=>p.source==='generated'&&p.active&&p.alive&&age(w,p)>=18);
  for(const p of active){
   const f=w.families[p.familyId],warm=p.traits.some(t=>['温和','疏朗'].includes(t)),scores={work:p.career==='official'||p.aspiration==='merchant'?65:35,study:p.career==='resident'&&p.aspiration!=='merchant'||p.career==='candidate'?62:24,social:warm?52:24,family:f.wealth<15?45:26,rest:(p.health??80)<45?100:(p.stress??20)>65?84:18};if(f.wealth<10)scores.work+=30;
   if(p.traits.includes('勤勉'))scores.work+=12;if(p.traits.includes('好胜'))scores.study+=12;if(p.memoryIds.slice(-3).some(id=>historyEvent(w,id)?.kind==='离世'))scores.family+=32;
   const action=Object.keys(scores).sort((a,b)=>(scores[b]+hash(w.seed+p.id+w.tick+b)%25)-(scores[a]+hash(w.seed+p.id+w.tick+a)%25))[0];p.intent={tick:w.tick,action,reason:action==='family'?'家里有牵挂':action==='rest'?'先照顾身体':action==='study'?'想把本事学扎实':action==='social'?'找熟人说说话':'把手里的差事办好'};
   if(action==='study'){const key='learn:'+Math.floor(w.tick/30)+':'+p.id;if((w.stamps[key]||0)<2){w.stamps[key]=(w.stamps[key]||0)+1;const skill=p.skills.military>p.skills.literature?'military':'literature';p.skills[skill]=bound(p.skills[skill]+1);}}
   if(action==='social'){
    const others=active.filter(q=>q.id!==p.id),q=others[hash(w.seed+p.id+w.tick)%Math.max(1,others.length)];if(!q)continue;const pair=[p.id,q.id].sort().join('|'),stamp='social:'+w.tick+':'+pair;if(w.stamps[stamp])continue;w.stamps[stamp]=true;
    const r=w.relationships[pair]||(w.relationships[pair]={a:p.id,b:q.id,affinity:40,meetings:0}),conflict=p.traits.includes('好胜')&&q.traits.includes('好胜');r.affinity=bound(r.affinity+(conflict?-3:2));r.meetings++;event(w,conflict?'人物分歧':'自主往来',p.name+'与'+q.name+(conflict?'谈到一处课业，意见相左，一时没有说拢。':'碰面说了些各自的近况，彼此又熟悉一点。'),[p.id,q.id]);
   }
  }
 }
 function dimensions(b,data){const t=data.buildings.find(t=>t.id===b.type);return b.rotation%2?[t.height,t.width]:[t.width,t.height];}
 function fits(w,b,data,ignore=null){const [width,height]=dimensions(b,data);if(!Number.isInteger(b.x)||!Number.isInteger(b.y)||b.x<0||b.y<0||b.x+width>w.palace.width||b.y+height>w.palace.height)return false;return !Object.values(w.palace.buildings).some(o=>{if(o.id===ignore)return false;const [ow,oh]=dimensions(o,data);return b.x<o.x+ow&&b.x+width>o.x&&b.y<o.y+oh&&b.y+height>o.y;});}
 function has(w,type){return Object.values(w.palace.buildings).some(b=>b.type===type&&b.status==='ready');}
 function build(w,data,c,purse){
  const t=data.buildings.find(t=>t.id===c.building);if(!t||t.protected)return {ok:false,reason:'这处基础宫室不能另造。'};
  if(t.requires&&!has(w,t.requires))return {ok:false,reason:'先把'+data.buildings.find(x=>x.id===t.requires).name+'修好。'};
  if(Object.values(w.palace.buildings).some(b=>b.type===t.id))return {ok:false,reason:'这处已经安排过，可以选中它再升级。'};
  const b={id:'preview',type:t.id,x:c.x,y:c.y,rotation:c.rotation===1?1:0,level:1,status:'building',created:w.tick,due:w.tick+t.days,residents:[],protected:false};
  if(!fits(w,b,data))return {ok:false,reason:'这里摆不下，会挡住另一座建筑；换个空地方吧。'};
  if(purse.money<t.money)return {ok:false,reason:'宫里还差'+(t.money-purse.money)+'钱。朝廷的钱不能悄悄拿来修私宅。'};
  purse.money-=t.money;b.id=uid(w,'building');w.palace.buildings[b.id]=b;const e=event(w,'修建皇宫','动手修'+t.name+'，花宫里钱'+t.money+'；'+t.days+'天后可用。',[],{building:b.id});return {ok:true,event:e,building:b};
 }
 function changeBuilding(w,data,c,purse){
  const b=w.palace.buildings[c.id];if(!b)return {ok:false,reason:'没找到这座建筑。'};const t=data.buildings.find(t=>t.id===b.type);
  if(c.type==='move'){if(b.protected)return {ok:false,reason:'原议事殿和寝殿留在原处。'};const n={...b,x:c.x,y:c.y,rotation:c.rotation===1?1:0};if(!fits(w,n,data,b.id))return {ok:false,reason:'这里摆不下，原来的位置已经保留。'};Object.assign(b,n);event(w,'宫室摆放',t.name+'换了位置，入住与功能照旧。',[],{building:b.id});return {ok:true};}
  if(c.type==='upgrade'){if(b.status!=='ready'||b.level>=t.maxLevel)return {ok:false,reason:'先等修好，或这处已经够用了。'};const cost=t.money+3*b.level;if(purse.money<cost)return {ok:false,reason:'还要'+cost+'钱，宫里现有'+purse.money+'。'};purse.money-=cost;b.level++;b.status='upgrading';b.due=w.tick+Math.max(2,t.days);event(w,'修建皇宫',t.name+'开始扩修到'+b.level+'级，花钱'+cost+'。',[],{building:b.id});return {ok:true};}
  if(c.type==='demolish'){if(b.protected)return {ok:false,reason:'基础议事殿和住处不能拆。'};if(b.residents.length)return {ok:false,reason:'还有人住着，先给他们安排别处。'};delete w.palace.buildings[b.id];event(w,'宫室拆除',t.name+'已拆去，旧材料留给工匠处理，没有凭空退回新料钱。',[],{building:b.id});return {ok:true};}
  return {ok:false,reason:'没有这样的安排。'};
 }
 function advance(w,target,data){if(!Number.isInteger(target)||target<w.tick||target-w.tick>36000)return {ok:false,reason:'日期无效。'};while(w.tick<target){w.tick++;for(const b of Object.values(w.palace.buildings))if(b.status!=='ready'&&w.tick>=b.due){b.status='ready';b.due=null;event(w,'宫室修好',data.buildings.find(t=>t.id===b.type).name+'已收拾好，人物有了新的去处。',[],{building:b.id});}if(w.tick%30===0)month(w,data);daily(w,data);}return {ok:true};}
 function promote(w,id){const p=w.people[id];if(!p?.alive||p.fixed||p.inPalace||p.royalSpouseOf||age(w,p)<20||Math.max(p.skills.admin,p.skills.literature)<58||!['resident','candidate'].includes(p.career))return {ok:false,reason:'还未满足考校条件，不能只凭亲近就直接授职。'};p.career='official';p.role='新任地方佐官';event(w,'考校任用',p.name+'经履历与所学考校，任地方佐官，从实差做起。',[id],{family:p.familyId});return {ok:true};}
 function planFamily(w,partner){const r=w.people[w.dynasty.rulerId],p=w.people[partner],mother=r,father=p;if(!r?.alive||!p?.alive||age(w,mother)<18||age(w,mother)>45||age(w,father)<18||age(w,father)>55||related(w,r.id,p.id))return {ok:false,reason:'眼下不适合商量这件家事。'};if(w.dynasty.familyPlan||w.dynasty.pregnancy)return {ok:false,reason:'已有家中的安排，先照顾眼前。'};w.dynasty.familyPlan={mother:mother.id,father:father.id,started:Math.floor(w.tick/30)};event(w,'家事商议','双方愿意期待一个孩子；是否有孕仍要等以后核实。',[mother.id,father.id]);return {ok:true};}
 function chooseHeir(w,id){const r=w.people[w.dynasty.rulerId],p=w.people[id];if(!p?.alive||!r.children.includes(id))return {ok:false,reason:'须从在世皇嗣中选择。'};w.dynasty.heirId=id;event(w,'储位安排',p.name+'被记为继承人，正式交位仍须成年。',[r.id,id]);return {ok:true};}
 function succeed(w,id){if(w.dynasty.pregnancy)return {ok:false,reason:'家中已有孕事，先照看到孩子出生，再商量交位。'};const r=w.people[w.dynasty.rulerId],p=w.people[id];if(!p?.alive||!r.children.includes(id)||age(w,p)<18||w.dynasty.heirId!==id)return {ok:false,reason:'先选定一位已成年的在世皇嗣。'};const reign=w.dynasty.rulers.at(-1);reign.ended=w.tick;reign.kind=r.alive?'退位':'驾崩后继位';r.role=r.alive?'退位的先帝':'已故先帝';p.role=p.gender==='女'?'在位女帝':'在位皇帝';p.career='ruler';w.dynasty.generation++;w.dynasty.rulerId=id;w.dynasty.heirId=null;w.dynasty.familyPlan=null;w.dynasty.pregnancy=null;w.dynasty.rulers.push({id,started:w.tick,ended:null,kind:'继位',generation:w.dynasty.generation});event(w,'皇位传承',p.name+'承接第'+w.dynasty.generation+'代皇位，钱粮、宫室、世家与旧账仍是同一个大梁。',[r.id,id]);return {ok:true,previous:r.id};}
 function validate(w){
  const errors=[];if(w.schemaVersion!==1||!w.people||!w.families)return ['世界结构不完整'];
  for(const p of Object.values(w.people)){if(p.id===p.spouse)errors.push(p.id+'自婚');if(p.spouse&&w.people[p.spouse]?.spouse!==p.id)errors.push(p.id+'婚姻不对称');for(const id of p.parents){const parent=w.people[id];if(!parent){errors.push(p.id+'父母缺失');continue;}if(p.source==='generated'&&(p.birthMonth-parent.birthMonth<15*12||p.birthMonth-parent.birthMonth>65*12))errors.push(p.id+'亲子年龄不合');if(!parent.children.includes(p.id))errors.push(p.id+'亲子反向缺失');}if(!p.alive&&p.career!=='deceased'&&p.source==='generated'&&p.active)errors.push(p.id+'死后仍活动');if(p.familyId&&!w.families[p.familyId]&&p.source!=='legacy')errors.push(p.id+'家族缺失');}
  if(!w.people[w.dynasty.rulerId])errors.push('君主缺失');return errors;
 }
 return {version:'16.0',create,age,hash,pick,uid,event,generateFamily,newPerson,ancestors,related,marry,child,deceased,advance,has,fits,dimensions,build,changeBuilding,promote,planFamily,chooseHeir,succeed,validate,copy};
});
