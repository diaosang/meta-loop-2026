/* Person first: preview is free; a real meeting owns three turns. Old commands remain canonical. */
const npc17Esc=mindEscape;
const npc17Legacy={visit,renderSession,topic:interactionTopic,render,day:buildDay,card:npcCard,storyMeet:actions.storyMeet};
let npc17Entering=null;
function npc17Owner(){return state.world16?.dynasty.rulerId||'ruler-nine';}
function npc17Root(create=false){
 if(!state.npc17){if(!create)return null;state.npc17={version:1,serial:0,reigns:{}};}
 const root=state.npc17,key=npc17Owner();
 if(!root.reigns[key]&&create)root.reigns[key]={owner:key,people:{},requests:[],stamps:{},lastDay:null};
 return root.reigns[key]||null;
}
function npc17Person(id){return PEOPLE.find(p=>p.id===id);}
function npc17Living(p){return !!p&&(!state.world16?.people[p.id]||state.world16.people[p.id].alive)&&castAge(p)>=18&&!world16DeceasedRuler();}
function npc17Own(p,create=false){const root=npc17Root(create);if(!root)return {memories:[],stamps:{},respect:40,guard:Math.round(100-(state.relations[p.id]?.mind?.security??50)),invitation:null};if(!root.people[p.id]&&create)root.people[p.id]={memories:[],stamps:{},respect:40,guard:Math.round(100-(state.relations[p.id]?.mind?.security??50)),invitation:null};return root.people[p.id]||{memories:[],stamps:{},respect:40,guard:Math.round(100-(state.relations[p.id]?.mind?.security??50)),invitation:null};}
function npc17Official(p){return frontOfficials().some(q=>q.id===p.id);}
function npc17Identity(p){if(['xu','jiang','xie'].includes(p.id))return p.id;return npc17Official(p)?'official':'common';}
function npc17Self(p){return p.id==='xie'?'奴才':npc17Official(p)||state.relations[p.id]?.rank?'臣':'草民';}
function npc17Variant(p,key,source=''){
 const own=npc17Own(p),pool=NPC17_COPY[npc17Identity(p)]?.[key]||NPC17_COPY[npc17Official(p)?'official':'common']?.[key]||[];
 const used=line=>own.memories.filter(m=>m.reply===line).length;
 return pool.slice().sort((a,b)=>used(a)-used(b)||mindHash(p.id+source+a)-mindHash(p.id+source+b))[0]||'';
}
function npc17Family(p){const n=state.world16?.people[p.id];return n&&state.world16.families[n.familyId];}
function npc17Busy(p){return simpleCourtBusy(p.id);}
function npc17RelationGate(p){if(!npc17Living(p))return '此人已离世或未成年，不能安排这类会面。';if(isAway()&&!regionOf(state.tour.region).people.includes(p.id))return '此人不在随行名册，回京后再见。';return '';}
function npc17PrivateGate(p){return npc17RelationGate(p)||(courtStatus()==='open'?'百官尚在殿中，退朝后再作私人安排。':npc17Busy(p)?'手中的差事尚未交清。':'');}
function npc17CostState(p){const r=state.relations[p.id],own=npc17Own(p);return {money:state.money,treasury:frontEnsure().treasury,ap:state.ap,left:session?.id===p.id?session.left:null,aff:r.aff,trust:r.trust,love:r.love,loyalty:r.loyalty,respect:own.respect,guard:own.guard,familiar:socialState(p).count,anger:state.relations[p.id].mind.anger,disappointment:state.relations[p.id].mind.disappointment,hurt:state.relations[p.id].mind.hurt,jealousy:state.relations[p.id].mind.jealousy};}
function npc17Remember(p,action,outcome,reason,reply,before,extra={}){
 const own=npc17Own(p,true),after=npc17CostState(p),root=state.npc17;
 const record={id:'npc17-'+(++root.serial),owner:npc17Owner(),tick:simTick(),day:todayKey(),actors:[npc17Owner(),p.id],action,outcome,reason,reply,emotionalChanges:Object.fromEntries(['anger','disappointment','hurt','jealousy'].map(k=>[k,(after[k]||0)-(before?.[k]||0)])),changes:Object.fromEntries(Object.keys(after).map(k=>[k,typeof after[k]==='number'&&typeof before?.[k]==='number'?after[k]-before[k]:0])),...extra};
 own.memories.push(record);if(own.memories.length>160)own.memories.splice(0,own.memories.length-160);
 rememberMind(p.id,action+'：'+reply,'人物互动',true);save();return record;
}
function npc17HasTurn(p){return !!session?.npc17&&session.id===p.id&&session.left>0&&npc17Living(p);}
function npc17Stamp(p,key){return npc17Own(p).stamps[key];}
function npc17Commit(p,action,reply,options={}){
 if(!npc17HasTurn(p))return false;
 const stamp=options.stamp||action+':'+todayKey();if(npc17Stamp(p,stamp)){toast('这一件已经记下，等有新进展再说。');return false;}
 if((options.money||0)>state.money){toast('宫里用钱不够，先换件事。');return false;}
 const before=npc17CostState(p),root=npc17Root(true),id='npc17-turn:'+npc17Owner()+':'+p.id+':'+stamp;
 const row={id,semantic:id,category:options.category||'chat',topic:options.topic||'npc17:'+action,reply,player:'',stage:'',socialTier:options.progress===false?null:socialTier(p),storyMark:options.storyMark};
 if(!__courtVoiceAudit.perform(p,row,options.effects||{}))return false;
 state.money-=options.money||0;
 const own=npc17Own(p,true);own.stamps[stamp]=simTick()+1;
 if(options.respect)own.respect=clamp(own.respect+options.respect);if(options.guard)own.guard=clamp(own.guard+options.guard);
 options.after?.();
 npc17Remember(p,action,options.outcome||'回应',options.reason||'',reply,before,{source:options.source||null,tags:options.tags||[action]});
 session.npc17Reply=reply;session.npc17Feedback=options.feedback||'这一回已记下。';session.npc17Section=options.section||session.npc17Section;
 render();renderSession();save();return true;
}
function npc17Button(action,id,label,desc='',disabled=''){
 return '<button class="opt" data-action="'+action+'" data-id="'+npc17Esc(id||'')+'"'+(disabled?' disabled':'')+'><b>'+npc17Esc(label)+'</b>'+(desc||disabled?'<small>'+npc17Esc(disabled||desc)+'</small>':'')+'</button>';
}
function npc17Header(p){
 const r=state.relations[p.id],f=npc17Family(p),profile=castProfile(p.id),n=state.world16?.people[p.id],health=n?.health??state.simulation?.actors.find(a=>a.id===p.id)?.health;
 const status=!npc17Living(p)?n?.alive===false?'已故，旧事留档':'尚未成年':npc17Busy(p)?'正在办差':health<45?'近日身体欠安':courtStatus()==='open'&&npc17Official(p)?'正在朝中候旨':'今日暂无在办差事';
 return '<div class="npc17-profile">'+portrait(p,true)+'<div><span class="tag">'+npc17Esc(r.rank||p.role)+'</span><h3>'+npc17Esc(p.name)+'</h3><p>'+castAge(p)+'岁 · '+npc17Esc(f?.type==='royal'?f.name:f?.name||profile?.clan||'家世未详')+'</p><small>'+npc17Esc(p.type||'')+' · '+npc17Esc(status)+' · '+npc17Esc(socialLabel(p))+'</small></div></div>';
}
function npc17Relation(p){const r=state.relations[p.id],own=npc17Own(p),s=socialState(p);return '<details class="npc17-details"><summary>彼此的关系</summary><p>熟悉：实际交谈'+s.count+'回，分'+s.days.length+'日相处。信任'+r.trust+'，亲近'+r.aff+'，敬重'+own.respect+'，忠诚'+r.loyalty+'，戒备'+own.guard+'。</p><p class="mini">亲近与忠诚分开；私下示好不会自动改变他的政见。</p></details>';}
function npc17Recent(p){const n=state.world16?.people[p.id],events=n?.memoryIds?.slice(-2).map(id=>state.world16.history.find(e=>e.id===id)).filter(Boolean)||[];const job=state.simulation?.jobs.find(j=>j.actor===p.id&&j.status==='pending');return job?frontName(p.id)+'正在办'+regionOf(job.region).name+'的「'+job.name+'」，约'+Math.max(0,job.due-simTick())+'日后回报。':events.at(-1)?.text||'今日的安排可以在行程里查看，未听过的私事须由他自己说起。';}
function npc17Open(id){
 const p=npc17Person(id);if(!p){if(state.world16?.people[id])world16PersonOpen(id);return;}
 const sections=NPC17_COPY.sections.map(([key,label,desc])=>npc17Button('npc17StartSection',id+'|'+key,label,desc,key==='delegate'&&!npc17Official(p)&&p.id!=='xie'?'尚未任朝职，不能领六部差事。':'')).join('');
 openModal(p.name,'',npc17Header(p)+'<p class="npc17-current">'+npc17Esc(npc17Recent(p))+'</p><p class="mini">资料与人物经历免费查看。开始一场会面用1次安排，可聊3回；会面中的寻常话题不再另扣安排。</p><div class="opts npc17-options">'+sections+'</div>'+npc17Exclusive(p)+npc17Relation(p)+'<div class="npc17-free">'+simpleCourtButton('dailySchedule',id,'今日行程')+'</div>','人物 · 八类互动');
}
function npc17Meet(id){
 const p=npc17Person(id);if(!p||npc17RelationGate(p)){toast(p?npc17RelationGate(p):'此人不在此处。');return;}
 if(npc17Busy(p))return npc17InviteOpen(id);
 if(session?.npc17&&session.id===id){renderSession();return;}
 npc17Entering=id;try{npc17Legacy.visit(id);}finally{npc17Entering=null;}
 if(session?.id!==id||!session.npc17)return;
 const own=npc17Own(p,true),inv=own.invitation;
 if(inv?.status==='planned'&&inv.due===simTick()){
   const before=npc17CostState(p);inv.status='fulfilled';inv.fulfilled=simTick();own.guard=clamp(own.guard-2);
   const reply=p.id==='xu'?'臣还以为陛下要忙到晚些。茶已经温好了，正好。':p.id==='xie'?'您来了，热的还留着呢。今日总算不必等它凉了。':p.id==='jiang'?'陛下如期而来，臣这盏茶便没白备。':'约好的时辰还记着，'+npc17Self(p)+'已将手边的事收好。';
   npc17Remember(p,'如约相见','赴约','前一日约定',reply,before,{source:inv.id});session.npc17Reply=reply;
 }
 renderSession();save();
}
function npc17Section(id){if(!session?.npc17||!NPC17_COPY.sections.some(s=>s[0]===id))return;session.npc17Section=id;renderSession();}
function npc17StartSection(raw){const [id,key]=raw.split('|'),p=npc17Person(id);if(!p||!NPC17_COPY.sections.some(s=>s[0]===key))return;if(key==='delegate'&&!npc17Official(p)&&p.id!=='xie')return;if(key==='memories')return npc17Memories(id);if(key==='invite'&&npc17Busy(p))return npc17InviteOpen(id);if((key==='delegate'||key==='council')&&npc17Busy(p))return npc17Public(id);npc17Meet(id);if(session?.npc17&&session.id===id)npc17Section(key);}
function npc17Exclusive(p){const r=state.relations[p.id],items=[];
 if(npc17Official(p))items.push(npc17Button('npc17AppointOpen',p.id,'安排他负责一个衙门','任用另耗1次安排，按能力与实绩择人。'));
 if(p.id==='xu')items.push(npc17Button('daliangCase','','问许家旧案进展','只按已核材料推进。'));
 if(p.id==='jiang')items.push(npc17Button('daliangCouncil','','听姜氏荐举','推荐不等于任用，仍须考校。'));
 if(p.id==='xie')items.push(npc17Button('daliangIntelligence','','看密报与查证','不凭一句密报直接定罪。'));
 if(session?.npc17&&session.id===p.id){
  const one=(id,name,desc,reason='')=>npc17Button('npc17Action',id,name,desc,session.left<1?'这次谈得够久，留到下回。':reason);
  items.push(one('thanks','为一件事道谢','只谢真实帮过、办妥的事情。',npc17ThanksCauses(p).length?'':'尚未有可指明的帮忙。'));
  if(!romanticReason(p,r))items.push(one('flirt','私下认真夸一句','看人设与实际亲疏，不因高好感就越过分寸。'),one('confide','说说自己今日的难处','从当前朝事谈起。',socialTier(p)==='stranger'?'私下尚不熟，先聊些寻常话。':''));
  if(topicsFor('care',p,r).some(x=>x[0]==='recruit'))items.push(one('recruit','商量往后怎样相处','仍须本人同意，许首辅不因此交出印信。'));
  if(r.rank&&!sleepReason(p,r))items.push(one('stay','问今夜是否愿留下','另耗1次安排，先听本人意愿。'));
 }
 return '<details class="npc17-details npc17-exclusive"><summary>依身份开放的专属操作</summary><div class="opts">'+items.join('')+'</div></details>';
}
function npc17Options(p,key){
 const r=state.relations[p.id],tier=socialTier(p),one=(id,label,desc='',gate='')=>npc17Button('npc17Action',id,label,desc,session.left<1?'这次谈得够久，留到下回。':gate);
 const relation=romanticReason(p,r),own=npc17Own(p),rows=[];
 if(key==='chat'){
  rows.push(one('chat','聊平日的兴致','按人物性情与亲疏回应。'),one('greet','问问近日忙什么','近况与近日经历相连。'),one('weather','聊聊时节与天气','随眼前的天气与地方说话。'));
  if(!state.palaceLife?.people[p.id]?.disclosed)rows.push(one('snack','尝尝他备的茶点','听他说起自己的小偏好，可以接着回应。'));
 }
 if(key==='care')rows.push(one('health','问问起居与身体','不预设对方愿意示弱。'),one('relatives','问问家里可安好','依真实亲属与近期经历作答。'),one('livelihood','问问近来的日子','家计、谋生与眼前困难。'),one('apology','把先前的事说开','须先有实际失约或伤人的事。',npc17Apology(p)?'':'没有尚未说开的旧事。'));
 if(key==='reward'){
  rows.push(one('preference','问问平日用什么','先听本人偏好，再挑物件。'));
  if(p.id!=='xie')rows.push(one('gift','挑一件合用的东西','宫里用钱支出，不与公家论赏混账。',courtStatus()==='open'?'朝上论功另赏；私下赐物，待退朝后。':''));
  rows.push(one('reward','依办成的差事赏银','朝廷账中支银3，不加私人好感。',npc17ThanksCauses(p,'reward').some(x=>x.public)?'':'还没有未论赏的实绩。'));
  if(!relation&&tier==='trusted')rows.push(one('token','赐一件约定的信物','本人愿收才花钱，记作这一代的心意。'));
 }
 if(key==='invite')rows.push(one('invite','问他今日能否相陪','饮茶、游园、下棋，要先听本人安排。'),one('promise','约好明日相见','有变需说明，实际见面才算赴约。',own.invitation?.status==='planned'?'已有未到期的约定。':''));
 if(key==='probe'){
  rows.push(one('probe-opinion','问他如何看待陛下','可能直言、留话或反问，不一定尽信。'),one('origin','问问来路与家世','本人愿说的才算听过，不凭姓氏编族谱。'));
  if(socialEdgesOf(p.id).length)rows.push(one('probe-relation','问一位相识之人的往来','只记作本人的说法，不当成定罪的证据。'));
  const story=storyOf(p);if(story.known.origin)rows.push(one('past','再问那件旧事','只接已有线索，隐情仍由本人逐步说出。',storyGate(p,story.known.scar?'truth':'scar')));
 }
 if(key==='council'){
  if(npc17Official(p)||p.id==='xie')rows.push(one('advice','听他对眼前朝事的主张','所据与私心各有不同，听过尚未下旨。',simpleCourtQueue().length?'':'眼下没有新的御前议事。'));
  rows.push(one('learn','请教他擅长的事','本月同项最多增长2点。'));
  if(!npc17Official(p)&&p.id!=='xie')rows.push(one('livelihood','听听家计与民情','只听本人所知，不把传闻当实据。'));
 }
 if(key==='delegate'){
  if(npc17Official(p))rows.push(one('delegate','交一件具体差事','已指定为本人，钱粮、期限与忙闲照实核。'));
  else if(p.id==='xie')rows.push(npc17Button('daliangCase','','交代查证旧案','沿现有线索调查，须花安排并等回报。'));
  else rows.push('<p class="mini">他眼下未任朝职，没有能直接交给他的六部差事。可在专属操作里依考校任用。</p>');
 }
 if(key==='memories')return simpleCourtButton('npc17Memories',p.id,'个人资料与历代相处')+simpleCourtButton('npc17FamilyView',p.id,'家谱与亲属')+simpleCourtButton('storyDossier',p.id,'已经听过的旧事')+npc17Threads(p);
 return rows.join('');
}
renderSession=function(){
 if(session&&npc17Entering===session.id)session.npc17=true;
 if(!session?.npc17)return npc17Legacy.renderSession();
 const p=npc17Person(session.id);if(!npc17Living(p)){session=null;return p?npc17Open(p.id):undefined;}
 const section=session.npc17Section;
 let legacyReplies='';if(session.life13){npc17Legacy.renderSession();legacyReplies=$('modalBody').querySelector('.v13-replies')?.outerHTML||'';}
 const text=session.npc17Reply||session.response||'“'+npc17Self(p)+'见过陛下。”';
 const answer=session.npc17Reply?'“'+npc17Esc(session.npc17Reply)+'”':text;
 const opts=section?npc17Options(p,section):NPC17_COPY.sections.map(([id,name,desc])=>npc17Button('npc17Section',id,name,desc)).join('');
 openModal(p.name,'',npc17Header(p)+'<div class="npc17-conversation"><div class="scene-text" aria-live="polite">'+answer+'</div>'+legacyReplies+(session.npc17Feedback?'<p class="npc17-feedback">'+npc17Esc(session.npc17Feedback)+'</p>':'')+'</div><div class="section-heading"><h3>'+npc17Esc(NPC17_COPY.sections.find(s=>s[0]===section)?.[1]||'想与他聊什么？')+'</h3><small class="mini">还能聊'+session.left+'回</small></div>'+(section?'<button class="text-btn" data-action="npc17Back">← 换个话题</button>':'')+'<div class="opts npc17-options">'+opts+'</div>'+npc17Exclusive(p)+npc17Relation(p)+'<div class="npc17-free">'+simpleCourtButton('npc17Memories',p.id,'回看相处')+simpleCourtButton('dailySchedule',p.id,'今日行程')+simpleCourtButton('close','','今日先到这里')+'</div>','人物会面 · 已用1次安排');
};actions.backSession=()=>renderSession();
function npc17OldTalk(p,category,topic,label){
 if(!npc17HasTurn(p))return;const before=npc17CostState(p),left=session.left;
 session.section=category;session.npc17Reply='';session.npc17Feedback='';npc17Legacy.topic(topic);
 if(session?.npc17&&session.left<left){const row=state.relations[p.id].mind.lastTurn;state.relations[p.id].loyalty=before.loyalty;
  npc17Remember(p,label,'交谈','依身份、亲疏与真实近况回应',row?.reply||'',before,{source:row?.id||null});
  session.npc17Reply=row?.reply||'';session.npc17Feedback='这段话留在了你们的相处记忆里。';renderSession();save();
 }
}
function npc17Action(action){
 const p=session?.npc17&&npc17Person(session.id);if(!p||!npc17HasTurn(p))return;
 if(!(npc17Options(p,session.npc17Section)+npc17Exclusive(p)).includes('data-id="'+action+'"'))return;
 if(action==='chat')return npc17OldTalk(p,'chat','interest','闲谈');
 if(action==='weather')return npc17Weather(p);
 if(action==='probe-opinion')return npc17Probe(p,'opinion');
 if(action==='probe-relation')return npc17Probe(p,'relation');
 if(action==='snack')return npc17OldTalk(p,'chat','v13:snack','尝他备的茶点');
 if(action==='greet')return npc17OldTalk(p,'care','listen','问候近况');
 if(action==='health')return npc17Health(p);
 if(action==='flirt')return npc17OldTalk(p,'flirt','compliment','认真夸赞');
 if(action==='origin')return npc17Origin(p);
 if(action==='past'){const story=storyOf(p);return npc17OldTalk(p,'chat','story:'+(story.known.scar?'truth':'scar'),'询问旧事');}
 if(action==='recruit'){if(!topicsFor('care',p,state.relations[p.id]).some(x=>x[0]==='recruit'))return;session.section='care';return npc17Legacy.topic('recruit');}
 if(action==='stay'){if(sleepReason(p,state.relations[p.id]))return;session.section='sleep';return npc17Legacy.topic('ask');}
 if(action==='preference')return npc17Preference(p);
 if(action==='gift')return npc17GiftOpen(p.id);
 if(action==='invite')return npc17InviteOpen(p.id);
 if(action==='promise')return npc17Promise(p);
 if(action==='thanks')return npc17CauseOpen(p.id,'thanks');
 if(action==='reward')return npc17CauseOpen(p.id,'reward');
 if(action==='apology')return npc17Sorry(p);
 if(action==='token')return npc17Token(p);
 if(action==='confide')return npc17Confide(p);
 if(action==='advice')return npc17Advice(p);
 if(action==='learn')return npc17Learn(p);
 if(action==='relatives')return npc17Relatives(p);
 if(action==='livelihood')return npc17Livelihood(p);
 if(action==='delegate')return npc17Delegate(p.id);
 if(action==='appoint')return npc17AppointOpen(p.id);
}

