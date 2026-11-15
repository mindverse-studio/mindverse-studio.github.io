#!/usr/bin/env python3
"""Render Mindverse Studio from local snapshots; never reads or edits sibling sites."""
from pathlib import Path
from html import escape as e
from urllib.parse import urlsplit,parse_qs,urlencode
import json,re
ROOT=Path(__file__).resolve().parents[1]
SOURCE=json.loads((ROOT/'records/source-content.json').read_text())
ARROW='<span aria-hidden="true">↗</span>'
AREAS=[
 dict(id='learning',name='Learning',subtitle='Superlearning',accent='#a7e2c3',verb='Build an understanding.',description='Explore seven learning worlds through visual models, structured questions, and reflection. Move from Quantum Matter, Fluids, and Plasma to Electrodynamics, Space–time, Intuition, and Singularity.',hero='images/learning/quantum-matter.svg',image='images/learning/fluid-dynamics.svg',meta='7 paths · Visual models + self-checks',features=['Seven-world scroll journey','Starter questions with sources','Task → strategy → validation'],status='Learning previews'),
 dict(id='music',name='Music',subtitle='Mindverse Music',accent='#b9a8f4',verb='Give intention a sound.',description='Explore a research vision for music shaped through imagination, listening, and BCI feedback. Try an original manual sound sketch, change its musical direction, and keep a phrase.',hero='images/music/signal-to-score.svg',image='images/music/application-inner-melody.svg',meta='Original sound sketches · Feedback + WAV export',features=['Play an original musical sketch','Refine energy, tone, and density','Keep a phrase as a WAV'],status='Manual sound lab + BCI vision'),
 dict(id='dance',name='Dance',subtitle='Dancing Thought',accent='#a6ded6',verb='Let a thought find its motion.',description='Give fluid and plasma-inspired forms a movement identity, with optional music. Preview the imagined-motion-to-feedback vision, refine a manual study, and render a short audiovisual clip.',hero='images/dance/fluid-study.svg',image='images/dance/plasma-study.svg',meta='Fluid + plasma · Motion, music + clip export',features=['Play fluid and plasma studies','Refine pace, energy, and cohesion','Render a short video with music'],status='Manual motion studio + BCI vision'),
 dict(id='meditation',name='Meditation',subtitle='Mindverse Meditation',accent='#e5bdce',verb='Make room for stillness.',description='Follow an artistic journey from Root Chakra to Sahasrara. Explore the lotus forms, colours, elements, and seed sounds, with open reflection and context from different traditions.',hero='images/meditation/muladhar.jpg',image='images/meditation/sahasrara.jpg',meta='7 centres · Colour, element + seed sound',features=['Seven-centre scroll gallery','Illustrated symbols and seed sounds','Gentle prompts and tradition notes'],status='Artistic contemplation')
]


def remap(body,area):
    def src(match):
        q=match.group(1)
        if not q.startswith('images/'):return match.group(0)
        tail=q[7:]
        if tail.startswith('studio/'):target='images/learning/'+tail[7:]
        elif tail=='usecase-learning-policy-v4.svg':target='images/learning/learning-loop.svg'
        elif tail.startswith('chakras/'):target='images/meditation/'+tail[8:]
        elif tail in ('brand-mark.png','favicon-32.png'):target='images/'+tail
        else:target='images/'+area+'/'+tail
        return 'src="'+target+'"'
    body=re.sub(r'src="([^"]+)"',src,body)
    def href(match):
        ref=match.group(1);u=urlsplit(ref)
        if u.scheme or u.netloc or not u.path:return match.group(0)
        file=u.path;query=parse_qs(u.query);fragment=('#'+u.fragment) if u.fragment else ''
        if file=='contact.html':
            topic=(query.get('path') or query.get('centre') or query.get('interest') or [''])[0]
            params={'interest':area}
            if topic and topic not in ('general',area):params['topic']=topic
            return 'href="contact.html?'+urlencode(params).replace('&','&amp;')+'"'
        if area=='learning':mapping={'index.html':'learning.html','paths.html':'learning.html#paths','approach.html':'learning.html#learning-method','about.html':'about.html'}
        elif area=='music':mapping={'index.html':'music.html','platform.html':'about.html#music-platform','research.html':'about.html#music-research'}
        elif area=='dance':mapping={'index.html':'dance.html','experience.html':'about.html#dance-platform','research.html':'about.html#dance-research'}
        else:mapping={'index.html':'meditation.html','centres.html':'meditation.html#centres','practice.html':'meditation.html#practice','tradition.html':'meditation.html#traditions'}
        target=mapping.get(file,file)
        if u.fragment:target=target.split('#')[0]+fragment
        return 'href="'+target+'"'
    return re.sub(r'href="([^"]+)"',href,body)


