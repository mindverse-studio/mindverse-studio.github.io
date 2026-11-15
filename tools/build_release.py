#!/usr/bin/env python3
"""Validate and package Mindverse Studio. Local files only; never publishes."""
from pathlib import Path
from html.parser import HTMLParser
from xml.etree import ElementTree
from urllib.parse import urlsplit, unquote
import hashlib, json, re, tempfile, zipfile, posixpath

ROOT = Path(__file__).resolve().parents[1]
PAGES = ['index.html', 'learning.html', 'music.html', 'dance.html', 'meditation.html', 'about.html', 'contact.html', '404.html']
REDIRECTS = []
AREAS = ['learning', 'music', 'dance', 'meditation']
LEARNING = ['quantum-matter','fluid-dynamics','plasma-dynamics','electrodynamics','space-time','intuition','singularity']
CHAKRAS = ['muladhar','swadhisthana','manipura','anahata','bishuddhi','agna','sahasrara']
ASSETS = ['css/studio.css','css/learning.css','css/meditation.css','css/dance.css',
          'js/studio.js','js/journey.js','js/home-visuals.js','js/intuition-graph.js','js/music-engine.js','js/music-lab.js','js/motion-engine.js','js/motion-studio.js','js/contact-service.js','js/subscription-service.js',
          'images/brand-mark.png','images/favicon-32.png']
ASSETS += [f'images/learning/{name}.svg' for name in LEARNING]+['images/learning/learning-loop.svg']
ASSETS += ['images/music/signal-to-score.svg']+[f'images/music/loop-{name}.svg' for name in ['imagine','interpret','generate','listen','refine']]
ASSETS += [f'images/music/application-{name}.svg' for name in ['inner-melody','personal-listening','responsive-instrument','co-creation']]
ASSETS += [f'images/dance/{name}.svg' for name in ['fluid-study','plasma-study','character-study','creative-loop']]
ASSETS += [f'images/meditation/{name}.jpg' for name in CHAKRAS]
FILES = PAGES + REDIRECTS + ASSETS + ['LICENSE', 'robots.txt', '.nojekyll']

class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.ids, self.refs, self.worlds, self.categories, self.stages = [], [], [], [], []
        self.intuition_views = []
        self.h1 = 0
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'): self.ids.append(a['id'])
        if a.get('data-world'): self.worlds.append(a['data-world'])
        if a.get('data-category'): self.categories.append(a['data-category'])
        if a.get('data-loop-tab'): self.stages.append(a['data-loop-tab'])
        if a.get('data-intuition-visual'): self.intuition_views.append(a['data-intuition-visual'])
        if tag == 'h1': self.h1 += 1
        if tag in ('a', 'link') and a.get('href'): self.refs.append(a['href'])
        if tag in ('img', 'script') and a.get('src'): self.refs.append(a['src'])
        if tag == 'img' and 'alt' not in a: raise ValueError('Image has no alt text')

def digest(data):
    return hashlib.sha256(data).hexdigest()

def strip_versions(source):
    return re.sub(r'(\.(?:css|js|png|jpg|svg))\?v=[a-f0-9]{12}(?=["\'])', r'\1', source)

