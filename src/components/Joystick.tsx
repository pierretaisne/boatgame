import React, { useEffect, useRef } from 'react';
import nipplejs, { JoystickManagerOptions } from 'nipplejs';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
}

const Joystick: React.FC<JoystickProps> = ({ onMove }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const nippleRef = useRef<any>(null);

  useEffect(() => {
    if (!joystickRef.current) return;

    const options: JoystickManagerOptions = {
      zone: joystickRef.current,
      mode: 'static' as const,
      position: { left: '50%', top: '50%' },
      color: 'white',
      size: 150,
      threshold: 0.1,
      fadeTime: 250,
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
        onMove(data.vector.x, data.vector.y);
      }
    });

    nippleRef.current.on('end', () => {
      onMove(0, 0);
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