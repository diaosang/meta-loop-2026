/* V11: one turn owns its prompt, answer, context and memory. UI never appends dialogue. */
(function () {
 'use strict';
 const esc = mindEscape, hash = mindHash;
 let active = null;
 const PROMPTS = {
  chat:{recent:'近来在忙些什么？',home:'说说家里的旧事，可好？',interest:'闲时最爱做什么？'},
  care:{listen:'有话便慢慢说，朕听着。',comfort:'先歇一歇，余下的事不急在这一刻。',gift:'这件东西赏你，看看可合心意。',bag:'出行时留的，给你。',promise:'下月得闲，朕再来见你。'},
  probe:{opinion:'在你看来，朕是怎样的人？',worry:'近来可有什么难处？',family:'家中来信，可有为难你的事？'},
  scold:{remind:'言行须留分寸。你可明白？',stern:'将此事的经过据实说来，不许隐瞒。',public:'此事当众问你，须有个明白交代。'},
  flirt:{compliment:'方才看你，倒让朕移不开眼了。',miss:'朕不召你时，你可曾想过来见朕？',confess:'朕待你的心意，你当真不知么？'},
  sleep:{ask:'今夜，愿不愿留下？'},
  persuade:{recruit:'朕想留你在内廷。你可愿意？',promote:'晋封之事，你可有话要说？',support:'此事，你可愿领命？',work:'这桩差事，你有何打算？',reconcile:'你与他之间的事，可愿说清？'}
 };
 const LORE={
  xu:[
   ['这只旧杯，还舍不得换？','杯沿磕过，陛下那时说扔了可惜。臣便留下了，用着也未觉得哪里不好。'],
   ['今日暂不问政事，陪朕坐一会儿。','那臣便先合上这一页。陛下若又想起哪本折子，可得等这盏茶用完再问。'],
   ['旧识归旧识，该进言时仍须直说。','臣明白。所据、利弊，都会具陈，最后如何裁定，自当听陛下圣断。'],
   ['送书倒勤，怎不亲自来？','送书有现成的由头。真要递一句想见陛下，写了几回，倒总觉得不妥。']
  ],
  jiang:[
   ['旧日讲过的章程，如今可还适用？','有些适用，有些须改。老臣若只因亲手教过，便不肯改口，也枉为人师了。'],
   ['方才想唤朕什么，怎么又停了？','旧称唤惯了，险些失言。陛下如今居大位，老臣在人前尤其不敢混了分寸。'],
   ['太傅的门生，也须依例考校。','自当如此。经得起考校，才不负从前所教；若经不起，老臣更不敢荐。'],
   ['朕若不取太傅所议，太傅如何？','当先听陛下所据。若仍有疑，老臣还会进言；既奉旨定下，便不敢私下掣肘。']
  ],
  ye:[
   ['这份礼，可还带着什么话？','陛下看得明白。礼是一份心意，所求另写了单子；若不合例，臣不敢因送过礼便多讨一句。'],
   ['叶家的打算，你不妨直说。','臣盼家中安稳，自有私心。正因如此，才须将所涉利害列在前头，不敢瞒着请陛下裁。'],
   ['不必陪笑，究竟担心什么？','怕陛下每回见臣，只想起钱粮二字。今日既未带账册，倒不知怎样开口了。'],
   ['公事按章程，私下再说私下的话。','如此最好。该核的账照核，待折子收了，臣再请陛下用茶。']
  ],
  xie:[
   ['怎么总拣看得见门的位置？','当值久了，习惯了。谁来、谁走，先看一眼，回陛下问话时便不致漏了。'],
   ['耳报的来处，可核清了？','转过两道手，尚缺亲见者作证。奴才先报作线索，未敢列为实据。'],
   ['今日可有一件，只为你自己的事？','有。常去的书铺要迁了，奴才想告半日假，去取先前订下的几册书。'],
   ['不必只表忠心，先说你的顾虑。','怕有些消息递得迟，误了事；递得太急，又将未核的传闻带到御前。奴才正在分清这两处。']
  ],
  song:[
   ['若朕不赐赏，只说这曲子好呢？','那草民便想再问一句，好在哪一段。不是不知足，只想知道，陛下究竟听进去了哪一处。'],
   ['方才那一声，怎会弹错？','陛下忽然近前，草民一时分神。是草民定力不够，容重弹那一段。'],
   ['今日不听琴，只来见你，可好？','好。琴先收起来，免得手边有了弦，反倒又只顾说曲子。'],
   ['写一支自己喜欢的曲子，不急着呈来。','草民记下了。待写成，若仍觉得好，再请陛下听，眼下先不夸口。']
  ],
  lu:[
   ['这点心，是你亲手做的？','是。这回盯着火候，没敢走开。陛下尝一口便好，不好吃，臣再去学。'],
   ['见朕召了旁人，你可有不快？','有一点。臣知道不该拦，只是陛下若也肯来看看臣，便不至于总在这儿瞎猜。'],
   ['若召你入内廷，旧差遣如何？','先交清名册与值次，再领新命。臣不愿叫旧部以为，只因得了亲近，便连该办的事也免了。'],
   ['今日累了便直说，不必撑着。','是有些乏。原不想叫陛下看出来，越想坐正，肩背倒越僵了。']
  ]
 };
 function ensure() {
  ensureMinds();
  const v=state.courtVoice=state.courtVoice||{version:11,days:{},reports:[],serial:0};
  v.days=v.days||{};v.reports=v.reports||[];v.serial=v.serial||0;
  for(const p of PEOPLE){const m=state.relations[p.id].mind;m.turns=m.turns||[];m.disclosures=m.disclosures||[];m.turnSeq=m.turnSeq||0;}
  return v;
 }
 function roleOf(p) {
  const r=state.relations[p.id],s=p.role||'';
  if(r.rank)return 'consort';
  if(p.id==='xie')return 'palace';
  if(/药|医/.test(s))return 'medicine';
  if(/户部|钱粮|商账/.test(s))return 'revenue';
  if(/兵部|将军|校尉|侍卫|行伍|骑射|武将/.test(s))return 'military';
  if(/刑部|都察|御史|大理/.test(s))return 'justice';
  if(/工部|河工/.test(s))return 'works';
  if(/礼部|太傅|国子监|鸿胪/.test(s))return 'ritual';
  if(/吏部|首辅|内阁/.test(s)||p.id==='xu')return 'personnel';
  if(/掌柜|商人|商号|账房/.test(s))return 'merchant';
  if(/内侍|宫廷|太监|女官|管事/.test(s))return 'palace';
  return 'artist';
 }
 function identity(p,channel='private') {
  const r=state.relations[p.id];
  if(p.id==='xie')return {self:'奴才',role:'掌事内侍',rank:r.rank||'御前当值'};
  if(r.rank)return {self:'臣',role:'内廷'+r.rank,rank:r.rank};
  if(p.official||r.recruited||p.id==='jiang'||p.id==='xu')return {self:'臣',role:p.role,rank:p.role};
  if(/女官|宫人|宫女/.test(p.role||''))return {self:'奴婢',role:p.role,rank:p.role};
  return {self:'草民',role:p.role||'在野人物',rank:p.role||'在野人物'};
 }
 function context(p,channel='private') {
  const r=state.relations[p.id],m=r.mind,month=state.elapsed%12+1,day=state.day||1;
  const season=month<=3?'春':month<=6?'夏':month<=9?'秋':'冬';
  const festivals={'1-1':'元日','1-15':'上元','5-5':'端午','7-7':'七夕','8-15':'中秋','9-9':'重阳','12-8':'腊八'};
  const publicFact=m.memories.slice().reverse().find(x=>['自主日常','往来','守约','失约','政务回奏','关系变化'].includes(x.kind));
  const place=state.dailyHistory[todayKey()]?.entries[p.id]?.[3]?.location||p.location||'quarters';
  const k=identity(p,channel),stage=socialLabel(p);
  const cp=typeof castProfile==='function'?castProfile(p.id):null;
  return {npc:p.id,name:p.name,identity:k.role,self:k.self,clan:cp?.clan||p.faction||'未记家门',
   role:roleOf(p),personality:p.type,mood:currentMind(p),relationship:stage,socialTier:socialTier(p),aff:r.aff,love:r.love,
   location:place,locationName:wloc(place).name,season,festival:festivals[month+'-'+day]||'平日',
   channel,recentEvent:publicFact?{tick:publicFact.tick,kind:publicFact.kind,text:publicFact.text}:null,
   memory:m.memories.slice(-6).map(x=>({kind:x.kind,text:x.text})),
   specialty:cp?.specialty||p.specialty||((p.skills?.military||0)>65?'骑射':(p.skills?.literature||0)>65?'书法':'读书'),
   slot:['清晨','上午','午后','傍晚','夜间'][Math.min(4,Math.floor((15-state.ap)/3))]};
 }
 function fill(text,c){return String(text).replace(/\{self\}/g,c.self).replace(/\{specialty\}/g,c.specialty);}
 function normalize(text){return String(text).replace(/[\s“”‘’、，。！？：；…—·「」『』]/g,'').replace(/陛下|草民|奴才|奴婢|臣/g,'');}
 function similarity(a,b){
  const grams=s=>{const t=normalize(s),z=new Set();for(let i=0;i<t.length-1;i++)z.add(t.slice(i,i+2));return z;};
  const x=grams(a),y=grams(b);if(!x.size||!y.size)return normalize(a)===normalize(b)?1:0;
  let n=0;for(const s of x)if(y.has(s))n++;return 2*n/(x.size+y.size);
 }
 function record(p,row,c){
  const m=state.relations[p.id].mind;
  row.context={...c,topic:row.topic,courtshipTier:row.courtshipTier||null};row.scene={player:row.player,location:c.location};
  m.turns.push({id:row.id,semantic:row.semantic,reply:row.reply,topic:row.topic,tick:mindTick(),context:row.context});
  m.turns=m.turns.slice(-30);m.turnSeq++;m.lastTurn=row;
  return row;
 }
 function factRows(p,category,topic,c){
  const m=state.relations[p.id].mind,out=[];
  if(category==='chat'&&topic==='recent'&&m.plan){
   const plan=m.plan,target=PEOPLE.find(q=>q.id===plan.target),met=target&&(state.dailyHistory[todayKey()]?.entries[p.id]?.[3]?.text||'').includes(target.name);
   const plans={learn:(SOCIAL_SKILLS[c.specialty]?.[0]||'这几日都在习'+c.specialty+'。手边留了一处没想妥的，打算再试。'),walk:'想出去走走。坐得太久，腰背都有些发僵了。',
    prepare:'正收拾一件小东西，还没弄好。您先别瞧，等我收拾完。',seekcare:'正想着要不要请您来。您倒先过来了。',
    boundary:'今日想自己待一会儿。也没别的事，就是懒得出门。',visit:target?(met?'今日去见了'+target.name+'。来回一趟，倒花了不少工夫。':'正想去见'+target.name+'。还没来得及出门，您便来了。'):null};
   if(plans[plan.kind])out.push({id:'plan-talk:'+p.id+':'+plan.id,semantic:'plan-talk:'+plan.id,
    category,topic,reply:plans[plan.kind],fact:true,planKind:plan.kind,score:110});
  }
  if(category==='probe'&&topic==='worry'&&m.appointment){
   const when=m.appointment.tick;
   out.push({id:'appointment:'+when,semantic:'appointment:'+when,category,topic,
    reply:'并无旁的，只惦记着先前约好的日子。陛下若有事，遣人说一声便是，'+c.self+'也好另作安排。',score:80});
  }
  if(category==='probe'&&topic==='worry'&&m.broken>0){
   out.push({id:'broken:'+m.broken,semantic:'broken:'+m.broken,category,topic,
    reply:'先前约好的那一回，'+c.self+'确实等过。陛下忙，原不敢催，只是下回若不能来，望能先得一句话。',score:80});
  }
  return out;
 }
 function turn(p,category,topic,opts={}){
  ensure();if(active&&active.npc===p.id&&active.category===category&&active.topic===topic)return active.row;
  const c=context(p,opts.channel||'private'),m=state.relations[p.id].mind;
  const positive=!['恼怒','疏离','戒备','失望','委屈','吃醋'].includes(c.mood);
  const hasFamilyLetter=m.memories.some(x=>/家书|家信|给家里写|家中来信/.test(x.text));
  let pool=COURT_VOICE_DATA.rows.filter(x=>x.category===category&&x.topic===topic&&
   (x.role==='any'||x.role===c.role)&&(!x.personality||x.personality===p.type)&&
   (x.positive===undefined||x.positive===positive)&&(!x.minAff||c.aff>=x.minAff)&&(!x.requiresFamilyLetter||hasFamilyLetter)&&
   (!x.moods||x.moods.includes(c.mood))&&(!x.festival||x.festival===c.festival)&&(!x.season||x.season===c.season));
  if(category==='probe'&&topic==='family'&&!hasFamilyLetter)pool.push({id:'no-family-letter:'+p.id,semantic:'no-family-letter',role:'any',reply:'家里这几日还没来信。我也正等着呢。'});
  pool=pool.map(x=>({...x,reply:fill(x.reply,c),score:(x.role===c.role?20:0)+(x.personality?30:0)+(x.priority||0)}));
  const everyday=!['恼怒','疏离','失望','委屈','吃醋'].includes(c.mood)&&(category==='chat'&&['recent','home','interest'].includes(topic)||category==='care'&&['listen','comfort','gift','bag','promise'].includes(topic));
  if(everyday)pool=socialRows(p,c,category,topic);
  pool.push(...(everyday?socialFactRows(p,factRows(p,category,topic,c)):factRows(p,category,topic,c)));
  if(category==='flirt'&&positive&&p.romance)pool=courtshipRows(p,c,topic);
  const last=m.turns;
  // The same ongoing topic may be revisited on another day; prefer an unheard variant.
  if(everyday)pool=pool.map(x=>({...x,score:(x.score||0)-(last.some(y=>y.semantic===x.semantic||similarity(y.reply,x.reply)>=.78)?65:0)}));
  const fresh=pool.filter(x=>!last.some(y=>(!everyday||y.tick===mindTick())&&(y.semantic===x.semantic||similarity(y.reply,x.reply)>=.78)));
  fresh.sort((a,b)=>(b.score||0)-(a.score||0)||hash(p.id+':'+m.turnSeq+':'+a.id)-hash(p.id+':'+m.turnSeq+':'+b.id));
  let row=fresh[0];
  if(!row){
   // An exhausted topic does not fabricate a new fact or recycle a previous answer.
   return {id:'exhausted:'+category+':'+topic,category,topic,semantic:'exhausted',exhausted:true,
    stage:'这件事方才已谈过，话暂且停在这里。',reply:'',player:PROMPTS[category]?.[topic]||'此事还有什么要说？',context:c,
    scene:{player:PROMPTS[category]?.[topic]||'此事还有什么要说？',location:c.location}};
  }
  row={...row,category,topic,player:category==='probe'&&topic==='family'&&!hasFamilyLetter?'家中近来可有什么消息？':PROMPTS[category]?.[topic]||'此事你有何想法？',
   stage:row.stage||(category==='scold'?'你止住旁人的话，等他回应。':'')};
  return record(p,row,c);
 }
 function html(row){const stage=row.stage?'<span class="mind-stage">'+esc(row.stage)+'</span>':'';
  if(row.narrative)return stage+(stage?'<br><br>':'')+esc(row.reply);
  if(row.exhausted)return stage;
  return stage+(stage?'<br><br>':'')+'“'+esc(row.reply)+'”';}
 readFiction=function(p,category,topic){return turn(p,category,topic==='stay'?'ask':topic);};
 revisionRow=function(p,category){
  if(active&&active.npc===p.id&&active.category===category)return active.row;
  return null;
 };
 const originalApply=applyInteraction;
 applyInteraction=function(p,category,topic,line,effects={},options={}){
  if(!session||session.id!==p.id||session.left<=0)return;
  const factual=topic.startsWith('relation:')||category==='sleep'||options.factual;
  let row=active?.row;
  if(!row&&category==='sleep'){const c=context(p);row=record(p,{id:'night:'+p.id+':'+todayKey(),semantic:'night:'+todayKey(),category,topic,
   stage:'夜深，殿门外的脚步渐渐远去。',player:'',reply:'你们又说了片刻话，待灯烛换过，便一同歇下。',narrative:true},c);}
  if(!row&&factual&&category!=='sleep'&&state.relations[p.id].mind.turns.some(x=>similarity(x.reply,line)>=.78)){
   session.response='<span class="mind-stage">这份说法已记下，尚未有新的事实可补。</span>';renderSession();return;
  }
  if(!row&&factual){const c=context(p);row=record(p,{id:'testimony:'+p.id+':'+hash(line),semantic:'testimony:'+hash(line),category,topic,
   stage:category==='sleep'?'夜深，殿门外的脚步渐渐远去。':'你问起两人的往来，对方据所知作答。',player:topic.startsWith('relation:')?'你与'+(PEOPLE.find(x=>x.id===topic.slice(9))?.name||'此人')+'近日如何？':PROMPTS[category]?.[topic]||'此事据实说来。',reply:line},c);}
  if(!row)row=turn(p,category,topic);
  if(row.exhausted){session.response=html(row);renderSession();return;}
  const prev=active;active={npc:p.id,category,topic,row};
  const left=session.left;
  try{originalApply(p,category,topic,row.reply,effects,options);}finally{active=prev;}
  if(session&&session.left<left){commitCourtship(p,row);commitSocial(p,row);commitStoryTurn(p,row);session.response=html(row);state.relations[p.id].mind.lastTurn=row;renderSession();save();}
 };
 // Call the original mechanics once, not the revision/agency/dialogue display wrappers.
 interactionTopic=function(id){
  if(!session||session.left<=0||!session.section)return;
  const p=PEOPLE.find(x=>x.id===session.id),r=state.relations[p.id],category=session.section;
  if(id.startsWith('exclusive:')){
   const reason=topicReason(category,id,p,r);if(reason){toast(reason);return;}
   const base=FICTION_DATA.bespoke.find(x=>x.id===id.slice(10)&&x.npc===p.id);if(!base)return;
   const originals=FICTION_DATA.bespoke.filter(x=>x.npc===p.id&&x.state==='平静');
   const index=originals.findIndex(x=>x.title===base.title),content=LORE[p.id]?.[index];if(!content)return;
   const m=r.mind,semantic='lore:'+p.id+':'+index;
   if(m.turns.some(x=>x.semantic===semantic)||mindTick()-(m.cooldowns[base.id]??-99)<base.cooldown){toast('此事方才谈过，待有新进展再问。');return;}
   let reply=content[1];if(r.rank&&p.id!=='xie')reply=reply.replaceAll('草民','臣');
   const row=record(p,{id:semantic,semantic,category:'chat',topic:id,stage:'你提起这桩旧事，对方认得。',player:content[0],reply},context(p));
   m.cooldowns[base.id]=mindTick();active={npc:p.id,category:'chat',topic:id,row};try{applyInteraction(p,'chat',id,row.reply,{aff:3});}finally{active=null;}return;
  }
  if(!topicsFor(category,p,r).some(x=>x[0]===id))return;
  const gate=topicReason(category,id,p,r);if(gate){toast(gate);return;}
  if(category==='sleep'){intimacyQuestion();return;}
  if(category==='care'&&id==='recruit'){if(r.aff<50||r.love<8){toast('尚须好感50、暧昧8，才好商议入宫。');return;}openRecruit(p);return;}
  if(category==='probe'&&id==='family'){
   if(r.aff<40){toast('交情尚浅，家事暂不肯细说。');return;}
   const row=turn(p,'probe','family');if(row.exhausted){session.response=html(row);renderSession();return;}
   active={npc:p.id,category,topic:id,row};try{applyInteraction(p,category,id,row.reply,{aff:1});
    if(row.semantic!=='no-family-letter'&&hash(todayKey()+p.id+':disclosure')%100<60){const m=r.mind;if(!m.disclosures.includes('family'))m.disclosures.push('family');rememberMind(p.id,'向女帝谈及家中期许，尚未借御前情分应下私家请托。','家书');}}
   finally{active=null;}return;
  }
  if(category==='probe'&&id.startsWith('report:')){
   const uid=id.slice(7),report=ensure().reports.find(x=>x.uid===uid);if(!report)return;
   const t=template(report);if(report.heard.length>=t.evidence.length){toast('现有实据均已陈明，待回奏再核。');return;}
   const next=t.evidence.findIndex((_,i)=>!report.heard.includes(i)),source=t.evidence[next];
   const c=context(p),reply=r.loyalty>=45?c.self+'经手所知，是这一项：'+source:'此项尚待与有司核对。'+c.self+'不敢先作定论，请陛下核原册。';
   const row=record(p,{id:'report-talk:'+uid+':'+next,semantic:'report-talk:'+uid+':'+next,category,topic:id,
    stage:'对方将所知与尚待核实之处分别陈明。',player:'前次呈报，有何实据？',reply},c);
   active={npc:p.id,category,topic:id,row};try{applyInteraction(p,category,id,reply,{}, {factual:true});}finally{active=null;}
   if(r.loyalty>=45&&!report.heard.includes(next))report.heard.push(next);save();return;
  }
  if(category==='probe'&&id.startsWith('relation:')){topicBeforeMind(id);return;}
  const row=turn(p,category,id);if(row.exhausted){session.response=html(row);renderSession();return;}
  active={npc:p.id,category,topic:id,row};
  try{topicBeforeMind(id);}finally{active=null;}
 };
 actions.interactionTopic=interactionTopic;
 const beforeTopics=topicsFor;
 topicsFor=function(category,p,r){
  let result=beforeTopics(category,p,r);
  if(category==='probe')result.push(['family','问家中来信','好感40后可问；坦言后有机会得知家族期许。']);
  if(category==='probe'&&session?.id===p.id&&session.report)result.push(['report:'+session.report,'核问所呈之事','只记经手所知；保留与传闻均不当作证据。']);
  if(category==='care'&&!r.rank&&(p.romance||p.id==='xie'))result.push(['recruit','议入内廷','好感50、暧昧8；先问本人意愿，再行安置。']);
  return result;
 };
 visit=function(id){
  ensure();const p=PEOPLE.find(x=>x.id===id);if(!p)return;
  if(isAway()&&!regionOf(state.tour.region).people.includes(id)){toast('此人不在随行名册，回京后再召见。');return;}
  if(!pay(1))return;
  const c=context(p),self=c.self;
  let greeting='“'+self+'见过陛下。”';
  if(c.mood==='疏离'||c.mood==='恼怒')greeting='他依礼问安，仍立在原处，没有像往常那样近前。';
  else if(c.socialTier==='trusted')greeting='“陛下来了。”他将手中的东西放下，替你空出案边的位置。';
  else if(c.socialTier==='familiar')greeting='他行过礼，手上已不似先前拘紧。“陛下请坐。”';
  session={id,left:3,message:greeting,response:'',history:[]};
  if(!state.visited.includes(id))state.visited.push(id);
  if(resolvePromise(id)){change(id,0,2);rememberMind(id,'女帝依约来见，先前留下的约定已经践行。','守约');}
  markContact(id);log('召见'+p.name+'，依礼问安。','会面',id);render();renderSession();save();
 };
 actions.visit=visit;
 mindBlock=function(p){const c=context(p),m=state.relations[p.id].mind;return '<div class="mind-block"><div class="section-heading"><span class="tag">'+esc(c.mood)+'</span><button class="text-btn" data-action="mindDetail" data-id="'+esc(p.id)+'">心绪与近况</button></div><small>'+esc(c.identity)+' · '+esc(c.relationship)+'</small><small>挂念 '+Math.round(m.expectation)+' · 醋意 '+Math.round(m.jealousy)+' · 戒心 '+Math.round(100-m.security)+'</small></div>';};
 intimacyQuestion=function(){
  if(!session||session.left<=0)return;const p=PEOPLE.find(x=>x.id===session.id),r=state.relations[p.id],gate=sleepReason(p,r);
  if(gate){toast(gate);return;}
  const row=turn(p,'sleep','ask');if(row.exhausted){session.response=html(row);renderSession();return;}
  const willing=!['恼怒','疏离','戒备','失望','委屈','吃醋'].includes(currentMind(p));
  session.intimacyConsent=willing?p.id:null;
  openModal(p.name+' · 夜间',r.rank||p.role,'<div class="scene-text">'+html(row)+'</div><div class="opts">'+
   (willing?'<button class="opt" data-action="intimacyConfirm"><b>留宿</b><small>另耗1行动；今夜只安排一次。</small></button>':'<p>他已婉辞，今夜便不再强留。</p>')+
   '<button class="opt" data-action="intimacyCancel"><b>准其回去</b></button></div>','内廷私语');save();
 };

 // Audition: independent facts persist for the candidate, including their refusal and terms.
 function candidate(p){
  const r=state.relations[p.id],c=context(p,'audition'),cp=castProfile(p.id)||{},d=state.audition?.dossiers?.[p.id]||eliteDossier(p);
  r.candidateVoice=r.candidateVoice||{};Object.assign(r.candidateVoice,{first:'敬畏',specialty:d.specialty,firstMood:c.mood});
  return {...r.candidateVoice,clan:d.clan,background:d.background,appearance:d.appearance,reasons:d.reasons,age:castAge(p),context:c,dossier:d};
 }
 function auditionAnswer(p,index,remember=true){
  const a=candidate(p),c=a.context,lines=AUDITION_ELITE_DATA.answers[p.type]||AUDITION_ELITE_DATA.answers['严正守礼'];
  let reply=lines[index].replaceAll('{clan}',a.clan).replaceAll('{skill}',a.specialty);
  const rivalEdge=socialEdgesOf(p.id).find(e=>['争执','决裂'].includes(e.voiceStage)&&state.audition.pool.includes(e.a===p.id?e.b:e.a));
  const rival=rivalEdge?PEOPLE.find(x=>x.id===(rivalEdge.a===p.id?rivalEdge.b:rivalEdge.a)):null;
  const unwilling=['恼怒','疏离','失望','戒备'].includes(c.mood)||state.audition.consent?.[p.id]===false;
  if(index===2&&unwilling)reply='草民惶恐，恐不能胜任宫中侍奉，斗胆恳请陛下准予撤牌。';
  else if(index===2&&rival){reply+='另有一事不敢欺瞒：草民与'+rival.name+'先前有过争执。若蒙留牌，恳请分处安置。';state.relations[p.id].candidateVoice.separateFrom=rival.id;}
  const stage=index===0?(AUDITION_ELITE_DATA.fear[p.type]||AUDITION_ELITE_DATA.fear['严正守礼']):index===1?'他低头理顺衣袖，稍稍缓过气息，才敢应声回话。':'他将双手叠在身前，伏首候旨，开口时声音仍有些紧。';
  const row={id:'audition:'+index+':'+p.id,semantic:'audition:'+index+':'+p.id,category:'audition',topic:String(index),
   stage,reply,player:['说说家世与应选缘由。','所习何艺，最擅长什么？','宫中安排已告知，你可愿留牌？'][index],candidate:a};
  return remember?record(p,row,c):row;
 }
 auditionInterview=function(id,answer=''){
  const au=state.audition,p=PEOPLE.find(x=>x.id===id);if(!p||au?.status!=='offered'||!au.pool.includes(id))return;
  ensure();au.answers=au.answers||{};au.consent=au.consent||{};
  if(au.voiceVersion!=='13.2'){
   for(const pid of au.pool){const old=au.answers[pid],person=PEOPLE.find(x=>x.id===pid);if(!old){au.interviews[pid]=[];continue;}
    const index=Number(old.topic);if(person&&[0,1,2].includes(index))au.answers[pid]=auditionAnswer(person,index,false);
   }au.voiceVersion='13.2';
  }
  const a=candidate(p),qs=au.interviews[id]||[],row=au.answers[id];
  const intro=row?html(row):'<span class="mind-stage">'+esc(AUDITION_ELITE_DATA.fear[p.type]||AUDITION_ELITE_DATA.fear['严正守礼'])+'</span><br><br>“草民叩见陛下。”';
  const perf=au.performances?.[id];
  openModal(p.name,a.age+'岁 · '+p.type+' · '+p.role,'<div class="scene-text">'+intro+'</div><p class="mini">'+esc(a.clan)+' · '+esc(a.specialty)+' · 初次面圣</p><p class="mini">'+esc(a.background)+'</p><p class="mini">仪容：'+esc(a.appearance)+'</p><p class="mini">礼部初选：'+esc(a.reasons.join('、'))+'</p><div class="opts">'+
   ['问家世与来意','问所学与专长','问是否愿意留牌'].map((q,i)=>'<button class="opt" data-action="auditionAsk" data-id="'+id+'|'+i+'" '+(qs.includes(i)?'disabled':'')+'><b>'+q+(qs.includes(i)?' · 已问':'')+'</b></button>').join('')+
   '<button class="opt" data-action="auditionPerform" data-id="'+id+'" '+(perf?'disabled':'')+'><b>'+(perf?'才艺已试':'命其当场试艺')+'</b><small>'+esc(a.specialty)+'</small></button>'+
   '<button class="opt" data-action="auditionSelect" data-id="'+id+'" '+(qs.length!==3||au.consent[id]===false?'disabled':'')+'><b>'+(au.selected.includes(id)?'撤回留牌':'留牌候选')+'</b><small>'+(au.consent[id]===false?'本人自请撤牌，不列留宫名单。':'三问已毕，再定去留。')+'</small></button></div><button class="text-btn" data-action="audition">返回名册</button>','殿选');save();
 };
 actions.auditionInterview=id=>auditionInterview(id);
 actions.auditionAsk=raw=>{
  const [id,n]=String(raw).split('|'),i=Number(n),au=state.audition,p=PEOPLE.find(x=>x.id===id);
  if(!p||au?.status!=='offered'||!au.pool.includes(id)||![0,1,2].includes(i))return;
  au.interviews[id]=au.interviews[id]||[];if(au.interviews[id].includes(i))return;
  au.consent=au.consent||{};if(i===2)au.consent[id]=!['恼怒','疏离','失望','戒备'].includes(currentMind(p));
  au.interviews[id].push(i);au.answers=au.answers||{};au.answers[id]=auditionAnswer(p,i);
  rememberMind(id,'殿选中回禀'+['家世与来意','所习专长',au.consent[id]?'愿意留牌':'自请撤牌'][i]+'。','选秀');
  auditionInterview(id);save();
 };
 const oldSelect=actions.auditionSelect;
 actions.auditionSelect=id=>{if(state.audition?.consent?.[id]===false){toast('本人已请撤牌。');return;}oldSelect(id);};
 const oldConfirm=actions.auditionConfirm;
 actions.auditionConfirm=()=>{const a=state.audition;if(a?.selected?.some(id=>a.consent?.[id]!==true)){toast('须先问清本人意愿。');return;}
  const selected=(a?.selected||[]).slice();oldConfirm();if(state.audition?.status==='completed')for(const id of selected){
   const other=state.relations[id]?.candidateVoice?.separateFrom;if(other&&selected.includes(other)&&state.harem.housing[id]===state.harem.housing[other]){
    const house=CAST_HOUSES.find(h=>h.id!==state.harem.housing[other]);if(house)state.harem.housing[id]=house.id;
    rememberMind(id,'殿选所请分别安置，内廷已依言安排。','守约',true);
   }}save();};
 actions.auditionPerform=id=>{
  const p=PEOPLE.find(x=>x.id===id),au=state.audition;if(!p||au?.status!=='offered'||!au.pool.includes(id)||au.performances?.[id])return;
  const a=candidate(p),level=castProfile(id)?.specialtyLevel||p.specialtyLevel||3;
  const falter=hash(p.id+':'+state.elapsed+':perform')%100<(a.context.mood==='戒备'?45:22);
  au.performances=au.performances||{};au.performances[id]={skill:a.specialty,level,falter,day:todayKey()};
  const confident=['骄矜自尊','野心进取'].includes(p.type),self=a.context.self;
  const reply=falter?'草民一时手颤，失了平日的准头，求陛下恕罪。':'草民献丑，恭请陛下指教。';
  const row=record(p,{id:'performance:'+id,semantic:'performance:'+id,category:'audition',topic:'performance',
   stage:p.name+(falter?'试到半处手指一颤，慌忙收势，俯首请罪。':'依所学呈艺，收势后仍敛目俯身，不敢先抬头看你。'),player:'将你最擅长的试来。',reply},a.context);
  au.answers=au.answers||{};au.answers[id]=row;rememberMind(id,'殿前试'+a.specialty+(falter?'一度失手，已据实陈明。':'，礼官已记等第。'),'选秀');auditionInterview(id);save();
 };

 openRecruit=function(p){
  if(!session||session.id!==p.id)return;const c=context(p),r=state.relations[p.id];
  const willing=!['恼怒','疏离','戒备','失望'].includes(c.mood);
  const reply=willing?c.self+'愿意。只是现下手头的事，须容'+c.self+'交代清楚，再依礼入宫。':'蒙陛下厚爱，'+c.self+'感激。只是眼下尚不能应，望陛下容缓一缓。';
  session.recruitConsent=willing?p.id:null;
  openModal('议入内廷',p.name,'<div class="scene-text">“'+esc(reply)+'”</div><div class="opts">'+
   (willing?'<button class="opt" data-action="recruitConfirm" data-id="'+p.id+'"><b>依礼安置，准其交接旧事</b><small>内库12；消耗本次1次互动。</small></button>':'')+
   '<button class="opt" data-action="backSession"><b>暂缓此事</b></button></div>','内廷议事');
 };
 const oldRecruit=actions.recruitConfirm;
 actions.recruitConfirm=id=>{if(session?.recruitConsent!==id){toast('须先问明本人意愿。');return;}oldRecruit(id);if(state.relations[id]?.rank&&session){session.response='册封的礼单已交内廷，旧差遣另行交接。<br><br>“臣谢恩，往后自当珍重。”';renderSession();save();}};

 /* Report templates: jurisdiction, source, verification, imperial decision and delayed return. */
 const REPORTS=[
  {id:'doctor',title:'京郊缺医，请拨药材',office:'太医院会同顺天府',source:'顺天府呈报，太医院验册',
   brief:'京郊三村近日求医者增多，乡间医者不足。顺天府已报人数，太医院拟遣医官两名，所需药材尚未拨给，请旨。',
   evidence:['顺天府已呈三村就诊名册；尚不能据此断为疫病。','太医院报：现有医官可暂调两名，随行药材须另拨。'],role:'medicine',
   choices:[['准拨药材，命两衙协办',4,3,{people:3},'医官已抵三村，逐户诊治；病例分册送回，暂未查出同源疫患。','救治优先'],['先核病情，分送诊籍',1,2,{people:1},'诊籍已核，病者以旧疾居多；少数疑症另行复诊，药材数目重新列报。','核查优先'],['命顺天府依例办理，异常再奏',0,4,{people:1},'顺天府依例聘医补药，太医院复核了疑症；办理花销留府核销。','授权有司']]},
  {id:'examcheat',title:'科场受礼之告，请核实',office:'都察院',source:'考生具名陈告；尚无定案',brief:'有考生具名告考官受礼。都察院已封存所指礼单，真伪尚待核验，请定查办之法。',
   evidence:['具名陈告已收，不等于受礼之事属实。','所指礼单尚须与往来凭据、经手人口供互证。'],role:'justice',
   choices:[['封存卷册，交都察院核查',2,4,{authority:2},'礼单与经手人口供已有出入，御史已列疑点，未贸然定罪。','封卷核查'],['先护陈告者，另核来历',1,3,{people:1},'陈告者暂得安置，荐举与往来另行核问；所告仍按证据查验。','保护陈告'],['命有司限期复核，毋扰考试',0,5,{authority:1},'有司另派人员复核，考试照常；所涉考官回避相关卷册。','分事办理']]},
  {id:'envoy',title:'邻使请议互市',office:'鸿胪寺会同礼部',source:'使者国书与贡物清单',brief:'邻国使者请以马匹易丝。鸿胪寺已验国书，马匹尚须兵部验看，市价由户部核议，请示是否准议。',
   evidence:['国书与使者名籍相合。','来马尚未经军需验看，不宜只据外观定价。'],role:'ritual',
   choices:[['准议，先验马与市价',6,4,{army:2},'兵部验马、户部议价后，首批交换按核定数交割。','验货议价'],['先准小额试易',3,3,{authority:1},'首批试易已毕，验收与折价仍分别留档，未许长期定额。','限额试易'],['赐书回礼，暂缓互市',0,2,{authority:1},'使者领回国书，鸿胪寺依礼送行；互市之议暂缓，往来未断。','暂缓互市']]},
  {id:'market',title:'东市伤人案，附地方办理单',office:'顺天府',source:'府衙例行办结前报；非必请旨事项',brief:'东市两商户争摊伤人，顺天府已验伤、传双方问话，拟依律处断。此为例行报备，无须陛下逐项亲断。',
   evidence:['验伤与现场证言由府衙留存。','摊位旧契须一并核验，不能以谁先告状判曲直。'],role:'justice',
   choices:[['命依律办结，留册备查',0,2,{security:2},'府衙核过旧契与伤情，依法判赔，双方领了文书。','依律授权'],['责复核摊契，防有豪强侵占',1,4,{authority:1},'府衙复核摊契，另查中人是否越界收钱；原伤人案仍分案处置。','核契查弊'],['交巡按抽核，毋代府衙定案',1,5,{people:1},'巡按抽核办案手续，未替府衙预断；卷册补齐后归档。','监督有司']]},
  {id:'rain',title:'城南积水，请调修渠用度',office:'工部会同顺天府',source:'雨后勘验简图、住户报损',brief:'昨夜大雨，城南三街积水。顺天府已疏散低处住户，工部查得旧渠壅塞，临时疏排之外，另请修渠用度。',
   evidence:['疏散已由府衙执行，不待御前逐户下令。','堵塞位置有勘验图，长期修渠仍须另核工料。'],role:'works',
   choices:[['先拨疏排，再核修渠工料',4,3,{people:3},'积水已退，工部另呈修渠估单；尚未将临时拨款混作全项工程款。','急缓分办'],['限工部复勘，列明用料',1,4,{authority:1},'复勘查出两段旧渠需修，估单减去重复用料，暂排仍由府衙续办。','复核工料'],['责府衙先办，按例核销',0,4,{people:1},'府衙先行疏排，工部核销必要用度；修渠另拟，不擅增名目。','地方先办']]},
  {id:'guard',title:'守门校尉获盗，请核功赏',office:'兵部',source:'守备报功、府衙收押文书',brief:'守门校尉截获盗马数人，府衙已收押。兵部核得获盗属实，尚须分清各人功次，请定赏格。',
   evidence:['盗犯已收押，追赃与审案交府衙继续。','报功名单不能仅凭主将一面之词，须核协同人员。'],role:'military',
   choices:[['核清功次，依例给赏',3,3,{army:2},'协同人员均列功册，赏银依例发给，未将全部功劳独归一人。','依例论功'],['记功候补，暂不破格',0,4,{authority:1},'校尉记功入册，晋补仍候缺额；兵部将协同者一并列名。','记功候补'],['交叉核验，勿冒功漏功',1,4,{authority:2},'核报补入两名漏列守卒，功次更正后再行给赏。','复核功次']]}
 ];
 function chooseActor(role){return PEOPLE.find(p=>roleOf(p)===role&&!state.relations[p.id].rank)||PEOPLE.find(p=>p.official)||PEOPLE[0];}
 function reports(){
  const v=ensure();advanceReports();
  if(v.reportMonth!==state.elapsed){v.reportMonth=state.elapsed;
   const pool=REPORTS.slice().sort((a,b)=>hash(state.elapsed+':report:'+a.id)-hash(state.elapsed+':report:'+b.id));
   for(const t of pool.filter(t=>t.id!=='cooperate').slice(0,3)){const actor=chooseActor(t.role),other=PEOPLE.find(p=>p.official&&p.id!==actor.id&&!state.relations[p.id].rank)||PEOPLE[1];
    v.reports.push({uid:'report-'+(++v.serial),template:t.id,month:state.elapsed,stage:'呈报',created:mindTick(),actor:actor.id,other:other.id,heard:[],done:false});}
  }return v.reports.filter(x=>x.month===state.elapsed||!x.done||x.echoed&&x.echoMonth===state.elapsed);
 }
 function template(r){return REPORTS.find(x=>x.id===r.template);}
 function reportCard(r){const t=template(r);return '<div class="record"><span class="tag">'+esc(t.office)+' · '+esc(r.stage)+'</span><b>'+esc(t.title)+'</b><p>'+esc(r.done?r.result:t.brief)+'</p>'+(r.echoed?'<p>'+esc(r.echo)+'</p>':'')+'<button class="btn ghost" data-action="voiceReportOpen" data-id="'+r.uid+'">'+(r.done?'核看回奏':'核看呈报')+'</button></div>';}
 eventMenu=function(){openModal('御前呈报','谢无咎：“陛下，有司新呈的文书已分好。须请旨的在前，例行报备的另附于后。”',reports().map(reportCard).join('')||'<p>今日暂无待决文书。</p>','朝廷文书');save();};
 sceneEventOpen=function(id){const r=reports().find(x=>x.uid===id||x.template===id);if(r)openReport(r.uid);};
 function openReport(uid){
  const r=ensure().reports.find(x=>x.uid===uid);if(!r)return;const t=template(r),p=PEOPLE.find(x=>x.id===r.actor);
  openModal(t.title,t.office,'<div class="record"><b>报事依据</b><p>'+esc(t.source)+'</p></div><div class="scene-text">'+
   (r.done?'“臣等奉旨办理，今将经过具奏：'+esc(r.result)+'”':'“启奏陛下，'+esc(t.brief)+'”')+'</div>'+
   t.evidence.map((s,i)=>'<div class="record"><button class="text-btn" data-action="voiceReportEvidence" data-id="'+uid+'|'+i+'">'+(r.heard.includes(i)?'已核问':'核问')+' · '+(i+1)+'</button>'+(r.heard.includes(i)?'<p>'+esc(s)+'</p>':'')+'</div>').join('')+
   (r.stage==='呈报'?'<div class="opts">'+t.choices.map((c,i)=>'<button class="opt" data-action="voiceReportChoose" data-id="'+uid+'|'+i+'"><b>'+esc(c[0])+'</b><small>'+(c[1]?'内库 '+c[1]:'依例办理，无额外拨款')+' · 约'+c[2]+'日回奏</small></button>').join('')+'</div>':'<p>'+esc(r.done?'回奏已收，后续仍留有司续查。':'旨意已下，正在办理，不重复下旨。')+'</p>')+
   '<button class="text-btn" data-action="voiceReportVisit" data-id="'+uid+'">召见'+esc(p.name)+'核问 · 1行动</button>','呈报 · 核问 · 裁决 · 回奏');save();
 }
 function reportRelation(r,delta,text){
  const p=PEOPLE.find(x=>x.id===r.actor),q=PEOPLE.find(x=>x.id===r.other);if(!p||!q)return;
  let e=socialEdgesOf(p.id).find(x=>x.a===q.id||x.b===q.id);
  if(!e){e={a:p.id,b:q.id,affAB:40,affBA:40,kind:'奉旨协办',origin:text};state.socialEdges.push(e);}
  e.affAB=clamp((e.affAB??40)+delta);e.affBA=clamp((e.affBA??40)+delta);e.recent=text;
  r.relation={a:p.id,b:q.id,delta};rememberMind(p.id,text,'政务回奏',true);rememberMind(q.id,text,'政务回奏',true);
 }
 function decideReport(raw){
  const [uid,n]=String(raw).split('|'),r=ensure().reports.find(x=>x.uid===uid),i=Number(n);if(!r||r.stage!=='呈报'||![0,1,2].includes(i))return;
  const t=template(r),c=t.choices[i];if(!pay(0,c[1]))return;
  r.choice=i;r.stage='奉旨办理';r.due=mindTick()+c[2];r.echoDue=state.elapsed+3;
  r.order=c[0];r.decided=state.elapsed;r.verified=r.heard.length===t.evidence.length;
  const actor=PEOPLE.find(x=>x.id===r.actor);state.relations[r.actor].loyalty=clamp(state.relations[r.actor].loyalty+1);
  reportRelation(r,i===2?2:1,actor.name+'奉旨与'+PEOPLE.find(x=>x.id===r.other).name+'协办“'+t.title+'”，尚待回奏。');
  log(t.title+'：奉旨“'+c[0]+'”，限'+c[2]+'日回奏。','政务',r.actor);save();eventMenu();
 }
 function advanceReports(){
  const v=state.courtVoice;if(!v)return;
  for(const r of v.reports){const t=template(r);if(!t)continue;
   if(r.stage==='奉旨办理'&&mindTick()>=r.due){
    const c=t.choices[r.choice];r.stage='已回奏';r.done=true;r.result=c[4];govEffect(c[3]);
    reportRelation(r,2,'“'+t.title+'”回奏：'+r.result);log(t.title+'回奏：'+r.result,'政务回奏',r.actor);
   }
   if(r.done&&!r.echoed&&state.elapsed>=r.echoDue){
    r.echoed=true;r.echoMonth=state.elapsed;r.echo='前次“'+t.title+'”的办理册送回复核：当时依“'+t.choices[r.choice][5]+'”办理，此次由原协办者续核凭据。';
    rememberMind(r.actor,r.echo,'政务回奏',true);log(r.echo,'后续回响',r.actor);
    v.echoes=v.echoes||[];v.echoes.push({report:r.uid,text:r.echo,month:state.elapsed});
   }
  }
 }
 actions.voiceReportOpen=openReport;
 actions.voiceReportEvidence=raw=>{const[uid,n]=raw.split('|'),r=ensure().reports.find(x=>x.uid===uid),i=Number(n);if(!r||!template(r).evidence[i])return;if(!r.heard.includes(i))r.heard.push(i);save();openReport(uid);};
 actions.voiceReportChoose=decideReport;
 actions.voiceReportVisit=uid=>{const r=ensure().reports.find(x=>x.uid===uid);if(!r)return;visit(r.actor);if(session?.id===r.actor){session.report=uid;session.message='你召见'+PEOPLE.find(x=>x.id===r.actor).name+'，核问“'+template(r).title+'”。';renderSession();}};
 actions.randomEvent=eventMenu;actions.sceneEventOpen=sceneEventOpen;actions.sceneEventChoose=decideReport;
 // Keep legacy monthEvents for old save compatibility, but its UI no longer supplies court speech.

 /* Daily facts feed dialogue and observable notices; meetings leave a relationship and a follow-up. */
 const stageNames=['偶遇','试探','合作','误会','争执','拉拢','结盟','决裂'];
 function dailyConsequences(key){
  const v=ensure();if(v.days[key])return;const day=state.dailyHistory[key];if(!day)return;v.days[key]=true;
  const acted=new Set();
  for(const p of PEOPLE){
   const r=state.relations[p.id],m=r.mind,entry=day.entries[p.id]?.[3];if(!entry)continue;
   const fact=m.memories.slice().reverse().find(x=>x.tick===mindTick()&&['自主日常','往来'].includes(x.kind));
   if(!fact){const text='整理'+(r.rank?'住处用物':p.role+'手头事务')+'，将未完的事留条记下。';entry.text=text;rememberMind(p.id,text,'自主日常',true);}
   // Persistent disposition: never announce a new summons, marriage or political victory without an actual action.
   r.agency.goal=MIND_PROFILE[p.id]?.goal||'将'+context(p).specialty+'习得更精熟';
   r.agency.plan=entry.text;
   if(m.broken>0&&m.disappointment>=38&&m.appointment){
    const old=m.appointment;m.appointment=null;rememberMind(p.id,'因先前失约尚未释怀，托人辞去下一次邀约。','取消约定',true);
    state.ecology.inbox.push({id:'cancel-'+p.id+'-'+key,npc:p.id,kind:'invite',tick:mindTick(),expires:mindTick()+3,done:false,opened:false,
     voiceText:'前约请容暂缓。臣尚有未解之事，不敢勉强赴席，望陛下恕罪。',cancelled:old.tick});
   }
   const edge=socialEdgesOf(p.id).find(e=>!acted.has([e.a,e.b].sort().join('|'))&&
    (entry.text.includes(PEOPLE.find(q=>q.id===(e.a===p.id?e.b:e.a))?.name)||e.recent?.includes(key)));
   if(!edge)continue;const eid=[edge.a,edge.b].sort().join('|');acted.add(eid);
   const prior=edge.voiceStage||'偶遇',liking=Math.min(edge.affAB??40,edge.affBA??40),tense=/争执|不合|未谈拢/.test(entry.text);
   let next=prior;
   if(tense)next=prior==='争执'?'决裂':prior==='误会'?'争执':'误会';
   else if(liking>=65)next=prior==='拉拢'?'结盟':prior==='结盟'?'结盟':'拉拢';
   else next=prior==='偶遇'?'试探':prior==='试探'?'合作':prior==='误会'?'试探':prior==='争执'?'拉拢':prior==='决裂'?'试探':prior;
   edge.voiceStage=next;edge.voiceLastDay=key;
   if(next!==prior){const other=PEOPLE.find(x=>x.id===(edge.a===p.id?edge.b:edge.a));
    const text=p.name+'与'+other.name+'今日往来后，由“'+prior+'”转为“'+next+'”。';rememberMind(p.id,text,'关系变化',true);rememberMind(other.id,text,'关系变化',true);
    if(['误会','争执','拉拢','结盟','决裂'].includes(next)){
     const id='relation-'+(++state.agency.seq);state.agency.scenes.push({id,dayKey:key,source:p.id,target:other.id,kind:'relationship',title:p.name+'与'+other.name+' · '+next,text:entry.text,done:false,voiceStage:next,edge:eid});
    }
   }
  }
  advanceReports();
 }
 REPORTS.push({id:'cooperate',title:'协办争议，请明责分事',office:'有司会同内阁',source:'两名经手者陈说；尚不能据争执断其失职',role:'personnel',
  brief:'两名经手者对协办先后各执一词，原事尚未办结。双方已具说法，拟先核交接记录，再明责分事，请旨。',
  evidence:['两人的陈说均已收存，尚须与交接簿互证。','意见不合不是犯罪证据，不能先行定罪。'],
  choices:[['核交接簿，令二人分段协办',1,3,{authority:1},'交接簿核过，两人所领事项重新列明，各据实回报，不再相互等候。','明责协办'],
   ['另派中人复核，二人分别陈报',2,4,{authority:2},'复核者将争议与原事分开，原事继续办理，责任另据记录厘清。','独立核验'],
   ['暂分差遣，限期补全卷册',0,5,{authority:1},'两人暂分差遣，原卷已交接，未将争执直接作为惩处依据。','暂分差遣']]});
 const oldAgencyOpen=agencyOpen,oldAgencyChoose=agencyChoose;
 agencyOpen=function(id){
  const s=state.agency.scenes.find(x=>x.id===id&&!x.done);if(!s?.voiceStage)return oldAgencyOpen(id);
  const p=PEOPLE.find(x=>x.id===s.source),q=PEOPLE.find(x=>x.id===s.target);
  openModal(s.title,'宫人传来的话，只作线索','<div class="scene-text">'+esc(s.text)+'</div><p>所涉人物：'+esc(p.name)+'、'+esc(q.name)+'。两人的说法须分别听取，不因先来告知便先信一方。</p><div class="opts">'+
   '<button class="opt" data-action="agencyChoose" data-id="'+id+'|listen"><b>分别听取，暂不定是非</b></button>'+
   '<button class="opt" data-action="agencyChoose" data-id="'+id+'|call"><b>令其当面陈明，核对来由</b></button>'+
   '<button class="opt" data-action="agencyChoose" data-id="'+id+'|leave"><b>暂不干预，留意后续</b></button></div>','人物往来 · 待核');
 };
 agencyChoose=function(raw){
  const [id,choice]=String(raw).split('|'),s=state.agency.scenes.find(x=>x.id===id&&!x.done);
  if(!s?.voiceStage)return oldAgencyChoose(raw);if(!['listen','call','leave'].includes(choice))return;
  const p=PEOPLE.find(x=>x.id===s.source),q=PEOPLE.find(x=>x.id===s.target),edge=socialEdgesOf(p.id).find(e=>e.a===q.id||e.b===q.id);
  if(!edge)return;s.done=true;
  const delta=choice==='listen'?2:choice==='call'?-1:0;
  edge.affAB=clamp(edge.affAB+delta);edge.affBA=clamp(edge.affBA+delta);
  shiftMind(p.id,choice==='listen'?{security:3,anger:-3}:choice==='call'?{anger:3}:{expectation:-1});
  shiftMind(q.id,choice==='listen'?{security:3,anger:-3}:choice==='call'?{anger:3}:{expectation:-1});
  const text=choice==='listen'?'女帝分别听取两人陈说，未凭传话定是非。':choice==='call'?'女帝召双方当面陈说，并命核对原委。':'女帝暂未干预，两人的往来仍按各自打算继续。';
  rememberMind(p.id,text,'关系变化',true);rememberMind(q.id,text,'关系变化',true);
  const v=ensure();v.relationFollowups=v.relationFollowups||[];
  v.relationFollowups.push({source:p.id,target:q.id,choice,due:mindTick()+2,stage:s.voiceStage,done:false});
  if(choice==='call'&&p.official&&q.official&&!state.relations[p.id].rank&&!state.relations[q.id].rank){
   v.reports.push({uid:'report-'+(++v.serial),template:'cooperate',month:state.elapsed,stage:'呈报',created:mindTick(),actor:p.id,other:q.id,heard:[],done:false});
  }
  if(state.relations[p.id].rank&&state.relations[q.id].rank){
   const favored=choice==='listen'?3:1;shiftMind(p.id,{jealousy:-favored});shiftMind(q.id,{jealousy:-favored});
  }
  log(p.name+'与'+q.name+'：'+text,'人物往来',p.id);closeModal();render();result('已留意此事',text,'两日后再看双方如何行事。');save();
 };
 actions.agencyOpen=agencyOpen;actions.agencyChoose=agencyChoose;
 function relationshipReturns(){
  const v=ensure();for(const f of v.relationFollowups||[]){if(f.done||mindTick()<f.due)continue;f.done=true;
   const p=PEOPLE.find(x=>x.id===f.source),q=PEOPLE.find(x=>x.id===f.target);if(!p||!q)continue;
   const edge=socialEdgesOf(p.id).find(e=>e.a===q.id||e.b===q.id);if(!edge)continue;
   const wantsPeace=['温柔体贴','圆融世故','严正守礼'].includes(p.type),positive=f.choice==='listen'||(wantsPeace&&f.choice!=='call');
   const next=positive?'合作':f.choice==='call'?'争执':Math.min(edge.affAB,edge.affBA)<30?'决裂':f.stage;
   edge.voiceStage=next;edge.affAB=clamp(edge.affAB+(positive?2:-2));edge.affBA=clamp(edge.affBA+(positive?2:-1));
   const text=p.name+'与'+q.name+(positive?'再次相见，愿将未说清的事各退一步续谈。':next==='决裂'?'此后避开对方，原先托办的事改由旁人传达。':'仍各持原说，往来时只谈必要的事。');
   rememberMind(p.id,text,'关系变化',true);rememberMind(q.id,text,'关系变化',true);
   state.agency.scenes.push({id:'relation-'+(++state.agency.seq),dayKey:todayKey(),source:p.id,target:q.id,kind:'relationship',title:p.name+'与'+q.name+' · 后续',text,done:false,voiceStage:next});
  }
 }
 const oldBuild=buildDay;
 buildDay=function(){const key=oldBuild();dailyConsequences(key);relationshipReturns();return key;};
 // No repeated meter drift simply from opening a UI panel.
 const oldNeeds=agencyNeedAfter;
 agencyNeedAfter=function(p,moment){const a=state.relations[p.id].agency;if(a.voiceNeedDay===moment.key)return;a.voiceNeedDay=moment.key;oldNeeds(p,moment);};
 const oldPanel=agencyPanel;
 agencyPanel=function(){buildDay();oldPanel();const b=$('modalBody');if(b){const v=ensure();const extra=v.reports.filter(r=>r.done).slice(-3);if(extra.length)b.insertAdjacentHTML('beforeend','<h3>有司回奏</h3>'+extra.map(reportCard).join(''));}};
 actions.agencyPanel=agencyPanel;
 const oldLetter=openMindLetter;
 function letterText(p,mail){
  if(mail.voiceText)return mail.voiceText;
  const c=context(p,'letter'),m=state.relations[p.id].mind;
  if(m.broken>0&&['失望','委屈','疏离'].includes(c.mood))return '前次未能见驾，有些话仍未说开。若陛下近日得闲，'+c.self+'想当面禀明。';
  if(mail.event)return c.self+'有“'+mail.event.title+'”一事须当面禀明，不敢只凭传话陈说。伏候召问。';
  return c.self+'今日手头事毕，备了薄茶。若陛下得闲，盼能一见；若政务未毕，便不敢相扰。';
 }
 mindLine=function(p){const mail=state.ecology.inbox.slice().reverse().find(x=>x.npc===p.id&&!x.done);return letterText(p,mail||{});};
 openMindLetter=function(id){const mail=state.ecology.inbox.find(x=>x.id===id&&!x.done);if(!mail)return;const p=PEOPLE.find(x=>x.id===mail.npc);if(!p)return;
  if(mail.kind==='event'&&mail.opened){showMindEvent(mail);return;}
  openModal(p.name+'递来的信',identity(p,'letter').role,'<div class="scene-text">'+esc(letterText(p,mail))+'</div><div class="opts">'+
   (mail.cancelled?'':'<button class="opt" data-action="mindReply" data-id="'+id+'|now"><b>准见，当面问话</b><small>1行动</small></button><button class="opt" data-action="mindReply" data-id="'+id+'|later"><b>回信，约明日相见</b></button>')+
   '<button class="opt" data-action="mindReply" data-id="'+id+'|decline"><b>'+(mail.cancelled?'准其暂缓':'谕近日事忙，暂不许期')+'</b></button></div>','人物来信');save();};
 actions.mindLetter=openMindLetter;
 const beforeRender=render;
 render=function(){beforeRender();const b=$('screen');if(b&&state.tab==='home'){
  const title=Array.from(b.querySelectorAll('h3')).find(x=>x.textContent==='谢无咎带来的消息');
  if(title){title.textContent='新呈文书';title.nextElementSibling.textContent='“陛下，有司呈报的文书在此，请御览。”';}
 }};
  const priorArchive=archive;
 archive=function(id){priorArchive(id);const p=PEOPLE.find(x=>x.id===id),body=$('modalBody');if(!p||!body)return;
  const rs=socialEdgesOf(id).filter(e=>e.voiceStage);if(rs.length)body.insertAdjacentHTML('beforeend','<div class="card"><h3>往来进展</h3>'+rs.map(e=>'<p>'+esc(PEOPLE.find(x=>x.id===(e.a===id?e.b:e.a))?.name)+' · '+esc(e.voiceStage)+'</p>').join('')+'</div>');
 };
 actions.archive=archive;
 const beforeDetail=openMindDetail;
 openMindDetail=function(id){beforeDetail(id);const p=PEOPLE.find(x=>x.id===id),m=state.relations[id]?.mind,b=$('modalBody');if(!p||!m||!b)return;
  if(m.disclosures.includes('family'))b.insertAdjacentHTML('beforeend','<div class="record"><b>谈及家事后所知</b><p>'+esc(VOICE_FAMILY(p))+'</p></div>');
 };
 function VOICE_FAMILY(p){return COURT_VOICE_DATA.rows.find(x=>x.personality===p.type&&x.topic==='family')?.reply.replaceAll('{self}',identity(p).self)||'尚未谈及详情。';}
 actions.mindDetail=openMindDetail;
 window.__courtVoiceAudit={version:11,turn,context,similarity,advanceReports,reports,template,stageNames,rows:COURT_VOICE_DATA.rows.length};
 window.__courtVoiceAudit.renderTurn=html;
 // V13 integration point: exactly one recorded turn owns one reply and one mechanics application.
 window.__courtVoiceAudit.perform=function(p,scene,effects={}){
  ensure();if(!session||session.id!==p.id||session.left<1||!scene||!scene.reply)return false;
  const m=state.relations[p.id].mind;
  if(m.turns.some(t=>t.semantic===scene.semantic)){
   session.response='<span class="mind-stage">这一回的心意已经记下，先换件新事聊聊吧。</span>';renderSession();return false;
  }
  const c={...context(p),cause:scene.lifeFact||null,thread:scene.id};
  const row=record(p,{...scene,reply:fill(scene.reply,c)},c),prev=active,before=session.left;
  active={npc:p.id,category:row.category,topic:row.topic,row};
  try{applyInteraction(p,row.category,row.topic,row.reply,effects,{factual:true,noRepeatLine:true,extra:'宫墙小事'});}finally{active=prev;}
  return !!session&&session.left===before-1;
 };

 ensure();buildDay();save();
})();
