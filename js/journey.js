(() => {
  'use strict';
  const journey = document.getElementById('journey');
  if (journey) {
    const stage = journey.querySelector('.journey-stage');
    const panels = [...journey.querySelectorAll('.world-panel')];
    const links = [...journey.querySelectorAll('[data-chapter-link]')];
    const previous = journey.querySelector('[data-prev]');
    const next = journey.querySelector('[data-next]');
    const counter = journey.querySelector('[data-current]');
    const progress = journey.querySelector('[role="progressbar"]');
    const motionButton = journey.querySelector('.motion-toggle');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let active = -1;
    let enhanced = false;
    let frame = 0;
    let top = 0;
    let range = 1;
    let targetIndex = null;
    let paused = false;
    const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

    function setActive(index) {
      if (active === index) return;
      active = index;
      panels.forEach((panel, i) => {
        panel.classList.toggle('is-active', i === active);
        panel.classList.toggle('is-before', i < active);
        panel.setAttribute('aria-hidden', String(enhanced && i !== active));
        panel.inert = enhanced && i !== active;
      });
      links.forEach((link, i) => {
        if (i === active) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
      journey.style.setProperty('--scene-color', panels[active].dataset.accent);
      counter.textContent = String(active + 1).padStart(2, '0');
      progress.setAttribute('aria-valuenow', String(active + 1));
      progress.setAttribute('aria-valuetext', `${active + 1} of ${panels.length}: ${panels[active].querySelector('h2').textContent}`);
      previous.disabled = active === 0;
      next.disabled = active === panels.length - 1;
    }

    function update() {
      frame = 0;
      if (!enhanced) return;
      const p = clamp((window.scrollY - top) / range, 0, 1);
      const position = p * (panels.length - 1);
      setActive(targetIndex ?? Math.round(position));
      journey.style.setProperty('--journey-progress', String((1 + position) / panels.length));
      if (targetIndex !== null && Math.abs(position - targetIndex) < .025) targetIndex = null;
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    function measure() {
      const canEnhance = window.innerHeight >= 640 && CSS.supports('position', 'sticky');
      enhanced = canEnhance;
      journey.classList.toggle('is-enhanced', enhanced);
      top = journey.getBoundingClientRect().top + window.scrollY;
      range = Math.max(1, journey.offsetHeight - stage.offsetHeight);
      active = -1;
      if (enhanced) update();
      else {
        panels.forEach(panel => {
          panel.removeAttribute('aria-hidden');
          panel.inert = false;
          panel.classList.remove('is-active', 'is-before');
        });
        links.forEach(link => link.removeAttribute('aria-current'));
      }
    }

    function goTo(index, animate = true) {
      if (!enhanced) return;
      const i = clamp(index, 0, panels.length - 1);
      targetIndex = i;
      setActive(i);
      const destination = top + range * i / (panels.length - 1);
      window.scrollTo({top: destination, behavior: animate && !reducedMotion.matches ? 'smooth' : 'instant'});
      history.replaceState(null, '', '#world-' + panels[i].dataset.world);
      schedule();
    }

    links.forEach((link, index) => link.addEventListener('click', event => {
      if (!enhanced || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      goTo(index);
    }));
    previous.addEventListener('click', () => goTo((targetIndex ?? active) - 1));
    next.addEventListener('click', () => goTo((targetIndex ?? active) + 1));
    journey.querySelector('.chapter-controls').addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || !enhanced) return;
      event.preventDefault();
      if (event.key === 'Home') goTo(0);
      else if (event.key === 'End') goTo(panels.length - 1);
      else goTo((targetIndex ?? active) + (event.key === 'ArrowRight' ? 1 : -1));
    });

    function updateMotion() {
      const stop = paused || reducedMotion.matches;
      journey.dataset.motion = stop ? 'paused' : 'playing';
      motionButton.textContent = stop ? 'Motion off' : 'Motion on';
      motionButton.setAttribute('aria-pressed', String(stop));
      motionButton.setAttribute('aria-label', stop ? 'Resume ambient motion' : 'Pause ambient motion');
      motionButton.disabled = reducedMotion.matches;
    }
    motionButton.addEventListener('click', () => { paused = !paused; updateMotion(); });
    reducedMotion.addEventListener('change', updateMotion);
    window.addEventListener('scroll', schedule, {passive: true});
    window.addEventListener('wheel', () => { targetIndex = null; }, {passive: true});
    window.addEventListener('touchmove', () => { targetIndex = null; }, {passive: true});
    window.addEventListener('resize', measure);
    measure();
    requestAnimationFrame(() => requestAnimationFrame(() => { journey.dataset.ready = 'true'; }));
    updateMotion();
    window.addEventListener('hashchange', () => {
      const index = panels.findIndex(panel => '#world-' + panel.dataset.world === location.hash);
      if (index >= 0 && enhanced) goTo(index, false);
    });
    const requested = location.hash.replace('#world-', '');
    const requestedIndex = panels.findIndex(panel => panel.dataset.world === requested);
    if (requestedIndex >= 0) {
      const restoreChapter = () => requestAnimationFrame(() => {
        measure();
        if (enhanced) goTo(requestedIndex, false);
      });
      if (document.readyState === 'complete') restoreChapter();
      else window.addEventListener('load', restoreChapter, {once: true});
    }
  }


})();
