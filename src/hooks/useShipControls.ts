import { useState, useEffect } from 'react';

export interface ShipControls {
  position: [number, number, number];
  rotation: number;
  speed: number;
}

export function useShipControls() {
  const [controls, setControls] = useState<ShipControls>({
    position: [0, 0, 0],
    rotation: 0,
    speed: 0,
  });

  useEffect(() => {
    // Check if device is mobile
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return; // Don't set up keyboard controls on mobile

    const keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key in keys) {
        keys[event.key as keyof typeof keys] = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key in keys) {
        keys[event.key as keyof typeof keys] = false;
      }
    };

    const updateShip = () => {
      setControls(prev => {
        let newSpeed = prev.speed;
        let newRotation = prev.rotation;
        const maxSpeed = 30;

        // Update speed
        if (keys.ArrowUp) newSpeed = Math.min(prev.speed + 1, maxSpeed);
        if (keys.ArrowDown) newSpeed = Math.max(prev.speed - 1, -maxSpeed);
        if (!keys.ArrowUp && !keys.ArrowDown) {
          newSpeed = prev.speed * 0.95; // Apply friction
        }

        // Update rotation
        if (keys.ArrowLeft) newRotation = (prev.rotation - 0.05) % (2 * Math.PI);
        if (keys.ArrowRight) newRotation = (prev.rotation + 0.05) % (2 * Math.PI);

        // Calculate new position
        const newX = prev.position[0] + Math.sin(newRotation) * newSpeed * 0.016;
        const newZ = prev.position[2] + Math.cos(newRotation) * newSpeed * 0.016;

        return {
          position: [newX, 0, newZ],
          rotation: newRotation,
          speed: newSpeed,
        };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const interval = setInterval(updateShip, 16);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(interval);
    };
  }, []);

  return controls;
}