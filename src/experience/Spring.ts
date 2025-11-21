import * as CANNON from "cannon-es";
import * as THREE from "three";
import type { FlexibleObject } from "./FlexibleObject";
import type { World } from "./World";

export class Spring implements FlexibleObject {
	world: World;
	bodies: CANNON.Body[] = [];
	springs: CANNON.Spring[] = [];
	mesh!: THREE.Mesh;
	curve!: THREE.CatmullRomCurve3;

	// Configuration
	params = {
		segments: 12,
		length: 2,
		radius: 0.1,
		stiffness: 150,
		damping: 2,
		mass: 0.2,
	};

	constructor(world: World) {
		this.world = world;
		this.initPhysics();
		this.initVisuals();

		// Apply spring forces every step
		this.world.physicsWorld.addEventListener("postStep", () => {
			this.springs.forEach((spring) => {
				spring.applyForce();
			});
		});
	}

	initPhysics() {
		const { segments, length, radius, mass, stiffness, damping } = this.params;
		const segmentLength = length / segments;

		// Create a chain of bodies
		for (let i = 0; i < segments; i++) {
			const body = new CANNON.Body({
				mass: i === 0 ? 0 : mass, // Base is static
				shape: new CANNON.Sphere(radius),
				linearDamping: 0.4, // Higher damping to stop it going crazy
				angularDamping: 0.4,
			});

			// Position them sticking out from the wall/floor
			// Let's say the base is at (0, 0.5, 0) and it extends in Z
			body.position.set(0, 0.5, i * segmentLength);

			this.world.physicsWorld.addBody(body);
			this.bodies.push(body);

			if (i > 0) {
				const previousBody = this.bodies[i - 1];

				// Spring force
				const spring = new CANNON.Spring(previousBody, body, {
					localAnchorA: new CANNON.Vec3(0, 0, segmentLength / 2),
					localAnchorB: new CANNON.Vec3(0, 0, -segmentLength / 2),
					restLength: segmentLength,
					stiffness: stiffness,
					damping: damping,
				});
				this.springs.push(spring);

				// We also need a constraint to keep them from falling apart entirely or bending too weirdly?
				// A simple spring might be too loose.
				// Let's add a DistanceConstraint to enforce maximum distance?
				// Or just rely on the spring.
				// A doorstop spring is a continuous coil. It has shear stiffness.
				// Simple springs between points don't resist bending (angular).
				// To simulate bending stiffness, we can add springs between i and i-2?
				// Let's try that: "Angular springs" via linear springs skipping a node.

				if (i > 1) {
					const skipBody = this.bodies[i - 2];
					const skipSpring = new CANNON.Spring(skipBody, body, {
						localAnchorA: new CANNON.Vec3(0, 0, segmentLength),
						localAnchorB: new CANNON.Vec3(0, 0, -segmentLength),
						restLength: segmentLength * 2,
						stiffness: stiffness * 0.5, // Weaker for bending
						damping: damping,
					});
					this.springs.push(skipSpring);
				}
			}
		}
	}

	initVisuals() {
		// Create a curve based on body positions
		const points = this.bodies.map(
			(b) => new THREE.Vector3(b.position.x, b.position.y, b.position.z),
		);
		this.curve = new THREE.CatmullRomCurve3(points);
		this.curve.curveType = "catmullrom";
		this.curve.tension = 0.5;

		// Tube geometry
		const geometry = new THREE.TubeGeometry(
			this.curve,
			64,
			this.params.radius,
			8,
			false,
		);
		const material = new THREE.MeshStandardMaterial({
			color: "#ffffff",
			metalness: 1.0,
			roughness: 0.1,
		});

		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.castShadow = true;
		this.world.scene.add(this.mesh);
	}

	updateParams() {
		// Update physics bodies and constraints
		this.bodies.forEach((body, i) => {
			if (i > 0) body.mass = this.params.mass;
			body.updateMassProperties();
		});

		this.springs.forEach((spring) => {
			spring.stiffness = this.params.stiffness;
			spring.damping = this.params.damping;
		});
	}

	reset() {
		const { segments, length } = this.params;
		const segmentLength = length / segments;

		this.bodies.forEach((body, i) => {
			body.position.set(0, 0.5, i * segmentLength);
			body.velocity.setZero();
			body.angularVelocity.setZero();
			body.quaternion.set(0, 0, 0, 1);
		});
	}

	update() {
		// Update curve points from physics bodies
		this.bodies.forEach((body, i) => {
			this.curve.points[i].set(
				body.position.x,
				body.position.y,
				body.position.z,
			);
		});

		// Update geometry
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
