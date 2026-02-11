import { GoogleGenAI, Modality, type LiveServerMessage } from '@google/genai';
import type { GeminiLiveConfig, GeminiVoiceCallbacks, VoiceTokenResponse } from './types';
import { GEMINI_LIVE_MODEL } from './constants';
import { AudioCapture } from './audio-capture';
import { AudioPlayback } from './audio-playback';
import { ToolCallDispatcher } from './tool-handler';

export class GeminiLiveSessionManager {
  private session: any = null;
  private audioCapture: AudioCapture;
  private audioPlayback: AudioPlayback;
  private toolDispatcher: ToolCallDispatcher;
  private callbacks: GeminiVoiceCallbacks = {};
  private volumePollInterval: ReturnType<typeof setInterval> | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.audioCapture = new AudioCapture();
    this.audioPlayback = new AudioPlayback();
    this.toolDispatcher = new ToolCallDispatcher();

    this.audioPlayback.onPlaybackStart = () => {
      this.callbacks.onSpeakingChange?.(true);
    };
    this.audioPlayback.onPlaybackEnd = () => {
      this.callbacks.onSpeakingChange?.(false);
    };
  }

  get toolHandler(): ToolCallDispatcher {
    return this.toolDispatcher;
  }

  async connect(config: GeminiLiveConfig, callbacks: GeminiVoiceCallbacks): Promise<void> {
    this.callbacks = callbacks;

    // 1. Fetch API key from /api/voice/token
    const tokenRes = await fetch('/api/voice/token', { method: 'POST' });
    if (!tokenRes.ok) throw new Error('Failed to fetch voice token');
    const { apiKey, model } = (await tokenRes.json()) as VoiceTokenResponse;

    // 2. Connect to Gemini Live
    const ai = new GoogleGenAI({ apiKey });

    const connectConfig: any = {
      responseModalities: [Modality.AUDIO],
    };

    if (config.voiceName) {
      connectConfig.speechConfig = {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName } },
      };
    }

    if (config.systemInstruction) {
      connectConfig.systemInstruction = config.systemInstruction;
    }

    if (config.tools && config.tools.length > 0) {
      connectConfig.tools = [{ functionDeclarations: config.tools }];
    }

    this.session = await ai.live.connect({
      model: model || GEMINI_LIVE_MODEL,
      config: connectConfig,
      callbacks: {
        onopen: () => {
          this.isConnected = true;
          callbacks.onConnectionChange?.(true);

          // Send first message if provided
          if (config.firstMessage) {
            this.sendContext(`[START THE CONVERSATION]: Say exactly: "${config.firstMessage}"`);
          }
        },
        onmessage: (message: LiveServerMessage) => this.handleMessage(message),
        onerror: (e: ErrorEvent) => {
          console.error('[GeminiLive] Error:', e.message);
          callbacks.onError?.(new Error(e.message || 'WebSocket error'));
        },
        onclose: () => {
          this.isConnected = false;
          callbacks.onConnectionChange?.(false);
          callbacks.onSpeakingChange?.(false);
          this.stopVolumePoll();
        },
      },
    });

    // 3. Start mic capture
    await this.audioCapture.start((pcmData: ArrayBuffer) => {
      if (this.session && this.isConnected) {
        try {
          this.session.sendRealtimeInput({
            audio: new Blob([pcmData], { type: 'audio/pcm;rate=16000' }),
          });
        } catch {
          // Session may have closed
        }
      }
    });

    // 4. Start volume level polling
    this.startVolumePoll();
  }

  disconnect(): void {
    this.stopVolumePoll();
    this.audioCapture.stop();
    this.audioPlayback.interrupt();
    this.audioPlayback.close();

    if (this.session) {
      try {
        this.session.close();
      } catch {}
      this.session = null;
    }

    this.isConnected = false;
    this.callbacks.onConnectionChange?.(false);
    this.callbacks.onSpeakingChange?.(false);
  }

  sendContext(text: string): void {
    if (!this.session || !this.isConnected) return;
    try {
      this.session.sendClientContent({ turns: text });
    } catch (err) {
      console.error('[GeminiLive] Failed to send context:', err);
    }
  }

  say(text: string, critical: boolean = false): void {
    if (!this.session || !this.isConnected) return;

    // Interrupt current playback for immediate speech
    this.audioPlayback.interrupt();

    // Send as urgent instruction to model
    this.sendContext(`[URGENT - SAY EXACTLY]: "${text}"`);

    // For critical safety messages, also use browser speech synthesis as instant backup
    if (critical && typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }

  setMuted(muted: boolean): void {
    this.audioCapture.setMuted(muted);
  }

  private handleMessage(message: LiveServerMessage): void {
    // Handle audio data
    const parts = message.serverContent?.modelTurn?.parts;
    if (parts) {
      for (const part of parts) {
        // Audio data
        if (part.inlineData?.data) {
          const binaryStr = atob(part.inlineData.data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          this.audioPlayback.enqueue(bytes.buffer, 24000);
        }

        // Text transcript (model output)
        if (part.text) {
          this.callbacks.onTranscript?.('assistant', part.text);
        }
      }
    }

    // Handle turn complete
    if (message.serverContent?.turnComplete) {
      // Turn is done, model is now listening
    }

    // Handle tool calls
    const toolCall = (message as any).toolCall;
    if (toolCall?.functionCalls) {
      for (const call of toolCall.functionCalls) {
        const { id, name, args } = call;

        // Notify callback
        this.callbacks.onFunctionCall?.(name, args || {});

        // Dispatch to handler and send response
        this.toolDispatcher.dispatch(name, args || {}).then((result) => {
          if (this.session && this.isConnected) {
            try {
              this.session.sendToolResponse({
                functionResponses: [{ id, name, response: result }],
              });
            } catch (err) {
              console.error('[GeminiLive] Failed to send tool response:', err);
            }
          }
        });
      }
    }
  }

  private startVolumePoll(): void {
    this.volumePollInterval = setInterval(() => {
      const level = this.audioCapture.getVolumeLevel();
      this.callbacks.onVolumeChange?.(level);
    }, 100);
  }

  private stopVolumePoll(): void {
    if (this.volumePollInterval) {
      clearInterval(this.volumePollInterval);
      this.volumePollInterval = null;
    }
  }
}
