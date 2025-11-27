import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { InteractionRef, EarthRegion } from '../types';

interface HolographicEarthProps {
  interactionRef: InteractionRef;
  onRegionChange: (region: EarthRegion) => void;
}

const HolographicEarth: React.FC<HolographicEarthProps> = ({ interactionRef, onRegionChange }) => {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // Interaction damping values
  const targetRotation = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetScale = useRef<number>(1.2);
  
  // Load texture (Standard earth texture map)
  const earthTexture = useMemo(() => 
    new THREE.TextureLoader().load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'), 
  []);

  // Calculate current region based on Y rotation
  const updateRegion = (rotationY: number) => {
    // Normalize rotation to 0 - 2PI
    let normalizedY = rotationY % (Math.PI * 2);
    if (normalizedY < 0) normalizedY += Math.PI * 2;
    
    // Convert radians to degrees for easier mental mapping (0 is Prime Meridian roughly)
    // Note: Texture mapping specific offset might be needed.
    // Assuming standard UV mapping where 0 is facing Africa/Europe approx.
    const deg = THREE.MathUtils.radToDeg(normalizedY);
    
    // Rough approximation of view based on rotation
    if (deg > 30 && deg < 100) return '美洲';
    if (deg >= 100 && deg < 190) return '太平洋';
    if (deg >= 190 && deg < 280) return '亚洲';
    if (deg >= 280 && deg < 340) return '欧洲/非洲';
    return '大西洋';
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const { leftHand } = interactionRef.current;

    // --- Interaction Logic ---
    if (leftHand.present) {
      // Map hand position to rotation target
      // X position (0-1) controls Y rotation (Spin)
      // Y position (0-1) controls X rotation (Tilt)
      targetRotation.current.y = (leftHand.x - 0.5) * 4 * Math.PI; // +/- 2 PI range
      targetRotation.current.x = (leftHand.y - 0.5) * Math.PI; // +/- PI/2 range

      // Pinch to zoom
      // Base scale 1.2, +/- 0.8 based on pinch
      const zoomFactor = THREE.MathUtils.clamp(leftHand.pinchDistance * 5, 0.5, 2.5);
      targetScale.current = zoomFactor;
    } else {
      // Auto idle rotation if no hand
      targetRotation.current.y += delta * 0.1;
      targetRotation.current.x = THREE.MathUtils.lerp(targetRotation.current.x, 0.2, delta);
      targetScale.current = THREE.MathUtils.lerp(targetScale.current, 1.2, delta);
    }

    // --- Physics/Damping ---
    // Smoothly interpolate current rotation to target
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation.current.y, delta * 2);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation.current.x, delta * 2);
    
    // Smoothly interpolate scale
    const currentScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale.current, delta * 3);
    groupRef.current.scale.set(newScale, newScale, newScale);

    // --- Visual Updates ---
    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * 0.05; // Independent cloud rotation
    }
    if (wireframeRef.current) {
      wireframeRef.current.rotation.y -= delta * 0.02; // Counter-rotating wireframe
    }

    // Callback for UI text
    if (state.clock.elapsedTime % 0.5 < delta) { // Throttle updates slightly
        onRegionChange(updateRegion(groupRef.current.rotation.y));
    }
  });

  return (
    <group ref={groupRef} position={[-2.5, 0, 0]}> 
    {/* Position shifted left as per requirement x=-1 relative to camera, but dependent on camera fov/pos */}
      
      {/* Core Earth Sphere */}
      <Sphere ref={earthRef} args={[1, 64, 64]}>
        <meshPhongMaterial 
          map={earthTexture}
          color="#00FFFF"
          emissive="#004444"
          emissiveIntensity={0.8}
          specular="#00FFFF"
          shininess={50}
          transparent={true}
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>

      {/* Outer Wireframe Glow */}
      <Sphere ref={wireframeRef} args={[1.05, 32, 32]}>
        <meshBasicMaterial 
          color="#00FFFF"
          wireframe={true}
          transparent={true}
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
      
      {/* Decorative Planetary Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.4, 1.42, 64]} />
        <meshBasicMaterial color="#00FFFF" side={THREE.DoubleSide} transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </mesh>
       <mesh rotation={[Math.PI / 2.2, 0, 0]}>
        <ringGeometry args={[1.6, 1.61, 64]} />
        <meshBasicMaterial color="#00FFFF" side={THREE.DoubleSide} transparent opacity={0.1} blending={THREE.AdditiveBlending} />
      </mesh>

    </group>
  );
};

export default HolographicEarth;