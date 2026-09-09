import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { config } from '../config/index.js';

export function setupLiveWebSocket(wss: WebSocketServer): void {
  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[Live API] Client connected to real-time voice channel');

    let session: any = null;
    const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      clientWs.send(
        JSON.stringify({
          error: 'GEMINI_API_KEY is not configured on server.',
        })
      );
      clientWs.close();
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      session = await ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
          systemInstruction:
            'You are an ultra-premium voice AI assistant. Speak naturally, articulately, and concisely. You fluently understand and speak both Bengali (বাংলা) and English. Respond in whichever language the user speaks to you.',
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            // Extract audio chunk if present
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts && parts.length > 0) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  clientWs.send(
                    JSON.stringify({
                      audio: part.inlineData.data,
                    })
                  );
                }
              }
            }

            // Handle user interruption
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onclose: () => {
            console.log('[Live API] Gemini session closed');
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ status: 'closed' }));
            }
          },
          onerror: (err: any) => {
            console.error('[Live API] Gemini session error:', err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ error: 'Live voice session error: ' + (err?.message || err) }));
            }
          },
        },
      });

      clientWs.send(JSON.stringify({ status: 'connected' }));

      clientWs.on('message', (rawData) => {
        try {
          const parsed = JSON.parse(rawData.toString());
          if (parsed.audio && session) {
            session.sendRealtimeInput({
              audio: {
                data: parsed.audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          }
        } catch (err) {
          console.error('[Live API] Error processing client voice frame:', err);
        }
      });

      clientWs.on('close', () => {
        console.log('[Live API] Client disconnected from voice channel');
        if (session) {
          try {
            session.close();
          } catch (e) {
            // Ignore close error
          }
        }
      });

      clientWs.on('error', (err) => {
        console.error('[Live API] Client WebSocket error:', err);
        if (session) {
          try {
            session.close();
          } catch (e) {}
        }
      });
    } catch (error: any) {
      console.error('[Live API] Connection establishment failed:', error);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            error: 'Failed to initiate Gemini Live voice session: ' + (error?.message || error),
          })
        );
        clientWs.close();
      }
    }
  });
}
