export interface Geom {
    readonly W: number;
    readonly H: number;
    readonly round: number;
    readonly offset: number;
    readonly middle: boolean;
}

interface App {
    g?: Geom;
}

export const app: App = {};