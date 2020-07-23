import * as Color from 'color';
import {App, Geom, Ball, Iwasm} from './app';
import * as init from './init';
import {html} from './html';
import * as canvas from './canvas';
import { Config } from './config';

class Application implements App {
    public g?: Geom;
    public wasm?: Iwasm;
    private balls?: Ball[];
    private ctx?: CanvasRenderingContext2D;
    private bg: Color = Color.rgb(255,255,255);
    private interval = 0.1;
    private config: Config;
    private generation: number = 0;

    public constructor() {
        this.load_wasm ();
        this.config = new Config();
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
                    if (Math.abs(b.x - x) + Math.abs(b.y - y) > 1.0e-4) {
                        canvas.draw_ball(b, this.ctx!, this.bg);
                        b.x = x;
                        b.y = y;
                        b.vx = vx;
                        b.vy = vy;
                        if (b.active && active == 0)
                            console.log(`Ball ${b.n} removed`);
                        b.active = active != 0;
                        if (b.active)
                            canvas.draw_ball(b, this.ctx!);
                    }
                }
            },
            // some black magic
            wasi_unstable: {
                proc_exit: arg => console.log("proc_exit", arg),
                fd_write: arg => console.log("fd_write", arg)
            }
        };

        // Safari doesn't support instantiateStreaming
        const wasm_src = 'animation.wasm';
        fetch(wasm_src).then(response => {
            if (response.status != 200)
                throw `File ${wasm_src} returned status ${response.status}`;
            return response.arrayBuffer()
        }
        ).then(bytes =>
            WebAssembly.instantiate(bytes, importObject)
        ).then(m => {
            this.wasm = m.instance.exports as unknown as Iwasm;
            console.log("Loaded", wasm_src);        
        }).catch(error => 
            window.setTimeout(() => 
            canvas.message(`Webassembly failed to load\n${error}\nClick anywhere to reload`, 350, 80, () =>
            window.location.reload()), 250));
    }

    public init_all() : void {
        this.config.init ();
    }

    public reset(height_delta: number) : void {
        if (this.generation > 0) {
            if (!confirm("You sure you want to restart?"))
                return;
        }

        html.canvas.height += height_delta;
        this.update_geometry ();
    }

    private update_geometry(): void {
        html.canvas.width = window.innerWidth - 20;

        this.g = make_geom ();
        this.balls = position_balls(this.g.W, this.g.H);
        this.ctx = html.canvas.getContext('2d')!;
        canvas.draw_border(app);
        app.paint_balls();
        this.generation = 0;
    }

    public paint_balls(): void {
        const ctx = html.canvas.getContext('2d')!;

        for (let ii = 0; ii < this.balls!.length; ii ++)
            if (this.balls![ii].active)
                canvas.draw_ball(this.balls![ii], ctx);   
    }

    public cue() {
        return this.balls![0];
    }

    private move(gen: number) :void {
        if (gen != this.generation) {
            console.log("Outdated generation", gen, "vs current", this.generation);
            return;
        }
        const t0 = Date.now() / 1000;
        this.wasm!.run(this.interval);
        let n_mov = 0;
        let n_act = 0;
        for (let b of this.balls!) {
            if (b.active) {
                n_act ++;
                if (b.vx != 0 || b.vy != 0)
                    n_mov ++;
            }
        }

        //n_mov = 0;
        if (!this.cue().active && n_act > 0) {
            //console.log("cue deactivated");
            canvas.message("You lost!\nClick anywhere to restart...", 250, 60, () => {
                app.update_geometry();
            });
        }
        else if (n_act <= 1) {
            canvas.message("You WON!!!\nClick anywhere to restart...", 250, 60, () => {
                app.update_geometry();
            });
        }
        else if (n_mov == 0) {
            console.log("Movement stopped");
        }
        else {
            //console.log("Movement continues (" + n_mov + " balls still moving)");
            const dt = Date.now() / 1000 - t0;
            //console.log("Time spent in wasm:", dt);
            if (dt < this.interval) 
                window.setTimeout(() => this.move(gen), 1000*(this.interval - dt));
            else
                this.move (gen);
        }
    }

    public run(vx: number, vy: number): void {
        this.cue().vx = this.config.speed * vx;
        this.cue().vy = this.config.speed * vy;

        for (let ii = this.balls!.length - 1; ii >= 0; ii --)
            if (!this.balls![ii].active)
                this.balls!.splice(ii,1);
    
        const wasm = this.wasm!;
        const g = this.g!;
        wasm.reset ();
        wasm.set_decel(this.config.decel);

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
        //console.log("Initiating run(" + vx + "," + vy + ")");

        this.generation ++;
        this.move(this.generation);
    }
}

