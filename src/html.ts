interface htmlElements {
	readonly canvas: HTMLCanvasElement
}

export const html : htmlElements = {
	canvas: <HTMLCanvasElement> document.getElementById('canvas')
}