def nav(active):
    links=[('index.html','Home')]+[(a['id']+'.html',a['name']) for a in AREAS]+[('about.html','The Studio')]
    items=''.join(f'<a href="{href}"'+(' aria-current="page"' if href==active else '')+f'>{name}</a>' for href,name in links)
    brand='<a class="brand" href="index.html" aria-label="Mindverse Studio home"><img src="images/brand-mark.png" width="34" height="34" alt=""><span>Mindverse Studio</span></a>'
    return f'<a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="shell header-inner">{brand}<nav class="desktop-nav" aria-label="Main navigation">{items}<a class="nav-contact" href="contact.html">Get in touch {ARROW}</a></nav><details class="mobile-menu"><summary>Menu <span aria-hidden="true">+</span></summary><nav aria-label="Mobile navigation">{items}<a href="contact.html">Get in touch {ARROW}</a></nav></details></div></header>'


def footer():
    social=(ROOT/'records/social-links.html').read_text().strip()
    links=''.join(f'<a href="{a["id"]}.html">{a["name"]}</a>' for a in AREAS)
    return f'''<footer class="site-footer"><div class="shell"><section class="newsletter" aria-labelledby="newsletter-title"><div><p class="eyebrow">Studio notes</p><h2>One Studio.<br>Many next ideas.</h2><p>Join the shared Mindverse list for occasional research, learning, and project updates.</p></div><form id="footer-subscribe-form" aria-label="Mindverse newsletter signup"><fieldset disabled><legend class="sr-only">Mindverse newsletter signup</legend><label for="newsletter-email">Email address</label><div class="newsletter-fields"><input id="newsletter-email" name="email" type="email" placeholder="you@example.com" autocomplete="email" maxlength="180" required><button type="submit">Subscribe {ARROW}</button></div></fieldset><p id="subscribe-message" class="form-status" role="status" aria-live="polite"></p><noscript>Enable JavaScript to subscribe.</noscript></form></section><div class="footer-main"><div><a class="brand" href="index.html"><img src="images/brand-mark.png" width="34" height="34" alt=""><span>Mindverse Studio</span></a><p>Curiosity. Expression.<br>Movement. Reflection.</p></div><nav aria-label="Footer navigation">{links}<a href="about.html">The Studio</a><a href="contact.html">Get in touch</a></nav><p class="footer-scope">Four connected explorations.<br>One Mindverse Computing studio.<br>Choose a direction. Make it your own.</p></div><div class="footer-bottom"><p>© <span data-year>2026</span> Mindverse Computing · Mindverse Studio</p>{social}</div></div></footer>'''


def crosslinks(current):
    cards=''.join(f'<a href="{a["id"]}.html" style="--area:{a["accent"]}"><span>{a["name"]}</span><strong>{a["verb"]}</strong>{ARROW}</a>' for a in AREAS if a['id']!=current)
    return f'<section class="section section-line studio-crosslinks"><div class="shell"><p class="eyebrow">Continue exploring Mindverse Studio</p><h2>Another way in.</h2><div class="crosslink-grid">{cards}</div></div></section>'


