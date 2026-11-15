/* Signal/lifecycle integration checks using the generated SVG and local DOM doubles. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'images/learning/intuition.svg'),'utf8');let checks=0;
function harness(){
 const raf=new Map(),mutations=[],observed=[],mediaListeners=[],events={},windowEvents={};let id=0,now=0;
 function svgNodes(){return [...source.matchAll(/<(?:circle|path)\b([^>]*)>/g)].map(m=>{const attrs=Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]]));const dataset={};for(const [k,v]of Object.entries(attrs))if(k.startsWith('data-'))dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;return {attrs,dataset,setAttribute(k,v){attrs[k]=String(v)}}})}
 const panel={classList:{contains:()=>true}},reduced={matches:false,addEventListener:(name,fn)=>mediaListeners.push(fn)};
 const sync=()=>mutations.forEach(fn=>fn());
 const journey={dataset:{motion:'playing'},classList:{contains:()=>true},querySelector:()=>galleryToggle};
 const galleryToggle={click(){journey.dataset.motion=journey.dataset.motion==='playing'?'paused':'playing';sync()}};
 const views=['gallery','library'].map(kind=>{const nodes=svgNodes(),button={attrs:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(name,fn){this.click=fn}};const query=selector=>nodes.filter(n=>Object.hasOwn(n.attrs,selector.slice(1,-1)));const svg={querySelectorAll:query,querySelector:s=>query(s)[0]};return {kind,nodes,button,dataset:{},closest:()=>kind==='gallery'?panel:null,querySelector:s=>s==='svg'?svg:button};});
 const document={hidden:false,querySelectorAll:()=>views,getElementById:()=>journey,addEventListener:(name,fn)=>events[name]=fn};
 const scope={document,matchMedia:()=>reduced,requestAnimationFrame:fn=>{raf.set(++id,fn);return id},cancelAnimationFrame:i=>raf.delete(i),IntersectionObserver:class{constructor(fn){this.fn=fn}observe(view){observed.push({view,fn:this.fn})}},MutationObserver:class{constructor(fn){mutations.push(fn)}observe(){}},window:{addEventListener:(name,fn)=>windowEvents[name]=fn}};
 vm.createContext(scope);vm.runInContext(fs.readFileSync(path.join(root,'js/intuition-graph.js'),'utf8'),scope);
 const visible=(kind,value=true)=>observed.filter(x=>x.view.kind===kind).forEach(x=>x.fn([{isIntersecting:value}]));
 const step=()=>{now+=50;const callbacks=[...raf.values()];raf.clear();callbacks.forEach(fn=>fn(now))};
 return {views,raf,visible,step,reduced,mediaListeners,document,events,windowEvents};
}
function check(name,fn){fn();checks++;console.log('PASS '+name)}
check('signals move on actual generated routes and Ego points to the selected temporal location',()=>{
 const h=harness(),v=h.views[0],packet=v.nodes.find(n=>n.dataset.flowPacket==='ring'),before=packet.attrs.cx;h.visible('gallery');h.step();h.step();assert.notEqual(packet.attrs.cx,before);const target=v.nodes.find(n=>Object.hasOwn(n.attrs,'data-ego-target')),pointer=v.nodes.find(n=>Object.hasOwn(n.attrs,'data-ego-pointer')),history=v.nodes.find(n=>Object.hasOwn(n.attrs,'data-history-trace'));assert.ok(pointer.attrs.d.endsWith(target.attrs.cx+' '+target.attrs.cy));assert.ok(history.attrs.d.endsWith(target.attrs.cx+' '+target.attrs.cy));for(const n of v.nodes)for(const k of ['cx','cy','r'])if(k in n.attrs)assert.ok(Number.isFinite(Number(n.attrs[k])));
});
check('library pause controls both instances and freezes the signal coordinates',()=>{
 const h=harness();h.visible('gallery');h.visible('library');h.step();h.step();h.views[1].button.click();assert.equal(h.raf.size,0);assert.ok(h.views.every(v=>v.dataset.playing==='false'&&v.button.attrs['aria-pressed']==='true'));const frame=h.views[0].dataset.frame;h.step();assert.equal(h.views[0].dataset.frame,frame);h.views[1].button.click();assert.equal(h.raf.size,2);
});
check('off-screen and hidden views stop scheduling work',()=>{
 const h=harness();h.visible('gallery');assert.equal(h.raf.size,1);h.visible('gallery',false);assert.equal(h.raf.size,0);h.visible('library');h.document.hidden=true;h.events.visibilitychange();assert.equal(h.raf.size,0);h.document.hidden=false;h.events.visibilitychange();assert.equal(h.raf.size,1);h.windowEvents.pagehide();assert.equal(h.raf.size,0);h.windowEvents.pageshow();assert.equal(h.raf.size,1);
});
check('reduced motion keeps a readable static graph and disables play controls',()=>{
 const h=harness();h.visible('gallery');h.reduced.matches=true;h.mediaListeners.forEach(fn=>fn());assert.equal(h.raf.size,0);assert.ok(h.views.every(v=>v.button.disabled&&v.dataset.frame==='1'));assert.ok(source.includes('>MIND</text>'));
});
console.log(checks+' Intuition graph checks passed.');module.exports={checks};
