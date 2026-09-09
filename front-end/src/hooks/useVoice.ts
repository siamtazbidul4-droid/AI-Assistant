
import { useState, useRef, useCallback, useEffect } from 'react';

import { VoiceState } from '../types';

export function useVoice() {
  const [state, setState] = useState<VoiceState>('idle');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [audioLevel, setAudioLevel] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);

  const inputAudioCtxRef = useRef<AudioContext | null>(null);

  const outputAudioCtxRef = useRef<AudioContext | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);

  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const analyserRef = useRef<AnalyserNode | null>(null);

  const nextStartTimeRef = useRef<number>(0);

  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const animFrameRef = useRef<number | null>(null);

  // Convert Float32 array from mic to 16-bit PCM base64
  const pcmToBase64 = (float32Array: Float32Array): string => {
    const pcm16 = new Int16Array(float32Array.length);

    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));

      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    const bytes = new Uint8Array(pcm16.buffer);

    let binary = '';

    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
  };

  // Convert base64 PCM16 back to AudioBuffer at 24kHz
  const base64ToAudioBuffer = (
    ctx: AudioContext,
    base64: string
  ): AudioBuffer => {
    const binary = atob(base64);

    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const pcm16 = new Int16Array(bytes.buffer);

    const buffer = ctx.createBuffer(1, pcm16.length, 24000);

    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < pcm16.length; i++) {
      channelData[i] = pcm16[i] / 32768;
    }

    return buffer;
  };

  // Stop current audio output on interruption
  const stopAudioPlayback = useCallback(() => {
    for (const source of scheduledSourcesRef.current) {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    }

    scheduledSourcesRef.current = [];

    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
  }, []);

  const playAudioChunk = useCallback(
    (ctx: AudioContext, base64Audio: string) => {
      try {
        const buffer = base64ToAudioBuffer(ctx, base64Audio);

        const source = ctx.createBufferSource();

        source.buffer = buffer;

        source.connect(ctx.destination);

        const currentTime = ctx.currentTime;

        if (nextStartTimeRef.current < currentTime) {
          nextStartTimeRef.current = currentTime;
        }

        source.start(nextStartTimeRef.current);

        nextStartTimeRef.current += buffer.duration;

        scheduledSourcesRef.current.push(source);

        source.onended = () => {
          scheduledSourcesRef.current =
            scheduledSourcesRef.current.filter(s => s !== source);

          if (scheduledSourcesRef.current.length === 0) {
            setState(prev =>
              prev === 'speaking' ? 'listening' : prev
            );
          }
        };

        setState('speaking');
      } catch (e) {
        console.error('Playback chunk error:', e);
      }
    },
    []
  );

  const startVoice = useCallback(async () => {
    try {
      setState('connecting');

      setErrorMessage(null);

      // 1. Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaStreamRef.current = stream;

      // 2. Setup Web Audio contexts
      const inputAudioCtx = new AudioContext({
        sampleRate: 16000,
      });

      const outputAudioCtx = new AudioContext({
        sampleRate: 24000,
      });

      inputAudioCtxRef.current = inputAudioCtx;

      outputAudioCtxRef.current = outputAudioCtx;

      nextStartTimeRef.current = outputAudioCtx.currentTime;

      // 3. Audio visualizer setup
      const analyser = inputAudioCtx.createAnalyser();

      analyser.fftSize = 64;

      analyserRef.current = analyser;

      const source = inputAudioCtx.createMediaStreamSource(stream);

      source.connect(analyser);

      // Animation loop for audio visualizer
      const dataArray = new Uint8Array(
        analyser.frequencyBinCount
      );

      const updateVisualizer = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;

          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }

          const avg = sum / dataArray.length;

          setAudioLevel(Math.min(1, avg / 128));
        }

        animFrameRef.current =
          requestAnimationFrame(updateVisualizer);
      };

      updateVisualizer();

      // 4. Connect WebSocket to backend Live route
      const apiBase =
        ((import.meta as any).env?.VITE_API_URL as string)
          ?.replace(/\/$/, '') || '';

      const protocol =
        window.location.protocol === 'https:' ? 'wss:' : 'ws:';

      const wsUrl = apiBase
        ? `${apiBase.replace(/^https?:\/\//, `${protocol}//`)}/live`
        : `${protocol}//${window.location.host}/live`;

      const ws = new WebSocket(wsUrl);

      wsRef.current = ws;

      ws.onopen = () => {
        setState('listening');

        // Setup microphone processor
        const processor = inputAudioCtx.createScriptProcessor(
          4096,
          1,
          1
        );

        processorRef.current = processor;

        source.connect(processor);

        processor.connect(inputAudioCtx.destination);

        processor.onaudioprocess = e => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputData =
              e.inputBuffer.getChannelData(0);

            const base64 = pcmToBase64(inputData);

            ws.send(
              JSON.stringify({
                audio: base64,
              })
            );
          }
        };
      };

      ws.onmessage = event => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.error) {
            setErrorMessage(msg.error);

            setState('error');
          } else if (msg.audio) {
            if (outputAudioCtxRef.current) {
              playAudioChunk(
                outputAudioCtxRef.current,
                msg.audio
              );
            }
          } else if (msg.interrupted) {
            setState('interrupted');

            stopAudioPlayback();

            setTimeout(() => setState('listening'), 300);
          }
        } catch (e) {
          console.warn(
            'Failed to parse voice WS message:',
            e
          );
        }
      };

      ws.onerror = err => {
        console.error('Voice WebSocket error:', err);

        setErrorMessage(
          'Voice connection error. Please verify microphone and network permissions.'
        );

        setState('error');
      };

      ws.onclose = () => {
        setState('idle');
      };
    } catch (err: any) {
      console.error(
        'Failed to start voice interaction:',
        err
      );

      setErrorMessage(
        err.message ||
          'Microphone access denied or audio unavailable.'
      );

      setState('error');
    }
  }, [playAudioChunk, stopAudioPlayback]);

  const stopVoice = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);

      animFrameRef.current = null;
    }

    stopAudioPlayback();

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}

      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current
        .getTracks()
        .forEach(track => track.stop());

      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});

      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});

      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();

      wsRef.current = null;
    }

    setAudioLevel(0);

    setState('idle');
  }, [stopAudioPlayback]);

  useEffect(() => {
    return () => {
      stopVoice();
    };
  }, [stopVoice]);

  return {
    state,
    audioLevel,
    errorMessage,
    startVoice,
    stopVoice,
    stopAudioPlayback,
  };
}





