'use strict';
// Existing affinity/love values remain canonical so older saves retain progress.
function ensureInteractionStats(){
 for(const p of PEOPLE){const r=state.relations[p.id];if(!Number.isFinite(r.politics))r.politics=clamp(p.skills?.admin??r.skills?.admin??30);if(!Number.isFinite(r.force))r.force=clamp(p.skills?.military??r.skills?.military??30);if(!Number.isFinite(r.loyalty))r.loyalty=clamp(p.loyalty??50);if(!Number.isFinite(r.love))r.love=0;if(!r.interactionGrowth||r.interactionGrowth.month!==state.elapsed)r.interactionGrowth={month:state.elapsed,loyalty:0,love:0,ability:0};if(!r.dailyCounts||r.dailyCounts.day!==state.day||r.dailyCounts.month!==state.elapsed)r.dailyCounts={month:state.elapsed,day:state.day,aff:0,love:0,keys:{}};}
}
ensureInteractionStats();
const INTERACTION_CATEGORIES=[
 ['chat','闲谈','问近况、聊故乡、聊兴趣'],['probe','打探','问态度、问交际，听话里的保留'],['care','关心','听心事、送礼物、约下次见面'],['scold','训斥','提醒规矩、批评、敲打'],['flirt','暧昧','夸赞、表达想念、表明心意'],['sleep','侍寝','好感达到门槛后，先问本人意愿']
];
function fiveStats(p,compact=false){const r=state.relations[p.id];return `<div class="five-stats ${compact?'compact':''}">${[['政略',r.politics],['武力',r.force],['好感度',r.aff],['忠诚度',r.loyalty],['暧昧度',r.love]].map(([k,v])=>`<span><small>${k}</small><b>${v}</b></span>`).join('')}</div>`;}
function romanticReason(p,r){if(castAge(p)<18)return '尚未成年';if(!p.romance)return '对方目前只以公事、朋友相处';if(r.aff<35)return '好感度达到35后可调情';return '';}
function sleepReason(p,r){if(!p||castAge(p)<18)return '对方尚未及龄';if(r.aff<55)return '好感度达到55后，才有资格问这一句';if(r.upsetDay===todayKey())return '对方今天想独处，改日再约';if(state.bedchamber?.day===todayKey())return '今夜已有安排，明日再约';if(state.ap<1)return '侍寝另需1行动';return '';}
function categoryReason(id,p,r){return id==='flirt'?romanticReason(p,r):id==='sleep'?sleepReason(p,r):'';}
const MOODS={
 '温柔体贴':{chat:'今天倒不忙，正好坐下来陪陛下说说话。',care:'本来想说没事。您肯听，我就慢慢说。',yes:'您把话说到这里，我明白了。这件事我去办。',no:'这回我有些顾虑，能不能再商量？',scold:'我听见了。只是陛下这样说，我心里也会难受。',activity:'和您一起，倒不觉得时间过得快。',flirt:'您这样认真，我也舍不得只当玩笑。'},
 '清冷克制':{chat:'手头的事刚收尾。陛下想聊什么？',care:'昨晚是睡得迟了些。坐一会儿吧，我不赶您走。',yes:'道理我听懂了，就按您说的办。',no:'这件事还欠一步。容我把顾虑说完。',scold:'哪里有错，臣会改。其余的话，也请陛下想一想。',activity:'这回可不让您了。输了，别怪我。',flirt:'这句话我记住了。陛下可别明日就忘。'},
 '明朗直率':{chat:'我正想找您呢！今天碰见一件好玩的事。',care:'真没什么大事。就是您坐在这儿，我心里就松快了。',yes:'行，我去办。遇到难处再来找您。',no:'不行，这里我想不通。您再给我讲讲？',scold:'有错我认。可您也得让我把话说完吧。',activity:'再来一回？刚才那局我还没玩够。',flirt:'您这么说，我真会当真。可不许反悔。'},
 '骄矜自尊':{chat:'刚做完手头的事。您来得倒巧。',care:'我不是要讨安慰。您愿意陪着，我就很高兴了。',yes:'这件事说得在理，我没有不答应的道理。',no:'若只是要我点头，就不必特地问我了。',scold:'我若有错，请说清楚。别只拿难听话压我。',activity:'下回还来么？我给您留着位置。',flirt:'您是随口哄我，还是只想这样对我说？'},
 '敏感多思':{chat:'早上想了些事，没想明白。正好想问问您。',care:'我怕说多了惹您烦。您真愿意听？',yes:'您把缘由说清了，我就不担心了。',no:'我还怕漏掉什么，能让我再想想吗？',scold:'原来您是这样看我的。今日就先谈到这里吧。',activity:'刚才还惦记着的事，这会儿倒放下了。',flirt:'这句话，您能不能再说一遍？我想听清。'},
 '圆融世故':{chat:'今儿听来的新鲜事不少，您想先听哪一件？',care:'难得有人先问我累不累。您这份心，我收着。',yes:'您放心，两边的话我会好好说。',no:'不是不肯，只是眼下不好办。换个法子如何？',scold:'您先消消气。该我的责任，我不会躲。',activity:'有输有赢才有意思，下回咱们再比。',flirt:'陛下这回说得太好听，我都不敢接了。'},
 '严正守礼':{chat:'近来都好。您若得空，也该歇一歇。',care:'多谢挂心。我知道照顾自己，您也一样。',yes:'于情于理都说得通，臣照办。',no:'规矩不能这样改。还请容臣直说。',scold:'臣听训。但若是无过，也不敢随意认下。',activity:'这一局下得不错。陛下肯用心，长进便快。',flirt:'这话太近了些。您让我缓一缓。'},
 '野心进取':{chat:'我正想把这件事做好。您若愿意，听我说说。',care:'累是累，事情有了起色也就值得。',yes:'给我一个机会，我会把结果交到您面前。',no:'这个安排施展不开。能不能让我换一种做法？',scold:'我会拿结果说话。也请您别先把我看轻了。',activity:'这回我记下了，下回还想赢您。',flirt:'我有很多想争的。眼下最想争的，是您多看我一眼。'},
 '疏朗洒脱':{chat:'刚从外头回来，路上见了不少有意思的事。',care:'陪我坐一会儿吧。别的事，明日再说。',yes:'好，既然说开了，我也没什么放不下的。',no:'这条路我不大想走。换一条试试？',scold:'我听着呢。只是这话说重了，就不好收回了。',activity:'这半日过得痛快。下回出门也叫上我。',flirt:'您若当真，我就不装作听不懂了。'},
 '务实重利':{chat:'最近东西涨价，我又重算了一遍家用。',care:'您肯记挂，比送多少东西都难得。',yes:'利弊都算清了，我愿意试一试。',no:'这笔账算不平。您也得给我留条退路。',scold:'您把话说重了。该办的事，我还是会办。',activity:'难得闲半日。这趟值了。',flirt:'这句话可不能按场面话算，我要认真收着。'},
 '寡言重诺':{chat:'都好。您交代的事，也记着。',care:'不累。您要坐，就再坐一会儿。',yes:'明白。答应的事，我会办到。',no:'这件事，我现在还答应不了。',scold:'有错会改。没做过的，不认。',activity:'下次还来。我等您。',flirt:'听见了。我也想您。'},
 '戒备善谋':{chat:'有几件小事，想等您得空再说。',care:'您一问，我倒不知道该先说哪句。',yes:'您既然想清楚了，我就去安排。',no:'眼下不合适。您再给我一点时间。',scold:'您说的，我记下了。今日先告退。',activity:'难得不用猜人心，这一会儿倒轻松。',flirt:'这话若是真的，您就别急着走。'}
};
function moodOf(p){return MOODS[p.type]||MOODS['温柔体贴'];}
function socialEdgesOf(id){return state.socialEdges.filter(e=>e.a===id||e.b===id);}
function topicsFor(category,p,r){
 const topics={chat:[['recent','问问近况','聊聊近日在忙什么。'],['home','聊聊故乡','听听家乡的人和事。'],['interest','问平日喜欢什么','不急着谈公事。']],care:[['listen','陪着听他说话','好感度+4，忠诚度+1。'],['comfort','劝他歇一歇','好感度+3，忠诚度+1。'],['gift','送一份合心意的礼物','内库8；本月一次。'],['promise','约好下月再见','生成约定，失约会伤感情。']],persuade:[['support','请他支持这次安排','成败取决于双方政略、忠诚度与好感度。'],['work','和他商量一件差事','讲清理由，再看对方肯不肯。'],['reconcile','劝他少与人争执','成功后，缓和一段现有交际关系。']],probe:[['opinion','问他怎么看自己','好感度、忠诚度影响他肯说多少。'],['worry','试着问一问心事','关系不够近时，对方会保留。']],scold:[['remind','提醒他注意分寸','无过错也责备，会损伤好感度。'],['stern','严厉斥责','好感度−4，忠诚度−2。'],['public','当面敲打，不许顶嘴','好感度−6，忠诚度−3；可能使对方疏远。']],activity:[['chess','一起下棋','好感度+3，政略+1。'],['walk','一起散步','好感度+4。'],['spar','切磋几招','好感度+3，武力+1。']],flirt:[['compliment','认真夸他一句','好感度+2，暧昧度+2。'],['miss','问他有没有想自己','好感度+3，暧昧度+2。'],['confess','认真表明心意','好感度+3，暧昧度+3。']],sleep:[['ask','问他今夜愿不愿留下','先听本人回答，确认后另耗1行动。']]};
 if(category==='care'&&state.gifts>0)topics.care.splice(3,0,['bag','送出游时买的小礼物',`随身还剩${state.gifts}件；好感度+3。`]);
 if(category==='persuade'&&p.romance){if(!r.rank)topics.persuade.push(['recruit','商议入宫','需好感度50、暧昧度8，取得本人同意。']);else if(r.rank==='选侍')topics.persuade.push(['promote','商议晋封','需好感度65、忠诚度60；内库15，本月一次。']);}
 if(category==='probe')for(const e of socialEdgesOf(p.id).slice(0,12)){const other=PEOPLE.find(x=>x.id===(e.a===p.id?e.b:e.a));if(other)topics.probe.push([`relation:${other.id}`,`问问他和${other.name}的来往`,'对方可能坦白、替朋友遮掩，也可能说些偏心话。']);}
 return topics[category]||[];
}
function topicReason(category,id,p,r){const gate=categoryReason(category,p,r);if(gate)return gate;if(category==='care'){if(id==='gift'&&(r.counts.newGift||state.money<8))return r.counts.newGift?'本月已赠礼':'内库不足8';if(id==='bag'&&!(state.gifts>0))return '没有可送的礼物';if(id==='promise'&&state.promises.some(x=>x.id===p.id&&!x.done))return '已有未到期的约定';}
 if(category==='persuade'&&id==='recruit'){if(r.rank)return '已在宫中';if(r.aff<50||r.love<8)return '需好感度50、暧昧度8';if(state.money<12)return '安置费需内库12';}
 if(category==='persuade'&&id==='promote'){if(r.rank!=='选侍'||r.aff<65||r.loyalty<60)return '需选侍、好感度65、忠诚度60';if(r.counts.newPromote)return '本月已晋封';if(state.money<15)return '内库不足15';}return '';
}
renderSession=function(){
 if(!session)return;ensureInteractionStats();const p=PEOPLE.find(x=>x.id===session.id),r=state.relations[p.id],section=session.section;
 const items=section?topicsFor(section,p,r):INTERACTION_CATEGORIES;
 const banner=`<div class="talk-banner">${portrait(p,true)}<div class="interaction-person"><span class="tag">${r.rank||p.role}</span><p>${p.type} · ${typeof socialLabel==='function'?socialLabel(p):''}</p><small>本次还可互动 <b>${session.left}</b> 次</small></div></div>${fiveStats(p)}<div class="scene-text" aria-live="polite">${session.response||session.message.replaceAll('\n','<br>')}</div>${session.history.length?`<p class="effect">${session.history.at(-1)}</p>`:''}`;
 const opts=items.map(([id,name,desc])=>{let reason=section?topicReason(section,id,p,r):categoryReason(id,p,r);const t=r.mind?.privateTalk,freeReplay=(section==='care'&&id==='listen'||!section&&id==='care')&&t&&canResumePrivateTalk(p)&&mindTick()-t.tick<=3&&(t.phase==='awaiting'||t.tick===mindTick());const off=!!reason||session.left<=0&&!freeReplay;return `<button class="opt interaction-option" data-action="${section?'interactionTopic':'interactionCategory'}" data-id="${id}" ${off?'disabled':''}><b>${name}</b><small>${reason||desc}</small></button>`;}).join('');
 openModal(p.name,p.desc,`${banner}${section?`<div class="section-heading"><h3>${INTERACTION_CATEGORIES.find(c=>c[0]===section)[1]}</h3><button class="text-btn" data-action="interactionBack">返回六类互动</button></div>`:''}<div class="opts ${section?'':'interaction-categories'}">${opts}</div>${session.left<=0?'<p class="mini">这次谈得够久了，留些话下回再说。</p>':''}<button class="text-btn" data-action="close">今日先到这里</button>`,'人物会面 · 1行动 / 最多3次互动');
};
function interactionCategory(id){if(!session||session.left<=0||!INTERACTION_CATEGORIES.some(c=>c[0]===id))return;const p=PEOPLE.find(x=>x.id===session.id),r=state.relations[p.id],reason=categoryReason(id,p,r);if(reason){toast(reason);return;}session.section=id;renderSession();}
function applyInteraction(p,category,id,line,effects={},options={}){
 const r=state.relations[p.id],key=`interaction:${category}:${id}`;ensureInteractionStats();const daily=r.dailyCounts;const count=daily.keys[key]||0;let scale=count===0?1:count===1?.55:0;
 if(!session||session.id!==p.id||session.left<=0)return;
 const actual={};for(let[k,v]of Object.entries(effects)){
  if(v>0){v=Math.round(v*scale);if(k==='aff'){v=Math.min(v,Math.max(0,10-daily.aff));daily.aff+=v;}if(k==='loyalty'||k==='love'){let remain=(k==='love'?8:8)-daily.love;v=Math.min(v,Math.max(0,remain));daily.love+=v;}if(k==='politics'||k==='force'){v=Math.min(v,Math.max(0,2-r.interactionGrowth.ability));r.interactionGrowth.ability+=v;}}
  const before=r[k];r[k]=clamp(r[k]+v);actual[k]=r[k]-before;
 }
 session.left--;daily.keys[key]=count+1;r.counts[key]=(r.counts[key]||0)+1;
 // The content layer already selects an unused scene for this NPC and topic. Do not
 // replace a lived-in response with the old canned repetition warning.
 if(count>=2&&!options.noRepeatLine&&(!line||line.length<8))line='这件事我方才已经说过一遍。若陛下还想听，我换个角度再说。';
 session.response=`“${line}”`;const labels={aff:'好感度',loyalty:'忠诚度',love:'暧昧度',politics:'政略',force:'武力'};
 const changes=Object.entries(actual).filter(([,v])=>v).map(([k,v])=>`${labels[k]}${v>0?'+':''}${v}`).join(' / ');
 session.history.push(`${INTERACTION_CATEGORIES.find(x=>x[0]===category)[1]} · ${changes||'没有数值变化'}${options.extra?' · '+options.extra:''}`);
 log(`${p.name} · ${INTERACTION_CATEGORIES.find(x=>x[0]===category)[1]}：${line}`,'相处',p.id);
 const day=state.dailyHistory[buildDay()]?.entries[p.id];if(day?.[3])day[3].text=`与女帝见面，${INTERACTION_CATEGORIES.find(x=>x[0]===category)[1]}：${line}`;
 render();renderSession();
}
function interactionTopic(id){
 if(!session||session.left<=0||!session.section)return;ensureInteractionStats();const p=PEOPLE.find(x=>x.id===session.id),r=state.relations[p.id],c=session.section;
 if(!topicsFor(c,p,r).some(t=>t[0]===id))return;const reason=topicReason(c,id,p,r);if(reason){toast(reason);return;}const m=moodOf(p);
 if(c==='chat'){
  const lines={recent:m.chat,home:'家乡有一条老街，早上总有人卖热饼。离开以后，倒常想起那股香味。',interest:p.skills?.military>65?'闲时喜欢骑马、练弓。不想动时，也会听人说说书。':p.skills?.literature>65?'读书、抄字都喜欢。碰见好文章，忍不住多看几遍。':'没有差事的时候，喜欢出去走走，买点吃的回来。'};applyInteraction(p,c,id,lines[id],{aff:3});return;
 }
 if(c==='care'){
  if(id==='gift'){if(!pay(0,8))return;r.counts.newGift=true;applyInteraction(p,c,id,'这份礼物，我很喜欢。原来随口说过的喜好，您真的记得。',{aff:4,loyalty:1},{extra:'内库−8'});return;}
  if(id==='bag'){if(!(state.gifts>0))return;state.gifts--;applyInteraction(p,c,id,'出门还记得我。这个小东西，我会好好收着。',{aff:3,loyalty:1},{extra:'随身礼物−1'});return;}
  if(id==='promise'){state.promises.push({id:p.id,due:state.elapsed+1,done:false});applyInteraction(p,c,id,'说好了，下个月我等您。有事来不了，也请让人告诉我。',{}, {extra:'已约好下月见面'});return;}
  applyInteraction(p,c,id,id==='listen'?m.care:'好，听您的，今天早些歇。您也别总熬着。',{aff:id==='listen'?4:3,loyalty:1});return;
 }
 if(c==='persuade'){
  if(id==='recruit'){openRecruit(p);return;}
  if(id==='promote'){if(!pay(0,15))return;r.rank='侍君';r.counts.newPromote=true;applyInteraction(p,c,id,'我知道这份信任来得不容易。往后有话，我会亲自对您说。',{loyalty:2},{extra:'晋封侍君 / 内库−15'});return;}
  const score=state.playerStats.admin*.35+r.loyalty*.35+r.aff*.3-r.politics*.25+10,success=score>=35;
  if(success&&id==='reconcile'){
   const edge=socialEdgesOf(p.id).sort((a,b)=>((a.a===p.id?a.affAB:a.affBA)-(b.a===p.id?b.affAB:b.affBA)))[0];
   if(edge){const other=PEOPLE.find(x=>x.id===(edge.a===p.id?edge.b:edge.a));const used=`reconcile:${state.elapsed}:${p.id}:${other.id}`;state.persuasionUsed=state.persuasionUsed||{};if(!state.persuasionUsed[used]){if(edge.a===p.id)edge.affAB=clamp(edge.affAB+3);else edge.affBA=clamp(edge.affBA+3);state.persuasionUsed[used]=true;edge.recent=`女帝劝${p.name}缓和与${other.name}的关系。`;applyInteraction(p,c,id,`行，我会再找${other.name}谈谈。不一定立刻和好，至少不再当面争。`,{loyalty:2},{extra:`对${other.name}好感+3`});return;}}
  }
  applyInteraction(p,c,id,success?m.yes:m.no,success?{loyalty:2}:{aff:-1});return;
 }
 if(c==='probe'){
  if(id.startsWith('relation:')){
   const otherId=id.split(':')[1],edge=socialEdgesOf(p.id).find(e=>e.a===otherId||e.b===otherId),other=PEOPLE.find(x=>x.id===otherId);if(!edge||!other)return;
   const liking=edge.a===p.id?edge.affAB:edge.affBA;let kind,line;
   if(liking>=65){kind='保留';line=`${other.name}是我的旧识。私下的事我不好替他说，陛下若想知道，不妨亲自问问。`;}
   else if(r.loyalty<35&&liking<30){kind='未经核实的说法';line=`${other.name}这人，我听说办事不太靠得住。只是旁人讲的，我没有亲眼见过。`;}
   else if(r.loyalty>=60){kind='公开来往';line=`我和${other.name}${liking<35?'有些不合，见了面也少说话':'来往过几次，算是熟人'}。旁的事，我不知道，不敢乱说。`;}
   else{kind='保留';line=`和${other.name}不过见过几面。有些事还没弄清，先不说了。`;}
   state.npcStatements=state.npcStatements||[];state.npcStatements.push({month:state.elapsed,day:state.day,source:p.id,target:otherId,kind,line,verified:false});
   applyInteraction(p,c,id,line,{}, {extra:'只记作说法，未作查实证据'});return;
  }
  const open=r.aff>=40&&r.loyalty>=50;applyInteraction(p,c,id,id==='opinion'?(open?'我愿意信您。但您答应过的事，也盼您记着。':'陛下待人如何，我还想再看看。'):(open?'有件家里的小事，原本不想烦您。您既然问了，我就说说。':'没什么要紧的。等我想好了，再同您说。'),open?{aff:1}:{});return;
 }
 if(c==='scold'){
  const effects=id==='remind'?{aff:-2,loyalty:-1}:id==='stern'?{aff:-4,loyalty:-2}:{aff:-6,loyalty:-3};if(id!=='remind')r.upsetDay=todayKey();applyInteraction(p,c,id,m.scold,effects);return;
 }
 if(c==='activity'){applyInteraction(p,c,id,m.activity,{aff:id==='walk'?4:3,...(id==='chess'?{politics:1}:id==='spar'?{force:1}:{})});return;}
 if(c==='flirt'){applyInteraction(p,c,id,m.flirt,{aff:id==='compliment'?2:3,love:id==='confess'?3:2});return;}
 if(c==='sleep'&&id==='ask')intimacyQuestion();
}
function intimacyQuestion(){if(!session||session.left<=0)return;const p=PEOPLE.find(x=>x.id===session.id),r=state.relations[p.id],reason=sleepReason(p,r);if(reason){toast(reason);return;}session.intimacyConsent=p.id;openModal(`${p.name} · 今夜`,r.rank,`<div class="scene-text">你问：“今夜愿不愿留下？若是累了，改日也好。”<br><br>他点了点头：“我愿意。今晚，您也早些歇。”</div><div class="opts"><button class="opt" data-action="intimacyConfirm"><b>留他过夜</b><small>另耗1行动、本次1次互动；好感度+3、暧昧度+2。今夜只安排一次。</small></button><button class="opt" data-action="intimacyCancel"><b>让他先歇着，改日再约</b><small>不扣行动和互动次数。</small></button></div>`,'相处 · 本人已同意');}
function intimacyConfirm(){if(!session||session.left<=0||session.intimacyConsent!==session.id)return;const p=PEOPLE.find(x=>x.id===session.id),r=state.relations[p.id],reason=sleepReason(p,r);if(reason){toast(reason);return;}if(!pay(1))return;state.bedchamber={day:todayKey(),id:p.id};session.intimacyConsent=null;applyInteraction(p,'sleep','stay','这一夜不用再等宫人传话。烛火渐低，你们说了会儿话，安稳地歇下。',{aff:3,love:2},{extra:'今夜已安排 / 行动−1',noRepeatLine:true});}
actions.interactionCategory=interactionCategory;actions.interactionTopic=interactionTopic;actions.interactionBack=()=>{if(!session)return;session.section=null;renderSession();};actions.intimacyConfirm=intimacyConfirm;actions.intimacyCancel=()=>{if(session)session.intimacyConsent=null;renderSession();};actions.backSession=renderSession;
// Keep legacy action names safe, while all visible choices use the eight categories.
actions.social=id=>{const map={chat:['chat','recent'],library:['chat','interest'],care:['care','listen'],gift:['care','gift'],activity:['activity','walk'],flirt:['flirt','compliment'],promise:['care','promise'],recruit:['persuade','recruit'],promote:['persuade','promote']};if(!session||!map[id])return;session.section=map[id][0];interactionTopic(map[id][1]);};
actions.giveTravelGift=()=>{if(!session)return;session.section='care';interactionTopic('bag');};
npcCard=function(p){const r=state.relations[p.id];return `<article class="person-card"><div class="person-body"><div class="person-top"><h3>${p.name}</h3><small>${p.age+Math.floor((state.elapsed-2)/12)}岁 · ${p.gender||'男'}</small></div><span class="tag">${r.rank||p.role}</span><p>${p.desc}</p>${fiveStats(p,true)}<div class="actions"><button class="btn primary" data-action="visit" data-id="${p.id}">见面 · 1行动</button><button class="btn ghost" data-action="dailySchedule" data-id="${p.id}">今日行程</button><button class="btn ghost" data-action="archive" data-id="${p.id}">交际与记事</button></div></div></article>`;};
archive=function(id){ensureInteractionStats();const p=PEOPLE.find(x=>x.id===id);if(!p)return;const r=state.relations[id];openModal(`${p.name} · 交际与记事`,r.rank||p.role,`${fiveStats(p)}<p class="mini">政略、武力反映能力；好感度、忠诚度、暧昧度会随相处变化。</p><div class="card"><h3>与谁往来</h3>${socialEdgesOf(id).slice(0,12).map(e=>{const other=PEOPLE.find(x=>x.id===(e.a===id?e.b:e.a));if(!other)return '';const own=e.a===id?e.affAB:e.affBA,back=e.a===id?e.affBA:e.affAB;return `<div class="record"><button class="text-btn" data-action="archive" data-id="${other.id}">${other.name}</button> · ${e.kind}<p>${p.name}对其好感 ${own} · 对方对其好感 ${back}</p><p class="mini">${e.recent||e.origin}</p></div>`;}).join('')||'<p>尚无公开交际记录。</p>'}</div><div class="card section-space"><h3>个人记事</h3>${r.notes.slice(-12).reverse().map(n=>`<div class="record"><span class="mini">${date(n.month)}</span><p>${n.text}</p></div>`).join('')}</div><button class="btn ghost wide" data-action="dailySchedule" data-id="${id}">看看每日行迹</button>`,'人物档案');};
actions.archive=archive;actions.personNotes=archive;
sceneMiniNpc=function(p){return `<div class="place-person"><button class="npc-name" data-action="dailySchedule" data-id="${p.id}">${p.name}</button><small>${state.relations[p.id].rank||p.role}</small><button class="btn ghost" data-action="sceneMeet" data-id="${p.id}">聊聊 · 1行动</button>${fiveStats(p,true)}</div>`;};
const dailyBeforeStats=dailyPanel;dailyPanel=function(id,key){ensureInteractionStats();dailyBeforeStats(id,key);const p=PEOPLE.find(p=>p.id===id);if(p)$('modalBody').insertAdjacentHTML('afterbegin',fiveStats(p));};
const renderBeforeInteractions=render;
render=function(){ensureInteractionStats();for(const p of PEOPLE){p.skills=p.skills||{};p.skills.admin=state.relations[p.id].politics;p.skills.military=state.relations[p.id].force;}renderBeforeInteractions();};
const recruitBeforeInteractions=recruitConfirm;recruitConfirm=function(id){if(!session||session.id!==id||session.left<=0)return;const p=PEOPLE.find(x=>x.id===id),r=state.relations[id];if(!p?.romance||castAge(p)<18||r.rank||r.aff<50||r.love<8)return;recruitBeforeInteractions(id);};actions.recruitConfirm=recruitConfirm;
const interactionStyle=document.createElement('style');interactionStyle.textContent=`
.five-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin:12px 0 16px;width:100%}.five-stats span{display:flex;flex-direction:column;text-align:center;border:1px solid #ead9cd;border-radius:9px;background:#fbf4ec;padding:9px 3px;min-width:0}.five-stats small{font-size:11px;color:#8e747c;white-space:nowrap}.five-stats b{font-size:21px;margin-top:4px;color:#9c536b;font-family:Georgia,serif}.five-stats.compact{gap:4px;margin:11px 0}.five-stats.compact span{padding:6px 1px}.five-stats.compact small{font-size:10px}.five-stats.compact b{font-size:17px}.interaction-categories{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.interaction-categories .opt{margin:0;min-width:0;min-height:74px}.sheet:has(.interaction-categories) .talk-banner{margin:10px 0;gap:13px}.sheet:has(.interaction-categories) .portrait.large{min-height:72px;height:72px;width:58px;min-width:58px}.sheet:has(.interaction-categories) .portrait.large .portrait-head{top:14px;left:23px}.sheet:has(.interaction-categories) .portrait.large .portrait-robe{top:49px}.sheet:has(.interaction-categories) .portrait.large b{font-size:11px;letter-spacing:2px}.sheet:has(.interaction-categories) .five-stats{margin:8px 0}.sheet:has(.interaction-categories) .five-stats span{padding:6px 2px}.sheet:has(.interaction-categories) .scene-text{margin:10px 0;padding:12px;max-height:100px;overflow:auto}.sheet:has(.interaction-categories) .text-btn{padding:10px 0}.interaction-option:disabled{opacity:.58}.interaction-option small{overflow-wrap:anywhere}.interaction-person{min-width:0}.place-person .five-stats{flex-basis:100%;margin:1px 0 5px}.person-body .five-stats{max-width:100%}@media(max-width:400px){.five-stats{gap:4px}.five-stats small{font-size:10px}.five-stats b{font-size:18px}.interaction-categories{gap:7px}.interaction-categories .opt{padding:12px 10px;min-height:74px}.interaction-categories .opt b{font-size:14px}.interaction-categories .opt small{font-size:10px}.five-stats.compact small{font-size:9px}}
`;document.head.appendChild(interactionStyle);
