// Mic capture worklet: Float32 at the AudioContext rate -> linear16 @ 16 kHz.
//
// 05 §2 pins the input format, and 05 §5 notes that a wrong encoding or sample
// rate is the usual cause of a 1008 DATA-0000 close. So the resampling happens
// here, once, rather than being left to whatever rate the device happens to run
// at (48 kHz on most hardware, 44.1 kHz on some).

const TARGET_SAMPLE_RATE = 16000;
const FRAME_SAMPLES = 640; // 40 ms at 16 kHz

class Linear16Worklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / TARGET_SAMPLE_RATE;
    this.buffer = [];
    this.position = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channel = input[0];

    // Linear interpolation down to 16 kHz. Good enough for speech and cheap
    // enough to run on the audio thread; anything fancier belongs off it.
    while (this.position < channel.length) {
      const index = Math.floor(this.position);
      const frac = this.position - index;
      const a = channel[index];
      const b = index + 1 < channel.length ? channel[index + 1] : a;
      this.buffer.push(a + (b - a) * frac);
      this.position += this.ratio;
    }
    this.position -= channel.length;

    while (this.buffer.length >= FRAME_SAMPLES) {
      const frame = this.buffer.splice(0, FRAME_SAMPLES);
      const pcm = new Int16Array(FRAME_SAMPLES);
      for (let i = 0; i < FRAME_SAMPLES; i++) {
        const s = Math.max(-1, Math.min(1, frame[i]));
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      this.port.postMessage(pcm.buffer, [pcm.buffer]);
    }

    return true;
  }
}

registerProcessor("linear16-worklet", Linear16Worklet);