function npc17Origin(p){
 const w=state.world16,n=w?.people[p.id],f=npc17Family(p);if(n?.source!=='generated')return npc17OldTalk(p,'chat','story:origin','询问家世');
 if(storyOf(p).known.origin){toast('这段来路已经亲口说过，可以翻看已知旧事，或慢慢问别的。');return;}
 const self=npc17Self(p),type=WORLD16_DATA.familyTypes.find(t=>t.id===f.type)?.name||'寻常人家',father=w.people[n.parents[0]],reply=self+'出自'+f.surname+'家，家中是'+type+'一脉。'+(father?'家父名'+father.name+'，'+(father.alive?'如今尚在。':'已经过世了。'):'家中长辈的事，还须慢慢说。')+self+'如今所盼，是'+n.goal+'。';
 npc17Commit(p,'询问家世',reply,{stamp:'origin',storyMark:'origin',effects:{aff:1},source:f.id,reason:'实际家谱与本人目标'});
}
function npc17Preference(p){const specific=npc17Variant(p,'preference'),self=npc17Self(p),gift=npc17PreferredGift(p);const reply=specific||({book:self+'平日爱翻书，不求名贵，能读到些新见解便好。',tea:self+'日常只喝寻常清茶，不惯太浓。若说喜欢，热热一盏便很舒坦。',cord:self+'平日走动多，身上的东西不敢戴得繁杂。结实素净的，比华贵的实用。'}[gift]);npc17Commit(p,'询问喜好',reply,{effects:{aff:1},after:()=>{npc17Own(p,true).preferenceKnown=true;}});}
function npc17Weather(p){const s=state.simulation;if(!s)return;const weather=RealmSim.weather(s,REALM_DATA),self=npc17Self(p),rain=weather.includes('雨'),reply=p.id==='xu'?(rain?'雨还未停。陛下若要出门，先让人备伞，不必赶这一时。臣手边有书，正好等雨歇了再走。':'今日天色尚好。臣原想将手边的纸摊开晾一晾，免得收久了返潮。'):p.id==='jiang'?(rain?'下着雨，便不忙着走了。陛下若得闲，臣倒想听听，近日读到哪一页了。':'这样的时节，坐久了倒可出去走走。不过臣的话须先说在前头，讲读可不能因此省了。'):p.id==='xie'?(rain?'外头雨多，您别急着出去。热的还在，奴才再给您续一盏。':'今日风不算急，走廊里透着亮。您若想走走，奴才陪着，倒不必急着说什么。'):rain?self+'听着雨声，倒想起家中晾着的东西。陛下若要出门，也记得多带一把伞。':self+'今日出门看天色还好，路上也从容些。若手边事早些收齐，便想走一走再回去。';npc17Commit(p,'闲谈时节',reply,{stamp:'weather:'+todayKey(),effects:{aff:1},source:weather});}
function npc17Health(p){const actor=state.simulation?.actors.find(a=>a.id===p.id),n=state.world16?.people[p.id],health=actor?.health??n?.health??80,stress=actor?.stress??n?.stress??20;if(health>=45&&stress<65)return npc17OldTalk(p,'care','comfort','问候起居');const guarded=socialTier(p)==='stranger'||npc17Own(p).guard>=65,reply=p.id==='xu'?(guarded?'不过有些乏，不碍事。臣会去请太医看过，陛下不必为这点小事分神。':'这两日确实倦得厉害，方才还有些走神。臣会去请太医，您既问了，便不瞒您。'):p.id==='jiang'?'近日精神确实不如往常。臣会把急事先交清，讲读也缓一缓，不拿强撑作体面。':p.id==='xie'?(guarded?'奴才这身子走惯了，歇歇便好。您先顾着自己，奴才会去看太医。':'是有些撑不住了，原想等差事交清再说。您既看出来，奴才便不逞强了。'):npc17Self(p)+(guarded?'近来有些不适，原不敢多说。会去看过大夫，不敢拿猜测回陛下。':'这两日身子确实欠安，做事慢了些。陛下肯问，心里倒宽些；病还得请大夫看。');npc17Commit(p,'问候起居',reply,{stamp:'health:'+todayKey(),outcome:guarded?'略有保留':'据实说起',reason:health<45?'实际身体欠安':'实际压力偏高',effects:{},feedback:'记下了这次关怀，不凭一句话治病或自动加好感。'});}
function npc17Probe(p,kind){
 const r=state.relations[p.id],self=npc17Self(p),guard=Math.max(npc17Own(p).guard,100-r.mind.security),edge=kind==='relation'?socialEdgesOf(p.id)[0]:null,other=edge&&npc17Person(edge.a===p.id?edge.b:edge.a);let reply,outcome='有所保留';
 if(kind==='relation'&&!other)return;
 if(guard>=65||socialTier(p)==='stranger'){outcome=['jiang','xie'].includes(p.id)?'反问':'保留';reply=p.id==='jiang'?'陛下问的是臣本人的意思，还是姜氏的意思？若合作一句来问，臣反倒不敢轻率作答。':p.id==='xie'?'陛下想听奴才亲眼见过的，还是外头传来的？两样混在一处，便说不清了。':kind==='relation'?self+'与'+other.name+'有过来往，只是他人的私事，不敢代人说尽。':self+'还在看，也还在学。陛下容'+self+'慢慢相处之后，再说心里话。';}
 else if(kind==='relation'){const liking=edge.a===p.id?edge.affAB:edge.affBA;reply=liking>=65?other.name+'与'+self+'相识已久。旧交归旧交，他的差事，仍请陛下按实绩看。':self+'与'+other.name+(liking<35?'确有些不合。只是合不合得来，不能当成他有罪的凭据。':'见过几回，来往止于眼前事务。旁的尚不知，不敢乱说。');outcome=liking>=65?'护着旧交':'据来往陈说';}
 else{reply=p.id==='xu'?'臣愿尽力护住陛下与大梁。可若一件事臣仍有疑，便还须进言，不能只说陛下爱听的话。':p.id==='jiang'?'臣愿辅佐陛下，也有姜氏不能轻放的牵连。您若要臣一句事事相从，臣说出口，也未必值得信。':p.id==='xie'?'奴才替您做事，不是盼一纸封赏。可有些旧事，眼下还说不尽；您若问，奴才也不想拿一句好听的来搪塞。':self+'愿将分内事做好。能不能事事想到一处，还须一桩桩看，不能眼下便把话说满。';outcome='陈明立场';}
 const source=other?other.id:'opinion';npc17Commit(p,kind==='relation'?'试探旧交来往':'试探对女帝的态度',reply,{stamp:'probe:'+source+':'+todayKey(),outcome,reason:'本人陈说，尚未经旁证核实',source,effects:{},progress:false,guard:guard>=65?1:0,after:()=>{state.npcStatements=state.npcStatements||[];state.npcStatements.push({month:state.elapsed,day:state.day,source:p.id,target:other?.id||npc17Owner(),kind:outcome,line:reply,verified:false});},feedback:'只记作他的说法，不算揭开秘密或查实罪证。'});
}
function npc17PreferredGift(p){if(p.id==='xie')return 'tea';if(['xu','jiang'].includes(p.id))return 'book';const n=state.world16?.people[p.id],skills=n?.skills||p.skills||{};return skills.military>skills.literature?'cord':skills.literature>=skills.admin?'book':'tea';}
function npc17GiftOpen(id){const p=npc17Person(id);if(!p||p.id==='xie'||!npc17HasTurn(p))return;if(npc17PrivateGate(p)){toast(npc17PrivateGate(p));return;}openModal(p.name+' · 私下的小礼','', '<p>用宫里的钱，先挑一件。赠礼不记作公家赏赐，也不会加忠诚。</p><div class="opts">'+NPC17_COPY.gifts.map(g=>npc17Button('npc17Gift',id+'|'+g.id,g.name,'宫里用钱'+g.money+' · 1回互动',state.money<g.money?'宫里用钱不足。':'')).join('')+'</div>'+simpleCourtButton('backSession','','先不送'),'私人心意');}
function npc17Gift(raw){const [id,gid]=raw.split('|'),p=npc17Person(id),gift=NPC17_COPY.gifts.find(g=>g.id===gid);if(!p||p.id==='xie'||!gift||!npc17HasTurn(p)||npc17PrivateGate(p))return;
 const match=npc17PreferredGift(p)===gid,self=npc17Self(p),reply=match?(p.id==='xu'?NPC17_COPY.xu.gift[gid==='book'?0:1]:npc17Variant(p,'gift')||self+'正好用得上，谢陛下记挂。'):(p.id==='xu'?'陛下心意，臣领了。只是臣不惯佩饰，怕放在匣里，倒辜负了这件东西。':self+'谢陛下。这一件平日用得少，容'+self+'先妥善收着。');
 npc17Commit(p,'私人赠礼',reply,{money:gift.money,effects:{aff:match?2:0},stamp:'gift:'+state.elapsed,source:gid,reason:match?'礼物符合本人偏好':'礼物不合日常所用',feedback:'宫里用钱−'+gift.money+'；公账和忠诚不变。',after:()=>npc17Own(p,true).lastGift={id:gid,tick:simTick()}});
}
function npc17InviteOpen(id){const p=npc17Person(id);if(!npc17Living(p)||npc17RelationGate(p))return;openModal(p.name+' · 问问能否得闲','',npc17Header(p)+'<p>邀请他今日一起坐坐。若有公务或不愿相陪，他会据实婉拒；不会因拒绝便扣好感。</p><div class="opts">'+NPC17_COPY.activities.map(a=>npc17Button('npc17Invite',id+'|'+a.id,a.name,session?.npc17&&session.id===id?'用1回互动':'托人递话，用1次安排')).join('')+'</div>'+simpleCourtButton(session?.npc17?'backSession':'visit',id,'先不邀约'),'私人邀约');}
function npc17InvitationReason(p){const r=state.relations[p.id];return npc17PrivateGate(p)||(r.mind.security<25||npc17Own(p).guard>=85?'眼下还不愿私下相陪。':socialTier(p)==='stranger'&&r.aff<40?'私下尚不熟，暂不便独处。':'');}
function npc17Invite(raw){
 const [id,activity]=raw.split('|'),p=npc17Person(id),a=NPC17_COPY.activities.find(a=>a.id===activity);if(!p||!a||!npc17Living(p)||npc17RelationGate(p))return;
 const own=npc17Own(p),stamp='invite:'+todayKey();if(own.stamps[stamp]){toast('今日这句邀约已递过，先听他的回话。');return;}
 const reason=npc17InvitationReason(p),reply=reason?(courtStatus()==='open'?npc17Variant(p,'court'):npc17Busy(p)?npc17Variant(p,'refuse'):npc17Self(p)+'谢陛下垂问。只是今日想独自待一会儿，还望陛下宽宥。'):npc17Variant(p,'accept');
 const after=()=>{const o=npc17Own(p,true);o.invitation={id:'invite:'+npc17Owner()+':'+id+':'+simTick(),activity,requested:simTick(),status:reason?'deferred':'fulfilled',reason,fulfilled:reason?null:simTick()};if(!reason)npc17Schedule(p,a);};
 if(npc17HasTurn(p))return npc17Commit(p,'邀约'+a.name,reply,{stamp,outcome:reason?'婉拒':'应邀',reason,progress:!reason,effects:reason?{}:{aff:1},after,feedback:reason?'他有自己的安排。好感未降低，缘由会记住。':'这段相聚已写进今日行程。'});
 const before=npc17CostState(p);if(!pay(1))return;npc17Own(p,true).stamps[stamp]=simTick()+1;after();npc17Remember(p,'邀约'+a.name,reason?'婉拒':'应邀',reason,reply,before,{source:npc17Own(p).invitation.id});render();openModal(p.name+'传来的回话','', '<div class="scene-text">“'+npc17Esc(reply)+'”</div><p class="mini">'+(reason?'未改变好感；今日递过的邀约不会反复扣费。':'这段相聚已记在今日行程中。')+'</p>'+simpleCourtButton('visit',id,'回看人物'),'邀约 · 已用1次安排');save();
}
function npc17Schedule(p,a){const entries=state.dailyHistory[todayKey()]?.entries[p.id],actor=state.simulation?.actors.find(a=>a.id===p.id),text='依约陪陛下'+a.name+'，原先手边事务已收妥。';if(entries?.[3])entries[3]={...entries[3],location:a.place,place:wloc(a.place).name,text};if(actor?.routine?.[3])actor.routine[3]={...actor.routine[3],place:wloc(a.place).name,text};}
function npc17Promise(p){const own=npc17Own(p);if(own.invitation?.status==='planned')return;const self=npc17Self(p),reply=p.id==='xu'?'明日臣会先把案上的事理清。若临时有急务，定遣人回话，不让陛下空等。':p.id==='jiang'?'那便明日。臣记下了，若陛下临时忙不过来，遣人说一声便是。':p.id==='xie'?'明日的茶奴才来备。您若有事，先让人捎句话，奴才便不一直候着。':self+'记下了，明日恭候。若有变动，还请陛下遣人告知。';npc17Commit(p,'约定明日相见',reply,{stamp:'promise:'+todayKey(),reason:'双方约定下一日',after:()=>{npc17Own(p,true).invitation={id:'promise:'+npc17Owner()+':'+p.id+':'+simTick(),status:'planned',activity:'tea',requested:simTick(),due:simTick()+1};},feedback:'已约明日；预览人物不算赴约，须实际见一面。'});}

