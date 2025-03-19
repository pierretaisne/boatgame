import { Billboard } from '@react-three/drei';
import * as THREE from 'three';

interface HealthBarProps {
  maxHealth: number;
  currentHealth: number;
  position: [number, number, number];
}

export default function HealthBar({ maxHealth, currentHealth, position }: HealthBarProps) {
  const healthPercent = currentHealth / maxHealth;
  const barWidth = 6;
  const barHeight = 0.4;

  return (
    <Billboard
      position={position}
      follow={true}
      lockX={false}
      lockY={false}
      lockZ={false}
    >
      {/* Background (gray) bar */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[barWidth, barHeight]} />
        <meshBasicMaterial color="#444444" transparent opacity={0.9} />
      </mesh>

      {/* Health (green to red) bar */}
      <mesh position={[-(barWidth * (1 - healthPercent)) / 2, 0, 0.01]}>
        <planeGeometry args={[barWidth * healthPercent, barHeight]} />
        <meshBasicMaterial 
          color={new THREE.Color().setHSL(healthPercent * 0.3, 1, 0.5)}
          transparent={true}
          opacity={0.9}
        />
      </mesh>
    </Billboard>
  );
} 