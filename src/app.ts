import * as Color from 'color';

export interface Geom {
    readonly W: number;
    readonly H: number;
    readonly round: number;
    readonly offset: number;
    readonly middle: boolean;
}

export interface Ball {
    x: number;
    y: number;
    vx: number;
    vy: number;
    active: boolean;

    readonly n: number;
    readonly r: number;
    readonly m: number;
    readonly c: Color;
}

export interface Iwasm {
    run(interval: number): void;
    add_ball(x: number, y: number, vx: number, vy: number, r: number, m: number) : void;
    add_line(x1: number, y1: number, x2: number, y2: number): void;
    set_boundary_box(x0: number, x1: number, y0: number, y1: number): void;
    set_decel(decel: number): void;
    reset(): void;
}

export interface App {
    readonly g?: Geom;
    readonly wasm?: Iwasm;

    paint_balls(): void;
    cue(): Ball;
    run(vx: number, vy:number) :void;
    reset(height_delta: number): void;

}
