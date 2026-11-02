import fs from 'node:fs';
import path from 'node:path';
export function loadEnv(file='.env'){
 const p=path.resolve(file); if(!fs.existsSync(p)) return {};
 for(const raw of fs.readFileSync(p,'utf8').split(/\r?\n/)){
  const line=raw.trim(); if(!line||line.startsWith('#')) continue;
  const i=line.indexOf('='); if(i<0) continue;
  const k=line.slice(0,i).trim(); let v=line.slice(i+1).trim();
  if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1);
  if(process.env[k]===undefined) process.env[k]=v;
 }
}
export function requireEnv(name){const v=process.env[name]; if(!v) throw new Error(`Missing ${name} in .env`); return v;}
