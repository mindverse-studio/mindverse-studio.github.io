/* Original deterministic musical sketch engine. No sensors, remote models or recordings. */
(() => {
  'use strict';
  const PRESETS = Object.freeze({
    still: {label:'Still', root:62, energy:28, brightness:30, density:28},
    flow: {label:'Flow', root:60, energy:55, brightness:52, density:54},
    lift: {label:'Lift', root:67, energy:80, brightness:72, density:78}
  });
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const names=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
  const noteName=n=>names[((n%12)+12)%12];
  const frequency=n=>440*Math.pow(2,(n-69)/12);
  function createSketch(input={}) {
    const presetName=Object.prototype.hasOwnProperty.call(PRESETS,input.preset)?input.preset:'still';
    const preset=PRESETS[presetName];
    const parameters={preset:presetName,energy:clamp(Number(input.energy??preset.energy),0,100),brightness:clamp(Number(input.brightness??preset.brightness),0,100),density:clamp(Number(input.density??preset.density),0,100),seed:(Number(input.seed??23)>>>0)};
    const bpm=Math.round(52+parameters.energy*.7);
    const count=4+Math.round(parameters.density*.28);
    let randomState=parameters.seed || 1;
    function random(){randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;}
    const pentatonic=[0,2,4,7,9];
    const notes=[];let degree=2;
    for(let i=0;i<count;i++){
      const beat=Math.round(i*32/count)*.5;
      const nextBeat=i===count-1?16:Math.round((i+1)*32/count)*.5;
      const step=nextBeat-beat;
      degree=clamp(degree+([-1,0,1,2][Math.floor(random()*4)]),0,6);
      const last=i===count-1;
      const pitch=last?preset.root+12:preset.root+pentatonic[degree%5]+12*Math.floor(degree/5);
      notes.push({beat,pitch,duration:step*(last?.94:.8),velocity:.12+random()*.035});
    }
    const intervals=[[-12,-8,-5],[-15,-12,-8],[-7,-3,0],[-5,-1,2]];
    const chords=intervals.map((list,index)=>({beat:index*4,duration:4,notes:list.map(n=>preset.root+n)}));
    return {parameters,bpm,beatSeconds:60/bpm,beats:16,duration:16*60/bpm+1.6,root:preset.root,key:noteName(preset.root)+' major pentatonic',chordNames:[noteName(preset.root),noteName(preset.root-3)+'m',noteName(preset.root+5),noteName(preset.root+7)],notes,chords};
  }
  function renderPCM(sketch,sampleRate=22050){
    const pcm=new Float32Array(Math.ceil(sketch.duration*sampleRate));
    const brightness=sketch.parameters.brightness/100;
    function voice(pitch,beat,duration,gain,pad=false){
      const start=Math.round(beat*sketch.beatSeconds*sampleRate),seconds=duration*sketch.beatSeconds;
      const release=pad?.55:.25;
      const count=Math.min(pcm.length-start,Math.ceil((seconds+release)*sampleRate));
      const f=frequency(pitch),attack=pad?.16:.012;
      for(let j=0;j<count;j++){
        const t=j/sampleRate;
        const attackEnv=Math.min(1,t/attack);
        const tail=t<=seconds?1:Math.max(0,1-(t-seconds)/release);
        const decay=pad?1:Math.exp(-t/(1.4+seconds*.4));
        const phase=2*Math.PI*f*t;
        const tone=pad?Math.sin(phase)*.88+Math.sin(phase*2)*.12:Math.sin(phase)*.82+Math.sin(phase*2)*brightness*.2+Math.sin(phase*3)*brightness*.08;
        pcm[start+j]+=tone*attackEnv*tail*tail*decay*gain;
      }
    }
    sketch.chords.forEach(c=>c.notes.forEach((n,i)=>voice(n,c.beat+i*.04,c.duration-.06,.033,true)));
    sketch.notes.forEach(n=>voice(n.pitch,n.beat,n.duration,n.velocity));
    // A restrained two-tap echo adds space without changing the score.
    const delay=Math.round(sampleRate*.235),dry=pcm.slice();
    for(let i=delay;i<pcm.length;i++)pcm[i]+=dry[i-delay]*.17;
    for(let i=delay*2;i<pcm.length;i++)pcm[i]+=dry[i-delay*2]*.07;
    let peak=0;for(const value of pcm)peak=Math.max(peak,Math.abs(value));
    if(peak>.85)for(let i=0;i<pcm.length;i++)pcm[i]*=.85/peak;
    // Smooth the final tail and guarantee the download ends at silence.
    const fade=Math.round(sampleRate*.15);
    for(let i=0;i<fade;i++)pcm[pcm.length-1-i]*=i/fade;
    return pcm;
  }
  function encodeWav(pcm,sampleRate=22050,volume=1){
    const data=new ArrayBuffer(44+pcm.length*2),v=new DataView(data);
    const word=(offset,text)=>{for(let i=0;i<text.length;i++)v.setUint8(offset+i,text.charCodeAt(i));};
    word(0,'RIFF');v.setUint32(4,data.byteLength-8,true);word(8,'WAVE');word(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);word(36,'data');v.setUint32(40,pcm.length*2,true);
    for(let i=0;i<pcm.length;i++){const s=clamp(pcm[i]*volume,-1,1);v.setInt16(44+i*2,s<0?s*32768:s*32767,true);}
    return data;
  }
  globalThis.MindverseMusicEngine=Object.freeze({PRESETS,createSketch,renderPCM,encodeWav,noteName});
})();