// import { useState, useRef, useCallback, useEffect } from 'react';
// import { VoiceState } from '../types';

// export function useVoice() {
//   const [state, setState] = useState<VoiceState>('idle');
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
//   const [audioLevel, setAudioLevel] = useState<number>(0);

//   const wsRef = useRef<WebSocket | null>(null);
//   const inputAudioCtxRef = useRef<AudioContext | null>(null);
//   const outputAudioCtxRef = useRef<AudioContext | null>(null);
//   const mediaStreamRef = useRef<MediaStream | null>(null);
//   const processorRef = useRef<ScriptProcessorNode | null>(null);
//   const analyserRef = useRef<AnalyserNode | null>(null);
//   const nextStartTimeRef = useRef<number>(0);
//   const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);
//   const animFrameRef = useRef<number | null>(null);

//   // Convert Float32 array from mic to 16-bit PCM base64
//   const pcmToBase64 = (float32Array: Float32Array): string => {
//     const pcm16 = new Int16Array(float32Array.length);
//     for (let i = 0; i < float32Array.length; i++) {
//       const s = Math.max(-1, Math.min(1, float32Array[i]));
//       pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
//     }
//     const bytes = new Uint8Array(pcm16.buffer);
//     let binary = '';
//     for (let i = 0; i < bytes.byteLength; i++) {
//       binary += String.fromCharCode(bytes[i]);
//     }
//     return btoa(binary);
//   };

//   // Convert base64 PCM16 back to AudioBuffer at 24kHz
//   const base64ToAudioBuffer = (ctx: AudioContext, base64: string): AudioBuffer => {
//     const binary = atob(base64);
//     const bytes = new Uint8Array(binary.length);
//     for (let i = 0; i < binary.length; i++) {
//       bytes[i] = binary.charCodeAt(i);
//     }
//     const pcm16 = new Int16Array(bytes.buffer);
//     const buffer = ctx.createBuffer(1, pcm16.length, 24000);
//     const channelData = buffer.getChannelData(0);
//     for (let i = 0; i < pcm16.length; i++) {
//       channelData[i] = pcm16[i] / 32768;
//     }
//     return buffer;
//   };

//   // Stop current audio output on interruption
//   const stopAudioPlayback = useCallback(() => {
//     for (const source of scheduledSourcesRef.current) {
//       try {
//         source.stop();
//         source.disconnect();
//       } catch {}
//     }
//     scheduledSourcesRef.current = [];
//     if (outputAudioCtxRef.current) {
//       nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
//     }
//   }, []);

//   const playAudioChunk = useCallback(
//     (ctx: AudioContext, base64Audio: string) => {
//       try {
//         const buffer = base64ToAudioBuffer(ctx, base64Audio);
//         const source = ctx.createBufferSource();
//         source.buffer = buffer;
//         source.connect(ctx.destination);

//         const currentTime = ctx.currentTime;
//         if (nextStartTimeRef.current < currentTime) {
//           nextStartTimeRef.current = currentTime;
//         }

//         source.start(nextStartTimeRef.current);
//         nextStartTimeRef.current += buffer.duration;

//         scheduledSourcesRef.current.push(source);
//         source.onended = () => {
//           scheduledSourcesRef.current = scheduledSourcesRef.current.filter(s => s !== source);
//           if (scheduledSourcesRef.current.length === 0) {
//             setState(prev => (prev === 'speaking' ? 'listening' : prev));
//           }
//         };

