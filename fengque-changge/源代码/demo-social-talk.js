/* Everyday familiarity comes from completed conversations on separate days, never a preview. */
function socialState(p){
 const m=state.relations[p.id].mind;
 if(!m.social){
  const byDay={};
  for(const t of m.turns||[]){
   const actual=t.committed||(state.relations[p.id].notes||[]).some(n=>n.text.includes(t.reply));
   if(!actual||!['recent','home','interest','listen','comfort'].includes(t.topic))continue;
   const key=String(t.tick);byDay[key]=byDay[key]||[];
   const topic=(['listen','comfort'].includes(t.topic)?'care:':'chat:')+t.topic;
   if(!byDay[key].includes(topic)&&byDay[key].length<3)byDay[key].push(topic);
  }
  m.social={version:'13.3',count:Object.values(byDay).reduce((n,a)=>n+a.length,0),days:Object.keys(byDay).map(Number),byDay,applied:[]};
 }
 return m.social;
}
function socialTier(p){
 const s=socialState(p),r=state.relations[p.id],g=SOCIAL_TALK_DATA.rules;
 if(r.mind.security<25)return 'stranger';
 if(s.count>=g.trustedTurns&&s.days.length>=g.trustedDays&&r.aff>=g.trustedAff&&r.trust>=g.trustedTrust)return 'trusted';
 if(s.count>=g.familiarTurns&&s.days.length>=g.familiarDays&&r.aff>=g.familiarAff&&r.trust>=g.familiarTrust)return 'familiar';
 return 'stranger';
}
function socialLabel(p){return {stranger:['xu','jiang','ye','xie'].includes(p.id)?'旧识 · 私下尚拘谨':'初识 · 尚守礼',familiar:'渐熟 · 愿说琐事',trusted:'相知 · 愿谈心事'}[socialTier(p)];}
function commitSocial(p,row){
 if(typeof commitEverydayReply==='function')commitEverydayReply(p,row);
 if(!row.socialTier)return;
 const s=socialState(p),day=String(mindTick()),key=row.id+':'+day;
 if(s.applied.includes(key))return;
 s.applied.push(key);s.applied=s.applied.slice(-80);
 row.committed=true;
 const t=state.relations[p.id].mind.turns.slice().reverse().find(t=>t.id===row.id&&t.tick===mindTick());if(t)t.committed=true;
 const topic=row.category+':'+(row.topic==='listen-followup'?'listen':row.topic);
 const today=s.byDay[day]=s.byDay[day]||[];
 if(!today.includes(topic)&&today.length<SOCIAL_TALK_DATA.rules.maxProgressPerDay){
  today.push(topic);s.count++;if(!s.days.includes(mindTick()))s.days.push(mindTick());
  // Trust grows from actual contact, up to two points per day; no render/replay farming.
  if(today.length<=2)state.relations[p.id].trust=clamp(state.relations[p.id].trust+1);
 }
 s.days=s.days.slice(-30);
 for(const k of Object.keys(s.byDay).slice(0,-30))delete s.byDay[k];
}
const SOCIAL_SKILLS={
 '理政':['将手边的条目分开看，免得前后相混。','把易混的条目重新排过。分清先后，读着也顺些。','今日只看一小段。看清这一处，余下的明日再理。'],
 '商账':['在核手边的小账，先将零项另记。','核到一处算得太快的，停下来重拨了一回。','今日不另开新账。手边这页核妥，便能陪陛下坐坐。'],
 '书法':['在习字。纸尚未收，陛下莫嫌凌乱。','又将从前写急的一字重写了几遍，还是得慢着来。','今日留了几个不满意的字，陛下肯看，便一起看。'],
 '琴艺':['方才理过琴弦，正将谱子收好。','有一处指法还在慢练，先不急着连成整段。','今日不急着弹全曲，只想拣一小段给陛下听。'],
 '骑射':['在收弓弦与护腕。用过的东西，得再看一遍才放心。','护腕理好了，今日先不加练，免得越急越走样。','今日到这里便收手。若陛下想看，下回得空再一道去。'],
 '棋弈':['在收棋子。黑白分妥了，免得下回临用时再挑。','在看棋盘上的一处变化，不急着落子，先将两边都想一遍。','今日不摆难局。陛下肯坐，便慢慢下一盘。'],
 '舞艺':['正理练习用的衣带，叠妥了便收。','有一处转步想再顺一顺，今日先把节拍记住。','今日不练整段，只留了那一转，想问陛下看着可还顺。'],
 '绘事':['在收笔墨。未干的纸另放着，不敢卷得太急。','想重看几笔浓淡，先不添色，免得越改越重。','今日不忙着题款。画上留一处空，等陛下看过再说。'],
 '医理':['在对药材的记注。相近的名字另记，免得看混。','将先前拿不准的一处留了签，待查明再补，不急着猜。','今日只谈书里这一处。不把拿不准的话说满，陛下也放心些。'],
 '香事':['在理香具。余灰先收清，省得沾到下一回。','在看香篆的断处，先理好器具，再试手法。','今日先不添香。陛下若愿坐，留这点余香便够了。']
};
function socialRows(p,c,category,topic){
 const tier=socialTier(p),n=['stranger','familiar','trusted'].indexOf(tier);
 const fill=s=>String(s).replaceAll('{self}',c.self).replaceAll('{specialty}',c.specialty).replaceAll('{clan}',c.clan);
 let rows=SOCIAL_TALK_DATA.rows.filter(r=>r.tier===tier&&r.category===category&&r.topic===topic&&(r.npc===p.id||!r.npc&&r.personality===p.type)).map(r=>({...r,reply:fill(r.reply),score:r.npc?100:70,socialTier:tier}));
 if(category==='chat'&&topic==='recent'){
  const text=SOCIAL_SKILLS[c.specialty]?.[n];
  if(text)rows.push({id:'social-skill:'+p.id+':'+tier,semantic:'social-skill:'+c.specialty+':'+tier,reply:text,score:60,socialTier:tier});
 }
 if(category==='care'&&['gift','bag','promise'].includes(topic)){
  const text={
   gift:['陛下厚赐，'+c.self+'谢恩。请容收妥，免得磕碰了。','这份礼拿在手里倒合用。谢陛下还替我想着。','您挑的，自会好好留着。不过下回来，空着手也成。'],
   bag:['出行也劳陛下垂念，'+c.self+'不胜惶恐，谢陛下赏赐。','路上带回来的？那先别忙着收，陛下说说，在哪里瞧见的？','您出门看见这个，还能想到我。那路上可有别的趣事？我也想听。'],
   promise:[''+c.self+'记下了，届时恭候。陛下若政务繁忙，遣人告知便是。','好，下月等您来。这回说定，若有事，提前捎句话。','那就说定了。下月来时，咱们接着聊，不必回回另找公事作由头。']
  }[topic][n];
  rows=[{id:'social-care:'+p.id+':'+tier+':'+topic,semantic:'social-care:'+tier+':'+topic,reply:text,score:100,socialTier:tier}];
 }
 return rows;
}
function socialFactRows(p,rows){
 const tier=socialTier(p);
 return rows.filter(r=>tier!=='stranger'||!['prepare','seekcare','boundary'].some(k=>r.planKind===k)).map(r=>({...r,socialTier:tier}));
}
function agencySummary(){
 const seenText=new Set(),seenPeople=new Set(),out=[];
 for(const x of state.agency.moments.filter(x=>x.key===todayKey()).slice().reverse()){
  const p=PEOPLE.find(p=>p.id===x.npc);if(!p||seenPeople.has(p.id)||seenText.has(x.text))continue;
  seenText.add(x.text);seenPeople.add(p.id);
  const text=x.text.startsWith(p.name)?x.text:p.name+'：'+x.text;
  out.push('<span class="daily-person">'+mindEscape(text)+'</span>');if(out.length===3)break;
 }
 return out.join('<br>')||'大家正各自忙着。去人物页看看，今日的行迹会慢慢显出来。';
}
