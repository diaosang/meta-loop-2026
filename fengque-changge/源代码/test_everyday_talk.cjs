const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),helper=fs.readFileSync(path.join(__dirname,'test_palace_life_v13.cjs'),'utf8').split('let game=boot(),checks=[];')[0];
const boot=new Function('require','__dirname',helper+';return boot;')(require,__dirname);
let game=boot('null');const run=s=>game.run(s),checks=[],samples={};
function check(name,fn){fn();checks.push(name);console.log('PASS '+name);}
function reset(saved='null'){game=boot(saved);run('state.introSeen=true;');}
function meet(id='xu',category='care'){run(`state.ap=15;visit('${id}');session.section='${category}';`);}
function say(topic){run(`interactionTopic('${topic}')`);return run('state.relations[session.id].mind.lastTurn');}
function day(){run('state.day++;buildDay();');}
function tier(id,level){run(`(()=>{const p=PEOPLE.find(p=>p.id==='${id}'),r=state.relations[p.id],s=socialState(p);Object.assign(r,{aff:80,trust:80});Object.assign(r.mind,{security:80,anger:0,hurt:0,distance:0,jealousy:0,disappointment:0});if(${level}>0){s.count=${level}===2?12:5;s.days=${level}===2?[1,2,3,4]:[1,2];}})()`);}
check('355 new complete answers have stable unique IDs and no empress speech',()=>{
 assert.equal(run('EVERYDAY_TALK_DATA.rows.length'),355);
 assert(run(`new Set(EVERYDAY_TALK_DATA.rows.map(r=>r.id)).size===355`));
 assert(run(`EVERYDAY_TALK_DATA.rows.every(r=>r.reply.length>7&&!/朕|你说|你接道/.test(r.reply))`));
});
check('all 100 NPCs have both ordinary concern topics at first acquaintance',()=>{
 assert(run(`PEOPLE.every(p=>['listen','comfort'].every(topic=>{const c=__courtVoiceAudit.context(p),rows=socialRows(p,c,'care',topic);return rows.length>=3&&rows.every(r=>!r.storyMark&&!r.stage)}))`));
});
check('all 100 NPCs retain their actual specialty and family-story access',()=>{
 assert(run(`PEOPLE.every(p=>{const c=__courtVoiceAudit.context(p);return socialRows(p,c,'chat','interest').length>=3&&topicsFor('chat',p,state.relations[p.id]).some(t=>t[0].startsWith('story:'))})`));
});
check('care menu asks near circumstances and living, with existing gift mechanics retained',()=>{
 meet();const topics=run(`topicsFor('care',PEOPLE[0],state.relations.xu)`);
 assert.equal(topics.find(t=>t[0]==='listen')[1],'问问近况');assert.equal(topics.find(t=>t[0]==='comfort')[1],'问问起居');assert(topics.some(t=>t[0]==='gift'));assert(topics.some(t=>t[0]==='promise'));
});
check('ordinary care gives a direct recent update, not an invitation to vent or a fixed ink scene',()=>{
 const row=say('listen');samples.xuConcern=row.reply;assert.equal(row.player,'近来过得如何？');assert.equal(row.socialTier,'stranger');
 assert(!/兑水|慢慢说|妥当的结果|族中来问/.test(row.reply));assert(!run('!!state.relations.xu.mind.privateTalk'));
 assert.equal(run('session.response'),'“'+row.reply+'”');assert.equal(run('session.left'),2);
});
check('asking living circumstances receives an answer rather than obeying an order to rest',()=>{
 const row=say('comfort');samples.xuLiving=row.reply;assert(/吃|睡|安睡|起居|读书|看书|夜|受寒|饮食/.test(row.reply));assert(!/^好，听|这便|依言/.test(row.reply));
 assert.equal(run('session.response'),'“'+row.reply+'”');assert.equal(run('session.left'),1);
});
check('repeated care first uses distinct answers with no stage or player text',()=>{
 const first=run('state.relations.xu.mind.everydayReplies[0].reply'),row=say('listen');assert.notEqual(row.reply,first);
 assert(!run(`/mind-stage|你说|你接道|朕|他将|他垂/.test(session.response)`));assert.equal(run('session.left'),0);
});
check('no remaining turns can obtain another answer or reward',()=>{
 const before=run('JSON.stringify({left:session.left,aff:state.relations.xu.aff,h:state.relations.xu.mind.everydayReplies})');say('listen');
 assert.equal(run('JSON.stringify({left:session.left,aff:state.relations.xu.aff,h:state.relations.xu.mind.everydayReplies})'),before);
});
check('previewing and rerendering never add to committed repetition memory or familiarity',()=>{
 reset();const before=run('JSON.stringify(socialState(PEOPLE[0]))');run(`everydayMemory(PEOPLE[0]);for(let i=0;i<8;i++)__courtVoiceAudit.turn(PEOPLE[0],'care','listen');render();render();`);
 assert.equal(run('state.relations.xu.mind.everydayReplies.length'),0);assert.equal(run('JSON.stringify(socialState(PEOPLE[0]))'),before);
});
check('an uncommitted preview does not wrongly exhaust the real topic',()=>{
 meet();const row=say('listen');assert(row.reply);assert.equal(run('state.relations.xu.mind.everydayReplies.length'),1);assert.equal(run('session.left'),2);
});
check('high affection and a title alone cannot unlock intimate care',()=>{
 reset();run(`Object.assign(state.relations.xu,{aff:99,trust:99,rank:'侍君'});`);meet();const row=say('listen');assert.equal(row.socialTier,'stranger');assert.equal(row.minTier,0);
});
check('familiarity grows only through actual topics on distinct days with capped daily trust',()=>{
 reset();const trust=run('state.relations.xu.trust');meet();say('listen');say('comfort');say('listen');
 assert.equal(run('socialState(PEOPLE[0]).count'),2);assert.equal(run('state.relations.xu.trust'),trust+2);assert.equal(run('socialTier(PEOPLE[0])'),'stranger');
 day();meet('xu','chat');say('recent');say('interest');assert.equal(run('socialTier(PEOPLE[0])'),'familiar');
});
check('earned familiar and trusted tiers expand answers without rewriting the first tier',()=>{
 reset();const counts=[];for(let i=0;i<3;i++){if(i)tier('xu',i);counts.push(run(`socialRows(PEOPLE[0],__courtVoiceAudit.context(PEOPLE[0]),'care','listen').length`));}
 assert(counts[1]>counts[0]&&counts[2]>counts[1]);
 assert(run(`socialRows(PEOPLE[0],__courtVoiceAudit.context(PEOPLE[0]),'care','listen').some(r=>r.minTier===2)`));
});
check('the same tier expansion applies to generated NPCs and nonromantic elders',()=>{
 const id=run(`PEOPLE.find(p=>!['xu','ye','xie','song','lu','jiang'].includes(p.id)).id`);tier(id,2);
 assert(run(`socialRows(PEOPLE.find(p=>p.id==='${id}'),__courtVoiceAudit.context(PEOPLE.find(p=>p.id==='${id}')),'care','listen').some(r=>r.minTier===2)`));
 tier('jiang',2);assert(run(`socialRows(PEOPLE.find(p=>p.id==='jiang'),__courtVoiceAudit.context(PEOPLE.find(p=>p.id==='jiang')),'care','listen').every(r=>!/心动|想您|坐近/.test(r.reply))`));
});
check('private care never silently reveals a family scar after the origin is learned',()=>{
 reset();tier('xu',1);run(`storyOf(PEOPLE[0]).known.origin=mindTick();`);meet();const row=say('listen');assert(!row.storyMark);assert(!run('!!storyOf(PEOPLE[0]).known.scar'));
 assert(run(`topicsFor('chat',PEOPLE[0],state.relations.xu).some(t=>t[0]==='story:scar')`));
});
check('explicit old-story dialogue is still available and advances the real biography',()=>{
 meet('xu','chat');say('story:scar');assert(run('!!storyOf(PEOPLE[0]).known.scar'));assert(!run('session.response.includes("mind-stage")'));
});
check('ordinary chat is NPC speech only, grounded in the actual character',()=>{
 reset();meet('song','chat');const row=say('recent');samples.songChat=row.reply;assert(/琴|谱|弦|曲|指法|慢练/.test(row.reply));assert.equal(run('session.response'),'“'+row.reply+'”');
});
check('first meetings of the six distinct characters never borrow another core biography',()=>{
 for(const id of ['xu','jiang','ye','xie','song','lu']){reset();meet(id);const row=say('listen');assert.equal(row.npc,id);assert(!/想您|等您来|坐近|只有您/.test(row.reply));}
});
check('six repeated recent-chat turns across days use six distinct real answers',()=>{
 reset();const heard=[];for(let i=0;i<6;i++){if(i)day();meet('song','chat');heard.push(say('recent').reply);}assert.equal(new Set(heard).size,6);samples.songSixDays=heard;
});
check('concern and living topics avoid saying the same line during one day',()=>{
 reset();const heard=[];for(let i=0;i<3;i++){meet();for(const topic of ['listen','comfort'])heard.push(say(topic).reply);}
 assert.equal(new Set(heard).size,6);
});
check('exhausting a same-day pool does not fabricate facts, grant another reward or recycle speech',()=>{
 const before=run('JSON.stringify({aff:state.relations.xu.aff,h:state.relations.xu.mind.everydayReplies})');meet();run('interactionTopic("listen");');
 assert.equal(run('session.left'),3);assert.equal(run('JSON.stringify({aff:state.relations.xu.aff,h:state.relations.xu.mind.everydayReplies})'),before);
});
check('after a pool cycles, the least repeated least recently used answer wins',()=>{
 reset();meet();const p='PEOPLE[0]';run(`window.pool=socialRows(${p},__courtVoiceAudit.context(${p}),'care','listen');state.relations.xu.mind.everydayReplies=window.pool.map((r,i)=>({id:r.id,semantic:r.semantic,reply:r.reply,tick:mindTick()-3+i}));`);
 const oldest=run('window.pool[0].id');const row=say('listen');assert.equal(row.id,oldest);
});
check('repetition memory survives reload and remains specific to its NPC',()=>{
 reset();meet();const first=say('listen').reply;run('save();');const saved=game.save();game=boot(saved);day();meet();const second=say('listen').reply;assert.notEqual(first,second);
 assert.equal(run('state.relations.xu.mind.everydayReplies.length'),2);assert.equal(run('everydayMemory(PEOPLE.find(p=>p.id==="song")).length'),0);
});
check('a legacy private thread neither hijacks ordinary concern nor offers stale player speech',()=>{
 const saved=JSON.parse(game.save());saved.relations.xu.mind.privateTalk={id:'legacy-thread',tick:run('mindTick()'),phase:'awaiting',opening:{reply:'旧的砚池问题',category:'care'},branches:[{say:'朕替你换砚',reply:'旧分支'}]};
 game=boot(JSON.stringify(saved));meet();run('actions.interactionCategory("care");');const row=say('listen');assert(!/旧的砚池|旧分支/.test(row.reply));
 const left=run('session.left');run('actions.privateReply("legacy-thread|0");');assert.equal(run('session.left'),left);assert(run('!!state.relations.xu.mind.privateTalk'));
});
check('serious anger retains its own grievance rather than forced daily pleasantries',()=>{
 reset();run('state.relations.xu.mind.anger=80;');meet();const row=say('listen');assert(!row.everyday);assert(/原委|想通|说清|今日|请/.test(row.reply));
});
check('NPC-only rendering also strips stage actions and extracts direct speech from older chat scenes',()=>{
 assert.equal(run(`__courtVoiceAudit.renderTurn({category:'chat',stage:'你走近，他放下东西。',reply:'他说：“这里给您留一份。”',narrative:true})`),'“这里给您留一份。”');
 assert.equal(run(`__courtVoiceAudit.renderTurn({category:'care',stage:'你问近况，他垂首。',reply:'近来尚好。'})`),'“近来尚好。”');
});
check('current game retains the ruined opening, original hall, saved heirs and treasury',()=>{
 reset();assert.equal(run('state.frontCourt.treasury'),0);assert.equal(run('state.frontCourt.grain'),0);assert.equal(run('state.frontCourt.ruin.control'),18);assert(run('hallCourt().includes("hall-art")'));
 const old=boot();const save=JSON.parse(old.save());save.frontCourt.treasury=77;save.relations.song.aff=63;const life=JSON.stringify(save.life);game=boot(JSON.stringify(save));assert.equal(run('state.frontCourt.treasury'),77);assert.equal(run('state.relations.song.aff'),63);assert.equal(run('JSON.stringify(state.life)'),life);
});
fs.writeFileSync(path.join(root,'验证报告_v13_7_近况与去重.json'),JSON.stringify({version:'13.7',passed:checks.length,checks,samples},null,2));
console.log('ALL '+checks.length+' EVERYDAY TALK CHECKS PASSED');
