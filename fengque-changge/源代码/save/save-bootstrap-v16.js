/* Capture the original value before older layers attempt automatic migration. */
const FQ_BOOT={raw:null,meta:null,block:true};
try{FQ_BOOT.raw=localStorage.getItem('fengque-demo-v4');FQ_BOOT.meta=JSON.parse(localStorage.getItem('fengque-save-meta-v16')||'null');}catch{}
