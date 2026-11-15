#!/usr/bin/env python3
"""Integration and release regression checks; temporary files, no external services."""
import contextlib
import io
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
import build_release as release

ROOT = release.ROOT

class StudioReleaseTests(unittest.TestCase):
    def setUp(self):
        self.sources = {name: (ROOT / name).read_bytes() for name in release.FILES}

    def reject(self, filename, before, after, message):
        self.assertIn(before, self.sources[filename])
        self.sources[filename] = self.sources[filename].replace(before, after, 1)
        with self.assertRaisesRegex(ValueError, message):
            release.validate_sources(self.sources)

    def test_all_experiences_have_resolved_links_and_assets(self):
        result = release.validate_sources(self.sources)
        self.assertEqual(result['public_pages'], 8)
        self.assertEqual(result['studio_areas'], ['learning','music','dance','meditation'])

    def test_broken_cross_page_link_is_rejected(self):
        self.reject('index.html', b'href="learning.html"', b'href="../Learning/index.html"', 'missing public target')

    def test_missing_journey_world_is_rejected(self):
        self.reject('learning.html', b'data-world="fluid-dynamics"', b'data-world="missing"', 'Learning journey order')
        self.sources = {name: (ROOT / name).read_bytes() for name in release.FILES}
        self.reject('meditation.html', b'data-world="agna"', b'data-world="missing"', 'Meditation journey order')

    def test_home_gallery_cannot_lose_an_area(self):
        self.reject('index.html', b'data-world="music"', b'data-world="missing"', 'Studio home gallery')

    def test_home_animation_dependency_cannot_be_dropped(self):
        self.reject('index.html', b'src="js/home-visuals.js', b'data-unused="js/home-visuals.js', 'animation dependencies')

    def test_intuition_graph_cannot_lose_its_library_view(self):
        self.reject('learning.html', b'data-intuition-visual="library"', b'data-unused="library"', 'Intuition graph views')

    def test_incomplete_music_loop_is_rejected(self):
        self.reject('music.html', b'data-loop-tab="refine"', b'data-loop-tab="missing"', 'Music loop is incomplete')

    def test_unresolved_css_fallback_is_rejected(self):
        self.sources['css/dance.css'] += b'\n.test { background-image: url(../images/missing.svg); }'
        with self.assertRaisesRegex(ValueError, 'missing CSS asset'):
            release.validate_sources(self.sources)

    def test_public_inbox_address_is_rejected(self):
        self.sources['contact.html'] += b'contact@mindversecomputing.com'
        with self.assertRaisesRegex(ValueError, 'Private destination'):
            release.validate_sources(self.sources)

    def test_reproducible_public_only_zip_and_subpath_hosting(self):
        with tempfile.TemporaryDirectory(prefix='mindverse-studio-test-') as directory:
            root = Path(directory)
            for name, content in self.sources.items():
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(content)
            config = json.loads((ROOT / 'deployment.json').read_text())
            (root / 'deployment.json').write_text(json.dumps(config))
            # A preparation file must never enter the public package.
            (root / 'private-preparation.txt').write_text('not a public asset')
            old = release.ROOT
            release.ROOT = root
            try:
                with contextlib.redirect_stdout(io.StringIO()):
                    release.build()
                    archive = root / 'release/mindverse-studio-website.zip'
                    first = archive.read_bytes()
                    release.build()
                    self.assertEqual(first, archive.read_bytes())
                    with zipfile.ZipFile(archive) as z:
                        self.assertEqual(set(z.namelist()), set(release.FILES))
                        for name in z.namelist():
                            self.assertEqual(z.read(name), (root / name).read_bytes())
                            self.assertEqual(z.read(name), (root / 'release' / name).read_bytes())
                    config['base_url'] = 'https://example.org/studio'
                    (root / 'deployment.json').write_text(json.dumps(config))
                    output = release.build()
                    self.assertIn(b'<base href="/studio/">', output['404.html'])
                    self.assertIn(b'https://example.org/studio/music.html', output['sitemap.xml'])
                    self.assertIn(b'content="index,follow"', output['index.html'])
                    self.assertIn(b'content="noindex,follow"', output['404.html'])
            finally:
                release.ROOT = old

if __name__ == '__main__':
    unittest.main()
