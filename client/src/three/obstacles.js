// ═══════════════════════════════════════════════════════════════════
// Deterministic obstacle colliders — shared by Terrain.jsx (rendering)
// and roverPhysics collision. Seeded RNG => identical across sessions,
// which lets us guarantee the DEMO route stays clear.
// ═══════════════════════════════════════════════════════════════════
import { DEMO_WAYPOINTS } from '../../../shared/constants.js';

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Min distance from point to a polyline segment list. */
function distToDemoPath(x, z) {
  let min = Infinity;
  for (let i = 1; i < DEMO_WAYPOINTS.length; i++) {
    const a = DEMO_WAYPOINTS[i - 1];
    const b = DEMO_WAYPOINTS[i];
    const abx = b.x - a.x, abz = b.z - a.z;
    const len2 = abx * abx + abz * abz;
    const t = Math.max(0, Math.min(1, ((x - a.x) * abx + (z - a.z) * abz) / len2));
    const dx = x - (a.x + abx * t);
    const dz = z - (a.z + abz * t);
    const d = Math.hypot(dx, dz);
    if (d < min) min = d;
  }
  return min;
}

const DEMO_CLEARANCE = 2.8;   // keep colliders this far from the demo route
const ROAD_HALF_WIDTH = 10;   // keep |x| < this clear (matches Terrain road strip)

function generateObstacles(seed = 1337) {
  const rand = mulberry32(seed);
  const obstacles = [];

  // ── Trees: trunk colliders ───────────────────────────────────────
  for (let i = 0; i < 25; i++) {
    let x, z, tries = 0;
    do {
      x = (rand() - 0.5) * 190;
      z = (rand() - 0.5) * 190;
      tries++;
    } while ((Math.abs(x) < ROAD_HALF_WIDTH || distToDemoPath(x, z) < DEMO_CLEARANCE) && tries < 50);
    if (tries >= 50) continue;

    const height = 2 + rand() * 2;
    obstacles.push({
      type: 'tree',
      x, z,
      r: 0.45,                       // trunk collider radius
      height,
      rotY: rand() * Math.PI * 2,
    });
  }

  // ── Rocks ────────────────────────────────────────────────────────
  for (let i = 0; i < 40; i++) {
    let x, z, tries = 0;
    do {
      x = (rand() - 0.5) * 190;
      z = (rand() - 0.5) * 190;
      tries++;
    } while ((Math.abs(x) < 8 || distToDemoPath(x, z) < DEMO_CLEARANCE) && tries < 50);
    if (tries >= 50) continue;

    const s = 0.3 + rand() * 0.7;
    obstacles.push({
      type: 'rock',
      x, z,
      r: s * 0.55,                   // slightly inside visual radius → forgiving hits
      scale: s,
      rotation: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI],
    });
  }

  return obstacles;
}

export const OBSTACLES = generateObstacles();
export const TREES = OBSTACLES.filter(o => o.type === 'tree');
export const ROCKS = OBSTACLES.filter(o => o.type === 'rock');
