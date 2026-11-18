(() => {
  'use strict';
  const studio = document.querySelector('[data-art-studio]'),
    engine = globalThis.ThinkArtEngine;
  if (!studio || !engine) return;
  const preview = studio.querySelector('[data-art-preview]'),
    status = studio.querySelector('[data-art-status]');
  let parameters = engine.normalize(),
    revision = 1;
  function update(next, message) {
    parameters = engine.normalize({ ...parameters, ...next });
    preview.innerHTML = engine.render(parameters);
    studio
      .querySelectorAll('[data-art-form]')
      .forEach((button) =>
        button.setAttribute('aria-pressed', String(button.dataset.artForm === parameters.form))
      );
    for (const key of ['energy', 'density']) {
      studio.querySelector(`[data-art-${key}]`).value = String(parameters[key]);
      studio.querySelector(`[data-art-${key}-value]`).textContent = String(parameters[key]);
    }
    status.textContent = message;
  }
  studio
    .querySelectorAll('[data-art-form]')
    .forEach((button) =>
      button.addEventListener('click', () =>
        update(
          { form: button.dataset.artForm },
          'A new composition using the same palette and controls.'
        )
      )
    );
  for (const key of ['energy', 'density'])
    studio
      .querySelector(`[data-art-${key}]`)
      .addEventListener('input', (event) =>
        update({ [key]: Number(event.target.value) }, 'Visual study updated.')
      );
  studio
    .querySelector('[data-art-palette]')
    .addEventListener('change', (event) =>
      update({ palette: event.target.value }, 'Palette updated.')
    );
  studio.querySelector('[data-art-variation]').addEventListener('click', () => {
    revision++;
    update({ seed: parameters.seed + 1 }, 'A new variation of your visual study.');
  });
  studio.querySelector('[data-art-export]').addEventListener('click', () => {
    const url = URL.createObjectURL(
      new Blob([engine.render(parameters)], { type: 'image/svg+xml' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download =
      'think-art-' + parameters.form + '-' + String(revision).padStart(2, '0') + '.svg';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    status.textContent = 'Your visual study is ready to save as an SVG.';
  });
  studio.querySelector('fieldset').disabled = false;
  update({}, 'Choose a composition and shape your own visual study.');
})();
