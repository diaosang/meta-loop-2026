// Runtime/logic tests in a DOM stub. This is intentionally not a browser visual test.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=fs.existsSync('网页Demo/index.html')?process.cwd():path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'网页Demo/index.html'),'utf8');
const script=[...html.matchAll(/<script>\s*([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
const nodes=new Map();
function node(id='node'){
 if(nodes.has(id))return nodes.get(id);
 const n={id,innerHTML:'',textContent:'',value:'',style:{},dataset:{},disabled:false,children:[],
  classList:{add(){},remove(){},toggle(){}},setAttribute(){},getAttribute(){return null;},
  addEventListener(){},remove(){},appendChild(x){this.children.push(x);},append(x){this.children.push(x);},
  replaceChildren(){},insertAdjacentHTML(where,t){this.innerHTML+=t;},scrollIntoView(){},focus(){},
  click(){},querySelector(){return null;},querySelectorAll(){return [];},contains(){return false;}};
 nodes.set(id,n);return n;
}
const stored=new Map();
const document={head:node('head'),body:node('body'),documentElement:node('html'),
 getElementById:id=>node(id),createElement:tag=>node('created-'+nodes.size+'-'+tag),
 createTextNode:t=>({textContent:t}),querySelector:s=>s.includes('data-page=')?node(s):null,
 querySelectorAll:()=>[],addEventListener(){}};
const sandbox={console,document,localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)},
 setTimeout:()=>0,clearTimeout(){},requestAnimationFrame:fn=>fn(),location:{search:'',href:'http://localhost/'},
 URL,Blob,Intl,Date,Math,Map,Set,JSON,Number,String,Array,Object,RegExp,Error,structuredClone,
 scrollTo(){},innerWidth:390,addEventListener(){},navigator:{},confirm:()=>false};
sandbox.window=sandbox;vm.createContext(sandbox);
vm.runInContext(script,sandbox,{filename:'web-demo-inline.js',timeout:15000});
const run=s=>vm.runInContext(s,sandbox,{timeout:20000});
const checks=[];
function check(name,fn){fn();checks.push(name);console.log('PASS '+name);}
check('full game boot / 100 NPCs / six categories',()=>{
 assert.equal(run('PEOPLE.length'),100);assert.equal(run('INTERACTION_CATEGORIES.length'),6);assert.equal(run('window.__courtVoiceAudit.version'),11);
 assert.ok(!script.includes('function composeExpandedDialogue('),'old assembly engine must not be bundled');
});
check('20 consecutive answers for each NPC, text and meaning deduplication',()=>{
 const failures=run(`(()=>{const errors=[];for(const p of PEOPLE){const m=state.relations[p.id].mind;m.turns=[];const a=[];
 for(let i=0;i<20;i++){const d=__courtVoiceAudit.turn(p,'chat','recent');if(d.exhausted)errors.push(p.id+':exhausted');
 if(a.some(x=>x.semantic===d.semantic||__courtVoiceAudit.similarity(x.reply,d.reply)>=.78))errors.push(p.id+':repeat');a.push(d);}
 if(m.turns.length!==20)errors.push(p.id+':window');}return errors;})()`);
 assert.equal(JSON.stringify(failures),'[]');
});
check('30-turn rolling memory and context identity/season/festival',()=>{
 const result=run(`(()=>{const p=PEOPLE.find(x=>x.id==='xu');for(let i=0;i<40;i++)__courtVoiceAudit.turn(p,'chat','recent');
 const t=state.relations.xu.mind.turns;return {n:t.length,fields:['npc','identity','clan','personality','mood','relationship','location','season','festival','recentEvent','memory','topic'].every(k=>k in t.at(-1).context)};})()`);
 assert.equal(result.n,30);assert.equal(result.fields,true);
});
check('same family question, twelve distinct personality positions',()=>{
 const result=run(`(()=>{const samples=[];for(const type of new Set(PEOPLE.map(x=>x.type))){const p=PEOPLE.find(x=>x.type===type);rememberMind(p.id,'家中来信，提及家门期许。','家书');const d=__courtVoiceAudit.turn(p,'probe','family');samples.push(d.reply);}return samples;})()`);
 assert.equal(new Set(result).size,12);
});
check('mechanics: one visit AP, one turn count, actual prompt matches answer',()=>{
 run(`state.ap=15;state.tour=null;visit('xu');session.section='chat';interactionTopic('interest');`);
 assert.equal(run('state.ap'),14);assert.equal(run('session.left'),2);
 assert.ok(run("session.response.includes('闲时最爱做什么')"));
 assert.ok(!run("session.response.includes('愿意留下')"));
});
check('factual NPC testimony not replaced with romance or generic mood',()=>{
 run(`state.ap=15;visit('xu');session.section='probe';interactionTopic('relation:ye');`);
 assert.equal(run('state.npcStatements.at(-1).verified'),false);
 assert.ok(run("session.response.includes('叶承钧')"));
 assert.ok(!run("session.response.includes('想见您')"));
});
check('unsupported content exhausts honestly without spending turns',()=>{
 run(`state.ap=15;visit('xu');session.left=10;session.section='care';state.relations.xu.mind.turns=[];
 interactionTopic('comfort');interactionTopic('comfort');interactionTopic('comfort');interactionTopic('comfort');`);
 const before=run('session.left');run(`interactionTopic('comfort');`);
 assert.equal(run('session.left'),before);assert.ok(run("session.response.includes('方才已谈过')"));
});
check('mood changes whole response, absent family letters never fabricated',()=>{
 run(`state.relations.xu.mind.turns=[];state.relations.xu.mind.anger=80;`);
 const line=run(`__courtVoiceAudit.turn(PEOPLE[0],'care','listen').reply`);
 assert.ok(line.includes('原委')||line.includes('想通'));
 run(`state.relations.lu.mind.memories=[];state.relations.lu.mind.turns=[];`);
 assert.ok(run(`__courtVoiceAudit.turn(PEOPLE.find(x=>x.id==='lu'),'probe','family').reply.includes('尚无新信')`));
});
check('daily needs do not drift on repeated renders',()=>{
 const before=run(`JSON.stringify(state.relations.xu.agency.needs)`);
 run('buildDay();buildDay();buildDay();');
 assert.equal(run(`JSON.stringify(state.relations.xu.agency.needs)`),before);
});
check('affection/overnight mechanics retain thresholds, explicit consent and AP',()=>{
 run(`state.ap=15;const rx=state.relations.xu;Object.assign(rx,{aff:75,love:20});Object.assign(rx.mind,{anger:0,distance:0,hurt:0,disappointment:0,security:70,jealousy:0});
 visit('xu');session.section='flirt';interactionTopic('miss');`);
 assert.ok(run('state.relations.xu.love')>=25);
 run(`const p=PEOPLE.find(x=>x.id==='song');state.relations.song.rank=null;state.relations.song.aff=75;
 Object.assign(state.relations.song.mind,{anger:0,distance:0,hurt:0,disappointment:0,security:70,jealousy:0});
 state.bedchamber=null;state.ap=15;visit('song');intimacyQuestion();`);
 assert.equal(run('session.intimacyConsent'),'song');assert.equal(run('state.ap'),14);
 run('intimacyConfirm();');assert.equal(run('state.ap'),13);assert.equal(run('state.bedchamber.id'),'song');
 assert.ok(!run("session.response.includes('此事据实说来')"));
});
check('reports: three choices, no instant resolution, stable evidence, deferred return and echo',()=>{
 run(`state.money=100;eventMenu();`);
 assert.ok(run("document.getElementById('modalIntro').textContent.includes('有司')"));
 const uid=run('__courtVoiceAudit.reports()[0].uid');
 run(`actions.voiceReportEvidence(${JSON.stringify(uid+'|0')});actions.voiceReportChoose(${JSON.stringify(uid+'|1')});`);
 assert.equal(run(`state.courtVoice.reports.find(x=>x.uid===${JSON.stringify(uid)}).stage`),'奉旨办理');
 const r=run(`state.courtVoice.reports.find(x=>x.uid===${JSON.stringify(uid)})`);
 assert.equal(run(`__courtVoiceAudit.template(state.courtVoice.reports[0]).choices.length`),3);
 assert.ok(r.relation.a&&r.relation.b);
 run(`state.day+=6;buildDay();`);
 assert.equal(run(`state.courtVoice.reports.find(x=>x.uid===${JSON.stringify(uid)}).done`),true);
 run(`state.elapsed+=3;state.day=1;buildDay();`);
 assert.equal(run(`state.courtVoice.reports.find(x=>x.uid===${JSON.stringify(uid)}).echoed`),true);
});
check('selection answers preserve background and willingness, refusal cannot be selected',()=>{
 run(`state.ap=15;state.audition={status:'offered',pool:['song'],interviews:{},selected:[],performances:{}};
 state.relations.song.mind.anger=0;state.relations.song.mind.distance=0;state.relations.song.mind.disappointment=0;state.relations.song.mind.security=60;
 actions.auditionAsk('song|0');actions.auditionAsk('song|1');actions.auditionAsk('song|2');`);
 assert.equal(run('state.audition.interviews.song.length'),3);
 assert.equal(run('state.audition.consent.song'),true);
 assert.ok(!run("state.audition.answers.song.reply.includes('这是我自己作出的决定')"));
 run(`state.audition.interviews.song=[];state.relations.song.mind.anger=80;actions.auditionAsk('song|2');actions.auditionSelect('song');`);
 assert.equal(run('state.audition.consent.song'),false);assert.equal(run('state.audition.selected.length'),0);
});
check('100 NPCs leave a visible action when player skips a day',()=>{
 run(`state.day=2;buildDay();`);
 const n=run(`PEOPLE.filter(p=>state.dailyHistory[todayKey()]?.entries[p.id]?.[3]?.text).length`);
 assert.equal(n,100);
});
check('relationship decision changes memory, an edge, a report and a later scene',()=>{
 run(`state.ap=15;const ps=PEOPLE.filter(p=>p.official&&!state.relations[p.id].rank).slice(0,2);
 const a=ps[0],b=ps[1];state.socialEdges.push({a:a.id,b:b.id,affAB:40,affBA:40,voiceStage:'争执'});
 state.agency.scenes.push({id:'test-dispute',source:a.id,target:b.id,voiceStage:'争执',text:'两人未能商定协办次序。',done:false});
 actions.agencyChoose('test-dispute|call');`);
 assert.ok(run("state.courtVoice.reports.some(r=>r.template==='cooperate')"));
 assert.ok(run('state.courtVoice.relationFollowups.length')>0);
 run('state.day+=3;buildDay();');assert.equal(run('state.courtVoice.relationFollowups.at(-1).done'),true);
 assert.ok(run("state.agency.scenes.some(s=>s.title.includes('后续'))"));
});
check('save/reload keeps dialogue window, refusal and pending reports',()=>{
 run('save();');const save=JSON.parse(stored.get(run('KEY')));
 assert.equal(save.courtVoice.version,11);assert.ok(save.relations.xu.mind.turns.length<=30);
 const fresh={...sandbox};fresh.window=fresh;vm.createContext(fresh);
 vm.runInContext(script,fresh,{filename:'reload-inline.js',timeout:15000});
 assert.equal(vm.runInContext('state.courtVoice.version',fresh),11);
 assert.equal(vm.runInContext('state.courtVoice.reports.length',fresh),save.courtVoice.reports.length);
});
check('legacy save without new fields migrates without wiping affinity',()=>{
 const legacy=JSON.parse(stored.get(run('KEY')));delete legacy.courtVoice;
 for(const r of Object.values(legacy.relations)){if(r.mind){delete r.mind.turns;delete r.mind.disclosures;delete r.mind.turnSeq;}}
 legacy.relations.xu.aff=83;stored.set(run('KEY'),JSON.stringify(legacy));
 const fresh={...sandbox};fresh.window=fresh;vm.createContext(fresh);vm.runInContext(script,fresh,{timeout:15000});
 assert.equal(vm.runInContext('state.relations.xu.aff',fresh),83);
 assert.equal(vm.runInContext('state.courtVoice.version',fresh),11);
 assert.equal(vm.runInContext('Array.isArray(state.relations.xu.mind.turns)',fresh),true);
});
fs.writeFileSync(path.join(root,'验证报告_v11.json'),JSON.stringify({version:11,type:'runtime-with-DOM-stub',checks,
 browserVisualVerification:false,authoredRows:run('COURT_VOICE_DATA.rows.length'),npcCount:run('PEOPLE.length')},null,2));
console.log('ALL '+checks.length+' CHECKS PASSED');
