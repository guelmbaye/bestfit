import {requireEnv} from './env.mjs';
const BASE=()=>process.env.YOUCAM_API_BASE||'https://yce-api-01.makeupar.com';
const POLL_MS=()=>Number(process.env.YOUCAM_POLL_MS||3000);
const TIMEOUT_MS=()=>Number(process.env.YOUCAM_TIMEOUT_MS||240000);
function auth(extra={}){return {Authorization:`Bearer ${requireEnv('YOUCAM_API_KEY')}`,...extra};}
async function parse(res){
  const text=await res.text();let body;
  try{body=text?JSON.parse(text):null}catch{body={raw:text}}
  if(!res.ok){const e=new Error(`YouCam HTTP ${res.status}: ${text.slice(0,1200)}`);e.status=res.status;e.body=body;throw e;}
  return body;
}
export async function apiJson(method,endpoint,body){
  const res=await fetch(BASE()+endpoint,{method,headers:auth(body!==undefined?{'Content-Type':'application/json'}:{}),body:body!==undefined?JSON.stringify(body):undefined});
  return parse(res);
}
export async function uploadBuffer(buffer,mime='image/jpeg',fileName='image.jpg'){
  const created=await apiJson('POST','/s2s/v2.0/file',{files:[{content_type:mime,file_name:fileName,file_size:buffer.length}]});
  const f=created?.data?.files?.[0],req=f?.requests?.[0];
  if(!f?.file_id||!req?.url) throw new Error('Unexpected File API response');
  const headers={};for(const [k,v] of Object.entries(req.headers||{}))headers[k]=String(v);
  const put=await fetch(req.url,{method:req.method||'PUT',headers,body:buffer});
  if(!put.ok) throw new Error(`Signed upload failed HTTP ${put.status}: ${await put.text()}`);
  return {fileId:f.file_id};
}
export async function downloadBuffer(url){
  const r=await fetch(url);
  if(!r.ok) throw new Error(`Download failed HTTP ${r.status}`);
  return {buffer:Buffer.from(await r.arrayBuffer()),mime:r.headers.get('content-type')||'image/jpeg'};
}
export async function pollPath(pathBuilder,taskId,onStatus=()=>{}){
  const started=Date.now();
  while(Date.now()-started<TIMEOUT_MS()){
    const body=await apiJson('GET',pathBuilder(taskId));
    const status=String(body?.data?.task_status||'').toLowerCase();onStatus(status||'unknown');
    if(status==='success')return body;
    if(['error','failed','failure'].includes(status)){
      const code=body?.data?.error||'unknown',msg=body?.data?.error_message||'';
      throw new Error(`${code}${msg?`: ${msg}`:''}`);
    }
    await new Promise(r=>setTimeout(r,POLL_MS()));
  }
  throw new Error('YouCam task timed out');
}
export function resultUrl(body){return body?.data?.results?.url||null;}
export async function runClothes({srcFileId,refFileId,garmentCategory='auto',onStatus}){
  const ep='/s2s/v2.0/task/cloth-v4';
  const created=await apiJson('POST',ep,{src_file_id:srcFileId,ref_file_id:refFileId,garment_category:garmentCategory,filter_multi_person:'strict'});
  const taskId=created?.data?.task_id;if(!taskId)throw new Error('Clothes returned no task_id');
  const final=await pollPath(id=>`${ep}/${encodeURIComponent(id)}`,taskId,onStatus);
  const url=resultUrl(final);if(!url)throw new Error('Clothes returned no result URL');
  return {taskId,url,final};
}
export async function runRetakePreprocess({srcFileId,onStatus}){
  const ep='/s2s/v2.0/task/retake/pre-process';
  const created=await apiJson('POST',ep,{src_file_id:srcFileId});
  const taskId=created?.data?.task_id;if(!taskId)throw new Error('Retake preprocess returned no task_id');
  const final=await pollPath(id=>`${ep}/${encodeURIComponent(id)}`,taskId,onStatus);
  const faces=final?.data?.results?.faces||[];
  if(faces.length!==1)throw new Error(`BESTFIT requires exactly 1 detected source face; got ${faces.length}`);
  return {taskId,faces,final};
}
export async function runRetake({srcFileUrl,refFileId,onStatus}){
  const ep='/s2s/v2.0/task/retake';
  const created=await apiJson('POST',ep,{src_file_url:srcFileUrl,ref_file_ids:[refFileId],face_mapping:[{index:0,position:0}]});
  const taskId=created?.data?.task_id;if(!taskId)throw new Error('Retake returned no task_id');
  const final=await pollPath(id=>`${ep}/${encodeURIComponent(id)}`,taskId,onStatus);
  const url=resultUrl(final);if(!url)throw new Error('Retake returned no result URL');
  return {taskId,url,final};
}