function npc17ThanksCauses(p,kind='thanks'){const f=frontEnsure(),own=npc17Own(p),rows=[];
 for(const o of f.orders)if(o.actor===p.id&&o.status==='completed')rows.push({id:'order:'+o.uid,name:SIMPLE_COURT.tasks[o.task]||'办妥差事',public:true});
 for(const a of f.affairs)if(a.actor===p.id&&a.status==='completed')rows.push({id:'affair:'+a.uid,name:simpleCourtTitle(a),public:true});
 for(const j of state.simulation?.jobs||[])if(j.actor===p.id&&j.status==='done'&&j.quality>=45)rows.push({id:'job:'+j.id,name:regionOf(j.region).name+' · '+j.name,public:true});
 for(const m of own.memories)if(m.action==='请教所学'&&m.outcome==='学有所获')rows.push({id:m.id,name:'前次讲解的学问',public:false});
 return rows.filter(row=>!own.stamps[kind+':'+row.id]).slice(-8);
}
function npc17CauseOpen(id,kind){const p=npc17Person(id);if(!p||!npc17HasTurn(p))return;const rows=npc17ThanksCauses(p,kind).filter(c=>kind!=='reward'||c.public);openModal(p.name+' · '+(kind==='reward'?'论功行赏':'道谢'),'','<p>'+(kind==='reward'?'按实际办妥的差事赏赐。朝廷银3，1回互动；不加私人好感。':'选一件确曾帮过的事，再向他道谢。')+'</p><div class="opts">'+rows.map(c=>npc17Button('npc17Cause',id+'|'+kind+'|'+c.id,c.name,'这件事只记一次。')).join('')+'</div>'+simpleCourtButton('backSession','','先不说'),'据实记功');}
function npc17Cause(raw){const [id,kind,...parts]=raw.split('|'),source=parts.join('|'),p=npc17Person(id),cause=p&&npc17ThanksCauses(p,kind).find(c=>c.id===source);if(!p||!cause||!npc17HasTurn(p))return;
 if(kind==='thanks')return npc17Commit(p,'为实事道谢',npc17Variant(p,'thanks',source),{stamp:'thanks:'+source,source,reason:cause.name,effects:{aff:1},respect:1});
 if(kind!=='reward'||!cause.public||npc17Stamp(p,'reward:'+source))return;
 if(!frontCanOrder()){toast('论赏须先入朝，私下的礼另说。');return;}
 const f=frontEnsure(),refused=p.id==='xu'&&f.arrears>0;
 if(!refused&&f.treasury<3){toast('朝廷的银不足3，不能从宫里的钱里混支。');return;}
 npc17Commit(p,'按实绩赏赐',refused?npc17Variant(p,'rewardRefuse'):npc17Variant(p,'reward'),{stamp:'reward:'+source,source,reason:cause.name,progress:false,outcome:refused?'辞赏':'受赏',effects:refused?{}:{loyalty:1},respect:refused?1:0,feedback:refused?'这笔银留在朝廷账上，未增私人好感。':'朝廷银−3；已记赏簿，私人好感不变。',after:()=>{if(!refused){f.treasury-=3;frontLedger('按实绩赏赐',-3,0,p.name+'办妥'+cause.name+'，赏银3。');if(simActive())simPull();}}});
}
function npc17Apology(p){const own=npc17Own(p),old=own.memories.slice().reverse().find(m=>(m.outcome==='失约'||m.action==='伤人言语')&&!own.stamps['apology:'+m.id]);if(old)return old;const r=state.relations[p.id],m=r.mind;if(m.broken>0&&!own.stamps['apology:legacy:'+m.broken])return {id:'legacy:'+m.broken,reason:'先前未赴的约定'};if(r.upsetDay&&!own.stamps['apology:scold:'+r.upsetDay])return {id:'scold:'+r.upsetDay,reason:'先前受斥责的不快'};return null;}
function npc17Sorry(p){const hurt=npc17Apology(p);if(!hurt)return;const reply=npc17Variant(p,'apology');npc17Commit(p,'为旧事道歉',reply,{stamp:'apology:'+hurt.id,source:hurt.id,reason:hurt.reason||hurt.action,effects:{},guard:-3,after:()=>{const m=state.relations[p.id].mind;m.disappointment=clamp(m.disappointment-3);},feedback:'只修复这件旧事的一点不快，不会抹掉已发生的记忆。'});}
function npc17Token(p){const r=state.relations[p.id];if(romanticReason(p,r)||socialTier(p)!=='trusted'||npc17Stamp(p,'token')||npc17PrivateGate(p))return;const own=npc17Own(p);if(own.guard>=70){return npc17Commit(p,'赠送信物',npc17Self(p)+'明白陛下的意思。只是眼下还不敢收，愿再缓一缓。',{outcome:'婉拒',effects:{}});}
 npc17Commit(p,'赠送信物',npc17Variant(p,'token'),{stamp:'token',money:3,effects:{aff:1,love:1},reason:'相知后自愿收下',after:()=>{npc17Own(p,true).keepsake={id:'token:'+npc17Owner()+':'+p.id,name:'一枚私下相赠的素结',from:npc17Owner(),tick:simTick()};},feedback:'宫里用钱−3；信物属于本代相处，不随传位变成下一代的恋情。'});
}
function npc17Confide(p){if(socialTier(p)==='stranger')return;const a=simpleCourtQueue()[0];if(!a){toast('眼下无这件烦心的朝事，先聊些寻常话。');return;}const reply=p.id==='xu'?'陛下不必今日就答尽所有人的话。先定眼前最急的一件，余下的，臣陪您逐项理清。':p.id==='jiang'?'各人都盼陛下先顾自己那一头，自然难两全。您不妨先说最不肯退让的是什么，臣再与您慢慢议。':p.id==='xie'?'折子先放一放，茶还热着。您慢慢说，奴才听着；要奴才去办哪一件，再另吩咐。':npc17Self(p)+'未必替陛下想得周全，但愿把自己知道的说清。先说眼前这一件吧。';npc17Commit(p,'说起眼前难处',reply,{stamp:'confide:'+a.uid,source:a.uid,reason:simpleCourtTitle(a),effects:{aff:1},guard:-1});}

