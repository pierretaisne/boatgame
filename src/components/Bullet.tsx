import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BulletProps {
  position: [number, number, number];
  rotation: number;
  onHit?: () => void;
}

export default function Bullet({ position, rotation, onHit }: BulletProps) {
  const bulletRef = useRef<THREE.Mesh>(null);
  const speed = 20;
  const lifetime = 2000; // 2 seconds

  useEffect(() => {
    const timeout = setTimeout(() => {
      onHit?.();
    }, lifetime);

    return () => clearTimeout(timeout);
  }, [onHit]);

  useFrame((state, delta) => {
    if (!bulletRef.current) return;

    // Move bullet forward based on ship's rotation
    bulletRef.current.position.x += Math.sin(rotation) * speed * delta;
    bulletRef.current.position.z += Math.cos(rotation) * speed * delta;
  });

  return (
    <mesh ref={bulletRef} position={position}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial 
        color="#000000"
        emissive="#000000"
        emissiveIntensity={0.2}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}