#!/usr/bin/env python3
"""Vector concept artwork for logic and the convergence of knowledge."""
from pathlib import Path
from html import escape
import re,json,math
ROOT=Path(__file__).resolve().parents[1]

def svg(title,description,color,body):
 return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000" role="img" aria-labelledby="title desc"><title id="title">{escape(title)}</title><desc id="desc">{escape(description)}</desc><defs><radialGradient id="aura"><stop stop-color="{color}" stop-opacity=".15"/><stop offset="1" stop-color="{color}" stop-opacity="0"/></radialGradient></defs><circle cx="500" cy="500" r="450" fill="url(#aura)"/>{body}</svg>\n'

def path(points,color,opacity=.3,width=1.3,dash=''):
 d=' '.join(('M' if i==0 else 'L')+f'{x:.2f} {y:.2f}' for i,(x,y) in enumerate(points))
 return f'<path d="{d}" fill="none" stroke="{color}" stroke-opacity="{opacity}" stroke-width="{width}"'+(f' stroke-dasharray="{dash}"' if dash else '')+'/>'

def intuition():
 model=json.loads((ROOT/'records/intuition-model.json').read_text())
 c='#c9b3f5';nodes=[(500+270*math.cos(math.pi/2-i*math.tau/5),440+270*math.sin(math.pi/2-i*math.tau/5)) for i in range(5)]
 body='<g fill="none" stroke="'+c+'"><circle cx="500" cy="440" r="270" stroke-opacity=".07"/><circle cx="500" cy="440" r="195" stroke-opacity=".05"/></g>'
 body+=path(nodes+[nodes[0]],c,.5,2.2)
 routes=[]
 for i,(x,y) in enumerate(nodes):
  xx,yy=nodes[(i+1)%5];routes.append((x,y,xx,yy,i*.21,'ring'))
  hx,hy=500+(x-500)*.29,440+(y-440)*.29
  body+=path([(x,y),(hx,hy)],c,.25,1.5)
  routes.append((x,y,hx,hy,i*.16,'spoke'))
  routes.append((hx,hy,x,y,.5+i*.13,'return'))
 body+='<path data-ego-pointer="" d="M500 710 L500 870" fill="none" stroke="#a7ded5" stroke-opacity=".68" stroke-width="2"/><path data-ego-nib="" d="M492 852 L500 870 L508 852 Z" fill="#b9ebe0" fill-opacity=".9"/>'
 body+='<g fill="none" stroke="'+c+'" stroke-opacity=".12">'
 for y in [825,855,885,915]:body+=path([(220,y),(780,y)],c,.12)
 for x in range(220,781,70):body+=path([(x,825),(x,915)],c,.12)
 body+='</g><text x="500" y="962" text-anchor="middle" font-family="Arial,sans-serif" font-size="21" letter-spacing="4" fill="'+c+'" fill-opacity=".6">TEMPORAL FLOW →</text><text x="179" y="870" text-anchor="middle" transform="rotate(-90 179 870)" font-family="Arial,sans-serif" font-size="17" letter-spacing="3" fill="'+c+'" fill-opacity=".4">SPACE</text>'
 def history_y(t):return 870+8*math.sin(t*.7)+5*math.sin(t*1.1)+4*math.sin(t*.37)+3*math.sin(t*1.6)
 history=[(235+i*265/80,history_y(-(265-i*265/80)/22)) for i in range(81)]
 body+=path(history,'#a7ded5',.7,2).replace('<path ','<path data-history-trace="" ',1)
 for i in range(7):
  x=240+i*40;body+=f'<circle data-time-trace="{i}" cx="{x}" cy="{history_y(-(500-x)/22):.2f}" r="3" fill="#bce9df" fill-opacity=".55"/>'
 body+='<circle data-ego-target-halo="" cx="500" cy="870" r="11" fill="none" stroke="#a7ded5" stroke-opacity=".4"/><circle data-ego-target="" cx="500" cy="870" r="3" fill="#dbfff4"/><text x="260" y="937" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" letter-spacing="2" fill="'+c+'" fill-opacity=".5">HISTORY</text><text x="500" y="937" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" letter-spacing="2" fill="#a7ded5" fill-opacity=".65">NOW</text>'
 for x,y,xx,yy,phase,kind in routes:
  body+=f'<circle data-flow-packet="{kind}" data-x1="{x:.4f}" data-y1="{y:.4f}" data-x2="{xx:.4f}" data-y2="{yy:.4f}" data-phase="{phase}" cx="{x:.2f}" cy="{y:.2f}" r="4" fill="{c}" fill-opacity=".85"/>'
 for i,(x,y) in enumerate(nodes):
  body+=f'<g data-role-node="{model["roles"][i]["id"]}"><circle data-node-halo="" cx="{x:.2f}" cy="{y:.2f}" r="31" fill="none" stroke="{c}" stroke-opacity=".2"/><circle cx="{x:.2f}" cy="{y:.2f}" r="20" fill="#151322" stroke="{c}" stroke-opacity=".75" stroke-width="1.8"/><circle cx="{x:.2f}" cy="{y:.2f}" r="5" fill="{c}" fill-opacity=".9"/></g>'
 labels=[(610,739),(860,550),(765,167),(235,167),(140,550)]
 for role,(x,y) in zip(model['roles'],labels):
  body+=f'<text x="{x}" y="{y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" letter-spacing="2.5" fill="{c}" fill-opacity=".9">{escape(role["name"].upper())}</text><text x="{x}" y="{y+29}" text-anchor="middle" font-family="Arial,sans-serif" font-size="19" fill="{c}" fill-opacity=".53">{escape(role["short"])}</text>'
 body+='<circle cx="500" cy="440" r="78" fill="#11111e" stroke="'+c+'" stroke-opacity=".55" stroke-width="1.7"/><circle data-mind-halo="" cx="500" cy="440" r="91" fill="none" stroke="'+c+'" stroke-opacity=".15"/><text x="500" y="455" text-anchor="middle" font-family="Arial,sans-serif" font-size="43" letter-spacing="4" fill="#e8ddff">MIND</text>'
 return svg('Intuition — Mind and five connected roles','Mind at the centre of an inverted pentagon whose vertices are Ego, Memory, Intellect, Sense, and Action. Ego is the bottom vertex and acts as a pen nib tracing decision history in temporal flow. Memory is knowledge; Intellect is strategy; Sense is observation; Action is end-to-end orchestration. A conceptual framework.',c,body)

def singularity():
 source=(ROOT/'records/singularity-art-source.svg').read_text()
 source=re.sub(r'<title[^>]*>.*?</title>', '<title id="title">Singularity — convergence of knowledge</title>', source, count=1, flags=re.S)
 return re.sub(r'<desc[^>]*>.*?</desc>', '<desc id="desc">Layered abstract geometry representing the convergence of knowledge across disciplines. Original conceptual artwork, not measured data.</desc>', source, count=1, flags=re.S)

if __name__=='__main__':
 for name,render in [('intuition',intuition),('singularity',singularity)]:
  (ROOT/'images/learning'/f'{name}.svg').write_text(render())
 print('Rendered Intuition artwork and restored the knowledge-convergence Singularity artwork.')
