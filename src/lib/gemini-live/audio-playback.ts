/**
 * AudioPlayback
 *
 * Manages Web Audio API output for playing back Int16 PCM audio
 * received from the Gemini Live API. Supports gapless scheduling
 * and barge-in interruption.
 */

import { OUTPUT_SAMPLE_RATE } from './constants';

export class AudioPlayback {
  private audioContext: AudioContext | null = null;
  private queue: AudioBuffer[] = [];
  private currentSources: AudioBufferSourceNode[] = [];
  private nextStartTime = 0;
  private _isSpeaking = false;

  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;

  private ensureContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
    }
    return this.audioContext;
  }

  enqueue(pcmData: ArrayBuffer, sampleRate: number = OUTPUT_SAMPLE_RATE): void {
    const ctx = this.ensureContext();

    // Convert Int16 PCM to Float32 AudioBuffer
    const int16 = new Int16Array(pcmData);
    const numSamples = int16.length;
    const audioBuffer = ctx.createBuffer(1, numSamples, sampleRate);
    const float32 = audioBuffer.getChannelData(0);
    for (let i = 0; i < numSamples; i++) {
      float32[i] = int16[i] / 0x8000;
    }

    this.queue.push(audioBuffer);
    this.scheduleNext();
  }

  private scheduleNext(): void {
    if (this.queue.length === 0) return;

    const ctx = this.ensureContext();
    const buffer = this.queue.shift()!;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const startTime = Math.max(ctx.currentTime, this.nextStartTime);
    source.start(startTime);
    this.nextStartTime = startTime + buffer.duration;

    this.currentSources.push(source);

    if (!this._isSpeaking) {
      this._isSpeaking = true;
      this.onPlaybackStart?.();
    }

    source.onended = () => {
      const idx = this.currentSources.indexOf(source);
      if (idx !== -1) this.currentSources.splice(idx, 1);

      // If no more sources and queue is empty, playback is done
      if (this.currentSources.length === 0 && this.queue.length === 0) {
        this._isSpeaking = false;
        this.onPlaybackEnd?.();
      }
    };

    // Schedule any remaining queued buffers
    if (this.queue.length > 0) {
      this.scheduleNext();
    }
  }

  interrupt(): void {
    for (const source of this.currentSources) {
      try {
        source.stop();
      } catch {
        // Already stopped
      }
    }
    this.currentSources = [];
    this.queue = [];
    this.nextStartTime = 0;

    if (this._isSpeaking) {
      this._isSpeaking = false;
      this.onPlaybackEnd?.();
    }
  }

  isSpeaking(): boolean {
    return this._isSpeaking;
  }

  close(): void {
    this.interrupt();
    this.audioContext?.close();
    this.audioContext = null;
  }
}
