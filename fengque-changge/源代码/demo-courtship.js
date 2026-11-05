/* Relationship pacing is earned by successful turns across actual game days. */
function courtshipState(p){
 const m=state.relations[p.id].mind;
 if(!m.courtship){
  const previous=(m.turns||[]).filter(t=>['compliment','miss','confess'].includes(t.topic));
  m.courtship={version:'13.2',count:previous.length,days:[...new Set(previous.map(t=>t.tick))],applied:[]};
 }
 const s=m.courtship;s.count=Number.isFinite(s.count)?s.count:0;s.days=s.days||[];s.applied=s.applied||[];return s;
}
function courtshipTier(p){
 const s=courtshipState(p),r=state.relations[p.id],g=COURTSHIP_DATA.rules;
 if(s.count<g.firstCount)return 'first';
 if(s.count<g.reservedUntilCount)return 'reserved';
 if(s.count===g.admonishAtCount)return 'admonish';
 if(s.count>=g.openMinCount&&r.aff>=g.openMinAff&&r.trust>=g.openMinTrust&&r.love>=g.openMinLove&&s.days.length>=g.openMinDistinctDays)return 'open';
 return 'reserved';
}
function courtshipRows(p,c,topic){
 const tier=courtshipTier(p),specific=COURTSHIP_DATA.rows.some(r=>r.npc===p.id);
 return COURTSHIP_DATA.rows.filter(r=>r.topic===topic&&r.tier===tier&&(specific?r.npc===p.id:r.personality===p.type)).map((r,i)=>({
  ...r,reply:String(r.reply).replaceAll('{self}',c.self),courtshipTier:tier,score:100-i,positive:true
 }));
}
function commitCourtship(p,row){
 if(!row.courtshipTier)return;
 const s=courtshipState(p),key=row.id+':'+mindTick();if(s.applied.includes(key))return;
 s.applied.push(key);s.applied=s.applied.slice(-60);s.count++;
 if(!s.days.includes(mindTick())){s.days.push(mindTick());const r=state.relations[p.id];r.trust=clamp(r.trust+2);}s.days=s.days.slice(-30);
 s.lastTier=row.courtshipTier;
}