//         setState('speaking');
//       } catch (e) {
//         console.error('Playback chunk error:', e);
//       }
//     },
//     []
//   );

//   const startVoice = useCallback(async () => {
//     try {
//       setState('connecting');
//       setErrorMessage(null);

//       // 1. Request microphone permission
//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: {
//           channelCount: 1,
//           sampleRate: 16000,
//           echoCancellation: true,
//           noiseSuppression: true,
//         },
//       });
//       mediaStreamRef.current = stream;

//       // 2. Setup Web Audio contexts
//       const inputAudioCtx = new AudioContext({ sampleRate: 16000 });
//       const outputAudioCtx = new AudioContext({ sampleRate: 24000 });
//       inputAudioCtxRef.current = inputAudioCtx;
//       outputAudioCtxRef.current = outputAudioCtx;
//       nextStartTimeRef.current = outputAudioCtx.currentTime;

//       // 3. Audio visualizer setup
//       const analyser = inputAudioCtx.createAnalyser();
//       analyser.fftSize = 64;
//       analyserRef.current = analyser;

//       const source = inputAudioCtx.createMediaStreamSource(stream);
//       source.connect(analyser);

//       // Animation loop for audio visualizer
//       const dataArray = new Uint8Array(analyser.frequencyBinCount);
//       const updateVisualizer = () => {
//         if (analyserRef.current) {
//           analyserRef.current.getByteFrequencyData(dataArray);
//           let sum = 0;
//           for (let i = 0; i < dataArray.length; i++) {
//             sum += dataArray[i];
//           }
//           const avg = sum / dataArray.length;
//           setAudioLevel(Math.min(1, avg / 128));
//         }
//         animFrameRef.current = requestAnimationFrame(updateVisualizer);
//       };
//       updateVisualizer();

//       // 4. Connect WebSocket to backend Live route
//       const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
//       const wsUrl = `${protocol}//${window.location.host}/live`;
//       const ws = new WebSocket(wsUrl);
//       wsRef.current = ws;

//       ws.onopen = () => {
//         setState('listening');

//         // Setup microphone processor
//         const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
//         processorRef.current = processor;
//         source.connect(processor);
//         processor.connect(inputAudioCtx.destination);

//         processor.onaudioprocess = e => {
//           if (ws.readyState === WebSocket.OPEN) {
//             const inputData = e.inputBuffer.getChannelData(0);
//             const base64 = pcmToBase64(inputData);
//             ws.send(JSON.stringify({ audio: base64 }));
//           }
//         };
//       };

//       ws.onmessage = event => {
//         try {
//           const msg = JSON.parse(event.data);
//           if (msg.error) {
//             setErrorMessage(msg.error);
//             setState('error');
//           } else if (msg.audio) {
//             if (outputAudioCtxRef.current) {
//               playAudioChunk(outputAudioCtxRef.current, msg.audio);
//             }
//           } else if (msg.interrupted) {
//             setState('interrupted');
//             stopAudioPlayback();
//             setTimeout(() => setState('listening'), 300);
//           }
//         } catch (e) {
//           console.warn('Failed to parse voice WS message:', e);
//         }
//       };

//       ws.onerror = err => {
//         console.error('Voice WebSocket error:', err);
//         setErrorMessage('Voice connection error. Please verify microphone and network permissions.');
//         setState('error');
//       };

//       ws.onclose = () => {
//         setState('idle');
//       };
//     } catch (err: any) {
//       console.error('Failed to start voice interaction:', err);
//       setErrorMessage(err.message || 'Microphone access denied or audio unavailable.');
//       setState('error');
//     }
//   }, [playAudioChunk, stopAudioPlayback]);

//   const stopVoice = useCallback(() => {
//     if (animFrameRef.current) {
//       cancelAnimationFrame(animFrameRef.current);
//       animFrameRef.current = null;
//     }
//     stopAudioPlayback();

//     if (processorRef.current) {
//       try {
//         processorRef.current.disconnect();
//       } catch {}
//       processorRef.current = null;
//     }

//     if (mediaStreamRef.current) {
//       mediaStreamRef.current.getTracks().forEach(track => track.stop());
//       mediaStreamRef.current = null;
//     }

//     if (inputAudioCtxRef.current) {
//       inputAudioCtxRef.current.close().catch(() => {});
//       inputAudioCtxRef.current = null;
//     }

//     if (outputAudioCtxRef.current) {
//       outputAudioCtxRef.current.close().catch(() => {});
//       outputAudioCtxRef.current = null;
//     }

//     if (wsRef.current) {
//       wsRef.current.close();
//       wsRef.current = null;
//     }

//     setAudioLevel(0);
//     setState('idle');
//   }, [stopAudioPlayback]);

//   useEffect(() => {
//     return () => {
//       stopVoice();
//     };
//   }, [stopVoice]);

//   return {
//     state,
//     audioLevel,
//     errorMessage,
//     startVoice,
//     stopVoice,
//     stopAudioPlayback,
//   };
// }