function npc17Advice(p){const a=simpleCourtQueue()[0],f=frontEnsure();if(!a)return;const minister=f.ministers[p.id],principle=minister?.principle||'law',line=FRONT.bespokeAdvice[p.id]?.[a.type]||FRONT.advice[a.type]?.[principle]||'请先核清实际缺口，再定先后。';let reply=line;if(p.id==='xie')reply='这件“'+simpleCourtTitle(a)+'”，奴才只敢据手里查明的说。线索须另核，不能把一句传话当成拿人的凭据。';npc17Commit(p,'议眼前朝事',reply,{stamp:'advice:'+a.uid,source:a.uid,reason:FRONT.principles[principle]||'现有线索',effects:{},feedback:'他有自己的立场；听过建议尚未下旨。'});}
function npc17Learn(p){const skills=state.relations[p.id].skills||p.skills||{},key=['admin','military','literature'].sort((a,b)=>(skills[b]||0)-(skills[a]||0))[0],name={admin:'理事',military:'兵法',literature:'读书'}[key],f=frontEnsure();if((f.growth?.[state.elapsed]?.[key]||0)>=2||npc17Stamp(p,'learn:'+state.elapsed)){toast('这月这门学问已学过，留些日子自己体会。');return;}const reply=p.id==='jiang'?'今日不多讲。先将一件事分清缓急，再说如何处置；若只背下条文，换一桩事便又无从下手。':p.id==='xu'?'先别急着取舍。将所据的事实写在一处，猜测另放一处；凭据不足，结论便须留余地。':p.id==='xie'?'听一桩消息，先问是谁亲眼看见、谁只是听说。两处说得一样，也未必不是同一个人传出来的。':key==='military'?npc17Self(p)+'先说粮路。人马能到，粮能否跟上，都得算清；只看兵数，打起来往往吃亏。':key==='literature'?npc17Self(p)+'读到不懂的句子，先看前后说的是什么。不急着逐字猜，意思常在相邻那一段里。':npc17Self(p)+'先将经手的人与事情分开记。哪一步迟了、卡在何人那里，才不至于各说各的。';npc17Commit(p,'请教所学',reply,{stamp:'learn:'+state.elapsed,outcome:'学有所获',reason:name,effects:{},respect:1,after:()=>frontGrowth(key),feedback:'这月'+name+'略有长进，仍受原每月上限约束。'});}
function npc17Relatives(p){const w=state.world16,n=w?.people[p.id],self=npc17Self(p);if(p.id==='xie')return npc17Commit(p,'问亲属近况','奴才的家事，眼下还不愿说。宫里当差的来历都有册子，旁的，容奴才以后亲口告诉您。',{effects:{},reason:'未公开的身世不补造亲属'});
 if(p.id==='xu')return npc17Commit(p,'问亲属近况','祖父已经不在了。许家的旧事仍压在案上，臣能做的，是把留下来的原件一件件找齐。',{stamp:'relatives:xu:'+state.elapsed,effects:{},source:'g-xu'});
 const ids=n?[...(n.parents||[]),...(n.children||[]),...(n.spouse?[n.spouse]:[])]:[],actual=ids.map(id=>w.people[id]).filter(Boolean);if(!actual.length)return npc17Commit(p,'问亲属近况',self+'家中近况，眼下还未有新信送来。不敢拿猜测回陛下。',{effects:{}});
 const person=actual.find(q=>!q.alive)||actual[0],relation=(n.parents||[]).includes(person.id)?'长辈':(n.children||[]).includes(person.id)?'孩子':'家中人',reply=!person.alive?self+'家中这位'+relation+'已经不在了。'+self+'还留着他的旧物，得空便收拾一收。':relation==='孩子'?self+'的孩子'+person.name+'如今'+world16Age(person)+'岁了。日子一天天过，看着也渐渐长起来。':self+'家中'+person.name+'尚安。各人照常过自己的日子，'+self+'得空也会回去照看。';npc17Commit(p,'问亲属近况',reply,{stamp:'relatives:'+person.id+':'+state.elapsed,source:person.id,effects:{aff:1}});
}
function npc17Livelihood(p){const f=npc17Family(p),self=npc17Self(p);const reply=f?.wealth<15?self+'家里近来开销紧些。先把该用的留出来，其余能缓的便缓，不敢一时花尽。':/商/.test(p.role||'')?self+'近日照旧核账，不敢见人说哪路好赚便贸然跟去。家中能拿出的本钱，总得先留一半应急。':self+'近日仍靠自己所学谋生。手边有做不妥的，记下来再练，先把眼前日子过稳。';npc17Commit(p,'问谋生与家计',reply,{stamp:'livelihood:'+state.elapsed,effects:{aff:1},reason:f?.name||'本人公开所业'});}

