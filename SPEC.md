# Orbital Transfer Game - Specification

## Project Overview
- **Name**: Orbital Transfer
- **Type**: Browser-based mobile game (single HTML file)
- **Core**: Ship orbiting a planet, raise orbit via hold-to-thrust to reach another planet's orbit
- **Visual**: Glowy/neon aesthetic with dark space background

## Visual Specification

### Canvas Setup
- Full viewport, responsive to resize
- Background: Deep space black (#0a0a12) with subtle star field

### Planets
- Two glowing planets: Start (blue/cyan), Target (orange/amber)
- Radial gradient fill with outer glow (shadow blur)
- Size: ~60-80px radius
- Subtle pulsing animation on glow

### Orbital Paths
- Dashed circles showing current orbit around start planet
- When orbit raises, path updates to show new elliptical trajectory
- Color: matching planet glow with 50% opacity
- When approaching target, show target's orbital zone

### Ship
- Small triangle pointing in velocity direction
- Glowing white/cyan core
- Trail: fading particles behind ship showing recent path
- Thrust effect: bright orange glow when holding input

### UI Elements
- Altitude indicator (distance from start planet center)
- "HOLD TO RAISE ORBIT" instruction text
- Win message on successful capture

## Physics Specification

### Constants
- `G`: Gravitational constant (tuned for gameplay)
- `planetMassStart`: Mass of start planet
- `planetMassTarget`: Mass of target planet
- `minOrbitRadius`: ~100px (surface buffer)
- `captureRadius`: ~150px (hill sphere of target)

### Ship State
- Position (x, y)
- Velocity (vx, vy)
- orbitingBody: which planet currently dominates gravity

### Orbital Mechanics
1. Ship starts in stable circular orbit around start planet
2. Hold input → apply thrust in prograde direction (velocity normalized)
3. Thrust raises apogee on opposite side of orbit
4. Release → orbit becomes elliptical
5. When approaching target planet within capture radius with matching velocity → WIN

### Gravity Calculation
- Each frame: calculate gravitational acceleration from both planets
- Dominant body = planet with stronger gravitational pull
- Simple 2-body approximation (ignore third body until close)

## Interaction Specification

### Input
- **Mouse down / Touch start**: Begin thrust
- **Mouse up / Touch end**: End thrust
- Thrust active while held continuous

### Visual Feedback
- Ship glows brighter/orange when thrusting
- Instruction text fades when thrust starts
- Orbit path shows predicted new apogee while thrusting

### Win Condition
- Ship enters within capture radius of target planet
- Relative velocity to target is low enough for capture
- Display "ORBIT ESTABLISHED!" message with celebration particles

## Acceptance Criteria

1. ✓ Ship orbits start planet in stable circular orbit initially
2. ✓ Holding input visibly raises orbit altitude
3. ✓ Releasing input shows new elliptical orbit
4. ✓ Two planets visible with distinct colors
5. ✓ Glowy neon visual style achieved
6. ✓ Win detection works when capturing into target orbit
7. ✓ Works on both mouse and touch input
8. ✓ Responsive to window resize
9. ✓ Smooth 60fps animation