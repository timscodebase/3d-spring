# PLANNING.md

## Goal
Build a 3D, physics-based emulator of a flexible doorstop spring. The simulation should capture the characteristic "boing" motion and flexibility of the spring when interacted with (flicked, pulled).

## Proposed Architecture

### Tech Stack
- **Language**: TypeScript
- **Bundler**: Vite
- **3D Engine**: Three.js
- **Physics**: Cannon-es (proposed)

### Components
1.  **World**: Manages the scene, camera, lighting, and loop.
2.  **Spring**: The main actor. Composed of multiple rigid bodies connected by constraints to simulate flexibility.
3.  **InteractionManager**: Handles raycasting and mouse/touch events to apply forces to the spring.

## Roadmap
1.  **Setup**: Install dependencies (`three`, `cannon-es`).
2.  **Prototype**: Create a basic chain of bodies to simulate the spring.
3.  **Visuals**: Replace debug bodies with a continuous spring mesh (tube geometry).
4.  **Polish**: Add sound, better lighting, and fine-tune physics parameters (stiffness, damping).