def page(name,title,description,body,area=None):
    styles=[];scripts=[]
    if name=='index.html' or area in ('learning','meditation'):styles.append('learning.css');scripts.append('journey.js')
    if name=='index.html':scripts+=['music-engine.js','motion-engine.js','home-visuals.js']
    if area=='learning':scripts.append('intuition-graph.js')
    if area=='meditation':styles.append('meditation.css')
    if area=='music':scripts+=['music-engine.js','music-lab.js']
    if area=='dance':styles.append('dance.css');scripts+=['motion-engine.js','music-engine.js','motion-studio.js']
    styles.append('studio.css')
    css=''.join(f'<link rel="stylesheet" href="css/{s}">' for s in styles)
    contact='<script defer src="js/contact-service.js"></script>' if name=='contact.html' else ''
    js=''.join(f'<script defer src="js/{s}"></script>' for s in scripts)
    base='<base href="/">' if name=='404.html' else ''
    html=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{base}<meta name="theme-color" content="#080b12"><meta name="author" content="Mindverse Computing"><meta name="robots" content="noindex,follow"><meta name="referrer" content="strict-origin-when-cross-origin"><title>{e(title)} — Mindverse Studio</title><meta name="description" content="{e(description,quote=True)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Mindverse Studio"><meta property="og:title" content="{e(title,quote=True)}"><meta property="og:description" content="{e(description,quote=True)}"><meta name="twitter:card" content="summary"><link rel="icon" href="images/favicon-32.png" type="image/png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>{css}{contact}<script defer src="js/subscription-service.js"></script><script defer src="js/studio.js"></script>{js}</head><body data-section="{area or ('home' if name=='index.html' else 'studio')}" class="{'home-page' if name=='index.html' else 'category-page' if area else 'inner-page'}">{nav(name)}<main id="main">{body}{crosslinks(area) if area else ''}</main>{footer()}</body></html>'''
    (ROOT/name).write_text(html+'\n')


def append_intro(body,id,eyebrow=None):
    body=body.replace('<section class="page-intro shell">',f'<section class="section shell appendix-intro" id="{id}">',1).replace('<h1>','<h2>',1).replace('</h1>','</h2>',1)
    if eyebrow:body=re.sub(r'(<section[^>]+>\s*<p class="eyebrow">).*?(</p>)',lambda m:m.group(1)+eyebrow+m.group(2),body,count=1,flags=re.S)
    return body


def research_part(area,id):
    b=SOURCE[area]['research']
    match=re.search(r'<section class="section section-line" id="references">(.*?)</section>',b,re.S)
    return '<section class="section section-line" id="'+id+'">'+match.group(1)+'</section>'


def intuition_visual(instance):
    source=(ROOT/'images/learning/intuition.svg').read_text().strip()
    prefix='intuition-'+instance+'-'
    ids=re.findall(r'\bid="([^"]+)"',source)
    for id in ids:
        source=source.replace('id="'+id+'"','id="'+prefix+id+'"').replace('url(#'+id+')','url(#'+prefix+id+')')
    source=source.replace('aria-labelledby="title desc"',f'aria-labelledby="{prefix}title {prefix}desc"')
    return f'<div class="intuition-visual" data-intuition-visual="{instance}">{source}<button class="intuition-toggle" type="button" aria-pressed="false">Pause signals</button></div>'


def intuition_roles():
    model=json.loads((ROOT/'records/intuition-model.json').read_text())
    roles=''.join(f'<div><dt>{e(a["name"])}</dt><dd>{e(a["description"])}</dd></div>' for a in model['roles'])
    return f'<section class="intuition-role-guide" aria-label="Roles in the Intuition model"><h3>Five roles.<br>Mind at the centre.</h3><dl>{roles}</dl><p class="small-note">{e(model["note"])}</p></section>'


