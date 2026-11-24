'use strict';
class LiangGame {
 constructor(state){this.s=state||this.create();if(state&&state.mapVersion!==2){for(const r of state.regions){r.x+=15;r.y+=11;}this.setupForeignCities();}for(const story of this.s.stories)if(story.def==='grain'&&story.title==='一船粮，两本账'||story.def==='twins'&&story.title==='同枝不同命')story.title=STORY_DEFS.find(d=>d.id===story.def).title;
  if(this.s.flags.examRecruited===undefined)this.s.flags.examRecruited=!!(this.s.exam?.chosen.length||this.s.people.some(p=>p.office==='新科进士')||this.s.logs.some(l=>/^录取.+为新科进士/.test(l.text)));
  if(this.s.selection){this.s.selection.rejected=this.s.selection.rejected||[];this.s.selection.maxChoices=Number.isInteger(this.s.selection.maxChoices)?this.s.selection.maxChoices:Math.max(0,this.capacity()-(this.s.people||[]).filter(p=>p.consort&&!p.dead).length);}
 }
 rand(){let x=this.s.seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;this.s.seed=x>>>0;return this.s.seed/4294967296;}
 int(a,b){return a+Math.floor(this.rand()*(b-a+1));}
 pick(a){return a[Math.floor(this.rand()*a.length)];}
 npc(id){return this.s.people.find(p=>p.id===id);}
 region(id){return this.s.regions.find(r=>r.id===id);}
 alive(){return this.s.people.filter(p=>!p.dead&&p.id!==this.s.player.id);}
 adults(){return this.alive().filter(p=>p.age>=18);}
 date(){return `昭宁${Math.floor(this.s.turn/12)+1}年 · ${this.s.turn%12+1}月`;}
 log(text,type='world',who=null){this.s.logs.unshift({id:++this.s.uid,turn:this.s.turn,date:this.date(),type,text,who});this.s.logs=this.s.logs.slice(0,250);}
 create(){
  this.s={version:1,seed:(Date.now()^0x71fab37)>>>0,uid:100,turn:0,phase:'court',courtAP:5,privateAP:6,money:1680,grain:3600,wood:240,iron:90,horses:40,stability:38,tax:12,soldiers:2400,training:32,weapons:1300,morale:43,intel:32,people:[],clans:JSON.parse(JSON.stringify(CLAN_SEEDS)),offices:{},regions:[],countries:[],stories:[],pending:[],resolved:[],logs:[],cases:[],builds:[],treasures:[{id:1,name:'旧藏松烟墨',hobby:'笔墨',value:65},{id:2,name:'一卷失传琴谱',hobby:'琴艺',value:90}],children:[],pregnancy:null,player:{id:'empress',name:'昭宁',age:19,literature:25,military:18,art:22},flags:{tutorialDone:false},appointments:[],exam:null,selection:null,war:null,history:[],relations:{},trained:false,built:false,acted:{},lost:false};
  for(const c of this.s.clans){c.power={姜:76,叶:72,许:36,沈:62,裴:44,陆:57}[c.id];c.attitude={姜:40,叶:38,许:68,沈:42,裴:55,陆:43}[c.id];}
  this.s.people=JSON.parse(JSON.stringify(CORE_PEOPLE)).map(p=>({...p,love:0,wealth:500,health:100,recent:[{turn:0,text:p.recent}],location:p.consort?'坤宁宫':'京城',parents:p.parents||[],secrets:[],aliveSince:0}));
  this.s.people.push({id:'empress',name:'昭宁',age:19,clan:'皇室',office:'女帝',love:0,friend:0,loyalty:100,parents:['late-emperor','late-mother'],recent:[],color:'#ae8c4a',health:100});
  this.s.people.push({id:'late-emperor',name:'先帝',age:58,dead:true,clan:'皇室',office:'先帝',parents:[],recent:[],spouse:'late-mother'}, {id:'late-mother',name:'先妃',age:27,dead:true,clan:'皇室',office:'先妃',parents:[],recent:[],spouse:'late-emperor'});
  this.s.people.push({id:'ye-wife',name:'姜蘅',age:36,clan:'姜',office:'叶氏夫人',personality:'精明强势',hobby:'商道',friend:0,love:0,loyalty:42,admin:92,literature:75,military:30,art:73,wealth:1800,health:100,spouse:'ye',parents:['姜-grand','姜-grandmother'],recent:[{turn:0,text:'重新划分了家中商铺的管事职责。'}],color:'#817b61',bio:'叶承筠之妻。账目与人事都握在手中，家中大事很少有绕过她办成的。两个儿子的婚事，她同样早有打算。'});
  this.s.people.push({id:'ye-sister',name:'叶令仪',age:10,clan:'叶',office:'叶家幼女',parents:['ye','ye-wife'],friend:0,love:0,loyalty:50,health:100,personality:'伶俐好奇',hobby:'花草',admin:10,literature:15,military:5,art:20,recent:[{turn:0,text:'把给两位兄长的家书装反了信封。'}],color:'#b8998e',bio:'叶家幼女，尚在家塾读书，最爱追着两位兄长问宫里有没有真的金鱼。'});
  for(const c of this.s.clans){
   const gp={id:c.id+'-grand',name:{姜:'姜慎行',叶:'叶崇礼',许:'许阁老',沈:'沈秉川',裴:'裴端',陆:'陆震北'}[c.id],age:69,clan:c.id,office:'族中长辈',dead:['许','陆','裴'].includes(c.id),parents:[],spouse:c.id+'-grandmother',friend:0,love:0,loyalty:50,personality:'老成持重',hobby:'经史',admin:80,literature:78,military:65,art:50,health:72,wealth:900,recent:[],color:c.color,bio:c.history[0]};
   const gm={...gp,id:c.id+'-grandmother',name:c.id+'氏老夫人',age:66,spouse:gp.id,office:'族中长辈',dead:c.id==='许',parents:[]};
   this.s.people.push(gp,gm);
   const father={...gp,id:c.id+'-father',name:c.id+this.pick(['承礼','望舒','怀序','绍庭','文谦']),age:47,dead:c.id==='许',spouse:c.id+'-mother',parents:[gp.id,gm.id],office:'族中管事',recent:[]};
   const mother={...gm,id:c.id+'-mother',name:this.pick(['顾','崔','柳','宋'])+'氏',age:45,dead:false,clan:c.id,spouse:father.id,parents:[],office:'家中长辈',recent:[]};
   this.s.people.push(father,mother);
   const anchor=this.s.people.find(p=>p.clan===c.id&&p.id!=='ye-wife');
   if(anchor){anchor.parents=c.id==='姜'?[gp.id,gm.id]:[father.id,mother.id];if(c.id==='叶')anchor.parents=[gp.id,gm.id];}
   for(let i=0;i<2;i++){let p=this.generateNPC(c.id);p.age=Math.min(p.age,mother.age-18);p.parents=[father.id,mother.id];p.office=i?'地方士人':'候补官员';this.s.people.push(p);}
  }
  // Keep the imperial tutor widowed without inventing an additional living spouse.
  const jiang=this.npc('jiang');jiang.spouse='jiang-spouse';
  this.s.people.push({id:'jiang-spouse',name:'沈氏',age:29,clan:'沈',office:'太傅亡妻',dead:true,parents:['沈-grand','沈-grandmother'],spouse:'jiang',recent:[]});
  this.s.offices={'首辅':'xu','太傅':'jiang','吏部尚书':'姜-father','户部尚书':'ye','礼部尚书':'裴-father','兵部尚书':'lu','刑部尚书':'许-mother','工部尚书':'shen','左都御史':'pei','东厂提督':'xie','西厂掌印':'xie','锦衣卫指挥使':'xie'};
  const coords=[[20,15,'京畿','帝都',1],[19,15,'河中','粮仓',0],[21,15,'青州','商埠',0],[20,14,'陇西','矿藏',0],[20,16,'南陵','牧野',0]];
  coords.forEach(([x,y,name,tag,capital],i)=>{this.s.regions.push({id:'r'+i,x,y,name,tag,capital:!!capital,owner:'liang',population:capital?62000:this.int(24000,38000),loyalty:this.int(35,58),prosperity:this.int(25,46),garrison:capital?800:400,governor:['xu','姜-father','shen','pei','lu'][i],buildings:{farm:tag==='矿藏'?0:1,market:[0,2].includes(i)?1:0,mine:tag==='矿藏'?1:0,pasture:tag==='牧野'?1:0,homes:capital?2:1,palace:0}});});
  this.s.countries=[{id:'yan',name:'北燕',x:5,y:-1,color:'#8795a0',relation:0,prosperity:62,power:76,trade:false,war:false,desc:'擅骑战，边境牧场广阔。',resource:'horses'},{id:'shu',name:'西蜀',x:0,y:4,color:'#9f967e',relation:0,prosperity:65,power:54,trade:false,war:false,desc:'山路险要，盛产木材。',resource:'wood'},{id:'yue',name:'南越',x:5,y:10,color:'#8a9b7d',relation:0,prosperity:72,power:47,trade:false,war:false,desc:'稻熟两季，商船穿行。',resource:'grain'},{id:'dong',name:'东琉',x:11,y:4,color:'#7b9b9e',relation:0,prosperity:81,power:59,trade:false,war:false,desc:'海上诸港，铁器交易兴盛。',resource:'iron'},{id:'xi',name:'朔漠',x:0,y:-1,color:'#aaa08b',relation:0,prosperity:38,power:67,trade:false,war:false,desc:'部落逐水草而居，马市兴旺。',resource:'horses'}];
  this.setupForeignCities();
  for(const p of this.s.people){for(const parent of p.parents||[])this.changeBond(p.id,parent,25,0,'亲属');if(p.spouse&&this.npc(p.spouse))this.changeBond(p.id,p.spouse,12,0,'夫妻');}
  for(const [a,b,d,label]of [['xu','jiang',28,'同议新政'],['jiang','ye',18,'拥立旧盟'],['xu','ye',-14,'政见不合'],['pei','xie',-30,'互相提防'],['lu','shen',-18,'军需旧争'],['shen','ye-zhen',24,'商路旧交'],['ye-jin','ye-zhen',26,'双生兄弟'],['ye-wife','ye-jin',-8,'母子有隙'],['ye-wife','ye-zhen',16,'母子'],['xu','pei',22,'清议同道'],['xie','ye-jin',14,'猫与琴的交情']])this.changeBond(a,b,d,0,label);
  this.startStory('grain');this.startStory('twins');this.startStory('cat');
  this.newCase('京仓粮银去向','ye-zhen',0);this.examOffer();this.selectionOffer();
  this.log('先帝留下的不是盛世，是三个月没发的军饷、漏雨的宫殿，还有一群等你先开口的人。','system');
  this.log('许知衡把第一本折子推到案前：“陛下，钱不够。我们先决定，哪一笔不能省。”','court','xu');
  this.log('叶锦已按叶家安排入主坤宁宫。两座偏殿尚空，掖庭最多容纳十五人。','world','ye-jin');
  return this.s;
 }
 setupForeignCities(){
  for(const co of this.s.countries){const d=FOREIGN_REALMS[co.id];if(!d)continue;co.x=d.x+(d.cols-1)/2;co.y=d.y-1;co.initialCities=d.count;
   for(let i=0;i<d.count;i++){const id='foreign-'+co.id+'-'+i;if(this.region(id))continue;const x=d.x+i%d.cols,y=d.y+Math.floor(i/d.cols);if(this.s.regions.some(r=>r.x===x&&r.y===y))continue;
    this.s.regions.push({id,x,y,name:i===0?d.capital:d.names[i-1],tag:i===0?'王都':co.id==='xi'?'牧城':co.id==='dong'?'海港':i%5===0?'关隘':'城池',capital:false,royal:i===0,owner:co.id,population:18000+(i*1379%25000),loyalty:55+(i*7%30),prosperity:35+(i*11%45),garrison:i===0?1800:350+(i*83%650),governor:null,buildings:{farm:co.id==='xi'?1:2,market:i%3===0?2:1,mine:i%4===0?1:0,pasture:co.id==='xi'||co.id==='yan'?2:0,homes:2,palace:0}});
   }
  }
  this.s.mapVersion=2;
 }
 generateNPC(clan){
  clan=clan||this.pick(this.s.clans).id;
  const names=['清晏','砚秋','承璧','疏桐','闻笙','如晦','照尘','望津','观澜','问舟','言蹊','令琛','见山','鸣珂','时雨','砚生','长缨','知遥'];
  let name=clan+this.pick(names);if(this.s.people.some(p=>p.name===name))name+=this.pick(['之','卿','玉']);
  const age=this.int(18,32),parentPool=this.s.people.filter(p=>p.clan===clan&&p.age>=age+18&&p.spouse&&this.npc(p.spouse)?.age>=age+18&&!this.npc(p.spouse)?.parents?.includes(p.id));
  const parent=parentPool.length?this.pick(parentPool):null,parents=parent?[parent.id,...(this.npc(parent.spouse)?[parent.spouse]:[])]:[];
  const family=this.s.clans.find(c=>c.id===clan),upbringing=this.pick(['幼时家境拮据，靠替书铺抄书补贴束脩','少年随长辈跑过商路，见过不少账房之外的人情','曾在地方书院读书，与同窗至今仍有书信往来','小时寄住外家，成年后才回到族中','在族学里并不出挑，后来靠一件实务赢得举荐']);
  return {id:'n'+(++this.s.uid),name,clan,age,office:'待选人才',personality:this.pick(['温和细腻','骄矜自尊','明朗直率','沉稳果决','精明务实','清正倔强']),hobby:this.pick(['笔墨','经史','骑射','琴艺','商道','弈棋','花草']),friend:0,love:0,loyalty:this.int(36,72),admin:this.int(35,85),literature:this.int(35,90),military:this.int(25,85),art:this.int(35,90),wealth:this.int(100,600),health:100,parents,color:family?.color||'#7b8577',recent:[],location:this.pick(['京城','江陵','河中','青州']),bio:`出身${family?.name||clan+'氏'}${parent?'，为'+parent.name+'一支后辈':'旁支'}。${upbringing}。${family?'家族素来重视'+family.interest+'，这层来历也影响着其在朝中的处境。':'凭自己的本事谋得今日的机会。'}`,secrets:[]};
 }
 bond(a,b){return this.s.relations[[a,b].sort().join('|')]||{friend:0,love:0,label:'相识'};}
 related(a,b){const ancestors=id=>{const set=new Set(),walk=(who,depth)=>{if(depth>4)return;for(const parent of this.npc(who)?.parents||[])if(!set.has(parent)){set.add(parent);walk(parent,depth+1);}};walk(id,0);return set;};const aa=ancestors(a),bb=ancestors(b);return aa.has(b)||bb.has(a)||[...aa].some(x=>bb.has(x));}
 changeBond(a,b,d,love=0,label){let k=[a,b].sort().join('|'),v=this.bond(a,b);this.s.relations[k]={friend:this.clamp(v.friend+d,-100,100),love:this.clamp(v.love+love,0,100),label:label||v.label};}
 record(p,text){if(!p)return;p.recent=[{turn:this.s.turn,text},...(p.recent||[])].slice(0,8);}
 clamp(n,a=0,b=100){return Math.min(b,Math.max(a,n));}
 changeNPC(p,field,delta){if(p){p[field]=this.clamp((p[field]||0)+delta,field==='friend'?-100:0,100);return `${p.name}${{friend:'好感',love:'爱情',loyalty:'忠诚'}[field]||field} ${delta>=0?'+':''}${delta}`;}return '';}
 spend(cost,phase='court',points=1){
  if(this.s.lost)return {ok:false,message:'本局结束，请读档或重开。'};
  if(this.s.phase!==phase)return {ok:false,message:phase==='court'?'请上朝后处理。':'请下朝后处理。'};
  const ap=phase==='court'?'courtAP':'privateAP';
  if(this.s[ap]<points)return {ok:false,message:phase==='court'?'上朝行动用完，请下朝。':'下朝行动用完，请就寝。'};
  for(const [k,v] of Object.entries(cost)){if(this.s[k]<v)return {ok:false,message:`${{money:'国库',grain:'粮食',wood:'木材',iron:'铁矿',horses:'战马'}[k]||k}不足，尚需 ${Math.ceil(v-this.s[k])}。`};}
  for(const [k,v] of Object.entries(cost))this.s[k]-=v;this.s[ap]-=points;return {ok:true};
 }
 finish(message,type='action',who=null){this.log(message,type,who);return {ok:true,message};}
 applyEffects(e,story){
  const effects=[];const actor=this.npc(story?.actors?.[e.actor||0]);
  const labels={money:'国库',grain:'粮食',wood:'木材',iron:'铁矿',horses:'战马',stability:'稳定',literature:'文',military:'武',art:'艺',intel:'情报能力',morale:'士气'};
  for(const [k,v] of Object.entries(e)){
   if(['actor','clan','clanDelta','bond'].includes(k))continue;
   if(['friend','loyalty','love'].includes(k)){effects.push(this.changeNPC(actor,k,v));continue;}
   if(k==='evidence'){let c=this.s.cases.find(c=>!c.closed);if(c){c.evidence=this.clamp(c.evidence+v,0,3);effects.push(`${c.title}证据 +${v}`);}continue;}
   if(['literature','military','art'].includes(k)){this.s.player[k]+=v;effects.push(`${labels[k]} +${v}`);continue;}
   if(k in this.s&&typeof this.s[k]==='number'){this.s[k]=Math.max(0,this.s[k]+v);if(['stability','intel','morale'].includes(k))this.s[k]=this.clamp(this.s[k]);effects.push(`${labels[k]||k} ${v>=0?'+':''}${v}`);}
  }
  if(e.clanDelta){const c=this.s.clans.find(c=>c.id===(e.clan||actor?.clan));if(c){c.attitude=this.clamp(c.attitude+e.clanDelta);effects.push(`${c.id}氏支持 ${e.clanDelta>=0?'+':''}${e.clanDelta}`);}}
  if(e.bond&&story?.actors?.length>1){this.changeBond(story.actors[0],story.actors[1],e.bond);effects.push(`${this.npc(story.actors[0])?.name}与${this.npc(story.actors[1])?.name}交情 ${e.bond>0?'+':''}${e.bond}`);}
  return effects.filter(Boolean).join('；');
 }
 startStory(defId){
  const def=STORY_DEFS.find(d=>d.id===defId);if(!def)return;
  let actors=def.actors||[];
  if(!actors.length){let pool=this.adults().filter(p=>p.id!=='jiang'&&p.id!=='xie');
   if(['marriage','oldlove'].includes(def.id))pool=pool.filter(p=>!p.consort&&(!p.spouse||this.npc(p.spouse)?.dead));
   let pairs=[];for(const a of pool)for(const b of pool)if(a.id!==b.id&&(['marriage','oldlove'].includes(def.id)?!this.related(a.id,b.id):def.id==='inheritance'?(a.parents?.length&&b.parents?.some(id=>a.parents.includes(id))):true))pairs.push([a.id,b.id]);
   if(!pairs.length)return;actors=this.pick(pairs);
  }
  const story={id:'s'+(++this.s.uid),def:def.id,title:def.title,type:def.type,actors:[...actors],stage:0,due:this.s.turn,status:'active',history:[],stance:this.int(0,1)};
  if(def.id==='diplomatic'){story.country=this.pick(this.s.countries.filter(c=>!c.war))?.id;}
  this.s.stories.push(story);return story;
 }
 storyLength(story){return (story.stages||STORY_DEFS.find(d=>d.id===story.def)?.stages||[]).length;}
 storyText(story){const row=(story.stages||STORY_DEFS.find(d=>d.id===story.def)?.stages||[])[story.stage];if(!row)return null;return row.map((v,i)=>i<3&&typeof v==='string'?v.replaceAll('{A}',this.npc(story.actors[0])?.name||'故人').replaceAll('{B}',this.npc(story.actors[1])?.name||'旧识'):v);}
 readyStories(type){return this.s.stories.filter(s=>s.status==='active'&&s.due<=this.s.turn&&(!type||(type==='策'?['国政','朝局'].includes(s.type):!['国政','朝局'].includes(s.type)))).sort((a,b)=>Number(['paycrisis','paymutiny'].includes(b.def))-Number(['paycrisis','paymutiny'].includes(a.def)));}
 readyIncidents(){return this.s.pending.filter(i=>i&&i.kind==='incident'&&!i.resolved).sort((a,b)=>a.created-b.created);}
 incidentOffer(){
  if(this.readyIncidents().length>=2)return null;
  const active=new Set(this.readyIncidents().map(i=>i.def)),pool=COURT_INCIDENT_DEFS.filter(d=>!active.has(d.id));if(!pool.length)return null;
  const def=this.pick(pool),regions=this.s.regions.filter(r=>r.owner==='liang'),region=regions.length?this.pick(regions):null,countries=this.s.countries.filter(c=>!c.war),country=countries.length?this.pick(countries):null;
  const officials=this.adults().filter(p=>p.office&&p.office!=='候补官员'&&!p.consort),official=officials.length?this.pick(officials):this.npc('xu');
  const event={id:'i'+(++this.s.uid),kind:'incident',def:def.id,category:def.category,title:def.title,text:def.text.replaceAll('{R}',region?.name||'一处州府').replaceAll('{C}',country?.name||'邻国').replaceAll('{A}',official?.name||'一名主官'),choices:JSON.parse(JSON.stringify(def.choices)),created:this.s.turn,expires:this.s.turn+2,resolved:false,targetRegion:region?.id||null,targetCountry:country?.id||null,targetNpc:official?.id||null};
  this.s.pending.push(event);this.log(`急报：“${event.title}”。剩2个月，请及时处理。`,'warning',event.targetNpc||null);return event;
 }
 incidentResolve(id,choice){
  const event=this.s.pending.find(i=>i&&i.id===id&&i.kind==='incident'&&!i.resolved),option=event?.choices?.[choice];if(!event||!option||this.s.phase!=='court')return {ok:false,message:'这份急报已经处理，或须在上朝时处置。'};
  const e=option.effects||{},cost=Object.fromEntries(Object.entries(e).filter(([k,v])=>['money','grain','wood','iron','horses'].includes(k)&&v<0).map(([k,v])=>[k,-v])),check=this.spend(cost);if(!check.ok)return check;
  const region=this.region(event.targetRegion),country=this.s.countries.find(c=>c.id===event.targetCountry),person=this.npc(event.targetNpc),labels={money:'银',grain:'粮',wood:'木',iron:'铁',horses:'马',stability:'稳定',morale:'士气',intel:'情报'};
  const details=[];for(const [k,v] of Object.entries(e)){
   if(['money','grain','wood','iron','horses'].includes(k)){if(v>0)this.s[k]+=v;continue;}
   if(k==='populationRate'&&region){region.population=Math.max(2000,Math.floor(region.population*(1+v/100)));details.push(`${region.name}人口 ${v>=0?'+':''}${v}%`);continue;}
   if(k==='population'&&region){region.population=Math.max(2000,region.population+v);details.push(`${region.name}人口 ${v>=0?'+':''}${v}`);continue;}
   if(k==='loyalty'&&region){region.loyalty=this.clamp(region.loyalty+v);details.push(`${region.name}民心 ${v>=0?'+':''}${v}`);continue;}
   if(k==='prosperity'&&region){region.prosperity=this.clamp(region.prosperity+v);details.push(`${region.name}繁荣 ${v>=0?'+':''}${v}`);continue;}
   if(k==='relation'&&country){country.relation=this.clamp(country.relation+v,-100,100);details.push(`${country.name}关系 ${v>=0?'+':''}${v}`);continue;}
   if(k==='friend'&&person){this.changeNPC(person,'friend',v);details.push(`${person.name}好感 ${v>=0?'+':''}${v}`);continue;}
   if(k==='loyalty'&&person){this.changeNPC(person,'loyalty',v);details.push(`${person.name}忠诚 ${v>=0?'+':''}${v}`);continue;}
   if(k==='clanDelta'&&person){const clan=this.s.clans.find(c=>c.id===person.clan);if(clan){clan.attitude=this.clamp(clan.attitude+v);details.push(`${clan.id}氏支持 ${v>=0?'+':''}${v}`);}continue;}
   if(k==='evidence'){let ca=this.s.cases.find(c=>!c.closed);if(ca){ca.evidence=this.clamp(ca.evidence+v,0,3);details.push(`${ca.title}证据 +${v}`);}continue;}
   if(k in this.s&&typeof this.s[k]==='number'){this.s[k]=['stability','morale','intel'].includes(k)?this.clamp(this.s[k]+v):Math.max(0,this.s[k]+v);details.push(`${labels[k]||k} ${v>=0?'+':''}${v}`);}
  }
  event.resolved=true;event.choice=choice;event.resolvedTurn=this.s.turn;const spent=Object.entries(cost).map(([k,v])=>`${labels[k]||k} -${v}`).join('、');return this.finish(`处理急报“${event.title}”：${option.label}。${spent?spent+'；':''}${details.join('；')||'局势暂时稳住'}。`,'warning',event.targetNpc||null);
 }
 incidentExpire(){for(const event of this.s.pending.filter(i=>i&&i.kind==='incident'&&!i.resolved&&i.expires<=this.s.turn)){event.resolved=true;event.expired=true;const r=this.region(event.targetRegion);if(r){r.loyalty=this.clamp(r.loyalty-3);r.prosperity=this.clamp(r.prosperity-2);}this.s.stability=this.clamp(this.s.stability-1);this.log(`急报“${event.title}”逾期未处理，${r?r.name+'民心 -3、繁荣 -2，':''}稳定 -1。`,'warning',event.targetNpc||null);}}
 decide(id,choice){
  const story=this.s.stories.find(s=>s.id===id);if(!story||story.status!=='active'||story.due>this.s.turn||![0,1].includes(choice))return {ok:false,message:'这件事已处理，或尚未到下一阶段。'};
  const row=this.storyText(story),e=row[3+choice];const check=this.spend(Object.fromEntries(Object.entries(e).filter(([k,v])=>['money','grain','wood','iron','horses'].includes(k)&&v<0).map(([k,v])=>[k,-v])));if(!check.ok)return check;
  // Costs were paid by spend; apply only positive or non-resource effects.
  const applied=Object.fromEntries(Object.entries(e).filter(([k,v])=>!(['money','grain','wood','iron','horses'].includes(k)&&v<0)));
  let result=this.applyEffects(applied,story);const costs=Object.entries(e).filter(([k,v])=>['money','grain','wood','iron','horses'].includes(k)&&v<0).map(([k,v])=>`${{money:'国库',grain:'粮食',wood:'木材',iron:'铁矿',horses:'战马'}[k]} ${v}`);
  result=[...costs,result].filter(Boolean).join('；');
  const supporters=this.storyStances(story);supporters.forEach(({p,side})=>{const d=side===choice?3:-3;this.changeNPC(p,'friend',d);this.changeNPC(p,'loyalty',d>0?1:-1);});
  if(story.country){const co=this.s.countries.find(c=>c.id===story.country);if(co){const d=choice===0?10:-8;co.relation=this.clamp(co.relation+d,-100,100);result+=`；${co.name}关系 ${d>=0?'+':''}${d}`;}}
  story.history.push({turn:this.s.turn,choice:row[1+choice],result});story.lastChoice=choice;story.stage++;story.due=this.s.turn+(story.def==='oldlove'?3:2);if(story.stage>=this.storyLength(story)){story.status='complete';this.s.history.unshift({turn:this.s.turn,title:story.title,text:'故事告一段落，相关关系和经营结果已保留。'});}
  this.s.resolved.push(id+':'+(story.stage-1));
  const other=this.s.stories.find(s=>s.id!==id&&s.status==='active'&&s.actors.some(a=>story.actors.includes(a)));
  if(other&&story.stage===2){other.due=Math.max(this.s.turn+1,other.due-1);this.log(`“${story.title}”的消息传到了“${other.title}”的当事人那里，下次会面提前了。`,'story');}
  return this.finish(`【${story.title}】你决定：${row[1+choice]}。${result}。${supporters.map(({p,side})=>p.name+(side===choice?'赞同，好感 +3、忠诚 +1':'不赞同，好感 -3、忠诚 -1')).join('；')}。`,'action',story.actors[0]);
 }
 storyStances(story){return [this.npc(story.actors[0])||this.npc('xu'),this.npc(story.actors[1])||this.npc('ye')].map((p,i)=>({p,side:(story.stance+i+(p.friend>60?0:1))%2}));}
 output(r){
  if(r.owner!=='liang')return {grain:0,money:0,wood:0,iron:0,horses:0};
  const b=r.buildings,worker=Math.min(1,r.population/22000),loyal=.45+r.loyalty/180,admin=this.npc(r.governor)?.admin||40;
  const gov=this.npc(r.governor),clan=this.s.clans.find(c=>c.id===gov?.clan),cooperation=.8+(gov?.loyalty||40)/500+(clan?.attitude||50)/1000;
  const eff=worker*loyal*(.75+admin/200)*cooperation,trade=this.s.countries.filter(c=>c.trade&&!c.war).length;
  return {grain:Math.floor(b.farm*480*eff),money:Math.floor((r.population/500+b.market*130)*this.s.tax/12*eff*(1+trade*.06)),wood:Math.floor(b.mine*35*eff),iron:Math.floor(b.mine*18*eff),horses:Math.floor(b.pasture*8*eff)};
 }
 budget(){
  const totals={money:0,grain:0,wood:0,iron:0,horses:0};for(const r of this.s.regions){const o=this.output(r);for(const k in totals)totals[k]+=o[k];}
  const population=this.s.regions.filter(r=>r.owner==='liang').reduce((a,r)=>a+r.population,0);
  const army=Math.floor(this.s.soldiers*.13),civil=170+Object.keys(this.s.offices).length*8,palace=80+this.s.people.filter(p=>p.consort&&!p.dead).length*35,projects=this.s.builds.length*45;
  const upkeep=army+civil+palace+projects,food=Math.ceil(population/160+this.s.soldiers*.25),trade=this.s.countries.filter(c=>c.trade&&!c.war).reduce((a,c)=>a+Math.floor(c.prosperity*1.3),0);
  const finance=this.npc(this.s.offices['户部尚书']),collection=.75+(finance?.admin||0)/400;const income=Math.floor(totals.money*collection)+trade;
  return {income,upkeep,net:income-upkeep,grain:totals.grain,food,grainNet:totals.grain-food,wood:totals.wood,iron:totals.iron,horses:totals.horses,population,army,civil,palace,projects,trade};
 }
 tax(rate){if(![8,12,18].includes(rate))return {ok:false,message:'税率无效。'};const c=this.spend({});if(!c.ok)return c;const delta=rate-this.s.tax;this.s.tax=rate;let d=delta>0?-4:delta<0?4:0;for(const r of this.s.regions)if(r.owner==='liang')r.loyalty=this.clamp(r.loyalty+d);this.s.stability=this.clamp(this.s.stability+d);return this.finish(`税率定为 ${rate}%。${d<0?'加税能缓一时之急，各州民心 -4、稳定 -4，长期还会抑制人口。':d>0?'百姓松了口气，各州民心 +4、稳定 +4，国库收入相应减少。':'税率不变。'}`);}
 aid(id){const r=this.region(id);if(!r||r.owner!=='liang')return {ok:false,message:'请选择本国州府。'};const c=this.spend({money:180,grain:220});if(!c.ok)return c;r.loyalty=this.clamp(r.loyalty+10);r.population+=240;this.s.stability=this.clamp(this.s.stability+3);return this.finish(`向${r.name}拨银 180、粮 220。民心 +10，流民落户 +240，稳定 +3。`);}
 build(id,key){const r=this.region(id),d=BUILDINGS[key];if(!r||r.owner!=='liang'||!d)return {ok:false,message:'请选择本国州府和有效建筑。'};
  if(this.s.built)return {ok:false,message:'本月已开工，下月再建。'};if(key==='palace'&&!r.capital)return {ok:false,message:'后宫只能建在京城。'};
  if(this.s.builds.some(b=>b.region===id&&b.key===key))return {ok:false,message:'这项工程还没完工。'};
  const level=r.buildings[key];if(level>=5)return {ok:false,message:'建筑已到五级。'};
  const factor=1+level*.7,cost={money:Math.ceil(d.money*factor),wood:Math.ceil(d.wood*factor),iron:Math.ceil(d.iron*factor)};
  const c=this.spend(cost);if(!c.ok)return c;const duration=level+1;this.s.built=true;this.s.builds.push({id:++this.s.uid,region:id,key,level:level+1,total:duration,remaining:duration});
  return this.finish(`${r.name}开工修建${d.name} ${level+1}级。银 -${cost.money}、木 -${cost.wood}、铁 -${cost.iron}，工期 ${duration}个月；完工后才增加产出。`);
 }
 train(){if(this.s.trained)return {ok:false,message:'本月已练兵，下月再训。'};const c=this.spend({money:140,grain:180});if(!c.ok)return c;let bonus=this.int(4,10)+Math.floor((this.npc(this.s.offices['兵部尚书'])?.military||40)/25);let before=this.s.training;this.s.training=this.clamp(before+bonus);this.s.morale=this.clamp(this.s.morale+3);this.s.trained=true;return this.finish(`校场练兵，银 -140、粮 -180。训练 +${this.s.training-before}，士气 +3。含兵部尚书加成。`);}
 recruit(){const c=this.spend({money:240,grain:300});if(!c.ok)return c;const pool=this.s.regions.filter(r=>r.owner==='liang'&&r.population>5000);if(!pool.length){this.s.money+=240;this.s.grain+=300;this.s.courtAP++;return {ok:false,message:'地方已无足够人口可征募。'};}let r=this.pick(pool);r.population-=300;this.s.soldiers+=300;this.s.training=Math.floor(this.s.training*.91);return this.finish(`${r.name}征募 300人，银 -240、粮 -300，地方人口 -300。新兵降低训练，每月多耗钱粮。`);}
 forge(){const c=this.spend({money:120,iron:40,wood:30});if(!c.ok)return c;this.s.weapons+=300;return this.finish('锻造武器 300套，银 -120、铁 -40、木 -30。武器不足会削弱实际战力。');}
 combat(){return Math.floor(this.s.soldiers*(.35+this.s.training/100)*(.4+this.s.morale/120)*Math.min(1,this.s.weapons/Math.max(1,this.s.soldiers))*(1+Math.min(.25,this.s.horses/Math.max(1,this.s.soldiers))));}
 appoint(office,id){const p=this.npc(id);if(!p||p.dead||p.age<18||!OFFICE_DEFS.some(x=>x[0]===office))return {ok:false,message:'此人无法任职。'};if(p.consort)return {ok:false,message:'后宫成员不能任官。'};
  const old=this.npc(this.s.offices[office]);if(old?.id===id)return {ok:false,message:'此人已任该职。'};const c=this.spend({money:30});if(!c.ok)return c;
  const previous=Object.entries(this.s.offices).filter(([k,v])=>v===id);previous.forEach(([k])=>delete this.s.offices[k]);this.s.offices[office]=id;p.office=office;let result=this.changeNPC(p,'friend',5)+'、'+this.changeNPC(p,'loyalty',4);
  if(old){if(!Object.values(this.s.offices).includes(old.id))old.office='候补官员';result+='；'+this.changeNPC(old,'friend',-10)+'、'+this.changeNPC(old,'loyalty',-6);this.s.clans.filter(cl=>cl.id===old.clan).forEach(cl=>cl.attitude=this.clamp(cl.attitude-4));}
  for(const friend of this.adults().filter(q=>old&&q.id!==old.id&&this.bond(q.id,old.id).friend>25)){this.changeNPC(friend,'friend',-2);result+=`；${friend.name}好感 -2`;}
  this.record(p,`奉旨就任${office}。`);return this.finish(`任${p.name}为${office}，调任文书银 -30。${result}。${previous.length?'原职'+previous.map(x=>x[0]).join('、')+'已空缺，待补任。':''}`,'action',id);
 }
 governor(region,id){const r=this.region(region),p=this.npc(id);if(!r||!p||p.age<18||p.dead||p.consort||r.owner!=='liang')return {ok:false,message:'此项任命无效。'};if(r.governor===id)return {ok:false,message:'此人已在任。'};const c=this.spend({money:40});if(!c.ok)return c;const old=this.npc(r.governor);r.governor=id;this.changeNPC(p,'friend',4);this.changeNPC(p,'loyalty',3);if(old){this.changeNPC(old,'friend',-6);this.changeNPC(old,'loyalty',-3);}return this.finish(`任${p.name}掌${r.name}，银 -40，新任好感 +4、忠诚 +3${old?`；${old.name}好感 -6、忠诚 -3`:''}。州府产出随新任治理能力变化。`);}
 newCase(title,suspect,evidence=0){this.s.cases.push({id:'c'+(++this.s.uid),title,suspect,evidence,closed:false,source:this.pick(['东厂','西厂','都察院']),created:this.s.turn});}
 caseAction(id,kind){const ca=this.s.cases.find(c=>c.id===id);if(!ca||ca.closed)return {ok:false,message:'此案已结。'};if(!['investigate','protect','punish'].includes(kind))return {ok:false,message:'无效的案件处置。'};
  if(kind==='investigate'&&ca.investigation)return {ok:false,message:'调查中，下月由刑部尚书汇报。'};
  if(kind==='investigate'&&ca.evidence>=3)return {ok:false,message:'证据已齐，可处理。'};
  const p=this.npc(ca.suspect);const c=this.spend(kind==='investigate'?{money:100}:{});if(!c.ok)return c;
  if(kind==='investigate'){ca.investigation={due:this.s.turn+1,gain:this.s.intel>65?2:1};this.record(p,'因案卷疑点接受核查，尚未定罪。');return this.finish(`已派人调查“${ca.title}”，银 -100、上朝行动 -1。下回上朝由刑部尚书呈报结果，现有证据仍为 ${ca.evidence}/3。`);}
  delete ca.investigation;
  if(kind==='protect'){ca.closed=true;this.changeNPC(p,'friend',12);this.changeNPC(p,'loyalty',5);this.changeNPC(this.npc('pei'),'friend',-8);this.s.stability=this.clamp(this.s.stability-5);this.s.clans.filter(cl=>cl.id===p.clan).forEach(cl=>cl.attitude=this.clamp(cl.attitude+6));return this.finish(`你压下“${ca.title}”。${p.name}好感 +12、忠诚 +5，${p.clan}氏支持 +6；裴照微好感 -8，稳定 -5。`);}
  if(kind==='punish'){ca.closed=true;let fair=ca.evidence>=2;this.s.money+=fair?360:100;this.s.stability=this.clamp(this.s.stability+(fair?4:-9));this.changeNPC(p,'friend',fair?-14:-24);this.changeNPC(p,'loyalty',fair?-5:-15);this.record(p,fair?'因证据确凿被罚俸追赃。':'在证据不足时被问罪，向亲友诉说冤情。');for(const q of this.adults().filter(q=>q.clan===p.clan&&q.id!==p.id)){this.changeNPC(q,'friend',fair?-3:-7);}return this.finish(`“${ca.title}”判罚追赃，国库 +${fair?360:100}。${p.name}好感 ${fair?-14:-24}、忠诚 ${fair?-5:-15}，同族好感各 ${fair?-3:-7}；稳定 ${fair?'+4':'-9（证据不足）'}。`);}
  return {ok:false,message:'无效处置。'};
 }
 diplomacy(id,kind){const country=this.s.countries.find(c=>c.id===id);if(!country)return {ok:false,message:'请选择国家。'};
  if(kind==='war'){
   if(country.war||this.s.war)return {ok:false,message:'已有战事，先解决眼前的战争。'};
   const c=this.spend({money:600,grain:900});if(!c.ok)return c;country.war=true;country.trade=false;country.relation=-90;this.s.war={country:id,remaining:3,our:0,their:0};this.s.stability=this.clamp(this.s.stability-5);return this.finish(`向${country.name}宣战。银 -600、粮 -900，稳定 -5，关系降至 -90；此后三个月每月耗银 220、粮 350，并按双方实力结算战损。`);
  }
  if(kind==='trade'&&(country.trade||country.war||country.relation<15))return {ok:false,message:country.trade?'双方已有商约。':'贸易需关系≥15，且未交战。'};
  if(kind==='peace'&&!country.war)return {ok:false,message:'两国当前没有交战。'};
  if(kind==='alliance'&&(country.relation<50||country.alliance))return {ok:false,message:country.alliance?'双方已有盟约。':'结盟需关系≥50。'};
  const costs={gift:180,trade:260,alliance:400,peace:500},cost=costs[kind];if(!cost)return {ok:false,message:'无效外交行动。'};const c=this.spend({money:cost});if(!c.ok)return c;
  if(kind==='gift'){country.relation=this.clamp(country.relation+18,-100,100);return this.finish(`向${country.name}派使者交好，银 -180、关系 +18。当前关系 ${country.relation}。`);}
  if(kind==='trade'){country.trade=true;return this.finish(`与${country.name}签署商约，银 -260。下月开始增加关税并进口${{horses:'战马',wood:'木材',grain:'粮食',iron:'铁矿'}[country.resource]}。交战或关系恶化会中断商路。`);}
  if(kind==='alliance'){country.alliance=true;country.relation=this.clamp(country.relation+10,-100,100);return this.finish(`与${country.name}结盟，银 -400、关系 +10。盟友减少边境摩擦，并提供战场支援。`);}
  country.war=false;country.relation=-15;this.s.war=null;return this.finish(`与${country.name}议和，银 -500。撤军止损，关系回到 -15；`);
 }
 exploreTile(x,y){if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||x>=WORLD_MAP.cols||y<0||y>=WORLD_MAP.rows)return {ok:false,message:'这片疆域尚不能开发。'};if(this.s.regions.some(r=>r.x===x&&r.y===y))return {ok:false,message:'此地已经设府。'};
  if(!this.s.regions.some(r=>r.owner==='liang'&&Math.abs(r.x-x)+Math.abs(r.y-y)===1))return {ok:false,message:'只能开拓相邻荒地。'};
  const c=this.spend({money:500,grain:400,wood:80});if(!c.ok)return c;const r={id:'r'+(++this.s.uid),x,y,name:this.pick(['云','栖','怀','松','定','安'])+this.pick(['川','州','宁','原','陵']),tag:'新垦',owner:'liang',population:8000,loyalty:45,prosperity:20,garrison:100,governor:'shen',buildings:{farm:0,market:0,mine:0,pasture:0,homes:0,palace:0}};this.s.regions.push(r);return this.finish(`开拓${r.name}，银 -500、粮 -400、木 -80。八千流民入籍；尚无产出，须先建设农田和居民地。`);
 }
 examOffer(){const ids=[];for(let i=0;i<6;i++){let p=this.generateNPC();p.office='应试举子';this.s.people.push(p);ids.push(p.id);}this.s.exam={year:Math.floor(this.s.turn/12)+1,ids,chosen:[],closed:false};}
 examCost(){return this.s.flags.examRecruited?60:0;}
 examChoose(id){const ex=this.s.exam;if(!ex||ex.closed||!ex.ids.includes(id)||ex.chosen.includes(id)||ex.chosen.length>=3)return {ok:false,message:'本届最多录取三人。'};const cost=this.examCost(),c=this.spend({money:cost});if(!c.ok)return c;ex.chosen.push(id);this.s.flags.examRecruited=true;this.npc(id).office='新科进士';this.changeNPC(this.npc(id),'loyalty',15);this.s.stability=this.clamp(this.s.stability+1);if(ex.chosen.length===3)ex.closed=true;return this.finish(`录取${this.npc(id).name}为新科进士，${cost?'银 -60':'首次录取免银两'}、上朝行动 -1，此人忠诚 +15，稳定 +1。本届已取 ${ex.chosen.length}/3，可在吏部任用。`);}
 selectionOffer(){
  const waiting=this.s.people.filter(p=>p.location==='掖庭'&&!p.consort&&!p.dead).length;
  const room=Math.max(0,this.capacity()-this.s.people.filter(p=>p.consort&&!p.dead).length);
  const count=Math.min(7,Math.max(0,15-waiting)),ids=[];
  const ranks=['清流世家嫡支','勋贵旁支','商籍新贵','边军人家','寒门秀户','地方官宦'];
  const looks=['眉眼清秀，笑起来有一点拘谨','神情明快，站在人群里很容易认出来','眉峰利落，说话时总先看旁人的脸色','肤色偏深，常年骑马留下了风吹日晒的痕迹','举止安静，手指上有常年抄书留下的薄茧','衣着素净，但把每一处针脚都理得很平'];
  const talents=['善理家账，能看懂盐引与商契','熟悉琴棋书画，落笔很有自己的章法','懂骑射和马政，谈起边地时眼睛会亮','擅长照料花木，也记得住宫中人情','读过不少经史，答话稳妥，不爱抢风头','会做小食和香囊，手艺在族中很有名'];
  for(let i=0;i<count;i++){let p=this.generateNPC();p.age=this.int(18,25);p.office='选秀候选';p.art=this.int(55,95);p.location='掖庭';p.selectionNote={rank:this.pick(ranks),appearance:this.pick(looks),talent:this.pick(talents),virtue:this.pick(['谨慎','直爽','温和','要强','寡言','爱操心']),familyAsk:this.pick(['家里只求平安，不求显贵','族中希望借此稳住一门亲事','父兄叮嘱进宫后少说家事','来之前已写好三封家信，怕忘了寄出'])};p.bio=`${p.bio||''} 此次入选${p.selectionNote.rank}候选，${p.selectionNote.appearance}。${p.selectionNote.talent}。${p.selectionNote.familyAsk}。`;this.s.people.push(p);ids.push(p.id);}
  this.s.selection={year:Math.floor(this.s.turn/12)+1,ids,chosen:[],rejected:[],maxChoices:room,closed:room===0||count===0};
 }
 capacity(){return 5+this.s.regions.filter(r=>r.capital).reduce((a,r)=>a+r.buildings.palace*2,0);}
 selectionChoose(id){const sel=this.s.selection,p=this.npc(id);if(!sel||sel.closed||!sel.ids.includes(id)||sel.chosen.includes(id)||sel.rejected?.includes(id)||!p||p.age<18)return {ok:false,message:sel?.closed?'选秀已结束，未选者留在掖庭。':'此人不在本届名册。'};
  const occupied=this.s.people.filter(p=>p.consort&&!p.dead).length;if(occupied>=this.capacity()||sel.chosen.length>=sel.maxChoices)return {ok:false,message:'本届名额已满，未选者留在掖庭。'};
  const c=this.spend({money:100});if(!c.ok)return c;sel.chosen.push(id);p.consort=true;p.office='才人';
  const rooms=Array.from({length:Math.max(1,(this.capacity()-1)/2)},(_,i)=>'偏殿'+(i+1));const room=rooms.find(room=>this.s.people.filter(q=>q.room===room&&!q.dead).length<2)||rooms[rooms.length-1];p.room=room;p.location=room;p.recent=[{turn:this.s.turn,text:`在选秀中被册为才人，入住${room}。`},...(p.recent||[])].slice(0,8);this.changeNPC(p,'friend',5);if(sel.chosen.length>=sel.maxChoices)sel.closed=true;return this.finish(`${p.name}册为才人，入住${p.room}，银 -100、上朝行动 -1、好感 +5，爱情仍为 ${p.love}。${sel.closed?'本届可用宫位已满，选秀暂告一段落。':''}宫中入住 ${this.s.people.filter(p=>p.consort&&!p.dead).length}/${this.capacity()}。`);}
 selectionDismiss(id){const sel=this.s.selection,p=this.npc(id);if(!sel||!sel.ids.includes(id)||sel.chosen.includes(id)||sel.rejected?.includes(id)||!p||p.dead)return {ok:false,message:'此人不在候选名单。'};const c=this.spend({},'court');if(!c.ok)return c;sel.rejected=sel.rejected||[];sel.rejected.push(id);p.location='原籍';p.office='落选归家';p.recent=[{turn:this.s.turn,text:'选秀落选，已回原籍。'},...(p.recent||[])].slice(0,8);if(sel.rejected.length+sel.chosen.length>=sel.ids.length)sel.closed=true;return this.finish(`准${p.name}落选归家，保留其家世与人际往来；本次选秀不再考虑此人。`,'action',id);}
 selectionClose(){const sel=this.s.selection;if(!sel||sel.closed)return {ok:false,message:'本届选秀已结束。'};sel.closed=true;const left=sel.ids.filter(id=>!sel.chosen.includes(id)&&!sel.rejected?.includes(id)).length;return this.finish(`本届选秀结束。${left?`余下${left}人暂留掖庭，最多容纳十五人；以后可在后宫继续查看。`:'候选人已全部安置。'}`,'action');}
 dismissConsort(id){const p=this.npc(id);if(!p||!p.consort||p.office==='皇后')return {ok:false,message:'皇后的安排须随叶氏主线处理。'};const c=this.spend({money:160});if(!c.ok)return c;p.consort=false;p.office='出宫归家';p.room=null;this.changeNPC(p,'friend',-12);return this.finish(`准${p.name}出宫，安置银 -160，好感 -12，空出一处居所。`);}
 relationGroup(p){return p.love>=20?'暧昧':p.friend>=35?'好友':p.friend<=-40?'厌恶':p.friend<0?'疏远':'普通';}
 dialogueTier(p){
  if((p.chatCount||0)===0&&p.friend>-20)return '初遇';
  if(p.friend<=-80)return '恩断义绝';
  if(p.friend<=-60)return '关系极差';
  if(p.friend<=-40)return '关系特别差';
  if(p.friend<=-20)return '关系较差';
  if(p.friend<0)return '失望';
  if(p.love>=85)return '最爱';
  if(p.love>=55)return '暧昧';
  if(p.friend>=80)return '永远的朋友';
  if(p.friend>=55)return '朋友';
  if(p.friend>=30)return '关系上升';
  return '关系一般';
 }
 dialogueSubject(p){return {琴艺:'琴声和花','笔墨':'字和书','经史':'旧书和文章','骑射':'弓马和校场','商道':'铺子和账','弈棋':'棋局和输赢','花草':'花木和时节','小动物':'猫狗和小事'}[p.hobby]||'近日的琐事';}
 npcDialogue(p,tier){
  if(p.id==='ye-jin'){
   const lines={
    '初遇':['臣叫叶锦，家中排行……倒也没什么特别的。平日里喜欢看看书，偶尔练练字，日子过得还算清闲。','陛下今日这身衣裳真好看，颜色也衬人。臣方才便想说了，又怕显得太唐突。','臣在家时，母亲总嫌臣坐不住，明明书还没读完，便惦记着去院子里看花。如今想来，倒真有些孩子气了。','家中兄长性子比臣稳重得多，小时候总爱管着臣。如今倒好，臣进了宫，耳根子总算清静了些。','臣听说御花园的海棠开了，倒有些想去看看。家里也种了几株，每年春日开花时，母亲总要叫人仔细照料。','臣闲时喜欢临帖，不过字写得也算不上多好。兄长总说臣写字太秀气，少了些筋骨，臣倒觉得这样也挺好。','臣从前常听家里人说，京郊的桃花开得极好。可惜每年都赶不上花期，今年倒不知还有没有机会瞧见。','臣一时也不知该说些什么，陛下莫怪。臣平日里话倒不少，只是到了您面前，反倒有些不知所措了。','臣从前便听人说起过陛下，今日亲眼见了，倒觉得传言还是说得少了些。臣没有奉承的意思，是真心觉得陛下很好看。','臣有时也觉得自己性子太慢了些，旁人做一件事的工夫，臣还在想从哪里开始。母亲倒不着急，总说慢些也没什么不好。'],
    '关系一般':['臣今日在院子里待了好一会儿，才发现有株花不知什么时候开了。明明日日都经过，竟没留意到。','臣最近在学画竹子，可总觉得画出来差了些意思。兴许还是练得不够，改日得再试试。','家里的小妹从前总爱跟着臣，臣走到哪里，她便跟到哪里。如今倒好，怕是早就把臣忘了。','臣发现宫里的四季好像比家里过得还快些，才觉得天气暖和，转眼又要入夏了。'],
    '关系上升':['臣前些日子做了个梦，梦见自己还在家里，什么都不用操心。醒来才想起，已经进宫好些日子了。','臣倒觉得，陛下有时也挺有趣的。原先以为您总是那么严肃，熟悉之后才发现不是这样。','今日路过园子时，看见一只小鸟在树枝上跳来跳去，臣站着看了半天。旁人都说臣闲得很，臣倒觉得挺有意思。','臣如今倒是比刚进宫时自在多了，至少不会像最初那样，说句话都要在心里想上好几遍。'],
    '朋友':['今日有件小事，臣第一个想到要告诉您。说来也没什么要紧，只是觉得您会想听。','臣把新曲弹熟了，先给您听。若弹错了，您可别笑臣；若好听，也请您说一声。','臣今日心情不错，想在园子里多走一圈。您若也得空，陪我走一小段便好。'],
    '永远的朋友':['臣知道您有许多事要顾，可您若哪天只想安静坐着，也可以来找臣。臣不会追问。','臣把家里寄来的花种分了一半出来，给您留着。以后每年开花，便都算我们一起养的。','不论旁人怎么说，臣总愿意先听您把话讲完。我们认识这么久，这点信任总该有。'],
    '暧昧':['臣今日换了件新衣，原本没想让谁看见……您若觉得好看，臣便算没有白挑。','您今日见了谁、说了什么，臣本不该多问。可您若一直不说，臣又会忍不住猜。','臣弹琴时总会分心，想着您是不是就在门外。这样下去，琴谱要被臣弹坏了。'],
    '最爱':['臣不求您时时陪着我，只求您忙完以后，心里还记得有个人在等您回头。','您若要去很远的地方，提前告诉臣。臣会担心，但不会拦您；只求您平安回来。','臣这一生能遇见您，已经是最好的运气。旁的得失，忽然都没那么要紧了。'],
    '失望':['臣没生您的气，只是有些话不敢再当真了。等臣想明白，再来同您说。'],
    '关系较差':['臣知道自己不讨您喜欢，今日便不多留。该办的事，臣仍会办好。'],
    '关系特别差':['您若只是想听顺耳话，臣今日恐怕帮不上忙。臣先告退。'],
    '关系极差':['臣不想再解释。您既已认定如此，臣说什么都像是在求情。'],
    '恩断义绝':['从今以后，臣只按规矩办事。旧日那些话，您不必再提，臣也不会再信。']
   };return this.pick(lines[tier]||lines['关系一般']);
  }
  const style=p.personality||'';const subject=this.dialogueSubject(p),name=p.name;
  const warm=style.includes('温')||style.includes('明朗')||style.includes('慷慨'),strict=style.includes('严肃')||style.includes('清正')||style.includes('克制'),witty=style.includes('圆滑')||style.includes('笑里');
  const lines={
   '初遇':warm?[`臣是${name}，初入宫中，若有失礼之处，还请陛下提醒。`,`臣平日爱${subject}，说起来有些琐碎，陛下若不嫌烦，臣可以讲两句。`]:strict?[`臣${name}，见过陛下。臣不善寒暄，但该说的话一定说清。`,`初次见面，臣先把本分做好，不敢让陛下费心。`]:[`臣${name}，见过陛下。臣一时有些紧张，若说得不妥，还请陛下见谅。`,`臣平日喜欢${subject}，除此之外，生活也没什么特别。`],
   '关系一般':[`臣最近常想起${subject}，宫里和家中到底还是不一样。`,`今日有件小事，臣本想过后再说，想想也不是什么秘密，便告诉陛下了。`],
   '关系上升':warm?[`臣近来见到${subject}，总想起要同陛下说一说。`,`臣如今在陛下面前放松多了，连些小心思也敢讲了。`]:strict?[`臣有件事想听陛下的看法，不是公事，只是想知道您会怎么想。`,`臣原先以为人与人相处只看规矩，后来发现信任也要慢慢攒。`]:[`臣今日来，不为公事。只是路过这里，忽然想同陛下坐一会儿。`,`臣发现自己越来越习惯把${subject}说给陛下听。`],
   '朋友':[`臣有话直说，陛下别嫌臣烦。真正的朋友，偶尔说句不中听的，总比一直客气好。`,`若陛下今日不想谈朝事，我们便聊${subject}，总有一件能让人轻松些。`],
   '永远的朋友':[`陛下若有难处，尽管叫臣。臣未必能替您解决，但一定不会先走。`,`这些年看过太多聚散，能把话放心交给一个人，已经很难得。臣愿意一直站在您这边。`],
   '暧昧':witty?[`臣本来只是来送句话，见到陛下以后，倒把原先要说的忘了。`,`陛下若再这样看臣，臣可要误会了。`]:[`臣明知不该在意，却还是会留意陛下今日见了谁。`,`臣有时觉得，自己等的不是召见，只是想见陛下一面。`],
   '最爱':[`臣不敢说能替陛下挡住所有风雨，但您回头时，臣一定还在。`,`臣最安心的时候，不是事情都办妥，而是知道陛下愿意把真话告诉臣。`],
   '失望':[`臣原先以为，至少我们之间可以说真话。如今看来，是臣想多了。`,`臣会把该做的事做好。至于私下的话，往后少说便是。`],
   '关系较差':strict?[`臣领命。若无别的事，臣先退下。`,`臣知道陛下对臣有疑虑，臣会用结果说话。`]:[`臣今日不想争辩。您若有吩咐，直说便是。`,`臣也有自尊，不能每次都装作没听见那些话。`],
   '关系特别差':[`臣来这里只为办事，不为讨好。请陛下把吩咐说完。`,`您不信臣，臣明白。只是别把没有做过的事也算在臣头上。`],
   '关系极差':[`臣不求您喜欢，只求您别再随意定我的罪。`,`既然彼此都不痛快，往后照章办事，少见为好。`],
   '恩断义绝':[`从今以后，臣与陛下只有君臣公事。旧情旧话，一笔勾销。`,`臣不会再来求见，也不会再把真心交出去。陛下保重。`]
  };return this.pick(lines[tier]||lines['关系一般']);
 }
 interact(id,kind){const p=this.npc(id);if(!p||p.dead)return {ok:false,message:'此人无法召见。'};
  if(['flirt','sleep'].includes(kind)&&this.related(id,this.s.player.id))return {ok:false,message:'亲族之间只有日常关怀与教养互动。'};
  if(['flirt','sleep'].includes(kind)&&(p.age<18||this.s.player.age<18))return {ok:false,message:'未成年人只有关心、教育等日常互动。'};
  if(['flirt','sleep'].includes(kind)&&p.spouse&&this.npc(p.spouse)&&!this.npc(p.spouse).dead)return {ok:false,message:'对方已婚，不接受邀约。'};
  if(kind==='flirt'&&p.friend<(p.romanceGate||25))return {ok:false,message:`${p.name}与您还不够亲近（好感需达到 ${p.romanceGate||25}）。`};
  if(kind==='sleep'&&(!p.consort||p.friend<40||p.love<25))return {ok:false,message:'需要宫中名位、好感至少 40、爱情至少 25，双方才愿意共度良宵。'};
  const k=id+':'+kind;if(this.s.acted[k])return {ok:false,message:'本月已做过，换个互动吧。'};
  const c=this.spend({},'private');if(!c.ok)return c;this.s.acted[k]=true;
  let text='',effects=[];
  if(kind==='chat'){
   const tier=this.dialogueTier(p);text=this.npcDialogue(p,tier);p.chatCount=(p.chatCount||0)+1;
   effects.push(this.changeNPC(p,'friend',5));
    }else if(kind==='care'){text=p.id==='xie'?'他本要说“不妨事”，见你没有收回药盒，才低低道：“谢陛下。”':p.id==='jiang'?'“不必……”他话到一半，看了眼你叫人添的软垫，终于没再说下去。':'他原本说自己没事，听你再问了一句，才把攥了半天的心事慢慢说出来。';effects.push(this.changeNPC(p,'friend',7));p.health=this.clamp((p.health||90)+4);}
  else if(kind==='activity'){const stat=['骑射'].includes(p.hobby)?'military':['琴艺','花草'].includes(p.hobby)?'art':'literature';let resonance=this.s.player[stat]>=40?4:0;text=`你们一道${p.hobby==='骑射'?'去校场试了新弓':p.hobby==='琴艺'?'合了一段旧曲':p.hobby==='商道'?'逛了几家小铺':p.hobby==='小动物'?'给廊下的猫梳了毛':'在窗下坐到茶凉'}。他谈到喜欢的事，话比平日多了许多。`;effects.push(this.changeNPC(p,'friend',7+resonance));this.s.player[stat]+=2;effects.push(`${{military:'武',art:'艺',literature:'文'}[stat]} +2${resonance?'，共同爱好额外好感 +4':''}`);}
  else if(kind==='flirt'){text=p.id==='jiang'?'他手中的书页停了很久。“陛下……”这一声比平日低，后半句却没接上。':p.id==='xu'?'他搁下笔，隔了好一会儿才道：“这话，陛下若只是逗臣，现在收回还来得及。”':p.id==='xie'?'他照旧笑着，手里的茶却忘了添。“陛下，奴才会当真的。”':'他明明已经移开目光，耳根却先红了：“这句话，您也同旁人说过吗？”';effects.push(this.changeNPC(p,'love',8),this.changeNPC(p,'friend',3));
   for(const q of this.adults().filter(q=>q.id!==p.id&&q.love>=25&&this.rand()<.5)){this.changeNPC(q,'friend',-2);this.record(q,`听说女帝与${p.name}在一处说了许久的话。`);this.log(`${q.name}原本备了茶，听见消息，又叫人撤了。好感 -2。`,'world',q.id);}
  }else if(kind==='probe'){
   text=this.s.flags['probe-'+id]?'他没有再绕开话题，把知道的部分慢慢说了。':'他笑了笑，先问你从哪里听来的消息。说到关键处，忽然端起了茶。';
   this.s.flags['probe-'+id]=true;this.s.intel=this.clamp(this.s.intel+3);effects.push('情报能力 +3',this.changeNPC(p,'friend',p.friend>35?2:-2));
   if(id==='xie'&&this.s.flags.xieInvestigated){text='旧宫籍中没有谢无咎的入宫记录，他却准确说出了你幼时遇险那晚的细节。“那日救您的，确实是奴才。其余的……您还想听吗？”';this.s.flags.xieRevealed=true;}
  }else if(kind==='scold'){
   const tier=this.dialogueTier({...p,friend:p.friend-10});const scold={
    '恩断义绝':'臣听见了。从今往后，臣只做分内的事。',
    '关系极差':'臣会记住这次训斥。只是请陛下也记住，臣不是没有尊严。',
    '关系特别差':'臣领训。若要问罪，请把证据一并拿来。',
    '关系较差':'臣知道陛下失望了，臣会把该补的补上。',
    '失望':'臣不辩解。只是这句话，臣会记很久。',
    '关系一般':'臣明白了。下回臣会先把话说清楚。',
    '关系上升':'臣知道您是恼我，不是要把我赶走。臣会改。',
    '朋友':'臣认错。您若愿意，再给臣一次说明的机会。',
    '永远的朋友':'臣确实做错了，您骂得对。只是别因此不理臣。',
    '暧昧':'臣知道您生气，可您这样看我，我反而更难受。',
    '最爱':'臣愿意听您训，只求您训完还肯留我。'
   };text=scold[tier]||'臣明白了，之后会谨慎些。';effects.push(this.changeNPC(p,'friend',-10),this.changeNPC(p,'loyalty',-4));
  }
  else if(kind==='sleep'){text='银烛低垂，疏影入帘。今宵不问宫墙外，且把相思付月明。天亮时，那盏茶终于有人替你留温。';effects.push(this.changeNPC(p,'love',10),this.changeNPC(p,'friend',5));if(!this.s.pregnancy&&this.rand()<.38&&this.s.player.age<=48){this.s.pregnancy={father:id,due:this.s.turn+9};effects.push('太医将留意您的身体变化');}}
  else {this.s.privateAP++;delete this.s.acted[k];return {ok:false,message:'无效互动。'};}
  this.record(p,`与女帝${{chat:'闲谈',care:'说起近况',activity:'共度闲暇',flirt:'说了心意',probe:'谈及旧事',scold:'因事受训',sleep:'共度良宵'}[kind]}。`);
  return this.finish(`${p.name}：${text} ${effects.join('；')}。`,'action',id);
 }
 gift(id,treasureId){const p=this.npc(id),i=this.s.treasures.findIndex(t=>t.id===treasureId);if(!p||p.dead||i<0)return {ok:false,message:'宝物或收礼人已不在。'};const c=this.spend({},'private');if(!c.ok)return c;const t=this.s.treasures.splice(i,1)[0],d=t.hobby===p.hobby?14:7;this.changeNPC(p,'friend',d);this.record(p,`收到女帝赏赐的${t.name}。`);p.wealth=(p.wealth||0)+t.value;return this.finish(`将${t.name}赏给${p.name}，好感 +${d}${d===14?'（投其所好）':''}。他打开盒子看了两遍，才想起来谢恩。`,'action',id);}
 practice(stat){if(!['literature','military','art'].includes(stat))return {ok:false,message:'无效修习。'};const c=this.spend({},'private');if(!c.ok)return c;const n=this.int(2,5);this.s.player[stat]+=n;const matching=this.adults().filter(p=>(stat==='military'?p.hobby==='骑射':stat==='art'?['琴艺','花草'].includes(p.hobby):['经史','笔墨','弈棋'].includes(p.hobby)));const p=matching.length?this.pick(matching):null;let extra='';if(p&&this.s.player[stat]>=35){this.changeNPC(p,'friend',2);extra=`${p.name}听说后颇有兴致，好感 +2。`;}
  return this.finish(`${stat==='literature'?'在书房读书临帖':stat==='military'?'到校场习武': '在殿内练琴作画'}，${{literature:'文',military:'武',art:'艺'}[stat]} +${n}。${extra}`);
 }
 agency(kind,target){if(kind==='appoint'){const p=this.npc(target);if(!p||p.dead||p.age<18||p.consort)return {ok:false,message:'此人不能担任厂卫职务。'};const c=this.spend({money:90},'private');if(!c.ok)return c;const old=this.npc(this.s.offices['东厂提督']);for(const [office,id]of Object.entries(this.s.offices))if(id===p.id&&office!=='东厂提督')delete this.s.offices[office];this.s.offices['东厂提督']=p.id;p.office='东厂提督';if(old&&old.id!==p.id&&!Object.values(this.s.offices).includes(old.id))old.office='候补官员';this.changeNPC(p,'friend',5);if(old&&old.id!==p.id)this.changeNPC(old,'friend',-10);return this.finish(`任${p.name}掌东厂，银 -90，新任好感 +5${old&&old.id!==p.id?`；${old.name}好感 -10`:''}。西厂与锦衣卫另按现任官职行事。`);}
  const cost={train:140,talent:180,consort:160,treasure:160,investigate:110}[kind];if(!cost)return {ok:false,message:'无效厂务。'};const p=this.npc(target);if(kind==='investigate'&&(!p||p.dead))return {ok:false,message:'请选择在世人物。'};
  const c=this.spend({money:cost},'private');if(!c.ok)return c;
  if(kind==='train'){const d=this.int(5,9);this.s.intel=this.clamp(this.s.intel+d);return this.finish(`整训厂卫，银 -${cost}，情报能力 +${d}。调查进度与寻访收获会随能力改善。`);}
  if(kind==='talent'||kind==='consort'){let p=this.generateNPC();this.s.people.push(p);p.office=kind==='talent'?'寻访人才':'掖庭候选';p.location=kind==='talent'?'京城':'掖庭';if(kind==='consort'){const waiting=this.s.people.filter(q=>q.location==='掖庭'&&!q.consort).length;if(waiting>15){this.s.people.pop();this.s.money+=cost;this.s.privateAP++;return {ok:false,message:'掖庭候选已满十五人，先安置现有人选。'};}if(!this.s.selection)this.s.selection={year:1,ids:[],chosen:[],closed:false};this.s.selection.closed=false;this.s.selection.ids.push(p.id);}
   return this.finish(`厂卫寻得${p.name}，银 -${cost}。${kind==='talent'?'已入人才名录，可在吏部任用。':'已入掖庭名册，可查看后决定是否册封。'}`,'action',p.id);}
  if(kind==='treasure'){const t={id:++this.s.uid,name:this.pick(['雨过天青盏','古谱残卷','雕花小弓','百年松烟墨','错金棋子','香木琴']),hobby:this.pick(['笔墨','琴艺','骑射','弈棋','花草']),value:this.int(60,160)};this.s.treasures.push(t);return this.finish(`厂卫从旧市寻回${t.name}，银 -${cost}。已收入内府，可赏赐他人。`);}
  this.s.flags['investigated-'+target]=true;if(target==='xie')this.s.flags.xieInvestigated=true;p.secrets=p.secrets||[];let secret=`查得${p.name}与${this.pick(this.adults().filter(q=>q.id!==target)).name}最近有银钱往来，仍需核实缘由。`;p.secrets.push(secret);this.s.intel=this.clamp(this.s.intel+2);let ca=this.s.cases.find(q=>!q.closed&&q.suspect===target);if(ca)ca.evidence=this.clamp(ca.evidence+1,0,3);return this.finish(`调查${p.name}，银 -${cost}、情报 +2。${target==='xie'?'宫籍里找不到他当年入宫的记录，可以再当面试探。':secret}${ca?'相关案件证据 +1。':''}`);
 }
 outing(place){const defs={teahouse:{cost:40,name:'听雨茶楼'},market:{cost:120,name:'东市宝铺'},theatre:{cost:60,name:'春和戏楼'},temple:{cost:70,name:'城隍庙'},dock:{cost:50,name:'渡口'},clinic:{cost:90,name:'仁心医馆'}};const d=defs[place];if(!d)return {ok:false,message:'此地尚不能探索。'};const c=this.spend({money:d.cost},'private');if(!c.ok)return c;
  let result='';if(place==='market'){const t={id:++this.s.uid,name:this.pick(['碧玉香囊','新刻话本','细骨折扇','青瓷茶盏']),hobby:this.pick(['花草','笔墨','琴艺']),value:100};this.s.treasures.push(t);result=`买下${t.name}，已入宝物库。`;}
  else if(place==='temple'){this.s.stability=this.clamp(this.s.stability+2);result='听百姓说了修桥与粮价的事，命人登记诉求。稳定 +2。';}
  else if(place==='clinic'){const p=this.pick(this.adults());p.health=this.clamp((p.health||80)+10);result=`碰见${p.name}替家人抓药，你替他付了药钱。好感 +6。`;this.changeNPC(p,'friend',6);this.record(p,'在医馆遇见女帝，受赠一包药。');}
  else {const p=this.pick(this.adults());this.changeNPC(p,'friend',4);this.record(p,`在${d.name}偶遇女帝。`);result=`你在${d.name}碰见${p.name}，他正${this.pick(['跟店家讨价还价，说好只买一册书却抱了一摞','替朋友挡酒，一抬眼先认出了你','认真听两个老伯争论朝廷的新税率'])}。好感 +4。`;if(place==='teahouse'&&this.s.stories.filter(s=>s.status==='active').length<7){let def=this.pick(STORY_DEFS.filter(d=>!d.triggerOnly&&!this.s.stories.some(s=>s.def===d.id&&s.status==='active')));if(def){this.startStory(def.id);result+=`听到一件新鲜事：“${def.title}”，已入奏疏。`;}}}
  return this.finish(`微服至${d.name}，银 -${d.cost}。${result}`);
 }
 childCare(id,kind){const p=this.npc(id);if(!p||!this.s.children.includes(id)||p.dead)return {ok:false,message:'请选择皇嗣。'};const c=this.spend({},'private');if(!c.ok)return c;if(kind==='care'){p.health=this.clamp(p.health+8);p.friend=this.clamp(p.friend+8);return this.finish(`陪${p.name}用了晚膳，听孩子讲完今日的事。健康 +8、亲近 +8。`);}if(!['literature','military','art'].includes(kind)){this.s.privateAP++;return {ok:false,message:'无效教养。'};}const d=this.int(3,7);p[kind]+=d;p.friend=this.clamp(p.friend+3);return this.finish(`教${p.name}${{literature:'识字读书',military:'习武锻炼',art:'琴画'}[kind]}，${{literature:'文',military:'武',art:'艺'}[kind]} +${d}、亲近 +3。`);}
 succession(id){const p=this.npc(id);if(!p||!this.s.children.includes(id)||p.age<18||p.dead)return {ok:false,message:'须选择年满十八岁、在世的皇嗣。'};if(this.s.player.age<55&&!this.s.lost)return {ok:false,message:'女帝年满五十五岁后可禅位，当前尚早。'};
  const old=this.s.player;this.s.history.unshift({turn:this.s.turn,title:'禅位',text:`${old.name}禅位于${p.name}，国家、世家和案件继续延续。`});this.npc(old.id).office='太上皇';p.office='女帝';this.s.player={id:p.id,name:p.name,age:p.age,literature:p.literature,military:p.military,art:p.art};for(const q of this.alive()){q.friend=this.bond(q.id,p.id).friend;q.love=this.bond(q.id,p.id).love;}this.s.children=this.s.people.filter(q=>q.parents?.includes(p.id)).map(q=>q.id);this.s.lost=false;this.s.phase='court';this.s.courtAP=5;this.s.privateAP=6;return this.finish(`新帝${p.name}即位。国库、疆域、家史、亲属网络与未结故事全部保留。`,'system');}
 endCourt(){if(this.s.phase!=='court')return {ok:false,message:'已经下朝。'};this.s.phase='private';return this.finish(`散朝。上朝余下 ${this.s.courtAP}次留在朝堂，下朝活动独立可用 ${this.s.privateAP}/6次。`,'system');}
 autonomous(){
  const pool=this.adults();
  for(let i=0;i<8;i++){
   const a=this.pick(pool);if(!a)continue;const familiar=pool.filter(p=>p.id!==a.id&&(this.bond(a.id,p.id).friend!==0||p.clan===a.clan)),others=pool.filter(p=>p.id!==a.id),b=this.pick(familiar.length&&this.rand()<.65?familiar:others);if(!b)continue;
   const bond=this.bond(a.id,b.id),kind=this.int(0,5);let text='';
   if(kind===0){this.changeBond(a.id,b.id,6);text=`${a.name}到${b.name}家吃饭，顺手带走一包点心。${b.name}追到门口：“盒子记得还！”两人交情 +6。`;}
   if(kind===1){this.changeBond(a.id,b.id,-7);text=`${a.name}与${b.name}为${this.pick(['一笔旧账','谁该去赈灾','族中铺子的份额','一场没赴的约'])}闹了别扭，见面都假装先看见别的人。交情 -7。`;}
   if(kind===2){const amount=Math.min(40,a.wealth||0);a.wealth=(a.wealth||0)-amount;b.wealth=(b.wealth||0)+amount;this.changeBond(a.id,b.id,amount?4:2);text=amount?`${a.name}替${b.name}垫了 ${amount}两银子，说是借，连张借据也没要。交情 +4。`:`${a.name}自己手头也紧，便替${b.name}找熟人宽了几日账期。交情 +2。`;}
   if(kind===3){a.art=this.clamp((a.art||40)+1);text=`${a.name}${this.pick(['请了半日假去探望长辈，回来时拎着一篮家里塞的菜','在书铺遇见旧日同窗，站在门口聊到打烊','学做一道新点心，最后只肯给家里人尝','为家中小辈挑先生，比自己当年赴考还紧张','听说族中有人病了，连夜送去一车药'])}。艺 +1。`;}
   if(kind===4){if(a.clan!==b.clan&&bond.friend>15){this.changeBond(a.id,b.id,5,0,'盟友');text=`${a.name}与${b.name}私下约好：下一次${this.pick(['工部建设','州府任命','商税议案'])}，彼此帮着说句话。盟友交情 +5。`;}else {this.changeBond(a.id,b.id,3);text=`${a.name}给${b.name}递了一封荐书：“人合不合用，你自己看，别只看我的面子。”交情 +3。`;}}
   if(kind===5){const single=!a.spouse&&!b.spouse&&!a.consort&&!b.consort&&a.clan!==b.clan&&!this.related(a.id,b.id);if(single&&bond.friend>12){this.changeBond(a.id,b.id,3,5,'旧识渐近');text=`${a.name}与${b.name}一道赏灯，散场后又绕远路走了一圈。两人交情 +3、爱情 +5。`;if(this.bond(a.id,b.id).love>=25){a.spouse=b.id;b.spouse=a.id;this.changeBond(a.id,b.id,8,0,'夫妻');text+=` 两家同意议婚，婚讯已写入族谱。`;}}else {this.changeBond(a.id,b.id,2);text=`${a.name}替${b.name}保留了一张戏票，自己却先忙得忘了时辰。交情 +2。`;}}
   this.record(a,text);this.record(b,text);this.log(text,'world',a.id);
  }
  // Unseen officials continue to govern; neglect is not an automatic romance gain.
  for(const p of pool){if(!Object.values(this.s.offices).includes(p.id)&&!p.consort)continue;if(p.consort&&p.love>0&&!p.recent?.some(r=>r.turn===this.s.turn&&r.text.includes('女帝'))&&this.rand()<.35){this.changeNPC(p,'friend',-1);this.log(`${p.name}把等凉的茶倒了，转头去做自己的事。久未相见，好感 -1。`,'world',p.id);}}
 }
 caseReports(turn=this.s.turn){return this.s.cases.flatMap(c=>(c.reports||[]).filter(r=>r.turn===turn).map(r=>({...r,caseId:c.id,title:c.title})));}
 resolveInvestigations(){
  const minister=this.npc(this.s.offices['刑部尚书']),reporter=minister&&!minister.dead?minister:null;
  for(const ca of this.s.cases){const task=ca.investigation;if(!task||task.due>this.s.turn)continue;delete ca.investigation;if(ca.closed)continue;
   const before=ca.evidence;ca.evidence=this.clamp(before+task.gain,0,3);
   const finding=ca.evidence>=3?'账本、证词和签押都对上了，证据已经核实。':ca.evidence>=2?'账本和证词基本对上了，已经可以依法处置。':'查到了一处账目出入，但还有几笔对不上，得继续查，眼下还不能定罪。';
   const speaker=reporter?`刑部尚书${reporter.name}`:'刑部主事（尚书暂缺）',text=`${speaker}呈报：“陛下，${ca.title}查过了。${finding}” 证据 ${before}/3 → ${ca.evidence}/3。`;
   ca.reports=ca.reports||[];ca.reports.push({turn:this.s.turn,reporter:reporter?.id||null,speaker,text,evidence:ca.evidence});
   this.record(reporter,`上朝呈报“${ca.title}”的调查结果，证据 ${ca.evidence}/3。`);this.log(text,'court',reporter?.id||null);
  }
 }
 settleTreasury(net){const balance=this.s.money+net,shortfall=Math.max(0,-balance);this.s.money=Math.max(0,balance);this.s.flags.arrears=(this.s.flags.arrears||0)+shortfall;
  const paid=Math.min(this.s.money,this.s.flags.arrears);this.s.money-=paid;this.s.flags.arrears-=paid;if(paid)this.log(`户部从结余中补发欠饷 ${paid}两，尚欠 ${this.s.flags.arrears}两。`,'economy');return shortfall;}
 mutinyRisk(){if(!(this.s.flags.arrears>0))return 0;const minister=this.npc(this.s.offices['兵部尚书']);return Math.min(70,12+(this.s.flags.deficitMonths||0)*8+Math.max(0,45-this.s.morale)/2+Math.max(0,50-(minister?.loyalty??30))/2);}
 repayArrears(){const debt=this.s.flags.arrears||0,amount=Math.min(debt,this.s.money);if(!debt)return {ok:false,message:'目前没有拖欠的军饷。'};if(amount<=0)return {ok:false,message:'国库已空，先筹到银两再补发。'};const cost=this.spend({money:amount});if(!cost.ok)return cost;this.s.flags.arrears-=amount;this.s.morale=this.clamp(this.s.morale+5);if(!this.s.flags.arrears)this.s.flags.deficitMonths=0;return this.finish(`补发欠饷 ${amount}两，军中士气 +5，尚欠 ${this.s.flags.arrears}两。${this.s.flags.arrears?'余款未清，仍有哗变风险。':'欠饷已清，因欠饷引发的谋反风险解除；已有叛乱仍需处理。'}`);}
 financialTrouble(){
  if(!(this.s.flags.arrears>0)){this.s.flags.deficitMonths=0;return;}
  this.s.flags.deficitMonths=(this.s.flags.deficitMonths||0)+1;this.s.morale=this.clamp(this.s.morale-10);this.s.stability=this.clamp(this.s.stability-6);
  const urgent=id=>{if(!this.s.stories.some(st=>st.def===id&&st.status==='active'))return this.startStory(id);};urgent('paycrisis');
  this.log(`户部报：军饷还未补齐，尚欠 ${this.s.flags.arrears}两。军中士气 -10、稳定 -6。本回谋反风险 ${Math.round(this.mutinyRisk())}%；可在“国事”筹银，在“钱粮”补发欠饷。`,'warning');
  if(this.rand()*100>=this.mutinyRisk())return;
  const regions=this.s.regions.filter(r=>r.owner==='liang'&&!r.capital),r=regions.length?this.pick(regions):null;
  const candidates=this.adults().filter(p=>!p.consort&&(p.military||0)>=40).sort((a,b)=>a.loyalty-b.loyalty),instigator=candidates[0];
  if(r){r.owner='rebel';r.loyalty=this.clamp(r.loyalty-20);this.s.stability=this.clamp(this.s.stability-4);}
  if(instigator){this.changeNPC(instigator,'loyalty',-8);this.record(instigator,`因拖欠军饷，参与煽动${r?r.name:'京中守军'}哗变。`);}
  urgent('paymutiny');this.log(`${instigator?.name||'营中军官'}趁欠饷煽动谋反。${r?r.name+'守军关门拒令，当地税粮中断，稳定 -4；可点击地图派兵平叛。':'京中出现串联军官的传单，厂卫已开始追查。'}“有人答应明日发饷，大家就跟着走了。”谋反线索已列入朝议。`,'warning',instigator?.id||null);
 }
 nextTurn(){
  if(this.s.lost)return {ok:false,message:'本局已结束，请读档、传位或重新开局。'};
  if(this.s.phase!=='private')return {ok:false,message:'请先下朝，再结束本月。'};
  const b=this.budget(),before={money:this.s.money,grain:this.s.grain};this.settleTreasury(b.net);this.s.grain=Math.max(0,this.s.grain+b.grainNet);this.s.wood+=b.wood;this.s.iron+=b.iron;this.s.horses+=b.horses;
  if(before.grain+b.grainNet<0){this.s.stability=this.clamp(this.s.stability-9);this.s.morale=this.clamp(this.s.morale-5);for(const r of this.s.regions){if(r.owner==='liang'){r.population=Math.floor(r.population*.98);r.loyalty=this.clamp(r.loyalty-4);}}this.log('缺粮。地方人口流失 2%、民心 -4，稳定 -9、士气 -5。修农田、减兵或进口粮食才能缓解。','warning');}
  this.autonomous();
  this.s.turn++;
  this.log(`本月结算：收入 ${b.income}，支出 ${b.upkeep}，银 ${b.net>=0?'+':''}${b.net}；粮产 ${b.grain}、耗粮 ${b.food}，结余 ${b.grainNet>=0?'+':''}${b.grainNet}。`,'economy');
  for(const r of this.s.regions){if(r.owner!=='liang')continue;const pop=this.s.grain>0&&r.loyalty>35?Math.ceil(r.population*.004*Math.max(.1,1-this.s.tax/25)):-Math.floor(r.population*.004);const cap=22000+r.buildings.homes*25000;r.population=Math.max(2000,Math.min(cap,r.population+pop));r.loyalty=this.clamp(r.loyalty+(this.s.tax===8?1:this.s.tax===18?-2:0));r.prosperity=this.clamp(r.prosperity+(this.s.tax===18?-1:r.buildings.market>0?1:0));
   if(r.loyalty<18&&this.rand()<.25){r.owner='rebel';this.s.stability=this.clamp(this.s.stability-6);this.log(`${r.name}因民心过低发生叛乱，税粮中断。可在地图派兵平叛。`,'warning');}}
  for(const build of [...this.s.builds]){build.remaining--;if(build.remaining<=0){this.region(build.region).buildings[build.key]=build.level;this.s.builds=this.s.builds.filter(b=>b.id!==build.id);this.log(`${this.region(build.region).name}的${BUILDINGS[build.key].name} ${build.level}级完工，开始计入下月产出。`,'economy');}}
  for(const co of this.s.countries){
   if(co.trade&&!co.war){const amount=co.resource==='grain'?180:co.resource==='wood'?25:co.resource==='iron'?18:5;this.s[co.resource]+=amount;this.log(`${co.name}商队送到${{grain:'粮',wood:'木',iron:'铁',horses:'马'}[co.resource]} ${amount}，商税已计入本月收入。`,'economy');}
   if(this.rand()<.13&&!co.war){const d=this.pick([-12,-6,6,10]);co.relation=this.clamp(co.relation+d,-100,100);this.log(`${co.name}${d>0?'派使者祝贺新朝，愿继续往来':'因边境商队纠纷发来照会'}。关系 ${d>0?'+':''}${d}。`,'diplomacy');if(co.trade&&co.relation<0){co.trade=false;this.log(`${co.name}暂停商约，贸易收入与进口同时中断。`,'warning');}}
  }
  if(this.s.war){const w=this.s.war,co=this.s.countries.find(c=>c.id===w.country);this.settleTreasury(-220);this.s.grain=Math.max(0,this.s.grain-350);const support=this.s.countries.filter(c=>c.alliance&&!c.war).length*160,ratio=(this.combat()+support)/(co.power*30),win=ratio*(.75+this.rand()*.5)>1;const casualties=Math.min(this.s.soldiers,this.int(win?60:180,win?180:360));this.s.soldiers-=casualties;this.s.weapons=Math.max(0,this.s.weapons-Math.floor(casualties*.7));w.our+=win?1:0;w.their+=win?0:1;w.remaining--;this.log(`对${co.name}战事：${win?'此役得胜':'此役失利'}，损兵 ${casualties}，军费银 -220、粮 -350。`,'warning');if(w.remaining===0){co.war=false;co.relation=-65;if(w.our>=2){co.power=Math.max(10,co.power-12);this.s.money+=800;this.s.stability=this.clamp(this.s.stability+6);const capital=this.s.regions.find(r=>r.capital),taken=this.s.regions.filter(r=>r.owner===co.id).sort((a,b)=>(Math.abs(a.x-capital.x)+Math.abs(a.y-capital.y))-(Math.abs(b.x-capital.x)+Math.abs(b.y-capital.y)))[0];if(taken){taken.owner='liang';taken.tag='新附';taken.loyalty=27;taken.garrison=180;taken.governor='lu';taken.royal=false;}this.log(`战胜${co.name}，获赔银 800、稳定 +6，${taken?taken.name+'归附': '对方已无可割让城池'}；新附民众忠诚较低。`,'system');}else{this.s.stability=this.clamp(this.s.stability-10);this.s.morale=this.clamp(this.s.morale-12);this.log(`对${co.name}战败，稳定 -10、士气 -12，朝臣要求重整军备。`,'warning');}this.s.war=null;}}
  if(this.s.pregnancy&&this.s.pregnancy.due<=this.s.turn){let p=this.generateNPC('皇室');p.name=this.pick(['昭','承','明'])+this.pick(['宁','安','晏','和','珩']);p.age=0;p.parents=[this.s.player.id,this.s.pregnancy.father];p.office='皇嗣';p.friend=15;p.love=0;p.literature=5;p.military=3;p.art=5;p.location='重华宫';p.bio=`${this.s.player.name}与${this.npc(this.s.pregnancy.father).name}之子女，出生于${this.date()}。`;this.s.people.push(p);this.s.children.push(p.id);this.s.pregnancy=null;this.s.stability=this.clamp(this.s.stability+4);this.log(`皇嗣${p.name}降生，稳定 +4，已入重华宫与皇室族谱。`,'system');}
  if(this.s.turn%12===0){this.s.player.age++;for(const p of this.s.people){if(p.dead)continue;p.age++;if(p.age>72&&this.rand()<.14){p.dead=true;if(p.id===this.s.player.id){this.s.lost=true;this.log('女帝驾崩。可在重华宫选择成年皇嗣承继，也可读档或另起一朝。','system');}p.consort=false;p.consort=false;for(const [o,id]of Object.entries(this.s.offices))if(id===p.id)delete this.s.offices[o];this.log(`${p.name}辞世，亲族与旧交前往吊唁，履历已留入家史。`,'world',p.id);this.s.history.unshift({turn:this.s.turn,title:p.name+'辞世',text:`${p.clan}氏，享年${p.age}。${p.bio||''}`});}}
   this.npc(this.s.player.id).age=this.s.player.age;this.examOffer();this.log('新年开科，本届六名应试人才已入礼部名册，最多选三名。','system');
   if(this.s.turn%48===0){this.selectionOffer();this.log('四年一届的选秀开始，新候选人已入掖庭；总待诏超过十五人会按年资遣还。','system');}
  }
  const waiting=this.s.people.filter(p=>p.location==='掖庭'&&!p.consort&&!p.dead);if(waiting.length>15){for(const p of waiting.slice(0,waiting.length-15)){p.location='原籍';p.office='归乡候选';if(this.s.selection)this.s.selection.ids=this.s.selection.ids.filter(id=>id!==p.id);}}
  if(this.s.turn%3===0&&this.s.stories.filter(s=>s.status==='active').length<6){let choices=STORY_DEFS.filter(d=>!d.triggerOnly&&!this.s.stories.some(s=>s.def===d.id));if(!choices.length)choices=STORY_DEFS.filter(d=>!d.triggerOnly&&!d.actors&&!this.s.stories.some(s=>s.def===d.id&&s.status==='active'));if(choices.length){const d=this.pick(choices),st=this.startStory(d.id);this.log(`新奏折：“${d.title}”。此事已在朝中传开。`,'story',st?.actors[0]);}}
  if(this.s.turn%5===0&&this.s.cases.filter(c=>!c.closed).length<4){const p=this.pick(this.adults().filter(p=>!p.consort));this.newCase(this.pick(['私卖官田疑案','军需价银疑案','河堤虚报工料','借官威侵占铺面']),p.id);this.log(`${p.name}卷入一桩新案，刑部已登记，未调查前不能视为定罪。`,'court',p.id);}
  if(this.s.turn%4===0){const r=this.pick(this.s.regions.filter(r=>r.owner==='liang'));if(r){const bad=this.rand()<.5;if(bad){this.s.grain=Math.max(0,this.s.grain-180);r.loyalty=this.clamp(r.loyalty-3);this.log(`${r.name}连日大雨冲坏仓顶，粮 -180、民心 -3。`,'warning');}else{this.s.money+=150;r.prosperity=this.clamp(r.prosperity+3);this.log(`${r.name}集市热闹，额外入税银 150，繁荣 +3。`,'economy');}}}
  this.incidentExpire();if(this.s.turn>0&&this.rand()<.24)this.incidentOffer();
  this.s.trained=false;this.s.built=false;this.s.acted={};this.s.courtAP=5;this.s.privateAP=6;this.s.phase='court';
  if(this.s.stability<=0){this.s.lost=true;this.log('朝廷失去控制，本局结束。可以导入旧档，或重新起步。','system');}
  this.financialTrouble();
  if(this.s.stability<=0&&!this.s.lost){this.s.lost=true;this.log('欠饷与叛乱使朝廷失去控制，本局结束。','system');}
  const result=this.finish(`${this.date()}，自动上朝。朝堂行动 5次、下朝行动 6次分别重置；${this.readyStories().length}件故事等待决策。`,'system');
  this.resolveInvestigations();return result;
 }
 suppress(id){const r=this.region(id);if(!r||r.owner!=='rebel')return {ok:false,message:'此地没有叛乱。'};if(this.combat()<500)return {ok:false,message:'战力须达到 500，先整顿武器和训练。'};const c=this.spend({money:240,grain:350});if(!c.ok)return c;const loss=this.int(60,180);this.s.soldiers=Math.max(0,this.s.soldiers-loss);r.owner='liang';r.loyalty=30;this.s.stability=this.clamp(this.s.stability+3);return this.finish(`平定${r.name}，银 -240、粮 -350、士兵 -${loss}；当地恢复税粮，民心 30、稳定 +3。`);}
 static validate(s){
  try{
   const finite=(v,min=0,max=1e15)=>Number.isFinite(v)&&v>=min&&v<=max, record=v=>v&&typeof v==='object'&&!Array.isArray(v), arrays=['people','clans','regions','countries','stories','pending','resolved','logs','cases','builds','treasures','children','appointments','history'];
   if(!s||s.version!==1||!Number.isInteger(s.turn)||!finite(s.turn,0,23999)||!['court','private'].includes(s.phase)||!arrays.every(k=>Array.isArray(s[k])&&s[k].length<10000)||!['offices','player','flags','relations','acted'].every(k=>record(s[k])))return false;
   if(!['money','grain','wood','iron','horses','soldiers','weapons','seed','uid'].every(k=>finite(s[k]))||!['stability','training','morale','intel'].every(k=>finite(s[k],0,100))||!finite(s.courtAP,0,5)||!finite(s.privateAP,0,6)||![8,12,18].includes(s.tax))return false;
   const ids=new Set(s.people.map(p=>p?.id));if(ids.size!==s.people.length||!ids.has(s.player.id)||!s.people.length||!s.clans.length||!s.countries.length)return false;
   if(!s.people.every(p=>record(p)&&typeof p.id==='string'&&typeof p.name==='string'&&finite(p.age,0,2100)&&Array.isArray(p.parents)&&p.parents.every(id=>ids.has(id)&&id!==p.id)&&Array.isArray(p.recent)))return false;
   if(!['age','literature','military','art'].every(k=>finite(s.player[k]))||!Object.values(s.offices).every(id=>ids.has(id))||!s.children.every(id=>ids.has(id)))return false;
   if(!s.regions.every(r=>r&&typeof r.id==='string'&&finite(r.population)&&finite(r.loyalty,0,100)&&finite(r.prosperity,0,100)&&finite(r.garrison)&&record(r.buildings)&&Object.keys(BUILDINGS).every(k=>Number.isInteger(r.buildings[k])&&finite(r.buildings[k],0,5))))return false;
   if(!s.pending.every(i=>record(i)&&(!i.kind||(i.kind==='incident'&&typeof i.id==='string'&&typeof i.title==='string'&&typeof i.text==='string'&&Array.isArray(i.choices)&&i.choices.length===2&&Number.isInteger(i.created)&&Number.isInteger(i.expires)&&typeof i.resolved==='boolean'))))return false;
   if(!s.countries.every(c=>c&&typeof c.id==='string'&&typeof c.name==='string'&&finite(c.relation,-100,100)&&finite(c.power,0,100)&&finite(c.prosperity,0,100)))return false;
   if(!s.stories.every(st=>st&&STORY_DEFS.some(d=>d.id===st.def)&&Array.isArray(st.actors)&&st.actors.every(id=>ids.has(id))&&Array.isArray(st.history)&&Number.isInteger(st.stage)&&st.stage>=0&&st.stage<=(st.stages||STORY_DEFS.find(d=>d.id===st.def).stages).length&&finite(st.due)))return false;
   if(!s.builds.every(b=>s.regions.some(r=>r.id===b.region)&&BUILDINGS[b.key]&&finite(b.remaining,1,5)&&finite(b.level,1,5))||!s.cases.every(c=>c&&ids.has(c.suspect)&&finite(c.evidence,0,3)))return false;
   if(s.flags.arrears!==undefined&&!finite(s.flags.arrears))return false;if(s.flags.deficitMonths!==undefined&&(!Number.isInteger(s.flags.deficitMonths)||!finite(s.flags.deficitMonths)))return false;
   for(const c of s.cases){if(c.investigation&&(!record(c.investigation)||!Number.isInteger(c.investigation.due)||!finite(c.investigation.due)||![1,2].includes(c.investigation.gain)))return false;
    if(c.reports!==undefined&&(!Array.isArray(c.reports)||!c.reports.every(r=>record(r)&&Number.isInteger(r.turn)&&finite(r.turn,0,s.turn)&&(r.reporter===null||ids.has(r.reporter))&&typeof r.speaker==='string'&&typeof r.text==='string'&&finite(r.evidence,0,3))))return false;}
   for(const offer of [s.exam,s.selection])if(offer&&(!Array.isArray(offer.ids)||!Array.isArray(offer.chosen)||!offer.ids.every(id=>ids.has(id))||!offer.chosen.every(id=>offer.ids.includes(id))))return false;
   if(s.selection){if(!Array.isArray(s.selection.rejected||[])||!(s.selection.rejected||[]).every(id=>s.selection.ids.includes(id))||!Number.isInteger(s.selection.maxChoices)||!finite(s.selection.maxChoices,0,20)||s.selection.chosen.some(id=>s.selection.rejected.includes(id)))return false;}
   if(s.pregnancy&&(!ids.has(s.pregnancy.father)||!finite(s.pregnancy.due)))return false;
   if(s.war&&(!s.countries.some(c=>c.id===s.war.country)||!finite(s.war.remaining,1,3)))return false;
   return true;
  }catch{return false;}
 }
}
if(typeof module!=='undefined')module.exports=LiangGame;
