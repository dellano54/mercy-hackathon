import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import HUDOverlay from './components/HUDOverlay';
import LiveIncidentFeed from './components/LiveIncidentFeed';
import { Mic, Search, AlertCircle, MessageSquare, Zap, Shield, Activity } from 'lucide-react';
import { cn } from './lib/utils';

type AgentState = 'idle' | 'listening' | 'talking' | 'analyzing' | 'alert';

function App() {
  const [state, setState] = useState<AgentState>('idle');
  const [sessionTime, setSessionTime] = useState('00:00:00');
  const [confidence] = useState(97.5);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const delta = Date.now() - start;
      const h = Math.floor(delta / 3600000).toString().padStart(2, '0');
      const m = Math.floor((delta % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((delta % 60000) / 1000).toString().padStart(2, '0');
      setSessionTime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getVideoSource = () => {
    switch (state) {
      case 'analyzing':
        return '/analyzing.mp4';
      case 'alert':
        return '/speaking.mp4';
      case 'listening':
        return '/noding.mp4';
      case 'idle':
        return '/idle.mp4';
      default:
        return '/idle.mp4';
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden font-sans select-none bg-black">
      
      {/* FULL SCREEN AGENT BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <video 
          key={getVideoSource()}
          src={getVideoSource()} 
          autoPlay 
          loop 
          muted 
          playsInline
          className={cn(
            "w-full h-full object-cover transition-all duration-1000",
            state === 'alert' ? "sepia-[0.2] saturate-[1.2]" : ""
          )}
        />
        {/* Subtle vignette to help text legibility without "fading" her */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
      </div>

      {/* GLOBAL HUD ELEMENTS */}
      <HUDOverlay 
        confidence={confidence} 
        sessionTime={sessionTime} 
        state={state} 
      />

      {/* UI CONTENT LAYER */}
      <div className="relative z-20 w-full h-full flex flex-col pointer-events-none p-6">
        
        {/* Top Header */}
        <header className="flex justify-between items-center w-full mb-4">
          <div className="flex items-center gap-3 liquid-glass px-5 py-3 rounded-2xl pointer-events-auto">
            <div className="w-10 h-10 bg-white/10 flex items-center justify-center rounded-xl">
              <Zap className="text-white fill-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-white">AEGIS CONTROL</h1>
              <p className="text-[8px] tracking-[0.4em] font-bold text-white/50 uppercase">Emergency Dispatch v2.4</p>
            </div>
          </div>

          <div className="flex gap-1.5 pointer-events-auto liquid-glass p-1.5 rounded-full">
            {['idle', 'listening', 'analyzing', 'alert'].map((s) => (
              <button
                key={s}
                onClick={() => setState(s as AgentState)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[9px] uppercase font-black tracking-widest transition-all duration-300",
                  state === s 
                    ? "bg-white text-black shadow-lg scale-105" 
                    : "text-white/40 hover:text-white hover:bg-white/10"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </header>

        {/* Middle Interactive Zone */}
        <main className="flex-1 flex items-center justify-between gap-6 overflow-hidden">
          
          {/* Left Feed */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-72 flex flex-col gap-4 liquid-glass p-5 rounded-3xl pointer-events-auto h-[500px]"
          >
            <LiveIncidentFeed />
          </motion.div>

          {/* Center Space - HUD Targetings (Video is background) */}
          <div className="flex-1 flex flex-col items-center justify-center relative">
              <div className="relative w-[500px] h-[500px] flex items-center justify-center">
                {/* HUD Focus Rings */}
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border border-white/10 rounded-full"
                />
                <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-10 border border-white/5 rounded-full border-dashed"
                />
                <motion.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-[45%] border-[0.5px] border-white/20 rounded-full"
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div 
                  key={state}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-10 flex flex-col items-center gap-2"
                >
                    <div className="liquid-glass px-6 py-2 rounded-full border-white/20">
                        <span className="text-[9px] font-black tracking-[0.4em] uppercase text-white">
                            {state === 'idle' ? 'Standby Mode' : `Agent System // ${state}`}
                        </span>
                    </div>
                    {state === 'listening' && (
                        <div className="flex gap-1.5 h-4 items-center">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <motion.div 
                                    key={i}
                                    animate={{ height: [4, 16, 4], opacity: [0.4, 1, 0.4] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.08 }}
                                    className="w-[2px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
              </AnimatePresence>
          </div>

          {/* Right Status Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-72 flex flex-col gap-4 pointer-events-auto"
          >
            <div className="liquid-glass p-5 rounded-3xl flex flex-col gap-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Network Load</span>
                  <span className="text-[10px] font-mono font-bold text-white">14.2 GB/S</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: ['40%', '55%', '48%'] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="h-full bg-white/40" 
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Neural Stream</span>
                  <span className="text-[10px] font-mono font-bold text-white">22.4%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: ['20%', '30%', '24%'] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="h-full bg-white/60" 
                  />
                </div>
              </div>
            </div>

            <div className="liquid-glass p-5 rounded-3xl flex flex-col gap-4">
                <h4 className="text-[8px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
                    <Activity className="w-3 h-3" /> System Logs
                </h4>
                <div className="flex flex-col gap-3">
                    {[
                        { icon: Mic, msg: "Voice stream active", time: "12:04" },
                        { icon: Search, msg: "CCTV indexed", time: "12:03" },
                        { icon: AlertCircle, msg: "Priority high", time: "12:01" }
                    ].map((log, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <log.icon className="w-3.5 h-3.5 text-white/30" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-white truncate leading-tight">{log.msg}</p>
                                <span className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">{log.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </motion.div>

        </main>

        {/* Footer Navigation */}
        <footer className="flex justify-center w-full mt-4">
            <div className="liquid-glass px-2 py-2 rounded-2xl flex gap-1 pointer-events-auto shadow-2xl">
                {[Mic, Search, MessageSquare, Shield, Activity].map((Icon, i) => (
                    <button 
                        key={i} 
                        className="p-3 rounded-xl hover:bg-white/10 transition-all duration-300 group"
                    >
                        <Icon className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                    </button>
                ))}
            </div>
        </footer>
      </div>
      
      {/* GLOBAL HUD SCANNING LINE */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.01] z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
    </div>
  );
}

export default App;
