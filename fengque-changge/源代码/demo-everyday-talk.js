/* V13.7: ordinary concern asks how life is going; committed answers own repetition memory. */
function everydayMemory(p){
 const m=state.relations[p.id].mind;
 if(!m.everydayReplies){
  // Old previews were recorded in turns too. Migrate only conversations actually committed.
  m.everydayReplies=(m.turns||[]).filter(t=>t.committed&&['recent','home','interest','listen','comfort'].includes(t.topic))
   .map(t=>({id:t.id,semantic:t.semantic,reply:t.reply,tick:t.tick}));
 }
 return m.everydayReplies;
}
function commitEverydayReply(p,row){
 if(!['chat','care'].includes(row.category)||!['recent','home','interest','listen','comfort'].includes(row.topic))return;
 const history=everydayMemory(p),token=row.id+':'+mindTick()+':'+state.relations[p.id].mind.turnSeq;
 if(history.some(t=>t.token===token))return;
 history.push({id:row.id,semantic:row.semantic,reply:row.reply,tick:mindTick(),token});
 if(history.length>240)history.splice(0,history.length-240);
}
function everydayCandidates(p,pool,similarity){
 const history=everydayMemory(p),same=(a,b)=>a.id===b.id||a.semantic===b.semantic||similarity(a.reply,b.reply)>=.78;
 return pool.filter(row=>!history.some(t=>t.tick===mindTick()&&same(t,row))).map(row=>{
  const hits=history.map((t,i)=>same(t,row)?i:-1).filter(i=>i>=0);
  return {...row,everydayUses:hits.length,everydayLast:hits.length?hits.at(-1):-1};
 });
}
const beforeEverydayRows=socialRows;
socialRows=function(p,c,category,topic){
 let old=beforeEverydayRows(p,c,category,topic);
 if(!['chat','care'].includes(category)||!['recent','home','interest','listen','comfort'].includes(topic))return old;
 const tier=socialTier(p),level=['stranger','familiar','trusted'].indexOf(tier),bespoke=EVERYDAY_TALK_DATA.rows.some(r=>r.npc===p.id);
 const fresh=EVERYDAY_TALK_DATA.rows.filter(r=>r.category===category&&r.topic===topic&&r.minTier<=level&&
  (r.npc===p.id||!bespoke&&(r.personality===p.type||r.specialty===c.specialty))).map(r=>({...r,
   reply:r.npc?r.reply.replaceAll('草民',c.self):r.reply.replaceAll('臣',c.self),
   score:r.npc?100:r.personality?85:80,socialTier:tier,everyday:true}));
 if(!bespoke&&category==='chat'&&['recent','interest'].includes(topic)&&!fresh.some(r=>r.specialty)){
  const alternatives=topic==='recent'?['近来在练'+c.specialty+'，先将拿不准的一处记着，不急着往下赶。','手边的'+c.specialty+'还没收尾，今日先理这一点，余下明日再做。','在看从前做'+c.specialty+'时留的记注，有一处想再试试。']:
   ['喜欢'+c.specialty+'。做得久了，便会留意从前看不出的细处。','平日多做'+c.specialty+'，不过也不想日日赶着做完，闲时慢慢来更有趣。',''+c.specialty+'还有没弄明白的地方。闲下来，便想自己一点点试清。'];
  alternatives.forEach((reply,i)=>fresh.push({id:'everyday:skill:'+p.id+':'+topic+':'+i,semantic:'everyday:skill:'+p.id+':'+topic+':'+i,reply,score:80,socialTier:tier,category,topic}));
 }
 // Family conflicts belong to the explicitly chosen old-story topic, not ordinary concern.
 if(category==='care')return fresh.length?fresh:old.filter(r=>!r.storyMark);
 if(bespoke)old=old.filter(r=>r.npc===p.id||r.storyMark||r.id.startsWith('social:'+p.id+':'));
 return [...old,...fresh];
};
const beforeEverydayTopics=topicsFor;
topicsFor=function(category,p,r){
 return beforeEverydayTopics(category,p,r).map(row=>{
  if(category==='care'&&row[0]==='listen')return ['listen','问问近况','听他说说最近过得怎样。'];
  if(category==='care'&&row[0]==='comfort')return ['comfort','问问起居','问问吃睡、身体与日常是否安稳。'];
  return row;
 });
};
for(const category of INTERACTION_CATEGORIES){
 if(category[0]==='care')category[2]='问近况、问起居，听他自己的回答';
 if(category[0]==='chat')category[2]='聊近日小事、故乡和各自的兴趣';
}
