
import React, { useState } from 'react';
import { generateCode } from '../services/geminiService';

const CodeWorkspace: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('// โค้ดของคุณจะปรากฏที่นี่...\n\nfunction main() {\n  console.log("ยินดีต้อนรับสู่ Nexus Code Lab");\n}');
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['$ nexus-cli initialized', '$ ระบบพร้อมสำหรับการเขียนโปรแกรมอัตโนมัติ']);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setTerminalOutput(prev => [...prev, `$ กำลังสร้างโค้ดสำหรับ: ${prompt}`]);
    
    try {
      const result = await generateCode(prompt);
      const cleanCode = result.replace(/```[a-z]*\n/gi, '').replace(/```/g, '');
      setCode(cleanCode);
      setTerminalOutput(prev => [...prev, '$ สร้างโค้ดสำเร็จ', '$ อัปเดตไฟล์ main.ts แล้ว']);
      setPrompt('');
    } catch (err) {
      setTerminalOutput(prev => [...prev, '$ ข้อผิดพลาด: ไม่สามารถสร้างโค้ดได้']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-zinc-950 overflow-hidden">
      <div className="flex-1 flex flex-col border-r border-zinc-800">
        <div className="flex items-center justify-between px-6 py-3 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Editor (เครื่องมือแก้ไข)</span>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/20"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/20"></div>
            </div>
          </div>
          <div className="text-xs text-zinc-400 bg-zinc-800 px-3 py-1 rounded-md">main.ts</div>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 bg-zinc-950 text-indigo-300 font-mono p-6 resize-none focus:outline-none text-sm leading-relaxed"
          spellCheck={false}
        />
      </div>

      <div className="w-full md:w-96 flex flex-col bg-zinc-900/30 backdrop-blur-sm">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
            </svg>
            สั่งงานด้วย CLI (ภาษาไทย)
          </h3>
          <div className="space-y-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="เช่น: เขียน React Hook สำหรับจัดการขนาดหน้าจอ..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 h-24"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2 rounded-xl transition-all active:scale-[0.98]"
            >
              {loading ? 'กำลังประมวลผล...' : 'สร้างโค้ดทันที'}
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col min-h-0">
          <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-4">เทอร์มินัล (Terminal)</p>
          <div className="flex-1 bg-zinc-950 rounded-xl border border-zinc-800 p-4 font-mono text-[12px] overflow-y-auto">
            {terminalOutput.map((line, i) => (
              <div key={i} className="mb-1">
                <span className={line.startsWith('$ ข้อผิดพลาด') ? 'text-red-400' : 'text-emerald-500'}>
                  {line.split(' ')[0]}
                </span>
                <span className="text-zinc-400 ml-2">{line.split(' ').slice(1).join(' ')}</span>
              </div>
            ))}
            {loading && <div className="animate-pulse text-indigo-400">_</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeWorkspace;
