import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertCircle, Radio, Activity, MapPin, Eye, MessageSquare, PhoneCall } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Spline from '@splinetool/react-spline';
import { cn } from './lib/utils';

// --- Shared UI Components (Aceternity/Shadcn Inspired) ---

const GlassCard = ({ className, children, ...props }) => (
  <motion.div 
    className={cn(
      "relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]",
      className
    )}
    {...props}
  >
    {/* Subtle gradient overlay to enhance the glass effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />
    <div className="relative z-10 p-6 h-full flex flex-col">
      {children}
    </div>
  </motion.div>
);

const StatusBadge = ({ state }) => {
  const configs = {
    idle: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    analyzing: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    validating: { color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
    alert: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  };
  const config = configs[state] || configs.idle;
  
  return (
    <div className={cn("px-4 py-1.5 rounded-full border text-[10px] font-mono uppercase tracking-widest flex items-center gap-2", config.bg, config.border, config.color)}>
      <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", config.bg.replace('/10', ''))} />
      {state}
    </div>
  );
};

// --- Specialized Components ---

const AegisAvatar = ({ state }) => {
  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto rounded-[2rem] overflow-hidden border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_0_50px_rgba(14,165,233,0.1)] group">
      {/* Dynamic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 via-transparent to-sky-500/10 z-10 mix-blend-overlay" />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400/50 z-20">
        <motion.div 
          animate={{ scale: state === 'analyzing' || state === 'validating' ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Shield size={100} strokeWidth={1} className={state === 'alert' ? 'text-rose-500/30' : 'text-sky-500/30'} />
        </motion.div>
        <p className="absolute bottom-8 font-mono text-[10px] tracking-[0.3em] uppercase text-white/30">Aegis Core / {state}</p>
      </div>

      {/* Real Video Integration Point */}
      <video 
        autoPlay loop muted playsInline 
        className="object-cover w-full h-full opacity-60 mix-blend-screen"
        key={state}
      >
        <source src={`/vid-assets/${state}.mp4`} type="video/mp4" />
      </video>
    </div>
  );
};

const IncidentItem = ({ incident }) => (
  <motion.div 
    initial={{ x: -20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: 20, opacity: 0 }}
    className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors group relative overflow-hidden"
  >
    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-sky-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
    <div className="flex justify-between items-start mb-2 pl-2">
      <h3 className="text-sky-300 font-bold text-sm tracking-wide">{incident.id}</h3>
      <span className="text-[10px] font-mono text-slate-500">{incident.timestamp.split('T')[1].slice(0, 5)}</span>
    </div>
    <div className="space-y-1.5 text-xs text-slate-300 pl-2">
      <div className="flex items-center gap-2">
        <MapPin size={12} className="text-slate-400" />
        <span className="truncate">{incident.location}</span>
      </div>
      <div className="flex items-center gap-2">
        <AlertCircle size={12} className={incident.severity === 'CRITICAL' ? 'text-rose-500' : 'text-amber-500'} />
        <span className="font-mono tracking-wider">{incident.severity}</span>
      </div>
    </div>
  </motion.div>
);

