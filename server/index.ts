import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Vite's default port
    methods: ["GET", "POST"]
  }
});

// Throttle rate for position updates (ms)
const POSITION_UPDATE_RATE = 50; // 20 updates per second
const BULLET_UPDATE_RATE = 100; // 10 updates per second

interface Player {
  id: string;
  username: string;
  ship: {
    position: [number, number, number];
    rotation: number;
    speed: number;
  };
  health: {
    maxHealth: number;
    currentHealth: number;
  };
  coins: number;
  lastUpdate: number;
}

interface Bullet {
  id: number;
  position: [number, number, number];
  rotation: number;
  isPortSide: boolean;
  velocity: [number, number, number];
  isPlayerBullet: boolean;
  playerId?: string;
  lastUpdate: number;
}

interface Coin {
  id: string;
  position: [number, number, number];
}

interface GameState {
  players: { [key: string]: Player };
  bullets: Bullet[];
  coins: Coin[];
}

const gameState: GameState = {
  players: {},
  bullets: [],
  coins: []
};

// Initialize coins
const initializeCoins = () => {
  for (let i = 0; i < 20; i++) {
    gameState.coins.push({
      id: `coin-${i}`,
      position: [
        (Math.random() - 0.5) * 200,
        0,
        (Math.random() - 0.5) * 200
      ]
    });
  }
};

initializeCoins();

// Periodic state update interval
const STATE_UPDATE_INTERVAL = 100; // 10 updates per second

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Handle new player joining
  socket.on('joinGame', (username: string) => {
    // Initialize player state with random starting position
    const randomX = (Math.random() - 0.5) * 100;
    const randomZ = (Math.random() - 0.5) * 100;
    
    gameState.players[socket.id] = {
      id: socket.id,
      username,
      ship: {
        position: [randomX, 0, randomZ],
        rotation: 0,
        speed: 0
      },
      health: {
        maxHealth: 250,
        currentHealth: 250
      },
      coins: 100,
      lastUpdate: Date.now()
    };

    // Send current game state to new player
    socket.emit('gameState', gameState);
    
    // Notify other players about new player
    socket.broadcast.emit('playerJoined', gameState.players[socket.id]);
  });

  // Handle player movement with throttling
  socket.on('playerMove', (data: { position: [number, number, number], rotation: number, speed: number }) => {
    if (gameState.players[socket.id]) {
      const now = Date.now();
      const player = gameState.players[socket.id];
      
      // Only update if enough time has passed
      if (now - player.lastUpdate >= POSITION_UPDATE_RATE) {
        player.ship = {
          position: data.position,
          rotation: data.rotation,
          speed: data.speed
        };
        player.lastUpdate = now;
        
        socket.broadcast.emit('playerMoved', {
          id: socket.id,
          ship: player.ship
        });
      }
    }
  });

  // Handle player firing with throttling
  socket.on('fire', (bullet: Bullet) => {
    const now = Date.now();
    bullet.playerId = socket.id;
    bullet.lastUpdate = now;
    
    // Remove old bullets
    gameState.bullets = gameState.bullets.filter(b => 
      now - b.lastUpdate < 5000 // Remove bullets older than 5 seconds
    );
    
    gameState.bullets.push(bullet);
    io.emit('bulletUpdate', gameState.bullets);
  });

  // Handle player damage
  socket.on('playerDamaged', (data: { damage: number }) => {
    if (gameState.players[socket.id]) {
      const player = gameState.players[socket.id];
      player.health.currentHealth = Math.max(0, player.health.currentHealth - data.damage);
      
      if (player.health.currentHealth <= 0) {
        // Player destroyed
        delete gameState.players[socket.id];
        io.emit('playerLeft', socket.id);
      } else {
        io.emit('playerDamaged', {
          id: socket.id,
          health: player.health
        });
      }
    }
  });

  // Handle coin collection
  socket.on('coinCollected', (coinId: string) => {
    const coin = gameState.coins.find(c => c.id === coinId);
    if (coin && gameState.players[socket.id]) {
      gameState.players[socket.id].coins += 50;
      gameState.coins = gameState.coins.filter(c => c.id !== coinId);
      io.emit('coinUpdate', gameState.coins);
      io.emit('coinsUpdated', {
        id: socket.id,
        coins: gameState.players[socket.id].coins
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (gameState.players[socket.id]) {
      delete gameState.players[socket.id];
      io.emit('playerLeft', socket.id);
    }
  });
});

// Periodic state cleanup
setInterval(() => {
  const now = Date.now();
  
  // Clean up old bullets
  gameState.bullets = gameState.bullets.filter(bullet => 
    now - bullet.lastUpdate < 5000
  );
  
  // Emit state update to all clients
  io.emit('gameState', gameState);
}, STATE_UPDATE_INTERVAL);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 