function npc17Public(id){const p=npc17Person(id);if(!npc17Living(p))return;openModal(p.name+' · 正事','',npc17Header(p)+'<div class="opts">'+(npc17Official(p)?npc17Button('npc17Delegate',id,'交一件具体差事','派他本人去办，花费看清后再定。')+npc17Button('npc17AppointOpen',id,'安排他负责一个衙门','任用耗1次安排，好感不代替能力。'):'')+(p.id==='xie'?npc17Button('daliangIntelligence','','查看已有密报','来源、传闻与查证结果分开。')+npc17Button('daliangCase','','交代核查旧案','沿用真实查证与回报期限。'):'')+'</div>'+simpleCourtButton('visit',id,'回看人物'),'召问 · 正事');}
function npc17Delegate(id){const p=npc17Person(id);if(!npc17Living(p)||!npc17Official(p))return;const gate=!frontCanOrder()?'先入朝，再发交办之令。':npc17Busy(p)?'他正在办差，须先等回报。':state.ap<1?'今日余力不足，明日再办。':'';openModal(p.name+' · 交办差事','', '<p>承办人已定为'+npc17Esc(p.name)+'，不自动换成别人。</p>'+(!frontCanOrder()?simpleCourtButton('npc17Court',id,'入朝后继续'):'')+(gate?'<p class="npc17-feedback">'+gate+'</p>':'')+'<label class="npc17-field">办在哪儿<select id="npc17Region">'+REGIONS.map(r=>'<option value="'+r.id+'">'+r.name+'</option>').join('')+'</select></label><div class="opts">'+REALM_DATA.projects.map(t=>npc17Button('npc17Dispatch',id+'|'+t.id,t.name,'用银'+t.money+'、粮'+t.grain+' · 约'+(t.days+(frontAbility(p,t.skill)<45?1:0))+'日 · 1次安排',gate||simpleCourtShortage(t))).join('')+'</div>'+simpleCourtButton('visit',id,'回看人物'),'具体交办');}
function npc17Dispatch(raw){const [id,project]=raw.split('|'),p=npc17Person(id),region=$('npc17Region')?.value;if(!p||!npc17Living(p)||!npc17Official(p)||!frontCanOrder()||npc17Busy(p)||!REGIONS.some(r=>r.id===region))return;const before=npc17CostState(p),res=simDispatch({type:'project',project,region,actor:id});if(!res)return;const job=state.simulation.jobs.at(-1);npc17Remember(p,'委派实际差事','领办',job.name,npc17Self(p)+'领旨，这便按所定钱粮与期限去办。',before,{source:job.id});render();simpleCourtJob('job:'+job.id);}
function npc17AppointOpen(id){const p=npc17Person(id);if(!p||!npc17Living(p)||!npc17Official(p))return;const f=frontEnsure(),held=FRONT.departments.find(d=>f.heads[d.id]===id);openModal(p.name+' · 安排职责','', '<p>任事能力与好感分开看。一人只领一部，原先差事仍照实交清。</p>'+(!frontCanOrder()?simpleCourtButton('npc17Court',id,'先入朝再任用'):'')+'<div class="opts">'+FRONT.departments.map(d=>npc17Button('npc17Appoint',id+'|'+d.id,d.name+' · '+SIMPLE_COURT.departments[d.id],'相应能力'+frontAbility(p,d.skill)+' · 1次安排',!frontCanOrder()?'尚未入朝。':held?.id===d.id?'已经负责此部。':held?'已负责'+held.name+'，须先为原部另任主事。':state.ap<1?'今日余力不足。':'')).join('')+'</div>'+simpleCourtButton('visit',id,'回看人物'),'用人');}
function npc17Appoint(raw){const [id,dept]=raw.split('|'),p=npc17Person(id);if(!p||!npc17Living(p)||!frontCanOrder())return;const before=npc17CostState(p),old=frontEnsure().heads[dept];frontAppoint(dept+'|'+id);if(frontEnsure().heads[dept]===id&&old!==id)npc17Remember(p,'任用官职','受命',frontDept(dept).name,npc17Self(p)+'接旨，原有交接会据实办清。',before,{source:'appointment:'+dept+':'+todayKey()});npc17Open(id);}

