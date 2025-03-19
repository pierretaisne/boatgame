import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ExplosionProps {
  position: [number, number, number];
  onComplete?: () => void;
}

const PARTICLE_COUNT = 50;
const EXPLOSION_DURATION = 2;
const EXPLOSION_FORCE = 10;
const PARTICLE_COLORS = ['#ff4400', '#ff8800', '#ffaa00', '#ffcc00', '#ffff00'];

export default function Explosion({ position, onComplete }: ExplosionProps) {
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
        (Math.random() - 0.5) * EXPLOSION_FORCE,
        Math.random() * EXPLOSION_FORCE,
        (Math.random() - 0.5) * EXPLOSION_FORCE
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
    if (elapsed > EXPLOSION_DURATION) {
      if (onComplete) onComplete();
      return;
    }

    const progress = elapsed / EXPLOSION_DURATION;
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
      const scale = 1 - progress;
      particle.scale.set(scale, scale, scale);
    });
  });

  return (
    <group position={position}>
      <group ref={particles}>
        {Array(PARTICLE_COUNT).fill(null).map((_, i) => (
          <mesh key={i} position={[0, 0, 0]}>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial 
              color={PARTICLE_COLORS[i % PARTICLE_COLORS.length]}
              emissive={PARTICLE_COLORS[i % PARTICLE_COLORS.length]}
              emissiveIntensity={0.5}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
} 