'use strict';
// 国势、边患与朝堂内斗扩展层。以最后加载的方式挂接，不改动原有后宫、案件和巡游流程。
const STRIFE_DEFAULT={threat:24,warExhaustion:0,factionTension:18,pending:[],history:[],lastRoll:null,version:1};
function strifeClamp(v){return Math.max(0,Math.min(100,Math.round(Number(v)||0)));}
function ensureStrife(){
 state.strife=Object.assign({},STRIFE_DEFAULT,state.strife||{});
 state.strife.pending=Array.isArray(state.strife.pending)?state.strife.pending:[];
 state.strife.history=Array.isArray(state.strife.history)?state.strife.history:[];
 state.government=Object.assign({tax:10,security:50,works:0,training:0,exams:0,diplomacy:50,treasuryHealth:70},state.government||{});
 state.strife.threat=strifeClamp(state.strife.threat);
 state.strife.warExhaustion=strifeClamp(state.strife.warExhaustion);
 state.strife.factionTension=strifeClamp(state.strife.factionTension);
 if(typeof ensureMinds==='function')ensureMinds();
 return state.strife;
}
function strifeHash(s){if(typeof castHash==='function')return castHash(s);let n=2166136261;for(const c of String(s)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
function strifeName(id){return PEOPLE.find(p=>p.id===id)?.name||'朝中有人';}
function strifeOfficial(){return PEOPLE.filter(p=>p.official||['xu','jiang','ye','lu'].includes(p.id));}
function strifeActor(kind){
 const pool=kind==='war'?strifeOfficial().filter(p=>['military','military','official'].includes(p.factionType)||p.id==='jiang'||p.id==='lu'):strifeOfficial();
 return (pool.length?pool:strifeOfficial())[strifeHash(`${state.elapsed}:${kind}:actor`)%(pool.length||1)]||PEOPLE[0];
}
function strifeMoodLine(p){
 if(!p)return '殿中一时无人说话。';
 const mood=typeof currentMind==='function'?currentMind(p):'平静';
 const lines={吃醋:`${p.name}把袖口理了理，话里藏着一点酸意：“陛下若肯亲自过问，臣自然愿意替您分忧。”`,失望:`${p.name}没有像往常那样替旁人打圆场：“臣只求一件事——这回的承诺，别又留在折上。”`,期待:`${p.name}上前半步：“若陛下要用我，便把差事交到我手里。我等这一句，已经等了许久。”`,热恋:`${p.name}看你一眼，声音便低了：“外头的风再急，也不及陛下一句话叫臣安心。”`,恼怒:`${p.name}压着火气：“臣可以领罚，却不愿替未做过的事认罪。”`,戒备:`${p.name}先看了眼殿门：“臣能说的只有这些。其余的，等证据摆齐再议。”`,平静:`${p.name}将奏报展开：“边情与人心都在这几行字里，陛下请先看最末一行。”`};
 return lines[mood]||lines.平静;
}
function strifeRecord(text,kind='国势',who){
 log(text,kind,who);
 const s=ensureStrife();s.history.push({month:state.elapsed,day:state.day||1,text,kind});if(s.history.length>60)s.history.shift();
}
function strifeSummary(){
 const s=ensureStrife(),g=state.government||{};
 const warn=s.threat>=60?'边报频急':s.factionTension>=60?'朝中暗潮':state.money<30?'内库告急':'国势尚稳';
 return `<div class="card strife-card"><div class="section-heading"><h3>国势与边报</h3><span class="tag">${warn}</span></div><div class="strife-meters"><div><small>边患</small><b>${s.threat}</b></div><div><small>军心</small><b>${state.army}</b></div><div><small>内斗</small><b>${s.factionTension}</b></div><div><small>战疲</small><b>${s.warExhaustion}</b></div></div><p class="mini">${state.money<30?'内库吃紧，军饷与人心都在等一句准话。':s.factionTension>=55?'几方都在等陛下先开口，沉默也会被人拿去做文章。':'边报尚稳，却不能把安稳当作理所当然。'}</p><button class="btn ghost wide" data-action="strifePanel">查看边报与内廷暗潮</button></div>`;
}
function strifeEventCard(e){
 const s=ensureStrife();
 if(!e)return '';
 const done=e.done?`<span class="tag">已处理 · ${e.outcome||'此事暂记'}</span>`:`<button class="btn primary" data-action="strifeOpen" data-id="${e.id}">听谢无咎报来</button>`;
 return `<div class="record strife-event"><span class="eyebrow">${e.kind==='war'?'边报':'朝中暗潮'}</span><h3>${e.title}</h3><p>${e.text}</p>${done}</div>`;
}
function strifePanel(){
 const s=ensureStrife(),pending=s.pending.filter(x=>!x.done),hist=s.history.slice(-6).reverse();
 openModal('边报与内廷暗潮','谢无咎：“陛下，事情未必只在奏报上写的那一层。”',`<div class="strife-summary">${strifeSummary()}</div>${pending.length?pending.map(strifeEventCard).join(''):'<div class="empty small"><p>本月暂未有新的边报。越是安静，越要留意谁在替谁说话。</p></div>'}${hist.length?`<h3 class="section-space">近来留下的痕迹</h3>${hist.map(x=>`<div class="record"><span class="mini">${date(x.month)} · ${x.kind}</span><p>${x.text}</p></div>`).join('')}`:''}`,'国势簿');
}
function strifeOpen(id){
 const e=ensureStrife().pending.find(x=>x.id===id&&!x.done);if(!e)return;
 const actor=PEOPLE.find(p=>p.id===e.actor),speaker=e.kind==='war'?'谢无咎 · 密报':`${actor?.name||'朝臣'} · ${actor?.role||'朝臣'}`;
 const options=e.kind==='war'?[['scout','先派斥候，查清敌军虚实','1行动；不立即交战，先看敌军人数。'],['mobilize','调京营迎敌','1行动、内库15；以军力与训练硬接。'],['negotiate','遣使议和，送出岁币','1行动、内库8；看邦交与权威能否压住兵锋。'],['levy','加征军费，先把军饷凑齐','不耗行动；内库增加，民心与内斗承压。'],['hold','留中观察，等地方再报','不耗资源；短期安静，战疲与威胁会上升。']]:[['question','当面质询，叫两边把话说完','1行动；容易得罪人，却能看见谁在回避。'],['mediate','分别安抚，先把火压下去','内库8；冲突下降，但需要陛下替他们兜底。'],['pressure','借势敲打，让一方先退','1行动；权威上升，相关人物的忠诚会受损。'],['watch','留中观察，暗查往来','不耗资源；眼下平静，后续张力会上升。']];
 const lead=e.kind==='war'?`敌军估算 ${e.scouted?e.enemyPower:'尚未查明'}。${e.scouted?'斥候已回报，胜负取决于军心与将领。':'谢无咎没有把最坏的数字写在明面上。'}`:`涉事人物：${strifeName(e.actor)}。${e.rival?`另一方是${strifeName(e.rival)}。`:''}`;
 openModal(e.title,speaker,`<div class="scene-text">${e.body}</div><p class="effect">${lead}</p><div class="opts">${options.map(x=>`<button class="opt" data-action="strifeChoose" data-id="${e.id}|${x[0]}"><b>${x[1]}</b><small>${x[2]}</small></button>`).join('')}</div>`,'国势事件');
}
function strifePower(){
 const training=Number(state.government?.training||0),mil=Number(state.playerStats?.military||35);
 return Number(state.army||0)+mil*.35+training*3;
}
function strifeApplyMood(id,patch,text,kind='国势'){
 if(!id||!state.relations[id])return;
 if(typeof shiftMind==='function')shiftMind(id,patch);
 if(text&&typeof rememberMind==='function')rememberMind(id,text,kind,true);
}
function finishStrife(e,outcome,changes={}){
 for(const [k,v] of Object.entries(changes)){if(k==='money')state.money=Math.max(0,state.money+v);else if(k==='army'||k==='authority'||k==='people')state[k]=clamp(state[k]+v);else if(k in state.government)state.government[k]=strifeClamp(state.government[k]+v);else if(k in state.strife)state.strife[k]=strifeClamp(state.strife[k]+v);}
 e.done=true;e.outcome=outcome;strifeRecord(`${e.title}：${outcome}`,e.kind==='war'?'边患':'内斗',e.actor);closeModal();render();result(e.title,outcome,'这件事已写入国势簿，人物心情也会留下回响。');save();
}
function strifeChoose(raw){
 const [id,choice]=String(raw).split('|'),e=ensureStrife().pending.find(x=>x.id===id&&!x.done);if(!e)return;
 const actor=PEOPLE.find(p=>p.id===e.actor),r=state.relations[e.actor];
 if(choice==='scout'){if(!pay(1))return;e.scouted=true;e.body+='\n\n斥候回报：敌军约'+e.enemyPower+'人，粮道在'+(e.enemyPower>70?'北岭':'河口')+'。';strifeRecord(`${e.title}：斥候回报敌军约${e.enemyPower}人，暂未交战。`,'边患',e.actor);closeModal();render();result('斥候回报',`谢无咎把新纸条压在案角：“这回，陛下知道该看哪一处了。”`,'行动−1；尚未结算胜负。');save();return;}
 if(e.kind==='war'){
  if(choice==='mobilize'){if(!pay(1,15))return;const own=strifePower(),win=own+strifeHash(`${e.id}:battle`)%20>=e.enemyPower; if(win){finishStrife(e,'京营赶在敌军合围前抵达，边将守住关口。',{army:5,money:0,threat:-18,warExhaustion:5});strifeApplyMood(e.actor,{security:8,expectation:3},'陛下把兵权交到手里，军中总算有了回声。','边患');}else{finishStrife(e,'敌军先一步截断粮道，守军退守城下。',{army:-10,people:-4,authority:-3,threat:10,warExhaustion:15});strifeApplyMood(e.actor,{security:-12,disappointment:8,anger:8},'这一仗没有打好，心里既惭且恼，暂不愿多说。','败报');}return;}
  if(choice==='negotiate'){if(!pay(1,8))return;const score=Number(state.government.diplomacy||50)+Number(state.authority||50)*.35+strifeHash(`${e.id}:talk`)%22;const ok=score>=80;if(ok)finishStrife(e,'使者带回停战书，敌军退到边线之外。',{authority:2,threat:-12,warExhaustion:3});else finishStrife(e,'对方收下岁币却不肯退兵，边将只得多守一月。',{authority:-2,threat:6,warExhaustion:8});return;}
  if(choice==='levy'){state.money+=15;finishStrife(e,'户部凑足军饷，京营暂不缺银；民间却开始抱怨税重。',{people:-8,authority:-1,factionTension:8,threat:-4,warExhaustion:4});strifeApplyMood(e.actor,{expectation:4,security:2},'军饷来了，至少今夜不必让士卒空着肚子守城。','军饷');return;}
  finishStrife(e,'奏报留中，地方暂以城门紧闭应对。没有人知道下一封急报何时到。',{threat:8,warExhaustion:10,factionTension:4});strifeApplyMood(e.actor,{disappointment:6,security:-4},'请战的折子留在朱批下，他不再替陛下解释。','留中');return;
 }
 if(choice==='question'){if(!pay(1))return;finishStrife(e,'两边当面说完，账目与私交各自分开，暂未酿成大案。',{authority:3,factionTension:-15,warExhaustion:-2});strifeApplyMood(e.actor,{security:5,anger:-7},'陛下肯把话听完，哪怕最后挨了问，也不算白费。','质询');if(e.rival)strifeApplyMood(e.rival,{hurt:4,disappointment:3},'今日在殿前失了面子，心里记下这一笔。','质询');return;}
 if(choice==='mediate'){if(!pay(0,8))return;finishStrife(e,'两边各退半步，宫中暂时恢复安静。',{factionTension:-20,authority:1,money:0});strifeApplyMood(e.actor,{security:6,jealousy:-4},'陛下替他留了台阶，他愿意把未说完的话收回去。','安抚');return;}
 if(choice==='pressure'){if(!pay(1))return;finishStrife(e,'陛下借势敲打，朝臣当面应下，私下却各自记住了这份难堪。',{authority:5,factionTension:-7});strifeApplyMood(e.actor,{loyalty:-5,anger:12,disappointment:5},'领了敲打，表面称是，心里却把旧账又翻了一遍。','敲打');return;}
 finishStrife(e,'暗查暂未惊动任何一方，谢无咎记下往来名单，等下一次露出破绽。',{factionTension:7,warExhaustion:2});strifeApplyMood(e.actor,{security:-2,expectation:2},'陛下没有当面发作，反而叫人更难猜。','暗查');
}
function strifeRoll(){
 const s=ensureStrife();if(s.pending.some(x=>!x.done))return null;
 const month=state.elapsed, money=Number(state.money||0),army=Number(state.army||0),authority=Number(state.authority||0);
 const warChance=Math.min(.72,.08+s.threat*.006+(money<60?.05:0)+(money<30?.1:0)+(army<40?.1:0)+(authority<35?.06:0)+s.warExhaustion*.004);
 const domesticChance=Math.min(.68,.12+s.factionTension*.008+(money<30?.08:0)+(authority<35?.1:0));
 const roll=(strifeHash(`${month}:war`)%1000)/1000,roll2=(strifeHash(`${month}:domestic`)%1000)/1000;
 let e=null;
 if(roll<warChance){const actor=strifeActor('war'),enemy=35+strifeHash(`${month}:enemy`)%46+Math.round(s.threat*.25);const titles=['北境烽火','海寇犯港','西陲驿报'];const title=titles[strifeHash(`${month}:title`)%titles.length];e={id:`war-${month}`,kind:'war',title,actor:actor?.id,text:`谢无咎递来密报：${title}。边将说敌军尚在试探，兵部却说再迟三日便要失守。`,body:`${strifeMoodLine(actor)}\n\n谢无咎低声道：“臣只把听见的都交给陛下，究竟是调兵、议和，还是先看清楚，今日由您定。”`,actor:actor?.id,enemyPower:enemy,scouted:false,done:false,month};s.threat=strifeClamp(s.threat+3);}
 else if(roll2<domesticChance){const actor=strifeActor('domestic'),officials=strifeOfficial().filter(p=>p.id!==actor?.id),rival=officials[strifeHash(`${month}:rival`)%Math.max(1,officials.length)]?.id;const titles=['两班互劾','内廷传言','军中换将','世家借婚事结党'];const title=titles[strifeHash(`${month}:dtitle`)%titles.length];e={id:`domestic-${month}`,kind:'domestic',title,actor:actor?.id,rival,text:`${title}传到御前。${strifeName(actor?.id)}与${strifeName(rival)}各自递来一封折子，字字都说自己是在替朝廷着想。`,body:`${strifeMoodLine(actor)}\n\n谢无咎将两封折子并在一处：“两边都说对方先动了手。陛下若只看其中一封，明日便会有人说您偏了心。”`,done:false,month};s.factionTension=strifeClamp(s.factionTension+4);}
 s.lastRoll={month,warChance,domesticChance,roll,roll2,created:!!e};if(e)s.pending.push(e);save();return e;
}
const strifeEventMenuBefore=eventMenu;
eventMenu=function(){strifeEventMenuBefore();ensureStrife();const box=$('modalBody');if(box){box.insertAdjacentHTML('afterbegin',strifeSummary());const open=box.querySelector('[data-action="strifePanel"]');if(open)open.textContent='打开边报与内斗事件';}};
const strifeRenderBefore=render;
render=function(){ensureStrife();strifeRenderBefore();if(state.tab==='home'){const stats=document.querySelector('.stats');if(stats&&!document.querySelector('.strife-home')){stats.insertAdjacentHTML('afterend',`<div class="strife-home">${strifeSummary()}</div>`);}}if(state.tab==='court'){const hall=document.querySelector('.audience');if(hall&&!document.querySelector('.strife-court')){hall.insertAdjacentHTML('afterend',`<div class="strife-court">${strifeSummary()}</div>`);}}save();};
const strifeNextMonthBefore=actions.nextMonth;
actions.nextMonth=()=>{strifeNextMonthBefore();ensureStrife();strifeRoll();render();save();};
Object.assign(actions,{strifePanel,strifeOpen,strifeChoose});
const strifeStyle=document.createElement('style');strifeStyle.textContent=`.strife-card{margin-top:14px;background:#fff9f1;border-color:#dec9bd}.strife-meters{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.strife-meters>div{padding:9px 5px;text-align:center;background:#f7ebe5;border-radius:9px}.strife-meters small{display:block;color:#927681;font-size:10px}.strife-meters b{font-family:Georgia,serif;color:#7d4d5b;font-size:17px}.strife-home,.strife-court{margin-top:16px}.strife-event{padding:15px 13px;border:1px solid #e6d3c7;border-radius:12px;margin:10px 0;background:#fffaf4}.strife-event h3{margin:6px 0;font-size:16px}.strife-event p{line-height:1.8;font-size:13px}.strife-summary>.strife-card{margin-top:0}@media(max-width:400px){.strife-meters{gap:4px}.strife-meters>div{padding:7px 2px}.strife-meters b{font-size:15px}}`;
document.head.appendChild(strifeStyle);
ensureStrife();

// V7 · 朝臣野心与忠诚：让朝臣的个人立场参与事件选择，并修正忠诚属性的写入位置。
const ensureStrifeV7Before=ensureStrife;
ensureStrife=function(){
 const s=ensureStrifeV7Before();
 const base={
  温柔体贴:42,清冷克制:48,明朗直率:50,骄矜自尊:58,
  敏感多思:53,圆融世故:61,严正守礼:34,野心进取:76,
  疏朗洒脱:45,务实重利:63,寡言重诺:31,戒备善谋:69
 };
 for(const p of strifeOfficial()){
  const r=state.relations[p.id];
  if(!Number.isFinite(Number(r.loyalty)))r.loyalty=50;
  if(!Number.isFinite(Number(r.ambition))){
   const skill=Number(p.skills&&p.skills.admin||r.politics||40);
   r.ambition=strifeClamp((base[p.type]||50)+Math.round((skill-45)*0.18));
  }
 }
 return s;
};
const strifeActorV7Before=strifeActor;
strifeActor=function(kind){
 if(kind==='domestic'){
  const candidates=strifeOfficial().filter(p=>{
   const r=state.relations[p.id];
   return Number(r.ambition||0)>=Number(r.loyalty||0)+12;
  }).sort((a,b)=>{
   const ra=state.relations[a.id],rb=state.relations[b.id];
   return (Number(rb.ambition||0)-Number(rb.loyalty||0))-(Number(ra.ambition||0)-Number(ra.loyalty||0));
  });
  if(candidates.length){
   const idx=strifeHash(String(state.elapsed)+':restive:'+candidates.map(p=>p.id).join('|'))%Math.min(3,candidates.length);
   return candidates[idx];
  }
 }
 return strifeActorV7Before(kind);
};
strifeApplyMood=function(id,patch,text,kind){
 const r=state.relations[id];
 if(!r)return;
 const mindPatch={};
 for(const [key,value] of Object.entries(patch||{})){
  if(key==='loyalty'||key==='ambition')r[key]=strifeClamp(Number(r[key]||0)+Number(value||0));
  else mindPatch[key]=value;
 }
 if(Object.keys(mindPatch).length&&typeof shiftMind==='function')shiftMind(id,mindPatch);
 if(text&&typeof rememberMind==='function')rememberMind(id,text,kind||'国势',true);
 // 当众敲打或长期留中会增加个人不满；听取解释与妥善安抚会降低对立。
 if(kind==='敲打')r.ambition=strifeClamp(Number(r.ambition||0)+3);
 if(kind==='留中')r.ambition=strifeClamp(Number(r.ambition||0)+2);
 if(kind==='安抚')r.ambition=strifeClamp(Number(r.ambition||0)-2);
 if(kind==='质询')r.ambition=strifeClamp(Number(r.ambition||0)-1);
};
const strifeSummaryV7Before=strifeSummary;
strifeSummary=function(){
 const base=strifeSummaryV7Before();
 const risk=strifeOfficial().map(p=>{
  const r=state.relations[p.id];
  return {p:p,loyalty:Number(r.loyalty||0),ambition:Number(r.ambition||0),gap:Number(r.ambition||0)-Number(r.loyalty||0)};
 }).sort((a,b)=>b.gap-a.gap).slice(0,3);
 return base+'<div class="strife-risk"><b>朝臣心思 · 野心与忠诚</b>'+
  risk.map(x=>'<span>'+x.p.name+'　忠诚 '+x.loyalty+' · 野心 '+x.ambition+'　'+(x.gap>=20?'已有异心':x.gap>=8?'有所求':'立场尚稳')+'</span>').join('')+
  '<small>野心高于忠诚者，更可能卷入朝堂争执；这只是风险信号，不等于已经谋反。</small></div>';
};
ensureStrife();
const strifeRiskStyle=document.createElement('style');
strifeRiskStyle.textContent='.strife-risk{margin-top:12px;padding:11px 12px;border:1px solid #e6d7c9;border-radius:10px;background:#fffaf4}.strife-risk>b,.strife-risk>span,.strife-risk>small{display:block}.strife-risk>b{margin-bottom:6px;color:#865866;font-size:12px}.strife-risk>span{padding:4px 0;font-size:11px;color:#79656e}.strife-risk>small{margin-top:6px;color:#9a858b;font-size:10px;line-height:1.6}';
document.head.appendChild(strifeRiskStyle);
