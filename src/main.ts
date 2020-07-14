import * as Color from 'color';
import {App, Geom, Ball, Iwasm} from './app';
import * as init from './init';
import { html } from './html';
import * as canvas from './canvas';

class Application implements App {
    public g?: Geom;
    public wasm?: Iwasm;
    private balls?: Ball[];
    private ctx?: CanvasRenderingContext2D;
    private bg: Color = Color.rgb(255,255,255);

    public constructor() {
        this.load_wasm ();
    }

    public load_wasm() :void {
        let wasm_log_buf: Array<string> = [];
        const importObject = {
            env: {
                js_log_char: (arg: number) => {
                    if (arg == 0) {
                        console.log("zig:", wasm_log_buf.join(''));
                        wasm_log_buf = [];
                    }
                    else
                        wasm_log_buf.push(String.fromCharCode(arg));
                },
                ball_status: (idx: number, active: number, x: number, y: number, vx: number, vy: number) => {
                    //console.log("ball_status", idx, active, x, y, vx, vy);
                    const b = this.balls![idx];
                    canvas.draw_ball(b, this.ctx!, this.bg);
                    b.x = x;
                    b.y = y;
                    b.vx = vx;
                    b.vy = vy;
                    b.active = active != 0;
                    if (b.active)
                        canvas.draw_ball(b, this.ctx!);
                }
            },
            // some black magic
            wasi_unstable: {
                proc_exit: arg => console.log("proc_exit", arg),
                fd_write: arg => console.log("fd_write", arg)
            }
        };

        const wasm_src = 'animation.wasm';
        WebAssembly.instantiateStreaming(fetch(wasm_src), importObject)
            .then(m => {
                this.wasm = m.instance.exports as unknown as Iwasm;
                console.log("Loaded", wasm_src);
            });
    }

    public update_geometry(g: Geom) {
        this.g = g;
        this.balls = position_balls(g.W, g.H);
        this.ctx = html.canvas.getContext('2d')!;
    }

    public draw_balls(): void {
        const ctx = html.canvas.getContext('2d')!;

        for (let ii = 0; ii < this.balls!.length; ii ++)
            canvas.draw_ball(this.balls![ii], ctx);   
    }

    public cue() {
        return this.balls![0];
    }

    public run(vx: number, vy: number): void {
        this.cue().vx = vx;
        this.cue().vy = vy;

        for (let ii = this.balls!.length - 1; ii >= 0; ii --)
            if (!this.balls![ii].active)
                this.balls!.splice(ii,1);
    
        const wasm = this.wasm!;
        const g = this.g!;
        wasm.reset ();
        for (let b of this.balls!)
            wasm.add_ball(b.x, b.y, b.vx, b.vy, b.r, b.m);
        wasm.set_boundary_box(g.offset, g.W - g.offset, g.offset, g.H - g.offset);

        wasm.add_line(g.offset, g.round + g.offset, g.offset, g.H - g.round - g.offset);
        wasm.add_line(g.W - g.offset, g.H - g.offset - g.round, g.W - g.offset, g.offset + g.round);

        if (g.middle) {
            wasm.add_line(g.offset + g.round, g.H - g.offset, g.W / 2 - g.round, g.H - g.offset);
            wasm.add_line(g.W / 2 + g.round, g.H - g.offset, g.W - g.offset - g.round, g.H - g.offset);
            wasm.add_line(g.W - g.offset - g.round, g.offset, g.W / 2 + g.round, g.offset);
            wasm.add_line(g.W / 2 - g.round, g.offset, g.offset + g.round, g.offset);
        }
        else {
            wasm.add_line(g.offset + g.round, g.H - g.offset, g.W - g.offset - g.round, g.H - g.offset);
            wasm.add_line(g.W - g.offset - g.round, g.offset, g.offset + g.round, g.offset);
        }
        console.log("Initiating run(" + vx + "," + vy + ")");
        wasm.run (0.1);
    }
}

function position_balls(W: number, H: number): Ball[] {
    // https://fr.wikipedia.org/wiki/Billard
    // https://en.wikipedia.org/wiki/Pool_(cue_sports)

    const b = {r: 20, m: 1, vx: 0, vy: 0, active: true};
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
    const c3 = Color.rgb(0,0,250);

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
canvas.init(app);

