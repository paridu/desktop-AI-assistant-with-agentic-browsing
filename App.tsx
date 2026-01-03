
import React, { useState } from 'react';
import { ViewMode } from './types';
import Sidebar from './components/Sidebar';
import AgentChat from './components/AgentChat';
import LiveAssistant from './components/LiveAssistant';
import CodeWorkspace from './components/CodeWorkspace';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.AGENT);

  const renderView = () => {
    switch (activeView) {
      case ViewMode.AGENT:
        return <AgentChat />;
      case ViewMode.VOICE:
        return <LiveAssistant />;
      case ViewMode.CODE:
        return <CodeWorkspace />;
      case ViewMode.SETTINGS:
        return (
          <div className="h-full flex items-center justify-center p-8 bg-zinc-950">
            <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">API Configuration</label>
                  <p className="text-xs text-zinc-500 mb-4">Nexus uses environment-level API keys for security. Contact your admin to update keys.</p>
                  <div className="p-3 bg-zinc-950 rounded-lg text-xs font-mono text-zinc-500">
                    API_KEY: ****************{process.env.API_KEY?.slice(-4)}
                  </div>
                </div>
                <div className="pt-6 border-t border-zinc-800">
                  <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 rounded-xl transition-colors">
                    Check for Updates
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <AgentChat />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 select-none">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header Strip */}
        <header className="h-16 bg-zinc-900/40 border-b border-zinc-800/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Nexus Desktop v2.4.1 (Online)
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-full border border-zinc-700">
              <svg className="w-3.5 h-3.5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-[10px] font-bold text-zinc-300">2 Alerts</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-[10px] font-bold">
              JD
            </div>
          </div>
        </header>

        {/* Dynamic View Area */}
        <div className="flex-1 min-h-0">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
