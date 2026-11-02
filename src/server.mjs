import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {URL} from 'node:url';
import {loadEnv} from './env.mjs';
import {dataUrlToBuffer,sha256Buffer} from './utils.mjs';
import {uploadBuffer,downloadBuffer,runClothes,runRetakePreprocess,runRetake} from './youcam.mjs';
loadEnv();

const ROOT=path.resolve('.');
const PUBLIC=path.join(ROOT,'public');
const PORT=Number(process.env.PORT||4173);
const MAX_BODY=4.2*1024*1024; // below Vercel's 4.5 MB request limit
const MODE=process.env.BESTFIT_PUBLIC_MODE||'judge';

function sendText(res,status,body){res.writeHead(status,{'Content-Type':'text/plain; charset=utf-8'});res.end(body);}
function json(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj));}
function ctype(p){if(p.endsWith('.html'))return'text/html; charset=utf-8';if(p.endsWith('.js'))return'text/javascript; charset=utf-8';if(p.endsWith('.css'))return'text/css; charset=utf-8';if(p.endsWith('.jpg')||p.endsWith('.jpeg'))return'image/jpeg';if(p.endsWith('.png'))return'image/png';return'application/octet-stream';}
async function readBody(req){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY)throw new Error('Request body exceeds Vercel-safe 4.2 MB limit');chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}
function demoHash(name){return sha256Buffer(fs.readFileSync(path.join(PUBLIC,name)));}
const DEMO={source:demoHash('demo-source.jpg'),garment:demoHash('demo-garment.jpg'),selfie:demoHash('demo-selfie.jpg')};
function enforceJudge(kind,hash){if(MODE==='judge'&&hash!==DEMO[kind])throw new Error('Public deployment is protected: click “Load Judge Demo” to run paid YouCam generation. Custom uploads are available when running the repository locally.');}
function validSession(s){return s&&typeof s.clothesUrl==='string'&&/^https:\/\//.test(s.clothesUrl)&&typeof s.clothesOutputFileId==='string'&&s.clothesOutputFileId.length>10;}

const server=http.createServer(async(req,res)=>{try{
  const u=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(req.method==='GET'&&u.pathname==='/api/health')return json(res,200,{ok:true,product:'BESTFIT',node:process.version,mode:MODE,platform:process.env.VERCEL?'vercel':'local'});

  if(req.method==='POST'&&u.pathname==='/api/clothes'){
    const b=await readBody(req);
    const source=dataUrlToBuffer(b.sourcePose),garment=dataUrlToBuffer(b.garment),category=b.garmentCategory||'auto';
    const sourceSha256=sha256Buffer(source.buffer),garmentSha256=sha256Buffer(garment.buffer);
    enforceJudge('source',sourceSha256);enforceJudge('garment',garmentSha256);

    const sourceUpload=await uploadBuffer(source.buffer,source.mime,'SOURCE_POSE.jpg');
    const garmentUpload=await uploadBuffer(garment.buffer,garment.mime,'GARMENT.jpg');
    const clothes=await runClothes({srcFileId:sourceUpload.fileId,refFileId:garmentUpload.fileId,garmentCategory:category,onStatus:s=>console.log(`[BESTFIT] clothes ${s}`)});
    const clothesBytes=await downloadBuffer(clothes.url);
    const clothesOutputUpload=await uploadBuffer(clothesBytes.buffer,clothesBytes.mime,'CLOTHES_VTO.jpg');

    return json(res,200,{ok:true,clothesUrl:clothes.url,session:{clothesUrl:clothes.url,clothesOutputFileId:clothesOutputUpload.fileId},proof:{sourceSha256,garmentSha256,clothesTaskId:clothes.taskId}});
  }

  if(req.method==='POST'&&u.pathname==='/api/retake'){
    const b=await readBody(req);
    if(!validSession(b.session))return json(res,400,{ok:false,error:'Invalid or expired BESTFIT session. Generate the outfit again.'});
    const selfie=dataUrlToBuffer(b.favoriteSelfie),favoriteSelfieSha256=sha256Buffer(selfie.buffer);
    enforceJudge('selfie',favoriteSelfieSha256);
    const favoriteSelfieUpload=await uploadBuffer(selfie.buffer,selfie.mime,'FAVORITE_SELFIE.jpg');
    const pre=await runRetakePreprocess({srcFileId:b.session.clothesOutputFileId,onStatus:s=>console.log(`[BESTFIT] preprocess ${s}`)});
    const r=await runRetake({srcFileUrl:b.session.clothesUrl,refFileId:favoriteSelfieUpload.fileId,onStatus:s=>console.log(`[BESTFIT] retake ${s}`)});
    return json(res,200,{ok:true,finalUrl:r.url,proof:{favoriteSelfieSha256,preprocessTaskId:pre.taskId,detectedFaces:pre.faces.length,retakeTaskId:r.taskId}});
  }

  if(req.method==='GET'){
    const rel=u.pathname==='/'?'index.html':u.pathname.slice(1),p=path.resolve(PUBLIC,rel);
    if(!p.startsWith(PUBLIC)||!fs.existsSync(p)||!fs.statSync(p).isFile())return sendText(res,404,'Not found');
    res.writeHead(200,{'Content-Type':ctype(p),'Cache-Control':p.endsWith('.html')?'no-store':'public, max-age=3600'});
    return fs.createReadStream(p).pipe(res);
  }
  return json(res,404,{ok:false,error:'Not found'});
}catch(e){console.error(e);return json(res,500,{ok:false,error:e.message,provider:e.body||undefined});}});

server.listen(PORT,()=>console.log(`BESTFIT v0.5 at http://127.0.0.1:${PORT} | mode=${MODE}`));
