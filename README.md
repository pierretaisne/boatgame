# Boat Game - Multiplayer Edition

A multiplayer boat game where players can battle each other and AI ships in a vast ocean environment.

## Features

- Real-time multiplayer gameplay
- Player vs Player combat
- AI ships with advanced behavior
- Safe zones for health regeneration
- Coin collection system
- Beautiful 3D graphics with realistic water effects
- Mobile-friendly controls with joystick support

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd boatgame
```

2. Install client dependencies:
```bash
npm install
```

3. Install server dependencies:
```bash
cd server
npm install
cd ..
```

## Running the Game

1. Start both the client and server in development mode:
```bash
./start-dev.sh
```

2. Open your browser and navigate to `http://localhost:5173`

3. Enter your username to join the game

## Controls

- **Desktop:**
  - WASD: Move the boat
  - Q: Fire from left side
  - E: Fire from right side
  - Mouse: Look around

- **Mobile:**
  - Joystick: Move the boat
  - Fire buttons: Shoot from respective sides
  - Touch and drag: Look around

## Game Rules

1. Each player starts with 250 health points
2. Collect coins to increase your score
3. Stay in safe zones to regenerate health
4. Avoid or destroy AI ships
5. Battle other players for supremacy
6. Last player standing wins!

## Technical Details

- Built with React and Three.js
- Real-time communication using Socket.IO
- Responsive design for both desktop and mobile
- Optimized for smooth multiplayer experience

## Contributing

Feel free to submit issues and enhancement requests! 