def validate_sources(sources):
    pages = {name: Page(sources[name].decode()) for name in PAGES}
    for name, page in pages.items():
        if len(page.ids) != len(set(page.ids)): raise ValueError(f'Duplicate ID in {name}')
        if page.h1 != 1: raise ValueError(f'Expected one main heading in {name}')
        source = sources[name].decode()
        if 'Mindverse Studio' not in source: raise ValueError(f'Wrong brand in {name}')
        if re.search(r'mailto:|contact@mindversecomputing|internal record', source, re.I):
            raise ValueError(f'Private destination or internal copy in {name}')
        for ref in page.refs:
            u = urlsplit(ref)
            if u.scheme or u.netloc: continue
            target = unquote(u.path) or name
            if target.startswith('/'): target = target.lstrip('/')
            if target not in sources: raise ValueError(f'{name}: missing public target {target}')
            if u.fragment and target in pages and unquote(u.fragment) not in pages[target].ids:
                raise ValueError(f'{name}: missing anchor {target}#{u.fragment}')
    if pages['index.html'].categories != AREAS: raise ValueError('Studio category order differs from the requested sequence')
    if pages['index.html'].worlds != AREAS: raise ValueError('Studio home gallery is incomplete or out of order')
    home_refs={urlsplit(ref).path for ref in pages['index.html'].refs}
    if not {'js/journey.js','js/home-visuals.js','js/music-engine.js','js/motion-engine.js'}.issubset(home_refs):
        raise ValueError('Studio home animation dependencies are incomplete')
    if pages['learning.html'].worlds != LEARNING: raise ValueError('Learning journey order differs')
    if pages['learning.html'].intuition_views != ['gallery','library'] or 'js/intuition-graph.js' not in {urlsplit(ref).path for ref in pages['learning.html'].refs}:
        raise ValueError('Intuition graph views or animation dependency are incomplete')
    if pages['meditation.html'].worlds != CHAKRAS: raise ValueError('Meditation journey order differs')
    if pages['music.html'].stages != ['imagine','interpret','generate','listen','refine']: raise ValueError('Music loop is incomplete')
    if pages['dance.html'].stages != ['imagine','propose','experience','respond','refine']: raise ValueError('Dance loop is incomplete')
    for name in ASSETS:
        if name.endswith('.svg'): ElementTree.fromstring(sources[name])
        if name.endswith('.jpg') and not (sources[name].startswith(b'\xff\xd8') and sources[name].endswith(b'\xff\xd9')): raise ValueError(f'Invalid JPEG: {name}')
        if name.endswith('.css'):
            for match in re.finditer(r"url\(\s*['\"]?([^'\")]+)", sources[name].decode()):
                u = urlsplit(match.group(1).strip())
                if u.scheme or u.netloc or not u.path: continue
                target = posixpath.normpath(str(Path(name).parent / unquote(u.path)))
                if target not in sources: raise ValueError(f'{name}: missing CSS asset {target}')
    for endpoint_file in ('js/contact-service.js', 'js/subscription-service.js'):
        if b'https://script.google.com/macros/s/' not in sources[endpoint_file]: raise ValueError('Form service not configured')
    return {'public_pages': len(PAGES), 'studio_areas': AREAS, 'home_gallery': AREAS, 'learning_worlds': LEARNING, 'meditation_centres': CHAKRAS,
            'local_links_and_anchors': 'passed', 'css_assets': 'passed', 'svg_and_jpeg_checks': 'passed', 'brand_and_inbox_privacy': 'passed'}

