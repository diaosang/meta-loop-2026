'use strict';
// The save stores daily decisions and memories; opening a panel never rerolls them.
const MIND_PROFILE=Object.fromEntries(FICTION_DATA.npcProfiles.map(p=>[p.id,p]));
const MIND_VOICE=Object.fromEntries(FICTION_DATA.voices.map((v,i)=>[v.name,i]));
const FICTION_INDEX=new Map();
for(const line of FICTION_DATA.dialogue){const s=FICTION_DATA.scenes[line[1]],key=`${s.category}|${line[2]}|${line[3]}|${s.topic}`;if(!FICTION_INDEX.has(key))FICTION_INDEX.set(key,[]);FICTION_INDEX.get(key).push(line);}
const mindTick=()=>state.elapsed*30+(state.day||1);
const mindEscape=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function mindHash(s){let n=2166136261;for(const c of String(s)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
function ensureMinds(){
 ensureInteractionStats();
 if(!state.ecology)state.ecology={version:1,days:{},inbox:[],attention:[],serial:0};
 const e=state.ecology;e.days=e.days||{};e.inbox=e.inbox||[];e.attention=e.attention||[];e.serial=e.serial||0;
 for(const p of PEOPLE){const r=state.relations[p.id];if(!r.mind){const h=mindHash(p.id);r.mind={born:mindTick(),lastContact:mindTick(),expectation:16+(h%12),jealousy:0,disappointment:0,hurt:0,security:48+(h%18),anger:0,distance:0,needs:{rest:h%50,company:20+h%40,recognition:20+h%30,freedom:20+h%40},memories:[],used:[],cooldowns:{},broken:0,lastAction:'',appointment:null};}const m=r.mind;m.memories=m.memories||[];m.used=m.used||[];m.cooldowns=m.cooldowns||{};}
}
function shiftMind(id,patch){const m=state.relations[id]?.mind;if(!m)return;for(const [k,v]of Object.entries(patch))m[k]=clamp((m[k]||0)+v);}
function rememberMind(id,text,kind='心事',publicRecord=false){const m=state.relations[id].mind;m.memories.push({tick:mindTick(),day:state.day,month:state.elapsed,text,kind,public:publicRecord});if(m.memories.length>30)m.memories.shift();if(publicRecord){const notes=state.relations[id].notes;notes.push({month:state.elapsed,text:`${state.day}日 · ${text}`});if(notes.length>100)notes.splice(0,notes.length-100);}}
function currentMind(p){
 const r=state.relations[p.id],m=r.mind;if(m.anger>=48)return '恼怒';if(m.distance>=55)return '疏离';if(m.hurt>=38)return '委屈';if(m.disappointment>=38)return '失望';if(r.rank&&m.jealousy>=24)return '吃醋';if(r.aff<20||m.security<25)return '戒备';if(p.romance&&r.aff>=65&&r.love>=25&&mindTick()-m.lastContact<=5)return '热恋';if(m.security>=72)return '安心';if(m.expectation>=28)return '期待';return '平静';
}
const JEALOUS_STRATEGY={
 '温柔体贴':['备了茶，想请你坐一会儿。','我也想让您多惦记一点。不是来告谁的状。'],
 '清冷克制':['照旧问安，却不再主动多留。','不是不想见。只是总让我等，我也会不知道该不该等。'],
 '明朗直率':['当面问起下次什么时候来。','我吃醋了。可我想听您亲口说，什么时候也能陪陪我？'],
 '骄矜自尊':['推掉了席上的客套，想私下说话。','我不想在人前争。但您不能把我不争，当作我不在意。'],
 '敏感多思':['信写了又改，最后只问你忙不忙。','是不是我哪里惹您厌烦了？您若忙，告诉我一声也好。'],
 '圆融世故':['借一场小聚，请宫人来问你的安排。','旁人的面子我会顾。可我也盼着，您有一次是专为我来。'],
 '严正守礼':['想问清以后几日的安排。','谁先谁后可以商量，定下来的日子，也请陛下算数。'],
 '野心进取':['想争取一件能亲手做好的差事。','不必只拿赏赐哄我。您肯把事情交给我，也肯来看我做得如何么？'],
 '疏朗洒脱':['出了门散心，留话说晚些回来。','我出去走走，省得坐在这里胡思乱想。您若有空，改日一起去。'],
 '务实重利':['不肯再猜，想把下回的日子说定。','您说改日，我不知道该备哪一日的饭。这回定个准信吧。'],
 '寡言重诺':['送来一件小东西，话却没多说。','想您了。您有空，就来。'],
 '戒备善谋':['托熟人问了问，却不肯直说缘由。','若我不让人递这句话，您是不是就不来了？']};
function mindLine(p){const m=state.relations[p.id].mind,st=currentMind(p);if(st==='吃醋')return JEALOUS_STRATEGY[p.type]?.[1]||'我也想同您好好说会儿话。';return ({期待:'原想等您忙完再问。下回见面，能不能先给我个准信？',热恋:'今天没什么大事，就是见着您，便觉得这一天很好。',失望:'我不是要您时时来。只是说好的事，也请放在心上。',委屈:'那句话我一直记着。我想说清，不想就这么算了。',安心:'您说了会来，我便知道不必一整日守着门等。',戒备:'这件事，我还不太想说。等熟一些，再慢慢讲吧。',恼怒:'我现在还生着气。您肯听我说完，我们再谈旁的。',疏离:'公事我会照办。私下的事，暂且不谈了。',平静:'手头的事刚收好。您想坐会儿，还是出去走走？'})[st];}
function mindBlock(p){const r=state.relations[p.id],m=r.mind,st=currentMind(p);return `<div class="mind-block"><div class="section-heading"><span class="tag">${st}</span><button class="text-btn" data-action="mindDetail" data-id="${p.id}">心态与近况</button></div><p>“${mindEscape(mindLine(p))}”</p><small>${p.type} · ${mindEscape(MIND_PROFILE[p.id]?.goal||'把自己的日子过好')}</small></div>`;}
function readFiction(p,category,topic){const cat=FICTION_DATA.categoryKeys.indexOf(category),pi=MIND_VOICE[p.type]??0,mi=FICTION_DATA.states.findIndex(s=>s.name===currentMind(p));let t=topic==='stay'?'ask':topic;const candidates=FICTION_INDEX.get(`${cat}|${pi}|${mi}|${t}`)||[];if(!candidates.length)return null;const m=state.relations[p.id].mind;const available=candidates.filter(x=>!m.used.includes(x[0]));const pool=available.length?available:candidates;const line=pool[mindHash(`${p.id}-${todayKey()}-${m.used.length}-${topic}`)%pool.length];m.used.push(line[0]);m.used=m.used.slice(-40);return {id:line[0],stage:line[4],reply:line[5],scene:FICTION_DATA.scenes[line[1]]};}
function markContact(id,kind='会面'){
 const r=state.relations[id],m=r.mind,gap=mindTick()-m.lastContact;m.lastContact=mindTick();m.needs.company=clamp(m.needs.company-18);shiftMind(id,{expectation:5,security:2});
 if(m.appointment&&m.appointment.tick>=mindTick()){shiftMind(id,{security:6,disappointment:-8});rememberMind(id,'约好的相处终于见着了，没有让人空等。','守约');m.appointment=null;}
 if(gap>=7)rememberMind(id,'隔了些日子，又同女帝见了面。心事还需慢慢说。','相处');
}
function publicFavor(id,occasion){
 ensureMinds();const p=PEOPLE.find(p=>p.id===id);if(!p)return;state.ecology.attention.push({id,tick:mindTick(),occasion});state.ecology.attention=state.ecology.attention.slice(-24);shiftMind(id,{security:5,expectation:6,jealousy:-4});
 for(const other of PEOPLE){const r=state.relations[other.id];if(other.id===id||!r.rank)continue;const m=r.mind,gap=Math.max(0,mindTick()-m.lastContact),s=MIND_PROFILE[other.id]?.jealousySensitivity||1;const value=Math.round((9+Math.min(gap,16)*.8)*s*(1-m.security/180));shiftMind(other.id,{jealousy:value});rememberMind(other.id,`听说女帝与${p.name}${occasion}。${JEALOUS_STRATEGY[other.type]?.[0]||'想找个机会说说自己的心事。'}`,'听闻');}
}
const applyBeforeMind=applyInteraction;
applyInteraction=function(p,category,id,line,effects={},options={}){
 if(!session||session.left<=0||session.id!==p.id)return;ensureMinds();const r=state.relations[p.id],m=r.mind,previous=currentMind(p);let fiction=null;
 // Preserve factual testimony, refusal, titles, and completed overnight consent.
 const safe=['chat','care','activity','flirt'].includes(category)&&!['promise','bag'].includes(id);
 if(safe)fiction=readFiction(p,category,id);
 if(fiction)line=fiction.reply;
 if(category==='scold'){shiftMind(p.id,{hurt:id==='remind'?8:20,anger:id==='remind'?10:32,security:-8,disappointment:6});rememberMind(p.id,id==='remind'?'女帝提醒了分寸，仍想把自己的理由说清。':'被斥责后心里难受，想等平静些再谈。','受伤');}
 if(category==='care'){const gift=id==='gift'||id==='bag';shiftMind(p.id,{security:gift?2:5,disappointment:gift?-2:-5,hurt:gift?-1:-4,anger:gift?-1:-4,jealousy:gift?-2:-5,expectation:3});if(id==='promise')rememberMind(p.id,'女帝约好下月再见，开始盼着那一天。','期待');}
 if(category==='activity'||category==='flirt'){shiftMind(p.id,{security:3,expectation:5,jealousy:-3});if(category==='activity'&&id==='walk'&&r.rank&&!isAway()){publicFavor(p.id,'在御花园散步');const entries=state.dailyHistory[todayKey()]?.entries[p.id];if(entries?.[3])entries[3].location='garden';}}
 if(category==='sleep'){shiftMind(p.id,{security:7,expectation:8,jealousy:-7});rememberMind(p.id,'今夜彼此都愿意留下。私下的相处没有被拿去同旁人比较。','亲密');}
 markContact(p.id,category);
 const before=session.left;applyBeforeMind(p,category,id,line,effects,options);
 if(session&&session.left<before&&fiction){session.response=`<span class="mind-stage">${mindEscape(fiction.stage)}</span><br>你问：“${mindEscape(fiction.scene.player)}”<br><br>“${mindEscape(line)}”`;renderSession();}
 save();
};
const sleepBeforeMind=sleepReason;
sleepReason=function(p,r){const gate=sleepBeforeMind(p,r);if(gate)return gate;ensureMinds();const mood=currentMind(p);if(['恼怒','委屈','疏离','失望','戒备'].includes(mood))return '对方现在想先把心事说开，今夜不留宿';return '';};
const topicsBeforeMind=topicsFor;
topicsFor=function(c,p,r){const a=topicsBeforeMind(c,p,r);if(c==='activity'&&r.rank){const row=a.find(x=>x[0]==='walk');if(row)row[2]='一同去御花园散步，宫中会知道这次陪伴。';}if(c==='chat'){const base=FICTION_DATA.bespoke.filter(x=>x.npc===p.id&&x.state==='平静');for(const b of base)a.push([`exclusive:${b.id}`,b.title,'只属于这个人的旧事与心意。']);}return a;};
const topicBeforeMind=interactionTopic;
interactionTopic=function(id){if(session&&session.left>0&&session.section==='chat'&&id.startsWith('exclusive:')){const p=PEOPLE.find(x=>x.id===session.id),base=FICTION_DATA.bespoke.find(x=>x.id===id.slice(10)&&x.npc===p.id);if(!base)return;const mood=currentMind(p),variants=FICTION_DATA.bespoke.filter(x=>x.npc===p.id&&x.title===base.title),chosen=variants.find(x=>x.state===mood)||base,m=state.relations[p.id].mind;if(mindTick()-(m.cooldowns[base.id]??-99)<chosen.cooldown){toast('这件事刚聊过，过几日再问吧。');return;}m.cooldowns[base.id]=mindTick();applyInteraction(p,'chat',id,chosen.reply,{aff:3});if(session){session.response=`<span class="mind-stage">${mindEscape(chosen.stage)}</span><br><br>“${mindEscape(chosen.reply)}”`;renderSession();save();}return;}topicBeforeMind(id);};actions.interactionTopic=interactionTopic;
intimacyQuestion=function(){if(!session||session.left<=0)return;const p=PEOPLE.find(x=>x.id===session.id),r=state.relations[p.id],reason=sleepReason(p,r);if(reason){toast(reason);return;}const line=readFiction(p,'sleep','ask');session.intimacyConsent=p.id;openModal(`${p.name} · 今夜`,r.rank,`<div class="scene-text">${line?`<span class="mind-stage">${mindEscape(line.stage)}</span><br>你说：“${mindEscape(line.scene.player)}”<br><br>“${mindEscape(line.reply)}”<br><br>`:''}你又问：“那么，今夜愿不愿留下？累了也可以改日。”<br><br>对方看着你，答得很清楚：“我愿意。”</div><div class="opts"><button class="opt" data-action="intimacyConfirm"><b>留他过夜</b><small>另耗1行动、本次1次互动；今夜只安排一次。</small></button><button class="opt" data-action="intimacyCancel"><b>先歇着，改日再约</b><small>不扣行动和互动次数。</small></button></div>`,'相处 · 本人已同意');save();};
const visitBeforeMind=visit;
visit=function(id){ensureMinds();if(isAway()&&!regionOf(state.tour.region).people.includes(id)){toast('此人没有随行。回京后再见，或先回一封信。');return;}const before=state.ap;visitBeforeMind(id);if(session?.id===id&&state.ap<before){markContact(id);session.message=state.relations[id].rank?`“${mindLine(PEOPLE.find(p=>p.id===id))}”`:session.message;renderSession();save();}};
actions.visit=visit;
const renderSessionBeforeMind=renderSession;
renderSession=function(){renderSessionBeforeMind();if(session){const p=PEOPLE.find(p=>p.id===session.id);if(p&&!$('modalBody').querySelector('.mind-block'))$('modalBody').insertAdjacentHTML('afterbegin',mindBlock(p));}};
actions.backSession=renderSession;
const cancelBeforeMind=actions.intimacyCancel;actions.intimacyCancel=()=>{const id=session?.id;cancelBeforeMind();if(id){shiftMind(id,{security:2});rememberMind(id,'今夜改日再约，女帝没有勉强。','相处');save();}};

function mindLocation(day,id){return day.entries[id]?.[3]?.location||PEOPLE.find(p=>p.id===id)?.location||'quarters';}
function addMindMessage(p,kind='invite'){
 const e=state.ecology,m=state.relations[p.id].mind;if(e.inbox.filter(x=>!x.done).length>=12||e.inbox.some(x=>x.npc===p.id&&!x.done)||mindTick()-(m.lastMessage??-99)<4)return false;
 let data=null;if(kind==='event'){
  const pi=MIND_VOICE[p.type]??0,st=currentMind(p),r=state.relations[p.id];let es=FICTION_DATA.events.filter(x=>x.personality===pi&&x.trigger===st&&(!x.requiresRank||r.rank)&&(!x.requiresRank||p.romance)&&(x.domain!=='前朝'||(p.official&&r.officer))&&(x.domain!=='宫外'||wloc(p.location).zone==='outside')&&(x.domain!=='人际'||socialEdgesOf(p.id).length));
  es=es.filter(x=>mindTick()-(m.cooldowns[x.motif]??-99)>=x.cooldown);if(!es.length)return false;data=es[mindHash(`${p.id}-${todayKey()}`)%es.length];m.cooldowns[data.motif]=mindTick();
 }
 const msg={id:`letter-${++e.serial}`,npc:p.id,kind,tick:mindTick(),expires:mindTick()+3,done:false,opened:false,event:data?clone(data):null};e.inbox.push(msg);m.lastMessage=mindTick();rememberMind(p.id,kind==='event'?`有一件“${data.title}”的事，想当面说。`:'想请女帝得空时来坐坐，已经托人递话。','递话');return true;
}
function processMindDay(key,makeMessages=true){
 ensureMinds();const e=state.ecology,day=state.dailyHistory[key];if(e.days[key]||!day)return;e.days[key]=true;const tick=mindTick(),busy=new Set();let messages=0;
 for(const p of PEOPLE)if(state.relations[p.id].rank&&day.entries[p.id]){const places=['rest','library','rest','garden','music','rest'];day.entries[p.id].forEach((s,i)=>{if(s.location.startsWith('province-'))return;s.location=places[(i+state.day)%places.length];s.text=['在住处梳洗，留意今日安排。','读书、习字，把自己的事慢慢做完。','用饭歇息。','做完手头的小事，准备出门。','听曲或散步，不必一直等着召见。','回到住处休息。'][i];});}
 for(const mail of e.inbox){if(!mail.done&&!mail.opened&&tick>mail.expires){mail.done=true;mail.resolution='这次未能见面，来信已收进旧笺。';shiftMind(mail.npc,{expectation:-3});}}
 for(const p of PEOPLE){const r=state.relations[p.id],m=r.mind,gap=tick-m.lastContact,h=mindHash(`${key}-${p.id}`),loc=mindLocation(day,p.id),slot=day.entries[p.id]?.[3];
  shiftMind(p.id,{jealousy:-1.2,anger:-5,hurt:-.5,expectation:-.6});if(gap<7)shiftMind(p.id,{disappointment:-.4});
  if(r.rank&&gap>=7)shiftMind(p.id,{disappointment:gap>=15?2:1,expectation:-.4,security:-.4});if(m.disappointment>=38&&m.security<45)shiftMind(p.id,{distance:2});else shiftMind(p.id,{distance:-.4});
  if(m.appointment&&m.appointment.tick<tick){shiftMind(p.id,{disappointment:12,security:-6});m.broken++;rememberMind(p.id,'约好的日子过去了，女帝没有来，也没有另说。','失约');m.appointment=null;}
  for(const k of Object.keys(m.needs))m.needs[k]=clamp(m.needs[k]+({rest:7,company:5,recognition:3,freedom:3}[k]));
  const mood=currentMind(p),strategy=JEALOUS_STRATEGY[p.type]||JEALOUS_STRATEGY['温柔体贴'];let action,text;
  if(busy.has(p.id)){m.lastAction='访友';continue;}
  if(m.needs.rest>75){action='rest';text='推掉了不急的应酬，关门歇了半日。';m.needs.rest-=40;}
  else if(['恼怒','疏离'].includes(mood)){action='retreat';text='照常做完该做的事，之后独自待着，暂不赴约。';m.needs.freedom-=15;}
  else if(r.rank&&mood==='吃醋'){const by={'温柔体贴':'seekcare','清冷克制':'quiet','明朗直率':'direct','骄矜自尊':'boundary','敏感多思':'compare','圆融世故':'invite','严正守礼':'fairness','野心进取':'duty','疏朗洒脱':'walk','务实重利':'wait','寡言重诺':'gift','戒备善谋':'withhold'};action=by[p.type];text=strategy[0];}
  else if(mood==='委屈'||mood==='失望'){action='seekcare';text='想把之前的不快说清，写了半封信，又收回袖里。';}
  else if(m.needs.company>50&&h%3!==0){
   const edges=socialEdgesOf(p.id).filter(ed=>{const oid=ed.a===p.id?ed.b:ed.a;return !busy.has(oid)&&mindLocation(day,oid)===loc;});const edge=edges[h%Math.max(1,edges.length)];
   if(edge){const oid=edge.a===p.id?edge.b:edge.a,q=PEOPLE.find(x=>x.id===oid),own=edge.a===p.id?'affAB':'affBA',back=own==='affAB'?'affBA':'affAB',liking=edge[own];action=liking<30?(h%2?'disagree':'reconcile'):h%5===0?'help':h%5===1?'cooperate':h%5===2?'friendcare':'visit';
    const verb={disagree:'说起旧事，意见不合，各自先停了话',reconcile:'把先前的误会说开了一点',help:'帮着把一件小事办妥',cooperate:'一起做完手头的事',friendcare:'问了问近日累不累，陪着坐了一会儿',visit:'碰面说了些近况'}[action];text=`与${q.name}${verb}。`;
    edge[own]=clamp(edge[own]+(action==='disagree'?-1:1));edge[back]=clamp(edge[back]+(action==='disagree'?0:1));edge.recent=`${date()}${state.day}日，在${wloc(loc).name}，${p.name}与${q.name}${verb}。`;
    if(slot)slot.text=text;const os=day.entries[oid]?.[3];if(os)os.text=`与${p.name}${verb}。`;rememberMind(oid,os?.text||text,'往来',true);state.relations[oid].mind.lastAction=action;state.relations[oid].mind.needs.company=clamp(state.relations[oid].mind.needs.company-20);m.needs.company-=22;busy.add(oid);
   }
  }
  if(!action){const options=r.rank?['learn','wait','gift','walk','family','boundary']:['work','learn','walk','family'];action=m.needs.freedom>65?'walk':m.needs.recognition>60&&p.official&&r.officer?'work':options[h%options.length];text=({work:MIND_PROFILE[p.id]?.independentGoal||`忙完${p.role.split('·')[0]}手头的一件事，才坐下来喝茶。`,learn:r.force>r.politics?'练了半个时辰的弓，把不稳的那几箭记下来。':'读了几页书，遇见不懂的地方先做了记号。',walk:'做完该做的事，沿着近处走了一圈散心。',family:'给家里写了信，问起旧日熟人的近况。',wait:'备好平日用的茶，之后继续做自己的事。',gift:'整理了一份小礼物，想等合适时亲手送出去。',boundary:'留出半日独处，不想把每一刻都用来应酬。'})[action];if(action==='work')m.needs.recognition=clamp(m.needs.recognition-25);if(action==='walk'||action==='boundary')m.needs.freedom=clamp(m.needs.freedom-24);}
  if(slot&&!busy.has(p.id))slot.text=text;m.lastAction=action;rememberMind(p.id,text,'自主日常',true);
  if(makeMessages&&messages<3&&!isAway()&&wloc(loc).zone!=='province'&&((r.rank&&h%3===0)||(!r.rank&&h%17===0))){if(addMindMessage(p,h%2===0?'event':'invite'))messages++;}
 }
 e.inbox=e.inbox.slice(-40);const keys=Object.keys(state.dailyHistory);for(const old of keys.slice(0,-14))delete state.dailyHistory[old];for(const old of Object.keys(e.days).slice(0,-60))delete e.days[old];if(state.logs.length>500)state.logs.splice(0,state.logs.length-500);
}
const buildBeforeMind=buildDay;
buildDay=function(){ensureMinds();const key=buildBeforeMind();if(!state.ecology.suspend)processMindDay(key);return key;};
const monthBeforeMind=actions.nextMonth;
actions.nextMonth=()=>{
 if(isAway()){monthBeforeMind();return;}ensureMinds();const elapsed=state.elapsed,day=state.day;const broken=state.promises.filter(x=>!x.done&&x.due<elapsed+1).map(x=>x.id);
 // Simulate each remaining day so jumping to next month cannot erase waiting or promises.
 for(let i=day+1;i<=30;i++){state.day=i;const key=buildBeforeMind();processMindDay(key,false);}state.day=day;state.ecology.suspend=true;try{monthBeforeMind();}finally{state.ecology.suspend=false;}
 if(state.elapsed!==elapsed){if(day!==1&&!state.ecology.days[`${state.elapsed}-${day}`])delete state.dailyHistory[`${state.elapsed}-${day}`];for(const id of broken){shiftMind(id,{disappointment:15,security:-8});state.relations[id].mind.broken++;rememberMind(id,'下月再见的约定没有等到。想知道这一回是不是又被忘了。','失约');}buildDay();render();}
};

function openMindDetail(id){ensureMinds();const p=PEOPLE.find(p=>p.id===id);if(!p)return;const r=state.relations[id],m=r.mind,profile=MIND_PROFILE[id];openModal(`${p.name} · 心态与近况`,`${p.type} · ${currentMind(p)}`,`${mindBlock(p)}<div class="mind-meters">${[['吃醋',m.jealousy],['失望',m.disappointment],['安心',m.security],['期待',m.expectation]].map(([k,v])=>`<div><small>${k}</small><div class="meter"><i style="width:${Math.round(v)}%"></i></div><b>${Math.round(v)}</b></div>`).join('')}</div><div class="record"><b>自己的打算</b><p>${mindEscape(profile?.goal)}。${mindEscape(profile?.independentGoal)}</p><p class="mini">最近一次主动行动：${mindEscape(FICTION_DATA.autonomy.find(x=>x[0]===m.lastAction)?.[1]||'整理日常')}</p>${m.appointment?`<p>已约：${date(Math.floor((m.appointment.tick-1)/30))}${(m.appointment.tick-1)%30+1}日见面。</p>`:''}</div><h3>最近留下的心事</h3>${m.memories.slice(-8).reverse().map(x=>`<div class="record"><span class="mini">${date(x.month)}${x.day}日 · ${x.kind}</span><p>${mindEscape(x.text)}</p></div>`).join('')}<div class="actions"><button class="btn primary" data-action="visit" data-id="${id}">去见一面 · 1行动</button>${r.rank?`<button class="btn ghost" data-action="publicMeal" data-id="${id}">一起用晚膳 · 1行动</button>`:''}<button class="btn ghost" data-action="mindLetters">查看人物来信</button></div>`,'人物心事');}
function inboxPanel(){ensureMinds();const pending=state.ecology.inbox.filter(x=>!x.done),old=state.ecology.inbox.filter(x=>x.done).slice(-5).reverse();openModal('人物来信','有人想见你，也有人想把一句话说清。',`<p class="mini">普通邀请可以婉拒或另约。答应了的日子请记着；若有事，也可以提前说明。</p>${pending.map(x=>{const p=PEOPLE.find(p=>p.id===x.npc);return `<div class="letter-card"><span class="tag">${p.name} · ${currentMind(p)}</span><h3>${x.event?.title||'想请你来坐一会儿'}</h3><p>“${mindEscape(mindLine(p))}”</p><div class="actions"><button class="btn primary" data-action="mindLetter" data-id="${x.id}">${x.opened?'继续谈这件事':'看看这封信'}</button><button class="text-btn" data-action="mindDetail" data-id="${p.id}">看看近况</button></div></div>`;}).join('')||'<div class="empty"><p>暂时没有新信。大家正过着各自的日子。</p></div>'}${old.length?'<h3>收进匣里的旧笺</h3>':''}${old.map(x=>`<div class="record"><b>${PEOPLE.find(p=>p.id===x.npc).name}</b><p>${mindEscape(x.resolution)}</p></div>`).join('')}`,'人情往来');save();}
function openMindLetter(id){const mail=state.ecology.inbox.find(x=>x.id===id&&!x.done);if(!mail)return;const p=PEOPLE.find(p=>p.id===mail.npc);if(mail.kind==='event'&&mail.opened){showMindEvent(mail);return;}openModal(`${p.name}递来的话`,currentMind(p),`<div class="scene-text">“${mindEscape(mindLine(p))}”${mail.event?`<p>还有件“${mindEscape(mail.event.title)}”的小事，想当面与你说。</p>`:''}</div><div class="opts"><button class="opt" data-action="mindReply" data-id="${id}|now"><b>现在去，当面听他说</b><small>1行动；${mail.event?'进入三项事件选择':'见面后仍可选八类互动'}</small></button><button class="opt" data-action="mindReply" data-id="${id}|later"><b>回信，约好明日见面</b><small>不扣行动；可以先改期，也请记得赴约。</small></button><button class="opt" data-action="mindReply" data-id="${id}|decline"><b>说明近日忙，先不许下日子</b><small>婉拒这次邀约，关系不受罚。</small></button></div>`,'人物来信');}
function replyMindLetter(raw){const [id,kind]=raw.split('|'),mail=state.ecology.inbox.find(x=>x.id===id&&!x.done);if(!mail)return;const p=PEOPLE.find(p=>p.id===mail.npc),m=state.relations[p.id].mind;
 if(kind==='now'){if(isAway()){toast('正在巡游，请回京后再约宫里的人。');return;}if(mail.kind==='event'){if(!pay(1))return;mail.opened=true;markContact(p.id);save();showMindEvent(mail);}else{const before=state.ap;visit(p.id);if(state.ap<before){mail.done=true;mail.resolution='女帝亲自来见，话也终于说出口。';shiftMind(p.id,{security:4});save();}}return;}
 if(kind==='later'){m.appointment={tick:mindTick()+1,source:id};mail.resolution='另约明日，已经回了准信。';shiftMind(p.id,{expectation:8});rememberMind(p.id,'女帝亲自回信，约好明日见面。','期待');}
 if(kind==='decline'){mail.resolution='说明近日忙，没有把“改日”说成新的承诺。';shiftMind(p.id,{security:1,expectation:-3});rememberMind(p.id,'这次邀约被婉拒，原因已经说清，不必整夜等。','回信');}mail.done=true;save();inboxPanel();
}
function showMindEvent(mail){const p=PEOPLE.find(p=>p.id===mail.npc),e=mail.event;if(!e)return;const body=e.body.replaceAll('{NPC}',p.name);openModal(e.title,`${p.name} · ${e.domain}`,`<div class="scene-text">${mindEscape(body)}</div><div class="opts">${e.choices.map((c,i)=>`<button class="opt" data-action="mindEventChoose" data-id="${mail.id}|${i}"><b>${mindEscape(c.label)}</b><small>听完，再决定如何回应。</small></button>`).join('')}</div>`,'当面说开的事');}
function chooseMindEvent(raw){const [id,index]=raw.split('|'),mail=state.ecology.inbox.find(x=>x.id===id&&!x.done&&x.opened);const c=mail?.event?.choices[Number(index)];if(!c)return;const p=PEOPLE.find(p=>p.id===mail.npc),r=state.relations[p.id];mail.done=true;mail.choice=Number(index);mail.resolution=c.outcome.replaceAll('{NPC}',p.name);change(p.id,c.aff);r.loyalty=clamp(r.loyalty+c.loyalty);shiftMind(p.id,{jealousy:c.jealousy,disappointment:c.disappointment,security:c.security});rememberMind(p.id,`${mail.event.title}：${c.label}。${mail.resolution}`,'回响',true);if(c.security>0)shiftMind(p.id,{hurt:-3,anger:-3});log(`${p.name} · ${mail.event.title}：${c.label}。`,'人情');render();result(mail.event.title,mail.resolution,`这一回的相处已经记下。心事会随着后续相处慢慢变化。`);save();}
function publicMeal(id){const p=PEOPLE.find(p=>p.id===id);if(!p||!state.relations[id].rank)return;if(isAway()){toast('请回京后再安排宫中晚膳。');return;}if(['恼怒','疏离'].includes(currentMind(p))){result(`${p.name}想先静一静`,'“饭先不摆了。我想等平静些，再把之前的话说清。”','没有扣行动，可以另找机会听听心事。');return;}if(state.ecology.mealDay===todayKey()){toast('今晚已约过晚膳，明日再安排。');return;}if(!pay(1))return;state.ecology.mealDay=todayKey();markContact(id);publicFavor(id,'一起用了晚膳');const day=state.dailyHistory[buildDay()];if(day.entries[id])day.entries[id][4]={slot:'傍晚',location:'rest',text:'与女帝一起用晚膳，饭后说了些闲话。'};rememberMind(id,'一起吃了顿寻常的饭，宫人照旧记了安排。','陪伴',true);render();result('好好吃一顿饭',`${p.name}把手边的事放下，坐到你身旁。菜端上来时，你们没有急着说什么。`, '这次公开陪伴会被宫中其他人知道。');}
const npcCardBeforeMind=npcCard;npcCard=function(p){return npcCardBeforeMind(p).replace('<div class="actions">',`<div class="mind-mini"><span>${currentMind(p)}</span><button class="text-btn" data-action="mindDetail" data-id="${p.id}">近况与心态</button></div><div class="actions">`);};
const archiveBeforeMind=archive;archive=function(id){archiveBeforeMind(id);const p=PEOPLE.find(p=>p.id===id);if(p)$('modalBody').insertAdjacentHTML('afterbegin',mindBlock(p));};actions.archive=archive;actions.personNotes=archive;
const dailyPanelBeforeMind=dailyPanel;dailyPanel=function(id,key){dailyPanelBeforeMind(id,key);const p=PEOPLE.find(p=>p.id===id);if(p)$('modalBody').insertAdjacentHTML('afterbegin',mindBlock(p));};
const detailBeforePalaceAim=openMindDetail;
openMindDetail=function(id){detailBeforePalaceAim(id);const p=PEOPLE.find(p=>p.id===id),r=state.relations[id];if(!p||!r)return;const box=$('modalBody').querySelector('.record p');if(r.rank&&box){const own={xu:'朝中的差事已交接，想把从前没读完的书慢慢读完，也盼着私下相见不只隔着宫人传话。',song:'想写完那半支曲子；也留一点时间，只弹自己喜欢的东西。',lu:'军中的差事已交清，仍想把弓练好，也想把那道总做不好的点心学会。'};box.textContent=`${MIND_PROFILE[id]?.goal}。${own[id]||'想学点自己喜欢的东西，给家里写信，也同宫里合得来的人保持往来。'}`;}const link=$('modalBody').querySelector('.mind-block .text-btn');if(link)link.remove();};
Object.assign(actions,{mindDetail:openMindDetail,mindLetters:inboxPanel,mindLetter:openMindLetter,mindReply:replyMindLetter,mindEventChoose:chooseMindEvent,publicMeal});
const renderBeforeMind=render;render=function(){ensureMinds();renderBeforeMind();if(state.tab==='home'){const n=state.ecology.inbox.filter(x=>!x.done).length,ranked=PEOPLE.filter(p=>state.relations[p.id].rank),div=document.createElement('div');div.className='card mind-home section-space';div.innerHTML=`<div class="section-heading"><h3>后宫近况 · 人物来信</h3><span class="tag">${n}封待回</span></div><p>${ranked.length?ranked.slice(0,4).map(p=>`${p.name} · ${currentMind(p)}`).join('　'):'宫中尚无伴侣。宫外的朋友，也会有自己的生活。'}</p><div class="actions"><button class="btn primary" data-action="mindLetters">拆开来信</button>${ranked.slice(0,3).map(p=>`<button class="btn ghost" data-action="mindDetail" data-id="${p.id}">${p.name}</button>`).join('')}</div>`;document.querySelector('.court-entry')?.after(div);}if(state.tab==='people'){document.querySelector('.person-map-link')?.insertAdjacentHTML('afterend','<button class="text-btn" data-action="mindLetters">人物来信 →</button>');}save();};
const resetBeforeMind=actions.resetConfirm;actions.resetConfirm=()=>{resetBeforeMind();ensureMinds();buildDay();save();};
ensureMinds();
const mindStyle=document.createElement('style');mindStyle.textContent=`.mind-block{background:#f6ece7;border-left:3px solid #b38188;border-radius:10px;padding:12px 14px;margin:12px 0}.mind-block p{font-size:13px;line-height:1.8;margin:8px 0}.mind-block small{font-size:10px;color:#8a747a}.mind-block .section-heading{margin:0}.mind-mini{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#976277}.mind-mini .text-btn{font-size:11px;padding:4px}.mind-stage{font-size:12px;color:#947881;line-height:1.9}.mind-meters{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:20px 0}.mind-meters>div{display:grid;grid-template-columns:30px 1fr 22px;align-items:center;gap:7px}.mind-meters b{font-size:11px}.mind-meters .meter{height:7px;margin:0}.letter-card{padding:17px 14px;border:1px solid #e5d3c4;border-radius:12px;margin:12px 0;background:#fffaf2}.letter-card h3{font-size:17px;margin:11px 0}.letter-card p,.mind-home p{font-size:13px;line-height:1.9}.mind-home .actions{flex-wrap:wrap}.sheet:has(.interaction-categories) .mind-block{padding:8px 12px;margin:8px 0}.sheet:has(.interaction-categories) .mind-block p{margin:3px 0;font-size:11px}.sheet:has(.interaction-categories) .mind-block small{display:none}@media(max-width:400px){.mind-meters{gap:9px}.mind-block .text-btn{font-size:11px}.mind-home .btn{font-size:12px}}`;document.head.appendChild(mindStyle);