def studio_gallery():
    descriptions={
        'learning':('Explore seven worlds through visual models, focused questions, and reflection. Build understanding, then choose your next question.','Visual learning · Seven paths','Quantum Matter represented by abstract state geometry'),
        'music':('Imagine a musical direction. Hear an original sound sketch, refine the next phrase, and keep what resonates.','Sound lab · BCI research vision','Signal traces flowing into a musical phrase and listener feedback'),
        'dance':('Give a fluid or plasma-inspired form its own movement. Shape the motion, add music, and create a short audiovisual study.','Motion studio · BCI research vision','A fluid-inspired ribbon twisting through space'),
        'meditation':('Follow an artistic journey from root to crown. Explore lotus forms, colours, seed sounds, and a quieter space for reflection.','Artistic contemplation','A red four-petalled lotus and earth square representing Root Chakra')
    }
    rail=''.join(f'<a href="#world-{a["id"]}" data-chapter-link="{i}"><span>{i+1:02}</span>{a["name"]}</a>' for i,a in enumerate(AREAS))
    panels=''
    for i,a in enumerate(AREAS):
        description,scope,alt=descriptions[a['id']]
        live=''
        if a['id'] in ('music','dance'):
            label='A silent animated score with flowing musical patterns' if a['id']=='music' else 'An artistic dancing fluid ribbon or plasma filament study'
            controls='<div class="home-materials" role="group" aria-label="Dance preview material"><button type="button" data-home-material="fluid" aria-pressed="true">Fluid</button><button type="button" data-home-material="plasma" aria-pressed="false">Plasma</button></div>' if a['id']=='dance' else '<span class="home-art-caption">A melody in motion</span>'
            live=f'<div class="home-live-art" data-home-art="{a["id"]}"><canvas data-home-canvas="{a["id"]}" role="img" aria-label="{label}" hidden></canvas>{controls}</div>'
        panels+=f'''<article class="world-panel studio-world studio-world-{a['id']}" id="world-{a['id']}" data-world="{a['id']}" data-index="{i}" data-accent="{a['accent']}" style="--accent:{a['accent']}"><figure class="world-art"><img src="{a['hero']}" width="1000" height="1000" alt="{e(alt)}">{live}<figcaption>{a['name'].upper()}</figcaption></figure><div class="world-copy"><p class="eyebrow">{i+1:02} / {a['subtitle']}</p><h2>{a['name']}<span class="title-dot">.</span></h2><p class="world-subtitle">{a['verb']}</p><p class="world-description">{description}</p><span class="path-kind">{scope}</span><a class="text-link" href="{a['id']}.html">Explore {a['name']} {ARROW}</a></div></article>'''
    track=''.join(f'<li data-step="{i}"></li>' for i in range(len(AREAS)))
    return f'''<section class="journey studio-journey" id="journey" aria-label="Four ways into Mindverse Studio"><div class="journey-stage"><div class="stage-aura" aria-hidden="true"></div><div class="shell exhibit"><div class="exhibit-heading"><div><p class="eyebrow">Mindverse Computing / Studio</p><h1>One Studio.<br><em>Four ways in.</em></h1></div><p>Learn. Create. Move. Reflect.<span>Scroll to find your next direction.</span><a class="gallery-guide-link" href="#explore">All four at a glance ↗</a></p></div><div class="exhibit-body"><nav class="chapter-rail" aria-label="Jump to a Studio area">{rail}</nav><div class="worlds">{panels}</div></div><div class="journey-controls"><p class="scroll-cue"><span aria-hidden="true">↓</span> Scroll to explore</p><div class="journey-progress" role="progressbar" aria-label="Studio journey progress" aria-valuemin="1" aria-valuemax="4" aria-valuenow="1"><span></span></div><div class="chapter-controls"><button type="button" data-prev aria-label="Previous Studio area">←</button><span class="chapter-count"><strong data-current>01</strong> / 04</span><button type="button" data-next aria-label="Next Studio area">→</button><button class="motion-toggle" type="button" aria-pressed="false">Motion on</button></div></div></div></div><ol class="chapter-track" aria-hidden="true">{track}</ol></section>'''


