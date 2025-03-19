import React, { useEffect, useRef } from 'react';
import nipplejs from 'nipplejs';

interface MobileControlsProps {
  onMove: (rotation: number, speed: number) => void;
  onFireLeft: () => void;
  onFireRight: () => void;
}

const MobileControls: React.FC<MobileControlsProps> = ({ onMove, onFireLeft, onFireRight }) => {
  const joystickRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!joystickRef.current) return;

    const manager = nipplejs.create({
      zone: joystickRef.current,
      mode: 'static',
      position: { left: '100px', bottom: '100px' },
      color: 'white',
      size: 100,
    });

    manager.on('move', (_, data) => {
      if (data.angle) {
        // Convert angle to radians (nipplejs uses degrees)
        const rotation = (data.angle.radian + Math.PI / 2) % (2 * Math.PI);
        // Normalize force (distance from center) to use as speed
        const speed = Math.min(data.force / 2, 1) * 30;
        onMove(rotation, speed);
      }
    });

    manager.on('end', () => {
      onMove(0, 0);
    });

    return () => {
      manager.destroy();
    };
  }, [onMove]);

  const buttonStyle: React.CSSProperties = {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    border: '2px solid white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '24px',
    touchAction: 'none',
    userSelect: 'none',
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '200px',
    pointerEvents: 'none',
    zIndex: 1000,
  };

  const joystickStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '200px',
    height: '200px',
    pointerEvents: 'auto',
  };

  const fireButtonsStyle: React.CSSProperties = {
    position: 'absolute',
    right: '20px',
    bottom: '20px',
    display: 'flex',
    gap: '20px',
    pointerEvents: 'auto',
  };

  return (
    <div style={containerStyle}>
      <div ref={joystickRef} style={joystickStyle} />
      <div style={fireButtonsStyle}>
        <button
          style={buttonStyle}
          onTouchStart={onFireLeft}
          onContextMenu={(e) => e.preventDefault()}
        >
          L
        </button>
        <button
          style={buttonStyle}
          onTouchStart={onFireRight}
          onContextMenu={(e) => e.preventDefault()}
        >
          R
        </button>
      </div>
    </div>
  );
};

export default MobileControls; 