import React, { useState } from 'react';
import { Html } from '@react-three/drei';

interface UsernameInputProps {
  onSubmit: (username: string) => void;
}

const UsernameInput: React.FC<UsernameInputProps> = ({ onSubmit }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSubmit(username.trim());
    }
  };

  return (
    <Html center>
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '2rem',
        borderRadius: '10px',
        color: 'white',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        minWidth: '300px'
      }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#FFD700' }}>Enter Your Pirate Name</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              borderRadius: '5px',
              border: '2px solid #FFD700',
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#000'
            }}
          />
          <button
            type="submit"
            disabled={!username.trim()}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              borderRadius: '5px',
              border: 'none',
              background: username.trim() ? '#FFD700' : '#888',
              color: '#000',
              cursor: username.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 'bold'
            }}
          >
            Set Sail!
          </button>
        </form>
      </div>
    </Html>
  );
};

export default UsernameInput; 