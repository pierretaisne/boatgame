import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WaterSplashProps {
  position: [number, number, number];
  onComplete?: () => void;
}

const PARTICLE_COUNT = 20;
const SPLASH_DURATION = 1;
const SPLASH_FORCE = 5;
const SPLASH_COLORS = ['#ffffff', '#a3d7ff', '#70c3ff'];

export default function WaterSplash({ position, onComplete }: WaterSplashProps) {
  const particles = useRef<THREE.Group>(null);
  const startTime = useRef(Date.now());
  const particleData = useRef<Array<{
    velocity: THREE.Vector3;
    rotationSpeed: THREE.Vector3;
  }>>([]);

  useEffect(() => {
    if (!particles.current) return;

    // Initialize particle velocities and rotation speeds
    particleData.current = Array(PARTICLE_COUNT).fill(null).map(() => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * SPLASH_FORCE,
        Math.random() * SPLASH_FORCE,
        (Math.random() - 0.5) * SPLASH_FORCE
      ),
      rotationSpeed: new THREE.Vector3(
        Math.random() * 2,
        Math.random() * 2,
        Math.random() * 2
      )
    }));
  }, []);

  useFrame(() => {
    if (!particles.current) return;

    const elapsed = (Date.now() - startTime.current) / 1000;
    if (elapsed > SPLASH_DURATION) {
      if (onComplete) onComplete();
      return;
    }

    const progress = elapsed / SPLASH_DURATION;
    const gravity = -9.8;

    // Update each particle
    particles.current.children.forEach((particle, i) => {
      const data = particleData.current[i];
      if (!data) return;

      // Update position with gravity
      particle.position.x += data.velocity.x * 0.016;
      particle.position.y += (data.velocity.y + gravity * elapsed) * 0.016;
      particle.position.z += data.velocity.z * 0.016;

      // Update rotation
      particle.rotation.x += data.rotationSpeed.x * 0.016;
      particle.rotation.y += data.rotationSpeed.y * 0.016;
      particle.rotation.z += data.rotationSpeed.z * 0.016;

      // Fade out
      const scale = (1 - progress) * 0.5;
      particle.scale.set(scale, scale, scale);
    });
  });

  return (
    <group position={position}>
      <group ref={particles}>
        {Array(PARTICLE_COUNT).fill(null).map((_, i) => (
          <mesh key={i} position={[0, 0, 0]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial 
              color={SPLASH_COLORS[i % SPLASH_COLORS.length]}
              transparent={true}
              opacity={0.6}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
} 