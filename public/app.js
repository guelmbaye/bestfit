const $=s=>document.querySelector(s);
const files={source:null,garment:null,selfie:null};
let session=null;let proof={};

function readDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});}
async function imageDataForUpload(file){
  // Keep small validated demo assets byte-identical so Judge Mode can be protected by hash.
  if(file.size<=800000)return readDataUrl(file);
  try{
    const bmp=await createImageBitmap(file);const maxSide=1400,scale=Math.min(1,maxSide/Math.max(bmp.width,bmp.height));
    const canvas=document.createElement('canvas');canvas.width=Math.round(bmp.width*scale);canvas.height=Math.round(bmp.height*scale);
    canvas.getContext('2d').drawImage(bmp,0,0,canvas.width,canvas.height);bmp.close?.();
    return canvas.toDataURL('image/jpeg',.86);
  }catch{return readDataUrl(file)}
}
function previewFile(file,preview,input,key){files[key]=file;preview.src=URL.createObjectURL(file);input.closest('.upload-card').classList.add('has-image');}
function bindFile(input,preview,key){input.addEventListener('change',()=>{const f=input.files?.[0];if(!f)return;previewFile(f,preview,input,key);});}
function setStatus(msg){const el=$('#status');const span=el.querySelector('span');if(span)span.textContent=msg;else el.textContent=msg;}
function step(n){document.querySelectorAll('.step').forEach(el=>el.classList.toggle('active',Number(el.dataset.step)===n));}
async function post(url,body){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});let j={};try{j=await r.json()}catch{}if(!r.ok||!j.ok)throw new Error(j.error||`HTTP ${r.status}`);return j;}
async function urlToFile(url,name){const r=await fetch(url);if(!r.ok)throw new Error(`Could not load demo asset: ${name}`);const blob=await r.blob();return new File([blob],name,{type:blob.type||'image/jpeg'});}
function busy(btn,on){btn.classList.toggle('busy',on);btn.disabled=on;}

bindFile($('#sourceInput'),$('#sourcePreview'),'source');
bindFile($('#garmentInput'),$('#garmentPreview'),'garment');
bindFile($('#selfieInput'),$('#selfiePreview'),'selfie');

$('#judgeDemoBtn').addEventListener('click',async()=>{try{
  busy($('#judgeDemoBtn'),true);setStatus('Loading validated Judge Demo assets…');
  const [source,garment,selfie]=await Promise.all([urlToFile('/demo-source.jpg','SOURCE_POSE.jpg'),urlToFile('/demo-garment.jpg','GARMENT.jpg'),urlToFile('/demo-selfie.jpg','FAVORITE_SELFIE.jpg')]);
  previewFile(source,$('#sourcePreview'),$('#sourceInput'),'source');previewFile(garment,$('#garmentPreview'),$('#garmentInput'),'garment');previewFile(selfie,$('#selfiePreview'),$('#selfieInput'),'selfie');
  $('#category').value='upper_body';step(1);setStatus('Judge Demo loaded — your winning moment is ready.');$('#builder').scrollIntoView({behavior:'smooth',block:'start'});
}catch(e){setStatus('Error: '+e.message)}finally{busy($('#judgeDemoBtn'),false)}});

$('#resetBtn').addEventListener('click',()=>location.reload());

$('#clothesBtn').addEventListener('click',async()=>{const btn=$('#clothesBtn');try{
  if(!files.source||!files.garment)throw new Error('Choose Best pose and Garment first.');
  busy(btn,true);setStatus('Preparing pose + garment…');step(2);
  const [sourcePose,garment]=await Promise.all([imageDataForUpload(files.source),imageDataForUpload(files.garment)]);
  setStatus('YouCam Clothes is generating the outfit try-on…');
  const r=await post('/api/clothes',{sourcePose,garment,garmentCategory:$('#category').value});
  session=r.session;proof={...r.proof};
  $('#sourceResult').src=URL.createObjectURL(files.source);$('#clothesResult').src=r.clothesUrl;
  $('#finalResult').removeAttribute('src');$('#finalResult').classList.add('hidden');$('#finalPlaceholder').classList.remove('hidden');$('#finalCaption').innerHTML='<strong>Waiting for preferred expression…</strong>';
  $('#proof').classList.remove('ready');$('#proof').classList.add('proof-pending');$('#proofPending').classList.remove('hidden');$('#proofText').classList.add('hidden');
  $('#results').classList.remove('hidden');$('#retakeBtn').disabled=false;setStatus('Outfit ready. Now keep the expression you actually prefer.');step(3);$('#results').scrollIntoView({behavior:'smooth',block:'center'});
}catch(e){setStatus('Error: '+e.message)}finally{busy(btn,false)}});

$('#retakeBtn').addEventListener('click',async()=>{const btn=$('#retakeBtn');try{
  if(!session)throw new Error('Generate the outfit first.');if(!files.selfie)throw new Error('Choose Favorite expression first.');
  busy(btn,true);const favoriteSelfie=await imageDataForUpload(files.selfie);setStatus('YouCam Retake is restoring the preferred expression…');
  const r=await post('/api/retake',{favoriteSelfie,session});proof={...proof,...r.proof};
  $('#finalResult').src=r.finalUrl;$('#finalResult').classList.remove('hidden');$('#finalPlaceholder').classList.add('hidden');$('#finalCaption').innerHTML='<strong>Preferred expression restored.</strong>';
  $('#proofText').textContent=JSON.stringify(proof,null,2);$('#proofText').classList.remove('hidden');$('#proofPending').classList.add('hidden');$('#proof').classList.remove('proof-pending');$('#proof').classList.add('ready');
  setStatus('BESTFIT complete — same pose, same outfit, better expression.');step(4);$('#results').scrollIntoView({behavior:'smooth',block:'center'});
}catch(e){setStatus('Error: '+e.message);btn.disabled=false}finally{btn.classList.remove('busy')}});

fetch('/api/health').then(r=>r.json()).then(h=>{if(h.mode==='judge')document.body.dataset.publicMode='judge';}).catch(()=>{});
