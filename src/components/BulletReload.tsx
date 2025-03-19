import React, { useState, useEffect } from 'react';

interface BulletReloadProps {
  isReloading: boolean;
  onReloadComplete: () => void;
}

const BulletReload: React.FC<BulletReloadProps> = ({ isReloading, onReloadComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isReloading) {
      setProgress(0);
      const startTime = Date.now();
      const reloadTime = 5000; // 5 seconds

      intervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / reloadTime) * 100, 100);
        setProgress(newProgress);

        if (newProgress >= 100) {
          clearInterval(intervalId);
          onReloadComplete();
        }
      }, 16); // Update roughly every frame
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isReloading, onReloadComplete]);

  const containerStyle: React.CSSProperties = {
    background: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    color: 'black',
    fontFamily: 'Outfit, Arial, sans-serif',
    textAlign: 'right',
    boxShadow: '4px 4px rgba(0, 0, 0, 1)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  return (
    <div style={containerStyle}>
      <img 
        src="/bullet.png" 
        alt="bullet" 
        className="w-6 h-6"
        style={{ opacity: isReloading ? 0.5 : 1 }}
      />
      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
        {isReloading && (
          <div 
            className="h-full bg-black transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        )}
      </div>
    </div>
  );
};

export default BulletReload; 