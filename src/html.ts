interface htmlElements {
	readonly canvas: HTMLCanvasElement;
	readonly slider: HTMLElement;
}

export const html : htmlElements = {
	canvas: document.getElementById('canvas')! as HTMLCanvasElement,
	slider: document.getElementById('slider')!
}

console.log("Loaded html.ts @" + (new Date()));