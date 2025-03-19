import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import React, { Suspense, useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import Ship from './Ship';
import Bullet from './Bullet';
import Explosion from './Explosion';
import WaterSplash from './WaterSplash';
import HealthBar from './HealthBar';
import { ShipControls } from '../hooks/useShipControls';
import UsernameInput from './UsernameInput';
import CoinDisplay from './CoinDisplay';
import Joystick from './Joystick';

function Ocean() {
  const [water, setWater] = useState<Water | null>(null);
  
  useEffect(() => {
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    const waterInstance = new Water(
      waterGeometry,
      {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg', function(texture) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: false
      }
    );
    waterInstance.rotation.x = -Math.PI / 2;
    setWater(waterInstance);
  }, []);

  useFrame((state, delta) => {
    if (water) {
      water.material.uniforms['time'].value += delta;
    }
  });

  if (!water) return null;

  return (
    <primitive 
      object={water}
      position={[0, -0.1, 0]}
      receiveShadow
    />
  );
}

interface ShipHealth {
  maxHealth: number;
  currentHealth: number;
}

interface BulletData {
  id: number;
  position: [number, number, number];
  rotation: number;
  isPortSide: boolean;
  velocity: [number, number, number];
  isPlayerBullet: boolean;
}

interface SafeZone {
  position: [number, number];
  radius: number;
}

function SafeZoneCircle({ position, radius }: SafeZone) {
  return (
    <group position={[position[0], 0, position[1]]}>
      {/* Vertical cylindrical boundary */}
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[radius, radius, 12, 64, 1, true]} />
        <meshBasicMaterial 
          color="#00FF00" 
          transparent 
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

    </group>
  );
}

interface AIShipState extends ShipControls {
  health: ShipHealth;
  isDestroyed: boolean;
  ref: React.RefObject<THREE.Group>;
  aiState: {
    targetPosition: [number, number, number];
    lastFireTime: number;
    firingCooldown: number;
    firingRange: number;
    targetIndex: number; // -1 for player, 0-4 for AI ships
    lastTargetChange: number;
  };
}

interface GameSceneProps {
  onGameStart: (username: string) => void;
  onCoinsChange: (coins: number) => void;
  gameStarted: boolean;
  playerShip: ShipControls;
  onPlayerShipUpdate: (newShip: ShipControls) => void;
}

