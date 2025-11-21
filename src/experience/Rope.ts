import * as CANNON from "cannon-es";
import * as THREE from "three";
import type { FlexibleObject } from "./FlexibleObject";
import type { World } from "./World";

export class Rope implements FlexibleObject {
	world: World;
	bodies: CANNON.Body[] = [];
	constraints: CANNON.DistanceConstraint[] = [];
	mesh!: THREE.Mesh;
	curve!: THREE.CatmullRomCurve3;

	// Configuration
	params = {
		segments: 20,
		length: 3,
		radius: 0.05,
		mass: 0.1,
		stiffness: 0, // Not used for distance constraint, but kept for interface consistency if needed
		damping: 0,
	};

	constructor(world: World) {
		this.world = world;
		this.initPhysics();
		this.initVisuals();
	}

	initPhysics() {
		const { segments, length, radius, mass } = this.params;
		const segmentLength = length / segments;

		for (let i = 0; i < segments; i++) {
			const body = new CANNON.Body({
				mass: i === 0 ? 0 : mass,
				shape: new CANNON.Sphere(radius),
				linearDamping: 0.5,
				angularDamping: 0.5,
			});

			body.position.set(0, 2, i * segmentLength);

			this.world.physicsWorld.addBody(body);
			this.bodies.push(body);

			if (i > 0) {
				const previousBody = this.bodies[i - 1];
				const constraint = new CANNON.DistanceConstraint(
					previousBody,
					body,
					segmentLength,
				);
				this.world.physicsWorld.addConstraint(constraint);
				this.constraints.push(constraint);
			}
		}
	}

	initVisuals() {
		const points = this.bodies.map(
			(b) => new THREE.Vector3(b.position.x, b.position.y, b.position.z),
		);
		this.curve = new THREE.CatmullRomCurve3(points);

		const geometry = new THREE.TubeGeometry(
			this.curve,
			64,
			this.params.radius,
			8,
			false,
		);
		const material = new THREE.MeshStandardMaterial({
			color: "#8B4513", // Brown rope
			roughness: 0.8,
			metalness: 0.1,
		});

		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.castShadow = true;
		this.world.scene.add(this.mesh);
	}

	updateParams() {
		// Rope params are mostly structural, hard to update runtime without reset
		// But we can update mass
		this.bodies.forEach((body, i) => {
			if (i > 0) body.mass = this.params.mass;
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
		});
	}

	update() {
		this.bodies.forEach((body, i) => {
			this.curve.points[i].set(
				body.position.x,
				body.position.y,
				body.position.z,
			);
		});

		this.mesh.geometry.dispose();
		this.mesh.geometry = new THREE.TubeGeometry(
			this.curve,
			64,
			this.params.radius,
			8,
			false,
		);
	}
}
