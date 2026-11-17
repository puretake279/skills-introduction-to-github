// node fgrid.js html out sets(body:legs,...) frame scale
const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
(async()=>{ const [,,html,out,sets,fr='7',sc='4']=process.argv; const b=await chromium.launch(); const p=await b.newPage({locale:'ja-JP'}); p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('file://'+path.resolve(html)); await p.waitForTimeout(2500);
 const u=await p.evaluate(({sets,fr,S})=>{ const L=sets.split(','), ids=CHAR_IDS, FW=96, FH=88, CW=70;
  const c=document.createElement('canvas'); c.width=L.length*CW*S; c.height=ids.length*FH*S; const x=c.getContext('2d'); x.imageSmoothingEnabled=false; x.fillStyle='#4a5468'; x.fillRect(0,0,c.width,c.height);
  ids.forEach((cid,j)=>L.forEach((st,i)=>{ const [bd,lg,hd]=st.split(':'); const sh=GFX.composeChar(cid,{head:hd||'h_none',body:bd,legs:lg||'l_std',acc:'a_none'}); const t=document.createElement('canvas'); t.width=FW; t.height=FH;
    GFX.drawChar(t.getContext('2d'),sh,fr,36,76,1,GFX.buildGun(CHARS[cid].w0),0,false); x.drawImage(t,4,0,CW,FH,i*CW*S,j*FH*S,CW*S,FH*S); }));
  return c.toDataURL(); },{sets,fr:+fr,S:+sc}); fs.writeFileSync(out,Buffer.from(u.split(',')[1],'base64')); await b.close(); })();