function npc17FamilyView(id){const p=npc17Person(id),n=state.world16?.people[id];if(p)return familyTree(id);if(n?.familyId)return world16Family(n.familyId);}
function npc17Memories(id){
 const p=npc17Person(id)||state.world16?.people[id];if(!p)return;const own=npc17Own(p),past=Object.entries(state.npc17?.reigns||{}).filter(([owner,r])=>owner!==npc17Owner()&&r.people[id]?.memories.length),n=state.world16?.people[id];
 const record=m=>'<article class="npc17-memory"><span class="tag">'+npc17Esc(simDate(m.tick))+' · '+npc17Esc(m.outcome)+'</span><h4>'+npc17Esc(m.action)+'</h4><p>“'+npc17Esc(m.reply)+'”</p>'+(m.reason?'<small>'+npc17Esc(m.reason)+'</small>':'')+'</article>';
 openModal(p.name+' · 人物经历','', '<p>'+npc17Esc(p.role||n?.role||'原有身份')+' · '+npc17Esc(p.type||n?.personality||'性情未记')+(n?.alive===false?' · 已故':'')+'</p>'+(n?.goal?'<p>所愿：'+npc17Esc(n.goal)+'</p>':'')+'<p class="mini">这些是实际发生的相处。只查看不花安排，未说出的隐情仍不算已知。</p>'+own.memories.slice(-20).reverse().map(record).join('')+(!own.memories.length?'<p>本代还没有新的相处记录。</p>':'')+(own.keepsake?'<p>本代信物：'+npc17Esc(own.keepsake.name)+'。</p>':'')+past.map(([owner,reign])=>'<details class="npc17-details"><summary>前代：'+npc17Esc(state.world16?.people[owner]?.name||'旧君主')+'留下的相处</summary>'+reign.people[id].memories.slice(-20).reverse().map(record).join('')+'</details>').join('')+'<div class="npc17-free">'+simpleCourtButton('npc17FamilyView',id,'家谱与亲属')+(npc17Person(id)?simpleCourtButton('archive',id,'原有交际与记事')+simpleCourtButton('storyDossier',id,'已经听过的旧事')+simpleCourtButton('visit',id,'回看人物'):'')+'</div>','人物档案 · 历代留存');
}
function npc17Threads(p){const own=npc17Own(p),requests=npc17Root()?.requests.filter(r=>r.npc===p.id&&r.status==='open')||[],inv=own.invitation;return requests.map(r=>npc17Button('npc17Request',r.id,r.title,'这是他自己递来的话。')).join('')+(inv?.status==='planned'?'<p>明日的约已记下。约定日：'+npc17Esc(simDate(inv.due))+'。</p>':'')+(inv?.status==='deferred'?'<p class="mini">上回邀约未能成行：'+npc17Esc(inv.reason)+'</p>':'')+simpleCourtButton('npc17Memories',p.id,'回看这一路的相处')+simpleCourtButton('v13Panel','','宫中小笺与争风吃醋')+(!requests.length?'<p class="mini">眼下没有新的请见，日常动向仍收在记事里。</p>':'');}

