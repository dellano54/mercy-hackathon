import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Clock } from 'lucide-react';

interface HUDOverlayProps {
  confidence: number;
  sessionTime: string;
  state: 'idle' | 'listening' | 'talking' | 'analyzing' | 'alert';
}

export default function HUDOverlay({ confidence, sessionTime, state }: HUDOverlayProps) {
  return (
    <div className={cn(
        "absolute inset-0 pointer-events-none flex flex-col justify-between p-10 z-10 transition-colors duration-1000",
        state === 'alert' ? "bg-red-500/[0.03] shadow-[inset_0_0_150px_rgba(255,0,0,0.05)]" : ""
    )}>
      {/* HUD Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Corner Brackets */}
      <div className="absolute inset-6 opacity-20 transition-all duration-1000">
        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/40" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/40" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/40" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/40" />
      </div>

      {/* Top HUD Data */}
      <div className="flex justify-between items-start w-full relative z-20 mt-20">
        <div className="flex flex-col gap-1.5">
            <motion.div 
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                  "px-3 py-1 rounded border border-white/5 bg-white/[0.03] backdrop-blur-sm transition-all duration-500",
                  state === 'alert' ? "bg-red-500/10 border-red-500/20" : ""
              )}
            >
              <span className={cn(
                  "text-[9px] font-black tracking-[0.2em] uppercase",
                  state === 'alert' ? "text-red-400" : "text-white/40"
              )}>{confidence}% SYNC</span>
            </motion.div>
            
            <div className="flex flex-col pl-0.5 opacity-20">
                <span className="text-[8px] font-mono tracking-widest text-white uppercase">LAX_HUB_01</span>
                <span className="text-[8px] font-mono tracking-widest text-white uppercase">34.05 / 118.24</span>
            </div>
        </div>

        <div className="text-right flex flex-col items-end gap-1.5">
            <div className="px-3 py-1 rounded border border-white/5 bg-white/[0.03] backdrop-blur-sm">
                <span className="text-[9px] font-mono tracking-widest text-white/40 uppercase">Latency: 14ms</span>
            </div>
            <div className="opacity-20 flex flex-col items-end">
                <span className="text-[8px] font-mono tracking-widest text-white uppercase">Buffer_Ready</span>
                <span className="text-[8px] font-mono tracking-widest text-white uppercase">Core_Secure</span>
            </div>
        </div>
      </div>

      {/* Bottom HUD Data */}
      <div className="flex justify-between items-end w-full relative z-20">
        <div className="flex flex-col gap-1 opacity-20">
            <span className="text-[8px] font-mono tracking-widest text-white uppercase">AES_256_ACTIVE</span>
            <span className="text-[8px] font-mono tracking-widest text-white uppercase">Neural_Link_V2</span>
        </div>
        
        <div className="text-right flex flex-col items-end gap-2">
            <div className="liquid-glass px-4 py-1.5 rounded-full flex items-center gap-2 border-white/10 backdrop-blur-3xl mb-1 pointer-events-none">
                <Clock className="w-3.5 h-3.5 text-white/60" />
                <span className="text-xs font-mono tracking-tighter text-white font-bold">{sessionTime}</span>
            </div>
            <div className="flex flex-col items-end opacity-20">
              <span className="text-[8px] uppercase tracking-[0.3em] font-black text-white">AEGIS_CORE // SYSTEM_ACTIVE</span>
            </div>
        </div>
      </div>
    </div>
  );
}
