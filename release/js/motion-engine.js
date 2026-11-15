/* Original artistic geometry. These motion studies are not fluid/plasma simulations. */
(() => {
  'use strict';
  const DEFAULTS=Object.freeze({mode:'fluid',pace:40,energy:44,cohesion:76,seed:3});
  const finite=(n,fallback)=>Number.isFinite(Number(n))?Number(n):fallback;
  const clamp=n=>Math.max(0,Math.min(100,n));
  function normalize(input={}){return {mode:input.mode==='plasma'?'plasma':'fluid',pace:clamp(finite(input.pace,DEFAULTS.pace)),energy:clamp(finite(input.energy,DEFAULTS.energy)),cohesion:clamp(finite(input.cohesion,DEFAULTS.cohesion)),seed:Math.floor(finite(input.seed,DEFAULTS.seed))>>>0};}
  function describe(input={}){const p=normalize(input),bpm=Math.round(52+p.pace*.7);return {parameters:p,bpm,loopSeconds:8*60/bpm,material:p.mode==='fluid'?'Fluid ribbon':'Plasma filaments'};}
  function geometry(input={},seconds=0,options={}){
    const p=normalize(input),d=describe(p),phase=finite(seconds,0)/d.loopSeconds*Math.PI*2;
    const count=Math.max(3,Math.min(80,Math.round(finite(options.lines,42)))),samples=Math.max(12,Math.min(240,Math.round(finite(options.samples,112))));
    const en=p.energy/100,rough=(100-p.cohesion)/100,variation=(p.seed%29)*.13;
    const yaw=.35+.46*Math.sin(phase),pitch=.18+.16*Math.cos(phase),roll=.1*Math.sin(phase*2);
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cx=Math.cos(pitch),sx=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll);
    const lines=[];
    for(let i=0;i<count;i++){
      const v=-1+2*i/(count-1),points=[];
      for(let j=0;j<=samples;j++){
        const u=j/samples*Math.PI*2,ripple=rough*.065*Math.sin(8*u+3*phase+v*3+variation);
        let x,y,z;
        if(p.mode==='fluid'){
          x=.39*Math.sin(2*u+.26*Math.sin(phase)+variation*.15)+v*.15*Math.cos(u)+ripple;
          y=.74*Math.cos(u)+v*.085*Math.sin(u)+en*.1*Math.sin(phase)*Math.sin(u);
          z=.32*Math.sin(u)+v*.18*Math.cos(2*u+phase)+ripple*.4;
          x*=.88+en*.36;
        }else{
          const radius=.5+.12*Math.cos(3*u+phase+variation*.25)+v*.045;
          x=radius*Math.cos(2*u)+ripple;
          y=radius*.88*Math.sin(2*u)+en*.12*Math.sin(u+phase);
          z=.3*Math.sin(3*u-phase)+v*.115+rough*.045*Math.sin(11*u+phase*2+v*2);
        }
        const x1=x*cy+z*sy,z1=-x*sy+z*cy,y1=y*cx-z1*sx,z2=y*sx+z1*cx;
        const x2=x1*cr-y1*sr,y2=x1*sr+y1*cr,perspective=2.9/(2.9-z2);
        points.push({x:x2*perspective,y:y2*perspective,z:z2});
      }
      lines.push(points);
    }
    return {lines,description:d};
  }
  function refine(input={},direction){const p=normalize(input);if(direction==='flow'){p.cohesion=Math.min(100,p.cohesion+16);p.energy=Math.max(0,p.energy-8);}if(direction==='lift'){p.energy=Math.min(100,p.energy+18);p.pace=Math.min(100,p.pace+8);}if(direction==='calm'){p.energy=Math.max(0,p.energy-18);p.pace=Math.max(0,p.pace-14);}return p;}
  globalThis.DancingThoughtEngine=Object.freeze({DEFAULTS,normalize,describe,geometry,refine});
})();
