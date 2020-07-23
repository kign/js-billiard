interface htmlElements {
	readonly canvas: HTMLCanvasElement;
	readonly slider: HTMLElement;
	readonly decel: HTMLInputElement;
	readonly speed: HTMLInputElement;
	readonly dbg?: HTMLTableElement;
}

export const html : htmlElements = {
	canvas: document.getElementById('canvas')! as HTMLCanvasElement,
	slider: document.getElementById('slider')!,
	decel: document.getElementById('decel')! as HTMLInputElement,
	speed: document.getElementById('speed')! as HTMLInputElement,
	dbg: document.getElementById('dbg') as HTMLTableElement
}

//console.log("Loaded html.ts @" + (new Date()));

export function dbglog(msg: string) :void {
	if (html.dbg != undefined) {
		const tr = html.dbg.insertRow(0);
		const td = tr.insertCell(0);

		td.innerHTML = msg;
	}
}