import { useEffect, useRef } from 'react';

export interface ShipControls {
  position: [number, number, number];
  rotation: number;
  speed: number;
}

const ROTATION_SPEED = 2;
const MAX_SPEED = 5;
const ACCELERATION = 2;
const DECELERATION = 1;

export function useShipControls(
  initialState: ShipControls,
  onFire?: (isPortSide: boolean) => void
) {
  const controls = useRef({
    position: [...initialState.position] as [number, number, number],
    rotation: initialState.rotation,
    speed: initialState.speed,
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  // Update ref when props change
  useEffect(() => {
    controls.current.position = [...initialState.position] as [number, number, number];
    controls.current.rotation = initialState.rotation;
    controls.current.speed = initialState.speed;
  }, [initialState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault(); // Prevent default browser behavior
      console.log('Key pressed:', e.key);
      switch (e.key) {
        case 'w':
        case 'ArrowUp':
          controls.current.forward = true;
          break;
        case 's':
        case 'ArrowDown':
          controls.current.backward = true;
          break;
        case 'a':
        case 'ArrowLeft':
          controls.current.left = true;
          break;
        case 'd':
        case 'ArrowRight':
          controls.current.right = true;
          break;
        case 'q': // Fire port (left) side
          if (onFire) onFire(true);
          break;
        case 'e': // Fire starboard (right) side
          if (onFire) onFire(false);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      e.preventDefault(); // Prevent default browser behavior
      switch (e.key) {
        case 'w':
        case 'ArrowUp':
          controls.current.forward = false;
          break;
        case 's':
        case 'ArrowDown':
          controls.current.backward = false;
          break;
        case 'a':
        case 'ArrowLeft':
          controls.current.left = false;
          break;
        case 'd':
        case 'ArrowRight':
          controls.current.right = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onFire]);

  const update = (delta: number) => {
    const state = controls.current;
    let changed = false;

    // Update rotation
    if (state.left) {
      state.rotation += ROTATION_SPEED * delta;
      changed = true;
    }
    if (state.right) {
      state.rotation -= ROTATION_SPEED * delta;
      changed = true;
    }

    // Update speed
    if (state.forward) {
      state.speed = Math.min(state.speed + ACCELERATION * delta, MAX_SPEED);
      changed = true;
    } else if (state.backward) {
      state.speed = Math.max(state.speed - ACCELERATION * delta, -MAX_SPEED);
      changed = true;
    } else if (state.speed !== 0) {
      // Apply deceleration when no input
      if (Math.abs(state.speed) < DECELERATION * delta) {
        state.speed = 0;
      } else {
        state.speed -= Math.sign(state.speed) * DECELERATION * delta;
      }
      changed = true;
    }

    // Only update position if there's movement
    if (changed) {
      const movement = state.speed * delta;
      const newPosition: [number, number, number] = [...state.position];
      newPosition[0] += Math.sin(state.rotation) * movement;
      newPosition[2] += Math.cos(state.rotation) * movement;
      state.position = newPosition;
    }

    return {
      position: [...state.position] as [number, number, number],
      rotation: state.rotation,
      speed: state.speed,
    };
  };

  return { update };
}