import {loadEnv} from './env.mjs';loadEnv();
const issues=[];if(!process.env.YOUCAM_API_KEY)issues.push('YOUCAM_API_KEY missing');
if(Number(process.versions.node.split('.')[0])<20)issues.push('Node 20+ required');
if(issues.length){console.error('DOCTOR FAIL');for(const x of issues)console.error('-',x);process.exit(1);}
console.log('DOCTOR PASS');console.log('Node',process.version);console.log('API key set:',Boolean(process.env.YOUCAM_API_KEY));console.log('API base:',process.env.YOUCAM_API_BASE||'https://yce-api-01.makeupar.com');console.log('Public mode:',process.env.BESTFIT_PUBLIC_MODE||'judge');
