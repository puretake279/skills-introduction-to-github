const { chromium } = require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto('file://'+path.resolve(process.argv[2])); await p.waitForTimeout(3000);
 const r=await p.evaluate(()=>{ let n=0,fail=[]; const t0=performance.now();
  for(const cid of CHAR_IDS) for(const k of Object.keys(ARMOR).filter(k=>ARMOR[k].slot==='body')){ if(ARMOR[k].only&&ARMOR[k].only!==cid) continue;
    try{ GFX.composeChar(cid,{head:'h_tac',body:k,legs:'l_camo',acc:'a_cape'}); n++; }catch(e){ fail.push(cid+' '+k+' '+e.message); } }
  return {n,fail:fail.slice(0,5),ms:Math.round(performance.now()-t0)}; });
 console.log(JSON.stringify(r), errs.slice(0,5)); await b.close(); })();
