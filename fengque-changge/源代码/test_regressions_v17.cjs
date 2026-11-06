const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const suites=[['test_simulation_v15.cjs','每日经营与选秀'],['test_daliang_canon.cjs','大梁人设与旧案'],['test_frontcourt.cjs','原前朝规则'],['test_approval_flow.cjs','奏事恢复与旧批阅规则'],['test_everyday_talk.cjs','近况与闲谈'],['test_port_vectors_v15.cjs','经营规则对照'],['test_world_v16.cjs','家族宫室传位与存档']];
const old=new Map(fs.readdirSync(root).filter(n=>/^验证报告_.*\.json$/.test(n)&&!n.startsWith('验证报告_v17')).map(n=>[n,fs.readFileSync(path.join(root,n))]));
const runs=[];let failed=false;
try{
 for(const [script,name]of suites){
  const result=spawnSync(process.execPath,[path.join(__dirname,script)],{cwd:root,encoding:'utf8'}),match=(result.stdout||'').match(/ALL (\d+) .*CHECKS PASSED/);
  runs.push({script,name,status:result.status,passed:match?Number(match[1]):0});
  if(result.status!==0){console.error(result.stdout,result.stderr);failed=true;break;}
  console.log(name+': '+match?.[1]+' passed');
 }
}finally{for(const [name,bytes]of old)fs.writeFileSync(path.join(root,name),bytes);}
fs.writeFileSync(path.join(root,'验证报告_v17_兼容回归.json'),JSON.stringify({version:17,runs,failed,passed:runs.reduce((sum,r)=>sum+r.passed,0),historicalReportsPreserved:true},null,2));
if(failed)process.exitCode=1;
