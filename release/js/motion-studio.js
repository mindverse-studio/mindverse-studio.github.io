(() => {
  'use strict';
  const engine=globalThis.DancingThoughtEngine;
  if(!engine)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  class StudyCanvas{
    constructor(canvas,parameters,active=false){
      this.canvas=canvas;this.ctx=canvas.getContext('2d');this.parameters=engine.normalize(parameters);this.active=active;this.visible=true;this.seconds=0;this.last=0;this.lastDraw=0;this.frame=0;
      if(!this.ctx){canvas.setAttribute('aria-label','Motion preview unavailable. The study illustration remains visible.');return;}
      this.resize=new ResizeObserver(()=>this.fit());this.resize.observe(canvas);this.fit();
      this.observer=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;if(this.visible)this.schedule();},{threshold:.02});this.observer.observe(canvas);this.schedule();
    }
    fit(){const r=this.canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,1.5);this.width=Math.max(1,r.width);this.height=Math.max(1,r.height);this.ratio=ratio;this.canvas.width=Math.round(this.width*ratio);this.canvas.height=Math.round(this.height*ratio);this.draw();}
    update(p){this.parameters=engine.normalize(p);this.draw();}
    setPlaying(value){this.active=value;this.last=0;if(value)this.schedule();else{cancelAnimationFrame(this.frame);this.frame=0;this.draw();}}
    schedule(){if(this.frame||!this.ctx||!this.active||(!this.visible&&!this.forceRecord)||document.hidden)return;this.frame=requestAnimationFrame(t=>this.tick(t));}
    tick(t){this.frame=0;if(!this.active||(!this.visible&&!this.forceRecord)||document.hidden){this.last=0;return;}if(this.last)this.seconds+=Math.min(.1,(t-this.last)/1000);this.last=t;if(t-this.lastDraw>=1000/30){this.draw();this.lastDraw=t;}this.schedule();}
    draw(){
      if(!this.ctx||!this.width)return;
      const ctx=this.ctx,w=this.width,h=this.height,p=this.parameters;
      ctx.setTransform(this.ratio,0,0,this.ratio,0,0);ctx.globalCompositeOperation='source-over';ctx.shadowBlur=0;ctx.fillStyle='#080c14';ctx.fillRect(0,0,w,h);
      const halo=ctx.createRadialGradient(w*.5,h*.46,0,w*.5,h*.46,Math.min(w,h)*.53);halo.addColorStop(0,p.mode==='fluid'?'#163c3c55':'#3b213c66');halo.addColorStop(1,'#080c1400');ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
      ctx.save();ctx.translate(w*.5,h*.86);ctx.scale(1,.15);const shadow=ctx.createRadialGradient(0,0,0,0,0,w*.24);shadow.addColorStop(0,'#a3bbd520');shadow.addColorStop(1,'#a3bbd500');ctx.fillStyle=shadow;ctx.beginPath();ctx.arc(0,0,w*.24,0,Math.PI*2);ctx.fill();ctx.restore();
      const data=engine.geometry(p,this.seconds,{lines:w<450?35:46,samples:w<450?88:116});
      const scale=Math.min(w*.72,h)*.49,project=q=>[w*.5+q.x*scale,h*.47+q.y*scale];
      ctx.globalCompositeOperation='lighter';
      data.lines.forEach((line,i)=>{
        const hue=p.mode==='fluid'?172+i*.96:292+i*1.65;
        const path=new Path2D();line.forEach((point,j)=>{const [x,y]=project(point);if(j===0)path.moveTo(x,y);else path.lineTo(x,y);});
        ctx.strokeStyle=`hsla(${hue},${p.mode==='fluid'?65:83}%,${p.mode==='fluid'?73:72}%,${i%9===0?.7:.26})`;ctx.lineWidth=i%9===0?1.05:.62;ctx.shadowColor=`hsla(${hue},80%,65%,.3)`;ctx.shadowBlur=i%9===0?5:0;ctx.stroke(path);
        if(i>0&&p.mode==='fluid'){
          const previous=data.lines[i-1],fill=new Path2D();line.forEach((q,j)=>{const [x,y]=project(q);j?fill.lineTo(x,y):fill.moveTo(x,y);});for(let j=previous.length-1;j>=0;j--){const [x,y]=project(previous[j]);fill.lineTo(x,y);}fill.closePath();ctx.fillStyle=`hsla(${hue},70%,68%,.024)`;ctx.fill(fill);
        }
      });
      ctx.globalCompositeOperation='source-over';ctx.shadowBlur=0;
    }
  }
  const hero=document.querySelector('[data-hero-canvas]');
  if(hero){const study=new StudyCanvas(hero,{...engine.DEFAULTS,energy:60},!reduced.matches);const pause=document.querySelector('[data-hero-pause]');const updateHero=()=>{pause.textContent=study.active?'Pause motion':'Play motion';pause.setAttribute('aria-pressed',String(study.active));pause.setAttribute('aria-label',study.active?'Pause ambient motion':'Play ambient motion');};pause?.addEventListener('click',()=>{study.setPlaying(!study.active);updateHero();});reduced.addEventListener('change',()=>{if(reduced.matches)study.setPlaying(false);updateHero();});document.addEventListener('visibilitychange',()=>{study.last=0;if(!document.hidden)study.schedule();});updateHero();}
  const studio=document.getElementById('motion-studio');
  if(!studio)return;
  const canvas=studio.querySelector('[data-studio-canvas]');const study=new StudyCanvas(canvas,engine.DEFAULTS,false);
  const fields=studio.querySelector('fieldset'),play=studio.querySelector('[data-motion-play]'),music=studio.querySelector('[data-music]'),record=studio.querySelector('[data-record]'),saveVideo=studio.querySelector('[data-save-video]'),status=studio.querySelector('[data-studio-status]');
  let p=engine.normalize(),revision=1,audio=null,source=null,master=null,destination=null,audioToken=0,musicEnabled=false,recorder=null,recording=false,recordTimer=0,progressTimer=0,recordStart=0,cancelRecord=false,videoUrl=null;
  const audioEngine=globalThis.MindverseMusicEngine;
  const clipPreview=studio.querySelector('[data-clip-preview]');
  function clearPreview(){clipPreview.pause();clipPreview.hidden=true;clipPreview.removeAttribute('src');clipPreview.load();}
  function updateUI(){
    const d=engine.describe(p);studio.querySelector('[data-material-name]').textContent=d.material;studio.querySelector('[data-version]').textContent=String(revision).padStart(2,'0');studio.querySelector('[data-bpm]').textContent=d.bpm+' BPM';
    studio.querySelector('[data-material-note]').textContent=p.mode==='fluid'?'Continuous ribbons / liquid-inspired geometry':'Braided filaments / plasma-inspired geometry';
    studio.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===p.mode)));
    ['pace','energy','cohesion'].forEach(k=>{studio.querySelector('#'+k).value=p[k];studio.querySelector('[data-value="'+k+'"]').textContent=Math.round(p[k]);});
    play.textContent=study.active?'Pause motion':'Play motion';play.setAttribute('aria-pressed',String(study.active));music.textContent=musicEnabled?'Music on':'Music off';music.setAttribute('aria-pressed',String(musicEnabled));studio.dataset.mode=p.mode;
  }
  function stopAudio(){audioToken++;if(source){source.onended=null;try{source.stop();}catch{}source.disconnect();source=null;}}
  async function startAudio(){
    const token=++audioToken;
    try{
      const Context=window.AudioContext||window.webkitAudioContext;if(!Context||!audioEngine)throw new Error('Audio unavailable');
      if(!audio){audio=new Context();master=audio.createGain();master.gain.value=Number(studio.querySelector('[data-volume]').value)/100;master.connect(audio.destination);destination=audio.createMediaStreamDestination();master.connect(destination);}
      await audio.resume();if(token!==audioToken||!musicEnabled)return;
      if(source){try{source.stop();}catch{}source.disconnect();}
      const sketch=audioEngine.createSketch({preset:p.mode==='fluid'?'still':'flow',energy:p.pace,brightness:p.mode==='fluid'?30:62,density:26+p.energy*.3,seed:p.seed+20});
      const rendered=audioEngine.renderPCM(sketch),length=Math.round(16*sketch.beatSeconds*22050),pcm=rendered.slice(0,length),fade=660;
      for(let i=0;i<fade;i++){pcm[i]*=i/fade;pcm[pcm.length-1-i]*=i/fade;}
      const buffer=audio.createBuffer(1,pcm.length,22050);buffer.copyToChannel(pcm,0);source=audio.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(master);source.start();study.seconds=0;study.last=0;
    }catch{musicEnabled=false;stopAudio();updateUI();status.textContent='Background music is unavailable in this browser. The visual study remains ready.';}
  }
  function setPlaying(value){study.setPlaying(value);if(!value){musicEnabled=false;stopAudio();}updateUI();}
  function update(next,message){if(recording)return;p=engine.normalize({...p,...next});revision++;study.update(p);if(musicEnabled)startAudio();updateUI();saveVideo.hidden=true;clearPreview();if(videoUrl){URL.revokeObjectURL(videoUrl);videoUrl=null;}status.textContent=message;}
  play.addEventListener('click',()=>{setPlaying(!study.active);status.textContent=study.active?'Motion playing. Manual controls shape this artistic preview.':'Motion paused. Your current form is preserved.';});
  music.addEventListener('click',async()=>{musicEnabled=!musicEnabled;if(musicEnabled){study.setPlaying(true);await startAudio();}else stopAudio();updateUI();status.textContent=musicEnabled?'Original background music is on; pace controls the score and motion together.':'Background music is off.';});
  studio.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>update({mode:b.dataset.mode},(b.dataset.mode==='fluid'?'Fluid ribbon':'Plasma filaments')+' selected. This is a manually directed motion study.')));
  ['pace','energy','cohesion'].forEach(k=>{const slider=studio.querySelector('#'+k);slider.addEventListener('input',()=>{studio.querySelector('[data-value="'+k+'"]').textContent=slider.value;});slider.addEventListener('change',()=>update({[k]:Number(slider.value)},'Version '+String(revision+1).padStart(2,'0')+' updated from your '+k+' control.'));});
  studio.querySelectorAll('[data-refine]').forEach(b=>b.addEventListener('click',()=>{const next=engine.refine(p,b.dataset.refine);if(['pace','energy','cohesion'].every(k=>next[k]===p[k])){status.textContent='This direction is at its limit. Try another control or a new variation.';return;}update(next,({flow:'More flowing: increased cohesion and a gentler deformation.',lift:'More lift: increased energy and a quicker pulse.',calm:'Calmer: reduced energy and a slower pulse.'})[b.dataset.refine]);}));
  studio.querySelector('[data-variation]').addEventListener('click',()=>update({seed:p.seed+1},'A new motion variation, keeping your material and direction.'));
  studio.querySelector('[data-reset]').addEventListener('click',()=>{if(recording)return;setPlaying(false);p=engine.normalize();revision=1;study.seconds=0;study.update(p);saveVideo.hidden=true;clearPreview();updateUI();status.textContent='Back to the first fluid study. Press play or choose a direction.';});
  studio.querySelector('[data-volume]').addEventListener('input',e=>{studio.querySelector('[data-volume-value]').textContent=e.target.value+'%';if(master)master.gain.setTargetAtTime(Number(e.target.value)/100,audio.currentTime,.03);});
  studio.querySelector('[data-save-frame]').addEventListener('click',()=>canvas.toBlob(blob=>{if(!blob){status.textContent='This frame could not be saved.';return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='dancing-thought-'+p.mode+'-'+String(revision).padStart(2,'0')+'.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent='Your current frame is ready to save as a PNG image.';},'image/png'));
  const types=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  const mime=typeof MediaRecorder!=='undefined'?types.find(t=>MediaRecorder.isTypeSupported(t)):null;
  const canRecord=!!(mime&&canvas.captureStream);
  if(!canRecord){record.disabled=true;studio.querySelector('[data-export-note]').textContent='Video export is unavailable in this browser. You can still play the study and save a frame.';}
  record.addEventListener('click',()=>{
    if(recording||!canRecord)return;
    let stream;const wasPlaying=study.active;
    try{
      study.forceRecord=true;study.setPlaying(true);stream=canvas.captureStream(24);
      if(musicEnabled&&destination)destination.stream.getAudioTracks().forEach(t=>stream.addTrack(t.clone()));
      recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1600000});
      let chunks=[];cancelRecord=false;recording=true;recordStart=performance.now();fields.disabled=true;play.disabled=true;music.disabled=true;record.disabled=true;studio.querySelector('[data-save-frame]').disabled=true;saveVideo.hidden=true;clearPreview();updateUI();
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      recorder.onstop=()=>{
        clearTimeout(recordTimer);clearInterval(progressTimer);study.forceRecord=false;stream.getTracks().forEach(t=>t.stop());recording=false;fields.disabled=false;play.disabled=false;music.disabled=false;record.disabled=!canRecord;studio.querySelector('[data-save-frame]').disabled=false;
        if(!wasPlaying)study.setPlaying(false);updateUI();const elapsed=(performance.now()-recordStart)/1000;
        if(cancelRecord||elapsed<7.5){status.textContent='Clip rendering stopped early. Keep this page in view and try again.';return;}
        const blob=new Blob(chunks,{type:recorder.mimeType||mime});if(blob.size<500){status.textContent='A usable clip was not produced. You can try again or save a frame.';return;}
        if(videoUrl)URL.revokeObjectURL(videoUrl);videoUrl=URL.createObjectURL(blob);const extension=blob.type.includes('mp4')?'mp4':'webm';saveVideo.href=videoUrl;saveVideo.download='dancing-thought-'+p.mode+'-'+String(revision).padStart(2,'0')+'.'+extension;saveVideo.hidden=false;saveVideo.textContent='Save video ↓';clipPreview.src=videoUrl;clipPreview.hidden=false;status.textContent='8-second '+p.mode+' clip ready · '+Math.round(blob.size/1024)+' KB · '+extension.toUpperCase()+(musicEnabled?' · background music included.':' · visual only.');
      };
      recorder.onerror=()=>{cancelRecord=true;status.textContent='The clip could not be completed. Try a frame export instead.';if(recorder.state!=='inactive')recorder.stop();};
      recorder.start(250);status.textContent='Rendering an 8-second clip… 0 / 8 seconds';progressTimer=setInterval(()=>{status.textContent='Rendering an 8-second clip… '+Math.min(8,Math.floor((performance.now()-recordStart)/1000))+' / 8 seconds';},500);recordTimer=setTimeout(()=>{if(recorder.state!=='inactive')recorder.stop();},8000);
    }catch{recording=false;study.forceRecord=false;stream?.getTracks().forEach(t=>t.stop());fields.disabled=false;play.disabled=false;music.disabled=false;record.disabled=!canRecord;studio.querySelector('[data-save-frame]').disabled=false;if(!wasPlaying)study.setPlaying(false);updateUI();status.textContent='Video export is unavailable here. You can save the current frame instead.';}
  });
  reduced.addEventListener('change',()=>{if(reduced.matches&&!recording)setPlaying(false);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(recording){cancelRecord=true;if(recorder?.state!=='inactive')recorder.stop();}setPlaying(false);}else study.last=0;});
  window.addEventListener('pagehide',()=>{cancelRecord=true;if(recording&&recorder?.state!=='inactive')recorder.stop();stopAudio();audio?.close();audio=null;master=null;destination=null;});
  fields.disabled=false;play.disabled=false;music.disabled=false;studio.querySelector('[data-save-frame]').disabled=false;record.disabled=!canRecord;updateUI();
})();
