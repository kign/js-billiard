import { html } from './html';

export class Config {
    public decel: number;
    public speed: number;

    public constructor() {
        this.decel = 20;
        this.speed = 1.5;
    }

    public init () : void {
        html.decel.addEventListener("focusout", () => this.fromui());
        this.toui();
    }

    private toui () : void {
        html.decel.value = this.decel.toString();
        html.speed.value = this.speed.toString();
    }

    private fromui () : void {
        this.decel = html.decel.valueAsNumber;
        this.speed = html.speed.valueAsNumber;
    }
}