import React, { useEffect, useRef } from 'react';
import nipplejs, { JoystickManagerOptions } from 'nipplejs';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
}

const Joystick: React.FC<JoystickProps> = ({ onMove }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const nippleRef = useRef<any>(null);
  const lastMoveRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!joystickRef.current) return;

    const options: JoystickManagerOptions = {
      zone: joystickRef.current,
      mode: 'static' as const,
      position: { left: '50%', top: '50%' },
      color: 'white',
      size: 150,
      threshold: 0.05,
      fadeTime: 0,
      multitouch: false,
      maxNumberOfNipples: 1,
      dataOnly: false,
      lockX: false,
      lockY: false,
      restOpacity: 0.5,
      restJoystick: true,
    };

    nippleRef.current = nipplejs.create(options);

    nippleRef.current.on('move', (evt: any, data: any) => {
      if (data.vector) {
        const targetX = data.vector.x;
        const targetY = data.vector.y;
        
        const smoothFactor = 0.3;
        
        lastMoveRef.current = {
          x: lastMoveRef.current.x + (targetX - lastMoveRef.current.x) * smoothFactor,
          y: lastMoveRef.current.y + (targetY - lastMoveRef.current.y) * smoothFactor
        };

        onMove(lastMoveRef.current.x, -lastMoveRef.current.y);
      }
    });

    nippleRef.current.on('end', () => {
      const smoothFactor = 0.3;
      lastMoveRef.current = {
        x: lastMoveRef.current.x * (1 - smoothFactor),
        y: lastMoveRef.current.y * (1 - smoothFactor)
      };
      
      if (Math.abs(lastMoveRef.current.x) < 0.01 && Math.abs(lastMoveRef.current.y) < 0.01) {
        lastMoveRef.current = { x: 0, y: 0 };
        onMove(0, 0);
      } else {
        onMove(lastMoveRef.current.x, -lastMoveRef.current.y);
      }
    });

    return () => {
      if (nippleRef.current) {
        nippleRef.current.destroy();
      }
    };
  }, [onMove]);

  return (
    <div 
      ref={joystickRef}
      className="fixed bottom-8 left-8 w-40 h-40 sm:hidden"
      style={{ 
        touchAction: 'none',
        zIndex: 1000,
        pointerEvents: 'auto'
      }}
    />
  );
};

export default Joystick; 