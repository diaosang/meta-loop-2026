/* V35: relationship-stage dialogue. Reads the existing social, emotion and memory records; dialogue itself does not buy affection. */
(function(){
'use strict';

const NPC35_COPY={
 first:{general:[
  '{self}叫{name}。家中排行不算显眼，平日喜欢读书、习字，日子过得很寻常。',
  '初来宫中，规矩还在记。陛下若有吩咐，{self}会认真听着。',
  '从前只在家里听人说起宫中的事，今日亲眼见了，倒不知先说哪句好。'
 ],voice:{
  gentle:['{self}平日话不算少，只是到了陛下面前，反倒要想一想再开口。'],
  bright:['{self}没什么特别的本事，倒是记路快些。宫里这些回廊，已经认得差不多了。'],
  reserved:['{self}不善说场面话。陛下问什么，{self}便照实答，不敢多作修饰。'],
  shrewd:['{self}知道进宫后该守哪些规矩，也知道有些话不该急着说。今日先向陛下问安。']
 },named:{
  yejin19:['臣叫叶锦，家中排行……倒也没什么特别的。平日里喜欢看看书，偶尔练练字，日子过得还算清闲。','臣在家时，母亲总嫌臣坐不住。书还没读完，便惦记着去院子里看花。如今想来，倒真有些孩子气了。']
 }},
 acquaintance:{general:[
  '{self}今日在窗下坐了一会儿，才发现院里那株花已经开了。',
  '最近手边有件小事一直没做完，倒不是难，只是总想再改一改。',
  '宫里的路走熟了些。前几日还要问人，如今自己也能找着地方了。'
 ],voice:{
  gentle:['今日过得还算安稳。若陛下不嫌{self}话少，倒愿意多说两句家常。'],
  bright:['今日碰见件有趣的小事，原想说给旁人听，想了想，还是留到见陛下再说。'],
  reserved:['近来没什么大事。该做的做完，闲下来的时候便看看书。'],
  shrewd:['近日各处都还顺当。{self}习惯先把手边的事料理好，再想旁的。']
 },named:{
  yejin19:['臣今日在院子里待了好一会儿，才发现有株花不知什么时候开了。明明日日都经过，竟没留意到。','臣最近在学画竹子，可总觉得画出来差了些意思。兴许还是练得不够，改日得再试试。']
 }},
 rising:{general:[
  '如今在陛下面前，说话不用先在心里过三遍了。',
  '前些日子还觉得宫里处处生疏，这几回走下来，倒渐渐认得路。',
  '臣发现有些小事也可以说给陛下听，不必每回都挑正经话题。'
 ],voice:{
  gentle:['有时想起一件小事，{self}会先想着陛下听了会怎么答。'],
  bright:['臣如今敢在陛下面前说些没头没尾的话了。若说得好笑，您可别只顾着笑。'],
  reserved:['与陛下说话比从前自在些了。至少不必每一句都反复斟酌。'],
  shrewd:['相处久些，许多话不必绕弯。陛下有话直说，{self}也会照实回答。']
 },named:{
  yejin19:['臣如今倒比刚进宫时自在多了，至少不会像最初那样，说句话都要在心里想上好几遍。','臣前些日子做了个梦，梦见自己还在家里，什么都不用操心。醒来才想起，已经进宫好些日子了。']
 }},
 friend:{general:[
  '今日有件小事，本来想自己留着，见了陛下又想说给您听。',
  '若真有烦心事，如今倒愿意先同陛下讲，不必总装作无事。',
  '陛下若有空，臣想同您说说近日读到的一段趣事，没什么要紧，只是觉得有意思。'
 ],voice:{
  gentle:['臣有时也会闹些小脾气。如今在陛下面前，倒不用总装得事事妥帖。'],
  bright:['臣今日攒了好几个话头，先说哪个都行。反正见了陛下，总不会没话讲。'],
  reserved:['陛下不必每回都找话题。安静坐一会儿，臣也觉得自在。'],
  shrewd:['有些话对旁人不便说，对陛下倒能直言。臣知道您听完，也会自己判断。']
 },named:{
  yejin19:['臣如今在陛下面前，不必句句都想妥当，倒比从前轻松许多。','臣有时看见一件有趣的小事，会想着等见到陛下再说。今日总算没忘。']
 }},
 forever:{general:[
  '旁人问起与陛下是什么交情，臣倒答不上来。只知道有事时，最先想到的是您。',
  '往后无论遇上什么事，臣总愿意先同陛下说清楚，不让误会留着。',
  '臣不觉得相知一定要时时说许多话。知道彼此都在，心里便踏实。'
 ],voice:{
  gentle:['陛下不必时时顾着臣的心思。臣若难过会告诉您，高兴时也会第一个想告诉您。'],
  bright:['臣想好了，往后有趣的事先告诉陛下，闯了小祸也不瞒着您。您可不能只记后半句。'],
  reserved:['臣不轻易许诺，但这份交情，臣会认真放在心上。'],
  shrewd:['臣见过许多因利而聚、因利而散的人。能同陛下走到今日，臣很珍惜。']
 },named:{
  yejin19:['臣想，往后无论遇上什么事，咱们至少还能坐下来好好说话。','有陛下在，臣便不必把每件事都一个人想完。遇到拿不准的，臣愿意先来问您。']
 }},
 flirt:{general:[
  '近来见着陛下，总要多想一会儿才舍得走。',
  '陛下若再这样看着臣，臣今日怕是要忘了原本要说的话。',
  '臣原先不懂旁人说的牵挂是什么，近来倒有些明白了。'
 ],voice:{
  gentle:['臣也想过要不要把这句话说出来。如今见了陛下，还是没忍住。'],
  bright:['臣今日本来打算装作若无其事的。可惜一见陛下，没装成。'],
  reserved:['陛下待臣与旁人不同，臣并非没有察觉。只是这话，还是想亲耳听您说。'],
  shrewd:['臣知道分寸，也知道自己心里在想什么。陛下不必猜，臣并不打算否认。']
 },named:{
  yejin19:['臣今日本来有话要说，见了陛下，倒又忘了。回去才想起来，真是没出息。','陛下近来总叫臣分心。明明只是听见脚步声，臣也要抬头看一眼。']
 }},
 beloved:{general:[
  '明明日日都盼着见您，可真见到了，还是觉得不够。',
  '臣不怕旁人知道自己心悦陛下，只是每回亲口说，仍觉得欢喜。',
  '今日没什么要紧事，只是想早些见您。能坐在这里，便很好。'
 ],voice:{
  gentle:['臣有时会想，若往后的寻常日子都能同陛下一起过，该有多好。'],
  bright:['臣今日很高兴。不是因为得了什么赏赐，只是见到陛下了。'],
  reserved:['有些话臣从前不肯说，如今不想再藏着。臣心里有您，也只愿您知道。'],
  shrewd:['臣见过许多得失，唯独不想拿与陛下的情意去计较。您对臣很重要。']
 },named:{
  yejin19:['臣想过许多好听的话，到了您面前，最后只剩一句：臣很喜欢陛下。','只要陛下在，臣便觉得心里安稳。今日没有别的事，臣只是想多陪您一会儿。']
 }},
 scold:{general:[
  '陛下方才的话，臣都听见了。只是心里一时难受，容臣理清楚再回您。',
  '臣知错，不会拿委屈当借口。只是那件事的缘由，臣仍想找机会说清。',
  '臣不敢顶撞陛下。若您肯听，臣想把当时的情形从头说一遍。'
 ],voice:{
  gentle:['臣知道陛下是为臣好。只是方才那几句话，臣听着确实难受。'],
  bright:['臣认错。只是陛下别一直生气，臣还有话没说完呢。'],
  reserved:['陛下责备得是。臣先把事情做好，余下的话，等您愿意听时再说。'],
  shrewd:['臣认这次处置不周，但责任在哪一处，还请陛下容臣说明白。']
 },named:{
  yejin19:['臣知道自己错了。只是陛下方才那样说，臣一时不知道该怎么答。','陛下若是责臣，臣认。但这件事的缘由，臣还是想找机会说清。']
 }},
 poor:{general:[
  '陛下若只是问安，臣答过便好。旁的事，暂时不想多说。',
  '臣知道陛下对臣有不满。公事臣会照办，私下便不多打扰。',
  '如今说什么都容易惹陛下不快，臣还是少说几句为好。'
 ],voice:{
  gentle:['臣不是有意冷淡，只是不知道该怎样同陛下说话才好。'],
  bright:['臣今日不想强撑着说笑。陛下若有正事，臣会认真听。'],
  reserved:['臣与陛下之间，还是按规矩来吧。'],
  shrewd:['眼下多说无益。臣会把自己的差事做好，不再多作打扰。']
 },named:{
  yejin19:['臣如今也不知道该说些什么。若陛下没有别的事，臣先告退了。','臣会照常做好分内的事。只是私下闲谈，暂且免了吧。']
 }},
 veryPoor:{general:[
  '臣与陛下如今，似乎说什么都不合适。臣不敢多留，先告退了。',
  '陛下不必费心问臣近况。吃穿用度都按宫中规制，不会有缺。',
  '臣想了许久，还是觉得少见面为好。见得越多，越不知该说什么。'
 ],voice:{
  gentle:['臣不是不记得从前，只是如今再提起，反倒更难受。'],
  bright:['臣今日实在笑不出来。陛下若要问话，臣会答；旁的就算了。'],
  reserved:['臣与陛下只谈该谈的事，免得再生误会。'],
  shrewd:['臣已不再指望陛下改变主意。往后各自守好本分便是。']
 },named:{
  yejin19:['臣想先静一静。如今见了陛下，反倒不知道该把话说到哪一步。','从前那些闲话，臣暂时不想再说了。陛下保重。']
 }},
 worst:{general:[
  '臣不想再猜陛下的意思。该臣做的事，臣会办完；不该说的，也不会再提。',
  '陛下若有旨意，请直说。臣会照办，不必再问臣愿不愿意。',
  '私下的话到此为止。臣不想再把心里话拿出来，任人轻慢。'
 ],voice:{
  gentle:['臣曾想好好同陛下说话。如今看来，还是不必了。'],
  bright:['臣这回不打算再笑着揭过。陛下若有正事，臣听旨。'],
  reserved:['臣已无话可说。请陛下准臣告退。'],
  shrewd:['臣会守住自己的底线。陛下若要处置，请按规矩来。']
 },named:{
  yejin19:['臣不想再猜陛下的意思了。往后该做的事，臣会做好，私下便不再打扰。','臣没有什么要解释的。若陛下还有吩咐，请直说。']
 }},
 disappointed:{general:[
  '臣并非一定要陛下时时记挂，只是从前说好的事，臣确实当过真。',
  '臣原以为陛下会记得那日的话。如今想来，是臣把这件事看得太重了。',
  '臣没有生气，只是有些失望。往后不敢再把话说得那样满。'
 ],voice:{
  gentle:['臣不是要您时时陪着。只是等了许久，连一句改日再说也没有等到。'],
  bright:['臣原本盼着很久，后来想想，还是不该把这份期待全放在陛下身上。'],
  reserved:['臣记得陛下说过什么。只是往后，臣会先看事情是否真的能成。'],
  shrewd:['臣不怪陛下有自己的难处。只是承诺既然说出口，总该有个交代。']
 },named:{
  yejin19:['臣不是要陛下时时来。只是说好的事，臣一直记着，没想到最后只有臣当了真。','臣原先还替陛下找过理由。如今不想再猜了，等不等，臣自己会有分寸。']
 }},
 broken:{general:[
  '从前那些话，臣不想再提了。往后公事照旧，私下不必再见。',
  '这份情分到此为止。陛下不欠臣解释，臣也不会再向您讨一句回答。',
  '臣不会再等了。若有公事，请按规矩传召；除此之外，不必再见。'
 ],voice:{
  gentle:['臣曾经很珍惜与陛下相处的日子。只是如今，臣想把它们留在过去。'],
  bright:['臣不想再装作没事。往后见面只谈正事，别的就不必提了。'],
  reserved:['从今往后，臣与陛下只余君臣之礼。请陛下准臣告退。'],
  shrewd:['旧情不再作数。臣不会拿它要挟陛下，也请陛下不要再拿它留臣。']
 },named:{
  yejin19:['臣曾经很珍惜与陛下说这些闲话的日子。只是如今，不想再提了。','往后公事照旧，私下不必再见。臣会记得分寸，也请陛下如此。']
 }}
};

function npc35Type(p){
 const t=String(p?.type||'');
 if(/温柔|体贴|敏感/.test(t))return 'gentle';
 if(/明朗|直率|疏朗|洒脱/.test(t))return 'bright';
 if(/清冷|克制|寡言|守礼/.test(t))return 'reserved';
 return 'shrewd';
}
function npc35Self(p){return npc17Self(p)||'臣';}
function npc35Fill(line,p){
 return String(line||'').replaceAll('{self}',npc35Self(p)).replaceAll('{name}',p?.name||'');
}
function npc35Stage(p){
 const r=state.relations[p.id],m=r?.mind||{},own=npc17Own(p),social=socialState(p)||{},count=Number(social.count||0),days=(social.days||[]).length;
 const tick=mindTick(),recentHurt=(m.memories||[]).slice().reverse().find(x=>x.kind==='受伤'&&/斥责|提醒了分寸|被斥责/.test(x.text||''));
 const resolved=recentHurt&&(m.memories||[]).some(x=>x.tick>recentHurt.tick&&(/和解|道歉|关怀|安慰/.test(x.text||'')||x.kind==='和解'));
 const tier=socialTier(p),guard=Number(own.guard??100-(m.security??50));
 const emotion=typeof npc18Emotion==='function'?npc18Emotion(p):{mutual:false,signals:0,days:[]};
 const romance=typeof npc18Stage==='function'?npc18Stage(p):-1;
 if(r.aff<=8&&r.trust<=12&&m.security<=18&&m.distance>=65&&(m.broken>=2||m.anger>=70||m.hurt>=70))return {key:'broken',label:'恩断义绝',negative:true};
 if(recentHurt&&tick-(recentHurt.tick||0)<=3&&!resolved&&Math.max(m.hurt||0,m.anger||0)>=8)return {key:'scold',label:'被训斥',negative:true};
 if(m.disappointment>=38||currentMind(p)==='失望')return {key:'disappointed',label:'失望',negative:true};
 if(r.aff<=12&&r.trust<=15&&m.security<=25)return {key:'worst',label:'关系极差',negative:true};
 if(r.aff<=22&&r.trust<=28)return {key:'veryPoor',label:'关系特别差',negative:true};
 if(r.aff<=35&&r.trust<=40||['恼怒','委屈','疏离','戒备'].includes(currentMind(p)))return {key:'poor',label:'关系较差',negative:true};
 if(romance===4&&emotion.mutual&&r.love>=18&&r.aff>=70&&r.trust>=65&&guard<35&&days>=4)return {key:'beloved',label:'最爱',negative:false};
 if(romance>=3)return {key:'flirt',label:'暧昧',negative:false};
 if(tier==='trusted'&&count>=24&&days>=10&&r.trust>=65&&r.aff>=65&&guard<40)return {key:'forever',label:'永远的朋友',negative:false};
 if(tier==='trusted'&&count>=8&&days>=4&&r.trust>=45&&r.aff>=45)return {key:'friend',label:'朋友',negative:false};
 if(tier!=='stranger'&&count>=4&&days>=2)return {key:'rising',label:'关系上升',negative:false};
 if(count>0||tier!=='stranger')return {key:'acquaintance',label:'关系一般',negative:false};
 return {key:'first',label:'初遇',negative:false};
}
function npc35Pool(p,stage){
 const def=NPC35_COPY[stage.key]||NPC35_COPY.acquaintance,style=npc35Type(p),rows=[];
 if(def.named?.[p.id])rows.push(...def.named[p.id]);
 if(def.voice?.[style])rows.push(...def.voice[style]);
 rows.push(...(def.general||[]));
 // Keep the character's already-authored voice in the pool for non-unique stages.
 if(['acquaintance','rising','friend','forever'].includes(stage.key)&&typeof d23Voice==='function'){
  const voice=d23Voice(p),key=stage.key==='acquaintance'?'near':stage.key==='rising'?'familiar':'trusted';
  rows.push(...(voice[key]||[]));
 }
 if(['flirt','beloved'].includes(stage.key)&&typeof npc18Line==='function'){
  const key=stage.key==='beloved'?'miss':'praise',line=npc18Line(p,key,'npc35:'+stage.key);
  if(line)rows.push(line);
 }
 return rows.map(x=>npc35Fill(x,p)).filter(Boolean);
}
function npc35Pick(p,stage){
 const pool=npc35Pool(p,stage),memory=npc17Own(p).memories||[],recent=new Set(memory.slice(-30).map(x=>x.reply).filter(Boolean));
 const fresh=pool.filter(x=>!recent.has(x)),choices=fresh.length?fresh:pool;
 if(!choices.length)return '今日没有什么新鲜事。陛下若不忙，{self}愿陪您坐一会儿。'.replace('{self}',npc35Self(p));
 const index=mindHash(p.id+':'+stage.key+':'+todayKey()+':'+memory.length)%choices.length;
 return choices[index];
}
function npc35Talk(p){
 if(!p||!npc17HasTurn(p))return false;
 const stage=npc35Stage(p),reply=npc35Pick(p,stage),own=npc17Own(p),stamp='npc35:'+stage.key+':'+todayKey()+':'+own.memories.length;
 return npc17Commit(p,'关系闲谈 · '+stage.label,reply,{
  category:'chat',topic:'npc35:'+stage.key,stamp,progress:false,effects:{},
  outcome:stage.negative?'说出心中隔阂':'闲谈',reason:'按当前相处记录、人物性情与近三十次对白去重',
  tags:['关系对白',stage.label],feedback:'这段话已记入你们的相处。'
 });
}

const oldOptions=npc17Options;
npc17Options=function(p,key){
 const html=oldOptions(p,key);
 if(key==='chat'&&!html.includes('data-id="npc35Bond"')){
  return html+npc17Button('npc17Action','npc35Bond','聊聊彼此','按当前关系阶段与人物性情回应。',session?.left<1?'这次会面已谈完，留待下回。':'');
 }
 return html;
};
const oldAction=npc17Action;
npc17Action=function(action){
 const p=session?.npc17&&npc17Person(session.id);
 if(p&&['npc35Bond','greet'].includes(action))return npc35Talk(p);
 return oldAction(action);
};
actions.npc17Action=action=>npc17Action(action);

const oldRelation=npc17Relation;
npc17Relation=function(p){
 const stage=npc35Stage(p);
 let html=oldRelation(p)||'';
 html=html.replace(/<p class="npc18-stage">[\s\S]*?<\/p>/,'');
 return '<p class="npc35-stage">当前关系：<b>'+stage.label+'</b></p>'+html;
};
if(typeof document!=='undefined'){
 const style=document.createElement('style');
 style.textContent='.npc35-stage{margin:12px 0 8px;padding:9px 12px;border-left:3px solid #aa8061;background:#f6eee8;color:#80614f;font-size:13px}.npc35-stage b{font-weight:650;color:#664657}.npc35-stage:has(b){letter-spacing:.2px}';
 document.head.appendChild(style);
}
window.__npc35Audit={version:35,stage:npc35Stage,talk:npc35Talk,pick:npc35Pick,pool:npc35Pool,type:npc35Type};
})();