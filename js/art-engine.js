/* Deterministic visual studies from explicit controls; no BCI data or inference. */
(() => {
  'use strict';
  const palettes = {
    twilight: ['#080b12', '#aa92d9', '#74c4c5', '#edb98e'],
    ocean: ['#07121a', '#93ced4', '#4b8da9', '#bfd0af'],
    ember: ['#170e17', '#d29b99', '#e3bf89', '#a38ec7'],
  };
  function normalize(input = {}) {
    const bounded = (key, fallback) =>
      Number.isFinite(Number(input[key]))
        ? Math.max(0, Math.min(100, Number(input[key])))
        : fallback;
    return {
      form: ['flow', 'bloom', 'geometry'].includes(input.form) ? input.form : 'flow',
      palette: Object.hasOwn(palettes, input.palette) ? input.palette : 'twilight',
      energy: bounded('energy', 45),
      density: bounded('density', 45),
      seed: Number.isFinite(Number(input.seed))
        ? Math.abs(Math.floor(Number(input.seed))) % 2147483647
        : 7,
    };
  }
  function render(input) {
    const settings = normalize(input),
      colors = palettes[settings.palette];
    let seed = settings.seed || 7;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const number = (value) => Number(value).toFixed(2);
    const count = 5 + Math.floor(settings.density / 12);
    let shapes = '';
    if (settings.form === 'flow') {
      for (let i = 0; i < count; i++) {
        const y = 140 + i * 31,
          drift = (random() - 0.5) * (110 + settings.energy * 2.5);
        const x = 70 + random() * 65,
          width = 35 + random() * 80;
        shapes += `<path d="M${number(x)} ${number(y)} C310 ${number(y - 170 - drift)} 650 ${number(y + 190 + drift)} 920 ${number(y - 40)} L920 ${number(y + width)} C650 ${number(y + 230 + drift)} 300 ${number(y - 80 - drift)} ${number(x)} ${number(y + width)}Z" fill="${colors[1 + (i % 3)]}" fill-opacity="${number(0.1 + random() * 0.14)}" stroke="${colors[1 + (i % 3)]}" stroke-opacity=".35" stroke-width="1.2"/>`;
      }
    } else if (settings.form === 'bloom') {
      const petals = 5 + Math.floor(settings.energy / 20);
      for (let i = count; i > 0; i--) {
        const radius = 58 + i * 19,
          phase = random() * 0.35;
        let curve = '';
        for (let j = 0; j <= 240; j++) {
          const angle = (j / 240) * Math.PI * 2;
          const r =
            radius * (1 + (0.08 + settings.energy / 700) * Math.sin(petals * angle + phase));
          curve +=
            (j ? 'L' : 'M') +
            number(500 + r * Math.cos(angle)) +
            ' ' +
            number(330 + r * 0.83 * Math.sin(angle));
        }
        shapes += `<path d="${curve}Z" fill="${colors[1 + (i % 3)]}" fill-opacity=".08" stroke="${colors[1 + (i % 3)]}" stroke-opacity=".60" stroke-width="2"/>`;
      }
    } else {
      for (let i = 0; i < count; i++) {
        const x = 180 + random() * 620,
          y = 145 + random() * 370;
        const radius = 45 + random() * (65 + settings.energy);
        shapes += `<circle cx="${number(x)}" cy="${number(y)}" r="${number(radius)}" fill="${colors[1 + (i % 3)]}" fill-opacity=".09" stroke="${colors[1 + (i % 3)]}" stroke-opacity=".65" stroke-width="1.5"/><path d="M${number(x - radius)} ${number(y)}L${number(x)} ${number(y - radius)}L${number(x + radius)} ${number(y)}" fill="none" stroke="${colors[1 + ((i + 1) % 3)]}" stroke-opacity=".4"/>`;
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="780" viewBox="0 0 1000 650" role="img" aria-labelledby="art-title art-desc"><title id="art-title">Think Art — ${settings.form} study</title><desc id="art-desc">An original procedural study shaped by explicit palette, energy, density, and variation controls.</desc><rect width="1000" height="650" fill="${colors[0]}"/>${shapes}<rect x="25" y="25" width="950" height="600" rx="2" fill="none" stroke="${colors[1]}" stroke-opacity=".09"/></svg>`;
  }
  globalThis.ThinkArtEngine = { normalize, render };
})();
