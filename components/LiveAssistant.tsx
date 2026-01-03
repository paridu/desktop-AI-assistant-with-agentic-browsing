
import React, { useState, useEffect, useRef } from 'react';
import { getAIClient, decodeAudioData, decodeBase64, encodeAudio } from '../services/geminiService';
import { LiveServerMessage, Modality } from '@google/genai';

const LiveAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [transcripts, setTranscripts] = useState<string[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startSession = async () => {
    try {
      setStatus('connecting');
      const ai = getAIClient();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'คุณคือ Nexus ผู้ช่วย AI อัจฉริยะในรูปแบบเสียง ตอบคำถามเป็นภาษาไทยอย่างเป็นธรรมชาติ สุภาพ และกระชับ หากผู้ใช้พูดภาษาอังกฤษมา ให้ตอบเป็นภาษาอังกฤษได้ทันที',
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setStatus('listening');
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBase64 = encodeAudio(new Uint8Array(int16.buffer));
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: { data: pcmBase64, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription) {
              setTranscripts(prev => [...prev, `คุณ: ${msg.serverContent!.inputTranscription!.text}`]);
            }
            if (msg.serverContent?.outputTranscription) {
               setTranscripts(prev => [...prev, `Nexus: ${msg.serverContent!.outputTranscription!.text}`]);
            }

            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setStatus('speaking');
              const buffer = await decodeAudioData(
                decodeBase64(audioData),
                outputCtx,
                24000,
                1
              );
              
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              
              sourcesRef.current.add(source);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              };
            }

            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus('listening');
            }
          },
          onerror: (e) => {
            console.error('Session error:', e);
            stopSession();
          },
          onclose: () => stopSession(),
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start session:', err);
      setStatus('idle');
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      try { (sessionRef.current as any).close(); } catch {}
    }
    setIsActive(false);
    setStatus('idle');
    nextStartTimeRef.current = 0;
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 items-center justify-center p-8 text-center">
      <div className="mb-12">
        <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 ${
          status === 'speaking' ? 'scale-110' : 'scale-100'
        }`}>
          {isActive && (
            <>
              <div className={`absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping [animation-duration:3s] ${status === 'speaking' ? 'opacity-100' : 'opacity-0'}`}></div>
              <div className={`absolute inset-[-20px] rounded-full border border-purple-500/20 animate-pulse ${status === 'listening' ? 'opacity-100' : 'opacity-0'}`}></div>
            </>
          )}
          
          <div className={`w-32 h-32 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 shadow-2xl transition-shadow duration-500 ${
            isActive ? 'shadow-indigo-500/50' : 'shadow-none'
          }`}>
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mb-8 max-w-lg">
        <h2 className="text-3xl font-bold text-white mb-2">
          {status === 'idle' && "ผู้ช่วยสั่งงานด้วยเสียง"}
          {status === 'connecting' && "กำลังเชื่อมต่อ..."}
          {status === 'listening' && "Nexus กำลังฟังคุณ..."}
          {status === 'speaking' && "Nexus กำลังตอบกลับ..."}
        </h2>
        <p className="text-zinc-400">
          {status === 'idle' && "คลิกปุ่มด้านล่างเพื่อเริ่มการสนทนาภาษาไทยอย่างเป็นธรรมชาติกับ AI ของคุณ"}
          {status !== 'idle' && "พูดได้เลยครับ คุณสามารถพูดแทรกได้ทุกเมื่อ"}
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        {!isActive ? (
          <button
            onClick={startSession}
            className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
          >
            เปิดใช้งานเสียง (Activate)
          </button>
        ) : (
          <button
            onClick={stopSession}
            className="px-10 py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-semibold rounded-2xl border border-red-500/20 transition-all active:scale-95"
          >
            ปิดการทำงาน
          </button>
        )}

        <div className="w-full mt-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 h-48 overflow-y-auto text-left">
          {transcripts.length === 0 ? (
            <p className="text-zinc-600 text-sm italic">ยังไม่มีประวัติการสนทนา...</p>
          ) : (
            transcripts.map((t, i) => (
              <p key={i} className={`text-sm mb-2 ${t.startsWith('คุณ:') ? 'text-zinc-300' : 'text-indigo-400 font-medium'}`}>
                {t}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveAssistant;
