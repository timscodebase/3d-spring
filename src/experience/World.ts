import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as CANNON from 'cannon-es';
import { Spring } from './Spring';
import { Floor } from './Floor';
import { InteractionManager } from './InteractionManager';

import GUI from 'lil-gui';

export class World {
    canvas: HTMLCanvasElement;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    physicsWorld: CANNON.World;

    spring: Spring;
    floor: Floor;
    interactionManager: InteractionManager;
    debug: GUI;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        // Debug
        this.debug = new GUI();

        // Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#f0f0f0');

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(4, 4, 4);
        this.camera.lookAt(0, 0.5, 0);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Environment
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

        // Physics
        this.physicsWorld = new CANNON.World();
        this.physicsWorld.gravity.set(0, -9.82, 0);

        // Objects
        this.floor = new Floor(this);
        this.spring = new Spring(this);
        this.interactionManager = new InteractionManager(this);

        // Debug Controls
        const springFolder = this.debug.addFolder('Spring');
        springFolder.add(this.spring.params, 'stiffness', 10, 500).onChange(() => this.spring.updateParams());
        springFolder.add(this.spring.params, 'damping', 0, 10).onChange(() => this.spring.updateParams());
        springFolder.add(this.spring.params, 'mass', 0.01, 1).onChange(() => this.spring.updateParams());

        const resetObj = { reset: () => this.spring.reset() };
        springFolder.add(resetObj, 'reset');

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Resize
        window.addEventListener('resize', () => this.onResize());

        // Loop
        this.tick();
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    tick() {
        const deltaTime = 1 / 60;
        this.physicsWorld.step(deltaTime);

        this.spring.update();

        this.renderer.render(this.scene, this.camera);
        window.requestAnimationFrame(() => this.tick());
    }
}
