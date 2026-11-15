# Mindverse Studio

A self-contained integration of Learning, Music, Dance, and Meditation. All work is inside `Studio/Integrated`. The sibling websites and archive remain independent.

## Pages and experiences

| Page | Contents |
| --- | --- |
| `index.html` | Central scrolling gallery: Learning → Music → Dance → Meditation, chapter controls, motion toggle, and four detailed category portals |
| `learning.html` | Seven-world scrolling gallery, seven learning paths, starter questions with explanations and sources, five-step learning method |
| `music.html` | BCI music research vision, five-stage creative loop, playable manual sound lab, refinement, original WAV export, use cases |
| `dance.html` | Dancing Thought research vision, fluid/plasma studies, motion and music controls, refinement, frame export and eight-second video rendering |
| `meditation.html` | Seven-centre chakra gallery, centre guide, symbolic attributes and sounds, reflection prompts, quiet practice, traditional references |
| `about.html` | Shared principles, Music and Dance platform visions, research context and original references |
| `contact.html` | Shared inquiry form with category and topic prefill |
| `404.html` | Studio navigation for missing pages |

The home gallery keeps one area in the central display as the visitor scrolls. Chapter links, previous/next buttons, and keyboard controls provide alternate navigation; every panel opens its dedicated page. The ambient motion toggle and reduced-motion preference are supported. Short screens and browsers without the scroll enhancement show all four areas in normal page flow. The detailed overview remains below the gallery at `#explore`.

Music's home artwork animates an original score, harmonic contours, and rhythmic pulses. Dance's home artwork uses the existing motion geometry with Fluid and Plasma choices. These silent canvases are controlled by `js/home-visuals.js`, loaded only on the home page. Animation stops when paused, inactive, off-screen, or the page is hidden; reduced-motion and short-screen layouts keep a static frame. Static images remain available if canvas cannot initialize. `tools/test_home_visuals.cjs` checks this lifecycle, material selection, and fallback behavior.

Learning connects five physical science paths with Intuition (logic and mathematics) and Singularity (the convergence of knowledge). Meditation presents traditional and artistic symbolism. Music and Dance's functional previews use manual controls; live BCI acquisition, inference, and adaptive generation remain research directions. The Dance geometry is artistic, not a physical simulation. Sound starts only after user interaction.

The site reuses the source websites' original diagrams, procedural geometry, synthesis, and chakra artwork. No new external image dependency is required. Public imagery is namespaced under `images/learning`, `images/music`, `images/dance`, and `images/meditation`.

## Local preview

From this directory:

```sh
python3 -m http.server 8774 --bind 127.0.0.1
```

Open `http://127.0.0.1:8774/`. Serve the folder over HTTP rather than opening HTML files directly. Stop the preview with Ctrl+C.

## Updating this version

`tools/render_studio.py` composes the eight pages from local source snapshots in `records/source-content.json`, the local catalog files, and its shared Studio templates. `records/source-manifest.json` records the original input hashes. The renderer reads no sibling directory. Edit this version's snapshots, local assets, and templates, then run:

```sh
python3 tools/render_learning_art.py
python3 tools/render_studio.py
python3 tools/build_release.py
python3 tools/test_build_release.py
```

Run the release builder again after changing CSS, JavaScript, configuration, or public imagery. It updates cache fingerprints, top-level public files, the `release` copy, and ZIP together. Generated HTML edits can be overwritten by the renderer. Do not update sibling websites to make changes here.

Intuition focuses on logic and mathematics, with a reference to MIT OpenCourseWare. Singularity focuses on the convergence of knowledge, with an open synthesis exercise. Its artwork preserves the previous layered geometric illustration under the new name. These vector illustrations can be regenerated with `python3 tools/render_learning_art.py`. Learning-specific names, descriptions, questions, and links live in the local Learning content snapshots and catalog; the Meditation centre names remain separate.

Intuition uses an inverted pentagon with Mind at the centre. Its five vertices are Ego (a pointer to a place and moment), Memory (knowledge), Intellect (strategy), Sense (observation), and Action (end-to-end orchestration). Signals flow along its edges and central connections, while Ego, at the bottom vertex, acts as a pen nib tracing the decision history in temporal flow. The gallery and library copies pause together, respect reduced motion, and stop work when hidden or off-screen. The larger library illustration includes its own pause control. The model is a conceptual framework. Role definitions are stored in `records/intuition-model.json`; signal-flow and pause behavior are checked by `tools/test_intuition_graph.cjs`.

Pure engine checks are retained in `tools/test_music_engine.cjs` and `tools/test_motion_engine.cjs`; run with Node.js. These cover score determinism, feedback changes, finite audio and motion, WAV encoding, and motion/score timing. Package tests cover missing links and assets, complete journeys and loops, destination privacy, deterministic packaging, and subpath hosting.

## Contact and newsletter

`deployment.json` retains the existing Mindverse contact and shared newsletter service endpoints. The release builder injects them into the service clients. The public site contains no destination inbox address or Sheet ID. The inquiry form adds the Studio name, selected area, and topic to the inquiry; links can prefill `contact.html?interest=music&topic=creation`, for example.

Fields are white, labelled, and editable. Only one common form handler is loaded on each page. The newsletter clearly joins the shared Mindverse list. No new inquiry or subscription was submitted during this integration, and Apps Script/Sheets were not modified. Prior service delivery does not constitute a fresh Studio delivery test.

## Release package

`release/mindverse-studio-website.zip` contains only the 56 public files at the ZIP root. It excludes tools, records, local configuration, preparation files, and this README. The same public files are present at top level and under `release` for convenience. Upload the extracted ZIP contents, not the whole preparation folder.

The builder validates local links and anchors, CSS asset paths, image formats, unique IDs, page branding, ordered category journeys, service configuration, ZIP integrity, and byte-for-byte source/release parity. `records/release-validation.json` and `records/release-manifest.json` contain the result and hashes.

No Studio hosting address has been selected and nothing has been published. `base_url` and `custom_domain` are blank; pages are marked `noindex,follow`. When a destination is chosen, set `base_url` to its full HTTPS address (including any project subpath), and optionally set a matching `custom_domain`. Rebuild to create correct canonical URLs, sitemap, 404 base path, indexing metadata, and optional CNAME. Do not reuse another website's domain configuration without choosing it for Studio.
