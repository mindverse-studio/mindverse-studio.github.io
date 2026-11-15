(() => {
  'use strict';
  const lab=document.getElementById('sound-lab');
  if(lab&&globalThis.MindverseMusicEngine){
    const engine=globalThis.MindverseMusicEngine;
    const play=lab.querySelector('[data-play]'),download=lab.querySelector('[data-download]');
    const status=lab.querySelector('[data-lab-status]'),score=lab.querySelector('[data-score]');
    const volume=lab.querySelector('#volume');
    let parameters={preset:'still',energy:28,brightness:30,density:28,seed:23};
    let sketch=engine.createSketch(parameters),revision=1,context=null,source=null,gain=null,playing=false,frame=0,started=0,pcm=null,disposed=false,playbackToken=0;
    function renderScore(){
      const min=sketch.root-1,max=sketch.root+16;
      let content='<title>Original four-bar sketch, '+sketch.key+'</title><desc>Rectangles show the generated melody across sixteen beats. Their positions and lengths change with the controls.</desc><defs><linearGradient id="note-fill"><stop stop-color="#b6a4f5"/><stop offset="1" stop-color="#9adbd0"/></linearGradient></defs>';
      for(let i=0;i<=16;i++)content+='<line x1="'+(42+i*39)+'" x2="'+(42+i*39)+'" y1="28" y2="190" stroke="'+(i%4?'#ffffff09':'#ffffff22')+'"/>';
      for(let i=0;i<8;i++)content+='<line x1="42" x2="666" y1="'+(29+i*23)+'" y2="'+(29+i*23)+'" stroke="#ffffff0d"/>';
      sketch.notes.forEach(n=>{const y=174-(n.pitch-min)/(max-min)*136;content+='<rect x="'+(42+n.beat*39).toFixed(2)+'" y="'+y.toFixed(2)+'" width="'+Math.max(6,n.duration*39-3).toFixed(2)+'" height="8" rx="3" fill="url(#note-fill)"/>';});
      for(let bar=0;bar<4;bar++)content+='<text x="'+(42+bar*156)+'" y="221" fill="#7e8798" font-family="sans-serif" font-size="10">0'+(bar+1)+' · '+sketch.chordNames[bar]+'</text>';
      content+='<line class="playhead" x1="42" x2="42" y1="23" y2="195" stroke="#e9e3ff" stroke-width="1.3" opacity="0"/>';
      score.innerHTML=content;
      lab.querySelector('[data-key]').textContent=sketch.key;
      lab.querySelector('[data-tempo]').textContent=sketch.bpm+' BPM';
      lab.querySelector('[data-revision]').textContent=String(revision).padStart(2,'0');
      lab.querySelector('[data-note-count]').textContent=sketch.notes.length+' melody notes';
      ['energy','brightness','density'].forEach(name=>{lab.querySelector('#'+name).value=parameters[name];lab.querySelector('[data-value="'+name+'"]').textContent=Math.round(parameters[name]);});
      lab.querySelectorAll('[data-preset]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.preset===parameters.preset));});
    }
    function tick(){
      if(!playing||disposed)return;
      const elapsed=context.currentTime-started,progress=Math.min(1,elapsed/(sketch.beats*sketch.beatSeconds));
      const head=score.querySelector('.playhead');head.setAttribute('opacity','1');head.setAttribute('transform','translate('+(progress*624).toFixed(2)+' 0)');
      lab.querySelector('[data-time]').textContent=Math.floor(elapsed/60)+':'+String(Math.floor(elapsed%60)).padStart(2,'0');
      frame=requestAnimationFrame(tick);
    }
    function stop(){
      playbackToken++;playing=false;cancelAnimationFrame(frame);
      if(source){source.onended=null;try{source.stop();}catch{}source.disconnect();source=null;}
      if(gain){gain.disconnect();gain=null;}
      play.setAttribute('aria-pressed','false');play.innerHTML='<span aria-hidden="true">▶</span> Play sketch';
      lab.querySelector('[data-time]').textContent='0:00';score.querySelector('.playhead')?.setAttribute('opacity','0');
    }
    async function start(){
      const token=++playbackToken;
      try{
        const Audio=window.AudioContext||window.webkitAudioContext;
        if(!Audio)throw new Error('Web Audio unavailable');
        if(!context)context=new Audio();
        await context.resume();
        if(disposed||token!==playbackToken)return;
        pcm=pcm||engine.renderPCM(sketch);
        const buffer=context.createBuffer(1,pcm.length,22050);buffer.copyToChannel(pcm,0);
        source=context.createBufferSource();source.buffer=buffer;
        gain=context.createGain();gain.gain.value=Number(volume.value)/100;
        source.connect(gain);gain.connect(context.destination);
        source.onended=()=>{stop();status.textContent='Sketch complete. Keep the phrase or try another direction.';};
        source.start();started=context.currentTime;playing=true;
        play.setAttribute('aria-pressed','true');play.innerHTML='<span aria-hidden="true">■</span> Stop sketch';
        status.textContent='Playing your manual sketch. No BCI device is connected.';tick();
      }catch{stop();status.textContent='Audio playback is unavailable here. You can still save the sketch as a WAV file.';}
    }
    let busy=false;
    play.addEventListener('click',async()=>{if(busy)return;if(playing){stop();status.textContent='Playback stopped. Your sketch is ready.';return;}busy=true;play.disabled=true;try{await start();}finally{busy=false;play.disabled=false;}});
    function update(next,message){
      const resume=playing;stop();parameters={...parameters,...next};sketch=engine.createSketch(parameters);pcm=null;revision++;renderScore();status.textContent=message;
      if(resume)start();
    }
    lab.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{const p=engine.PRESETS[b.dataset.preset];update({preset:b.dataset.preset,energy:p.energy,brightness:p.brightness,density:p.density},p.label+' direction selected. The score and sound have changed.');}));
    ['energy','brightness','density'].forEach(name=>{const input=lab.querySelector('#'+name);input.addEventListener('input',()=>{lab.querySelector('[data-value="'+name+'"]').textContent=input.value;});input.addEventListener('change',()=>update({[name]:Number(input.value)},'Sketch '+String(revision+1).padStart(2,'0')+' updated from your '+name+' control.'));});
    volume.addEventListener('input',()=>{lab.querySelector('[data-volume]').textContent=volume.value+'%';if(gain)gain.gain.setTargetAtTime(Number(volume.value)/100,context.currentTime,.03);});
    lab.querySelector('[data-variation]').addEventListener('click',()=>update({seed:parameters.seed+1},'A new original phrase, keeping your current musical direction.'));
    lab.querySelectorAll('[data-feedback]').forEach(b=>b.addEventListener('click',()=>{
      const type=b.dataset.feedback,next={};
      if(type==='softer'){next.energy=Math.max(0,parameters.energy-12);next.brightness=Math.max(0,parameters.brightness-18);}
      if(type==='space')next.density=Math.max(0,parameters.density-24);
      if(type==='motion'){next.energy=Math.min(100,parameters.energy+15);next.density=Math.min(100,parameters.density+16);}
      if(Object.keys(next).every(k=>next[k]===parameters[k])){status.textContent='This direction is at its limit. Try another control or create a variation.';return;}
      update(next,({softer:'Softer: a slower pulse and fewer bright overtones.',space:'More space: fewer melody notes across the same four bars.',motion:'More motion: a faster pulse and increased note density.'})[type]);
    }));
    lab.querySelector('[data-reset]').addEventListener('click',()=>{stop();parameters={preset:'still',energy:28,brightness:30,density:28,seed:23};sketch=engine.createSketch(parameters);pcm=null;revision=1;renderScore();status.textContent='Back to the first sketch. Start with a direction or press play.';});
    download.addEventListener('click',()=>{
      pcm=pcm||engine.renderPCM(sketch);
      const url=URL.createObjectURL(new Blob([engine.encodeWav(pcm,22050,Number(volume.value)/100)],{type:'audio/wav'}));
      const a=document.createElement('a');a.href=url;a.download='mindverse-music-sketch-'+String(revision).padStart(2,'0')+'.wav';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
      status.textContent='Your original sketch is ready to save as a WAV file.';
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing){stop();status.textContent='Playback paused while this page was in the background.';}});
    window.addEventListener('pagehide',()=>{disposed=true;stop();context?.close();context=null;});
    window.addEventListener('pageshow',()=>{disposed=false;});
    renderScore();play.disabled=false;download.disabled=false;lab.querySelector('fieldset').disabled=false;
  }


})();
