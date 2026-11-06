/* V18 adds independent romance and nights, while reusing real meetings, dynasty IDs and save history. */
NPC17_COPY.sections.splice(4,0,['romance','暧昧','试着靠近，听他如何回应'],['night','侍寝','正式后宫 · 先问本人意愿']);
const npc18Before={open:npc17Open,start:npc17StartSection,options:npc17Options,exclusive:npc17Exclusive,relation:npc17Relation,action:npc17Action,day:buildDay,request:npc17Request,reply:npc17RequestReply,token:npc17Token,remember:npc17Remember};
const npc18PriorPlaceGate=npc17RelationGate,npc18PriorMeet=npc17Meet;
npc17RelationGate=function(p){const q=state.world16?.people[p?.id];if(q?.source!=='generated')return npc18PriorPlaceGate(p);if(!npc17Living(p))return '此人已离世或未成年，不能安排这类会面。';const place=state.relations[p.id]?.rank?'capital':q.location||'capital',here=isAway()?state.tour.region:'capital';if(place!==here)return '他眼下在'+regionOf(place).name+'，到当地后再见。眼下仍可查看经历与家谱。';return '';};
npc17Meet=function(id){const p=npc17Person(id),q=state.world16?.people[id];if(p&&q?.source==='generated'&&isAway()&&!npc17RelationGate(p)){const people=regionOf(state.tour.region).people;if(!people.includes(id))people.push(id);}return npc18PriorMeet(id);};
const npc18PriorHeader=npc17Header;npc17Header=function(p){const q=state.world16?.people[p.id];return npc18PriorHeader(p)+(q?.source==='generated'?'<p class="mini">眼下在'+npc17Esc(regionOf(state.relations[p.id]?.rank?'capital':q.location||'capital').name)+'。</p>':'');};
function npc18Emotion(p,create=false){const own=npc17Own(p,create);if(create&&!own.emotion)own.emotion={version:1,days:[],signals:0,mutual:false,lastApproach:null};return own.emotion||{version:1,days:[],signals:0,mutual:false,lastApproach:null};}
function npc18Voice(p){return NPC18[p.id]||{...NPC18[/明朗|疏朗|野心/.test(p.type)?'bright':'quiet'],...NPC18.profiles[p.type]};}
function npc18Line(p,key,source=''){const pool=(npc18Voice(p)[key]||NPC18.quiet[key]||NPC18[key]||[]).map(s=>s.replaceAll('臣',npc17Self(p))),mem=npc17Own(p).memories;return pool.slice().sort((a,b)=>mem.filter(m=>m.reply===a).length-mem.filter(m=>m.reply===b).length||mindHash(p.id+source+a)-mindHash(p.id+source+b))[0]||'';}
function npc18Stage(p){const r=state.relations[p.id],e=npc18Emotion(p),own=npc17Own(p),tier=socialTier(p);if(e.mutual&&r.aff>=60&&r.trust>=55&&own.guard<65)return 4;if(e.signals>=2&&e.days.length>=2&&r.aff>=55&&r.trust>=50&&own.guard<65)return 3;if(tier==='trusted')return 2;if(tier==='familiar')return 1;return 0;}
function npc18RomanceGate(p){if(!p)return '此人不在此处。';return npc17RelationGate(p)||romanticReason(p,state.relations[p.id]);}
function npc18NightIdentity(p){
 if(!p)return '此人不在此处。';const r=state.relations[p.id],w=state.world16,q=w?.people[p.id],ruler=w?.people[npc17Owner()];
 if(!npc17Living(p)||!ruler?.alive||world16Age(ruler)<18)return '双方须已成年且在世。';
 if((q?.gender||p.gender)!=='男')return '此处是成年男妃的内廷安排。';
 if(p.id==='xu')return '许知衡不愿入后宫。心意如何，不改变他的首辅身份与志向。';
 if(p.id==='jiang')return '姜禹瀛仍为太傅，未曾应允入后宫；姜氏与朝职之事尚未说定。';
 if(p.id==='xie'&&!state.daliang?.privateKnown)return '谢无咎尚未亲口说明隐秘身份，不能越过这段旧事。';
 if(npc18RomanceGate(p))return npc18RomanceGate(p);
 if(!r.rank||['候选','待选'].includes(r.rank)||r.officer)return '尚未正式入后宫。先由本人同意，再完成内廷安置。';
 if(q?.royalSpouseOf&&q.royalSpouseOf!==npc17Owner())return '前代私情留在旧朝，不能沿用。';
 return '';
}
function npc18HealthReason(p){const a=state.simulation?.actors.find(a=>a.id===p.id),q=state.world16?.people[p.id];if(Math.min(a?.health??80,q?.health??80)<45)return 'ill';if(Math.max(a?.stress??20,q?.stress??20)>=65)return 'tired';return '';}
function npc18NightWilling(p,{arrival=false}={}){
 const gate=npc18NightIdentity(p)||npc17RelationGate(p);if(gate)return {reason:gate,kind:'identity'};
 const r=state.relations[p.id],own=npc17Own(p),e=npc18Emotion(p),m=r.mind;
 if((state.playerStats?.health??state.world16?.people[npc17Owner()]?.health??80)<45)return {reason:'陛下今日身子不适，今夜先安歇。'+npc17Self(p)+'改日再来相陪。',kind:'ruler-ill'};
 const health=npc18HealthReason(p);if(health)return {reason:npc18Line(p,health==='ill'?'nightIll':'nightTired'),kind:health};
 if(r.upsetDay===todayKey()||Math.max(m.anger||0,m.hurt||0,m.disappointment||0)>=45)return {reason:npc18Line(p,'nightHurt'),kind:'hurt'};
 if(!e.mutual||npc18Stage(p)!==4||r.love<6||own.guard>=55)return {reason:'尚未互通心意。高好感、封位或忠诚，都不能替本人应下这件事。',kind:'relationship'};
 if(npc17Busy(p))return {reason:'手中的差事尚未交清，今夜不能相陪。',kind:'busy'};
 if(isAway())return {reason:'出巡期间先依随行住处休息，回宫后再定内廷时辰。',kind:'location'};
 if(!arrival&&courtStatus()==='open')return {reason:'百官尚在殿中，退朝后再作内廷安排。',kind:'court'};
 return {reason:'',kind:'willing'};
}
npc17Relation=function(p){const r=state.relations[p.id],own=npc17Own(p),s=socialState(p);return '<p class="npc18-stage">'+NPC18.stages[npc18Stage(p)]+'<small>亲疏随实际相处而变</small></p><details class="npc17-details"><summary>彼此的关系</summary><p>熟悉：交谈'+s.count+'回，分'+s.days.length+'日相处。信任'+r.trust+'，亲近'+r.aff+'，情意'+r.love+'，敬重'+own.respect+'，忠诚'+r.loyalty+'，戒备'+own.guard+'。</p><p class="mini">情意记私人回应，忠诚记朝中立场。互通心意要有真实回应，数值与封位不能替代。</p></details>';};
npc17Open=function(id){npc18Before.open(id);const el=$('modalEyebrow');if(el&&el.textContent==='人物 · 八类互动')el.textContent='人物 · 十类互动';};
npc17Exclusive=function(p){return npc18Before.exclusive(p).replace(/<button[^>]*data-action="npc17Action"[^>]*data-id="(?:flirt|stay)"[\s\S]*?<\/button>/g,'');};
function npc18RomanceOptions(p){const r=state.relations[p.id],gate=npc18RomanceGate(p)||npc17PrivateGate(p);return '<p class="mini">先听本人回应。寻常一句玩笑也可能碰壁，不因示好就必定动心。</p>'+NPC18.actions.map(([key,label,desc])=>npc17Button('npc18Flirt',key,label,desc,gate||(!npc17HasTurn(p)?'本次已谈完，留到下回。':'')||(key==='token'&&!npc18Emotion(p).mutual?'先让彼此说清心意。':''))).join('');}
npc17Options=function(p,key){if(key==='romance')return npc18RomanceOptions(p);if(key==='night')return npc17Button('npc18Night',p.id,'查看内廷安排','先看条件、听他是否愿意；翻看不花安排。');return npc18Before.options(p,key).replace(/<button[^>]*data-action="npc17Action"[^>]*data-id="token"[\s\S]*?<\/button>/g,'');};
npc17StartSection=function(raw){const [id,key]=raw.split('|'),p=npc17Person(id);if(!p)return;if(key==='night')return npc18Night(id);if(key==='romance'){const gate=npc18RomanceGate(p)||npc17PrivateGate(p);if(gate){openModal(p.name+' · 暧昧','','<p>'+npc17Esc(gate)+'</p>'+npc17Relation(p)+simpleCourtButton('visit',id,'回看人物'),'各有分寸');return;}}return npc18Before.start(raw);};
function npc18Flirt(key){
 const p=session?.npc17&&npc17Person(session.id);if(!p||!NPC18.actions.some(a=>a[0]===key)||!npc17HasTurn(p)||!['romance','reward'].includes(session.npc17Section))return false;
 const gate=npc18RomanceGate(p)||npc17PrivateGate(p);if(gate){toast(gate);return false;}if(key==='token')return npc17Token(p);
 const r=state.relations[p.id],own=npc17Own(p),e=npc18Emotion(p),stage=npc18Stage(p),m=r.mind,day=simTick();
 if(own.stamps['romance:'+todayKey()]){toast('今日的话已认真说过，留些时日相处，别急着再问。');return false;}
 let accepted=true,outcome='回应',reply='',reason='依性情、心绪与共同经历回应';
 if(own.guard>=65||Math.max(m.anger||0,m.hurt||0,m.disappointment||0)>=45){accepted=false;reply=npc18Line(p,'refuse');outcome='婉拒';reason='此刻心有隔阂或仍存戒备';}
 else if(stage===0){accepted=false;reply=npc18Line(p,'first');outcome='尚守礼';reason='私下交往尚少';}
 else if(['hand','confess','miss'].includes(key)&&stage<3){accepted=false;reply=npc18Line(p,'refuse');outcome='缓一缓';reason='还未有数日相互示好的经历';}
 else if(key==='confess'&&(e.days.length<(p.id==='xu'?4:3)||r.aff<65||r.trust<60||r.love<6)){accepted=false;reply=npc18Line(p,'refuse');outcome='未应心意';reason='相处与情意仍需时间';}
 else if(p.id==='xie'&&['hand','confess'].includes(key)&&!state.daliang?.privateKnown){accepted=false;reply='奴才还有一件旧事没有亲口告诉您。这一步，容奴才先缓一缓。';outcome='有所保留';reason='隐秘身份尚未亲口说明';}
 else {reply=npc18Line(p,key);outcome=key==='confess'?'互通心意':'接住心意';}
 // The legacy flirt category forces +6 even on refusal. Use the neutral mechanics path;
 // the real action, attitude and love changes live in structured memories and the new stage.
 return npc17Commit(p,'暧昧·'+NPC18.actions.find(a=>a[0]===key)[1],reply,{category:'chat',topic:'npc18:'+key,stamp:'romance:'+todayKey(),progress:false,effects:accepted?{aff:1,love:2}:{},outcome,reason,source:own.memories.at(-1)?.id||null,tags:['暧昧',key,accepted?'回应':'保留'],after:()=>{if(accepted){const live=npc18Emotion(p,true);live.signals++;if(!live.days.includes(day))live.days.push(day);if(key==='confess')live.mutual=true;own.guard=clamp(own.guard-2);}else npc18Emotion(p,true).lastRefusal=day;},feedback:accepted?'他如何回应，已记在本代的相处里。':'他这回没有应下，留些工夫给彼此。'});
}
npc17Token=function(p){if(!npc17HasTurn(p)||!npc18Emotion(p).mutual||npc18Stage(p)!==4||npc18RomanceGate(p)||npc17PrivateGate(p)||npc17Own(p).guard>=55||npc17Stamp(p,'token'))return false;return npc17Commit(p,'互赠信物',npc18Line(p,'token'),{category:'chat',topic:'npc18:token',money:3,stamp:'token',progress:false,effects:{love:1},tags:['信物','本代心意'],after:()=>{npc17Own(p,true).keepsake={name:'约定的佩结',owner:npc17Owner(),tick:simTick()};}});};
npc17Action=function(key){const p=session?.npc17&&npc17Person(session.id);if(key==='flirt')return npc18Flirt('praise');if(key==='stay')return p&&npc18Night(p.id);return npc18Before.action(key);};
function npc18Nights(create=false){const root=npc17Root(create);if(create&&!root.nights)root.nights=[];return root?.nights||[];}
function npc18Night(id){
 const p=npc17Person(id);if(!p)return;const condition=npc18NightWilling(p),plan=npc18Nights().find(n=>n.npc===id&&n.status==='planned');
 const labels={ill:'近日抱恙',tired:'今日疲倦',hurt:'心有隔阂'};
 const explanation=condition.reason?'<div class="npc17-current">'+npc17Esc(labels[condition.kind]||'尚不便安排')+'：'+npc17Esc(condition.reason)+'</div>':'<p>彼此心意已明，仍先听他今日是否愿意。</p>';
 const buttons=!condition.reason&&!plan?[0,1].map(d=>['亥初','子初'].map(time=>npc17Button('npc18NightAsk',id+'|'+d+'|'+time,(d?'明夜':'今夜')+' · '+time,'先问本人，答应后再确认；定约用1次安排。',state.ap<1?'今日余力不足。':'')).join('')).join(''):'';
 openModal(p.name+' · 侍寝','',npc17Header(p)+explanation+(plan?'<p>已约'+npc17Esc(simDate(plan.due))+' · '+plan.time+'。结束约定那一天后，次晨留下相处记事。</p>'+npc17Button('npc18NightCancel',plan.id,'撤下这次安排','已用来传召与安排的余力不返还。'):'')+'<div class="opts npc17-options">'+buttons+'</div><p class="mini">一夜只定一人。定约用1次安排，不占会面交谈；赴约不再扣费。临时生病、疲倦或有隔阂，会再来回话。子嗣另在家人和传承中商量。</p>'+npc17Relation(p)+simpleCourtButton('visit',id,'回看人物'),'内廷 · 以本人意愿为先');
}
let npc18Pending=null;
function npc18NightAsk(raw){
 const [id,deltaText,time]=raw.split('|'),delta=Number(deltaText),p=npc17Person(id);if(!p||!['0','1'].includes(deltaText)||!['亥初','子初'].includes(time))return false;
 const gate=npc18NightWilling(p),due=simTick()+delta;if(gate.reason){npc18Pending=null;return npc18Night(id);}
 if(npc18Nights().some(n=>n.status==='planned'&&(n.due===due||n.npc===id))||delta===0&&state.bedchamber?.day===todayKey()){toast('已有未赴的安排。请先撤下原来的约，不能重叠传召。');return false;}
 if(state.ap<1){toast('今日余力不足。');return false;}
 npc18Pending={npc:id,owner:npc17Owner(),asked:simTick(),due,time,nonce:'night-consent-'+npc17Owner()+'-'+id+'-'+simTick()+'-'+due+'-'+time};
 openModal(p.name+' · 回话','','<div class="scene-text">“'+npc17Esc(npc18Line(p,'nightYes'))+'”</div><p>'+npc17Esc(simDate(due))+' · '+time+'。定约另用1次安排；若临时不适，仍可改日。</p><div class="opts">'+npc17Button('npc18NightConfirm',npc18Pending.nonce,'照此定下','用1次安排，只在本代有效。')+npc17Button('npc18NightBack',id,'先不定下','不扣安排，也不记作失约。')+'</div>','本人已应允');return true;
}
function npc18NightConfirm(nonce){
 const pending=npc18Pending,p=pending&&npc17Person(pending.npc);if(!p||nonce!==pending.nonce||pending.owner!==npc17Owner()||pending.asked!==simTick())return false;
 const gate=npc18NightWilling(p);if(gate.reason){npc18Pending=null;npc18Night(p.id);return false;}
 if(state.ap<1||npc18Nights().some(n=>n.status==='planned'&&(n.due===pending.due||n.npc===p.id))||pending.due===simTick()&&state.bedchamber?.day===todayKey())return false;
 const before=npc17CostState(p),root=npc17Root(true);state.ap--;
 const plan={id:'npc18-night-'+(++state.npc17.serial),owner:npc17Owner(),npc:p.id,requested:simTick(),due:pending.due,time:pending.time,status:'planned',consent:nonce};npc18Nights(true).push(plan);npc18Pending=null;
 npc17Remember(p,'定下侍寝时辰','应允','双方约定'+simDate(plan.due)+' · '+plan.time,npc18Line(p,'nightYes'),before,{source:plan.id,tags:['侍寝','本人同意','定约']});
 const req=root.requests.find(r=>r.kind==='night'&&r.npc===p.id&&r.status==='open');if(req){req.status='accepted';req.plan=plan.id;}
 render();npc18Night(p.id);save();return true;
}
function npc18NightCancel(id){const n=npc18Nights().find(n=>n.id===id&&n.status==='planned');if(!n||n.due<simTick())return false;n.status='cancelled';const p=npc17Person(n.npc);if(p)npc17Remember(p,'撤下内廷安排','改日','当日已使人说明，不记作失约',npc17Self(p)+'知道了。那便先各自歇下，改日再见。',npc17CostState(p),{source:n.id,tags:['侍寝','提前说明']});save();if(p)npc18Night(p.id);return true;}
function npc18ResolveNights(){
 if(!state.npc17)return;
 for(const [owner,root]of Object.entries(state.npc17.reigns))for(const n of root.nights||[]){
  if(n.status!=='planned')continue;
  if(owner!==npc17Owner()){n.status='archived';continue;}if(simTick()<=n.due)continue;
  const p=npc17Person(n.npc),late=simTick()>n.due+1;
  if(!p){n.status='unable';n.reason='此人已不在当朝名册，未续写相会。';continue;}
  const before=npc17CostState(p),check=npc18NightWilling(p,{arrival:true});
  if(late||check.reason){n.status='unable';n.reason=late?'时日已过，不倒填未曾发生的相会。':check.reason;npc17Remember(p,'内廷约未成','改日',n.reason,late?npc17Self(p)+'先前那一夜未能相见，往后若得空，再另定时辰。':check.reason,before,{source:n.id,tags:['侍寝','未赴约']});continue;}
  const prior=root.nights.filter(q=>q.id!==n.id&&q.npc===p.id&&q.status==='completed').at(-1),kind=!prior?'初次相陪':n.due-prior.due>=7&&(state.relations[p.id].mind.lastContact??0)<=prior.completed?'久别重逢':'再度相陪';
  n.status='completed';n.completed=simTick();n.scene=npc18Line(p,prior?'nightAgain':'nightFirst');n.morning=npc18Line(p,'morning');n.kind=kind;
  state.bedchamber={day:Math.floor(n.due/30)+'-'+(n.due%30+1),id:p.id,owner,source:n.id};
  npc17Remember(p,'侍寝·'+kind,'相陪',simDate(n.due)+' · '+n.time,n.morning,before,{tick:n.due,day:simDate(n.due),source:n.id,scene:n.scene,tags:['侍寝',kind,'次晨']});
  log(p.name+'：'+n.morning,'内廷相处',p.id);
 }
}
function npc18Autonomy(){
 const root=npc17Root();if(!root||root.romanceDay===simTick()||world16DeceasedRuler())return;root.romanceDay=simTick();
 for(const [id,own]of Object.entries(root.people)){
  const p=npc17Person(id);if(!p||npc18RomanceGate(p)||npc17PrivateGate(p)||npc18Stage(p)<2||own.guard>=65)continue;
  const e=npc18Emotion(p),r=state.relations[id];if(!e.signals||e.lastApproach!==null&&simTick()-e.lastApproach<7||root.requests.some(q=>q.npc===id&&['flirt','private-gift','jealous','reconcile','night'].includes(q.kind)&&q.status==='open'))continue;
  const ignored=root.requests.filter(q=>q.npc===id&&['declined','expired'].includes(q.status)).slice(-4).length,chance=Math.max(2,({xu:12,jiang:26,xie:19}[id]||28)-ignored*5);
  if(mindHash(npc17Owner()+':'+id+':approach:'+simTick())%100>=chance)continue;
  const last=own.memories.at(-1);if(!last)continue;let kind='flirt',key='approach',source=last.id,title='想单独见陛下一会儿';
  const other=npc18Nights().filter(n=>n.npc!==id&&n.status==='completed'&&simTick()-n.completed<=3&&state.relations[n.npc]?.rank).at(-1);
  const unresolved=own.memories.find(m=>(m.emotionalChanges?.anger>0||m.emotionalChanges?.hurt>0)&&!own.memories.some(later=>later.tick>m.tick&&later.tags?.includes('和解')));
  if(unresolved&&npc18Stage(p)>=3){kind='reconcile';key='reconcile';source=unresolved.id;title='有句话想重新说清';}
  else if(other&&npc18Stage(p)>=3){kind='jealous';key='jealous';source=other.id;title='想问一问近来的事';}
  else if(!npc18NightWilling(p).reason&&mindHash(id+':night:'+simTick())%3===0){kind='night';key='nightAsk';title='今夜可愿相陪';}
  else if(mindHash(id+':gift:'+simTick())%4===0){kind='private-gift';key='gift';title='带来一件亲手做的小物';}
  npc17RequestAdd(p,kind,source,npc18Line(p,key),title);npc18Emotion(p,true).lastApproach=simTick();
 }
}
function npc18RomanticRequest(req){return req&&['flirt','private-gift','jealous','reconcile','night'].includes(req.kind);}
npc17Request=function(id){const req=npc17Root()?.requests.find(q=>q.id===id),p=req&&npc17Person(req.npc);if(!npc18RomanticRequest(req))return npc18Before.request(id);if(!p||req.status!=='open'||req.expires<simTick()||npc18RomanceGate(p))return;
 openModal(p.name+' · '+req.title,'','<div class="scene-text">“'+npc17Esc(req.text)+'”</div><p class="mini">'+npc17Esc(simDate(req.created))+'递来 · '+npc17Esc(simDate(req.expires))+'前回话。翻看免费，婉拒不扣好感。</p><div class="opts">'+npc17Button('npc17RequestReply',id+'|accept',req.kind==='night'?'听他今夜的意思':req.kind==='private-gift'?'见面收下心意':'单独见面回应','会面按原规则用1次安排；今夜的约需另外听过并确认。')+npc17Button('npc17RequestReply',id+'|later','明日再回话','只延一天，不算应约。')+npc17Button('npc17RequestReply',id+'|decline','这回先婉拒','记住回话，往后不频频催问。')+'</div>','他主动递来的话');};
