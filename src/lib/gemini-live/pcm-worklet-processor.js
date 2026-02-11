/**
 * PCM Capture AudioWorkletProcessor
 *
 * Receives Float32 audio from the browser's audio pipeline,
 * converts to Int16 PCM, and posts the buffer to the main thread.
 */
class PCMCaptureProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      const int16 = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        const s = Math.max(-1, Math.min(1, channelData[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      this.port.postMessage({ type: 'audio', data: int16.buffer }, [
        int16.buffer,
      ]);
    }
    return true;
  }
}

registerProcessor('pcm-capture-processor', PCMCaptureProcessor);