function position_balls(W: number, H: number): Ball[] {
    // https://fr.wikipedia.org/wiki/Billard
    // https://en.wikipedia.org/wiki/Pool_(cue_sports)

    const b = {r: 20, m: 1, vx: 0, vy: 0, active: true};
    const gap = 10;
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

    return [{...b, n: 0, x: 1/4*W, y: 1/2*H, c: Color.rgb(200,200,200)},
        
            {...b, n: 1, x: x1, y: y1, c: c1},
            {...b, n: 2, x: x2, y: y2, c: c2},
            {...b, n: 3, x: x3, y: y3, c: c3},

            {...b, n: 4, x: 3/4*x1+1/4*x2, y: 3/4*y1+1/4*y2, c: m2(3/4,c1,1/4,c2)},
            {...b, n: 5, x: 1/2*x1+1/2*x2, y: 1/2*y1+1/2*y2, c: m2(1/2,c1,1/4,c2)},
            {...b, n: 6, x: 1/4*x1+3/4*x2, y: 1/4*y1+3/4*y2, c: m2(1/4,c1,4/4,c2)},
            {...b, n: 7, x: 3/4*x2+1/4*x3, y: 3/4*y2+1/4*y3, c: m2(3/4,c2,1/4,c3)},
            {...b, n: 8, x: 1/2*x2+1/2*x3, y: 1/2*y2+1/2*y3, c: m2(1/2,c2,1/4,c3)},
            {...b, n: 9, x: 1/4*x2+3/4*x3, y: 1/4*y2+3/4*y3, c: m2(1/4,c2,4/4,c3)},
            {...b, n: 10, x: 3/4*x3+1/4*x1, y: 3/4*y3+1/4*y1, c: m2(3/4,c3,1/4,c1)},
            {...b, n: 11, x: 1/2*x3+1/2*x1, y: 1/2*y3+1/2*y1, c: m2(1/2,c3,1/4,c1)},
            {...b, n: 12, x: 1/4*x3+3/4*x1, y: 1/4*y3+3/4*y1, c: m2(1/4,c3,4/4,c1)},

            {...b, n: 13, x: 1/2*x1+1/4*x2+1/4*x3, y: 1/2*y1+1/4*y2+1/4*y3, c: m3(1/2,c1,1/4,c2,1/4,c3)},
            {...b, n: 14, x: 1/2*x2+1/4*x3+1/4*x1, y: 1/2*y2+1/4*y3+1/4*y1, c: m3(1/2,c2,1/4,c3,1/4,c1)},
            {...b, n: 15, x: 1/2*x3+1/4*x1+1/4*x2, y: 1/2*y3+1/4*y1+1/4*y2, c: m3(1/2,c3,1/4,c1,1/4,c2)}];
}

function make_geom() {
    const w = html.canvas.getBoundingClientRect().width;
    const h = html.canvas.height;
    return {
        W: w,
        H: h,
        round: 50,
        offset: 10,
        middle: h < 0.75 * w
    };
}

const app = new Application();

app.init_all ();
app.reset(0);

init.setup_canvas_resize (app);
init.setup_win_resize (app);
canvas.init(app);
