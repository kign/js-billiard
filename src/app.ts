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

export interface App {
    readonly g?: Geom;
    update_geometry(g: Geom):void;
    draw_balls(): void;
}