function npc17RequestAdd(p,kind,source,text,title){const root=npc17Root(true),key=kind+':'+source;if(root.stamps[key])return;root.stamps[key]=simTick()+1;root.requests.push({id:'npc17-request-'+(++state.npc17.serial),owner:npc17Owner(),npc:p.id,kind,source,text,title,created:simTick(),expires:simTick()+7,status:'open'});if(root.requests.length>100)root.requests.splice(0,root.requests.length-100);}
function npc17Day(){
 const root=npc17Root();if(!root||root.lastDay===simTick()||world16DeceasedRuler())return;root.lastDay=simTick();
 for(const req of root.requests)if(req.status==='open'&&(simTick()>req.expires||!npc17Living(npc17Person(req.npc))))req.status='expired';
 for(const [id,own]of Object.entries(root.people)){
  const p=npc17Person(id);if(!npc17Living(p))continue;
  const inv=own.invitation;
  if(inv?.status==='planned'&&simTick()>inv.due){inv.status='missed';const before=npc17CostState(p),reply=npc17Self(p)+'昨日按约等过，后来便先去做自己的事了。若有变动，下回让人捎句话便好。';own.guard=clamp(own.guard+3);npc17Remember(p,'未赴约定','失约','没有在约定日实际见面',reply,before,{source:inv.id});}
  const familiar=socialTier(p)!=='stranger'&&state.relations[id].aff>=50&&state.relations[id].trust>=40;
  if(inv?.status==='deferred'&&!inv.followup&&!npc17Busy(p)&&simTick()>=inv.requested+2&&familiar&&mindHash(inv.id+':return:'+simTick())%100<35){inv.followup=true;npc17RequestAdd(p,'reinvite',inv.id,npc17Variant(p,'follow',inv.id),'前回的约，想再问一声');}
  const f=npc17Family(p),n=state.world16?.people[id],cause=n?.memoryIds?.map(eid=>state.world16.history.find(e=>e.id===eid)).filter(e=>e?.kind==='离世'||e?.kind==='出生').at(-1);
  if(familiar&&f&&f.type!=='legacy'&&f.type!=='royal'&&f.wealth<15&&cause&&mindHash(id+':aid:'+simTick())%100<20)npc17RequestAdd(p,'family-aid',cause.id,npc17Self(p)+'家中近来添了开销，手头有些紧。若能得一笔接济，先让家里安顿下来，旁的仍想自己慢慢挣。','有一件家事想求助');
  const reaction=frontEnsure().reactions.slice().reverse().find(x=>x.items?.some(row=>row.npc===id&&row.aff<0));
  if(reaction&&mindHash(id+':objection:'+simTick())%100<20){const concern=reaction.items.find(row=>row.npc===id&&row.aff<0);npc17RequestAdd(p,'objection',reaction.stamp,'前次「'+reaction.source+'」，'+npc17Self(p)+'仍有顾虑：'+concern.reason+'请陛下容'+npc17Self(p)+'再陈明利害，原定旨意仍照办。','对前次决定还有话说');}
 }
}
function npc17Requests(){const rows=npc17Root()?.requests.filter(r=>r.status==='open'&&npc17Living(npc17Person(r.npc)))||[];openModal('递来的请见与小笺','', '<p>私下的邀约和家事收在这里。朝廷要事仍由御前呈报，日常动向归记事。</p>'+rows.map(r=>'<article class="npc17-memory"><h3>'+npc17Esc(frontName(r.npc))+' · '+npc17Esc(r.title)+'</h3>'+simpleCourtButton('npc17Request',r.id,'看看他说什么')+'</article>').join('')+(!rows.length?'<p>暂时没有新小笺。达到了亲疏门槛，也并非每日都会有人来邀。</p>':'')+simpleCourtButton('close','','收好'),'人物主动来往');}
function npc17Request(id){const req=npc17Root()?.requests.find(r=>r.id===id),p=req&&npc17Person(req.npc);if(!req||req.status!=='open'||!npc17Living(p))return;openModal(p.name+' · '+req.title,'','<div class="scene-text">“'+npc17Esc(req.text)+'”</div><p class="mini">'+npc17Esc(simDate(req.created))+'递来 · '+npc17Esc(simDate(req.expires))+'前回话。只翻看不耗安排。</p><div class="opts">'+npc17Button('npc17RequestReply',id+'|accept',req.kind==='reinvite'?'今日赴约':req.kind==='family-aid'?'从宫里接济他家':'单独听他陈明',req.kind==='family-aid'?'用宫里银3、1次安排，实记家产。':'单独赴约用1次安排；已在会面中则用1回互动。忙碌或上朝时仍不便相陪。')+npc17Button('npc17RequestReply',id+'|later','明日再回话','延一天，不代表已经答应。')+npc17Button('npc17RequestReply',id+'|decline','婉言回绝','留一份回话，不因回绝便当作结怨。')+'</div>','本人请见');}
function npc17RequestReply(raw){const [id,choice]=raw.split('|'),root=npc17Root(),req=root?.requests.find(r=>r.id===id),p=req&&npc17Person(req.npc);if(!p||!req||req.status!=='open'||!npc17Living(p)||!['accept','later','decline'].includes(choice))return;
 if(choice==='later'){if(req.delayed){toast('已回过延期的话，先等明日。');return;}req.expires++;req.delayed=true;save();return npc17Requests();}
 if(choice==='decline'){const before=npc17CostState(p);req.status='declined';npc17Remember(p,'回复本人请见','婉拒','本次未应邀',npc17Self(p)+'明白了，便不再候着。改日若有闲暇，再来问安。',before,{source:req.id});return npc17Requests();}
 if(npc17PrivateGate(p)){toast(npc17PrivateGate(p));return;}
 const before=npc17CostState(p);if(req.kind==='family-aid'&&state.money<3){toast('宫里用钱不足3，不能从朝廷账里混支。');return;}
 if(req.kind==='reinvite'&&npc17HasTurn(p)){const reply=npc17Variant(p,'accept');return npc17Commit(p,'赴本人续约',reply,{source:req.id,stamp:'request:'+req.id,reason:'承接先前未成的邀约',after:()=>{req.status='accepted';npc17Schedule(p,NPC17_COPY.activities.find(a=>a.id===npc17Own(p).invitation?.activity)||NPC17_COPY.activities[0]);npc17Own(p,true).invitation.status='fulfilled';}});}
 if(req.kind==='reinvite'){npc17Meet(p.id);if(!session?.npc17||session.id!==p.id)return;req.status='accepted';const reply=npc17Variant(p,'accept');npc17Schedule(p,NPC17_COPY.activities.find(a=>a.id===npc17Own(p).invitation?.activity)||NPC17_COPY.activities[0]);npc17Own(p,true).invitation.status='fulfilled';npc17Remember(p,'赴本人续约','相聚','承接先前未成的邀约',reply,before,{source:req.id});session.npc17Reply=reply;renderSession();save();return;}
 if(!pay(1))return;
 if(req.kind==='family-aid'){const f=npc17Family(p);if(!f){state.ap++;return;}state.money-=3;f.wealth+=3;req.status='accepted';npc17Remember(p,'接济本人家事','受助','家族开销来自实际婚育或离世事件',npc17Self(p)+'谢陛下。这笔钱先让家中解一时之急，不敢拿它作求官的由头。',before,{source:req.source});}
 if(req.kind==='objection'){req.status='accepted';npc17Own(p,true).respect=clamp(npc17Own(p).respect+1);npc17Remember(p,'听取不同主张','陈明','没有自动改动原定政策',req.text,before,{source:req.source});}
 render();npc17Requests();save();
}
buildDay=function(){const key=npc17Legacy.day();npc17Day();return key;};
const npc17BeforeRender=render;render=function(){npc17BeforeRender();for(const b of document.querySelectorAll('[data-action="visit"]'))if(/1行动|1次安排/.test(b.textContent))b.textContent='查看人物';for(const button of document.querySelectorAll('.npc-card [data-action="visit"],.person-card [data-action="visit"],.card [data-action="visit"]')){const card=button.closest('.npc-card,.person-card,.card'),pic=card?.querySelector('.portrait');if(pic){pic.dataset.action='visit';pic.dataset.id=button.dataset.id;pic.setAttribute('role','button');pic.setAttribute('tabindex','0');pic.setAttribute('aria-label','查看人物');pic.style.cursor='pointer';}}if(state.tab==='notes'&&!document.querySelector('.npc17-notebook'))$('screen').insertAdjacentHTML('afterbegin','<section class="card npc17-notebook"><h3>递来的请见与小笺</h3><p>私人邀约、家事求助与未尽之言，收在这里。</p>'+simpleCourtButton('npc17Requests','','看看谁留了话')+'</section>');};
Object.assign(actions,{npc17Open,npc17Meet,npc17Section,npc17StartSection,npc17Action,npc17GiftOpen,npc17Gift,npc17InviteOpen,npc17Invite,npc17Cause,npc17Public,npc17Delegate,npc17Dispatch,npc17AppointOpen,npc17Appoint,npc17FamilyView,npc17Memories,npc17Requests,npc17Request,npc17RequestReply,
 visit:npc17Open,storyMeet:npc17Meet,npc17Back:()=>{if(session?.npc17){session.npc17Section=null;renderSession();}},npc17Court:id=>{if(!frontCanOrder()){if(courtStatus()==='left'){toast('今日已退朝，明日再交办。');return;}closeModal();actions.tab('court');}npc17Public(id);}});
