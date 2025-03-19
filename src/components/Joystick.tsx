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
      size: 120,
      threshold: 0.1,
      fadeTime: 250,
      multitouch: false,
      maxNumberOfNipples: 1,
      dataOnly: false,
      lockX: false,
      lockY: false,
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
      className="fixed bottom-8 left-8 w-32 h-32 sm:hidden"
      style={{ touchAction: 'none' }}
    />
  );
};

export default Joystick; 