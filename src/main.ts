import * as Color from 'color';
import {App, Geom, Ball} from './app';
import * as init from './init';
import { html } from './html';
import * as canvas from './canvas';

class Application implements App {
    public g?: Geom;
    private balls?: Ball[];

    public constructor() {
    }

    public update_geometry(g: Geom) {
        this.g = g;
    }

    public draw_balls(): void {
        this.balls = position_balls(this.g!.W, this.g!.H);
        const ctx = html.canvas.getContext('2d')!;

        for (let ii = 0; ii < this.balls!.length; ii ++)
            canvas.draw_ball(ctx, this.balls![ii]);   
    }
}

function position_balls(W: number, H: number): Ball[] {
    // https://fr.wikipedia.org/wiki/Billard
    // https://en.wikipedia.org/wiki/Pool_(cue_sports)

    const b = {r: 20, m: 1};
    const gap = 4;
    const side = 8 * b.r + 4 * gap;

    const x1 = 2/3*W;
    const y1 = 1/2*H;
    const c1 = Color.rgb(200,0,0);
    const x2 = x1 + Math.sqrt(3)/2*side;
    const y2 = y1 - 1/2*side;
    const c2 = Color.rgb(0,200,0);
    const x3 = x2;
    const y3 = y1 + 1/2*side;
    const c3 = Color.rgb(0,0,200);

    const m2 = (v1:number, c1:Color, v2:number, c2:Color) => Color.rgb(
        v1 * c1.red()   + v2 * c2.red(),
        v1 * c1.green() + v2 * c2.green(),
        v1 * c1.blue()  + v2 * c2.blue()
    );

    const m3 = (v1: number, c1: Color, v2: number, c2: Color, v3: number, c3: Color) => Color.rgb(
        v1 * c1.red()   + v2 * c2.red()   + v3 * c3.red(),
        v1 * c1.green() + v2 * c2.green() + v3 * c3.green(),
        v1 * c1.blue()  + v2 * c2.blue()  + v3 * c3.blue()
    );

    return [{...b, x: 1/4*W, y: 1/2*H, c: Color.rgb(200,200,200)},
        
            {...b, x: x1, y: y1, c: c1},
            {...b, x: x2, y: y2, c: c2},
            {...b, x: x3, y: y3, c: c3},

            {...b, x: 3/4*x1+1/4*x2, y: 3/4*y1+1/4*y2, c: m2(3/4,c1,1/4,c2)},
            {...b, x: 1/2*x1+1/2*x2, y: 1/2*y1+1/2*y2, c: m2(1/2,c1,1/4,c2)},
            {...b, x: 1/4*x1+3/4*x2, y: 1/4*y1+3/4*y2, c: m2(1/4,c1,4/4,c2)},
            {...b, x: 3/4*x2+1/4*x3, y: 3/4*y2+1/4*y3, c: m2(3/4,c2,1/4,c3)},
            {...b, x: 1/2*x2+1/2*x3, y: 1/2*y2+1/2*y3, c: m2(1/2,c2,1/4,c3)},
            {...b, x: 1/4*x2+3/4*x3, y: 1/4*y2+3/4*y3, c: m2(1/4,c2,4/4,c3)},
            {...b, x: 3/4*x3+1/4*x1, y: 3/4*y3+1/4*y1, c: m2(3/4,c3,1/4,c1)},
            {...b, x: 1/2*x3+1/2*x1, y: 1/2*y3+1/2*y1, c: m2(1/2,c3,1/4,c1)},
            {...b, x: 1/4*x3+3/4*x1, y: 1/4*y3+3/4*y1, c: m2(1/4,c3,4/4,c1)},

            {...b, x: 1/2*x1+1/4*x2+1/4*x3, y: 1/2*y1+1/4*y2+1/4*y3, c: m3(1/2,c1,1/4,c2,1/4,c3)},
            {...b, x: 1/2*x2+1/4*x3+1/4*x1, y: 1/2*y2+1/4*y3+1/4*y1, c: m3(1/2,c2,1/4,c3,1/4,c1)},
            {...b, x: 1/2*x3+1/4*x1+1/4*x2, y: 1/2*y3+1/4*y1+1/4*y2, c: m3(1/2,c3,1/4,c1,1/4,c2)}];
}

const app = new Application();

init.init (app);

