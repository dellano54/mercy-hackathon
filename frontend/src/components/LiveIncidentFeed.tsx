import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { motion } from 'framer-motion';
import { MapPin, AlertTriangle, PhoneCall } from 'lucide-react';

const MOCK_INCIDENTS = [
  { id: 1, type: 'Medical', location: 'Downtown Hub', time: '2m ago', severity: 'High' },
  { id: 2, type: 'Fire', location: 'North District', time: '5m ago', severity: 'Critical' },
  { id: 3, type: 'Rescue', location: 'Waterfront', time: '12m ago', severity: 'Medium' },
  { id: 4, type: 'Police', location: 'Subway Terminal', time: '15m ago', severity: 'High' },
  { id: 5, type: 'Medical', location: 'Skyline Plaza', time: '18m ago', severity: 'Low' },
];

export default function LiveIncidentFeed() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      gsap.to(el, {
        y: "-50%",
        duration: 30,
        ease: "linear",
        repeat: -1,
      });
    }
  }, []);

  return (
    <div className="w-80 h-[500px] flex flex-col gap-4 overflow-hidden mask-fade-y">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-orange-500" />
        <h3 className="text-[10px] uppercase tracking-widest font-bold text-black/50">Live Incident Feed</h3>
      </div>
      
      <div className="relative flex-1 overflow-hidden pointer-events-auto">
        <div ref={scrollRef} className="flex flex-col gap-3 pb-8">
          {[...MOCK_INCIDENTS, ...MOCK_INCIDENTS].map((incident, i) => (
            <motion.div 
              key={`${incident.id}-${i}`}
              whileHover={{ scale: 1.02 }}
              className="liquid-glass p-4 rounded-2xl flex flex-col gap-2 cursor-pointer transition-all duration-300 hover:bg-white/60 group"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-3 h-3 text-black/40 group-hover:text-black/80 transition-colors" />
                  <span className="text-xs font-semibold text-black/70">{incident.type} Dispatch</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold ${
                  incident.severity === 'Critical' ? 'bg-red-500/10 text-red-600' :
                  incident.severity === 'High' ? 'bg-orange-500/10 text-orange-600' :
                  'bg-blue-500/10 text-blue-600'
                }`}>
                  {incident.severity}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-black/40 text-[10px]">
                <MapPin className="w-2.5 h-2.5" />
                <span>{incident.location}</span>
                <span className="mx-1 opacity-20">•</span>
                <span>{incident.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