def build():
    config = json.loads((ROOT / 'deployment.json').read_text())
    base = config.get('base_url', '').rstrip('/')
    domain = config.get('custom_domain', '')
    if base:
        parts = urlsplit(base)
        if parts.scheme != 'https' or not parts.netloc or parts.query or parts.fragment:
            raise ValueError('base_url must be an HTTPS website address with no query or fragment')
    if domain and (not base or urlsplit(base).netloc != domain or '/' in domain):
        raise ValueError('custom_domain must match the configured website address')
    (ROOT / '.nojekyll').touch()
    sources = {name: (ROOT / name).read_bytes() for name in FILES}
    for key, filename in [('contact_endpoint', 'js/contact-service.js'), ('newsletter_endpoint', 'js/subscription-service.js')]:
        endpoint = config.get(key, '')
        if not re.fullmatch(r'https://script\.google\.com/macros/s/[A-Za-z0-9_-]+/exec', endpoint):
            raise ValueError(f'Invalid {key}')
        source, changes = re.subn(r'const endpoint = ["\'][^"\']*["\'];', f'const endpoint = "{endpoint}";', sources[filename].decode(), count=1)
        if changes != 1: raise ValueError(f'Cannot configure {filename}')
        sources[filename] = source.encode()
    for name in PAGES + REDIRECTS:
        source = strip_versions(sources[name].decode())
        source = re.sub(r'<link rel="canonical"[^>]*>|<meta property="og:url"[^>]*>', '', source)
        if name == '404.html':
            source = re.sub(r'<base href="[^"]*">', '<base href="' + (urlsplit(base).path.rstrip('/') + '/' if base else '/') + '">', source)
        if name in PAGES:
            source = re.sub(r'<meta name="robots"[^>]*>', '<meta name="robots" content="' + ('index,follow' if base and name != '404.html' else 'noindex,follow') + '">', source)
            if base:
                url = base + '/' + ('' if name == 'index.html' else name)
                source = source.replace('</head>', f'<link rel="canonical" href="{url}"><meta property="og:url" content="{url}"></head>')
        for asset in ASSETS:
            source = source.replace(f'"{asset}"', f'"{asset}?v={digest(sources[asset])[:12]}"')
        sources[name] = source.encode()
    sources['robots.txt'] = ('User-agent: *\nAllow: /\n' + (f'Sitemap: {base}/sitemap.xml\n' if base else '')).encode()
    if domain: sources['CNAME'] = (domain + '\n').encode()
    if base:
        items = [base + '/' + ('' if name == 'index.html' else name) for name in PAGES if name != '404.html']
        sources['sitemap.xml'] = ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join(f'<url><loc>{url}</loc></url>' for url in items) + '</urlset>\n').encode()
    report = validate_sources(sources)
    release = ROOT / 'release'
    release.mkdir(exist_ok=True)
    # Replace only files tracked by the prior Studio manifest, never local preparation files.
    previous_file = ROOT / 'records/release-manifest.json'
    previous = json.loads(previous_file.read_text()).get('files', {}) if previous_file.exists() else {}
    previous_names = list(previous) if isinstance(previous, dict) else [x['path'] if isinstance(x, dict) else x for x in previous]
    for name in previous_names:
        if name not in sources and (release / name).is_file(): (release / name).unlink()
    for optional in ('CNAME', 'sitemap.xml'):
        if optional not in sources: (ROOT / optional).unlink(missing_ok=True)
    for name, content in sources.items():
        path = release / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
        (ROOT / name).write_bytes(content)
    archive = release / 'mindverse-studio-website.zip'
    with tempfile.NamedTemporaryFile(dir=release, suffix='.zip', delete=False) as handle:
        temporary = Path(handle.name)
    try:
        with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
            for name, content in sorted(sources.items()):
                info = zipfile.ZipInfo(name, date_time=(2026, 11, 14, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o644 << 16
                z.writestr(info, content)
        temporary.replace(archive)
    finally:
        temporary.unlink(missing_ok=True)
    with zipfile.ZipFile(archive) as z:
        if z.testzip() or set(z.namelist()) != set(sources): raise ValueError('ZIP integrity failed')
        if any(z.read(name) != (ROOT / name).read_bytes() for name in sources): raise ValueError('Top-level source mismatch')
    records = ROOT / 'records'
    records.mkdir(exist_ok=True)
    (records / 'release-manifest.json').write_text(json.dumps({'site': 'Mindverse Studio', 'folder': 'Studio/Integrated', 'archive': str(archive.relative_to(ROOT)), 'files': {name: digest(content) for name, content in sorted(sources.items())}, 'zip_sha256': digest(archive.read_bytes())}, indent=2) + '\n')
    report.update({'status': 'local preview; no hosting address selected' if not base else 'static package prepared; not published',
                   'files': len(sources), 'zip_integrity_and_source_parity': 'passed',
                   'forms': 'Existing Mindverse services reused; editable fields checked locally. No new Studio submission sent.',
                   'scope': 'Learning previews, manual music and motion studios, artistic meditation gallery; Music and Dance BCI integration remains a research vision.',
                   'hosting': {'base_url': base, 'custom_domain': domain, 'search_indexing': bool(base)}})
    (records / 'release-validation.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f'Validated {len(sources)} public files. Package: {archive}')
    return sources

if __name__ == '__main__': build()
