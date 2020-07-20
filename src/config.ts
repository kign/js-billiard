import { html } from './html';

export class Config {
    public decel: number;
    public speed: number;

    public constructor() {
        this.decel = 15;
        this.speed = 1;
    }

    public init () : void {
        html.decel.addEventListener("focusout", () => this.fromui());
        this.toui();
    }

    private toui () : void {
        html.decel.value = this.decel.toString();
        html.speed.value = this.speed.toString();

        console.log("html.decel.value =", html.decel.value);
    }

    private fromui () : void {
        this.decel = html.decel.valueAsNumber;
        this.speed = html.speed.valueAsNumber;
    }
}