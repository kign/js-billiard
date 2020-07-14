import * as Color from 'color';

export interface Geom {
    readonly W: number;
    readonly H: number;
    readonly round: number;
    readonly offset: number;
    readonly middle: boolean;
}

export interface Ball {
    readonly x: number;
    readonly y: number;
    readonly r: number;
    readonly m: number;
    readonly c: Color;
}

export interface Iwasm {
    add_integers(a: number, b: number): number;
}

export interface App {
    readonly g?: Geom;
    readonly wasm?: Iwasm;
    
    update_geometry(g: Geom):void;
    draw_balls(): void;
    cue(): Ball;
    run(vx: number, vy:number) :void;
}