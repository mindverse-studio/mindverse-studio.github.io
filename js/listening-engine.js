/* Local field-recording mixer, browser narration, and wall-clock sleep timer. */
(() => {
  'use strict';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

  function crossfadeBuffer(context, source) {
    const frames = Math.min(source.length, Math.floor(source.sampleRate * 60));
    const overlap = Math.min(Math.floor(source.sampleRate * 1.25), Math.floor(frames / 8));
    const output = context.createBuffer(
      source.numberOfChannels,
      frames - overlap,
      source.sampleRate
    );
    for (let channel = 0; channel < source.numberOfChannels; channel++) {
      const input = source.getChannelData(channel),
        target = output.getChannelData(channel);
      target.set(input.subarray(0, target.length));
      for (let i = 0; i < overlap; i++) {
        const mix = i / Math.max(1, overlap - 1);
        target[i] = input[frames - overlap + i] * (1 - mix) + input[i] * mix;
      }
    }
    return output;
  }

  class NaturePlayer {
    constructor(tracks, options = {}) {
      this.tracks = new Map(tracks.map((track) => [track.id, track]));
      this.levels = new Map(tracks.map((track) => [track.id, 0]));
      this.contextFactory =
        options.contextFactory ||
        (() => {
          const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
          if (!AudioContext)
            throw new Error(
              'This browser cannot mix audio. Use the individual recording players below.'
            );
          return new AudioContext();
        });
      this.fetcher = options.fetcher || globalThis.fetch.bind(globalThis);
      this.onState = options.onState || (() => {});
      this.onError = options.onError || (() => {});
      this.buffers = new Map();
      this.channels = new Map();
      this.context = null;
      this.master = null;
      this.volume = 0.55;
      this.playing = false;
      this.token = 0;
    }
    setVolume(value) {
      this.volume = clamp(value, 0, 1);
      if (this.master)
        this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.08);
    }
    setLevels(levels) {
      for (const id of this.levels.keys()) this.levels.set(id, clamp(levels[id], 0, 100) / 100);
      this.updateGains();
      if (this.playing) {
        if (![...this.levels.values()].some((value) => value > 0)) this.pause();
        else this.sync(this.token).catch((error) => this.onError(error));
      }
    }
    updateGains() {
      const total = Math.max(
        1,
        [...this.levels.values()].reduce((sum, value) => sum + value, 0)
      );
      for (const [id, channel] of this.channels) {
        const level = this.levels.get(id) || 0;
        channel.gain.gain.setTargetAtTime(level / total, this.context.currentTime, 0.08);
        if (!level) {
          channel.source.stop();
          channel.source.disconnect();
          channel.gain.disconnect();
          this.channels.delete(id);
        }
      }
    }
    async buffer(id) {
      if (!this.buffers.has(id)) {
        const promise = (async () => {
          const response = await this.fetcher(this.tracks.get(id).src);
          if (!response.ok) throw new Error('A recording could not be loaded. Please try again.');
          const decoded = await this.context.decodeAudioData(await response.arrayBuffer());
          return crossfadeBuffer(this.context, decoded);
        })();
        this.buffers.set(id, promise);
        promise.catch(() => this.buffers.delete(id));
      }
      return this.buffers.get(id);
    }
    async sync(token) {
      await Promise.all(
        [...this.levels]
          .filter(([, level]) => level > 0)
          .map(async ([id]) => {
            if (this.channels.has(id)) return;
            const buffer = await this.buffer(id);
            if (
              !this.playing ||
              token !== this.token ||
              !this.levels.get(id) ||
              this.channels.has(id)
            )
              return;
            const source = this.context.createBufferSource(),
              gain = this.context.createGain();
            source.buffer = buffer;
            source.loop = true;
            gain.gain.value = 0;
            source.connect(gain);
            gain.connect(this.master);
            this.channels.set(id, { source, gain });
            source.start();
            this.updateGains();
          })
      );
    }
    async play() {
      if (![...this.levels.values()].some((value) => value > 0))
        throw new Error('Choose a collection or raise a sound level first.');
      if (!this.context) {
        this.context = this.contextFactory();
        this.master = this.context.createGain();
        this.master.gain.value = this.volume;
        this.master.connect(this.context.destination);
      }
      const token = ++this.token;
      this.playing = true;
      this.onState('loading');
      try {
        await this.context.resume();
        await this.sync(token);
        if (token === this.token && this.playing) this.onState('playing');
      } catch (error) {
        if (token !== this.token) return;
        this.stop();
        throw error;
      }
    }
    pause() {
      this.playing = false;
      this.token++;
      this.context?.suspend().catch(() => {});
      this.onState('paused');
    }
    stop() {
      this.playing = false;
      this.token++;
      for (const channel of this.channels.values()) {
        channel.source.stop();
        channel.source.disconnect();
        channel.gain.disconnect();
      }
      this.channels.clear();
      this.context?.suspend().catch(() => {});
      this.onState('idle');
    }
    destroy() {
      this.stop();
      this.buffers.clear();
      this.context?.close().catch(() => {});
      this.context = null;
      this.master = null;
    }
  }

  function speechChunks(paragraphs) {
    const chunks = [];
    for (const paragraph of paragraphs) {
      const sentences = paragraph.match(/[^.!?]+[.!?]+[”"’']*|[^.!?]+$/g) || [];
      for (const sentence of sentences) {
        let chunk = '';
        for (const word of sentence.trim().split(/\s+/)) {
          if ((chunk + ' ' + word).length > 220) {
            chunks.push(chunk);
            chunk = '';
          }
          chunk += (chunk ? ' ' : '') + word;
        }
        if (chunk) chunks.push(chunk);
      }
    }
    return chunks;
  }

  class Narrator {
    constructor(options = {}) {
      this.synth = options.synth || globalThis.speechSynthesis;
      this.Utterance = options.Utterance || globalThis.SpeechSynthesisUtterance;
      this.onState = options.onState || (() => {});
      this.onError = options.onError || (() => {});
      this.options = { rate: 0.85, volume: 0.55, voice: null };
      this.token = 0;
      this.state = 'idle';
      this.index = 0;
      this.chunks = [];
    }
    play(paragraphs) {
      if (!this.synth || !this.Utterance)
        throw new Error('Browser narration is unavailable. You can read every story below.');
      this.stop();
      this.chunks = speechChunks(paragraphs);
      this.index = 0;
      this.state = 'playing';
      this.onState(this.state);
      this.next(this.token);
    }
    next(token) {
      if (token !== this.token) return;
      if (this.index >= this.chunks.length) {
        this.state = 'idle';
        this.onState('finished');
        return;
      }
      const utterance = new this.Utterance(this.chunks[this.index]);
      utterance.rate = clamp(this.options.rate, 0.7, 1.15);
      utterance.volume = clamp(this.options.volume, 0, 1);
      if (this.options.voice) utterance.voice = this.options.voice;
      utterance.lang = this.options.voice?.lang || 'en-US';
      utterance.onend = () => {
        if (token === this.token) {
          this.index++;
          this.next(token);
        }
      };
      utterance.onerror = (event) => {
        if (token !== this.token) return;
        this.stop();
        this.onError(
          new Error(
            'Narration stopped (' +
              (event.error || 'voice unavailable') +
              '). Try another voice, or read the story below.'
          )
        );
      };
      this.synth.speak(utterance);
    }
    pause() {
      if (this.state !== 'playing') return;
      this.synth.pause();
      this.state = 'paused';
      this.onState('paused');
    }
    resume() {
      if (this.state !== 'paused') return;
      this.synth.resume();
      this.state = 'playing';
      this.onState('playing');
    }
    stop() {
      this.token++;
      this.synth?.cancel();
      this.state = 'idle';
      this.onState('idle');
    }
  }

  class SleepTimer {
    constructor(options = {}) {
      this.now = options.now || Date.now;
      this.schedule = options.schedule || globalThis.setTimeout.bind(globalThis);
      this.cancel = options.cancel || globalThis.clearTimeout.bind(globalThis);
      this.onTick = options.onTick || (() => {});
      this.onExpire = options.onExpire || (() => {});
      this.minutes = 0;
      this.deadline = 0;
      this.handle = null;
    }
    set(minutes, running = false) {
      this.clear();
      this.minutes = clamp(minutes, 0, 120);
      if (running) this.arm();
    }
    arm() {
      if (!this.minutes || this.deadline) return;
      this.deadline = this.now() + this.minutes * 60000;
      this.tick();
    }
    tick() {
      if (!this.deadline) return;
      if (this.handle !== null) this.cancel(this.handle);
      const remaining = Math.max(0, this.deadline - this.now());
      this.onTick(remaining);
      if (!remaining) {
        this.deadline = 0;
        this.handle = null;
        this.onExpire();
      } else this.handle = this.schedule(() => this.tick(), Math.min(1000, remaining));
    }
    clear() {
      if (this.handle !== null) this.cancel(this.handle);
      this.deadline = 0;
      this.handle = null;
      this.onTick(0);
    }
  }
  globalThis.MindverseListening = {
    crossfadeBuffer,
    NaturePlayer,
    speechChunks,
    Narrator,
    SleepTimer,
  };
})();
