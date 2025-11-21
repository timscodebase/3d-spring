import type * as CANNON from "cannon-es";
import type * as THREE from "three";

export interface FlexibleObject {
	mesh: THREE.Mesh | THREE.Group;
	bodies: CANNON.Body[];
	params: Record<string, unknown>;

	update(): void;
	reset(): void;
	updateParams(): void;
}