npc17RequestReply=function(raw){const [id,choice]=raw.split('|'),req=npc17Root()?.requests.find(q=>q.id===id);if(!npc18RomanticRequest(req)||choice!=='accept')return npc18Before.reply(raw);const p=npc17Person(req.npc);if(!p||req.status!=='open'||req.expires<simTick()||npc18RomanceGate(p))return false;
 if(req.kind==='night')return npc18Night(p.id);
 if(npc17PrivateGate(p)){toast(npc17PrivateGate(p));return false;}
 if(!npc17HasTurn(p)){const beforeAP=state.ap;npc17Meet(p.id);if(!npc17HasTurn(p)||state.ap===beforeAP&&session?.id!==p.id)return false;}
 const kind=req.kind,reply=npc18Line(p,kind==='reconcile'?'reconcile':kind==='private-gift'?'giftGiven':npc18Stage(p)>=3?'miss':'praise');
 return npc17Commit(p,'回应本人·'+req.title,reply,{category:'chat',stamp:'request:'+req.id,progress:false,source:req.source,tags:['本人主动',kind,kind==='reconcile'?'和解':'相见'],effects:{},after:()=>{req.status='accepted';if(kind==='private-gift')npc17Own(p,true).receivedGift={name:p.id==='jiang'?'棋解手稿':p.id==='xie'?'新裁书签':p.id==='xu'?'手抄批注':'亲手做的小物',owner:npc17Owner(),tick:simTick(),source:req.id};if(kind==='reconcile'){const m=state.relations[p.id].mind;m.hurt=Math.max(0,(m.hurt||0)-5);m.anger=Math.max(0,(m.anger||0)-5);}}});
};
const npc18MemoryBefore=npc17Memories;npc17Memories=function(id){npc18MemoryBefore(id);const current=npc17Root(),past=Object.entries(state.npc17?.reigns||{}).filter(([owner])=>owner!==npc17Owner());const nightRows=(root)=>root?.nights?.filter(n=>n.npc===id&&n.status==='completed').map(n=>'<article class="npc17-memory"><span class="tag">'+npc17Esc(simDate(n.due))+' · '+npc17Esc(n.kind)+'</span><p>'+npc17Esc(n.scene)+'</p><p>“'+npc17Esc(n.morning)+'”</p></article>').join('')||'';const body=nightRows(current)+past.map(([owner,r])=>nightRows(r)?'<details class="npc17-details"><summary>前代的内廷旧事</summary>'+nightRows(r)+'</details>':'').join('');if(body)$('modalBody').insertAdjacentHTML('beforeend',body);};
buildDay=function(){const w=state.world16,ruler=w?.people[npc17Owner()];if(ruler&&w.tick<simTick()&&Number.isFinite(state.playerStats?.health))ruler.health=state.playerStats.health;const key=npc18Before.day();npc18ResolveNights();npc18Autonomy();return key;};
Object.assign(actions,{visit:npc17Open,storyMeet:npc17Meet,npc17Open,npc17Meet,npc17StartSection,npc17Request,npc17RequestReply,npc17Memories,npc17Action,npc18Flirt,npc18Night,npc18NightAsk,npc18NightConfirm,npc18NightCancel,npc18NightBack:id=>{npc18Pending=null;npc18Night(id);}});
// Older buttons may still exist in saved legacy scenes. They must use the same consent rules.
intimacyQuestion=function(){if(session)npc18Night(session.id);};
intimacyConfirm=function(){return false;};actions.intimacyConfirm=intimacyConfirm;
revisionWelcome=function(id){const r=state.relations[id];if(r){r.notes=r.notes||[];r.notes.push({month:state.elapsed,text:'正式入内廷；封位不代替私人心意，仍须慢慢相处。'});}};
const npc18Style=document.createElement('style');npc18Style.textContent='.npc18-stage{color:#9b4e64;font-size:14px;margin:18px 0 6px}.npc18-stage small{display:block;color:#9c8587;font-size:11px;margin-top:5px}.npc17-options .opt:disabled{opacity:.65}.npc17-options b{letter-spacing:.06em}';document.head.appendChild(npc18Style);
window.__npc18Audit={version:18,stage:npc18Stage,emotion:npc18Emotion,night:npc18NightWilling,resolve:npc18ResolveNights,autonomy:npc18Autonomy};
