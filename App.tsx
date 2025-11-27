import React, { useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import HandTracker from './components/HandTracker';
import HolographicEarth from './components/HolographicEarth';
import HUDOverlay from './components/HUDOverlay';
import DraggablePanel from './components/DraggablePanel';
import { InteractionRef, EarthRegion } from './types';

const App: React.FC = () => {
  // Shared Mutable State for High-Performance Loop
  const interactionRef = useRef<InteractionRef['current']>({
    leftHand: { present: false, x: 0.5, y: 0.5, pinching: false, pinchDistance: 0 },
    rightHand: { present: false, x: 0.5, y: 0.5, pinching: false, screenX: 0, screenY: 0 }
  });

  const [currentRegion, setCurrentRegion] = useState<EarthRegion>('扫描中...');

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden cursor-none">
      
      {/* Layer 1: Webcam & Vision Logic */}
      <HandTracker interactionRef={interactionRef} />

      {/* Layer 2: 3D Scene */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ alpha: true, antialias: true }}>
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#00FFFF" />
            <pointLight position={[-10, -10, -5]} intensity={0.5} color="#0088ff" />
            
            <Suspense fallback={null}>
                <HolographicEarth 
                    interactionRef={interactionRef} 
                    onRegionChange={setCurrentRegion}
                />
            </Suspense>
        </Canvas>
      </div>

      {/* Layer 3: Interactive UI Panel */}
      <DraggablePanel interactionRef={interactionRef} earthRegion={currentRegion} />

      {/* Layer 4: Static HUD Overlay */}
      <HUDOverlay interactionRef={interactionRef} />

    </main>
  );
};

export default App;