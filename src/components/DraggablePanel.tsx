import React, { useEffect, useRef, useState } from 'react';
import { InteractionRef, EarthRegion } from '../types';
import { Globe, Database } from 'lucide-react';

interface DraggablePanelProps {
  interactionRef: InteractionRef;
  earthRegion: EarthRegion;
}

const DraggablePanel: React.FC<DraggablePanelProps> = ({ interactionRef, earthRegion }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: window.innerWidth - 350, y: 150 });
  const isDragging = useRef(false);

  // Stats Data simulation
  const [randomData, setRandomData] = useState<number[]>(Array(5).fill(0));

  useEffect(() => {
    const interval = setInterval(() => {
        setRandomData(prev => prev.map(() => Math.floor(Math.random() * 100)));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const updatePosition = () => {
      const { rightHand } = interactionRef.current;
      
      if (rightHand.present && rightHand.pinching) {
        // Drag logic
        if (!isDragging.current) {
            // Check if hand is close enough to grab (simple distance check could be added here, 
            // but for smooth UX we assume "Pinch Right Hand = Move Panel")
            isDragging.current = true;
        }
        
        // Smooth follow
        const targetX = rightHand.screenX;
        const targetY = rightHand.screenY;
        
        positionRef.current.x += (targetX - positionRef.current.x) * 0.2;
        positionRef.current.y += (targetY - positionRef.current.y) * 0.2;

      } else {
        isDragging.current = false;
      }

      if (panelRef.current) {
        panelRef.current.style.transform = `translate(${positionRef.current.x}px, ${positionRef.current.y}px)`;
        // Update border color based on drag state
        panelRef.current.style.borderColor = isDragging.current ? '#FFFFFF' : '#00FFFF';
      }

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    updatePosition();
    return () => cancelAnimationFrame(animationFrameId);
  }, [interactionRef]);

  return (
    <div 
      ref={panelRef}
      className="absolute top-0 left-0 w-80 bg-black/60 backdrop-blur-sm border-2 border-cyan-400 p-4 box-glow rounded-tr-3xl z-30 pointer-events-none"
      style={{ willChange: 'transform' }}
    >
      <div className="flex items-center justify-between border-b border-cyan-500/50 pb-2 mb-4">
        <h3 className="text-cyan-400 font-bold text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 animate-pulse" />
            地理情报分析
        </h3>
        <span className="text-xs text-cyan-200">{isDragging.current ? '位置锁定: 解除' : '位置锁定: 开启'}</span>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <span className="text-cyan-300 text-sm">目标区域:</span>
            <span className="text-white font-bold tracking-widest hud-text-glow">{earthRegion}</span>
        </div>

        {/* Fake Scan Bars */}
        <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-cyan-600">
                <span>大气密度</span>
                <span>{randomData[0]}%</span>
            </div>
            <div className="w-full bg-cyan-900/50 h-1">
                <div className="h-full bg-cyan-400" style={{width: `${randomData[0]}%`}}></div>
            </div>
        </div>

        <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-cyan-600">
                <span>网络流量</span>
                <span>{randomData[1]} TB/s</span>
            </div>
            <div className="w-full bg-cyan-900/50 h-1">
                <div className="h-full bg-cyan-400" style={{width: `${randomData[1]}%`}}></div>
            </div>
        </div>

         <div className="bg-cyan-900/20 p-2 border border-cyan-800/50 mt-4">
             <div className="flex items-center gap-2 text-cyan-400 text-xs mb-1">
                 <Database className="w-3 h-3"/>
                 <span>加密数据流</span>
             </div>
             <div className="font-mono text-[10px] text-cyan-600 break-all leading-tight opacity-70">
                 0x{randomData[2].toString(16)}{randomData[3].toString(16)}...A7F2...
                 Scanning... Packet Loss: 0.0{randomData[4]}%
             </div>
         </div>
      </div>
      
      {/* Decorative corners */}
      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>
      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
    </div>
  );
};

export default DraggablePanel;