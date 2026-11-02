import crypto from 'node:crypto';

export function sha256Buffer(buf){
  const h=crypto.createHash('sha256');
  h.update(buf);
  return h.digest('hex');
}

export function dataUrlToBuffer(dataUrl){
  const m=/^data:(image\/(?:jpeg|png));base64,(.+)$/s.exec(dataUrl||'');
  if(!m) throw new Error('Expected JPEG/PNG data URL');
  const mime=m[1];
  const buffer=Buffer.from(m[2],'base64');
  if(buffer.length>3*1024*1024) throw new Error('Image exceeds 3 MB after browser normalization');
  return {mime,buffer,bytes:buffer.length};
}