const npc17BeforeSmallReply=actions.v13Reply;actions.v13Reply=raw=>{const p=session?.npc17&&npc17Person(session.id),before=p&&npc17CostState(p);if(p){session.npc17Reply='';session.npc17Feedback='';}npc17BeforeSmallReply(raw);if(p&&session?.npc17&&session.left<before.left){const row=state.relations[p.id].mind.lastTurn;state.relations[p.id].loyalty=before.loyalty;npc17Remember(p,'接着那件小事','接话','承接同一段茶点、邀约或醋意',row?.reply||'',before,{source:raw});session.npc17Reply=row?.reply||'';renderSession();save();}};
const npc17BeforeCard=npcCard;npcCard=function(p){return npc17BeforeCard(p).replace('<div class="person-body">','<button class="npc17-list-portrait" data-action="visit" data-id="'+npc17Esc(p.id)+'" aria-label="查看'+npc17Esc(p.name)+'，不耗安排">'+portrait(p,true)+'</button><div class="person-body">');};
const npc17BeforeWorldPerson=world16PersonOpen;world16PersonOpen=function(id){npc17BeforeWorldPerson(id);if(Object.values(state.npc17?.reigns||{}).some(r=>r.people[id]?.memories.length))$('modalBody').insertAdjacentHTML('beforeend',simpleCourtButton('npc17Memories',id,'查历代相处记忆'));};actions.world16PersonOpen=world16PersonOpen;
document.addEventListener('keydown',e=>{const el=e.target;if((e.key==='Enter'||e.key===' ')&&el.dataset?.action==='visit'&&el.getAttribute('role')==='button'){e.preventDefault();npc17Open(el.dataset.id);}});
const npc17Style=document.createElement('style');npc17Style.textContent=`
.npc17-list-portrait{border:0;background:transparent;padding:0;margin:12px 0 12px 12px;cursor:pointer;align-self:flex-start;flex:none}.npc17-list-portrait .portrait.large{width:64px;min-width:64px;min-height:110px}.npc17-profile{display:flex;align-items:center;gap:17px;margin:12px 0 20px}.npc17-profile>div{min-width:0}.npc17-profile h3{font-size:23px;margin:8px 0}.npc17-profile p{font-size:13px;margin:6px 0}.npc17-profile small{font-size:12px;color:var(--muted-foreground,#967d83)}
.npc17-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.npc17-options .opt{margin:0;min-width:0}.npc17-options .opt small{font-size:12px;line-height:1.8}.npc17-conversation .scene-text{font-size:15px;line-height:2}
.npc17-details{font-size:13px;line-height:1.9;border-top:1px solid var(--line);margin-top:20px;padding:13px 0}.npc17-details summary{color:#a4556b;cursor:pointer}.npc17-details p{margin:10px 0}.npc17-current,.npc17-feedback{padding:12px;background:#f4ece1;font-size:12px;line-height:1.8;border-radius:8px}.npc17-free{display:flex;flex-wrap:wrap;gap:7px;margin-top:15px}.npc17-free .btn{font-size:12px;padding:8px 12px}.npc17-memory{border-bottom:1px solid var(--line);padding:15px 0;font-size:13px;line-height:1.9}.npc17-memory h4{margin:8px 0}.npc17-field{display:block;margin:14px 0;font-size:13px}.npc17-field select{width:100%;font:inherit;padding:12px;margin-top:8px;background:#fffaf4;color:inherit;border:1px solid var(--line);border-radius:8px}
@media(max-width:440px){.npc17-options{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.npc17-profile{gap:12px}.npc17-profile h3{font-size:21px}.npc17-options .opt{padding:12px 11px}.npc17-options .opt small{font-size:11px}.npc17-profile .portrait{max-width:74px}.npc17-free .btn{white-space:normal}}
`;document.head.appendChild(npc17Style);
window.__npc17Audit={version:17,root:npc17Root,own:npc17Own,day:npc17Day,commit:npc17Commit,remember:npc17Remember,requests:npc17Requests,causes:npc17ThanksCauses};
