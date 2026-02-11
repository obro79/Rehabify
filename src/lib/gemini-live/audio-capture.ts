/**
 * AudioCapture
 *
 * Manages microphone access and converts raw audio to Int16 PCM
 * using an inline AudioWorkletProcessor. Provides volume metering
 * via an AnalyserNode.
 */

import {
  INPUT_SAMPLE_RATE,
  INPUT_CHANNELS,
  PCM_WORKLET_NAME,
} from './constants';

const WORKLET_CODE = `
class PCMCaptureProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      const int16 = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        const s = Math.max(-1, Math.min(1, channelData[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      this.port.postMessage({ type: 'audio', data: int16.buffer }, [int16.buffer]);
    }
    return true;
  }
}
registerProcessor('${PCM_WORKLET_NAME}', PCMCaptureProcessor);
`;

export class AudioCapture {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private muted = false;
  private onAudioData: ((data: ArrayBuffer) => void) | null = null;

  async start(onAudioData: (data: ArrayBuffer) => void): Promise<void> {
    this.onAudioData = onAudioData;

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: INPUT_SAMPLE_RATE,
        channelCount: INPUT_CHANNELS,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    this.audioContext = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE });

    // Load worklet from inline blob
    const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);
    try {
      await this.audioContext.audioWorklet.addModule(workletUrl);
    } finally {
      URL.revokeObjectURL(workletUrl);
    }

    this.workletNode = new AudioWorkletNode(
      this.audioContext,
      PCM_WORKLET_NAME
    );
    this.workletNode.port.onmessage = (event: MessageEvent) => {
      if (event.data?.type === 'audio' && !this.muted) {
        this.onAudioData?.(event.data.data);
      }
    };

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.source.connect(this.analyser);
    this.analyser.connect(this.workletNode);
  }

  stop(): void {
    this.workletNode?.disconnect();
    this.analyser?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();

    this.workletNode = null;
    this.analyser = null;
    this.source = null;
    this.stream = null;
    this.audioContext = null;
    this.onAudioData = null;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  getVolumeLevel(): number {
    if (!this.analyser) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    const sum = data.reduce((acc, val) => acc + val, 0);
    return Math.min(1, sum / data.length / 128);
  }
}
