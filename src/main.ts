import "./style.css";
import { World } from "./experience/World";

const canvas = document.querySelector("canvas.webgl");
if (canvas) {
	new World(canvas as HTMLCanvasElement);
} else {
	console.error("Canvas not found");
}
