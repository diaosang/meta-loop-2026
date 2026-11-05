/* V13: complete conversational turns, witnessed jealousy, invitations and callbacks. */
(function(){
 'use strict';
 const esc=mindEscape, DATA=PALACE_LIFE_DATA;
 const get=id=>PEOPLE.find(p=>p.id===id), rel=p=>state.relations[typeof p==='string'?p:p.id];
 const profile=p=>DATA.profiles[p.type]||DATA.profiles['温柔体贴'];
 const adult=p=>p&&p.age+Math.floor((state.elapsed-2)/12)>=18;
 const calm=p=>!['恼怒','疏离','委屈','失望','戒备'].includes(currentMind(p));
 function ensure(){
  ensureMinds();
  const v=state.palaceLife=state.palaceLife||{version:13,serial:0,days:{},people:{},facts:[],episodes:[],keepsakes:[],followups:[]};
  v.version=13;v.serial=v.serial||0;
  if(v.dialogueRevision!=='13.2'){for(const ep of v.episodes||[])if(ep.phase==='awaiting')ep.openingTurn=null;v.dialogueRevision='13.2';}
  for(const k of ['days','people'])v[k]=v[k]||{};
  for(const k of ['facts','episodes','keepsakes','followups'])v[k]=Array.isArray(v[k])?v[k]:[];
  for(const p of PEOPLE)v.people[p.id]=v.people[p.id]||{disclosed:false,seen:[],boundaryUntil:0,giftDays:[],invitationTick:-999};
  return v;
 }
 function whom(p){return __courtVoiceAudit.context(p).self;}
 function fill(text,p,ep){return String(text).replaceAll('{self}',whom(p)).replaceAll('{rival}',get(ep?.rival)?.name||'那位熟人');}
 function content(p,key,index,ep){
  if(typeof DALIANG_DATA!=='undefined'&&p.id==='xu'&&key==='jealous')return {text:['陛下今日另有召见，臣知道。阁务都记在这里，先放下了。','无妨。陛下既有闲，臣也不必总站着回话。','臣没有将公事搁下。至于方才的话……陛下不必在人前再问。','那臣先告退。余下阁务会照常办妥，不误陛下用人。'][index]||'臣先将这页收好。',narrative:false};
  const special=DATA.bespoke[p.id];
  if(key==='snack'&&special){const k=['snack','share','tease','space'][index];if(special[k])return {text:special[k],narrative:true};}
  if(key==='jealous'&&index===0&&special?.jealous)return {text:fill(special.jealous,p,ep),narrative:true};
  return {text:fill(profile(p)[key]?.[index]||'',p,ep),narrative:false};
 }
 function episode(id){return ensure().episodes.find(e=>e.id===id);}
 function pending(p,kind){return ensure().episodes.find(e=>e.npc===p.id&&(!kind||e.kind===kind)&&!['done','declined','expired'].includes(e.phase));}
 function create(p,kind,extra={}){
  const v=ensure(),ep={id:'life13-'+(++v.serial),npc:p.id,kind,created:mindTick(),phase:'new',expires:mindTick()+5,...extra};
  v.episodes.push(ep);return ep;
 }
 function learn(p,fact,source,method){
  const v=ensure(),own=v.people[p.id];if(own.seen.some(x=>x.fact===fact.id))return false;
  own.seen.push({fact:fact.id,source,method,tick:mindTick()});own.seen=own.seen.slice(-24);
  if(!rel(p).rank||!p.romance||!adult(p)||rel(p).aff<35||rel(p).love<8)return true;
  const m=rel(p).mind,gap=Math.max(0,mindTick()-m.lastContact),sensitivity=MIND_PROFILE[p.id]?.jealousySensitivity||1;
  const edge=socialEdgesOf(p.id).find(e=>e.a===fact.subject||e.b===fact.subject);
  const closeness=edge?Math.min(edge.affAB,edge.affBA):40;
  const amount=Math.max(3,Math.min(16,Math.round((7+Math.min(gap,12)*.55)*sensitivity*(1-m.security/180)*(closeness>=65?.65:closeness<30?1.2:1))));
  shiftMind(p.id,{jealousy:amount});
  const why=method==='witness'?'午后亲眼见到':method==='ledger'?'从公开的膳单得知':get(source)?.name+'在真实往来时提及';
  rememberMind(p.id,why+'女帝与'+get(fact.subject).name+fact.occasion+'。有些在意，想听一句明白的话。','有据的醋意');
  const limit=v.episodes.filter(e=>e.kind==='jealous'&&e.created===mindTick()&&!['done','declined','expired'].includes(e.phase)).length;
  if(limit<3&&!pending(p,'jealous'))create(p,'jealous',{rival:fact.subject,fact:fact.id,knowledge:why});
  return true;
 }
 publicFavor=function(id,occasion){
  const v=ensure(),p=get(id);if(!p)return;
  if(v.facts.some(f=>f.subject===id&&f.tick===mindTick()&&f.occasion===occasion))return;
  const ledger=/晚膳|用膳|宴/.test(occasion),place=/散步|赏花/.test(occasion)?'garden':'rest';
  const fact={id:'favor13-'+(++v.serial),subject:id,occasion:String(occasion),tick:mindTick(),place,scope:ledger?'ledger':'witness'};
  v.facts.push(fact);v.facts=v.facts.slice(-60);
  state.ecology.attention.push({id,tick:mindTick(),occasion,fact:fact.id});state.ecology.attention=state.ecology.attention.slice(-24);
  shiftMind(id,{security:5,expectation:6,jealousy:-4});
  const day=state.dailyHistory[todayKey()];
  const others=PEOPLE.filter(q=>q.id!==id&&rel(q).rank&&q.romance&&adult(q));
  others.sort((a,b)=>rel(b).mind.jealousy-rel(a).mind.jealousy||rel(b).aff-rel(a).aff);
  for(const q of others){if(ledger)learn(q,fact,'household','ledger');else if(day?.entries[q.id]?.[3]?.location===place)learn(q,fact,id,'witness');}
 };
 function followups(){
  const v=ensure();for(const f of v.followups){if(f.done||mindTick()<f.due)continue;f.done=true;const p=get(f.npc);if(!p)continue;
   const m=rel(p).mind,settled=m.jealousy<32&&m.anger<35;
   const text=profile(p).echo[f.choice==='space'?2:settled?0:1];
   const mail={id:'life13-echo-'+(++v.serial),npc:p.id,kind:'invite',tick:mindTick(),expires:mindTick()+4,done:false,opened:false,voiceText:fill(text,p),life13:f.episode};
   state.ecology.inbox.push(mail);rememberMind(p.id,text,'相处后续');
   log(p.name+'递来一张短笺，接着前日说开的心事。','人物来信',p.id);
  }
 }
 function processDay(key){
  const v=ensure();if(v.days[key])return;v.days[key]=true;const tick=mindTick(),day=state.dailyHistory[key];
  for(const e of v.episodes){if(e.phase==='scheduled'&&tick>e.due){e.phase='expired';continue;}if(['new','awaiting'].includes(e.phase)&&tick>e.expires){e.phase='expired';const p=get(e.npc);if(p)rememberMind(p.id,'这回未能把小话题说完，先收起，不把沉默当成拒绝。','小事暂歇');}}
  // A witness can tell a friend only when their actual daily records show a meeting.
  const transfers=[];
  for(const fact of v.facts.filter(f=>f.scope==='witness'&&tick-f.tick<=5))for(const p of PEOPLE){
   const known=v.people[p.id].seen.find(x=>x.fact===fact.id&&x.tick<tick);if(!known)continue;
   const text=day?.entries[p.id]?.[3]?.text||'';
   for(const edge of socialEdgesOf(p.id)){const q=get(edge.a===p.id?edge.b:edge.a);if(!q||q.id===fact.subject||Math.min(edge.affAB,edge.affBA)<55)continue;
    if(text.includes(q.name)||(day?.entries[q.id]?.[3]?.text||'').includes(p.name))transfers.push([q,fact,p.id]);}
  }
  for(const [p,fact,source]of transfers)learn(p,fact,source,'friend');
  followups();
  // Invitations arise from a continuing personal plan and known companionship, not an invisible affection roll.
  if(!isAway()){
   const pool=PEOPLE.filter(p=>{const r=rel(p),n=v.people[p.id],plan=r.mind.plan;return adult(p)&&storyInvitationRoll(p)&&calm(p)&&!pending(p)&&tick-n.invitationTick>=7&&tick>n.boundaryUntil&&plan&&['seekcare','prepare','learn','walk'].includes(plan.kind)&&plan.progress>=1;});
   pool.sort((a,b)=>rel(b).mind.expectation-rel(a).mind.expectation||mindHash(key+a.id)-mindHash(key+b.id));
   const room=Math.max(0,3-v.episodes.filter(e=>e.kind==='invite'&&e.phase==='new').length);
   for(const p of pool.slice(0,Math.min(2,room))){if(!storyInvitationRoll(p))continue;const e=create(p,'invite',{plan:rel(p).mind.plan.id||rel(p).mind.plan.started});v.people[p.id].invitationTick=tick;storyInvitationSent(p);rememberMind(p.id,'做完自己的安排后，亲手递出一张请帖。能被婉拒，也愿等一个准信。','主动邀约');log(p.name+'递来一张小请帖，想分一点闲暇给你。','人物来信',p.id);e.expires=tick+4;}
  }
  for(const old of Object.keys(v.days).slice(0,-90))delete v.days[old];
  v.episodes=v.episodes.filter(e=>!['done','expired','declined'].includes(e.phase)||tick-e.created<45).slice(-90);
  v.followups=v.followups.filter(f=>!f.done||tick-f.due<40).slice(-60);
 }
 function title(ep){return ep.kind==='jealous'?'一盏有点酸的茶':ep.kind==='invite'?'小请帖':ep.kind==='gift'?'带来的点心':'分着吃';}
 function selected(ep,mode=0){const p=get(ep.npc),key=ep.kind==='gift'?'gift':ep.kind;return content(p,key,key==='gift'?(ep.giftVariant||0):mode,ep);}
 function row(ep,index=0,prompt){const p=get(ep.npc),data=selected(ep,index);return {id:ep.id+':'+index,semantic:'life13:'+ep.npc+':'+ep.kind+':'+(ep.fact||ep.giftVariant||ep.plan||'first')+':'+index,
  category:'chat',topic:'v13:'+ep.kind,player:prompt||({jealous:'怎么了，瞧着不大高兴？',snack:'闻着很香，你在吃什么？',invite:'朕来了，让朕看看。',gift:'给你带的，尝尝。'}[ep.kind]),
  stage:'',reply:data.text,narrative:data.narrative,lifeFact:ep.fact||null};}
 function start(ep){
  if(!ep||!session||session.id!==ep.npc||session.left<1)return false;
  const p=get(ep.npc);if(!p)return false;
  if(!calm(p)){session.response='<span class="mind-stage">他摇了摇头：“我现在笑不出来。方才的事，还没说完呢。”</span>';renderSession();return false;}
  if(['done','declined','expired'].includes(ep.phase)){toast('这件事已经聊过了。');return false;}
  if(ep.phase==='awaiting'){session.life13=ep.id;session.response=__courtVoiceAudit.renderTurn(ep.openingTurn||row(ep));renderSession();return true;}
  const opening=row(ep);if(!__courtVoiceAudit.perform(p,opening,{aff:ep.kind==='jealous'?0:2}))return false;
  ep.openingTurn=opening;
  ep.phase='awaiting';ep.started=mindTick();ep.expires=Math.max(ep.expires,mindTick()+3);session.life13=ep.id;
  if(ep.kind==='snack')ensure().people[p.id].disclosed=true;
  renderSession();save();return true;
 }
 function choices(ep){
  if(ep.kind==='jealous')return [['share','朕这不是来找你了么，坐近些。','陪他坐一会儿。'],['tease','怎么闻着一股醋味？','熟悉后可逗一句。'],['space','今日还有事，朕先走了。','告辞；不扣好感。'],['together','叫他也来，一起喝杯茶。','额外1行动；两人同席。']];
  if(ep.kind==='invite')return [['share','来，让朕看看。','现在赴约。'],['tease','今日赶不及了，明日来找你。','约明日；提前见面不算赴约。'],['space','今日不得闲，你先忙吧。','婉拒；不另许日子。']];
  if(ep.kind==='gift')return [['share','喜欢就好，朕也尝一口。','一起尝尝。'],['tease','那下回换你替朕挑。','笑着讨下一回。'],['space','慢慢吃，朕先走了。','送到便告辞。']];
  return [['share','朕吃这块，你吃那块。','分着吃。'],['tease','那你的这份，也归朕了。','伸手逗他；熟悉后可选。'],['space','你先吃，朕还有事。','先告辞。']];
 }
 function canTease(p){return socialTier(p)!=='stranger'&&rel(p).trust>=45&&rel(p).aff>=40&&rel(p).mind.anger<25&&rel(p).mind.hurt<25;}
 function errorFor(ep,choice){const p=get(ep.npc);if(choice==='tease'&&ep.kind!=='invite'&&!canTease(p))return '还不熟，先别逗他。';
  if(choice==='tease'&&ep.kind==='invite'&&rel(p).mind.appointment)return '已有一个约定，请先赴约或明确改期。';
  if(choice==='together'){if(state.ap<1)return '需额外1行动。';if(isAway())return '请回京后再安排两人同席。';if(!get(ep.rival)||!rel(ep.rival).rank)return '另一位暂不在宫中，先单独说开。';}return '';}
 function respond(raw){const [id,choice]=String(raw).split('|'),ep=episode(id);if(!ep||ep.phase!=='awaiting'||!session||session.id!==ep.npc||session.left<1)return;
  const opt=choices(ep).find(x=>x[0]===choice);if(!opt)return;const p=get(ep.npc),gate=errorFor(ep,choice);if(gate){toast(gate);return;}
  const index=choice==='share'?1:choice==='tease'?2:choice==='space'?3:4;
  let turn;
  if(ep.kind==='gift')turn={...row(ep,0,opt[1]),id:ep.id+':reply',semantic:ep.id+':gift-response',reply:profile(p).giftAfter[choice==='space'?2:choice==='tease'?1:0],narrative:false};
  else turn=row(ep,index,opt[1]);
  const gain=choice==='space'?0:ep.kind==='jealous'?2:3;
  if(!__courtVoiceAudit.perform(p,turn,{aff:gain}))return;
  const v=ensure(),own=v.people[p.id];ep.phase='done';ep.choice=choice;ep.resolved=mindTick();ep.outcome=turn.reply;session.life13=null;
  if(ep.kind==='jealous'){
   shiftMind(p.id,choice==='space'?{jealousy:-2,security:2}:choice==='tease'?{jealousy:-4,security:3}:{jealousy:-8,security:5,hurt:-2});
   v.followups.push({episode:ep.id,npc:p.id,choice,due:mindTick()+2,done:false});
  }
  if(choice==='space')own.boundaryUntil=mindTick()+3;
  if(ep.kind==='invite'&&choice==='tease'){rel(p).mind.appointment={tick:mindTick()+1,life13:ep.id};ep.phase='scheduled';ep.due=mindTick()+1;rememberMind(p.id,'约好明日再见，提前碰面不算赴约。','有日子的约定');}
  if(ep.kind==='snack'&&choice!=='space'){
   const token={id:'keepsake13-'+(++v.serial),npc:p.id,title:profile(p).keepsake,from:ep.id,tick:mindTick(),text:p.name+'与你将点心分成两半，留下这一张小笺。'};
   v.keepsakes.push(token);v.keepsakes=v.keepsakes.slice(-80);ep.keepsake=token.id;
  }
  if(choice==='together'){
   pay(1);const q=get(ep.rival);shiftMind(q.id,{security:3,jealousy:-3});let edge=socialEdgesOf(p.id).find(e=>e.a===q.id||e.b===q.id);
   if(!edge){edge={a:p.id,b:q.id,affAB:40,affBA:40,kind:'有据的竞争',origin:'公开陪伴之后，两人由女帝邀至同席。'};state.socialEdges.push(edge);}
   edge.affAB=clamp(edge.affAB+2);edge.affBA=clamp(edge.affBA+2);edge.recent=p.name+'与'+q.name+'同席，各自说清了自己的感受。';
   const back=fill(profile(q).atTea,q,ep);session.response+='<div class="v13-other"><b>'+esc(q.name)+'</b><p>“'+esc(back)+'”</p></div>';
   rememberMind(q.id,'与'+p.name+'一同受邀，把公开陪伴之后的心事当面说清。','同席说开',true);
   const day=state.dailyHistory[todayKey()];for(const who of [p,q])if(day?.entries[who.id])day.entries[who.id][3]={slot:'下午',location:'rest',text:'与女帝、'+(who===p?q.name:p.name)+'一起用茶，各自说清了原委。'};
   recordPublicChoice(ep,p,q);
  }
  rememberMind(p.id,title(ep)+'：女帝选择“'+opt[1]+'”。'+turn.reply,'共同小事',true);
  log(p.name+' · '+title(ep)+'：'+opt[1]+'。','宫墙小事',p.id);render();renderSession();save();
 }
 function recordPublicChoice(ep,p,q){const v=ensure();v.followups.push({episode:ep.id,npc:q.id,choice:'share',due:mindTick()+2,done:false});log(p.name+'与'+q.name+'同席后，关系留下新的回响。','人物往来');}
 function gift(p){const v=ensure(),own=v.people[p.id];if(!own.disclosed){toast('先亲口问过他的喜好，再挑一份小点心。');return;}
  if(own.giftDays.includes(todayKey())){toast('今日已送过这份心意，留些新鲜给下回。');return;}
  if(state.money<3){toast('这份小点心需内库3。');return;}if(!session||session.id!==p.id||session.left<1)return;
  const turns=rel(p).mind.turns,index=profile(p).gift.findIndex((t,i)=>!turns.some(x=>x.semantic==='life13:'+p.id+':gift:'+i+':0'));
  if(index<0){toast('最近几回赠礼已经说得很清楚，换一件新事相处吧。');return;}
  const ep=create(p,'gift',{giftVariant:index});const r=row(ep);r.reply=fill(profile(p).gift[index],p,ep);r.semantic='life13:'+p.id+':gift:'+index+':0';
  if(!__courtVoiceAudit.perform(p,r,{aff:3})){ep.phase='expired';return;}
  state.money-=3;own.giftDays.push(todayKey());own.giftDays=own.giftDays.slice(-30);ep.phase='awaiting';ep.openingTurn=r;session.life13=ep.id;rememberMind(p.id,'女帝按我亲口说过的喜好，送来'+(DATA.bespoke[p.id]?.food||profile(p).food)+'。','记得偏好',true);render();renderSession();save();
 }
 const priorTopics=topicsFor;
 topicsFor=function(category,p,r){const rows=priorTopics(category,p,r);if(category==='chat'){
  const v=ensure(),ep=pending(p,'jealous')||pending(p,'invite')||pending(p);
  if(ep)rows.unshift(['v13:episode:'+ep.id,'接着上回的话说','上回没说完。']);
  if(!v.people[p.id].disclosed)rows.unshift(['v13:snack','尝尝他的点心','坐下聊两句。']);
  else rows.unshift(['v13:gift','带一份他爱吃的点心','内库3；每日一次，受每日好感上限约束。']);
 }return rows;};
 const priorTopic=interactionTopic;
 interactionTopic=function(id){if(!String(id).startsWith('v13:'))return priorTopic(id);if(!session||session.left<1||session.section!=='chat')return;const p=get(session.id);
  if(id==='v13:snack'){if(ensure().people[p.id].disclosed){toast('这份喜好已经听他亲口说过了。');return;}const ep=pending(p,'snack')||create(p,'snack');start(ep);}
  else if(id==='v13:gift')gift(p);else if(id.startsWith('v13:episode:')){const ep=episode(id.slice(12));if(ep?.npc===p.id)start(ep);}
 };
 actions.interactionTopic=interactionTopic;
 function decorateSession(){if(!session)return;const ep=episode(session.life13);if(!ep||ep.phase!=='awaiting')return;const p=get(ep.npc),b=$('modalBody');if(!b||b.querySelector('.v13-replies'))return;
  const labels={jealous:{share:'陪他坐一会儿',tease:'轻轻逗他一句',space:'先告辞',together:'请两人同席'},invite:{share:'现在赴约',tease:'改约明日',space:'婉拒邀约'},gift:{share:'一起尝尝',tease:'请他下回挑选',space:'送到后告辞'},snack:{share:'分着吃',tease:'逗他一下',space:'先告辞'}};
  const block='<section class="v13-replies"><div class="section-heading"><h3>如何回应</h3><span class="mini">每次回应占1次互动</span></div>'+choices(ep).map(([key,label,hint])=>{const reason=errorFor(ep,key);return '<button class="opt" data-action="v13Reply" data-id="'+ep.id+'|'+key+'" '+(session.left<1||reason?'disabled':'')+'><b>'+esc(labels[ep.kind]?.[key]||hint)+'</b><small>'+esc(reason||hint)+'</small></button>';}).join('')+'</section>';
  const scene=b.querySelector('.scene-text');if(scene)scene.insertAdjacentHTML('afterend',block);else b.insertAdjacentHTML('afterbegin',block);
 }
 const priorSession=renderSession;renderSession=function(){priorSession();decorateSession();};actions.backSession=renderSession;actions.v13Reply=respond;
 const priorVisit=visit;visit=function(id){const old=rel(id)?.mind?.appointment,oldTick=old?.tick;priorVisit(id);if(!session||session.id!==id)return;
  const ep=old?.life13?episode(old.life13):null;if(ep&&oldTick===mindTick()&&!rel(id).mind.appointment){ep.phase='done';ep.fulfilled=mindTick();rememberMind(id,'明日的邀约如期见到了，没有用提前的闲谈冒充赴约。','小约定成真',true);}
  const still=ensure().episodes.find(e=>e.npc===id&&e.phase==='scheduled'&&mindTick()>e.due);if(still){still.phase='expired';rememberMind(id,'那次小邀约未能如期见面，愿下回先说清变动。','邀约未赴');}
  renderSession();save();};actions.visit=visit;
 function panel(){const v=ensure(),pendingList=v.episodes.filter(e=>['new','awaiting','scheduled'].includes(e.phase)).slice(-8).reverse();openModal('宫墙小事','未赴的约、没说完的话，都收在这里。',
  '<p class="mini">日子写明了，再决定去不去。</p>'+pendingList.map(e=>{const p=get(e.npc);return '<article class="v13-letter"><span class="tag">'+esc(p.name)+' · '+esc(title(e))+'</span><p>'+esc(e.phase==='scheduled'?'已有约定，记得看清日子。':e.knowledge?'他留了话，想见你。':'有一张署了名的小笺。')+'</p>'+(e.knowledge?'<small class="mini">缘由：'+esc(e.knowledge)+'女帝与'+esc(get(e.rival)?.name)+'的公开陪伴。</small>':'')+'<button class="btn ghost wide" data-action="v13Open" data-id="'+e.id+'">'+(e.phase==='scheduled'?'看看约好的日子':'看看留了什么话')+'</button></article>';}).join('')+(pendingList.length?'':'<div class="empty small"><p>暂时没有新请帖。见面时选“闲谈”，也能发现他的小偏好。</p></div>')+
  '<h3 class="section-space">你们留过的小物件</h3>'+v.keepsakes.slice(-8).reverse().map(k=>'<div class="record"><b>'+esc(k.title)+'</b><p>'+esc(k.text)+'</p></div>').join('')+(v.keepsakes.length?'':'<p class="mini">匣里还空着。</p>'),'御前小笺 · V13.1');}
 actions.v13Panel=panel;
 actions.v13Open=id=>{const ep=episode(id);if(!ep||['done','declined','expired'].includes(ep.phase))return;const p=get(ep.npc);
  openModal(p.name+' · '+title(ep),ep.phase==='scheduled'?'约好的是'+date(Math.floor((ep.due-1)/30))+((ep.due-1)%30+1)+'日':'门口有人候着，等你回话。',
   '<div class="scene-text">'+esc(selected(ep).text)+'</div><div class="opts">'+
   '<button class="opt" data-action="v13Meet" data-id="'+ep.id+'"><b>亲自去一趟 · 1行动</b><small>见面聊。</small></button><button class="opt" data-action="v13Decline" data-id="'+ep.id+'"><b>回话说今日不便</b><small>婉拒；不扣好感。</small></button></div>','宫墙小事');save();};
 function getFact(ep){return ensure().facts.find(f=>f.id===ep.fact);}
 actions.v13Meet=id=>{const ep=episode(id);if(!ep)return;const oldAP=state.ap;visit(ep.npc);if(session?.id!==ep.npc||state.ap>=oldAP)return;
  if(ep.phase==='scheduled'){renderSession();return;}session.section='chat';start(ep);};
 actions.v13Decline=id=>{const ep=episode(id);if(!ep||['done','declined','expired'].includes(ep.phase))return;ep.phase='declined';ensure().people[ep.npc].boundaryUntil=mindTick()+3;
  const p=get(ep.npc);if(rel(p).mind.appointment?.life13===ep.id)rel(p).mind.appointment=null;rememberMind(p.id,'女帝说明近日不便，没有随口许诺；我也照自己的安排过日子。','坦诚婉拒');closeModal();render();save();toast('已回话说今日不便。');};
 const priorBuild=buildDay;buildDay=function(){const key=priorBuild();if(!state.ecology.suspend)processDay(key);return key;};
 const priorBlock=mindBlock;mindBlock=function(p){const base=priorBlock(p),own=ensure().people[p.id],ep=pending(p,'jealous');return base+(ep?'<p class="v13-cause">听闻：'+esc(ep.knowledge)+'女帝与'+esc(get(ep.rival)?.name)+'的公开陪伴。</p>':'')+(own.disclosed?'<p class="v13-preference">记得他爱吃：'+esc(DATA.bespoke[p.id]?.food||profile(p).food)+'</p>':'');};
 const priorRender=render;render=function(){ensure();priorRender();const screen=$('screen');if(state.tab==='home'&&screen&&!screen.querySelector('.v13-home')){
  const v=ensure(),n=v.episodes.filter(e=>['new','awaiting','scheduled'].includes(e.phase)).length;
  const html='<section class="card section-space v13-home"><div class="section-heading"><h3>宫墙小事</h3><span class="tag">'+n+' 件小心思</span></div><p>谁留了话，谁约了日子，去看看吧。</p><div class="actions"><button class="btn primary" data-action="v13Panel">看看小笺</button><button class="btn ghost" data-action="tab" data-id="people">去见个人</button></div><small class="mini">请帖与旧物都替你收着。</small></section>';
  const anchor=screen.querySelector('.court-entry');if(anchor)anchor.insertAdjacentHTML('afterend',html);else screen.insertAdjacentHTML('afterbegin',html);
 }save();};
 COURT_VOICE_DATA.rows.push(...DATA.voiceRows);__courtVoiceAudit.rows=COURT_VOICE_DATA.rows.length;
 const style=document.createElement('style');style.textContent=`.v13-home{background:linear-gradient(125deg,#fff7ee,#f9e9ec);border-color:#e1bdc3}.v13-home p{font-size:13px;line-height:1.9;color:#886576}.v13-home .mini{display:block;margin-top:11px}.v13-replies{margin:15px 0;padding:16px;border:1px solid #dec5c8;border-radius:14px;background:#fff8f1}.v13-replies .opt{background:#fffdf8}.v13-replies h3{font-size:16px;margin:0}.v13-other{border-left:2px solid #bca5b8;margin-top:12px;padding-left:12px}.v13-other b{font-size:12px;color:#99728b}.v13-other p{margin:5px 0;font-size:14px}.v13-cause,.v13-preference{font-size:11px!important;color:#9b7182!important;line-height:1.9!important;margin:7px 0!important}.v13-letter{border:1px solid #ead3d5;padding:14px;border-radius:12px;margin:12px 0;background:#fffbf7}.v13-letter p{font-size:13px;line-height:1.9;color:#8b6b76}.v13-letter .wide{margin-top:8px}.v13-replies .opt:disabled{opacity:.5}.sheet:has(.v13-replies) .talk-banner{margin:10px 0;gap:12px}.sheet:has(.v13-replies) .portrait.large{min-height:72px;height:72px}.sheet:has(.v13-replies) .portrait.large .portrait-head{top:14px}.sheet:has(.v13-replies) .portrait.large .portrait-robe{top:49px}.sheet:has(.v13-replies) .five-stats{margin:8px 0}.sheet:has(.v13-replies) .five-stats span{padding:6px 2px}.sheet:has(.v13-replies) .scene-text{margin:10px 0;padding:14px}@media(max-width:430px){.v13-replies{padding:12px}.v13-replies .section-heading{display:block}.v13-replies .opt{padding:12px}.v13-replies .opt b{font-size:13px}.v13-home h3{font-size:15px}}`;document.head.appendChild(style);
 window.__palaceLifeAudit={version:13,ensure,create,start,respond,processDay,learn,publicFavor:(id,occasion)=>publicFavor(id,occasion),gift,choices,content,profile,episode,inspect:()=>({episodes:ensure().episodes,facts:ensure().facts,keepsakes:ensure().keepsakes}),authoredReplies:DATA.voiceRows.length};
 ensure();buildDay();save();
})();
