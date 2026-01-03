
import React, { useState, useRef, useEffect } from 'react';
import { sendMessageWithBrowsing, getAIClient, encodeAudio } from '../services/geminiService';
import { ChatMessage } from '../types';

const AgentChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'listening'>('idle');
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(12).fill(0));
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Voice Input Refs
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopVoiceInput();
    };
  }, []);

  const updateVisualizer = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Sample a few points for the visualizer bars
    const newLevels = [];
    const step = Math.floor(dataArray.length / 12);
    for (let i = 0; i < 12; i++) {
      newLevels.push(dataArray[i * step] / 255);
    }
    setAudioLevels(newLevels);
    animationFrameRef.current = requestAnimationFrame(updateVisualizer);
  };

  const toggleVoiceInput = async () => {
    if (voiceStatus !== 'idle') {
      stopVoiceInput();
      return;
    }

    try {
      setVoiceStatus('connecting');
      const ai = getAIClient();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = inputCtx;

      // Setup Visualizer
      const analyser = inputCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      const source = inputCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      updateVisualizer();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          inputAudioTranscription: {},
          systemInstruction: 'คุณคือระบบช่วยถอดความภาษาไทยและอังกฤษ โปรดถอดความสิ่งที่ผู้ใช้พูดออกมาให้แม่นยำที่สุด',
        },
        callbacks: {
          onopen: () => {
            setVoiceStatus('listening');
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
          onmessage: (msg) => {
            if (msg.serverContent?.inputTranscription) {
              const text = msg.serverContent.inputTranscription.text;
              if (msg.serverContent.turnComplete) {
                setInput(prev => (prev + ' ' + text).trim());
              } else {
                setInput(prev => {
                  return prev.endsWith(text) ? prev : (prev + ' ' + text).trim();
                });
              }
            }
          },
          onerror: (e) => {
            console.error('Voice input error:', e);
            stopVoiceInput();
          },
          onclose: () => {
            setVoiceStatus('idle');
            setAudioLevels(new Array(12).fill(0));
          },
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start voice input:', err);
      setVoiceStatus('idle');
    }
  };

  const stopVoiceInput = () => {
    if (sessionRef.current) {
      try { (sessionRef.current as any).close(); } catch {}
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setVoiceStatus('idle');
    setAudioLevels(new Array(12).fill(0));
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    if (voiceStatus !== 'idle') stopVoiceInput();

    const userMessage: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendMessageWithBrowsing(input);
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || 'แหล่งข้อมูล',
        uri: chunk.web?.uri || '',
      })).filter((s: any) => s.uri) || [];

      const modelMessage: ChatMessage = {
        role: 'model',
        text: response.text || "ขออภัยครับ ไม่สามารถประมวลผลข้อมูลได้ในขณะนี้",
        timestamp: Date.now(),
        groundingSources: sources,
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "เกิดข้อผิดพลาด: ไม่สามารถเชื่อมต่อกับ AI ได้ กรุณาตรวจสอบ API Key ของคุณ",
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
            <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Nexus Agentic Browsing</h2>
            <p className="max-w-md text-zinc-400">สอบถามได้ทุกเรื่อง Nexus จะค้นหาข้อมูลจากเว็บ สรุปคำตอบ และเป็นผู้ช่วยวิจัยส่วนตัวให้คุณ (รองรับภาษาไทย)</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
              
              {msg.groundingSources && msg.groundingSources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2">
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">แหล่งอ้างอิง (Sources)</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingSources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs bg-zinc-800 hover:bg-zinc-700 text-indigo-400 px-3 py-1 rounded-full border border-zinc-700 transition-colors inline-block max-w-[200px] truncate"
                      >
                        {source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex flex-col gap-4">
            {/* Search Grounding Indicator */}
            <div className="flex justify-start">
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <span className="text-xs text-zinc-500 ml-2">กำลังค้นหาข้อมูลภาษาไทยและทั่วโลก...</span>
              </div>
            </div>

            {/* Visual Typing Indicator */}
            <div className="flex justify-start" aria-label="Nexus is typing">
              <div className="bg-zinc-900 border border-zinc-800/50 p-3 px-5 rounded-2xl flex items-center gap-1.5 shadow-xl shadow-indigo-900/5">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-8 bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex flex-col gap-3 relative">
          
          {/* Voice Feedback Overlay */}
          {voiceStatus !== 'idle' && (
            <div className="flex items-center justify-between px-4 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl mb-1">
              <div className="flex items-center gap-3">
                <div className="flex gap-1 items-end h-6 w-16">
                  {audioLevels.map((lvl, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-indigo-500 rounded-full transition-all duration-75"
                      style={{ height: `${Math.max(15, lvl * 100)}%` }}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest animate-pulse">
                  {voiceStatus === 'connecting' ? 'กำลังเชื่อมต่อ...' : 'กำลังฟัง... (Listening)'}
                </span>
              </div>
              <button 
                type="button"
                onClick={stopVoiceInput}
                className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded-md border border-red-500/20 hover:bg-red-500/20 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 w-full">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={voiceStatus !== 'idle' ? "กำลังรับข้อมูลเสียง..." : "พิมพ์คำถามของคุณที่นี่..."}
                className={`w-full bg-zinc-900 border ${voiceStatus !== 'idle' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-zinc-800'} text-white rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all`}
              />
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                  voiceStatus !== 'idle' 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800'
                }`}
                title="Voice Input"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            </div>
            
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgentChat;
