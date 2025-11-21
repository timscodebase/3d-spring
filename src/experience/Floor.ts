import * as CANNON from "cannon-es";
import * as THREE from "three";
import type { World } from "./World";

export class Floor {
	world: World;
	mesh: THREE.Mesh;
	body: CANNON.Body;

	constructor(world: World) {
		this.world = world;

		// Three.js
		const geometry = new THREE.PlaneGeometry(10, 10);
		const material = new THREE.MeshStandardMaterial({ color: "#dcdcdc" });
		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.rotation.x = -Math.PI * 0.5;
		this.mesh.receiveShadow = true;
		this.world.scene.add(this.mesh);

		// Cannon.js
		const shape = new CANNON.Plane();
		this.body = new CANNON.Body({
			mass: 0, // Static
			shape: shape,
		});
		this.body.quaternion.setFromEuler(-Math.PI * 0.5, 0, 0);
		this.world.physicsWorld.addBody(this.body);
	}
}
