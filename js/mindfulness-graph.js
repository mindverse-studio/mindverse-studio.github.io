/* Animated conceptual Mind graph. No sensors, inference, or external services. */
(() => {
  'use strict';
  const views=[...document.querySelectorAll('[data-mindfulness-visual]')];
  if(!views.length)return;
  const journey=document.getElementById('journey'),galleryToggle=journey?.querySelector('.motion-toggle');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let suspended=false,pausedLocally=false;
  const states=[];
  for(const view of views){
    const svg=view.querySelector('svg'),panel=view.closest('.world-panel'),button=view.querySelector('.mindfulness-toggle');
    const packets=[...svg.querySelectorAll('[data-flow-packet]')].map(node=>({node,x1:Number(node.dataset.x1),y1:Number(node.dataset.y1),x2:Number(node.dataset.x2),y2:Number(node.dataset.y2),phase:Number(node.dataset.phase)}));
    const halos=[...svg.querySelectorAll('[data-node-halo]')],target=svg.querySelector('[data-ego-target]'),targetHalo=svg.querySelector('[data-ego-target-halo]'),pointer=svg.querySelector('[data-ego-pointer]'),nib=svg.querySelector('[data-ego-nib]'),history=svg.querySelector('[data-history-trace]'),mind=svg.querySelector('[data-mind-halo]'),traces=[...svg.querySelectorAll('[data-time-trace]')];
    const state={visible:false,frame:0,last:0,lastDraw:0,seconds:0,count:0};
    const historyY=t=>870+8*Math.sin(t*.7)+5*Math.sin(t*1.1)+4*Math.sin(t*.37)+3*Math.sin(t*1.6);
    function draw(){
      const t=state.seconds;
      for(const p of packets){
        const q=(t*(p.node.dataset.flowPacket==='ring'?.12:.19)+p.phase)%1;
        p.node.setAttribute('cx',(p.x1+(p.x2-p.x1)*q).toFixed(2));p.node.setAttribute('cy',(p.y1+(p.y2-p.y1)*q).toFixed(2));
        p.node.setAttribute('fill-opacity',(.35+.6*Math.sin(Math.PI*q)).toFixed(3));
      }
      halos.forEach((node,i)=>{const pulse=.5+.5*Math.sin(t*1.8-i*1.25);node.setAttribute('r',(26+pulse*9).toFixed(2));node.setAttribute('stroke-opacity',(.12+pulse*.36).toFixed(3));});
      const x=500,y=historyY(t);
      for(const node of [target,targetHalo]){node.setAttribute('cx',x.toFixed(2));node.setAttribute('cy',y.toFixed(2));}
      pointer.setAttribute('d',`M500 710 L${x.toFixed(2)} ${y.toFixed(2)}`);
      nib.setAttribute('d',`M492 ${(y-18).toFixed(2)} L500 ${y.toFixed(2)} L508 ${(y-18).toFixed(2)} Z`);
      let trace='';for(let i=0;i<=80;i++){const px=235+i*265/80,py=historyY(t-(500-px)/22);trace+=(i?' L':'M')+px.toFixed(2)+' '+py.toFixed(2);}history.setAttribute('d',trace);
      mind.setAttribute('r',(89+4*Math.sin(t*1.4)).toFixed(2));
      traces.forEach((node,i)=>{const px=235+265*((i/7-t*.04+100)%1);node.setAttribute('cx',px.toFixed(2));node.setAttribute('cy',historyY(t-(500-px)/22).toFixed(2));});
      view.dataset.frame=String(++state.count);
    }
    function allowed(){
      const active=!panel||!journey.classList.contains('is-enhanced')||panel.classList.contains('is-active');
      return !suspended&&state.visible&&!document.hidden&&!reduced.matches&&!pausedLocally&&journey?.dataset.motion!=='paused'&&active;
    }
    function tick(now){
      state.frame=0;if(!allowed()){state.last=0;return;}
      if(state.last)state.seconds+=Math.min(.1,(now-state.last)/1000);state.last=now;
      if(now-state.lastDraw>=1000/30){draw();state.lastDraw=now;}
      state.frame=requestAnimationFrame(tick);
    }
    function sync(){
      const playing=allowed(),paused=pausedLocally||journey?.dataset.motion==='paused'||reduced.matches;
      view.dataset.playing=String(playing);button.textContent=paused?'Resume signals':'Pause signals';button.setAttribute('aria-pressed',String(paused));button.disabled=reduced.matches;
      if(playing&&!state.frame){state.last=0;state.frame=requestAnimationFrame(tick);}
      else if(!playing){cancelAnimationFrame(state.frame);state.frame=0;state.last=0;}
    }
    draw();
    button.addEventListener('click',()=>{if(galleryToggle)galleryToggle.click();else{pausedLocally=!pausedLocally;syncAll();}});
    new IntersectionObserver(entries=>{state.visible=entries[0].isIntersecting;sync();},{threshold:.05}).observe(view);
    states.push({sync});
  }
  const syncAll=()=>states.forEach(s=>s.sync());
  if(journey)new MutationObserver(syncAll).observe(journey,{attributes:true,subtree:true,attributeFilter:['class','data-motion']});
  reduced.addEventListener('change',syncAll);document.addEventListener('visibilitychange',syncAll);
  window.addEventListener('pagehide',()=>{suspended=true;syncAll();});window.addEventListener('pageshow',()=>{suspended=false;syncAll();});
  syncAll();
})();
