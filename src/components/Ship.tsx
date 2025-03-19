import { useFrame } from '@react-three/fiber';
import { useRef, forwardRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useShipControls, ShipControls } from '../hooks/useShipControls';
import { useLoader } from '@react-three/fiber';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

interface ShipProps extends ShipControls {
  isSelected: boolean;
  onClick: () => void;
  onFire: (position: [number, number, number], rotation: number, isPortSide: boolean) => void;
  isDestroyed?: boolean;
  onUpdate?: (state: ShipControls) => void;
}

const Ship = forwardRef<THREE.Group, ShipProps>(({ position, rotation, speed, isSelected, onClick, onFire, isDestroyed = false, onUpdate }, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const localRef = useRef<THREE.Group>(null);
  const finalRef = (ref as React.RefObject<THREE.Group>) || localRef;
  
  console.log('Ship rendering with props:', { position, rotation, isSelected, isDestroyed });
  
  const controls = useShipControls(
    { position, rotation, speed },
    (isPortSide: boolean) => {
      console.log('Ship received fire command:', isPortSide ? 'port' : 'starboard');
      if (!finalRef.current) {
        console.log('Ship ref not available');
        return;
      }
      
      // Get ship's current world position and forward direction
      const shipPosition = finalRef.current.position;
      const shipRotation = finalRef.current.rotation.y;
      
      // Calculate ship's forward and right vectors in world space
      const forwardX = -Math.sin(shipRotation); // Forward vector X component
      const forwardZ = -Math.cos(shipRotation); // Forward vector Z component
      
      // Right vector is perpendicular to forward vector
      // For right side: (forwardZ, 0, -forwardX)
      // For left side: (-forwardZ, 0, forwardX)
      const sideMultiplier = isPortSide ? -1 : 1;
      const rightX = forwardZ * sideMultiplier;
      const rightZ = -forwardX * sideMultiplier;
      
      // Calculate cannon position offset from ship center
      const cannonOffset = 0.85; // Distance of cannons from ship center
      const cannonHeight = 1.3; // Height of cannons
      
      // Position the cannon along the right/left vector
      const cannonPosition: [number, number, number] = [
        shipPosition.x + rightX * cannonOffset,
        cannonHeight,
        shipPosition.z + rightZ * cannonOffset
      ];
      
      // Calculate firing rotation (perpendicular to ship's forward direction)
      // Use atan2 to get the correct angle from the right/left vector
      const firingRotation = Math.atan2(rightX, rightZ);
      
      console.log('Firing from position:', cannonPosition, 'rotation:', firingRotation);
      onFire(cannonPosition, firingRotation, isPortSide);
    }
  );
  
  // Load MTL first, then OBJ with the materials
  const materials = useLoader(MTLLoader, '/texture.mtl', (loader) => {
    // Set material options
    loader.setMaterialOptions({
      side: THREE.DoubleSide
    });
  });

  const obj = useLoader(OBJLoader, '/boat.obj', (loader) => {
    materials.preload();
    loader.setMaterials(materials);
  });

  useEffect(() => {
    console.log('Ship mounted, obj:', obj);
    if (obj) {
      // Center and scale the model if needed
      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      obj.position.sub(center);
      obj.scale.set(1 / Math.max(size.x, size.y, size.z), 1 / Math.max(size.x, size.y, size.z), 1 / Math.max(size.x, size.y, size.z));
      
      // Load textures
      const textureLoader = new THREE.TextureLoader();
      
      // Hull texture
      const hullTexture = textureLoader.load('/coque_bateau.jpg');
      hullTexture.wrapS = THREE.RepeatWrapping;
      hullTexture.wrapT = THREE.RepeatWrapping;
      hullTexture.repeat.set(3, 3); // Larger repeat for hull details
      
      // Cannon texture (wood)
      const cannonTexture = textureLoader.load('/pine.jpg');
      cannonTexture.wrapS = THREE.RepeatWrapping;
      cannonTexture.wrapT = THREE.RepeatWrapping;
      cannonTexture.repeat.set(1, 1);
      
      // Structure texture (for masts, railings, etc)
      const structureTexture = textureLoader.load('/structure.jpg');
      structureTexture.wrapS = THREE.RepeatWrapping;
      structureTexture.wrapT = THREE.RepeatWrapping;
      structureTexture.repeat.set(2, 2); // Adjust repeat to match wood grain scale
      
      // Sail texture
      const sailTexture = textureLoader.load('/sail.jpeg');
      sailTexture.wrapS = THREE.RepeatWrapping;
      sailTexture.wrapT = THREE.RepeatWrapping;
      sailTexture.repeat.set(1, 1);
      
      // Ensure all materials are set up for textures
      obj.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material) {
            material.needsUpdate = true;
            material.side = THREE.DoubleSide;
            
            // Apply appropriate texture based on material name
            if (material.name === 'Boat_Planks') {
              material.map = hullTexture;
              material.map.needsUpdate = true;
            } else if (material.name === 'Cannons') {
              material.map = cannonTexture;
              material.map.needsUpdate = true;
            } else if (material.name === 'Sails') {
              material.map = sailTexture;
              material.map.needsUpdate = true;
              material.transparent = true;
              material.opacity = 0.95;
            } else if (['Masts', 'Crows_Nest', 'Railings', 'Railings.001', 'Stairs', 'Trim'].includes(material.name)) {
              material.map = structureTexture;
              material.map.needsUpdate = true;
            }
          }
        }
      });
      
      setIsLoaded(true);
    }
  }, [obj]);

  useFrame((state, delta) => {
    if (!finalRef.current || !isSelected || !isLoaded) return;

    const { position: newPosition, rotation: newRotation, speed: newSpeed } = controls.update(delta);
    
    // Update the actual ship position and rotation
    finalRef.current.position.set(newPosition[0], newPosition[1], newPosition[2]);
    finalRef.current.rotation.y = newRotation + Math.PI;

    // Notify parent of position changes
    if (onUpdate) {
      onUpdate({ 
        position: newPosition,
        rotation: newRotation,
        speed: newSpeed 
      });
    }
  });

  // Handle destruction animation
  useFrame((state, delta) => {
    if (!isDestroyed || !finalRef.current || !isLoaded) return;

    // Sink the ship
    finalRef.current.position.y -= delta * 0.5;
    // Rotate the ship as it sinks
    finalRef.current.rotation.x += delta * 0.2;
    finalRef.current.rotation.z += delta * 0.1;
  });

  if (!isLoaded) {
    return null;
  }

  return (
    <group
      ref={finalRef}
      position={position}
      rotation={[0, rotation + Math.PI, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <primitive object={obj.clone()} />
    </group>
  );
});

Ship.displayName = 'Ship';

export default Ship;