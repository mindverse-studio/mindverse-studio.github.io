/* Silent home gallery art. Original score patterns and artistic motion geometry. */
(() => {
  'use strict';
  const journey=document.querySelector('.studio-journey');
  if(!journey)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const score=globalThis.MindverseMusicEngine?.createSketch({preset:'flow',seed:12,density:48});
  const engine=globalThis.DancingThoughtEngine;
  const studies=[];
  let suspended=false;

  function music(ctx,w,h,t){
    const left=w*.09,right=w*.91,top=h*.27,step=h*.035;
    const beat=(t*.62)%16,playX=left+(right-left)*beat/16;
    ctx.lineWidth=.8;
    for(let i=0;i<5;i++){
      ctx.strokeStyle='rgba(187,173,230,.19)';ctx.beginPath();ctx.moveTo(left,top+i*step);ctx.lineTo(right,top+i*step);ctx.stroke();
    }
    for(let i=0;i<=4;i++){
      const x=left+(right-left)*i/4;
      ctx.strokeStyle='rgba(187,173,230,.15)';ctx.beginPath();ctx.moveTo(x,top-step);ctx.lineTo(x,top+5*step);ctx.stroke();
    }
    const sweep=ctx.createLinearGradient(playX-w*.1,0,playX,0);
    sweep.addColorStop(0,'rgba(180,163,240,0)');sweep.addColorStop(1,'rgba(180,163,240,.1)');ctx.fillStyle=sweep;ctx.fillRect(Math.max(left,playX-w*.1),top-step,Math.min(w*.1,playX-left),step*6);
    ctx.strokeStyle='rgba(214,202,255,.65)';ctx.beginPath();ctx.moveTo(playX,top-step);ctx.lineTo(playX,top+step*5);ctx.stroke();
    for(const note of score.notes){
      const degree=(Math.floor(note.pitch/12)-5)*7+[0,0,1,1,2,3,3,4,4,5,5,6][note.pitch%12];
      const x=left+(right-left)*note.beat/16,y=top+4*step-(degree-2)*step/2;
      const distance=Math.min(Math.abs(beat-note.beat),16-Math.abs(beat-note.beat));
      const glow=Math.max(0,1-distance/1.1);
      if(degree===0){ctx.strokeStyle='rgba(187,173,230,.4)';ctx.beginPath();ctx.moveTo(x-w*.023,y);ctx.lineTo(x+w*.023,y);ctx.stroke();}
      ctx.shadowBlur=glow*16;ctx.shadowColor='#c9b4ff';ctx.fillStyle=`rgba(${Math.round(183+glow*50)},${Math.round(168+glow*55)},245,${.65+glow*.35})`;
      ctx.beginPath();ctx.ellipse(x,y,w*.013,w*.009,-.3,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(195,181,235,.65)';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(x+w*.011,y);ctx.lineTo(x+w*.011,y-h*.065);ctx.stroke();
    }
    ctx.shadowBlur=0;
    // Layered harmonic contours carry the musical phrase into a moving texture.
    for(let line=0;line<19;line++){
      ctx.beginPath();
      for(let i=0;i<=110;i++){
        const u=i/110,x=left+(right-left)*u;
        const envelope=Math.sin(Math.PI*u);
        const y=h*.65+(line-9)*h*.006+envelope*h*.09*Math.sin(u*Math.PI*3.2-t*.75+line*.12)+Math.sin(u*13+t*.5)*h*.012;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      ctx.strokeStyle=`hsla(${250+line*1.5},65%,76%,${line%5===0?.42:.16})`;ctx.lineWidth=line%5===0?1.25:.75;ctx.stroke();
    }
    for(let i=0;i<33;i++){
      const x=w*.24+i*w*.016,height=h*(.013+.045*(.5+.5*Math.sin(t*1.7+i*.65))*(.5+.5*Math.sin(i*.4+t)));
      ctx.fillStyle=`rgba(172,216,219,${.24+.3*(.5+.5*Math.sin(i*.4+t))})`;ctx.fillRect(x,h*.83-height/2,Math.max(1,w*.003),height);
    }
  }

  function dance(ctx,w,h,t,mode){
    const plasma=mode==='plasma';
    const data=engine.geometry({mode,pace:48,energy:62,cohesion:plasma?57:84,seed:3},t,{lines:w<400?32:44,samples:w<400?78:104});
    const scale=Math.min(w,h)*.49;
    const project=q=>[w*.5+q.x*scale,h*.44+q.y*scale];
    ctx.globalCompositeOperation='lighter';
    data.lines.forEach((line,i)=>{
      const hue=plasma?280+i*1.7:167+i*1.05;
      ctx.beginPath();line.forEach((p,j)=>{const [x,y]=project(p);j?ctx.lineTo(x,y):ctx.moveTo(x,y);});
      ctx.strokeStyle=`hsla(${hue},${plasma?85:64}%,76%,${i%8===0?.78:.34})`;ctx.lineWidth=i%8===0?1.3:.75;
      ctx.shadowColor=`hsla(${hue},85%,65%,.5)`;ctx.shadowBlur=i%8===0?7:0;ctx.stroke();
      if(i>0&&!plasma){
        ctx.beginPath();line.forEach((p,j)=>{const [x,y]=project(p);j?ctx.lineTo(x,y):ctx.moveTo(x,y);});
        for(const p of [...data.lines[i-1]].reverse()){const [x,y]=project(p);ctx.lineTo(x,y);}
        ctx.closePath();ctx.fillStyle=`hsla(${hue},65%,70%,.027)`;ctx.fill();
      }
    });
    ctx.shadowBlur=0;ctx.globalCompositeOperation='source-over';
  }

  for(const canvas of journey.querySelectorAll('[data-home-canvas]')){
    const kind=canvas.dataset.homeCanvas;
    if((kind==='music'&&!score)||(kind==='dance'&&!engine))continue;
    const ctx=canvas.getContext('2d');if(!ctx)continue;
    const panel=canvas.closest('.world-panel'),figure=canvas.closest('figure'),art=canvas.parentElement;
    const state={canvas,ctx,panel,art,kind,mode:'fluid',visible:false,seconds:0,last:0,lastDraw:0,frame:0,count:0,width:1,height:1,ratio:1};
    function draw(){
      const {width:w,height:h,ratio}=state;
      ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
      const halo=ctx.createRadialGradient(w*.5,h*.47,0,w*.5,h*.47,Math.min(w,h)*.53);
      halo.addColorStop(0,kind==='music'?'#44315c40':state.mode==='fluid'?'#16433e50':'#53295545');halo.addColorStop(1,'#080b1000');ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
      if(kind==='music')music(ctx,w,h,state.seconds);else dance(ctx,w,h,state.seconds,state.mode);
      canvas.dataset.frame=String(++state.count);
    }
    function allowed(){return !suspended&&state.visible&&!document.hidden&&!reduced.matches&&journey.dataset.motion==='playing'&&journey.classList.contains('is-enhanced')&&panel.classList.contains('is-active');}
    function tick(now){
      state.frame=0;if(!allowed()){state.last=0;return;}
      if(state.last)state.seconds+=Math.min(.1,(now-state.last)/1000);state.last=now;
      if(now-state.lastDraw>=1000/30){draw();state.lastDraw=now;}
      state.frame=requestAnimationFrame(tick);
    }
    function sync(){
      const playing=allowed();art.dataset.playing=String(playing);
      if(playing&&!state.frame){state.last=0;state.frame=requestAnimationFrame(tick);}
      else if(!playing){cancelAnimationFrame(state.frame);state.frame=0;state.last=0;}
    }
    function fit(){
      const box=canvas.getBoundingClientRect();state.width=Math.max(1,box.width);state.height=Math.max(1,box.height);state.ratio=Math.min(devicePixelRatio||1,1.5);
      canvas.width=Math.round(state.width*state.ratio);canvas.height=Math.round(state.height*state.ratio);draw();
    }
    canvas.hidden=false;figure.classList.add('has-live-art');figure.querySelector('img').setAttribute('aria-hidden','true');
    new ResizeObserver(fit).observe(canvas);fit();
    new IntersectionObserver(entries=>{state.visible=entries[0].isIntersecting;sync();},{threshold:.05}).observe(canvas);
    for(const button of art.querySelectorAll('[data-home-material]'))button.addEventListener('click',()=>{
      state.mode=button.dataset.homeMaterial;
      art.querySelectorAll('[data-home-material]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      canvas.setAttribute('aria-label',state.mode==='fluid'?'An artistic dancing fluid ribbon':'An artistic dancing plasma filament study');draw();
    });
    studies.push({sync});
  }
  const syncAll=()=>studies.forEach(s=>s.sync());
  new MutationObserver(syncAll).observe(journey,{attributes:true,subtree:true,attributeFilter:['class','data-motion']});
  reduced.addEventListener('change',syncAll);document.addEventListener('visibilitychange',syncAll);
  window.addEventListener('pagehide',()=>{suspended=true;syncAll();});
  window.addEventListener('pageshow',()=>{suspended=false;syncAll();});
  syncAll();
})();
