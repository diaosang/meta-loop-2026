const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),suites=[['test_frontcourt.cjs','前朝逻辑'],['test_approval_flow.cjs','批阅恢复'],['test_ruined_realm.cjs','破局逻辑'],['test_courtship_and_selection.cjs','人设与选秀']];
const reports=new Map(fs.readdirSync(root).filter(n=>/^验证报告_v13_6_.*\.json$/.test(n)).map(n=>[n,fs.readFileSync(path.join(root,n))]));
const runs=[];let failed=false;
try{for(const [script,name] of suites){const r=spawnSync(process.execPath,[path.join(__dirname,script)],{cwd:root,encoding:'utf8'});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');const match=(r.stdout||'').match(/ALL (\d+) .*CHECKS PASSED/);runs.push({name,script,status:r.status,passed:match?Number(match[1]):0});if(r.status!==0){failed=true;break;}}}
finally{for(const [n,bytes] of reports)fs.writeFileSync(path.join(root,n),bytes);}
fs.writeFileSync(path.join(root,'验证报告_v13_7_兼容回归.json'),JSON.stringify({version:'13.7',runs,passed:runs.reduce((n,r)=>n+r.passed,0),failed,historicalReportsPreserved:true},null,2));
if(failed)process.exit(1);
