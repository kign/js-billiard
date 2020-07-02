import {html} from './html';

export function draw_pool () {
	const ctx = html.canvas.getContext('2d');
	html.canvas.width = window.innerWidth - 20;

	if (ctx === null) {
		alert("Initialization failed");
		return;
	}
	ctx.strokeStyle = "red";
  	ctx.beginPath();
  	ctx.moveTo(10, 10);
  	ctx.lineTo(400, 40);
  	ctx.stroke();
}
