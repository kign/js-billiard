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

    const b = {r: 20, m: 1, c: 'green'};
    const gap = 4;
    const side = 8 * b.r + 4 * gap;

    const x1 = 2/3*W;
    const y1 = 1/2*H;
    const x2 = x1 + Math.sqrt(3)/2*side;
    const y2 = y1 - 1/2*side;
    const x3 = x2;
    const y3 = y1 + 1/2*side;

    return [{...b, x: x1, y: y1},
        	{...b, x: x2, y: y2},
        	{...b, x: x3, y: y3},

            {...b, x: 3/4*x1+1/4*x2, y: 3/4*y1+1/4*y2},
            {...b, x: 1/2*x1+1/2*x2, y: 1/2*y1+1/2*y2},
            {...b, x: 1/4*x1+3/4*x2, y: 1/4*y1+3/4*y2},
            {...b, x: 3/4*x2+1/4*x3, y: 3/4*y2+1/4*y3},
            {...b, x: 1/2*x2+1/2*x3, y: 1/2*y2+1/2*y3},
            {...b, x: 1/4*x2+3/4*x3, y: 1/4*y2+3/4*y3},
            {...b, x: 3/4*x3+1/4*x1, y: 3/4*y3+1/4*y1},
            {...b, x: 1/2*x3+1/2*x1, y: 1/2*y3+1/2*y1},
            {...b, x: 1/4*x3+3/4*x1, y: 1/4*y3+3/4*y1},

            {...b, x: 1/2*x1+1/4*x2+1/4*x3, y: 1/2*y1+1/4*y2+1/4*y3},
            {...b, x: 1/2*x2+1/4*x3+1/4*x1, y: 1/2*y2+1/4*y3+1/4*y1},
            {...b, x: 1/2*x3+1/4*x1+1/4*x2, y: 1/2*y3+1/4*y1+1/4*y2}];
}

const app = new Application();

init.init (app);

