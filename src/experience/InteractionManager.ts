import * as CANNON from "cannon-es";
import * as THREE from "three";
import type { World } from "./World";

export class InteractionManager {
	world: World;
	raycaster: THREE.Raycaster;
	mouse: THREE.Vector2;

	// Dragging state
	isDragging: boolean = false;
	dragBody: CANNON.Body | null = null;
	dragConstraint: CANNON.PointToPointConstraint | null = null;

	// Plane to drag on (perpendicular to camera or parallel to floor?)
	// Usually dragging on a plane parallel to camera view at the depth of the object is best.
	dragPlane: THREE.Plane = new THREE.Plane();
	dragPoint: THREE.Vector3 = new THREE.Vector3();

	constructor(world: World) {
		this.world = world;
		this.raycaster = new THREE.Raycaster();
		this.mouse = new THREE.Vector2();

		window.addEventListener("mousemove", this.onMouseMove.bind(this));
		window.addEventListener("mousedown", this.onMouseDown.bind(this));
		window.addEventListener("mouseup", this.onMouseUp.bind(this));

		// Touch support
		window.addEventListener("touchmove", this.onTouchMove.bind(this), {
			passive: false,
		});
		window.addEventListener("touchstart", this.onTouchStart.bind(this), {
			passive: false,
		});
		window.addEventListener("touchend", this.onMouseUp.bind(this));
	}

	updateMouse(event: MouseEvent | Touch) {
		this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	}

	onMouseDown(event: MouseEvent) {
		this.updateMouse(event);
		this.startDrag();
	}

	onTouchStart(event: TouchEvent) {
		if (event.touches.length > 0) {
			this.updateMouse(event.touches[0]);
			this.startDrag();
		}
	}

	startDrag() {
		this.raycaster.setFromCamera(this.mouse, this.world.camera);

		// Raycast against the spring mesh
		// Note: The visual mesh is a single tube. We need to find which physics body corresponds to the hit point.
		// Or we can raycast against invisible spheres attached to the bodies?
		// For now, let's just raycast against the mesh and find the closest body.

		const intersects = this.raycaster.intersectObject(
			this.world.currentObject.mesh,
			true,
		); // recursive for groups

		if (intersects.length > 0) {
			this.isDragging = true;
			const hitPoint = intersects[0].point;

			// Find closest body
			let minDist = Infinity;
			let closestBody = null;

			for (const body of this.world.currentObject.bodies) {
				const dist = body.position.distanceTo(
					new CANNON.Vec3(hitPoint.x, hitPoint.y, hitPoint.z),
				);
				if (dist < minDist) {
					minDist = dist;
					closestBody = body;
				}
			}

			if (closestBody && closestBody.mass > 0) {
				// Don't drag the static base
				this.dragBody = closestBody;

				// Create constraint to mouse position
				// We use a null body for the mouse (world anchor)
				this.dragConstraint = new CANNON.PointToPointConstraint(
					this.dragBody,
					new CANNON.Vec3(0, 0, 0), // Local pivot on body
					new CANNON.Body({ mass: 0 }), // Dummy body for mouse
					new CANNON.Vec3(hitPoint.x, hitPoint.y, hitPoint.z), // World pivot
				);
				this.world.physicsWorld.addConstraint(this.dragConstraint);

				// Set drag plane to face camera, passing through hit point
				this.dragPlane.setFromNormalAndCoplanarPoint(
					this.world.camera.getWorldDirection(new THREE.Vector3()),
					hitPoint,
				);
			}
		}
	}

	onMouseMove(event: MouseEvent) {
		this.updateMouse(event);
		this.updateDrag();
	}

	onTouchMove(event: TouchEvent) {
		if (event.touches.length > 0) {
			event.preventDefault(); // Prevent scrolling
			this.updateMouse(event.touches[0]);
			this.updateDrag();
		}
	}

	updateDrag() {
		if (this.isDragging && this.dragConstraint) {
			this.raycaster.setFromCamera(this.mouse, this.world.camera);

			// Intersect ray with drag plane
			if (this.raycaster.ray.intersectPlane(this.dragPlane, this.dragPoint)) {
				// Update constraint pivot B (the mouse position)
				// PointToPointConstraint doesn't have a simple "setPivotB" method in all versions,
				// but we can modify the pivot on the second body (the dummy static body).
				// Actually, the constraint has pivotA and pivotB.
				// pivotB is local to bodyB. Since bodyB is at (0,0,0) (static), pivotB IS the world position.

				this.dragConstraint.pivotB.set(
					this.dragPoint.x,
					this.dragPoint.y,
					this.dragPoint.z,
				);
			}
		}
	}

	onMouseUp() {
		if (this.isDragging) {
			this.isDragging = false;
			if (this.dragConstraint) {
				this.world.physicsWorld.removeConstraint(this.dragConstraint);
				this.dragConstraint = null;
				this.dragBody = null;
			}
		}
	}
}
