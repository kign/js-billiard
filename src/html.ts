interface htmlElements {
	readonly canvas: HTMLCanvasElement;
	readonly slider: HTMLElement;
	readonly decel: HTMLInputElement;
	readonly speed: HTMLInputElement;
}

export const html : htmlElements = {
	canvas: document.getElementById('canvas')! as HTMLCanvasElement,
	slider: document.getElementById('slider')!,
	decel: document.getElementById('decel')! as HTMLInputElement,
	speed: document.getElementById('speed')! as HTMLInputElement
}

//console.log("Loaded html.ts @" + (new Date()));