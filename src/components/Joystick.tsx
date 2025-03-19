import React, { useEffect, useRef, useState } from 'react';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
}

const Joystick: React.FC<JoystickProps> = ({ onMove }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = joystickRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(true);
    setStartPosition({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const rect = joystickRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = touch.clientX - rect.left - startPosition.x;
    const y = touch.clientY - rect.top - startPosition.y;

    // Calculate distance from center
    const distance = Math.sqrt(x * x + y * y);
    const maxDistance = 50; // Maximum distance the joystick can move

    if (distance > maxDistance) {
      // Normalize the position to the maximum distance
      const angle = Math.atan2(y, x);
      setPosition({
        x: Math.cos(angle) * maxDistance,
        y: Math.sin(angle) * maxDistance
      });
    } else {
      setPosition({ x, y });
    }

    // Normalize values between -1 and 1
    onMove(
      position.x / maxDistance,
      position.y / maxDistance
    );
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    onMove(0, 0); // Reset movement when joystick is released
  };

  return (
    <div 
      className="fixed bottom-8 left-8 w-32 h-32 sm:hidden"
      style={{ touchAction: 'none' }}
    >
      <div
        ref={joystickRef}
        className="absolute w-full h-full bg-white/30 rounded-full border-2 border-white/50"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="absolute w-12 h-12 bg-white/80 rounded-full border-2 border-white"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        />
      </div>
    </div>
  );
};

export default Joystick; 