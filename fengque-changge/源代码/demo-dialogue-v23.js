/* A topic keeps the exact reply, continuation and source; viewing never chooses a new line. */
const dialogue23Before={talk:npc17OldTalk,health:npc17Health,family:npc17Relatives,living:npc17Livelihood,project:v20CommitTalk,followHtml:v20FollowHtml,options:npc17Options,meet:npc17Meet,source:v20Source,lifeValidate:FengqueLife.validate};
function d23Own(p,create=false){const life=v20Person(p,create);if(!life)return null;if(create&&!life.dialogue23)life.dialogue23={version:1,counts:{},recent:[],choices:[],pending:null,active:null,rewardDay:null};return life.dialogue23||null;}
function d23Voice(p){return DIALOGUE23[p.id]||DIALOGUE23_GENERIC[v20Kind(p)]||DIALOGUE23_GENERIC.book;}
const D23_AFTER={tea:['清茶已经沏上，没添糖。臣记着，您上回选的是这个。今日若想换，便再告诉臣。','这盏只添了半匙糖。上回您尝过，臣便记下了；今日可还照旧？'],cat23:['软垫还铺在那边。它如今倒肯睡了，只是奴才每回去坐，仍要先问过它。','那把椅子倒空出来了。奴才本该挪回去坐，想了想，还是先留在这边。'],scent23:['两只香盒已经系了不同的绳，果然没再拿错。若早些问陛下，倒省下好些工夫。','香盒分开摆了，窗边这一只便是淡的。草民不必再揭开盖子，先闻一遍才认得。'],bow23:['这个结松多了。臣如今打完便先试能不能解，免得又叫陛下笑话。','臣换了个方向打结，果然顺手。陛下教的这一点，臣记着了。'],chess23:['那枚缺角的棋子还在。臣照旧用着，没有再让人拿新的替它。','棋盘没有收。上回您落子的地方，臣另记在谱边，今日可愿换个走法？'],copy:['那张写坏的还留着。臣将它夹在帖后，免得哪日又拿自己从不写错来训您。','上回说的那一捺，臣另练了几行。陛下来看，这回收得住了。']};
function d23Tier(p){const tier=socialTier(p);return tier==='trusted'?'trusted':tier==='familiar'?'familiar':'stranger';}
function d23Pick(p,pool,key){const d=d23Own(p),texts=pool.map(t=>v20Fill(t,p)),avoid=(d?.recent||[]).slice(-Math.min(6,texts.length-1)),eligible=texts.map((text,i)=>({text,i,count:d?.counts[key+':'+i]||0})).filter(e=>!avoid.includes(e.text));return (eligible.length?eligible:texts.map((text,i)=>({text,i,count:d?.counts[key+':'+i]||0}))).sort((a,b)=>a.count-b.count||a.i-b.i)[0];}
function d23Family(p){
 const w=state.world16,n=w.people[p.id],spouse=w.people[n?.spouse],children=(n?.children||[]).map(id=>w.people[id]).filter(a=>a?.alive);
 // Current family changes supersede a static widower/no-children introduction.
 if(p.id==='jiang'&&(spouse||children.length))return [npc17Self(p)+'的家眷仍记在谱中。眼下'+(children.length?'有'+children.length+'个孩子在世。':'家中还有'+spouse.name+'。')+'至于各自的日子如何，容臣亲自问过，不拿一句“都好”敷衍陛下。'];
 if(p.id==='ye'){const father=w.people[n?.parents?.[0]],daughter=children.find(c=>c.gender==='女');return DIALOGUE23.ye.family.filter(t=>(!t.includes('父亲尚在')||father?.alive)&&(!t.includes('女儿')||daughter));}
 if(DIALOGUE23[p.id]?.family)return DIALOGUE23[p.id].family;
 const parents=(n?.parents||[]).map(id=>w.people[id]).filter(Boolean),living=parents.filter(a=>a.alive),dead=parents.filter(a=>!a.alive),self=npc17Self(p);
 if(living.length)return [self+'家中'+living.map(a=>a.name).join('、')+'尚在。只是近况没有亲自问过，'+self+'不敢替他们说一声全好。',self+'记着家中长辈。陛下问安，'+self+'领情；可眼下没有新来的家信，不好编几句报给您听。'];
 if(dead.length)return [self+'家中长辈已经不在了。有几件旧物仍留着，'+self+'不愿轻易处置。',self+'已不能再向家中长辈问安。余下的事，容'+self+'慢些说。'];
 return [self+'的家事，眼下还没说全。陛下若不急，容'+self+'慢慢讲，不先拿一句安好搪塞。',self+'没有新来的家信，不能替不在眼前的人答话。陛下这份挂念，'+self+'记下了。'];
}
function d23Commit(p,{key,stampKey=key,reply,category='care',scene='',pending=null,source='',action='问候近况',rememberChoice=null,reward=true,after=null}){
 if(!npc17HasTurn(p))return false;const stamp='dialogue23:'+stampKey+':'+simTick();if(npc17Stamp(p,stamp)){toast('方才已问过这一件。换个话题，或接着听他说。');return false;}
  const d=d23Own(p),gain=reward&&d?.rewardDay!==simTick();return npc17Commit(p,action,reply,{stamp,category,topic:category==='care'?'listen':'interest',source:source||'dialogue23:'+p.id+':'+key,effects:gain?{aff:1}:{},progress:gain,feedback:'',after:()=>{
  const q=d23Own(p,true);if(!key.startsWith('follow:'))q.counts[key]=(q.counts[key]||0)+1;q.recent.push(reply);q.recent=q.recent.slice(-8);if(gain)q.rewardDay=simTick();q.active=key;
  const e=FengqueLife.commitTalk(v20Root(true),p.id,'dialogue23:'+key,reply);q.pending=pending?{...pending,source:e.id,created:simTick(),expires:simTick()+3,reply}:null;
  if(rememberChoice){q.choices.push({...rememberChoice,tick:simTick(),source});q.choices=q.choices.slice(-20);}
  session.v23Latest=true;session.v20Scene=scene;if(category==='care'&&guide21State()?.status==='active'){state.guide21.careSeen=true;guide21Commit();}after?.();
 }});
}
function d23Talk(p,topic='near'){
 if(!v20On()||!npc17HasTurn(p))return false;const a=v20Inputs().find(a=>a.id===p.id),voice=d23Voice(p),tier=d23Tier(p),mind=state.relations[p.id].mind;
 if(a&&(a.health<45||a.stress>=65)&&topic==='near')return dialogue23Before.project(p,'care');
 if(Math.max(mind.hurt||0,mind.anger||0)>=45)return d23Commit(p,{key:'boundary',reply:p.id==='jiang'?'臣今日心绪不佳，先不陪陛下闲坐了。有些话，待臣静一静再说。':p.id==='xie'?'奴才今日笑不大出来。您不必哄，容奴才自己待一会儿就好。':npc17Self(p)+'今日心里有些乱，不想勉强说笑。陛下肯问，'+npc17Self(p)+'领情，今日便先到这里罢。'});
 if(topic==='small'){
  const scenes=voice.small||DIALOGUE23_GENERIC.book.small,d=d23Own(p),avoid=d?.choices.slice(-1)[0]?.scene,eligible=scenes.filter(s=>s.id!==avoid||scenes.length===1),scene=eligible.slice().sort((a,b)=>(d?.counts['small:'+a.id]||0)-(d?.counts['small:'+b.id]||0))[0];
  const prior=d?.choices.filter(c=>c.scene===scene.id&&c.tick<simTick()).at(-1),recall=prior&&D23_AFTER[scene.id]?.[prior.index];
  return d23Commit(p,{key:'small:'+scene.id,stampKey:'small',reply:v20Fill(recall||scene.line,p),category:'chat',scene:scene.scene||'',pending:recall?null:{scene:scene.id},action:'说些闲话'});
 }
 let pool=topic==='family'?d23Family(p):voice[topic]||voice.near||DIALOGUE23_GENERIC.book.near;
 if(topic==='near'&&tier!=='stranger')pool=[...(voice[tier]||voice.familiar||[]),...pool];
 const selected=d23Pick(p,pool,topic+':'+tier);return d23Commit(p,{key:topic+':'+tier+':'+selected.i,stampKey:topic,reply:selected.text,action:topic==='family'?'问家人近况':topic==='living'?'问近日起居':'问候近况'});
}
function d23Follow(raw){const [id,source,index]=raw.split('|'),p=npc17Person(id),q=p&&d23Own(p)?.pending;if(!p||!npc17HasTurn(p)||!q||q.source!==source||q.expires<simTick()||!['0','1'].includes(index))return false;const scene=d23Voice(p).small?.find(s=>s.id===q.scene)||DIALOGUE23_GENERIC.book.small.find(s=>s.id===q.scene),choice=scene?.choices[Number(index)];if(!choice)return false;
 const reply=v20Fill(choice[1]+(d23Tier(p)==='trusted'&&scene.close?'\n'+scene.close:''),p);return d23Commit(p,{key:'follow:'+source,reply,category:'chat',source,action:choice[0],rememberChoice:{scene:q.scene,index:Number(index),label:choice[0],reply}});
}
actions.d23Follow=d23Follow;
const d23ActionBefore=npc17Action;npc17Action=function(action){const p=session?.npc17&&npc17Person(session.id);if(v20On()&&p&&npc17HasTurn(p)&&action==='d23Small'&&npc17Options(p,session.npc17Section).includes('data-id="d23Small"'))return d23Talk(p,'small');return d23ActionBefore(action);};actions.npc17Action=action=>npc17Action(action);
npc17OldTalk=function(p,category,topic,label){if(!v20On()||!['care','chat'].includes(category)||topic.startsWith('story:')||topic.startsWith('v13:'))return dialogue23Before.talk(p,category,topic,label);if(category==='care')return d23Talk(p,'near');return v20CommitTalk(p,'chat');};
npc17Relatives=function(p){return v20On()?d23Talk(p,'family'):dialogue23Before.family(p);};
npc17Livelihood=function(p){return v20On()?d23Talk(p,'living'):dialogue23Before.living(p);};
npc17Health=function(p){return v20On()?d23Talk(p,'near'):dialogue23Before.health(p);};
// Retain actual project progression, while choosing another authored detail instead of a repeated stock answer.
v20CommitTalk=function(p,category){if(!v20On())return dialogue23Before.project(p,category);if(category==='care')return d23Talk(p,'near');if(!npc17HasTurn(p))return false;
 const life=v20Person(p,true),phase=life.readyAt!==null?'ready':life.progress?'middle':'start',key='chat:'+life.cycle+':'+phase;if(life.used[key]||0){
  const stamp='life20-talk:'+key+':'+simTick();if(npc17Stamp(p,stamp)){toast('这一件刚说过。可以接着听，或说些别的。');return false;}
  const data=v20Data(p),pool=data[phase],ix=(life.used[key]+life.cycle)%pool.length;let reply=v20Fill(pool[ix],p);if(!v20KnownProject(p))reply=v20FirstMention(reply);
  if(life.waiting&&life.readyAt===null)reply+='\n'+npc17Self(p)+'记着，等做好了再给您看，不先急着交。';
  return npc17Commit(p,'聊起手边的小事',reply,{category:'chat',topic:'interest',stamp,source:'project20:'+p.id+':'+life.cycle,effects:{},feedback:'',after:()=>{FengqueLife.commitTalk(v20Root(),p.id,key,reply,life.waiting&&life.readyAt===null?null:{kind:'project'});const d=d23Own(p);if(d){d.pending=null;d.active='project';}session.v23Latest=false;}});
 }
 const r=dialogue23Before.project(p,category);if(r){const d=d23Own(p);if(d){d.pending=null;d.active='project';}session.v23Latest=false;}return r;
};
v20FollowHtml=function(p){const d=d23Own(p),q=d?.pending;if(q&&q.expires>=simTick()){
 const scene=d23Voice(p).small?.find(s=>s.id===q.scene)||DIALOGUE23_GENERIC.book.small.find(s=>s.id===q.scene);if(!scene)return '';return '<div class="v20-follow d23-follow"><p class="v20-kicker">顺着这句话</p>'+scene.choices.map((c,i)=>v20Button('d23Follow',p.id+'|'+q.source+'|'+i,c[0],'ghost',session.left<1)).join('')+'</div>';
 }if(d?.active&&d.active!=='project')return '';return dialogue23Before.followHtml(p);};
