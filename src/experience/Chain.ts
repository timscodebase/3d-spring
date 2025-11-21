import * as CANNON from "cannon-es";
import * as THREE from "three";
import type { FlexibleObject } from "./FlexibleObject";
import type { World } from "./World";

export class Chain implements FlexibleObject {
	world: World;
	bodies: CANNON.Body[] = [];
	constraints: CANNON.DistanceConstraint[] = [];
	mesh: THREE.Group;

	// Configuration
	params = {
		segments: 15,
		length: 2.5,
		radius: 0.15, // Link size
		mass: 0.5,
		stiffness: 0,
		damping: 0,
	};

	constructor(world: World) {
		this.world = world;
		this.mesh = new THREE.Group();
		this.world.scene.add(this.mesh);

		this.initPhysics();
		this.initVisuals();
	}

	initPhysics() {
		const { segments, length, radius, mass } = this.params;
		const segmentLength = length / segments;

		for (let i = 0; i < segments; i++) {
			const body = new CANNON.Body({
				mass: i === 0 ? 0 : mass,
				shape: new CANNON.Box(new CANNON.Vec3(radius, radius / 4, radius / 2)), // Approximate link shape
				linearDamping: 0.2,
				angularDamping: 0.2,
			});

			body.position.set(0, 2, i * segmentLength);

			// Rotate every other link 90 degrees
			if (i % 2 !== 0) {
				body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI / 2);
			}

			this.world.physicsWorld.addBody(body);
			this.bodies.push(body);

			if (i > 0) {
				const previousBody = this.bodies[i - 1];
				// Distance constraint between centers
				// Ideally we'd link edges, but center-to-center with slack is easier
				const constraint = new CANNON.DistanceConstraint(
					previousBody,
					body,
					segmentLength * 0.8,
				);
				this.world.physicsWorld.addConstraint(constraint);
				this.constraints.push(constraint);
			}
		}
	}

	initVisuals() {
		const { radius } = this.params;
		const geometry = new THREE.TorusGeometry(radius, radius * 0.3, 8, 16);
		const material = new THREE.MeshStandardMaterial({
			color: "#333333",
			metalness: 0.9,
			roughness: 0.4,
		});

		this.bodies.forEach((body) => {
			const link = new THREE.Mesh(geometry, material);
			link.castShadow = true;
			// Set initial position/rotation to match body
			link.position.copy(body.position as unknown as THREE.Vector3);
			link.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
			this.mesh.add(link);
		});
	}

	updateParams() {
		this.bodies.forEach((body) => {
			// The first body is static (mass 0), so we only update mass for subsequent bodies
			if (body.mass !== 0) body.mass = this.params.mass;
			body.updateMassProperties();
		});
	}

	reset() {
		const { segments, length } = this.params;
		const segmentLength = length / segments;

		this.bodies.forEach((body, i) => {
			body.position.set(0, 2, i * segmentLength);
			body.velocity.setZero();
			body.angularVelocity.setZero();
			body.quaternion.set(0, 0, 0, 1);

			if (i % 2 !== 0) {
				body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI / 2);
			}
		});
	}

	update() {
		this.bodies.forEach((body, i) => {
			const link = this.mesh.children[i];
			link.position.set(body.position.x, body.position.y, body.position.z);
			link.quaternion.set(
				body.quaternion.x,
				body.quaternion.y,
				body.quaternion.z,
				body.quaternion.w,
			);
		});
	}
}
