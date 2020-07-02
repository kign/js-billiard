import {html} from './html';

export function init () {
	const ctx = html.canvas.getContext('2d')!;
	html.canvas.width = window.innerWidth - 20;

	const W = html.canvas.getBoundingClientRect().width;
	const H = html.canvas.height;

	const o = {
		round: 50,
		offset: 10,
		middle: true
	};

	ctx.strokeStyle = "blue";

	ctx.beginPath();  
  	ctx.moveTo(o.offset, o.round + o.offset);
	ctx.lineTo(o.offset, H - o.round - o.offset);
	ctx.arcTo(o.offset + o.round, H - o.offset - o.round, 
		o.offset + o.round, H - o.offset, o.round);
	ctx.lineTo(W - o.offset - o.round, H - o.offset);
	ctx.arcTo(W - o.offset - o.round, H - o.offset - o.round,
		W - o.offset, H - o.offset - o.round, o.round);
	ctx.lineTo(W - o.offset, o.offset + o.round);
	ctx.arcTo(W - o.offset - o.round, o.offset + o.round,
		W - o.offset - o.round, o.offset, o.round);
	ctx.lineTo(o.offset + o.round, o.offset);
	ctx.arcTo(o.offset + o.round, o.offset + o.round, 
		o.offset, o.offset + o.round, o.round);

  	ctx.stroke();
}