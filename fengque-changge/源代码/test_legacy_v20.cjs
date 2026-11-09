const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const suites=[['test_npc_interaction_compat_v19.cjs','人物互动',30],['test_romance_v18.cjs','情意与侍寝',42],['test_simulation_v15.cjs','旧经营与选秀',39],['test_daliang_canon.cjs','旧设定与旧案',36],['test_frontcourt.cjs','旧前朝',35],['test_approval_flow.cjs','批阅兼容',14],['test_everyday_talk.cjs','近况闲谈',27],['test_port_vectors_v15.cjs','经营对照',3],['test_world_v18.cjs','家族传承与存档',32]];
const old=new Map(fs.readdirSync(root).filter(n=>/^验证报告_.*\.json$/.test(n)&&!n.startsWith('验证报告_v20')).map(n=>[n,fs.readFileSync(path.join(root,n))]));
const runs=[];let failed=false;
try{for(const [script,name,expected]of suites){const r=spawnSync(process.execPath,[path.join(__dirname,script)],{cwd:root,encoding:'utf8',timeout:240000});const m=(r.stdout||'').match(/ALL (\d+) .*CHECKS PASSED/),passed=m?Number(m[1]):0;runs.push({script,name,status:r.status,passed});if(r.status!==0||passed!==expected){console.error(r.stdout,r.stderr);failed=true;break;}console.log(name+': '+passed+' passed');}}
finally{for(const [name,bytes]of old)fs.writeFileSync(path.join(root,name),bytes);}
fs.writeFileSync(path.join(root,'验证报告_v20_旧存档兼容.json'),JSON.stringify({version:20,runs,failed,passed:runs.reduce((s,r)=>s+r.passed,0),historicalReportsPreserved:true},null,2));if(failed)process.exitCode=1;
