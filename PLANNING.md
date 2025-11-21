# PLANNING.md

## Goal
Expand the 3D Spring Emulator to support a variety of flexible objects (Spring, Rope, Chain) with distinct physics behaviors.

## Proposed Architecture

### Tech Stack
- **Language**: TypeScript
- **Bundler**: Vite
- **3D Engine**: Three.js
- **Physics**: Cannon-es

### Components
1.  **World**: Manages the scene, camera, lighting, and loop.
2.  **FlexibleObject (Interface/Base Class)**:
    - `initPhysics()`
    - `initVisuals()`
    - `update()`
    - `reset()`
    - `updateParams()`
3.  **Concrete Implementations**:
    - `Spring`: The existing doorstop spring.
    - `Rope`: A loose chain of bodies with distance constraints.
    - `Chain`: Similar to rope but with heavier links and visual links.
4.  **ObjectSelector**: UI to switch between active objects.
5.  **InteractionManager**: Handles raycasting and mouse/touch events (needs to support switching targets).

## Roadmap
1.  **Refactor**: Extract `Spring` logic into a base class or interface `FlexibleObject`.
2.  **Implement Rope**: Create a `Rope` class with lower stiffness and different visual generation.
3.  **Implement Chain**: Create a `Chain` class with link meshes.
4.  **UI Update**: Add a dropdown to the control panel to switch objects.
5.  **Polish**: Tune physics for each object type.