npc17Options=function(p,key){if(!v20On())return dialogue23Before.options(p,key);const blocked=session?.left<1,option=(id,label,desc='')=>npc17Button('npc17Action',id,label,desc,blocked?'这回先谈到这里。':'');if(key==='chat')return option('chat','聊聊手边的事')+option('d23Small','说些闲话')+option('weather','聊聊时节');if(key==='care')return option('greet','近来可好？')+option('relatives','家里可安好？')+option('livelihood','近日住得惯么？');return dialogue23Before.options(p,key);};
npc17Meet=function(id){const person=npc17Person(id);if(v20On()&&person&&npc17Living(person))v20Person(person,true);const existing=!!session?.npc17&&session.id===id,r=dialogue23Before.meet(id);if(!v20On()||existing||!session?.npc17||session.id!==id)return r;const p=npc17Person(id),d=d23Own(p),q=d?.pending;if(q&&q.expires>=simTick()){session.npc17Reply=q.reply;session.v20Replies=[{id:q.source,reply:q.reply}];session.v20Scene='他将话停在了上回说到的地方，等你接下去。';session.v23Latest=true;renderSession();}return r;};actions.npc17Meet=id=>npc17Meet(id);
// Latest response remains in focus; older replies keep their actual contents in a disclosure.
const d23RenderSession=renderSession;renderSession=function(...args){const r=d23RenderSession(...args);if(!v20On()||!session?.npc17)return r;if(!session.v20Scene)document.querySelector('.v20-scene')?.remove();const log=document.querySelector('.v20-dialogue-log');if(log&&log.children?.length>1&&!log.querySelector('details')){const older=[...log.children].slice(0,-1),details=document.createElement('details'),summary=document.createElement('summary');details.className='d23-earlier';summary.textContent='方才说过的话 · '+older.length;details.appendChild(summary);for(const node of older)details.appendChild(node);log.insertBefore(details,log.firstChild);}return r;};actions.backSession=()=>renderSession();
const d23RomanceVoice=npc18Voice;npc18Voice=function(p){const old=d23RomanceVoice(p);if(!v20On())return old;const d=d23Voice(p),tier=d23Tier(p),extra={jiang:{first:['陛下慎言。臣受命教您，不敢将这样的话也当作功课来答。','陛下今日倒有兴致。先坐稳，臣这一盏茶还未喝完。'],praise:['臣平日说您这样多，您倒还肯夸臣。今日这句，便先记下了。','若是真心话，臣领了。陛下不必为叫臣高兴，便省掉自己原本想说的意见。']},xie:{first:['谢陛下。只是这话来得突然，奴才倒不知，该笑着领赏，还是先问一句缘由。','陛下这一句，奴才可得好好收着。答得太快，倒显得平日等着听似的。'],praise:['您再看，奴才便只好当真了。今日没带旁的来，只有这点笑，您收不收？','平日旁人夸奴才，多半有事相求。您若没有，倒叫奴才更舍不得这句话了。']}}[p.id];return d.flirt?{...old,first:d.flirt.stranger,praise:d.flirt[tier]||d.flirt.familiar}:extra?{...old,...extra}:old;};
const d23FlirtBefore=npc18Flirt;npc18Flirt=function(key){const p=session?.npc17&&npc17Person(session.id),stage=p&&npc18Stage(p);const r=d23FlirtBefore(key);if(r&&p&&['xu','yezhen19'].includes(p.id)&&stage===0){session.v20Scene=p.id==='xu'?'他握笔的手停了一瞬，垂眼整理纸页，耳际却慢慢红了。':'他抬眼望过来，又慌忙垂下，耳尖已染上一层薄红。';renderSession();}return r;};actions.npc18Flirt=key=>npc18Flirt(key);
const d23LetterBefore=v20LetterReply;v20LetterReply=function(raw){const [id,choice]=raw.split('|'),q=npc17Root()?.requests.find(q=>q.id===id);if(!v20On()||q?.kind!=='life20-jealous'||choice!=='accept')return d23LetterBefore(raw);const p=npc17Person(q.npc),witness=v20Root()?.company.find(e=>e.id===q.source),other=witness&&npc17Person(witness.npc);if(!p||q.status!=='open'||q.expires<simTick()||!witness?.witnesses.includes(p.id)||!other||!npc17Living(p)||npc17PrivateGate(p))return false;if(!npc17HasTurn(p))npc17Meet(p.id);if(!npc17HasTurn(p))return false;
 const lines={xu:['臣见您与'+other.name+'说话，便没有上前。可走出一段，又觉得自己避得……实在没有道理。','不是来问陛下为何见'+other.name+'。臣只是想说，今日也想与您坐一会儿，不必借公事作由头。'],jiang:['方才见陛下与'+other.name+'同游，臣便先走了。今日请您来，是臣自己的意思，不是要另添一堂讲读。','陛下见谁，自有陛下的心意。臣若也想见您，便该亲自来请，不该坐着等。'],xie:['奴才方才看见'+other.name+'陪着您，便绕到另一头去了。如今想想，路倒是绕远了，人却还是想见。','您来了便好。奴才不问您方才同'+other.name+'说了什么，只想把眼下这一会儿，留给自己。'],yezhen19:['方才见'+other.name+'在您身边，我便不敢过去。可后来又想，若我不说，您怎么知道，我也想见您。','不是要您不见'+other.name+'。只是今日若还有一点空，能不能也留给我？']};const pool=lines[p.id]||[npc17Self(p)+'方才见'+other.name+'陪着陛下，便未上前。如今亲自来请，只盼也能与陛下说几句话。'],line=d23Pick(p,pool,'jealous');return d23Commit(p,{key:'jealous:'+q.id,reply:line.text,category:'chat',source:q.source,action:'回应在园中相遇的来笺',reward:false,after:()=>{q.status='accepted';}});
};actions.v20LetterReply=raw=>v20LetterReply(raw);
const d23CommitBefore=npc17Commit;npc17Commit=function(p,action,reply,options={}){const after=options.after;return d23CommitBefore(p,action,reply,{...options,after:()=>{const d=v20On()&&d23Own(p),stamp=options.stamp||'';if(d&&!stamp.startsWith('dialogue23:')){d.pending=null;d.active=stamp.startsWith('life20-talk:')||stamp.startsWith('life20-follow:')?'project':'external';}after?.();}});};
FengqueLife.validate=function(s){dialogue23Before.lifeValidate(s);for(const p of Object.values(s.people)){const d=p.dialogue23;if(!d)continue;if(d.version!==1||!d.counts||Object.values(d.counts).some(n=>!Number.isInteger(n)||n<0)||!Array.isArray(d.recent)||d.recent.length>8||d.recent.some(s=>typeof s!=='string')||!Array.isArray(d.choices)||d.choices.length>20)throw Error('人物对白记事有误。');for(const c of d.choices)if(![0,1].includes(c.index)||!Number.isInteger(c.tick)||c.tick>s.tick||typeof c.source!=='string')throw Error('人物续谈来源有误。');if(d.pending&&(![...p.facts,...s.events].some(e=>e.id===d.pending.source&&e.kind==='conversation'&&e.npc===p.id)||!Number.isInteger(d.pending.expires)||d.pending.expires!==d.pending.created+3||d.pending.created>s.tick||typeof d.pending.reply!=='string'))throw Error('未完闲话的来源或日期有误。');}return true;};
