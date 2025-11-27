import React, { useState, useEffect } from 'react';
import { Cpu, Clock, AlertTriangle, Activity } from 'lucide-react';
import { InteractionRef } from '../types';

interface HUDOverlayProps {
    interactionRef: InteractionRef;
}

const HUDOverlay: React.FC<HUDOverlayProps> = ({ interactionRef }) => {
  const [time, setTime] = useState(new Date());
  const [hexStream, setHexStream] = useState<string[]>([]);
  const [handStatus, setHandStatus] = useState({ left: false, right: false });

  useEffect(() => {
    // Time update
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Hex stream simulation
    const hexTimer = setInterval(() => {
      setHexStream(prev => {
        const next = [...prev, Math.random().toString(16).substring(2, 8).toUpperCase()];
        if (next.length > 8) next.shift();
        return next;
      });
    }, 200);

    // Poll ref for UI updates
    const statusTimer = setInterval(() => {
        setHandStatus({
            left: interactionRef.current.leftHand.present,
            right: interactionRef.current.rightHand.present
        });
    }, 200);

    return () => {
        clearInterval(timer);
        clearInterval(hexTimer);
        clearInterval(statusTimer);
    };
  }, [interactionRef]);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden select-none">
      {/* Scanline Overlay */}
      <div className="scanlines absolute inset-0 opacity-20"></div>
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.8)_100%)]"></div>

      {/* Top Left: System Status */}
      <div className="absolute top-8 left-8 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-cyan-400 border-l-4 border-cyan-400 pl-3">
            <Cpu className="w-6 h-6 animate-pulse" />
            <div className="flex flex-col">
                <span className="text-xs font-bold tracking-widest opacity-70">SYSTEM CORE</span>
                <span className="text-xl font-bold hud-text-glow">ONLINE</span>
            </div>
        </div>
        
        {/* Hex Rain */}
        <div className="font-mono text-[10px] text-cyan-700 opacity-60 flex flex-col h-24 overflow-hidden border-l border-cyan-900/50 pl-2">
            {hexStream.map((hex, i) => (
                <span key={i} className="animate-pulse">0x{hex}</span>
            ))}
        </div>
      </div>

      {/* Top Right: Title & Time */}
      <div className="absolute top-8 right-8 text-right">
        <h1 className="text-4xl font-black text-cyan-400 tracking-tighter hud-text-glow italic">J.A.R.V.I.S</h1>
        <div className="text-cyan-200 text-sm tracking-[0.5em] mb-2 opacity-80">SYSTEM INTERFACE</div>
        <div className="flex items-center justify-end gap-3 text-cyan-300 font-mono text-xl border-b border-cyan-500/30 pb-2">
            <span>{time.toLocaleTimeString()}</span>
            <Clock className="w-4 h-4 animate-spin-slow" />
        </div>
      </div>

      {/* Bottom Left: Hand Tracking Status */}
      <div className="absolute bottom-8 left-8 bg-black/40 border border-cyan-800 p-4 rounded-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 text-cyan-400 mb-2 border-b border-cyan-900 pb-1">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-bold">BIO-METRIC SENSORS</span>
        </div>
        <div className="space-y-2 font-mono text-xs">
            <div className={`flex items-center justify-between gap-4 transition-colors ${handStatus.left ? 'text-cyan-300' : 'text-red-900'}`}>
                <span>L-HAND (EARTH)</span>
                <span>{handStatus.left ? '[CONNECTED]' : '[SEARCHING]'}</span>
            </div>
            <div className={`flex items-center justify-between gap-4 transition-colors ${handStatus.right ? 'text-cyan-300' : 'text-red-900'}`}>
                <span>R-HAND (PANEL)</span>
                <span>{handStatus.right ? '[CONNECTED]' : '[SEARCHING]'}</span>
            </div>
        </div>
      </div>

      {/* Bottom Center: Decorative Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-cyan-900/50 flex items-center justify-center">
        <div className="w-1/2 h-full bg-cyan-400 blur-[2px] animate-pulse-fast"></div>
      </div>
      
      {/* Interaction Prompts */}
      {!handStatus.left && !handStatus.right && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-cyan-500 border border-cyan-500 p-4 bg-black/50 animate-pulse">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                <p>INITIALIZE HAND TRACKING</p>
                <p className="text-xs mt-2">RAISE HANDS TO CAMERA</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default HUDOverlay;