def render():
    cards=''
    for i,a in enumerate(AREAS):
        features=''.join(f'<li>{e(t)}</li>' for t in a['features'])
        cards+=f'''<article class="studio-portal portal-{a['id']}" id="{a['id']}" data-category="{a['id']}" style="--area:{a['accent']}"><a class="portal-art" href="{a['id']}.html" aria-label="Explore {a['name']}"><img src="{a['image']}" alt="Representative {a['name'].lower()} artwork" width="760" height="500" loading="lazy"><span>0{i+1} / {a['name']}</span></a><div class="portal-copy"><p class="eyebrow">{a['subtitle']}</p><h3>{a['verb']}</h3><p>{a['description']}</p><ul>{features}</ul><div class="portal-bottom"><a class="text-link" href="{a['id']}.html">Explore {a['name']} {ARROW}</a><span>{a['status']}</span></div></div></article>'''
    home=f'''{studio_gallery()}<section class="manifesto section-line"><div class="shell manifesto-grid"><p class="eyebrow">One Studio. Four ways in.</p><h2>Follow an idea.<br><span>See where it takes you.</span></h2><p>Mindverse Studio brings learning, creative expression, movement, and reflection into one place. Go deep in a single direction, then find connections across the others.</p></div></section><section class="section" id="explore"><div class="shell"><div class="section-head"><div><p class="eyebrow">Explore Mindverse Studio</p><h2>Choose your<br><span>next direction.</span></h2></div><p>Each area has its own dedicated space, visual language, and way to participate.</p></div><div class="portal-grid">{cards}</div></div></section><section class="section section-line studio-connections"><div class="shell research-split"><div><p class="eyebrow">Connected by exploration</p><h2>Understand an idea.<br><span>Give it a form.</span></h2></div><div><p>Learning starts with a question and a model. Music and Dance turn creative direction into something to hear or see. Meditation offers a different pace for observation and reflection.</p><p>The Studio preserves these different modes. Scientific learning uses sources and self-checks; the Music and Dance BCI loops are research visions with working manual previews; Meditation presents artistic and traditional symbolism.</p><a class="text-link" href="about.html">How the Studio fits together {ARROW}</a></div></div></section><section class="section section-line"><div class="shell closing"><p class="eyebrow">A question, a collaboration, a next idea</p><h2>Bring your curiosity<br>into the Studio.</h2><a class="button" href="contact.html">Start a conversation {ARROW}</a></div></section>'''
    page('index.html','Curiosity and creation','Mindverse Studio brings together Superlearning, Music, Dancing Thought and Meditation, with dedicated galleries, sound sketches, motion studies and reflection.',home)
    learning=remap(SOURCE['learning']['index'],'learning').replace('An exploration in Superlearning','Mindverse Studio / Learning')
    learning=learning.replace('Scroll through seven learning paths.</span>','Scroll through seven learning paths.</span><a class="gallery-guide-link" href="#paths">Path library ↗</a>')
    learning+=append_intro(remap(SOURCE['learning']['paths'],'learning'),'paths','Learning / The path library')
    approach=remap(SOURCE['learning']['approach'],'learning');approach=re.sub(r'^<section class="page-intro shell">.*?</section>','',approach,count=1,flags=re.S);approach=approach.replace('<section class="section section-line">','<section class="section section-line" id="learning-method">',1)
    learning+=approach
    # Both copies share the artwork; assign stable, unique SVG IDs for each location.
    visuals=iter(['gallery','library'])
    learning=re.sub(r'<img src="images/learning/intuition\.svg"[^>]*>',lambda m:intuition_visual(next(visuals)),learning)
    learning=learning.replace('class="world-panel" id="world-intuition"','class="world-panel intuition-world" id="world-intuition"')
    learning=learning.replace('<article class="path-detail" id="intuition"', '<article class="path-detail intuition-detail" id="intuition"')
    learning=re.sub(r'(<article class="path-detail intuition-detail" id="intuition".*?<ul class="topic-tags">.*?</ul>)',lambda m:m.group(1)+intuition_roles(),learning,count=1,flags=re.S)
    page('learning.html','Learning · Superlearning','Seven Superlearning paths with a central scroll gallery, visual models, source-backed starter questions and a structured learning loop.',learning,'learning')
    music=remap(SOURCE['music']['index'],'music').replace('Mindverse Computing / BCI applications','Mindverse Studio / Music')
    page('music.html','Music · Mind in the loop','Explore the Music BCI research vision and a playable manual sound lab with original melodies, feedback controls and WAV export.',music,'music')
    dance=remap(SOURCE['dance']['index'],'dance').replace('Mindverse Computing / Creative BCI','Mindverse Studio / Dance')
    page('dance.html','Dance · Dancing Thought','Explore dancing fluid, plasma-inspired forms and future characters, with a manual motion studio, optional music and browser video export.',dance,'dance')
    meditation=remap(SOURCE['meditation']['index'],'meditation').replace('Kundalini · An artistic meditation','Mindverse Studio / Meditation')
    meditation=meditation.replace('Scroll through seven symbolic centres.</span>','Scroll through seven symbolic centres.</span><a class="gallery-guide-link" href="#centres">Centre guide ↗</a>')
    meditation+=append_intro(remap(SOURCE['meditation']['centres'],'meditation'),'centres','Meditation / The seven centres')
    practice=remap(SOURCE['meditation']['practice'],'meditation');practice=re.sub(r'<section class="section section-line"><div class="shell"><p class="eyebrow">An image to return to.*$','',practice,flags=re.S)
    meditation+=append_intro(practice,'practice','Meditation / A quiet practice')
    meditation+=append_intro(remap(SOURCE['meditation']['tradition'],'meditation'),'traditions','Meditation / Symbols &amp; tradition')
    page('meditation.html','Meditation · Stillness in colour','An artistic seven-centre chakra journey with original imagery, colours, elements, seed sounds, reflections and tradition references.',meditation,'meditation')
    rows=''.join(f'<tr><th scope="row"><a href="{a["id"]}.html">{a["name"]} ↗</a></th><td>{a["meta"]}</td><td>{a["status"]}</td></tr>' for a in AREAS)
    about=f'''<section class="page-intro shell"><p class="eyebrow">About Mindverse Studio</p><h1>One creative space.<br><span>Four distinct explorations.</span></h1><p>A Mindverse Computing studio for visual learning, musical and moving expression, and contemplative reflection. Shared curiosity connects the work; each area keeps its own purpose and foundations.</p></section><section class="section section-line"><div class="shell research-split"><div><p class="eyebrow">A coherent place to explore</p><h2>Learn. Create.<br><span>Move. Reflect.</span></h2></div><div><p>Learning develops understanding through visual models, structured questions, and self-checks. Music and Dance explore how imagined direction and listening or viewing responses might shape creative work through future BCI systems.</p><p>Meditation brings an artistic perspective to chakra imagery, seed sounds, and reflective practice. Scientific models, creative research, and spiritual symbolism are presented with their different forms of evidence intact.</p><p>The home page introduces all four areas. Their dedicated pages preserve the original galleries, study material, sound and motion previews, and contextual references.</p></div></div></section><section class="section section-line" id="principles"><div class="shell"><p class="eyebrow">What you can explore now</p><h2>Different experiences.<br>Clear scope.</h2><div class="studio-table-wrap" tabindex="0" aria-label="Studio experience summary"><table><thead><tr><th scope="col">Area</th><th scope="col">Experience</th><th scope="col">Current scope</th></tr></thead><tbody>{rows}</tbody></table></div><p class="small-note">The website does not connect to BCI hardware or infer a visitor’s mental state. Music and Dance provide manual creative previews of proposed research experiences.</p></div></section><section class="section section-line" id="music-platform"><div class="shell research-split"><div><p class="eyebrow">Music / The proposed platform</p><h2>Intention into sound.<br><span>Listening into feedback.</span></h2></div><div><p>The proposed loop is Imagine → Interpret → Generate → Listen → Refine. Calibrated BCI features would contribute musical direction, a composer would propose a phrase, and the listener’s subsequent response and direct preferences would guide the next version.</p><p>The return channel is the music the person hears. A complete system needs acquisition hardware, personal calibration, signal-quality checks, a conditional composer, and participant evaluation. The sound lab here implements original local synthesis and explicit musical controls.</p><a class="text-link" href="music.html#sound-lab">Try the sound lab {ARROW}</a></div></div></section>{research_part('music','music-research')}<section class="section section-line" id="dance-platform"><div class="shell research-split"><div><p class="eyebrow">Dance / The proposed experience</p><h2>Motion to see.<br><span>Music to hear.</span></h2></div><div><p>The proposed Dancing Thought loop is Imagine → Propose → Experience → Respond → Refine. An imagined gesture, form, or character would help direct an audiovisual proposal, with subsequent BCI response patterns and explicit keep, revise, or reject feedback informing refinement.</p><p>The motion studio here provides artistic procedural fluid and plasma geometry, original synthesized music, frame export, and browser-based clip rendering. BCI interpretation, learned video generation, and character rigs remain future development.</p><a class="text-link" href="dance.html#motion-studio">Try the motion studio {ARROW}</a></div></div></section>{research_part('dance','dance-research')}<section class="section section-line"><div class="shell research-split"><div><p class="eyebrow">Learning &amp; Meditation</p><h2>Sources for the science.<br><span>Context for the symbols.</span></h2></div><div><p>The Learning paths connect established scientific concepts with mathematical reasoning. Intuition connects logic and mathematical reasoning with a conceptual graph of Mind; Singularity explores the convergence of knowledge across disciplines. The Learning page preserves task → strategy → knowledge → validation → execution as an organizing loop.</p><p>The Meditation gallery presents contemporary artistic interpretations of chakra symbolism, with a familiar rainbow palette and notes on variations across sources and traditions. Its guide includes open reflections and reference links.</p><div class="about-links"><a class="text-link" href="learning.html#learning-method">The learning loop {ARROW}</a><a class="text-link" href="meditation.html#traditions">Symbols &amp; tradition {ARROW}</a></div></div></div></section>'''
    page('about.html','The Studio','How Learning, Music, Dance and Meditation connect within Mindverse Studio, including current capabilities and the research context for BCI creative applications.',about)
    options=''.join(f'<option value="{a["id"]}">{a["name"]}</option>' for a in AREAS)
    contact=f'''<section class="page-intro shell"><p class="eyebrow">A Studio conversation</p><h1>Where would you<br><span>like to begin?</span></h1><p>Share a learning question, a creative idea, a reflection, or a collaboration across Mindverse Studio.</p></section><section class="section section-line"><div class="shell contact-grid"><div class="contact-copy"><p class="eyebrow">Get in touch</p><h2>One Studio.<br>A new conversation.</h2><p>Choose Learning, Music, Dance, or Meditation, and tell us what you would like to explore. Questions spanning more than one area are welcome.</p><div class="contact-area-links">{''.join(f'<a href="{a["id"]}.html">{a["name"]} ↗</a>' for a in AREAS)}</div></div><form id="studio-contact-form" class="contact-form"><fieldset disabled><legend>Send a Studio inquiry</legend><div class="form-grid"><div class="form-field"><label for="name">Full name</label><input id="name" name="name" autocomplete="name" maxlength="120" required></div><div class="form-field"><label for="email">Email address</label><input id="email" name="email" type="email" autocomplete="email" maxlength="180" required></div><div class="form-field full"><label for="organization">Organization <span>Optional</span></label><input id="organization" name="organization" autocomplete="organization" maxlength="160"></div><div class="form-field"><label for="interest">Area of interest</label><select id="interest" name="interest"><option value="general">The Studio / More than one area</option>{options}</select></div><div class="form-field"><label for="subject">Inquiry</label><select id="subject" name="subject"><option>Collaboration</option><option>Learning question</option><option>Research question</option><option>Creative feedback</option><option>Something else</option></select></div><div class="form-field full"><label for="topic">Path or topic <span>Optional</span></label><input id="topic" name="topic" maxlength="160" placeholder="A learning path, musical idea, motion study, or centre"></div><div class="form-field full"><label for="message">Your idea or question</label><textarea id="message" name="message" maxlength="5000" placeholder="Tell us what you have in mind." required></textarea></div></div><button class="button" type="submit">Send inquiry {ARROW}</button></fieldset><p class="small-note">We’ll use the details you provide to respond to your inquiry.</p><p id="contact-status" class="form-status" role="status" aria-live="polite" tabindex="-1"></p><button class="subtle-button" id="copy-inquiry" type="button" hidden>Copy your message</button><noscript>Enable JavaScript to use this form.</noscript></form></div></section>'''
    page('contact.html','Get in touch','Contact Mindverse Studio about Learning, Music, Dance, Meditation and collaborations across the Studio.',contact)
    page('404.html','Find your way back','Return to the four Mindverse Studio explorations.','<section class="page-intro shell not-found"><p class="eyebrow">404 / A small detour</p><h1>Find another<br>way into the Studio.</h1><p>This page is not part of the current Studio. Return home to explore Learning, Music, Dance, and Meditation.</p><a class="button" href="index.html#explore">Explore the Studio ↗</a></section>')
    (ROOT/'robots.txt').write_text('User-agent: *\nAllow: /\n')
    (ROOT/'records/studio-areas.json').write_text(json.dumps(AREAS,indent=2,ensure_ascii=False)+'\n')
    print('Rendered Mindverse Studio: home, four category pages, About, Contact and 404.')

if __name__=='__main__':render()