function GameScene({ onGameStart, onCoinsChange, gameStarted, playerShip, onPlayerShipUpdate }: GameSceneProps) {
  const [selectedShip, setSelectedShip] = useState(0);
  const [bullets, setBullets] = useState<BulletData[]>([]);
  const [nextBulletId, setNextBulletId] = useState(0);
  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionPosition, setExplosionPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [splashes, setSplashes] = useState<{ id: number; position: [number, number, number] }[]>([]);
  const [nextSplashId, setNextSplashId] = useState(0);
  const controlsRef = useRef<any>();
  
  // Player ship state
  const [playerHealth, setPlayerHealth] = useState<ShipHealth>({
    maxHealth: 250,
    currentHealth: 250,
  });
  const playerShipRef = useRef<THREE.Group>(null);

  // AI ships state
  const [aiShips, setAiShips] = useState<AIShipState[]>([
    {
      position: [20, 0, 20],
      rotation: Math.PI,
      speed: 0,
      health: { maxHealth: 250, currentHealth: 250 },
      isDestroyed: false,
      ref: useRef<THREE.Group>(null),
      aiState: {
        targetPosition: [20, 0, 20],
        lastFireTime: 0,
        firingCooldown: 5000,
        firingRange: 60,
        targetIndex: -1,
        lastTargetChange: 0
      }
    },
    {
      position: [-20, 0, 20],
      rotation: Math.PI,
      speed: 0,
      health: { maxHealth: 250, currentHealth: 250 },
      isDestroyed: false,
      ref: useRef<THREE.Group>(null),
      aiState: {
        targetPosition: [-20, 0, 20],
        lastFireTime: 0,
        firingCooldown: 5000,
        firingRange: 60,
        targetIndex: -1,
        lastTargetChange: 0
      }
    },
    {
      position: [20, 0, -20],
      rotation: 0,
      speed: 0,
      health: { maxHealth: 250, currentHealth: 250 },
      isDestroyed: false,
      ref: useRef<THREE.Group>(null),
      aiState: {
        targetPosition: [20, 0, -20],
        lastFireTime: 0,
        firingCooldown: 5000,
        firingRange: 60,
        targetIndex: -1,
        lastTargetChange: 0
      }
    },
    {
      position: [-20, 0, -20],
      rotation: 0,
      speed: 0,
      health: { maxHealth: 250, currentHealth: 250 },
      isDestroyed: false,
      ref: useRef<THREE.Group>(null),
      aiState: {
        targetPosition: [-20, 0, -20],
        lastFireTime: 0,
        firingCooldown: 5000,
        firingRange: 60,
        targetIndex: -1,
        lastTargetChange: 0
      }
    },
    {
      position: [0, 0, 40],
      rotation: Math.PI,
      speed: 0,
      health: { maxHealth: 250, currentHealth: 250 },
      isDestroyed: false,
      ref: useRef<THREE.Group>(null),
      aiState: {
        targetPosition: [0, 0, 40],
        lastFireTime: 0,
        firingCooldown: 5000,
        firingRange: 60,
        targetIndex: -1,
        lastTargetChange: 0
      }
    }
  ]);

  const lastRegenTime = useRef<number>(0);
  const safeZones: SafeZone[] = [
    { position: [-120, -120], radius: 40 },
    { position: [120, 120], radius: 50 },
    { position: [-120, 120], radius: 40 },
    { position: [120, -120], radius: 50 },
  ];

  // Update player ship position
  const handleShipUpdate = (newState: ShipControls) => {
    onPlayerShipUpdate(newState);
  };

  // Update camera target to follow player ship and handle health regeneration
  useFrame(() => {
    if (controlsRef.current) {
      // Smoothly move the camera target to follow the ship
      const currentTarget = controlsRef.current.target;
      const targetX = playerShip.position[0];
      const targetZ = playerShip.position[2];
      
      // Smooth interpolation
      currentTarget.x += (targetX - currentTarget.x) * 0.1;
      currentTarget.z += (targetZ - currentTarget.z) * 0.1;
    }

    // Handle health regeneration in safe zone
    if (gameStarted && isInSafeZone(playerShip.position)) {
      const currentTime = Date.now();
      if (currentTime - lastRegenTime.current >= 5000) { // Check if 5 seconds have passed
        const regenAmount = Math.floor(playerHealth.maxHealth * 0.1); // 10% of max health
        setPlayerHealth(prev => ({
          ...prev,
          currentHealth: Math.min(prev.maxHealth, prev.currentHealth + regenAmount)
        }));
        lastRegenTime.current = currentTime;
      }
    }
  });

  // Add keyboard controls for firing
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!gameStarted) return;
      
      if (event.key.toLowerCase() === 'q') {
        // Fire from left side
        handleFire(playerShip.position, playerShip.rotation, true);
      } else if (event.key.toLowerCase() === 'e') {
        // Fire from right side
        handleFire(playerShip.position, playerShip.rotation, false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, playerShip.position, playerShip.rotation]);

  const handleFire = (position: [number, number, number], rotation: number, isPortSide: boolean, isPlayerBullet: boolean = true) => {
    // Calculate bullet velocity perpendicular to ship's orientation
    const bulletSpeed = 80;
    const perpendicularAngle = rotation + (isPortSide ? -Math.PI/2 : Math.PI/2);
    
    // Add slight random spread to make not all bullets hit
    const spreadAngle = (Math.random() - 0.5) * 0.2;
    const finalAngle = perpendicularAngle + spreadAngle;
    
    const velocity: [number, number, number] = [
      Math.sin(finalAngle) * bulletSpeed,
      5,
      Math.cos(finalAngle) * bulletSpeed
    ];

    // Offset the bullet spawn position perpendicular to the ship
    const spawnOffset = 3;
    const offsetPosition: [number, number, number] = [
      position[0] + Math.sin(finalAngle) * spawnOffset,
      position[1] + 1,
      position[2] + Math.cos(finalAngle) * spawnOffset
    ];

    const newBullet: BulletData = {
      id: nextBulletId,
      position: offsetPosition,
      rotation: finalAngle,
      isPortSide,
      velocity,
      isPlayerBullet
    };

    setBullets(prev => [...prev, newBullet]);
    setNextBulletId(prev => prev + 1);
  };

  const removeBullet = (id: number) => {
    setBullets(prev => prev.filter(bullet => bullet.id !== id));
  };

  const removeSplash = (id: number) => {
    setSplashes(prev => prev.filter(splash => splash.id !== id));
  };

  const isInSafeZone = (position: [number, number, number]): boolean => {
    return safeZones.some(zone => {
      const dx = zone.position[0] - position[0];
      const dz = zone.position[1] - position[2];
      return (dx * dx + dz * dz) <= zone.radius * zone.radius;
    });
  };

  // AI movement and firing logic
  useFrame((state, delta) => {
    if (!gameStarted) return;

    setAiShips(prevShips => prevShips.map((ship, shipIndex) => {
      if (ship.isDestroyed) return ship;

      const currentTime = Date.now();
      
      // Find closest target (including player and other AI ships)
      let closestDistance = Infinity;
      let closestTargetIndex = -1;
      let closestTargetPosition: [number, number, number] = [0, 0, 0];

      // Check distance to player
      const distanceToPlayer = Math.sqrt(
        Math.pow(playerShip.position[0] - ship.position[0], 2) +
        Math.pow(playerShip.position[2] - ship.position[2], 2)
      );
      
      if (distanceToPlayer < closestDistance && !isInSafeZone(playerShip.position)) {
        closestDistance = distanceToPlayer;
        closestTargetIndex = -1;
        closestTargetPosition = playerShip.position;
      }

      // Check distance to other AI ships
      prevShips.forEach((otherShip, otherIndex) => {
        if (otherIndex !== shipIndex && !otherShip.isDestroyed && !isInSafeZone(otherShip.position)) {
          const distance = Math.sqrt(
            Math.pow(otherShip.position[0] - ship.position[0], 2) +
            Math.pow(otherShip.position[2] - ship.position[2], 2)
          );
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestTargetIndex = otherIndex;
            closestTargetPosition = otherShip.position;
          }
        }
      });

      // Change target if current target is in safe zone or destroyed, or after some time
      const targetChangeInterval = 10000; // 10 seconds
      if (currentTime - ship.aiState.lastTargetChange > targetChangeInterval || 
          (ship.aiState.targetIndex >= 0 && prevShips[ship.aiState.targetIndex].isDestroyed) ||
          (ship.aiState.targetIndex === -1 && isInSafeZone(playerShip.position)) ||
          (ship.aiState.targetIndex >= 0 && isInSafeZone(prevShips[ship.aiState.targetIndex].position))) {
        ship.aiState.targetIndex = closestTargetIndex;
        ship.aiState.lastTargetChange = currentTime;
      }

      // Get current target position
      const targetPosition = ship.aiState.targetIndex === -1 ? 
        playerShip.position : 
        prevShips[ship.aiState.targetIndex].position;

      // Calculate direction to target
      const toTargetX = targetPosition[0] - ship.position[0];
      const toTargetZ = targetPosition[2] - ship.position[2];
      const distanceToTarget = Math.sqrt(toTargetX * toTargetX + toTargetZ * toTargetZ);
      const angleToTarget = Math.atan2(toTargetX, toTargetZ);

      // Calculate optimal position to maintain firing range
      const optimalFiringDistance = 35; // Reduced for more aggressive behavior
      let targetRotation = ship.rotation;
      let moveSpeed = 0;

      if (distanceToTarget > optimalFiringDistance + 5) {
        // Move closer to target
        targetRotation = angleToTarget;
        moveSpeed = 15; // Standardized speed
      } else if (distanceToTarget < optimalFiringDistance - 5) {
        // Back away from target
        targetRotation = angleToTarget + Math.PI;
        moveSpeed = 15; // Standardized speed
      } else {
        // Circle around target
        const circlingOffset = (Math.sin(currentTime * 0.001) * Math.PI / 2); // Dynamic circling
        targetRotation = angleToTarget + circlingOffset;
        moveSpeed = 12; // Slightly slower when circling
      }

      // Smoothly rotate towards target rotation
      const rotationDiff = targetRotation - ship.rotation;
      const adjustedRotationDiff = ((rotationDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
      const newRotation = ship.rotation + adjustedRotationDiff * delta * 2;

      // Move in the calculated direction
      const newPosition: [number, number, number] = [
        ship.position[0] + Math.sin(newRotation) * moveSpeed * delta,
        0,
        ship.position[2] + Math.cos(newRotation) * moveSpeed * delta
      ];

      // Handle firing
      if (distanceToTarget <= ship.aiState.firingRange && 
          currentTime - ship.aiState.lastFireTime >= ship.aiState.firingCooldown) {
        
        const targetVelocity = ship.aiState.targetIndex === -1 ? 
          [Math.sin(playerShip.rotation) * playerShip.speed, 0, Math.cos(playerShip.rotation) * playerShip.speed] :
          [Math.sin(prevShips[ship.aiState.targetIndex].rotation) * prevShips[ship.aiState.targetIndex].speed, 0, 
           Math.cos(prevShips[ship.aiState.targetIndex].rotation) * prevShips[ship.aiState.targetIndex].speed];

        const leadAmount = 2;
        const predictedPosition: [number, number, number] = [
          targetPosition[0] + targetVelocity[0] * leadAmount,
          0,
          targetPosition[2] + targetVelocity[2] * leadAmount
        ];

        const toTargetX = predictedPosition[0] - newPosition[0];
        const toTargetZ = predictedPosition[2] - newPosition[2];
        const angleToTarget = Math.atan2(toTargetX, toTargetZ);
        
        const relativeAngle = ((angleToTarget - newRotation + Math.PI * 2) % (Math.PI * 2));
        const isPortSide = relativeAngle > Math.PI;

        handleFire(newPosition, newRotation, isPortSide, false);
        ship.aiState.lastFireTime = currentTime;
      }

      return {
        ...ship,
        position: newPosition,
        rotation: newRotation,
        speed: moveSpeed,
        aiState: {
          ...ship.aiState,
          targetIndex: closestTargetIndex,
          lastTargetChange: ship.aiState.lastTargetChange
        }
      };
    }));
  });

  // Update bullet positions and check collisions
  useFrame((state, delta) => {
    setBullets(prev => prev.map(bullet => {
      const newPosition: [number, number, number] = [
        bullet.position[0] + bullet.velocity[0] * delta,
        bullet.position[1] + bullet.velocity[1] * delta,
        bullet.position[2] + bullet.velocity[2] * delta
      ];

      const bulletSphere = new THREE.Sphere(
        new THREE.Vector3(...newPosition),
        0.2
      );

      // Check collision with AI ships (only for player bullets)
      if (bullet.isPlayerBullet) {
        for (let i = 0; i < aiShips.length; i++) {
          const ship = aiShips[i];
          if (ship.isDestroyed || !ship.ref.current) continue;

          const shipBox = new THREE.Box3().setFromObject(ship.ref.current);
          const shrinkAmount = new THREE.Vector3(0.5, 0.5, 0.5);
          shipBox.min.add(shrinkAmount);
          shipBox.max.sub(shrinkAmount);

          if (shipBox.intersectsSphere(bulletSphere) && !isInSafeZone(ship.position)) {
            const bulletToShip = new THREE.Vector3(
              ship.position[0] - newPosition[0],
              ship.position[1] - newPosition[1],
              ship.position[2] - newPosition[2]
            );
            
            if (bulletToShip.length() < 5) {
              const newHealth = ship.health.currentHealth - 25;
              setAiShips(prevShips => prevShips.map((s, index) => {
                if (index === i) {
                  const isDestroyed = newHealth <= 0;
                  if (isDestroyed) {
                    setExplosionPosition([
                      ship.position[0],
                      ship.position[1] + 2,
                      ship.position[2]
                    ]);
                    setShowExplosion(true);
                    onCoinsChange(150);
                  }
                  return {
                    ...s,
                    health: {
                      ...s.health,
                      currentHealth: Math.max(0, newHealth)
                    },
                    isDestroyed: isDestroyed
                  };
                }
                return s;
              }));
              removeBullet(bullet.id);
              return bullet;
            }
          }
        }
      }

      // Check collision with player ship (only for enemy bullets)
      if (!bullet.isPlayerBullet && playerShipRef.current) {
        const playerBox = new THREE.Box3().setFromObject(playerShipRef.current);
        const playerShrinkAmount = new THREE.Vector3(0.5, 0.5, 0.5);
        playerBox.min.add(playerShrinkAmount);
        playerBox.max.sub(playerShrinkAmount);
        
        if (playerBox.intersectsSphere(bulletSphere) && !isInSafeZone(playerShip.position)) {
          const bulletToPlayer = new THREE.Vector3(
            playerShip.position[0] - newPosition[0],
            playerShip.position[1] - newPosition[1],
            playerShip.position[2] - newPosition[2]
          );
          
          if (bulletToPlayer.length() < 5) {
            const newHealth = playerHealth.currentHealth - 25;
            setPlayerHealth(prev => ({
              ...prev,
              currentHealth: Math.max(0, newHealth)
            }));

            removeBullet(bullet.id);
            return bullet;
          }
        }
      }

      // Check if bullet hits water
      if (newPosition[1] <= 0) {
        setSplashes(prev => [...prev, {
          id: nextSplashId,
          position: [newPosition[0], 0.1, newPosition[2]]
        }]);
        setNextSplashId(prev => prev + 1);
        removeBullet(bullet.id);
        return bullet;
      }

      // Update bullet velocity with reduced gravity
      const newVelocity: [number, number, number] = [
        bullet.velocity[0],
        bullet.velocity[1] - 4.9 * delta,
        bullet.velocity[2]
      ];

      return {
        ...bullet,
        position: newPosition,
        velocity: newVelocity
      };
    }).filter(bullet => bullet.position[1] > -5));
  });

  const handleExplosionComplete = () => {
    setShowExplosion(false);
  };

  return (
    <>
      <Sky 
        turbidity={10}
        rayleigh={2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
        sunPosition={[100, 20, 100]}
      />
      <ambientLight intensity={1} />
      <pointLight position={[10, 10, 10]} intensity={2} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      <Ocean />

      {/* Render safe zones */}
      {safeZones.map((zone, index) => (
        <SafeZoneCircle key={index} {...zone} />
      ))}

      {!gameStarted ? (
        <UsernameInput onSubmit={onGameStart} />
      ) : (
        <>
          <Ship 
            {...playerShip}
            isSelected={true}
            onClick={() => setSelectedShip(0)}
            onFire={() => {}}
            onUpdate={handleShipUpdate}
            ref={playerShipRef}
          />
          <HealthBar
            maxHealth={playerHealth.maxHealth}
            currentHealth={playerHealth.currentHealth}
            position={[playerShip.position[0], 12, playerShip.position[2]]}
          />

          {aiShips.map((ship, index) => (
            <React.Fragment key={index}>
              <Ship 
                position={ship.position}
                rotation={ship.rotation}
                speed={ship.speed}
                isSelected={false}
                onClick={() => {}}
                onFire={() => {}}
                ref={ship.ref}
                isDestroyed={ship.isDestroyed}
              />
              {!ship.isDestroyed && (
                <HealthBar
                  maxHealth={ship.health.maxHealth}
                  currentHealth={ship.health.currentHealth}
                  position={[ship.position[0], 12, ship.position[2]]}
                />
              )}
            </React.Fragment>
          ))}

          {showExplosion && (
            <Explosion 
              position={explosionPosition}
              onComplete={handleExplosionComplete}
            />
          )}

          {splashes.map(splash => (
            <WaterSplash
              key={splash.id}
              position={splash.position}
              onComplete={() => removeSplash(splash.id)}
            />
          ))}

          {bullets.map(bullet => (
            <Bullet
              key={bullet.id}
              position={bullet.position}
              rotation={bullet.rotation}
              onHit={() => removeBullet(bullet.id)}
            />
          ))}
        </>
      )}

      <OrbitControls 
        ref={controlsRef}
        enablePan={false}
        minDistance={15}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 6}
        target={[playerShip.position[0], 0, playerShip.position[2]]}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </>
  );
}