const CCTVPreview = ({ filePath, location, searchStatus, state }) => {
  const videoUrl = filePath ? `http://localhost:8000/${filePath}` : null;

  return (
    <GlassCard className="p-0 border-white/20 aspect-video shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[9px] font-mono text-white uppercase tracking-[0.2em]">
        <Radio size={10} className="text-rose-500 animate-pulse" />
        {filePath ? `LIVE FEED // ${location}` : 'SYSTEM SCANNING'}
      </div>
      
      <div className="h-full w-full bg-black/60 flex items-center justify-center relative overflow-hidden">
        {filePath ? (
          <div className="relative w-full h-full">
            <video autoPlay loop muted playsInline className="object-cover w-full h-full opacity-90" key={videoUrl}>
              <source src={videoUrl} type="video/mp4" />
            </video>
            
            {/* Liquid Glass Overlay Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent mix-blend-multiply" />
            
            {state === 'validating' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 border-[0.5px] border-sky-500/30 m-6 rounded-xl overflow-hidden backdrop-blur-[2px] bg-sky-500/5"
              >
                <motion.div 
                  animate={{ y: ['0%', '100%'] }} 
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  className="w-full h-32 bg-gradient-to-b from-transparent via-sky-500/20 to-sky-500/5 blur-sm" 
                />
                <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                  <div className="bg-sky-500/20 border border-sky-500/50 text-sky-300 text-[8px] px-2 py-0.5 rounded font-bold tracking-widest backdrop-blur-md">ANALYZING_STREAM</div>
                  <div className="text-sky-400 text-[8px] px-1 font-mono">OBJECT_MATCH: 98%</div>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-6 z-10">
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="relative w-20 h-20 mx-auto"
            >
              <div className="absolute inset-0 border-2 border-t-sky-500 border-r-transparent border-b-transparent border-l-transparent rounded-full opacity-50" />
              <div className="absolute inset-2 border-2 border-b-sky-400 border-t-transparent border-r-transparent border-l-transparent rounded-full opacity-30" />
              <Eye size={24} className="absolute inset-0 m-auto text-sky-500/40" />
            </motion.div>
            <div className="space-y-2">
              <p className="text-sky-400 font-mono text-[10px] uppercase tracking-[0.3em]">{searchStatus || 'Awaiting Data Stream...'}</p>
            </div>
          </div>
        )}
      </div>
      
      {filePath && (
        <div className="absolute bottom-4 right-4 z-20 font-mono text-[8px] text-white/50 text-right leading-relaxed bg-black/40 p-2 rounded backdrop-blur-sm border border-white/5">
          VEC_SEARCH: SUCCESS<br/>
          CONFIDENCE: 0.992<br/>
          MODEL: GEMINI-3.1
        </div>
      )}
    </GlassCard>
  );
};

// --- Main App Layout ---

export default function App() {
  const [state, setState] = useState('idle');
  const [incidents, setIncidents] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [searchStatus, setSearchStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [debrief, setDebrief] = useState(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws/dashboard');
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch(data.type) {
        case 'state_update': setIncidents(data.incidents); break;
        case 'agent_log':
          setState(data.state);
          setLogs(prev => [data.message, ...prev].slice(0, 15));
          break;
        case 'search_progress':
          setSearchStatus(data.message);
          if (data.step === 'match_found') setActiveVideo(data.video);
          break;
        case 'video_analysis':
          setLogs(prev => [`VISION_SYS: ${data.report}`, ...prev].slice(0, 15));
          break;
        case 'dispatch_debrief':
          setDebrief(data.debrief);
          setState('alert');
          break;
      }
    };
    return () => socket.close();
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-slate-100 font-sans selection:bg-sky-500/30 overflow-hidden">
      
      {/* Spline 3D Background - Liquid Metal/Glass Effect */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
        <Spline scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" />
      </div>

      {/* Main Content Wrapper */}
      <div className="relative z-10 h-screen flex flex-col">
        
        {/* Glass Header */}
        <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl shrink-0">
          <div className="container mx-auto px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.3)]">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-black text-2xl tracking-tighter uppercase text-white/90">Aegis <span className="font-light text-sky-400">Core</span></h1>
                <p className="text-[9px] font-mono text-white/40 -mt-1 uppercase tracking-[0.3em]">Autonomous Emergency Agent</p>
              </div>
            </div>
            <StatusBadge state={state} />
          </div>
        </header>

        {/* Responsive Grid Layout */}
        <main className="flex-1 container mx-auto px-8 py-8 grid grid-cols-12 gap-8 min-h-0">
          
          {/* Left Panel: Interaction & Logs */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-full min-h-0">
            <AegisAvatar state={state} />
            
            <GlassCard className="flex-1 min-h-0">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={12} className="text-sky-400" /> Neural Stream
                </span>
                <span className="text-[8px] font-mono bg-sky-500/10 text-sky-300 px-2 py-0.5 rounded border border-sky-500/20">LIVE</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {logs.map((log, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i} 
                    className="text-[10px] font-mono leading-relaxed"
                  >
                    <span className={log.includes('AEGIS') ? 'text-sky-300' : log.includes('CALLER') ? 'text-slate-300' : 'text-amber-300/80'}>
                      {log}
                    </span>
                  </motion.div>
                ))}
                {logs.length === 0 && <p className="text-[10px] font-mono text-white/30 italic">Awaiting audio input...</p>}
              </div>
            </GlassCard>
          </div>

          {/* Center Panel: Visual Verification & Debrief */}
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-6 h-full min-h-0">
            <CCTVPreview filePath={activeVideo?.file_path} location={activeVideo?.location} searchStatus={searchStatus} state={state} />
            
            <GlassCard className="h-48 shrink-0 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500/50 to-transparent opacity-50" />
              <h2 className="text-[10px] font-mono text-white/50 uppercase tracking-[0.2em] mb-4">Command Debrief</h2>
              
              <AnimatePresence mode='wait'>
                {debrief ? (
                  <motion.div 
                    key="debrief"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="h-full flex flex-col justify-between"
                  >
                    <p className="text-sm font-mono text-sky-200 leading-relaxed italic border-l-2 border-sky-500/50 pl-4 py-2 bg-sky-500/5 rounded-r-lg">{debrief}</p>
                    <div className="flex gap-3 mt-4">
                      <div className="px-3 py-1 bg-rose-500/20 border border-rose-500/30 rounded-lg flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-[9px] font-bold text-rose-300 tracking-widest">FIRE/EMS DISPATCHED</span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="empty" className="h-full flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-black/20">
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Standing By</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </div>

          {/* Right Panel: Incident Queue */}
          <div className="col-span-12 lg:col-span-3 flex flex-col h-full min-h-0">
            <GlassCard className="flex-1 min-h-0 flex flex-col p-0">
              <div className="p-6 pb-4 flex items-center justify-between border-b border-white/10 bg-black/20">
                <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50">Active Dispatch</h2>
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="text-[10px] font-mono text-sky-400">{incidents.length}</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/10">
                <AnimatePresence mode='popLayout'>
                  {incidents.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center opacity-30 gap-4"
                    >
                      <Shield size={40} className="text-white" strokeWidth={1} />
                      <p className="text-[10px] font-mono uppercase tracking-widest">Zero Threats</p>
                    </motion.div>
                  ) : (
                    incidents.map(inc => <IncidentItem key={inc.id} incident={inc} />)
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
          </div>

        </main>
      </div>
    </div>
  );
}
