import * as Color from 'color';
import {App, Ball} from './app';
import {html} from './html';

interface Circle {
	readonly x: number;
	readonly y: number;
	readonly r: number
};

export function init (app: App):void {
	var cue_highlighted = false;
	var targeting = false;
	html.canvas.addEventListener("mousemove", event => {
		const b = app.cue();
		const x = event.offsetX, y = event.offsetY;
		const hcol = Color.rgb(100, 100, 100);
		
		if (targeting) {
			const ctx = html.canvas.getContext('2d')!;

			clear(ctx);
			draw_border(app, ctx);
			app.draw_balls();
			draw_ball(b, ctx, hcol);

			const v : Circle = { x: x, y: y, r: 0.5 * b.r };

			ctx.fillStyle = b.c.string();
			ctx.beginPath();
			ctx.arc(x, y, v.r, 0, 2 * Math.PI);
			ctx.fill();

			common_tangents(v, b, ctx);

		}
		else {
			const ch = (x - b.x) ** 2 + (y - b.y) ** 2 <= b.r ** 2;
			if (ch != cue_highlighted) {
				const ctx = html.canvas.getContext('2d')!;
				draw_ball(b, ctx, ch?hcol:undefined);
				cue_highlighted = ch;
			}
		}
	});

	html.canvas.addEventListener("mousedown", event => {
		const b = app.cue();
		const x = event.offsetX, y = event.offsetY;
		const ch = (x - b.x) ** 2 + (y - b.y) ** 2 <= b.r ** 2;
		if (cue_highlighted) {
			targeting = true;
		}
	});

	html.canvas.addEventListener("mouseup", event => {
		if (targeting) {
			const b = app.cue();
			const x = event.offsetX, y = event.offsetY;
			targeting = false;

			const ctx = html.canvas.getContext('2d')!;
			clear(ctx);
			draw_border(app, ctx);
			app.draw_balls();
			app.run(b.x - x, b.y - y);
		}
	});

	html.canvas.addEventListener("mouseleave", event => {
		if (targeting) {
			targeting = false;

			const ctx = html.canvas.getContext('2d')!;
			clear(ctx);
			draw_border(app, ctx);
			app.draw_balls();
		}
	});

}

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

export function draw_ball(b: Ball, ctx: CanvasRenderingContext2D, c?: Color) :void {
	ctx.fillStyle = (c || b.c).string();
	ctx.beginPath();
	ctx.arc(b.x, b.y, b.r, 0, 2 * Math.PI);
	ctx.fill();
}

function clear(ctx: CanvasRenderingContext2D):void {
	ctx.clearRect(0, 0, html.canvas.width, html.canvas.height);
} 

function common_tangents(a: Circle, b: Circle, ctx: CanvasRenderingContext2D) :void {
	const x = Math.atan2(b.y - a.y, b.x - a.x);
	const d = Math.sqrt((b.x - a.x)**2 + (b.y - a.y)**2);
	if (Math.abs(b.r - a.r) > d)
		return;
	const y1 = Math.asin((b.r - a.r)/d);
	const y2 = Math.PI - y1;
	const p1 = x + y1 + Math.PI/2;
	const p2 = x + y2 + Math.PI / 2;

	ctx.beginPath();
	ctx.strokeStyle = "black";
	ctx.setLineDash([]);
	ctx.moveTo(a.x + a.r * Math.cos(p1), a.y + a.r * Math.sin(p1));
	ctx.lineTo(b.x + b.r * Math.cos(p1), b.y + b.r * Math.sin(p1));
	ctx.moveTo(a.x + a.r * Math.cos(p2), a.y + a.r * Math.sin(p2));
	ctx.lineTo(b.x + b.r * Math.cos(p2), b.y + b.r * Math.sin(p2));
	ctx.stroke();

}