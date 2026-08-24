import React, { useMemo } from 'react';
import * as THREE from 'three';
import { TREES, ROCKS } from './obstacles';

// Simple seeded hash-based noise function
const hash = (x, y, seed) => {
  let h = seed + x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return h ^ (h >> 16);
};

const noise2D = (x, y, seed = 0) => {
  const X = Math.floor(x);
  const Y = Math.floor(y);
  const xf = x - X;
  const yf = y - Y;

  const u = xf * xf * (3.0 - 2.0 * xf);
  const v = yf * yf * (3.0 - 2.0 * yf);

  const n00 = (hash(X, Y, seed) % 1000) / 1000;
  const n10 = (hash(X + 1, Y, seed) % 1000) / 1000;
  const n01 = (hash(X, Y + 1, seed) % 1000) / 1000;
  const n11 = (hash(X + 1, Y + 1, seed) % 1000) / 1000;

  const nx0 = n00 * (1 - u) + n10 * u;
  const nx1 = n01 * (1 - u) + n11 * u;
  
  return nx0 * (1 - v) + nx1 * v;
};

const fractalNoise = (x, y) => {
  let h = 0;
  // Two octaves, amplitude ~2.5 for first, ~0.8 for second
  h += noise2D(x * 0.02, y * 0.02, 123) * 2.5;
  h += noise2D(x * 0.08, y * 0.08, 456) * 0.8;
  return h;
};

export const getTerrainHeight = (x, z) => {
  return fractalNoise(x, z);
};

const Terrain = () => {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(200, 200, 128, 128);
    geo.rotateX(-Math.PI / 2);
    
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const color = new THREE.Color();
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = getTerrainHeight(x, z);
      pos.setY(i, y);
      
      // Color logic
      if (x > -5 && x < 5) {
        // Road-like strip
        color.set('#6B6152');
      } else if (y < 1.0) {
        // Darken at low areas
        color.set('#6b573e');
      } else if (y > 2.0) {
        // Subtle green tint at medium/high heights
        color.set('#556B2F');
      } else {
        // Base tan/brown
        color.set('#8B7355');
      }
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Obstacles come from the seeded shared module so rendering matches
  // the physics colliders exactly (see obstacles.js)
  const rocks = useMemo(() => ROCKS.map(rock => ({
    position: [rock.x, getTerrainHeight(rock.x, rock.z) + rock.scale * 0.5, rock.z],
    scale: [rock.scale, rock.scale, rock.scale],
    rotation: rock.rotation,
  })), []);

  const trees = useMemo(() => TREES.map(tree => ({
    position: [tree.x, getTerrainHeight(tree.x, tree.z), tree.z],
    height: tree.height,
    rotY: tree.rotY,
  })), []);

  return (
    <group>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
      
      {rocks.map((rock, i) => (
        <mesh key={`rock-${i}`} position={rock.position} scale={rock.scale} rotation={rock.rotation} castShadow receiveShadow>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#5c5470" roughness={0.9} />
        </mesh>
      ))}

      {trees.map((tree, i) => (
        <group key={`tree-${i}`} position={tree.position} rotation={[0, tree.rotY, 0]}>
          <mesh position={[0, tree.height * 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, tree.height * 0.3]} />
            <meshStandardMaterial color="#4a3b30" />
          </mesh>
          <mesh position={[0, tree.height * 0.65, 0]} castShadow>
            <coneGeometry args={[tree.height * 0.4, tree.height * 0.7, 5]} />
            <meshStandardMaterial color="#2d5a35" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export default Terrain;
