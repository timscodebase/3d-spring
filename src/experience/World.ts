import * as CANNON from "cannon-es";
import GUI from "lil-gui";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Chain } from "./Chain";
import type { FlexibleObject } from "./FlexibleObject";
import { Floor } from "./Floor";
import { InteractionManager } from "./InteractionManager";
import { Rope } from "./Rope";
import { Spring } from "./Spring";

export class World {
	canvas: HTMLCanvasElement;
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	renderer: THREE.WebGLRenderer;
	physicsWorld: CANNON.World;

	currentObject: FlexibleObject;
	floor: Floor;
	interactionManager: InteractionManager;
	debug: GUI;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;

		// Debug
		this.debug = new GUI();

		// Setup
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color("#f0f0f0");

		this.camera = new THREE.PerspectiveCamera(
			45,
			window.innerWidth / window.innerHeight,
			0.1,
			100,
		);
		this.camera.position.set(4, 4, 4);
		this.camera.lookAt(0, 0.5, 0);

		this.renderer = new THREE.WebGLRenderer({
			canvas: this.canvas,
			antialias: true,
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.shadowMap.enabled = true;
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 1.2;

		// Environment
		const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
		this.scene.environment = pmremGenerator.fromScene(
			new RoomEnvironment(),
			0.04,
		).texture;

		// Physics
		this.physicsWorld = new CANNON.World();
		this.physicsWorld.gravity.set(0, -9.82, 0);

		// Objects
		this.floor = new Floor(this);
		this.currentObject = new Spring(this);
		this.interactionManager = new InteractionManager(this);

		// Debug Controls
		const objectFolder = this.debug.addFolder("Object");
		const objParams = { type: "Spring" };
		objectFolder
			.add(objParams, "type", ["Spring", "Rope", "Chain"])
			.onChange((value: string) => {
				this.switchObject(value);
			});

		this.updateDebugParams();

		// Lights
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
		this.scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
		directionalLight.position.set(5, 5, 5);
		directionalLight.castShadow = true;
		this.scene.add(directionalLight);

		// Resize
		window.addEventListener("resize", () => this.onResize());

		// Loop
		this.tick();
	}

	switchObject(type: string) {
		// Cleanup
		this.currentObject.bodies.forEach((body) => {
			this.physicsWorld.removeBody(body);
		});
		// Remove constraints?
		// Cannon doesn't track constraints on bodies easily, we need to track them in the object.
		// But FlexibleObject interface doesn't enforce constraints array.
		// Let's just clear all constraints for now or assume the object handles it?
		// Better: Add a destroy/cleanup method to FlexibleObject interface?
		// For now, let's just clear all constraints in the world since we only have one object.
		this.physicsWorld.constraints = [];

		this.scene.remove(this.currentObject.mesh);

		// Create new
		switch (type) {
			case "Spring":
				this.currentObject = new Spring(this);
				break;
			case "Rope":
				this.currentObject = new Rope(this);
				break;
			case "Chain":
				this.currentObject = new Chain(this);
				break;
		}

		this.updateDebugParams();
	}

	updateDebugParams() {
		// Clear existing params folder
		// lil-gui doesn't have a clearFolder method easily exposed in types?
		// We can destroy the folder and recreate it.
		// Let's store the folder reference.

		// Actually, let's just recreate the whole GUI or keep a reference to the folder.
		// For simplicity, let's find the folder by name or store it.

		let paramsFolder = this.debug.folders.find(
			(f) => f._title === "Parameters",
		);
		if (paramsFolder) paramsFolder.destroy();

		paramsFolder = this.debug.addFolder("Parameters");

		const params = this.currentObject.params;
		if (params.stiffness !== undefined)
			paramsFolder
				.add(params, "stiffness", 0, 500)
				.onChange(() => this.currentObject.updateParams());
		if (params.damping !== undefined)
			paramsFolder
				.add(params, "damping", 0, 10)
				.onChange(() => this.currentObject.updateParams());
		if (params.mass !== undefined)
			paramsFolder
				.add(params, "mass", 0.01, 5)
				.onChange(() => this.currentObject.updateParams());

		const resetObj = { reset: () => this.currentObject.reset() };
		paramsFolder.add(resetObj, "reset");
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

		this.currentObject.update();

		this.renderer.render(this.scene, this.camera);
		window.requestAnimationFrame(() => this.tick());
	}
}
