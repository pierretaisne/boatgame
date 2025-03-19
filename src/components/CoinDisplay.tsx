import React from 'react';
import { Html } from '@react-three/drei';

interface CoinDisplayProps {
  coins: number;
  username: string;
}

const CoinDisplay: React.FC<CoinDisplayProps> = ({ coins, username }) => {
  return (
    <Html fullscreen>
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '1rem',
        borderRadius: '10px',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'right',
        zIndex: 1000,
        pointerEvents: 'none'
      }}>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          {username}
        </div>
        <div style={{
          color: '#FFD700',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.5rem'
        }}>
          <span>🪙</span>
          {coins.toLocaleString()}
        </div>
      </div>
    </Html>
  );
};

export default CoinDisplay; 