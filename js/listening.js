/* Listening controls load media only after a visitor starts playback. */
(() => {
  'use strict';
  const engine = globalThis.MindverseListening;
  if (!engine) return;
  const nature = document.querySelector('[data-nature-player]');
  const stories = document.querySelector('[data-story-player]');
  const formatTime = (milliseconds) => {
    const seconds = Math.ceil(milliseconds / 1000);
    return (
      String(Math.floor(seconds / 60)).padStart(2, '0') +
      ':' +
      String(seconds % 60).padStart(2, '0')
    );
  };
  function connectTimer(root, isPlaying, stop) {
    const select = root.querySelector('[data-sleep-timer]'),
      output = root.querySelector('[data-timer-output]');
    const timer = new engine.SleepTimer({
      onTick: (remaining) => {
        output.textContent = remaining ? formatTime(remaining) : 'Timer off';
      },
      onExpire: stop,
    });
    select.addEventListener('change', () => {
      timer.set(select.value, isPlaying());
      if (Number(select.value) && !isPlaying())
        output.textContent = select.value + ' min · starts with playback';
    });
    document.addEventListener('visibilitychange', () => timer.tick());
    return timer;
  }

  if (nature) {
    const cards = [...nature.querySelectorAll('[data-sound-card]')];
    const tracks = cards.map((card) => ({
      id: card.dataset.soundCard,
      src: card.querySelector('audio').getAttribute('src'),
    }));
    const play = nature.querySelector('[data-mix-play]'),
      stop = nature.querySelector('[data-mix-stop]');
    const status = nature.querySelector('[data-listening-status]');
    let levels = Object.fromEntries(
      tracks.map((track) => [track.id, track.id === 'forest' ? 55 : 0])
    );
    let timer;
    const player = new engine.NaturePlayer(tracks, {
      onState: (state) => {
        play.textContent =
          state === 'playing' || state === 'loading' ? 'Pause sound' : 'Play sound';
        play.setAttribute('aria-pressed', String(player.playing));
        nature.setAttribute('aria-busy', String(state === 'loading'));
        cards.forEach((card) =>
          card
            .querySelector('[data-sound-play]')
            .setAttribute(
              'aria-pressed',
              String(player.playing && levels[card.dataset.soundCard] > 0)
            )
        );
        status.textContent =
          state === 'loading'
            ? 'Loading your recordings…'
            : state === 'playing'
              ? 'Playing your sound mix.'
              : state === 'paused'
                ? 'Sound paused.'
                : 'Choose a recording or an ambient world.';
        if (state === 'playing') timer.arm();
      },
      onError: (error) => {
        status.textContent = error.message;
      },
    });
    timer = connectTimer(
      nature,
      () => player.playing,
      () => {
        player.stop();
        status.textContent = 'Sleep timer finished. Sound stopped.';
      }
    );
    function updateLevels(next) {
      levels = Object.fromEntries(tracks.map((track) => [track.id, Number(next[track.id]) || 0]));
      cards.forEach((card) => {
        const value = levels[card.dataset.soundCard];
        card.querySelector('[data-sound-level]').value = String(value);
        card.querySelector('output').textContent = value + '%';
        card
          .querySelector('[data-sound-play]')
          .setAttribute('aria-pressed', String(player.playing && value > 0));
      });
      player.setLevels(levels);
    }
    async function start() {
      cards.forEach((card) => card.querySelector('audio').pause());
      try {
        await player.play();
      } catch (error) {
        nature.classList.remove('mix-ready');
        status.textContent =
          error.message + ' Individual recording players remain available below.';
      }
    }
    play.addEventListener('click', () => (player.playing ? player.pause() : start()));
    stop.addEventListener('click', () => {
      player.stop();
      timer.clear();
    });
    nature.querySelector('[data-master-volume]').addEventListener('input', (event) => {
      player.setVolume(Number(event.target.value) / 100);
      nature.querySelector('[data-volume-output]').textContent = event.target.value + '%';
    });
    cards.forEach((card) => {
      const id = card.dataset.soundCard;
      card.querySelector('[data-sound-play]').addEventListener('click', () => {
        updateLevels({ [id]: 65 });
        start();
      });
      card
        .querySelector('[data-sound-level]')
        .addEventListener('input', (event) =>
          updateLevels({ ...levels, [id]: event.target.value })
        );
    });
    nature.querySelectorAll('[data-world-mix]').forEach((button) =>
      button.addEventListener('click', () => {
        updateLevels(JSON.parse(button.dataset.worldMix));
        start();
      })
    );
    if (globalThis.AudioContext || globalThis.webkitAudioContext) {
      nature.classList.add('mix-ready');
      nature.querySelectorAll('[data-enhanced-control]').forEach((control) => {
        control.disabled = false;
      });
    } else
      status.textContent =
        'Use the individual recording players below. Mixing is unavailable in this browser.';
    updateLevels(levels);
    window.addEventListener('pagehide', () => {
      timer.clear();
      player.destroy();
    });
  }

  if (stories) {
    const cards = [...stories.querySelectorAll('[data-story-card]')];
    const status = stories.querySelector('[data-listening-status]');
    const pause = stories.querySelector('[data-story-pause]'),
      stop = stories.querySelector('[data-story-stop]');
    const voices = stories.querySelector('[data-story-voice]');
    let selected = null,
      timer;
    const narrator = new engine.Narrator({
      onState: (state) => {
        pause.disabled = !['playing', 'paused'].includes(state);
        stop.disabled = state === 'idle' || state === 'finished';
        pause.textContent = state === 'paused' ? 'Resume story' : 'Pause story';
        pause.setAttribute('aria-pressed', String(state === 'paused'));
        cards.forEach((card) =>
          card
            .querySelector('[data-story-listen]')
            .setAttribute(
              'aria-pressed',
              String(card === selected && ['playing', 'paused'].includes(state))
            )
        );
        if (state === 'playing') {
          status.textContent = 'Reading: ' + selected.querySelector('h2').textContent;
          timer.arm();
        } else if (state === 'paused') status.textContent = 'Story paused.';
        else if (state === 'finished') {
          status.textContent = 'The story is complete. Choose another, or rest here a while.';
          timer.clear();
        } else status.textContent = 'Choose a story to listen to, or open its text below.';
      },
      onError: (error) => {
        status.textContent = error.message;
      },
    });
    timer = connectTimer(
      stories,
      () => narrator.state !== 'idle',
      () => {
        narrator.stop();
        status.textContent = 'Sleep timer finished. Narration stopped.';
      }
    );
    function populateVoices() {
      const previous = voices.value;
      const available = (globalThis.speechSynthesis?.getVoices() || []).filter((voice) =>
        /^en\b/i.test(voice.lang)
      );
      voices.replaceChildren(new Option('Browser default', ''));
      available.forEach((voice) =>
        voices.add(
          new Option(
            voice.name + ' · ' + voice.lang + (voice.localService ? ' · on device' : ''),
            voice.voiceURI
          )
        )
      );
      if (available.some((voice) => voice.voiceURI === previous)) voices.value = previous;
      narrator.options.voice = available.find((voice) => voice.voiceURI === voices.value) || null;
    }
    if (globalThis.speechSynthesis && globalThis.SpeechSynthesisUtterance) {
      stories.querySelectorAll('[data-narration-control]').forEach((control) => {
        control.disabled = false;
      });
      pause.disabled = true;
      stop.disabled = true;
      populateVoices();
      globalThis.speechSynthesis.addEventListener('voiceschanged', populateVoices);
    } else
      status.textContent =
        'Browser narration is unavailable here. Every story is available to read below.';
    voices.addEventListener('change', () => {
      narrator.options.voice =
        globalThis.speechSynthesis.getVoices().find((voice) => voice.voiceURI === voices.value) ||
        null;
    });
    stories.querySelector('[data-story-rate]').addEventListener('change', (event) => {
      narrator.options.rate = Number(event.target.value);
    });
    stories.querySelector('[data-master-volume]').addEventListener('input', (event) => {
      narrator.options.volume = Number(event.target.value) / 100;
      stories.querySelector('[data-volume-output]').textContent = event.target.value + '%';
    });
    cards.forEach((card) =>
      card.querySelector('[data-story-listen]').addEventListener('click', () => {
        selected = card;
        const paragraphs = [...card.querySelectorAll('[data-story-text] p')].map(
          (paragraph) => paragraph.textContent
        );
        try {
          narrator.play(paragraphs);
        } catch (error) {
          status.textContent = error.message;
        }
      })
    );
    pause.addEventListener('click', () =>
      narrator.state === 'paused' ? narrator.resume() : narrator.pause()
    );
    stop.addEventListener('click', () => {
      narrator.stop();
      timer.clear();
    });
    window.addEventListener('pagehide', () => {
      timer.clear();
      narrator.stop();
    });
  }

  const reflection = document.querySelector('[data-reflection-space]');
  if (reflection) {
    reflection.querySelector('[data-clear-reflection]').disabled = false;
    const writing = reflection.querySelector('textarea'),
      count = reflection.querySelector('output');
    const update = () => {
      count.textContent = writing.value.length + ' / 3000';
    };
    writing.addEventListener('input', update);
    reflection.querySelector('[data-clear-reflection]').addEventListener('click', () => {
      writing.value = '';
      update();
      writing.focus();
    });
    update();
  }
  const breath = document.querySelector('[data-breath-practice]');
  if (breath) {
    breath.querySelector('button').disabled = false;
    const button = breath.querySelector('button'),
      label = breath.querySelector('[data-breath-label]');
    let handle = null,
      outward = false;
    const reset = () => {
      clearInterval(handle);
      handle = null;
      outward = false;
      breath.classList.remove('is-active');
      button.textContent = 'Start visual cue';
      button.setAttribute('aria-pressed', 'false');
      label.textContent = 'A quiet rhythm';
    };
    button.addEventListener('click', () => {
      if (handle !== null) {
        reset();
        return;
      }
      label.textContent = 'Breathe in gently';
      breath.classList.add('is-active');
      button.textContent = 'Stop visual cue';
      button.setAttribute('aria-pressed', 'true');
      handle = setInterval(() => {
        outward = !outward;
        label.textContent = outward ? 'Breathe out gently' : 'Breathe in gently';
      }, 4000);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) reset();
    });
    window.addEventListener('pagehide', reset);
  }
})();