export default function Game() {
  const [gameStarted, setGameStarted] = useState(false);
  const [username, setUsername] = useState('');
  const [coins, setCoins] = useState(100);
  const [speedLevel, setSpeedLevel] = useState(1);
  const [armorLevel, setArmorLevel] = useState(1);
  const [firingLevel, setFiringLevel] = useState(1);
  const [playerShip, setPlayerShip] = useState<ShipControls>({
    position: [0, 0, 0],
    rotation: 0,
    speed: 0,
  });

  const handleCoinsChange = (amount: number) => {
    setCoins(prev => prev + amount);
  };

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

  const statsContainerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    display: 'flex',
    gap: '10px',
    zIndex: 50,
  };

  const iconStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    objectFit: 'contain'
  };

  const textStyle: React.CSSProperties = {
    fontWeight: '600',
    fontSize: '1.2rem',
    fontFamily: 'Outfit, Arial, sans-serif'
  };

  const handleJoystickMove = (x: number, y: number) => {
    // Convert joystick movement to ship movement
    // x: -1 to 1 (left to right)
    // y: -1 to 1 (backward to forward)
    const speed = Math.sqrt(x * x + y * y);
    const angle = Math.atan2(x, y);
    
    // Update ship controls
    setPlayerShip(prev => ({
      ...prev,
      rotation: angle,
      speed: speed * 20 // Adjust this multiplier to control speed
    }));
  };

  return (
    <div className="h-screen w-screen relative">
      {gameStarted && (
        <>
          <div className="absolute top-5 right-5 z-50">
            <div style={containerStyle}>
              <img 
                src="/coin.png" 
                alt="coin" 
                style={iconStyle}
                className="w-6 h-6"
              />
              <span style={textStyle}>
                {coins.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="absolute bottom-5 right-5 z-50 flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div style={containerStyle}>
              <img 
                src="/lightning.png" 
                alt="speed" 
                style={iconStyle}
                className="w-4 h-4 sm:w-6 sm:h-6"
              />
              <span style={textStyle} className="text-sm sm:text-lg">
                Speed {speedLevel}
              </span>
            </div>
            <div style={containerStyle}>
              <img 
                src="/shield.png" 
                alt="armor" 
                style={iconStyle}
                className="w-4 h-4 sm:w-6 sm:h-6"
              />
              <span style={textStyle} className="text-sm sm:text-lg">
                Armor {armorLevel}
              </span>
            </div>
            <div style={containerStyle}>
              <img 
                src="/bullet.png" 
                alt="firing" 
                style={iconStyle}
                className="w-4 h-4 sm:w-6 sm:h-6"
              />
              <span style={textStyle} className="text-sm sm:text-lg">
                Firing {firingLevel}
              </span>
            </div>
          </div>
          <Joystick onMove={handleJoystickMove} />
        </>
      )}
      <Canvas 
        camera={{ 
          position: [0, 20, 40],
          fov: 60,
          near: 0.1,
          far: 1000
        }}
      >
        <Suspense fallback={null}>
          <GameScene 
            onGameStart={(name: string) => {
              setUsername(name);
              setGameStarted(true);
            }}
            onCoinsChange={handleCoinsChange}
            gameStarted={gameStarted}
            playerShip={playerShip}
            onPlayerShipUpdate={setPlayerShip}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}