/* Animation lifecycle checks with local drawing doubles; no browser or live services. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');let checks=0;
function harness(contextAvailable=true){
 const raf=new Map(),mutations=[],intersections=[],reducedListeners=[],docEvents={},windowEvents={};let id=0,now=0;
 const reduced={matches:false,addEventListener:(name,fn)=>reducedListeners.push(fn)};
 const classes=(...initial)=>{const values=new Set(initial);return {contains:x=>values.has(x),add:x=>values.add(x),remove:x=>values.delete(x)}};
 const gradient={addColorStop(){}};
 const ctx=new Proxy({}, {get:(target,key)=>key.startsWith('create')?()=>gradient:()=>{}});
 const panels={},arts={},canvases={},buttons={};
 for(const kind of ['music','dance']){
  panels[kind]={classList:classes(...(kind==='music'?['is-active']:[]))};
  const img={setAttribute(){}};const figure={classList:classes(),querySelector:()=>img};
  arts[kind]={dataset:{},querySelectorAll:()=>kind==='dance'?Object.values(buttons):[]};
  canvases[kind]={dataset:{homeCanvas:kind},hidden:true,attrs:{},parentElement:arts[kind],getContext:()=>contextAvailable?ctx:null,closest:selector=>selector==='figure'?figure:panels[kind],getBoundingClientRect:()=>({width:400,height:400}),setAttribute(name,value){this.attrs[name]=value}};
 }
 for(const mode of ['fluid','plasma'])buttons[mode]={dataset:{homeMaterial:mode},attrs:{},setAttribute(name,value){this.attrs[name]=value},addEventListener(name,fn){this.click=fn}};
 const journey={dataset:{motion:'playing'},classList:classes('is-enhanced'),querySelectorAll:()=>Object.values(canvases)};
 const document={hidden:false,querySelector:()=>journey,addEventListener:(name,fn)=>docEvents[name]=fn};
 const scope={document,devicePixelRatio:1,matchMedia:()=>reduced,requestAnimationFrame:fn=>{raf.set(++id,fn);return id},cancelAnimationFrame:key=>raf.delete(key),ResizeObserver:class{constructor(fn){this.fn=fn}observe(){}},IntersectionObserver:class{constructor(fn){intersections.push(fn)}observe(){}},MutationObserver:class{constructor(fn){mutations.push(fn)}observe(){}},window:{addEventListener:(name,fn)=>windowEvents[name]=fn}};
 vm.createContext(scope);
 for(const name of ['music-engine','motion-engine','home-visuals'])vm.runInContext(fs.readFileSync(path.join(root,'js/'+name+'.js'),'utf8'),scope);
 const sync=()=>mutations.forEach(fn=>fn());
 const step=()=>{now+=50;const callbacks=[...raf.values()];raf.clear();callbacks.forEach(fn=>fn(now))};
 const visible=()=>intersections.forEach(fn=>fn([{isIntersecting:true}]));
 return {raf,reduced,reducedListeners,document,docEvents,windowEvents,journey,panels,arts,canvases,buttons,sync,step,visible};
}
function check(name,fn){fn();checks++;console.log('PASS '+name)}
check('only the visible active gallery scene animates',()=>{
 const h=harness();assert.equal(h.raf.size,0);h.visible();const music=Number(h.canvases.music.dataset.frame),dance=h.canvases.dance.dataset.frame;h.step();h.step();assert.ok(Number(h.canvases.music.dataset.frame)>music);assert.equal(h.canvases.dance.dataset.frame,dance);
 h.panels.music.classList.remove('is-active');h.panels.dance.classList.add('is-active');h.sync();assert.equal(h.arts.music.dataset.playing,'false');assert.equal(h.arts.dance.dataset.playing,'true');const stopped=h.canvases.music.dataset.frame;h.step();assert.equal(h.canvases.music.dataset.frame,stopped);assert.ok(Number(h.canvases.dance.dataset.frame)>Number(dance));
});
check('gallery pause freezes frames and resume restarts motion',()=>{
 const h=harness();h.visible();h.step();h.journey.dataset.motion='paused';h.sync();const frame=h.canvases.music.dataset.frame;assert.equal(h.raf.size,0);h.step();assert.equal(h.canvases.music.dataset.frame,frame);h.journey.dataset.motion='playing';h.sync();h.step();assert.ok(Number(h.canvases.music.dataset.frame)>Number(frame));
});
check('reduced motion and short-screen fallback stay static',()=>{
 const h=harness();h.visible();h.reduced.matches=true;h.reducedListeners.forEach(fn=>fn());assert.equal(h.raf.size,0);assert.equal(h.canvases.music.hidden,false);h.reduced.matches=false;h.journey.classList.remove('is-enhanced');h.sync();assert.equal(h.raf.size,0);assert.equal(h.arts.music.dataset.playing,'false');
});
check('fluid and plasma choices redraw and update accessible names',()=>{
 const h=harness();const before=Number(h.canvases.dance.dataset.frame);h.buttons.plasma.click();assert.equal(h.buttons.plasma.attrs['aria-pressed'],'true');assert.match(h.canvases.dance.attrs['aria-label'],/plasma/);assert.ok(Number(h.canvases.dance.dataset.frame)>before);h.buttons.fluid.click();assert.equal(h.buttons.plasma.attrs['aria-pressed'],'false');assert.match(h.canvases.dance.attrs['aria-label'],/fluid/);
});
check('hidden pages stop work and cached pages resume safely',()=>{
 const h=harness();h.visible();h.document.hidden=true;h.docEvents.visibilitychange();assert.equal(h.raf.size,0);h.document.hidden=false;h.docEvents.visibilitychange();assert.equal(h.raf.size,1);h.windowEvents.pagehide();assert.equal(h.raf.size,0);h.windowEvents.pageshow();assert.equal(h.raf.size,1);
});
check('unavailable canvas preserves static image fallback',()=>{
 const h=harness(false);h.visible();assert.equal(h.canvases.music.hidden,true);assert.equal(h.canvases.dance.hidden,true);assert.equal(h.raf.size,0);
});
console.log(checks+' home visual lifecycle checks passed.');module.exports={checks};
