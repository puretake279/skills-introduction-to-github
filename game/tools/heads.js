// node hgrid.js game.html out.png heads(comma) [scale] [frame]
const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
(async()=>{ const [,,html,out,heads,sc='4',fr='7']=process.argv; const b=await chromium.launch(); const p=await b.newPage();
 p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('file://'+path.resolve(html)); await p.waitForTimeout(2500);
 const data=await p.evaluate(({heads,S,fr})=>{ const L=heads.split(','), ids=CHAR_IDS, CW=44, CH=40, FW=96, FH=88;
  const c=document.createElement('canvas'); c.width=L.length*CW*S+60; c.height=ids.length*CH*S+20; const x=c.getContext('2d'); x.imageSmoothingEnabled=false;
  x.fillStyle='#4a5468'; x.fillRect(0,0,c.width,c.height); x.fillStyle='#fff'; x.font='12px sans-serif'; L.forEach((h,i)=>x.fillText(h,60+i*CW*S,14));
  ids.forEach((cid,j)=>{ L.forEach((h,i)=>{ const sh=GFX.composeChar(cid,{head:h,body:'b_std',legs:'l_std',acc:'a_none'});
    const t=document.createElement('canvas'); t.width=FW; t.height=FH; GFX.drawChar(t.getContext('2d'),sh,fr,40,76,1,GFX.buildGun(CHARS[cid].w0),0,false);
    x.drawImage(t,18,6,CW,CH,60+i*CW*S,20+j*CH*S,CW*S,CH*S); }); });
  return c.toDataURL(); },{heads,S:+sc,fr:+fr});
 fs.writeFileSync(out,Buffer.from(data.split(',')[1],'base64')); await b.close(); })();
