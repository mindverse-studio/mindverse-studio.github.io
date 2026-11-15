/* Pure composition/audio checks. No browser, network or live services. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const scope={};vm.createContext(scope);
vm.runInContext(fs.readFileSync(path.join(root,'js/music-engine.js'),'utf8'),scope);
const engine=scope.MindverseMusicEngine;
let checks=0;
function check(label,fn){fn();checks++;console.log('PASS '+label);}
check('all directions keep quantized notes in their own pentatonic key',()=>{
 for(const preset of ['still','flow','lift'])for(const density of [0,4,28,54,78,100]){
  const s=engine.createSketch({preset,density});
  assert.equal(s.chords.length,4);assert.ok(s.duration>0&&s.bpm>=52&&s.bpm<=122);
  let last=-1;
  for(const n of s.notes){assert.ok(n.beat>last&&n.beat>=0&&n.beat<16);assert.equal(n.beat*2%1,0);assert.ok(n.duration>0&&n.beat+n.duration<=16);assert.ok([0,2,4,7,9].includes((n.pitch-s.root)%12));last=n.beat;}
 }
});
check('fixed input reproduces the score and a new seed changes the phrase',()=>{
 const a=JSON.stringify(engine.createSketch({seed:23}));assert.equal(a,JSON.stringify(engine.createSketch({seed:23})));assert.notEqual(a,JSON.stringify(engine.createSketch({seed:24})));
});
check('feedback direction makes concrete tempo, tone and density changes',()=>{
 const before=engine.createSketch();const softer=engine.createSketch({energy:16,brightness:12});const sparse=engine.createSketch({density:4});const motion=engine.createSketch({energy:43,density:44});
 assert.ok(softer.bpm<before.bpm);assert.ok(softer.parameters.brightness<before.parameters.brightness);assert.ok(sparse.notes.length<before.notes.length);assert.ok(motion.bpm>before.bpm&&motion.notes.length>before.notes.length);
});
const sketch=engine.createSketch(),pcm=engine.renderPCM(sketch);
check('synthesis produces finite, audible, bounded samples with a silent ending',()=>{
 let energy=0,peak=0;for(const n of pcm){assert.ok(Number.isFinite(n));energy+=n*n;peak=Math.max(peak,Math.abs(n));}
 assert.ok(Math.sqrt(energy/pcm.length)>.005);assert.ok(peak>.05&&peak<=.85001);assert.equal(pcm[pcm.length-1],0);assert.ok(Math.abs(pcm.length/22050-sketch.duration)<1/22050);
});
check('WAV contains correct mono PCM header and frame count',()=>{
 const wav=engine.encodeWav(pcm),v=new DataView(wav),bytes=new Uint8Array(wav);
 const text=(start,n)=>String.fromCharCode(...bytes.slice(start,start+n));assert.equal(text(0,4),'RIFF');assert.equal(text(8,4),'WAVE');assert.equal(text(36,4),'data');assert.equal(v.getUint16(22,true),1);assert.equal(v.getUint32(24,true),22050);assert.equal(v.getUint16(34,true),16);assert.equal(v.getUint32(40,true),pcm.length*2);assert.equal(v.byteLength,44+pcm.length*2);
});
check('WAV volume scales the saved audio and can export silence',()=>{
 const full=new DataView(engine.encodeWav(pcm,22050,1)),half=new DataView(engine.encodeWav(pcm,22050,.5)),zero=new DataView(engine.encodeWav(pcm,22050,0));
 for(let i=44;i<full.byteLength;i+=734){assert.ok(Math.abs(half.getInt16(i,true)-full.getInt16(i,true)*.5)<=1);assert.equal(zero.getInt16(i,true),0);}
});
check('tone refinement changes the synthesized waveform',()=>{
 const dark=engine.renderPCM(engine.createSketch({brightness:0})),bright=engine.renderPCM(engine.createSketch({brightness:100}));let diff=0;for(let i=0;i<dark.length;i++)diff+=Math.abs(dark[i]-bright[i]);assert.ok(diff/dark.length>.001);
});
check('unknown preset names use the default and parameters stay bounded',()=>{
 const s=engine.createSketch({preset:'toString',energy:-200,density:500});assert.equal(s.parameters.preset,'still');assert.equal(s.parameters.energy,0);assert.equal(s.parameters.density,100);
});
console.log(checks+' Music engine checks passed.');
module.exports={checks};
