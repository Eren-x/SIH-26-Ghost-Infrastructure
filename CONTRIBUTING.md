# Contributing to Ghost Rover

Thanks for your interest in improving the Ghost Infrastructure Scout Rover simulation!

## Getting Started

```bash
# 1. Clone and install
git clone https://github.com/dipanshdas/ghost-rover.git
cd ghost-rover
npm install && npm install --prefix server && npm install --prefix client

# 2. Run the dev environment (server :3001 + client :5173)
npm run dev
```

## Project Layout

| Path | What lives there |
|------|-----------------|
| `shared/` | Constants + JSDoc types used by **both** server and client — single source of truth |
| `server/` | Express + Socket.IO backend: sensor generation, baseline/correlation/risk engines |
| `client/src/three/` | React Three Fiber scene, rover physics (`roverPhysics.js`), terrain |
| `client/src/ui/` | HUD, panels, maps — all state via Zustand (`stores/useSimStore.js`) |

## Ground Rules

- **`roverPhysics.js` is pure** (no React/Three imports) by design — keep it that way so it stays unit-testable in Node.
- **Detection constants live in `shared/constants.js`.** Don't hardcode thresholds in engine code; import them.
- Server and client communicate **only** over Socket.IO events. New events should be added symmetrically (`handlers.js` ↔ `App.jsx`) and documented in the README's architecture section.

## Testing

There is no formal test framework yet. Before opening a PR:

```bash
# Syntax-check all server modules
for f in server/**/*.js; do node --check "$f"; done

# Production build must succeed
npm run build --prefix client
```

If you change physics or autopilot code, verify the DEMO mode still completes all waypoints without collisions.

## Style

- ES Modules everywhere (`"type": "module"`).
- Functional components + hooks on the client; classes only for the detection engines.
- No new runtime dependencies without discussion.

## Opening a PR

1. Branch from `main` with a descriptive name (`feat/risk-heatmap`, `fix/steering-sign`, ...).
2. Keep diffs focused — one feature or fix per PR.
3. Update the README if you change architecture, controls, or configuration.
