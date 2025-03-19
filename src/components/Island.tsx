import { useGLTF } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface IslandProps {
  position: [number, number, number];
  onHarborClick: () => void;
}

export default function Island({ position, onHarborClick }: IslandProps) {
  const islandRef = useRef<THREE.Group>(null);
  const harborRef = useRef<THREE.Mesh>(null);

  // Temporary basic geometry for the island and harbor
  useEffect(() => {
    if (islandRef.current && harborRef.current) {
      // Add basic textures and materials here when needed
    }
  }, []);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.object === harborRef.current) {
      onHarborClick();
    }
  };

  return (
    <group position={position} ref={islandRef}>
      {/* Temporary island mesh */}
      <mesh receiveShadow>
        <cylinderGeometry args={[4, 5, 1, 32]} />
        <meshStandardMaterial color="#a87d5d" />
      </mesh>

      {/* Temporary harbor mesh */}
      <mesh 
        ref={harborRef}
        position={[3, 0.6, 0]} 
        onClick={handleClick}
        onPointerOver={(e) => (e.object.material.color.set('#4a4a4a'))}
        onPointerOut={(e) => (e.object.material.color.set('#6a6a6a'))}
      >
        <boxGeometry args={[2, 0.2, 2]} />
        <meshStandardMaterial color="#6a6a6a" />
      </mesh>
    </group>
  );
}