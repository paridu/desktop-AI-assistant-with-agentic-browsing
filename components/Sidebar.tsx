
import React from 'react';
import { ViewMode } from '../types';

interface SidebarProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const navItems = [
    { id: ViewMode.AGENT, icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'ผู้ช่วยอัจฉริยะ', sub: 'Nexus Agent' },
    { id: ViewMode.VOICE, icon: 'M12 18.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9z', label: 'สั่งงานด้วยเสียง', sub: 'Voice AI' },
    { id: ViewMode.CODE, icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'เขียนโปรแกรม', sub: 'Code Lab' },
    { id: ViewMode.SETTINGS, icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', label: 'ตั้งค่า', sub: 'Settings' },
  ];

  return (
    <div className="w-20 md:w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full transition-all duration-300">
      <div className="p-6 mb-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight hidden md:block">Nexus AI</span>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex flex-col md:flex-row md:items-center gap-1 md:gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeView === item.id 
                ? 'bg-indigo-600/10 text-indigo-400' 
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <svg className={`w-6 h-6 shrink-0 transition-transform ${activeView === item.id ? 'scale-110' : 'group-hover:scale-110'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <div className="text-left hidden md:block">
              <p className="font-medium text-sm leading-none mb-1">{item.label}</p>
              <p className="text-[10px] opacity-50 font-mono uppercase tracking-wider">{item.sub}</p>
            </div>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 p-4 rounded-2xl border border-indigo-500/20 hidden md:block">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">รุ่นโปร (Pro)</p>
          <p className="text-sm text-zinc-300 mb-3">ปลดล็อกความสามารถขั้นสูงและการค้นหาข้อมูล</p>
          <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg transition-colors">
            อัปเกรดตอนนี้
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
