/**
 * AudioWorklet: PCM int16 chunks for Deepgram v1/listen (replaces fragile ScriptProcessorNode in Electron/Chromium).
 */
class SttPcmProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const output = outputs[0];
    if (output && output.length > 0) {
      output[0].fill(0);
    }
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const ch = input[0];
    const n = ch.length;
    if (n === 0) return true;
    const pcm = new Int16Array(n);
    for (let i = 0; i < n; i++) {
      const s = Math.max(-1, Math.min(1, ch[i]));
      pcm[i] = s < 0 ? s * 32768 : s * 32767;
    }
    this.port.postMessage(pcm.buffer, [pcm.buffer]);
    return true;
  }
}

registerProcessor("stt-pcm-processor", SttPcmProcessor);
