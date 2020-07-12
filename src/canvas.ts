import {App, Ball} from './app';

export function draw_border(app: App, ctx: CanvasRenderingContext2D) {
	const g = app.g!;

	ctx.strokeStyle = "#101080";
	ctx.setLineDash([]);
	ctx.beginPath();
	ctx.moveTo(g.offset, g.round + g.offset);
	ctx.lineTo(g.offset, g.H - g.round - g.offset);
	ctx.moveTo(g.offset + g.round, g.H - g.offset);
	if (g.middle) {
		ctx.lineTo(g.W / 2 - g.round, g.H - g.offset);
		ctx.moveTo(g.W / 2 + g.round, g.H - g.offset);
	}
	ctx.lineTo(g.W - g.offset - g.round, g.H - g.offset);
	ctx.moveTo(g.W - g.offset, g.H - g.offset - g.round);
	ctx.lineTo(g.W - g.offset, g.offset + g.round);
	ctx.moveTo(g.W - g.offset - g.round, g.offset);
	if (g.middle) {
		ctx.lineTo(g.W / 2 + g.round, g.offset);
		ctx.moveTo(g.W / 2 - g.round, g.offset);
	}
	ctx.lineTo(g.offset + g.round, g.offset);
	ctx.stroke();

	ctx.setLineDash([2, 3]);
	ctx.beginPath();
	ctx.moveTo(g.offset, g.H - g.round - g.offset);
	ctx.arcTo(g.offset + g.round, g.H - g.offset - g.round,
		g.offset + g.round, g.H - g.offset, g.round);
	if (g.middle) {
		ctx.moveTo(g.W / 2 - g.round, g.H - g.offset);
		ctx.arc(g.W / 2, g.H - g.offset, g.round, Math.PI, 2 * Math.PI);
	}
	ctx.moveTo(g.W - g.offset - g.round, g.H - g.offset);
	ctx.arcTo(g.W - g.offset - g.round, g.H - g.offset - g.round,
		g.W - g.offset, g.H - g.offset - g.round, g.round);
	ctx.moveTo(g.W - g.offset, g.offset + g.round);
	ctx.arcTo(g.W - g.offset - g.round, g.offset + g.round,
		g.W - g.offset - g.round, g.offset, g.round);
	if (g.middle) {
		ctx.moveTo(g.W / 2 + g.round, g.offset);
		ctx.arc(g.W / 2, g.offset, g.round, 0, Math.PI);
	}
	ctx.moveTo(g.offset + g.round, g.offset);
	ctx.arcTo(g.offset + g.round, g.offset + g.round,
		g.offset, g.offset + g.round, g.round);
	ctx.stroke();
}

export function draw_ball(ctx: CanvasRenderingContext2D, b: Ball) :void {
	ctx.fillStyle = b.c.string();
	ctx.beginPath();
	ctx.arc(b.x, b.y, b.r, 0, 2 * Math.PI);
	ctx.fill();
}